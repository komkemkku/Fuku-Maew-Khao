import { Client, Message } from '@line/bot-sdk';
import { DatabaseService } from './database';
import { Category, Transaction } from '../types';
import { CatApiService } from './cat-api';
import { FortuneService } from './fortune-service';
import { SubscriptionService } from './subscription';
import { SecretCommandsService } from './secret-commands';
import RichMenuService from './rich-menu';

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
};

// Debug: ตรวจสอบการตั้งค่า
console.log('LINE Config initialized:', {
  hasAccessToken: !!lineConfig.channelAccessToken,
  hasSecret: !!lineConfig.channelSecret,
  accessTokenLength: lineConfig.channelAccessToken?.length || 0,
  secretLength: lineConfig.channelSecret?.length || 0
});

const client = new Client(lineConfig);

export class LineService {
  /**
   * สร้าง Dashboard URL พร้อม user authentication
   */
  static getDashboardUrl(userId: string): string {
    return `${process.env.APP_URL}/dashboard?user=${userId}&token=auto`;
  }

  static async handleMessage(userMessage: string, userId: string, displayName?: string) {
    let user;
    
    try {
      // สร้างหรืออัปเดตผู้ใช้ในฐานข้อมูล
      user = await DatabaseService.createUser(userId, displayName);
      
      // ตรวจสอบสถานะ subscription
      user = await DatabaseService.checkSubscriptionStatus(user.id);
      
      // ตั้งค่า Rich Menu เริ่มต้นสำหรับผู้ใช้ใหม่
      await this.setupDefaultRichMenu(userId);
    } catch (dbError) {
      console.error('Database connection failed, using fallback mode:', dbError);
      // ใช้ fallback user สำหรับกรณีฐานข้อมูลเชื่อมต่อไม่ได้
      user = { 
        id: userId, 
        line_user_id: userId, 
        display_name: displayName || 'ผู้ใช้ไม่ระบุชื่อ', 
        subscription_plan: 'free',
        subscription_start_date: null,
        subscription_end_date: null,
        created_at: new Date().toISOString()
      };
    }
    
    // ประมวลผลข้อความ
    const response = await this.processUserMessage(userMessage, user.id, user.subscription_plan as 'free' | 'premium');
    
    return response;
  }

  static async processUserMessage(message: string, userId: string, subscriptionPlan: 'free' | 'premium' = 'free'): Promise<Message[]> {
    const text = message.trim().toLowerCase();

    // ตรวจสอบคำสั่งลับก่อน
    if (SecretCommandsService.isSecretCommand(text)) {
      return await SecretCommandsService.processSecretCommand(text, userId) || [];
    }

    // ปรับปรุงการตรวจจับคำสั่ง - เพิ่มการแก้ไขคำผิด
    const normalizedText = this.normalizeCommand(text);
    const wasCorreected = normalizedText !== text;

    // แจ้งผู้ใช้เมื่อแก้ไขคำผิด
    let correctionMessage: Message[] = [];
    if (wasCorreected) {
      correctionMessage = [{
        type: 'text',
        text: `🔧 ฟูกุแก้ไขให้แล้ว: "${text}" → "${normalizedText}" ✨`
      }];
    }

    // ฟีเจอร์ใหม่ Phase 1: แมวฟรี (รูปแมวสุ่ม)
    if (['แมวฟรี', 'รูปแมว', 'แมว', 'cat', 'แมวฟี', 'แมงฟรี', 'รูปแมง'].includes(normalizedText)) {
      const result = await this.getCatImageMessage();
      return [...correctionMessage, ...result];
    }

    // ฟีเจอร์ใหม่ Phase 1: แมวเลีย (เซียมซีแมว)
    if (['แมวเลีย', 'เซียมซี', 'ทำนาย', 'fortune', 'คำทำนาย', 'แมงเลีย', 'เซียมซิ', 'ทำนาข'].includes(normalizedText)) {
      const result = this.getFortuneMessage();
      return [...correctionMessage, ...result];
    }

    // ฟีเจอร์พิเศษ: คำทำนายการเงิน
    if (['ทำนายเงิน', 'โชคการเงิน', 'ดวงการเงิน', 'ทำนายเงน', 'โชคเงิน', 'ดวงเงิน'].includes(normalizedText)) {
      const result = this.getFinancialFortuneMessage();
      return [...correctionMessage, ...result];
    }

    // คำสั่งดูสรุป - เพิ่มปุ่ม
    if (['สรุป', 'summary', 'สรุง', 'สุรป', 'สู่รุป'].includes(normalizedText)) {
      const result = await this.getSummaryMessageWithButtons(userId);
      return [...correctionMessage, ...result];
    }

    // คำสั่งดูหมวดหมู่
    if (['หมวดหมู่', 'categories', 'หมวดหมุ', 'หมวดมู', 'หมวดมุ'].includes(normalizedText)) {
      const result = await this.getCategoriesMessageWithButtons(userId);
      return [...correctionMessage, ...result];
    }

    // คำสั่งดูงบประมาณ
    if (['งบประมาณ', 'budget', 'งบประมาน', 'งบประมา', 'งบปะมาณ'].includes(normalizedText)) {
      const result = await this.getBudgetMessageWithButtons(userId);
      return [...correctionMessage, ...result];
    }

    // ข้อความแนะนำใช้ Dashboard
    if (text.includes('dashboard') || text.includes('แดชบอร์ด') || text.includes('เว็บ') || text === 'เว็บไซต์') {
      const dashboardUrl = this.getDashboardUrl(userId);
      return [{
        type: 'text',
        text: `🌟 ยินดีต้อนรับสู่ Dashboard ฟูกุเนโกะ!\n\n📊 คุณสามารถเข้าใช้งานได้ทันทีโดยไม่ต้องเข้าสู่ระบบ:\n${dashboardUrl}\n\n✨ คุณสมบัติพิเศษ:\n• ดูสรุปรายรับ-รายจ่ายแบบ Real-time\n• จัดการหมวดหมู่ได้อย่างง่าย\n• ตั้งงบประมาณและติดตามได้\n• ใช้งานได้ทุกอุปกรณ์\n\n💡 เคล็ดลับ: เปิดในเบราว์เซอร์เพื่อประสบการณ์ที่ดีที่สุด!\n\n📱 หรือใช้ Rich Menu ด้านล่างเพื่อเข้าถึงฟีเจอร์ต่างๆ ได้ง่ายขึ้น!`
      }];
    }

    // คำสั่งความช่วยเหลือ
    if (text === 'help' || text === 'ช่วยเหลือ' || text === 'วิธีใช้') {
      return this.getHelpMessage(subscriptionPlan);
    }

    // คำสั่งดู subscription
    if (text === 'subscription' || text === 'สมัครสมาชิก' || text === 'แพคเกจ' || text === 'premium') {
      return this.getSubscriptionMessage(subscriptionPlan);
    }

    // คำสั่งดาวน์เกรด (สำหรับ demo)
    if (text === '#downgrade-free' || text === '#demo-free') {
      try {
        await DatabaseService.downgradeToFree(userId);
        
        // อัปเดต Rich Menu เป็น Free version
        await this.updateUserRichMenu(userId, 'free');
        
        return [{
          type: 'text',
          text: `🔄 คุณได้ดาวน์เกรดเป็น Free Plan แล้ว\n\n` +
            `🆓 ฟีเจอร์ที่ใช้ได้:\n` +
            `• บันทึกรายการ 100 รายการ/เดือน\n` +
            `• หมวดหมู่ 15 หมวด\n` +
            `• ฟีเจอร์พื้นฐาน\n\n` +
            `📱 Rich Menu ได้อัปเดตเป็นเวอร์ชัน Free แล้ว!\n\n` +
            `💎 อยากกลับมาเป็น Premium?\n` +
            `พิมพ์ "premium" เพื่อดูแพคเกจ!`
        }];
      } catch (error) {
        console.error('Error downgrading to free:', error);
        return [{
          type: 'text',
          text: '❌ เกิดข้อผิดพลาดในการดาวน์เกรด กรุณาลองใหม่ในภายหลัง'
        }];
      }
    }

    // คำสั่งดูสถานะ subscription
    if (text === 'สถานะ' || text === 'status' || text === 'subscription-status') {
      try {
        const userInfo = await DatabaseService.checkSubscriptionStatus(userId);
        const monthlyTransactions = await this.getMonthlyTransactionCount(userId);
        const categories = await DatabaseService.getUserCategories(userId);
        
        let statusText = `📊 สถานะบัญชีของคุณ\n\n`;
        statusText += `👤 แพลน: ${userInfo.subscription_plan === 'premium' ? '👑 Premium' : '🆓 Free'}\n`;
        
        if (userInfo.subscription_plan === 'premium' && userInfo.subscription_end_date) {
          const endDate = new Date(userInfo.subscription_end_date);
          statusText += `⏰ หมดอายุ: ${endDate.toLocaleDateString('th-TH')}\n`;
        }
        
        statusText += `\n📈 การใช้งานเดือนนี้:\n`;
        statusText += `• รายการ: ${monthlyTransactions}`;
        
        if (userInfo.subscription_plan === 'free') {
          const features = SubscriptionService.getFreeFeatures();
          statusText += ` / ${features.transactionLimit}`;
        } else {
          statusText += ` (ไม่จำกัด)`;
        }
        
        statusText += `\n• หมวดหมู่: ${categories.length}`;
        
        if (userInfo.subscription_plan === 'free') {
          const features = SubscriptionService.getFreeFeatures();
          statusText += ` / ${features.categoryLimit}`;
        } else {
          statusText += ` (ไม่จำกัด)`;
        }
        
        return [{ type: 'text', text: statusText }];
      } catch (error) {
        console.error('Error getting subscription status:', error);
        return [{
          type: 'text',
          text: '❌ ไม่สามารถดึงข้อมูลสถานะได้ กรุณาลองใหม่ในภายหลัง'
        }];
      }
    }

    // ลองแปลงเป็นรายการรับ-จ่าย
    const transaction = this.parseTransactionMessage(message);
    if (transaction) {
      try {
        // ตรวจสอบ subscription limits ก่อนบันทึก
        const categories = await DatabaseService.getUserCategories(userId);
        const monthlyTransactions = await this.getMonthlyTransactionCount(userId);
        
        const limitCheck = await SubscriptionService.checkLimits(subscriptionPlan, {
          categories: categories.length,
          monthlyTransactions: monthlyTransactions
        });
        
        if (limitCheck.transactionsExceeded) {
          return [{
            type: 'text',
            text: limitCheck.message || 'คุณใช้ครบโควต้ารายการแล้ว!'
          }];
        }

        // ค้นหาหมวดหมู่ที่เหมาะสม
        const category = this.findBestCategory(transaction.description || '', categories);

        // บันทึกรายการ
        await DatabaseService.createTransaction(
          userId,
          transaction.amount,
          transaction.description,
          category?.id
        );

        let successMessage = `✅ บันทึกสำเร็จ!\n💰 จำนวน: ${transaction.amount.toLocaleString()} บาท\n📝 รายละเอียด: ${transaction.description}\n📂 หมวดหมู่: ${category?.name || 'ไม่ระบุ'}`;
        
        // แสดง premium features hint สำหรับ free users
        if (subscriptionPlan === 'free') {
          const remaining = SubscriptionService.getFreeFeatures().transactionLimit - (monthlyTransactions + 1);
          if (remaining > 0 && remaining <= 10) {
            successMessage += `\n\n💡 เหลือโควต้าอีก ${remaining} รายการในเดือนนี้`;
          }
        }

        return [{
          type: 'text',
          text: successMessage
        }];
      } catch (error) {
        console.error('Error saving transaction:', error);
        return [{
          type: 'text',
          text: '❌ เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง\n\n🐱 ฟูกุขออภัยด้วยนะ!'
        }];
      }
    }

    // ข้อความทักทาย และคุยเล่น
    const casualResponse = this.getCasualResponse(text);
    if (casualResponse) {
      return casualResponse;
    }

    // ข้อความที่ไม่เข้าใจ (Fallback)
    function getFallbackMessage() {
      const planEmoji = subscriptionPlan === 'premium' ? '👑' : '🆓';
      const baseMessages = [
        "ฟูกุยังงงๆ อยู่เลย เจ้าทาสหมายถึงอะไรเหรอเหมียว?",
        "เจ้าทาสลองถามใหม่อีกทีสิ ฟูกุจะพยายามตอบให้ได้!",
        "ฟูกุยังเรียนรู้ไม่ครบ เดี๋ยวจะไปฝึกเพิ่มนะ!",
        "เหมียว~ ฟูกุไม่แน่ใจว่าหมายถึงอะไร แต่ฟูกุพร้อมฟังเสมอ!",
        "ถ้าเจ้าทาสอยากคุยเรื่องเงินหรือเรื่องแมว ฟูกุถนัดมากเลยนะ!"
      ];
      
      const helpMessage = `🤔 ฟูกุไม่เข้าใจข้อความนี้เลย\n\n💡 ลองพิมพ์:\n• 'แมวฟรี' - ดูรูปแมวสุ่ม 🐱\n• 'แมวเลีย' - ขอคำทำนาย 🔮\n• '50 ค่ากาแฟ' - บันทึกรายจ่าย 💰\n• 'สรุป' - ดูสรุปรายเดือน 📊\n• 'ช่วยเหลือ' - ดูคำสั่งทั้งหมด 📝\n• 'premium' - ดูแพคเกจ ${planEmoji}\n\nหรือเจ้าทาสลองคุยเล่นกับฟูกุก็ได้นะ! 😸`;
      
      const randomMessages = [...baseMessages, helpMessage];
      return randomMessages[Math.floor(Math.random() * randomMessages.length)];
    }

    // ข้อความที่ไม่เข้าใจ
    return [{
      type: 'text',
      text: getFallbackMessage()
    }];
  }

  static parseTransactionMessage(message: string): { amount: number; description: string } | null {
    // รองรับรูปแบบต่างๆ เช่น:
    // "50 ค่ากาแฟ", "ค่ากาแฟ 50", "50", "100 บาท อาหารเย็น", "ค่าข้าว150"
    
    const patterns = [
      /^(\d+(?:\.\d+)?)\s*บาท?\s*(.*)$/i,      // "50 บาท ค่ากาแฟ"
      /^(.+?)\s+(\d+(?:\.\d+)?)\s*บาท?$/i,     // "ค่ากาแฟ 50 บาท"
      /^(\d+(?:\.\d+)?)\s+(.+)$/,              // "50 ค่ากาแฟ"
      /^(.+?)(\d+(?:\.\d+)?)\s*บาท?$/,         // "ค่าข้าว150" (ไม่มีช่องว่าง)
      /^(.+?)\s+(\d+(?:\.\d+)?)$/,             // "ค่ากาแฟ 50"
      /^(\d+(?:\.\d+)?)\s*$/                   // "50"
    ];

    for (const pattern of patterns) {
      const match = message.trim().match(pattern);
      if (match) {
        if (pattern.source.startsWith('^(\\d+')) {
          // รูปแบบที่เริ่มต้นด้วยตัวเลข
          const amount = parseFloat(match[1]);
          const description = match[2]?.trim() || 'รายการไม่ระบุ';
          return { amount, description };
        } else {
          // รูปแบบที่เริ่มต้นด้วยข้อความ
          const description = match[1].trim();
          const amount = parseFloat(match[2]);
          return { amount, description };
        }
      }
    }

    return null;
  }

  // Helper function สำหรับแก้ไขคำผิด
  static normalizeCommand(text: string): string {
    const corrections = {
      'แมงฟรี': 'แมวฟรี',
      'แมงเลีย': 'แมวเลีย',
      'รูปแมง': 'รูปแมว',
      'เซียมซิ': 'เซียมซี',
      'ทำนาข': 'ทำนาย',
      'สรุง': 'สรุป',
      'สุรป': 'สรุป',
      'สู่รุป': 'สรุป',
      'หมวดหมุ': 'หมวดหมู่',
      'หมวดมู': 'หมวดหมู่',
      'หมวดมุ': 'หมวดหมู่',
      'งบประมาน': 'งบประมาณ',
      'งบประมา': 'งบประมาณ',
      'งบปะมาณ': 'งบประมาณ',
      'ทำนายเงน': 'ทำนายเงิน',
      'โชคเงิน': 'โชคการเงิน',
      'ดวงเงิน': 'ดวงการเงิน'
    };
    
    return corrections[text as keyof typeof corrections] || text;
  }

  static findBestCategory(description: string, categories: Category[]) {
    const desc = description.toLowerCase();
    
    // คำที่เชื่อมโยงกับหมวดหมู่ต่างๆ - เพิ่มคำใหม่
    const categoryKeywords = {
      'อาหาร': [
        'อาหาร', 'กาแฟ', 'ข้าว', 'ของกิน', 'เครื่องดื่ม', 'ร้านอาหาร', 'ฟู้ด', 'กิน',
        'ก๋วยเตี๋ยว', 'ผัดไทย', 'ส้มตำ', 'แกง', 'ต้มยำ', 'ข้าวผัด', 'ข้าวแกง',
        'อาหารเช้า', 'อาหารเที่ยง', 'อาหารเย็น', 'ขนม', 'เค้ก', 'ไอติม',
        'ข้าวกล่อง', 'ไก่ทอด', 'หมูกระทะ', 'ปลาเผา', 'ลาบ', 'ไส้กรอก',
        'มาม่า', 'คาเฟ่', 'ร้าน', 'รสชาติ', 'อร่อย', 'หิว', 'กะ'
      ],
      'เครื่องดื่ม': [
        'กาแฟ', 'ชา', 'น้ำ', 'เครื่องดื่ม', 'สตาร์บัค', 'คาเฟ่', 'นม', 'โซดา',
        'น้ำส้ม', 'น้ำแข็ง', 'เบียร์', 'ไวน์', 'น้ำผลไม้', 'ชาเขียว', 'ชาไทย',
        'เอสเปรสโซ่', 'ลาเต้', 'คาปูชิโน่', 'มอคค่า', 'เฟรปเป้', 'สมูทตี้'
      ],
      'เดินทาง': [
        'รถ', 'แท็กซี่', 'เบนซิน', 'น้ำมัน', 'รถเมล์', 'รถไฟ', 'เครื่องบิน', 'grab', 'เดินทาง',
        'บีทีเอส', 'เอ็มอาร์ที', 'รถตู้', 'มอเตอร์ไซค์', 'จักรยาน', 'เรือ', 'สายการบิน',
        'ค่าน้ำมัน', 'ค่ารถ', 'โบลท์', 'ไลน์แมน', 'ฟู้ดแพนด้า', 'ขับรถ', 'ปาร์ค'
      ],
      'ค่าใช้จ่ายบ้าน': [
        'ไฟ', 'น้ำ', 'เน็ต', 'ค่าบ้าน', 'ค่าไฟ', 'ค่าน้ำ', 'ค่าเช่า', 'บิล',
        'อินเทอร์เน็ต', 'ไวไฟ', 'เคเบิ้ล', 'ทีวี', 'โทรศัพท์', 'ค่าส่วนกลาง',
        'ค่าจอดรถ', 'ประปา', 'กฟน', 'เอไอเอส', 'ทรู', 'ดีแทค'
      ],
      'ช้อปปิ้ง': [
        'ซื้อ', 'เสื้อผ้า', 'รองเท้า', 'เครื่องสำอาง', 'ช้อป', 'แฟชั่น',
        'ห้างสรรพสินค้า', 'เซ็นทรัล', 'ไบเทค', 'ยูเนี่ยน', 'เทอร์มินอล',
        'ออนไลน์', 'ช้อปปี้', 'ลาซาด้า', 'เครื่องใช้', 'ของใช้'
      ],
      'ความบันเทิง': [
        'หนัง', 'เกม', 'คอนเสิร์ต', 'ท่องเที่ยว', 'บันเทิง', 'โรงหนัง',
        'เพลง', 'ศิลปิน', 'นักร้อง', 'งานแสดง', 'เทศกาล', 'ปาร์ตี้',
        'คาราโอเกะ', 'โบว์ลิ่ง', 'บิลเลียด', 'สนุกเกอร์'
      ],
      'สุขภาพ': [
        'หมอ', 'ยา', 'โรงพยาบาล', 'คลินิก', 'สุขภาพ', 'รักษา',
        'ตรวจสุขภาพ', 'เข็มฉีดยา', 'วิตามิน', 'อาหารเสริม',
        'ฟิตเนส', 'ยิม', 'โยคะ', 'นวด', 'สปา'
      ],
      'การศึกษา': [
        'หนังสือ', 'เรียน', 'คอร์ส', 'เทรนนิ่ง', 'อบรม', 'ค่าเล่าเรียน',
        'โรงเรียน', 'มหาวิทยาลัย', 'เซมินาร์', 'วิทยาลัย', 'เทคนิค'
      ],
      'เสื้อผ้า': [
        'เสื้อ', 'กางเกง', 'รองเท้า', 'กระเป๋า', 'แฟชั่น', 'เครื่องแต่งกาย',
        'ชุดชั้นใน', 'ถุงเท้า', 'หมวก', 'แว่นตา', 'นาฬิกา', 'เครื่องประดับ'
      ],
      'ประกันภัย': [
        'ประกัน', 'เบี้ยประกัน', 'ประกันชีวิต', 'ประกันรถ', 'ประกันสุขภาพ'
      ]
    };

    // 1. ตรวจสอบคำในรายละเอียดกับ keywords
    for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (desc.includes(keyword)) {
          // หาหมวดหมู่ที่ตรงกับชื่อ
          const category = categories.find(cat => 
            cat.name.toLowerCase().includes(categoryName.toLowerCase()) ||
            categoryName.toLowerCase().includes(cat.name.toLowerCase())
          );
          if (category) {
            return category;
          }
        }
      }
    }

    // 2. Match กับชื่อหมวดหมู่ที่ผู้ใช้สร้างเอง
    for (const category of categories) {
      if (category.type === 'expense' && desc.includes(category.name.toLowerCase())) {
        return category;
      }
    }

    // 3. ถ้าไม่เจอให้หาหมวด "อื่นๆ" หรือหมวดรายจ่ายตัวแรก
    return categories.find(cat => 
      cat.name.includes('อื่น') || 
      cat.name.includes('other') ||
      cat.type === 'expense'
    );
  }

  static async getSummaryMessage(userId: string): Promise<Message[]> {
    try {
      const now = new Date();
      const summary = await DatabaseService.getMonthlySummary(userId, now.getFullYear(), now.getMonth() + 1);

      const text = `📊 สรุปประจำเดือน ${now.getMonth() + 1}/${now.getFullYear()}\n\n` +
        `💰 รายรับ: ${summary.total_income.toLocaleString()} บาท\n` +
        `💸 รายจ่าย: ${summary.total_expense.toLocaleString()} บาท\n` +
        `💵 คงเหลือ: ${summary.net_amount.toLocaleString()} บาท\n\n` +
        `📱 ดูภาพรวมรายละเอียดเพิ่มเติม:\n` +
        `${process.env.APP_URL}/dashboard`;

      return [{ type: 'text', text }];
    } catch (error) {
      console.error('Error getting summary:', error);
      return [{
        type: 'text',
        text: '❌ ขณะนี้ไม่สามารถดึงข้อมูลสรุปได้ กรุณาลองใหม่ในภายหลัง\n\n🐱 ฟูกุขออภัยด้วยนะ!'
      }];
    }
  }

  // ดูสรุปพร้อมปุ่ม
  static async getSummaryMessageWithButtons(userId: string): Promise<Message[]> {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      // สร้างวันที่เริ่มต้นและสิ้นสุดของเดือน
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);
      
      const monthlyTransactions = await DatabaseService.getUserTransactions(userId, startDate, endDate, 1000);
      
      // คำนวณรายรับ (จำนวนเงินเป็นบวก)
      const totalIncome = monthlyTransactions
        .filter((t: Transaction) => t.amount > 0)
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      
      // คำนวณรายจ่าย (จำนวนเงินเป็นลบ แต่แสดงผลเป็นบวก)
      const totalExpense = Math.abs(monthlyTransactions
        .filter((t: Transaction) => t.amount < 0)
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0));
      
      const balance = totalIncome - totalExpense;
      
      const message = `📊 สรุปรายรับ-รายจ่าย เดือน ${currentMonth}/${currentYear}\n\n` +
        `💰 รายรับ: +${totalIncome.toLocaleString()} บาท\n` +
        `💸 รายจ่าย: -${totalExpense.toLocaleString()} บาท\n` +
        `${balance >= 0 ? '💚' : '💔'} คงเหลือ: ${balance >= 0 ? '+' : ''}${balance.toLocaleString()} บาท\n\n` +
        `📈 รายการทั้งหมด: ${monthlyTransactions.length} รายการ`;

      return [
        {
          type: 'text',
          text: message
        },
        {
          type: 'template',
          altText: 'เมนูการจัดการ',
          template: {
            type: 'buttons',
            text: '🎯 เลือกดูข้อมูลเพิ่มเติม',
            actions: [
              {
                type: 'postback',
                label: '🏠 หน้าแรก',
                data: 'action=home'
              },
              {
                type: 'postback',
                label: '📊 ภาพรวม',
                data: 'action=dashboard'
              },
              {
                type: 'postback',
                label: '💎 Premium',
                data: 'action=subscription'
              }
            ]
          }
        }
      ];
    } catch (error) {
      console.error('Error getting summary:', error);
      return [{
        type: 'text',
        text: '❌ เกิดข้อผิดพลาดในการดึงข้อมูลสรุป\n\n🐱 ฟูกุขออภัยด้วยนะครับ!'
      }];
    }
  }

  // ดูหมวดหมู่พร้อมปุ่ม
  static async getCategoriesMessageWithButtons(userId: string): Promise<Message[]> {
    try {
      const categories = await DatabaseService.getUserCategories(userId);
      
      if (categories.length === 0) {
        return [
          {
            type: 'text',
            text: '📂 ยังไม่มีหมวดหมู่\n\nลองบันทึกรายการแรกเพื่อสร้างหมวดหมู่อัตโนมัติ\nเช่น: "50 ค่ากาแฟ"'
          },
          {
            type: 'template',
            altText: 'เมนูการจัดการ',
            template: {
              type: 'buttons',
              text: '🎯 จัดการข้อมูลของคุณ',
              actions: [
                {
                  type: 'postback',
                  label: '🏠 หน้าแรก',
                  data: 'action=home'
                },
                {
                  type: 'postback',
                  label: '📊 ภาพรวม',
                  data: 'action=dashboard'
                },
                {
                  type: 'postback',
                  label: '💎 Premium',
                  data: 'action=subscription'
                }
              ]
            }
          }
        ];
      }

      let message = '📂 หมวดหมู่ของคุณ:\n\n';
      categories.forEach((category, index) => {
        message += `${index + 1}. 📁 ${category.name}\n`;
      });

      return [
        {
          type: 'text',
          text: message
        },
        {
          type: 'template',
          altText: 'เมนูการจัดการ',
          template: {
            type: 'buttons',
            text: '🎯 จัดการข้อมูลของคุณ',              actions: [
                {
                  type: 'postback',
                  label: '🏠 หน้าแรก',
                  data: 'action=home'
                },
                {
                  type: 'postback',
                  label: '📊 ภาพรวม',
                  data: 'action=dashboard'
                },
                {
                  type: 'postback',
                  label: '📊 งบประมาณ',
                  data: 'action=budget'
                }
              ]
          }
        }
      ];
    } catch (error) {
      console.error('Error getting categories:', error);
      return [{
        type: 'text',
        text: '❌ เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่\n\n🐱 ฟูกุขออภัยด้วยนะครับ!'
      }];
    }
  }

  // ดูงบประมาณพร้อมปุ่ม
  static async getBudgetMessageWithButtons(userId: string): Promise<Message[]> {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const categories = await DatabaseService.getUserCategories(userId);
      
      if (categories.length === 0) {
        return [
          {
            type: 'text',
            text: '💰 ยังไม่มีข้อมูลงบประมาณ\n\nเริ่มต้นด้วยการบันทึกรายการแรก\nเช่น: "50 ค่ากาแฟ"'
          },
          {
            type: 'template',
            altText: 'เมนูการจัดการ',
            template: {
              type: 'buttons',
              text: '🎯 จัดการข้อมูลของคุณ',
              actions: [
                {
                  type: 'postback',
                  label: '🏠 หน้าแรก',
                  data: 'action=home'
                },
                {
                  type: 'postback',
                  label: '📊 ภาพรวม',
                  data: 'action=dashboard'
                },
                {
                  type: 'postback',
                  label: '� หมวดหมู่',
                  data: 'action=categories'
                }
              ]
            }
          }
        ];
      }

      let message = `💰 งบประมาณ เดือน ${currentMonth}/${currentYear}\n\n`;
      
      // สร้างวันที่เริ่มต้นและสิ้นสุดของเดือน
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);
      
      // ดึงรายการทั้งหมดของเดือนนี้
      const allTransactions = await DatabaseService.getUserTransactions(userId, startDate, endDate, 1000);
      
      for (const category of categories) {
        // กรองรายการตามหมวดหมู่
        const categoryTransactions = allTransactions.filter((t: Transaction) => 
          t.category_id === category.id && t.amount < 0
        );
        const totalSpent = categoryTransactions
          .reduce((sum: number, t: Transaction) => sum + Math.abs(t.amount), 0);
        
        message += `📁 ${category.name}: ${totalSpent.toLocaleString()} บาท\n`;
      }

      return [
        {
          type: 'text',
          text: message
        },
        {
          type: 'template',
          altText: 'เมนูการจัดการ',
          template: {
            type: 'buttons',
            text: '🎯 จัดการข้อมูลของคุณ',
            actions: [
              {
                type: 'postback',
                label: '🏠 หน้าแรก',
                data: 'action=home'
              },
              {
                type: 'postback',
                label: '� Dashboard',
                data: 'action=dashboard'
              },
              {
                type: 'postback',
                label: '� หมวดหมู่',
                data: 'action=categories'
              }
            ]
          }
        }
      ];
    } catch (error) {
      console.error('Error getting budget:', error);
      return [{
        type: 'text',
        text: '❌ เกิดข้อผิดพลาดในการดึงข้อมูลงบประมาณ\n\n🐱 ฟูกุขออภัยด้วยนะครับ!'
      }];
    }
  }

  static getHelpMessage(subscriptionPlan: 'free' | 'premium' = 'free'): Message[] {
    const features = SubscriptionService.getFeatures(subscriptionPlan);
    const planEmoji = subscriptionPlan === 'premium' ? '👑' : '🆓';
    const planName = subscriptionPlan === 'premium' ? 'Premium' : 'Free';
    
    let helpText = `🤖 Fuku Neko ${planEmoji} ${planName}\n\n` +
      `🎪 ฟีเจอร์สนุกๆ:\n` +
      `• "แมวฟรี" - รับรูปแมวสุ่มน่ารักๆ 🐱\n` +
      `• "แมวเลีย" - ขอคำทำนายวันนี้ 🔮\n` +
      `• "ทำนายเงิน" - ดูดวงการเงินเฉพาะ 💰\n\n` +
      `📝 บันทึกรายการ:\n` +
      `• "50 ค่ากาแฟ" - บันทึกรายจ่าย\n` +
      `• "ค่าอาหาร 120" - บันทึกแบบกลับหน้า\n` +
      `• "500 เงินเดือน" - บันทึกรายรับ\n` +
      `• "ค่าข้าว150" - พิมพ์ติดกันได้\n\n` +
      `📊 ดูข้อมูลการเงิน (มีปุ่มให้กด!):\n` +
      `• "สรุป" - ดูสรุปรายรับ-จ่ายเดือนนี้\n` +
      `• "หมวดหมู่" - ดูหมวดหมู่ที่มี\n` +
      `• "งบประมาณ" - เช็คสถานะงบแต่ละหมวด\n\n` +
      `🔧 ระบบแก้ไขคำผิดอัตโนมัติ:\n` +
      `• พิมพ์ "แมงฟรี" → "แมวฟรี"\n` +
      `• พิมพ์ "สรุง" → "สรุป"\n` +
      `• พิมพ์ "หมวดหมุ" → "หมวดหมู่"\n` +
      `• ฟูกุเข้าใจแม้พิมพ์ผิดเล็กน้อย! 🎯\n\n`;

    // Subscription status
    if (subscriptionPlan === 'free') {
      const transactionLimit = features.transactionLimit;
      const categoryLimit = features.categoryLimit;
      
      helpText += `📋 ข้อจำกัดแพลนฟรี:\n` +
        `• บันทึกได้ ${transactionLimit} รายการ/เดือน\n` +
        `• หมวดหมู่ได้สูงสุด ${categoryLimit} หมวด\n\n` +
        `💎 อยากใช้ฟีเจอร์เต็มรูปแบบ?\n` +
        `พิมพ์ "premium" เพื่อดูแพคเกจ!\n\n`;
    } else {
      helpText += `✨ Premium Features:\n` +
        `• รายการไม่จำกัด 🚀\n` +
        `• หมวดหมู่ไม่จำกัด 📂\n` +
        `• อ่านสลิปอัตโนมัติ 📷\n` +
        `• รายงานขั้นสูง 📊\n` +
        `• ไม่มีโฆษณา 🚫\n\n`;
    }

    helpText += `💬 คุยเล่นกับฟูกุ:\n` +
      `• ทักทาย พูดคุยทั่วไป ฟูกุตอบได้หลากหลาย\n` +
      `• ฟูกุเข้าใจเรื่องอาหาร อารมณ์ งาน สุขภาพ\n\n` +
      `📱 ใช้งานง่ายด้วย Rich Menu:\n` +
      `• กดปุ่มด้านล่างเพื่อเข้าถึงฟีเจอร์โดยตรง\n` +
      `• ไม่ต้องจำคำสั่ง แค่แตะเลือกได้เลย!\n\n` +
      `🌐 จัดการขั้นสูงที่เว็บ:\n` +
      `${process.env.APP_URL}/dashboard\n` +
      `• เพิ่ม/แก้ไขหมวดหมู่ • ตั้งงบประมาณ\n` +
      `• ดูกราฟ • จัดการรายการโดยละเอียด`;

    if (subscriptionPlan === 'free') {
      helpText += `\n\n⚠️ ฟูกุยังอยู่ในช่วงเดโม่ อาจมีบางฟีเจอร์ยังไม่สมบูรณ์`;
    }

    return [{ type: 'text', text: helpText }];
  }

  /**
   * ฟีเจอร์ใหม่: แมวฟรี (รูปแมวสุ่ม)
   */
  static async getCatImageMessage(): Promise<Message[]> {
    try {
      const catImageUrl = await CatApiService.getCatImageWithFallback();
      
      return [
        {
          type: 'text',
          text: '🐱 แมวฟรีมาแล้ว! รูปแมวสุ่มพิเศษสำหรับคุณ ✨'
        },
        {
          type: 'image',
          originalContentUrl: catImageUrl,
          previewImageUrl: catImageUrl
        },
        {
          type: 'text',
          text: 'หวังว่าแมวตัวนี้จะทำให้คุณยิ้มได้นะ! 😸\n\nพิมพ์ "แมวฟรี" อีกครั้งเพื่อดูแมวตัวใหม่ 🎪'
        }
      ];
    } catch (error) {
      console.error('Error getting cat image:', error);
      return [{
        type: 'text',
        text: '😿 ขอโทษนะ แมวหนีไปเล่นที่อื่น ลองพิมพ์ "แมวฟรี" อีกครั้งดูนะ!'
      }];
    }
  }

  /**
   * ฟีเจอร์ใหม่: แมวเลีย (เซียมซีแมว)
   */
  static getFortuneMessage(): Message[] {
    const fortune = FortuneService.getRandomFortune();
    
    return [{
      type: 'text',
      text: fortune + '\n\n💫 พิมพ์ "แมวเลีย" อีกครั้งเพื่อขอคำทำนายใหม่ หรือ "ทำนายเงิน" เพื่อดูดวงการเงินเฉพาะ!'
    }];
  }

  /**
   * ฟีเจอร์พิเศษ: ทำนายการเงิน
   */
  static getFinancialFortuneMessage(): Message[] {
    const fortune = FortuneService.getFinancialFortune();
    
    return [{
      type: 'text',
      text: fortune + '\n\n📊 อยากดูสถานะการเงินจริงไหม? พิมพ์ "สรุป" เพื่อดูยอดรายรับ-จ่ายเดือนนี้!'
    }];
  }

  /**
   * การตอบสนองแบบคุยเล่นของฟูกุ - ปรับปรุงให้ตรงบริบทมากขึ้น
   */
  static getCasualResponse(text: string): Message[] | null {
    // ทักทาย
    if (/(สวัสดี|หวัดดี|hello|hi|เฮ้|เฮย)/i.test(text)) {
      const greetings = [
        '😸 นี่ฟูกุเอง! สวัสดีเจ้าทาส~',
        '🐱 หวัดดีครับเจ้าทาส! วันนี้จะให้ฟูกุช่วยอะไรดี?',
        '😊 สวัสดีครับ! ฟูกุพร้อมช่วยดูแลเรื่องเงินของเจ้าทาสแล้ว!',
        '🌟 เฮ้โลเจ้าทาส! วันนี้มีอะไรสนุกๆ บ้างมั้ย?'
      ];
      return [{ type: 'text', text: greetings[Math.floor(Math.random() * greetings.length)] }];
    }

    // ถามความเป็นไป
    if (/(เป็นไง|ยังไง|สบายดี|อยู่ไหน|ทำอะไร)/i.test(text)) {
      const responses = [
        '😸 ฟูกุสบายดีครับ! กำลังคิดวิธีช่วยเจ้าทาสประหยัดเงินอยู่เลย',
        '🐾 ตอนนี้ฟูกุกำลังดูแลเรื่องเงินของทุกคนอยู่ครับ! เจ้าทาสเป็นไงบ้าง?',
        '💰 ฟูกุกำลังนับเงินให้ทุกคนอยู่เลย! วันนี้เจ้าทาสจ่ายอะไรไปบ้างมั้ย?',
        '😺 อยู่ในแอปรอช่วยเจ้าทาสครับ! มีรายรับรายจ่ายใหม่มาบอกฟูกุมั้ย?'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // ชื่นชม/ขอบคุณ
    if (/(เก่ง|เยี่ยม|สุดยอด|ขอบคุณ|ขอบใจ|thank|good|great|nice)/i.test(text)) {
      const responses = [
        '😸 ยินดีที่ได้ช่วยเจ้าทาสครับ! ฟูกุอยากให้เจ้าทาสมีเงินเก็บเยอะๆ',
        '🐱 เหมียว~ ชื่นใจจัง! ฟูกุจะพยายามช่วยดูแลเงินของเจ้าทาสให้ดีที่สุด',
        '😻 ฟูกุดีใจที่เจ้าทาสพอใจครับ! มาดูแลเรื่องเงินด้วยกันต่อไปนะ',
        '✨ เจ้าทาสก็เก่งที่ใส่ใจเรื่องเงิน! ฟูกุภูมิใจในตัวเจ้าทาสมากเลย'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // เรื่องอาหาร/กิน
    if (/(หิว|กิน|อาหาร|ข้าว|อิ่ม|อร่อย|กาแฟ|ชา|น้ำ|เครื่องดื่ม|ร้านอาหาร)/i.test(text)) {
      const responses = [
        '😋 ฟูกุก็หิวปลาทูน่าเลย! แต่เจ้าทาสอย่าลืมจดรายจ่ายอาหารด้วยนะ',
        '🍽️ กินอะไรดีๆ มั้ย? อย่าลืมบอกฟูกุจำนวนเงินที่จ่ายไปด้วยล่ะ!',
        '☕ ฟูกุขอแชร์กาแฟหน่อยสิ! 😸 จ่ายเท่าไหร่มาบอกฟูกุได้เลย',
        '🐟 ฟูกุอยากกินปลาจัง! เจ้าทาสกินอะไรแล้วมาแชร์ค่าใช้จ่ายกับฟูกุสิ'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // อารมณ์ไม่ดี/เครียด
    if (/(เศร้า|เสียใจ|เครียด|เหนื่อย|งานเยอะ|ปวดหัว|ไม่สบาย|เหงา|ท้อ)/i.test(text)) {
      const responses = [
        '😿 อ๋อ เจ้าทาสเป็นอะไรหรอ? ฟูกุอยากปลอบใจ... มาดูเงินเก็บกันเถอะ ดูแล้วจะดีขึ้น!',
        '🫂 ฟูกุเข้าใจความรู้สึกเจ้าทาส... วันยากๆ แบบนี้อย่าลืมดูแลตัวเองด้วยนะ ฟูกุคอยช่วยดูแลเรื่องเงินให้',
        '💙 ใจเย็นๆ นะเจ้าทาส ฟูกุอยู่ตรงนี้! มาดูว่าเดือนนี้เก็บเงินได้เท่าไหร่ แล้วจะรู้สึกดีขึ้น',
        '🌈 ทุกอย่างจะผ่านไปดีๆ ครับ! ฟูกุจะช่วยดูแลเงินให้ เจ้าทาสแค่พักผ่อนให้เพียงพอก็พอ'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // สุขภาพ/ไม่สบาย
    if (/(ป่วย|ไข้|เจ็บ|หาย|แข็งแรง|สุขภาพ|หมอ|ยา|โรงพยาบาล|คลินิก)/i.test(text)) {
      const responses = [
        '🏥 เจ้าทาสไม่สบายหรอ? ดูแลตัวเองให้ดีนะ! อย่าลืมจดค่าหมอค่ายาด้วย',
        '💊 หายไวๆ นะเจ้าทาส! ฟูกุคิดถึง... และอย่าลืมเก็บใบเสร็จค่ารักษาไว้ด้วย',
        '❤️‍🩹 สุขภาพสำคัญที่สุดเลย! ค่าใช้จ่ายเรื่องสุขภาพถือว่าเป็นการลงทุนที่คุ้มค่านะ',
        '🌡️ ฟูกุห่วงเจ้าทาสจัง! พักผ่อนให้เพียงพอ และถ้าซื้อยามาบอกฟูกุด้วยนะ'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // งาน/การทำงาน
    if (/(งาน|ทำงาน|ออฟฟิศ|เพื่อนร่วมงาน|หัวหน้า|เงินเดือน|โบนัส|ลาง่าน|meeting|ประชุม)/i.test(text)) {
      const responses = [
        '💼 งานเป็นไงบ้างเจ้าทาส? ถ้าได้เงินเดือนแล้วอย่าลืมมาอัพเดตกับฟูกุด้วยนะ!',
        '📊 หนักมั้ยงานวันนี้? ฟูกุอยากให้เจ้าทาสมีเงินเก็บเยอะๆ จากการทำงานหนัก',
        '💰 เก่งมากเลยที่ทำงานหาเงิน! มาบอกรายได้เพิ่มกับฟูกุสิ',
        '⏰ ทำงานหนักแบบนี้ อย่าลืมตั้งเป้าประหยัดเงินด้วยนะเจ้าทาส!'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // ช้อปปิ้ง/ซื้อของ
    if (/(ซื้อ|ช้อป|shopping|เสื้อผ้า|รองเท้า|กระเป๋า|เครื่องสำอาง|ของใหม่|ของใช้)/i.test(text)) {
      const responses = [
        '🛍️ ซื้ออะไรมาหรอเจ้าทาส? ฟูกุอยากรู้ราคาด้วย! มาบันทึกรายจ่ายกันเถอะ',
        '👗 ซื้อของใหม่ใช่มั้ย? ดีจัง! อย่าลืมบอกฟูกุราคาด้วยนะ ฟูกุจะช่วยจดให้',
        '💳 ช้อปปิ้งสนุกมั้ย? แต่อย่าลืมดูยอดเงินเก็บด้วยล่ะ ฟูกุห่วงเจ้าทาส!',
        '🎁 ของใหม่น่าจะสวยมาก! มาบอกฟูกุว่าใช้เงินไปเท่าไหร่บ้าง จะได้ช่วยคำนวณงบประมาณ'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // สภาพอากาศ - แยกตามความเหมาะสม
    if (/(หนาว|เย็น)/i.test(text)) {
      const coldResponses = [
        '❄️ อากาศหนาวจัง! อย่าลืมดูแลสุขภาพนะ และถ้าซื้อของกันหนาวมาบอกฟูกุด้วย',
        '🧥 หนาวแบบนี้ต้องใส่เสื้อหนาวแล้วนะ! ค่าซื้อเสื้อกันหนาวก็อย่าลืมจดเอาไว้',
        '☕ อากาศหนาวๆ แบบนี้เหมาะกับการนั่งดื่มชาร้อนๆ และดูยอดเงินเก็บเลย!',
        '🌨️ เบาๆ อย่าให้เจ็บป่วยด้วยล่ะ! ค่าใช้จ่ายเรื่องสุขภาพฟูกุจะช่วยจดให้'
      ];
      return [{ type: 'text', text: coldResponses[Math.floor(Math.random() * coldResponses.length)] }];
    }

    if (/(ร้อน|แดด|อบอ้าว)/i.test(text)) {
      const hotResponses = [
        '�️ ร้อนมากหรอ? ซื้อเครื่องดื่มเย็นๆ มั้ย? ฟูกุอยากทราบค่าใช้จ่าย!',
        '☀️ แดดแรงแบบนี้ระวังแสงแดดด้วยนะ! ซื้อน้ำเย็นๆ ก็อย่าลืมบอกฟูกุ',
        '🧊 อุณหภูมิสูงแบบนี้ต้องหาที่ร่มๆ นั่งเลย! หรือไปคาเฟ่แอร์เย็นๆ ฟูกุอยากรู้ค่าใช้จ่าย',
        '💧 ร้อนๆ แบบนี้ดื่มน้ำเยอะๆ นะ และถ้าซื้ออะไรเพิ่มมาบอกฟูกุด้วย!'
      ];
      return [{ type: 'text', text: hotResponses[Math.floor(Math.random() * hotResponses.length)] }];
    }

    if (/(ฝน|เปียก|น้ำท่วม)/i.test(text)) {
      const rainResponses = [
        '☔ ฝนตกใหญ่หรอ? ระวังเปียกน้ำนะเจ้าทาส! ค่าร่มฉุกเฉินถ้าต้องซื้อมาบอกฟูกุ',
        '�️ ฝนตกแบบนี้อย่าลืมดูแลตัวเองด้วยนะ! ค่าแท็กซี่หรือค่าร่มฟูกุจะช่วยจดให้',
        '⛈️ พายุใหญ่มั้ย? อยู่บ้านปลอดภัยกว่านะ และถ้าสั่งอาหารมาบอกฟูกุค่าส่งด้วย!',
        '🌂 เปียกมั้ยเจ้าทาส? อย่าลืมเช็ดตัวให้แห้งนะ และค่าของใช้ที่ต้องซื้อเพิ่มบอกฟูกุได้เลย'
      ];
      return [{ type: 'text', text: rainResponses[Math.floor(Math.random() * rainResponses.length)] }];
    }

    if (/(อากาศ|สภาพอากาศ|อุณหภูมิ|ลม|เมฆ)/i.test(text)) {
      const generalWeatherResponses = [
        '🌤️ อากาศเป็นไงบ้างเจ้าทาส? ฟูกุห่วงเจ้าทาสจัง!',
        '🌈 สภาพอากาศมีผลกับค่าใช้จ่ายด้วยนะ อย่าลืมจดค่าเดินทางเพิ่มไว้ด้วย',
        '🍃 ลมพัดเย็นๆ สบายดีมั้ย? ถ้าออกไปข้างนอกมีค่าใช้จ่ายอะไรมาบอกฟูกุนะ',
        '☁️ อากาศแปรปรวนแบบนี้ดูแลสุขภาพด้วยนะเจ้าทาส!'
      ];
      return [{ type: 'text', text: generalWeatherResponses[Math.floor(Math.random() * generalWeatherResponses.length)] }];
    }

    // ประโยคทั่วไป
    if (/(ว่าไง|เป็นยังไง|มีอะไรใหม่|เล่าให้ฟัง|มีข่าว)/i.test(text)) {
      const responses = [
        '😸 มีอะไรเล่าให้ฟูกุฟังมั้ย? โดยเฉพาะเรื่องรายรับรายจ่าย!',
        '🐾 วันนี้ฟูกุช่วยหลายคนดูแลเงินแล้ว! เจ้าทาสมีอะไรอัพเดตมั้ย?',
        '💭 ฟูกุคิดว่าเจ้าทาสน่าจะมีเรื่องดีๆ มาเล่า! แล้วยอดเงินเก็บเป็นไงบ้าง?',
        '📝 ฟูกุอยากฟังเรื่องราวของเจ้าทาส! ไม่ว่าจะเรื่องเงินหรือเรื่องทั่วไป'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // แสดงความรู้สึกบวก
    if (/(ดีใจ|มีความสุข|สนุก|happy|เย้|เยี่ยม|เฮ้|ดีมาก)/i.test(text)) {
      const responses = [
        '😻 ฟูกุดีใจด้วยเลย! ความสุขคือสิ่งสำคัญ แต่อย่าลืมเก็บเงินด้วยนะ!',
        '🎉 เย้! เจ้าทาสมีความสุข ฟูกุก็มีความสุขตาม! มาฉลองด้วยการประหยัดเงินกันเถอะ',
        '✨ ดีใจจังเลย! วันดีๆ แบบนี้ถ้ามีรายได้พิเศษมาอย่าลืมบอกฟูกุด้วยนะ',
        '😸 เหมียว~ ฟูกุก็รู้สึกดีตาม! ความสุขนี้จะยิ่งมากขึ้นถ้าเงินเก็บเยอะด้วย!'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // ไม่ตรงเงื่อนไขไหน
    return null;
  }

  static async replyMessage(replyToken: string, messages: Message[]) {
    try {
      console.log('Attempting to reply with:', JSON.stringify(messages, null, 2));
      
      if (!messages || messages.length === 0) {
        console.error('No messages to reply with');
        return;
      }

      if (!replyToken) {
        console.error('No reply token provided');
        return;
      }

      await client.replyMessage(replyToken, messages);
      console.log('✅ Message replied successfully');
    } catch (error) {
      console.error('Error replying message:', error);
      
      // Log ข้อมูลเพิ่มเติมเพื่อ debug
      console.error('Reply token:', replyToken);
      console.error('Messages:', JSON.stringify(messages, null, 2));
      console.error('LINE Config:', {
        hasToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
        hasSecret: !!process.env.LINE_CHANNEL_SECRET,
        tokenLength: process.env.LINE_CHANNEL_ACCESS_TOKEN?.length || 0
      });
      
      throw error;
    }
  }

  static async pushMessage(userId: string, messages: Message[]) {
    try {
      await client.pushMessage(userId, messages);
    } catch (error) {
      console.error('Error pushing message:', error);
      throw error;
    }
  }

  /**
   * Get monthly transaction count for user
   */
  static async getMonthlyTransactionCount(userId: string): Promise<number> {
    try {
      return await DatabaseService.getMonthlyTransactionCount(userId);
    } catch (error) {
      console.error('Error getting monthly transaction count:', error);
      return 0;
    }
  }

  /**
   * Get subscription information
   */
  static getSubscriptionMessage(subscriptionPlan: 'free' | 'premium'): Message[] {
    const pricing = SubscriptionService.getPricing();
    
    if (subscriptionPlan === 'premium') {
      return [{
        type: 'text',
        text: `👑 คุณเป็นสมาชิก Premium แล้ว!\n\n` +
          `✨ ฟีเจอร์ที่คุณใช้ได้:\n` +
          pricing.premium.features.join('\n') + '\n\n' +
          `📱 จัดการสมาชิกที่: ${process.env.APP_URL}/subscription\n\n` +
          `💜 ขอบคุณที่สนับสนุนฟูกุ! 😸`
      }];
    }
    
    return [{
      type: 'text',
      text: `📦 แพคเกจของ Fuku Neko\n\n` +
        `🆓 ${pricing.free.name} (ปัจจุบัน)\n` +
        pricing.free.features.join('\n') + '\n\n' +
        `💎 ${pricing.premium.name} - ${pricing.premium.price} บาท${pricing.premium.duration}\n` +
        pricing.premium.features.join('\n') + '\n\n' +
        `🚀 อัปเกรดได้ที่: ${process.env.APP_URL}/premium\n\n` +
        `🐱 สนับสนุนการพัฒนาฟูกุให้ดีขึ้น!`
    }];
  }

  /**
   * Demo upgrade message (for testing)
   */
  static getDemoUpgradeMessage(): Message[] {
    return [{
      type: 'text',
      text: `🎉 ยินดีด้วย! คุณได้อัปเกรดเป็น Premium แล้ว!\n\n` +
        `✨ ฟีเจอร์ใหม่ที่ปลดล็อค:\n` +
        `• 📷 อ่านสลิปอัตโนมัติ\n` +
        `• 📊 รายงานขั้นสูง + กราฟ\n` +
        `• 🔔 การแจ้งเตือนอัจฉริยะ\n` +
        `• 🚫 ไม่มีโฆษณา\n` +
        `• 📂 หมวดหมู่ไม่จำกัด\n` +
        `• 📝 บันทึกรายการไม่จำกัด\n` +
        `• 💾 ส่งออกข้อมูล\n` +
        `• ⭐ การสนับสนุนลำดับความสำคัญ\n\n` +
        `🎪 พิมพ์ "ช่วยเหลือ" เพื่อดูฟีเจอร์ใหม่!\n\n` +
        `💜 ขอบคุณที่สนับสนุนฟูกุ! 😸`
    }];
  }

  /**
   * ข้อความต้อนรับสำหรับผู้ใช้ใหม่
   */
  static getWelcomeMessage(): Message[] {
    const greetings = [
      `🌟 เหมียว~ สวัสดีครับ! ยินดีต้อนรับสู่โลกน่ารักของฟูกุนะครับ 😸\n\n` +
      `💫 ฟูกุจะเป็นผู้ช่วยการเงินส่วนตัวของเจ้าทาส และคอยดูแลกระเป๋าเงินให้เรียบร้อยเสมอ~\n\n` +
      `🎪 ลองพิมพ์ 'ช่วยเหลือ' เพื่อดูเวทมนตร์ที่ฟูกุทำได้ หรือ 'แมวฟรี' เพื่อรับของขวัญแมวน่ารักฟรี! 🐾\n\n` +
      `✨ เริ่มต้นง่ายๆ ลองพิมพ์:\n• "50 ค่ากาแฟ" - บันทึกรายจ่าย\n• "สรุป" - ดูยอดเงินเดือนนี้\n• "แมวฟรี" - รับรูปแมวน่ารัก\n\n` +
      `💎 ถ้าเจ้าทาสอยากสนับสนุนฟูกุ สามารถอัปเกรดเป็น Premium เพื่อปลดล็อคความมหัศจรรย์เพิ่มเติมได้นะครับ! 🌟`,
      
      `🐾 ยินดีที่ได้รู้จักนะครับ! 💕\n\n` +
      `🌸 ฟูกุพร้อมเป็นทั้งผู้ช่วยการเงินและเพื่อนคุยสุดน่ารักของเจ้าทาสแล้วครับ~\n\n` +
      `🎭 มาลองเล่นกันเถอะ! พิมพ์:\n• "50 ค่ากาแฟ" - บันทึกรายจ่าย\n• "สรุป" - ดูสรุปเงิน\n• "แมวฟรี" - รับรูปแมว\n• "ช่วยเหลือ" - ดูคำสั่งทั้งหมด\n\n` +
      `✨ ฟูกุจะโชว์ความเก่งให้ดู!\n\n` +
      `💝 เจ้าทาสสามารถสนับสนุนฟูกุด้วยการอัปเกรด Premium เพื่อปลดล็อคฟีเจอร์พิเศษได้นะครับ! 😸`,
      
      `✨ ขอบคุณมากๆ ที่ให้ฟูกุได้เป็นเพื่อนนะครับ! 🥰\n\n` +
      `🌈 ขอให้ทุกวันของเจ้าทาสเต็มไปด้วยรอยยิ้ม ความสุข และเงินทองไหลมาเทมา! เหมียว~ 💰\n\n` +
      `🎁 เริ่มต้นด้วยของขวัญพิเศษ:\n• พิมพ์ "แมวฟรี" - รับรูปแมวน่ารัก! 😻\n• พิมพ์ "แมวเลีย" - ขอคำทำนายมงคล! 🔮\n• พิมพ์ "50 ค่าข้าว" - ลองบันทึกรายจ่าย! 💰\n\n` +
      `📚 พิมพ์ "ช่วยเหลือ" เพื่อดูเมนูความมหัศจรรย์ทั้งหมด!\n\n` +
      `💜 ถ้าเจ้าทาสอยากให้ฟูกุมีความสามารถเพิ่มขึ้น การอัปเกรด Premium จะช่วยให้ฟูกุแข็งแกร่งขึ้นได้นะครับ! 🌟`
    ];
    
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    return [
      {
        type: 'text', 
        text: randomGreeting
      },
      {
        type: 'text',
        text: '🎪 เริ่มต้นใช้งาน Fuku Neko กันเลย! พิมพ์ "ช่วยเหลือ" เพื่อดูคำสั่งทั้งหมด หรือลองพิมพ์ "แมวฟรี" เพื่อรับของขวัญแรก! 🐱✨'
      }
    ];
  }

  /**
   * จัดการข้อความสติกเกอร์
   */
  static handleStickerMessage(packageId: string, stickerId: string): Message[] {
    console.log(`Received sticker: packageId=${packageId}, stickerId=${stickerId}`);
    
    // ตอบกลับด้วยข้อความน่ารักๆ
    const stickerResponses = [
      '😸 ฟูกุชอบสติกเกอร์นี้มาก! มาคุยเรื่องเงินกันเถอะ~',
      '🐱 สติกเกอร์น่ารักจัง! ฟูกุอยากช่วยดูแลเงินของเจ้าทาส',
      '😻 เหมียว~ ฟูกุดีใจมาก! พิมพ์ "ช่วยเหลือ" เพื่อดูฟีเจอร์ต่างๆ นะ',
      '🌟 สติกเกอร์สวยมาก! ฟูกุอยากช่วยให้เจ้าทาสมีเงินเก็บเยอะๆ'
    ];
    
    return [{
      type: 'text',
      text: stickerResponses[Math.floor(Math.random() * stickerResponses.length)]
    }];
  }

  /**
   * อัปเดต Rich Menu ตาม Subscription Plan
   */
  static async updateUserRichMenu(userId: string, subscriptionPlan: 'free' | 'premium'): Promise<void> {
    try {
      await RichMenuService.updateUserRichMenu(userId, subscriptionPlan);
    } catch (error) {
      console.error('Error updating Rich Menu:', error);
    }
  }

  /**
   * ตั้งค่า Rich Menu เริ่มต้นสำหรับผู้ใช้ใหม่
   */
  static async setupDefaultRichMenu(userId: string): Promise<void> {
    try {
      // ใช้ Main Rich Menu สำหรับผู้ใช้ใหม่ (Free Plan)
      const mainRichMenuId = process.env.LINE_MAIN_RICH_MENU_ID;
      if (mainRichMenuId) {
        await RichMenuService.setUserRichMenu(userId, mainRichMenuId);
        console.log(`✅ Default Rich Menu set for user: ${userId}`);
      }
    } catch (error) {
      console.error('Error setting default Rich Menu:', error);
    }
  }
}
