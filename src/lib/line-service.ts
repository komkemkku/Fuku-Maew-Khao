import { Client, Message } from '@line/bot-sdk';
import { DatabaseService } from './database';
import { Category } from '@/types';
import { CatApiService } from './cat-api';
import { FortuneService } from './fortune-service';
import { SubscriptionService } from './subscription';
import { SecretCommandsService } from './secret-commands';
import { StickerResponseService } from './sticker-response';

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
  static async handleMessage(userMessage: string, userId: string, displayName?: string) {
    let user;
    
    try {
      // สร้างหรืออัปเดตผู้ใช้ในฐานข้อมูล
      user = await DatabaseService.createUser(userId, displayName);
      
      // ตรวจสอบสถานะ subscription
      user = await DatabaseService.checkSubscriptionStatus(user.id);
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

    // ฟีเจอร์ใหม่ Phase 1: แมวฟรี (รูปแมวสุ่ม)
    if (text === 'แมวฟรี' || text === 'รูปแมว' || text === 'แมว' || text === 'cat') {
      return await this.getCatImageMessage();
    }

    // ฟีเจอร์ใหม่ Phase 1: แมวเลีย (เซียมซีแมว)
    if (text === 'แมวเลีย' || text === 'เซียมซี' || text === 'ทำนาย' || text === 'fortune' || text === 'คำทำนาย') {
      return this.getFortuneMessage();
    }

    // ฟีเจอร์พิเศษ: คำทำนายการเงิน
    if (text === 'ทำนายเงิน' || text === 'โชคการเงิน' || text === 'ดวงการเงิน') {
      return this.getFinancialFortuneMessage();
    }

    // คำสั่งดูสรุป
    if (text === 'สรุป' || text === 'summary') {
      return await this.getSummaryMessage(userId);
    }

    // คำสั่งดูหมวดหมู่
    if (text === 'หมวดหมู่' || text === 'categories') {
      return await this.getCategoriesMessage(userId);
    }

    // คำสั่งดูงบประมาณ
    if (text === 'งบประมาณ' || text === 'budget') {
      return await this.getBudgetMessage(userId);
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
        return [{
          type: 'text',
          text: `🔄 คุณได้ดาวน์เกรดเป็น Free Plan แล้ว\n\n` +
            `🆓 ฟีเจอร์ที่ใช้ได้:\n` +
            `• บันทึกรายการ 100 รายการ/เดือน\n` +
            `• หมวดหมู่ 15 หมวด\n` +
            `• ฟีเจอร์พื้นฐาน\n\n` +
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

  static findBestCategory(description: string, categories: Category[]) {
    const desc = description.toLowerCase();
    // คำที่เชื่อมโยงกับหมวดหมู่ต่างๆ
    const categoryKeywords = {
      'อาหาร': ['อาหาร', 'กาแฟ', 'ข้าว', 'ของกิน', 'เครื่องดื่ม', 'ร้านอาหาร', 'ฟู้ด', 'กิน'],
      'เดินทาง': ['รถ', 'แท็กซี่', 'เบนซิน', 'น้ำมัน', 'รถเมล์', 'รถไฟ', 'เครื่องบิน', 'grab', 'เดินทาง'],
      'ค่าใช้จ่ายบ้าน': ['ไฟ', 'น้ำ', 'เน็ต', 'ค่าบ้าน', 'ค่าไฟ', 'ค่าน้ำ', 'ค่าเช่า', 'บิล'],
      'ช้อปปิ้ง': ['ซื้อ', 'เสื้อผ้า', 'รองเท้า', 'เครื่องสำอาง', 'ช้อป'],
      'ความบันเทิง': ['หนัง', 'เกม', 'คอนเสิร์ต', 'ท่องเที่ยว', 'บันเทิง'],
      'สุขภาพ': ['หมอ', 'ยา', 'โรงพยาบาล', 'คลินิก', 'สุขภาพ'],
      'การศึกษา': ['หนังสือ', 'เรียน', 'คอร์ส', 'เทรนนิ่ง', 'อบรม'],
      'เสื้อผ้า': ['เสื้อ', 'กางเกง', 'รองเท้า', 'กระเป๋า', 'แฟชั่น'],
      'เครื่องดื่ม': ['กาแฟ', 'ชา', 'น้ำ', 'เครื่องดื่ม', 'สตาร์บัค'],
      'ประกันภัย': ['ประกัน', 'เบี้ยประกัน']
    };

    // 1. Match จาก keyword mapping
    for (const category of categories) {
      if (category.type === 'expense') {
        const keywords = categoryKeywords[category.name as keyof typeof categoryKeywords];
        if (keywords && keywords.some(keyword => desc.includes(keyword))) {
          return category;
        }
      }
    }

    // 2. Match กับชื่อหมวดหมู่ที่ผู้ใช้สร้างเอง (ชื่อหมวดหมู่ต้องอยู่ใน description)
    for (const category of categories) {
      if (category.type === 'expense' && desc.includes(category.name.toLowerCase())) {
        return category;
      }
    }

    // 3. ไม่เจอเลย ให้ default ไปที่ "อื่นๆ"
    return categories.find(c => c.name === 'อื่นๆ' && c.type === 'expense');
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

  static async getCategoriesMessage(userId: string): Promise<Message[]> {
    try {
      const categories = await DatabaseService.getUserCategories(userId);
      
      const incomeCategories = categories.filter(c => c.type === 'income');
      const expenseCategories = categories.filter(c => c.type === 'expense');

      let text = '📂 หมวดหมู่ของคุณ\n\n';
      
      if (incomeCategories.length > 0) {
        text += '💰 รายรับ:\n';
        incomeCategories.forEach(cat => {
          text += `• ${cat.name}\n`;
        });
        text += '\n';
      }

      if (expenseCategories.length > 0) {
        text += '💸 รายจ่าย:\n';
        expenseCategories.forEach(cat => {
          text += `• ${cat.name}`;
          if (cat.budget_amount) {
            text += ` (งบ: ${cat.budget_amount.toLocaleString()})`;
          }
          text += '\n';
        });
      }

      text += `\n📱 จัดการหมวดหมู่เพิ่มเติมที่:\n${process.env.APP_URL}/dashboard`;

      return [{ type: 'text', text }];
    } catch (error) {
      console.error('Error getting categories:', error);
      return [{
        type: 'text',
        text: '❌ ขณะนี้ไม่สามารถดึงข้อมูลหมวดหมู่ได้ กรุณาลองใหม่ในภายหลัง\n\n🐱 ฟูกุขออภัยด้วยนะ!'
      }];
    }
  }

  static async getBudgetMessage(userId: string): Promise<Message[]> {
    try {
      const now = new Date();
      const budgetStatus = await DatabaseService.getBudgetStatus(userId, now.getFullYear(), now.getMonth() + 1);

      if (budgetStatus.length === 0) {
        return [{
          type: 'text',
          text: '📊 ยังไม่มีการตั้งงบประมาณ\n\n📱 ตั้งงบประมาณที่:\n${process.env.APP_URL}/dashboard'
        }];
      }

      let text = `📊 สถานะงบประมาณเดือน ${now.getMonth() + 1}/${now.getFullYear()}\n\n`;

      budgetStatus.forEach(budget => {
        const percentage = Math.round(budget.percentage_used);
        const status = percentage > 100 ? '🔴' : percentage > 80 ? '🟡' : '🟢';
        text += `${status} ${budget.category_name}: ${percentage}%\n`;
        text += `   ใช้: ${budget.spent_amount.toLocaleString()}/${budget.budget_amount.toLocaleString()} บาท\n\n`;
      });

      text += `📱 ดูรายละเอียดงบประมาณที่:\n${process.env.APP_URL}/dashboard`;

      return [{ type: 'text', text }];
    } catch (error) {
      console.error('Error getting budget:', error);
      return [{
        type: 'text',
        text: '❌ ขณะนี้ไม่สามารถดึงข้อมูลงบประมาณได้ กรุณาลองใหม่ในภายหลัง\n\n🐱 ฟูกุขออภัยด้วยนะ!'
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
      `• "แมวเลีา" - ขอคำทำนายวันนี้ 🔮\n` +
      `• "ทำนายเงิน" - ดูดวงการเงินเฉพาะ 💰\n\n` +
      `📝 บันทึกรายการ:\n` +
      `• "50 ค่ากาแฟ" - บันทึกรายจ่าย\n` +
      `• "ค่าอาหาร 120" - บันทึกแบบกลับหน้า\n` +
      `• "500 เงินเดือน" - บันทึกรายรับ\n` +
      `• "ค่าข้าว150" - พิมพ์ติดกันได้\n\n` +
      `📊 ดูข้อมูลการเงิน:\n` +
      `• "สรุป" - ดูสรุปรายรับ-จ่ายเดือนนี้\n` +
      `• "หมวดหมู่" - ดูหมวดหมู่ที่มี + งบประมาณ\n` +
      `• "งบประมาณ" - เช็คสถานะงบแต่ละหมวด\n\n`;

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
      `📱 จัดการขั้นสูงที่เว็บ:\n` +
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
        '🐱 หวัดดีค่ะเจ้าทาส! วันนี้จะให้ฟูกุช่วยอะไรดี?',
        '😊 สวัสดีจ้า! ฟูกุพร้อมช่วยดูแลเรื่องเงินของเจ้าทาสแล้ว!',
        '🌟 เฮ้โลเจ้าทาส! วันนี้มีอะไรสนุกๆ บ้างมั้ย?'
      ];
      return [{ type: 'text', text: greetings[Math.floor(Math.random() * greetings.length)] }];
    }

    // ถามความเป็นไป
    if (/(เป็นไง|ยังไง|สบายดี|อยู่ไหน|ทำอะไร)/i.test(text)) {
      const responses = [
        '😸 ฟูกุสบายดีค่ะ! กำลังคิดวิธีช่วยเจ้าทาสประหยัดเงินอยู่เลย',
        '🐾 ตอนนี้ฟูกุกำลังดูแลเรื่องเงินของทุกคนอยู่ค่ะ! เจ้าทาสเป็นไงบ้าง?',
        '💰 ฟูกุกำลังนับเงินให้ทุกคนอยู่เลย! วันนี้เจ้าทาสจ่ายอะไรไปบ้างมั้ย?',
        '😺 อยู่ในแอปรอช่วยเจ้าทาสค่ะ! มีรายรับรายจ่ายใหม่มาบอกฟูกุมั้ย?'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // ชื่นชม/ขอบคุณ
    if (/(เก่ง|เยี่ยม|สุดยอด|ขอบคุณ|ขอบใจ|thank|good|great|nice)/i.test(text)) {
      const responses = [
        '😸 ยินดีที่ได้ช่วยเจ้าทาสค่ะ! ฟูกุอยากให้เจ้าทาสมีเงินเก็บเยอะๆ',
        '🐱 เหมียว~ ชื่นใจจัง! ฟูกุจะพยายามช่วยดูแลเงินของเจ้าทาสให้ดีที่สุด',
        '😻 ฟูกุดีใจที่เจ้าทาสพอใจค่ะ! มาดูแลเรื่องเงินด้วยกันต่อไปนะ',
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
        '🌈 ทุกอย่างจะผ่านไปดีๆ ค่ะ! ฟูกุจะช่วยดูแลเงินให้ เจ้าทาสแค่พักผ่อนให้เพียงพอก็พอ'
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
      `🌟 เหมียว~ สวัสดีจ้า! ยินดีต้อนรับสู่โลกน่ารักของฟูกุนะคะ 😸\n\n` +
      `💫 ฟูกุจะเป็นผู้ช่วยการเงินส่วนตัวของเจ้าทาส และคอยดูแลกระเป๋าเงินให้เรียบร้อยเสมอ~\n\n` +
      `🎪 ลองพิมพ์ 'ช่วยเหลือ' เพื่อดูเวทมนตร์ที่ฟูกุทำได้ หรือ 'แมวฟรี' เพื่อรับของขวัญแมวน่ารักฟรี! 🐾\n\n` +
      `✨ เริ่มต้นง่ายๆ ลองพิมพ์:\n• "50 ค่ากาแฟ" - บันทึกรายจ่าย\n• "สรุป" - ดูยอดเงินเดือนนี้\n• "แมวฟรี" - รับรูปแมวน่ารัก\n\n` +
      `💎 ถ้าเจ้าทาสอยากสนับสนุนฟูกุ สามารถอัปเกรดเป็น Premium เพื่อปลดล็อคความมหัศจรรย์เพิ่มเติมได้นะ! 🌟`,
      
      `🐾 ยินดีที่ได้รู้จักนะคะ! 💕\n\n` +
      `🌸 ฟูกุพร้อมเป็นทั้งผู้ช่วยการเงินและเพื่อนคุยสุดน่ารักของเจ้าทาสแล้วค่ะ~\n\n` +
      `🎭 มาลองเล่นกันเถอะ! พิมพ์:\n• "50 ค่ากาแฟ" - บันทึกรายจ่าย\n• "สรุป" - ดูสรุปเงิน\n• "แมวฟรี" - รับรูปแมว\n• "ช่วยเหลือ" - ดูคำสั่งทั้งหมด\n\n` +
      `✨ ฟูกุจะโชว์ความเก่งให้ดู!\n\n` +
      `💝 เจ้าทาสสามารถสนับสนุนฟูกุด้วยการอัปเกรด Premium เพื่อปลดล็อคฟีเจอร์พิเศษได้นะ! 😸`,
      
      `✨ ขอบคุณมากๆ ที่ให้ฟูกุได้เป็นเพื่อนนะคะ! 🥰\n\n` +
      `🌈 ขอให้ทุกวันของเจ้าทาสเต็มไปด้วยรอยยิ้ม ความสุข และเงินทองไหลมาเทมา! เหมียว~ 💰\n\n` +
      `🎁 เริ่มต้นด้วยของขวัญพิเศษ:\n• พิมพ์ "แมวฟรี" - รับรูปแมวน่ารัก! 😻\n• พิมพ์ "แมวเลีย" - ขอคำทำนายมงคล! 🔮\n• พิมพ์ "50 ค่าข้าว" - ลองบันทึกรายจ่าย! 💰\n\n` +
      `📚 พิมพ์ "ช่วยเหลือ" เพื่อดูเมนูความมหัศจรรย์ทั้งหมด!\n\n` +
      `💜 ถ้าเจ้าทาสอยากให้ฟูกุมีความสามารถเพิ่มขึ้น การอัปเกรด Premium จะช่วยให้ฟูกุแข็งแกร่งขึ้นได้นะ! 🌟`
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
    
    // ตรวจสอบว่าควรใช้การตอบกลับแบบพิเศษหรือไม่
    if (StickerResponseService.shouldUseSpecialResponse()) {
      return StickerResponseService.createSpecialStickerResponse(packageId, stickerId);
    }
    
    // ตรวจสอบว่าควรตอบกลับด้วยสติกเกอร์หรือไม่
    if (StickerResponseService.shouldReplyWithSticker()) {
      return StickerResponseService.createStickerReplyWithSticker(packageId, stickerId);
    }
    
    // ตอบกลับธรรมดา
    return StickerResponseService.createStickerResponse(packageId, stickerId);
  }

  /**
   * จัดการ media messages อื่นๆ (รูปภาพ, วิดีโอ, เสียง)
   */
  static handleMediaMessage(messageType: string): Message[] {
    const responses = {
      image: [
        "📸 รูปสวยมาก! ฟูกุชอบเลย~ เก็บความทรงจำดีๆ ไว้นะ",
        "🖼️ วาว! รูปนี้น่ารักจัง ฟูกุอยากเก็บไว้ในอัลบัม",
        "🌟 ภาพสวยแบบนี้ต้องมีค่าใช้จ่ายแน่ๆ อย่าลืมบันทึกนะ!",
        "📷 ฟูกุชอบรูปนี้มาก! แชร์ความสุขดีๆ แบบนี้ต่อไปนะ"
      ],
      video: [
        "🎬 วิดีโอสนุกมาก! ฟูกุดูแล้วมีความสุข~",
        "📹 คลิปน่าสนใจเลย! ขอบคุณที่แชร์ให้ฟูกุดูนะ",
        "🎪 วิดีโอนี้ทำให้ฟูกุยิ้มได้เลย! เหมียว~",
        "🎭 ดูสนุกมาก! ฟูกุอยากดูอีก แต่อย่าลืมดูสรุปการเงินด้วยนะ"
      ],
      audio: [
        "🎵 เสียงไพเราะมาก! ฟูกุฟังแล้วผ่อนคลาย~",
        "🎶 เพลงดีจัง! ฟูกุชอบฟังเพลงเหมือนกัน",
        "🔊 เสียงใสมาก! ขอบคุณที่ส่งให้ฟูกุฟังนะ",
        "🎤 ฟูกุได้ฟังแล้วมีความสุขมาก เหมียว~"
      ]
    };

    const typeResponses = responses[messageType as keyof typeof responses] || [
      "📱 ขอบคุณที่ส่งข้อความมาให้ฟูกุนะ!",
      "💌 ฟูกุได้รับข้อความแล้ว ขอบคุณมากเลย~"
    ];

    const randomResponse = typeResponses[Math.floor(Math.random() * typeResponses.length)];
    const tip = "💡 พิมพ์ 'ช่วยเหลือ' เพื่อดูคำสั่งที่ฟูกุทำได้นะ!";

    return [{
      type: 'text',
      text: `${randomResponse}\n\n${tip}`
    }];
  }
}
