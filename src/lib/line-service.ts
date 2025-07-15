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

/**
 * Helper function to get base URL with fallback
 */
function getBaseUrl(): string {
  return process.env.APP_URL || process.env.VERCEL_URL || 'https://fuku-maew-khao.vercel.app';
}

export class LineService {
  /**
   * สร้าง Dashboard URL พร้อม user authentication
   */
  static getDashboardUrl(userId: string): string {
    return `${getBaseUrl()}/dashboard?user=${userId}&token=auto`;
  }

  static async handleMessage(userMessage: string, lineUserId: string, displayName?: string) {
    let user;

    try {
      // สร้างหรืออัปเดตผู้ใช้ในฐานข้อมูล
      user = await DatabaseService.createUser(lineUserId, displayName);

      // ตรวจสอบสถานะ subscription
      user = await DatabaseService.checkSubscriptionStatus(user.id);

      // ตั้งค่า Rich Menu เริ่มต้นสำหรับผู้ใช้ใหม่
      await this.setupDefaultRichMenu(lineUserId);
    } catch (dbError) {
      console.error('Database connection failed, using fallback mode:', dbError);
      // ใช้ fallback user สำหรับกรณีฐานข้อมูลเชื่อมต่อไม่ได้
      user = {
        id: lineUserId,
        line_user_id: lineUserId,
        display_name: displayName || 'ผู้ใช้ไม่ระบุชื่อ',
        subscription_plan: 'free',
        subscription_start_date: null,
        subscription_end_date: null,
        created_at: new Date().toISOString()
      };
    }

    // ประมวลผลข้อความ - ส่ง internal user ID และ LINE user ID
    const response = await this.processUserMessage(userMessage, user.id, lineUserId, user.subscription_plan as 'free' | 'premium');

    return response;
  }

  static async processUserMessage(message: string, internalUserId: string, lineUserId: string, subscriptionPlan: 'free' | 'premium' = 'free'): Promise<Message[]> {
    const text = message.trim().toLowerCase();

    // ตรวจสอบคำสั่งลับก่อน
    if (SecretCommandsService.isSecretCommand(text)) {
      return await SecretCommandsService.processSecretCommand(text, internalUserId) || [];
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

    // คำสั่งดูสรุป - ส่งสรุปรายรับจ่ายในแต่ละหมวดพร้อมแสดงงบในแต่ละหมวด
    if (['สรุป', 'summary', 'สรุง', 'สุรป', 'สู่รุป'].includes(normalizedText)) {
      const result = await this.getOverviewMessageWithButtons(lineUserId);
      return [...correctionMessage, ...result];
    }

    // คำสั่งภาพรวม - เด้งไปที่หน้าเว็บภาพรวมของผู้ใช้งาน
    if (['ภาพรวม', 'overview', 'ภาพรวง', 'ภาพรบม', 'ภาบรวม'].includes(normalizedText)) {
      const result = await this.getDashboardNavigationMessage(lineUserId);
      return [...correctionMessage, ...result];
    }

    // คำสั่งใหม่ - หมวดหมู่ (ปรับปรุงใหม่)
    if (['หมวดหมู่', 'categories', 'หมวดหมุ', 'หมวดมู', 'หมวดมุ'].includes(normalizedText)) {
      return [...correctionMessage, ...this.getCategoriesNavigationMessage(lineUserId)];
    }

    // คำสั่งใหม่ - ประวัติ
    if (['ประวัติ', 'history', 'transactions', 'ประวัต', 'ประวัตี', 'ประวติ'].includes(normalizedText)) {
      return [...correctionMessage, ...this.getHistoryNavigationMessage(lineUserId)];
    }

    // คำสั่งใหม่ - ตั้งค่า
    if (['ตั้งค่า', 'settings', 'ตังค่า', 'ตั้งคา', 'ตังคา'].includes(normalizedText)) {
      return [...correctionMessage, ...this.getSettingsNavigationMessage(lineUserId)];
    }

    // คำสั่งใหม่ - แพคเกจ
    if (['แพคเกจ', 'package', 'premium', 'แพคเกด', 'แพกเกจ', 'แพ็คเกจ'].includes(normalizedText)) {
      return [...correctionMessage, ...this.getPackageNavigationMessage(lineUserId)];
    }

    // คำสั่งใหม่ - จดรายการ
    if (['จดรายการ', 'record', 'จด', 'บันทึก', 'จรรายการ', 'จดรายกร'].includes(normalizedText)) {
      return [...correctionMessage, ...this.getRecordGuidanceMessage()];
    }

    // คำสั่งดูงบประมาณ
    if (['งบประมาณ', 'budget', 'งบประมาน', 'งบประมา', 'งบปะมาณ'].includes(normalizedText)) {
      const result = await this.getBudgetMessageWithButtons(internalUserId);
      return [...correctionMessage, ...result];
    }

    // คำแนะนำการบันทึกรายรับ
    if (['รายรับ', 'income', 'รายได้', 'เงินเข้า'].includes(normalizedText)) {
      return [...correctionMessage, ...this.getIncomeGuidanceMessage()];
    }

    // คำแนะนำการบันทึกรายจ่าย
    if (['รายจ่าย', 'expense', 'ค่าใช้จ่าย', 'เงินออก'].includes(normalizedText)) {
      return [...correctionMessage, ...this.getExpenseGuidanceMessage()];
    }

    // ข้อความแนะนำใช้ Dashboard
    if (text.includes('dashboard') || text.includes('แดชบอร์ด') || text.includes('เว็บ') || text === 'เว็บไซต์') {
      return [
        {
          type: 'text',
          text: `🌟 ยินดีต้อนรับสู่ Dashboard ฟูกุเนโกะ!\n\n✨ คุณสมบัติพิเศษ:\n• ดูสรุปรายรับ-รายจ่ายแบบ Real-time\n• จัดการหมวดหมู่ได้อย่างง่าย\n• ตั้งงบประมาณและติดตามได้\n• ใช้งานได้ทุกอุปกรณ์\n\n💡 เคล็ดลับ: เปิดในเบราว์เซอร์เพื่อประสบการณ์ที่ดีที่สุด!`
        },
        {
          type: 'template',
          altText: 'เข้าสู่ Dashboard',
          template: {
            type: 'buttons',
            text: '� เข้าใช้งาน Dashboard',
            actions: [
              {
                type: 'uri',
                label: '🏠 หน้าแรก',
                uri: `https://fukuneko-app.vercel.app/?lineUserId=${lineUserId}&auto=true`
              },
              {
                type: 'uri',
                label: '📊 Dashboard',
                uri: `https://fukuneko-app.vercel.app/dashboard?lineUserId=${lineUserId}&auto=true`
              }
            ]
          }
        }
      ];
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
        await DatabaseService.downgradeToFree(internalUserId);

        // อัปเดต Rich Menu เป็น Free version
        await this.updateUserRichMenu(lineUserId, 'free');

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
        const userInfo = await DatabaseService.checkSubscriptionStatus(internalUserId);
        const monthlyTransactions = await this.getMonthlyTransactionCount(internalUserId);
        const categories = await DatabaseService.getUserCategories(internalUserId);

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
        let categories = await DatabaseService.getUserCategories(internalUserId);
        
        // ถ้าผู้ใช้ยังไม่มีหมวดหมู่ ให้สร้างหมวดหมู่เริ่มต้น
        if (categories.length === 0) {
          await this.createDefaultCategories(internalUserId);
          categories = await DatabaseService.getUserCategories(internalUserId);
          console.log(`🎯 สร้างหมวดหมู่เริ่มต้นสำหรับผู้ใช้ ${internalUserId} จำนวน ${categories.length} หมวด`);
        }
        
        const monthlyTransactions = await this.getMonthlyTransactionCount(internalUserId);

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
        const category = await this.findBestCategory(transaction.description || '', categories, internalUserId);

        // กำหนดจำนวนเงินที่จะบันทึก (รายรับเป็นบวก รายจ่ายเป็นลบ)
        const finalAmount = category?.type === 'income' ? 
          Math.abs(transaction.amount) : // รายรับเป็นบวกเสมอ
          -Math.abs(transaction.amount); // รายจ่ายเป็นลบเสมอ

        // บันทึกรายการ
        await DatabaseService.createTransaction(
          internalUserId,
          finalAmount,
          transaction.description,
          category?.id
        );

        // สร้างข้อความแจ้งผลการบันทึก
        const transactionType = category?.type === 'income' ? 'รายรับ' : 'รายจ่าย';
        const amountDisplay = category?.type === 'income' ?
          `+${Math.abs(transaction.amount).toLocaleString()}` :
          `-${Math.abs(transaction.amount).toLocaleString()}`;

        let successMessage = `✅ บันทึก${transactionType}สำเร็จ!\n💰 จำนวน: ${amountDisplay} บาท\n📝 รายละเอียด: ${transaction.description}`;

        if (category) {
          successMessage += `\n📂 หมวดหมู่: ${category.name} (🤖 จัดให้อัตโนมัติ)`;
          successMessage += `\n\n💡 เคล็ดลับ: สามารถแก้ไขหมวดหมู่ใน Dashboard ได้ทีหลัง`;
        } else {
          successMessage += `\n📂 หมวดหมู่: ไม่ระบุ`;
          successMessage += `\n\n💡 เคล็ดลับ: เพิ่มคำอธิบายชัดเจนเพื่อให้ระบบจัดหมวดหมู่ได้แม่นยำ`;
        }

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

      const helpMessage = `🤔 ฟูกุไม่เข้าใจข้อความนี้เลย\n\n💡 ลองพิมพ์:\n• 'แมวฟรี' - ดูรูปแมวสุ่ม 🐱\n• 'แมวเลีย' - ขอคำทำนาย 🔮\n• 'สรุป' - ดูสรุปรายเดือนพร้อมงบประมาณ 📊\n• 'ภาพรวม' - เปิดหน้า Dashboard 📈\n• 'ช่วยเหลือ' - ดูคำสั่งทั้งหมด 📝\n• 'premium' - ดูแพคเกจ ${planEmoji}\n\n🤖 บันทึกรายรับ-จ่าย (จัดหมวดหมู่อัตโนมัติ!):\n• "50 ค่ากาแฟ" → รายจ่าย หมวด "เครื่องดื่ม"\n• "ซื้อข้าว 80" → รายจ่าย หมวด "อาหาร"\n• "500 เงินเดือน" → รายรับ หมวด "เงินเดือน"\n• "จ่ายค่าไฟ 800" → รายจ่าย หมวด "ค่าใช้จ่ายบ้าน"\n• ระบบจะจัดหมวดหมู่ให้อัตโนมัติ!\n\nหรือเจ้าทาสลองคุยเล่นกับฟูกุก็ได้นะ! 😸`;

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

  static async findBestCategory(description: string, categories: Category[], userId: string): Promise<Category | null> {
    const desc = description.toLowerCase();

    // 🎯 ขั้นตอนที่ 1: ตรวจจับประเภทรายการ (รายรับ/รายจ่าย)
    const transactionType = this.detectTransactionType(desc);

    // 🎯 ขั้นตอนที่ 2: กรองหมวดหมู่ตามประเภทที่ตรวจจับได้
    const filteredCategories = categories.filter(cat => cat.type === transactionType);

    // 🎯 ขั้นตอนที่ 3: หาหมวดหมู่ที่เหมาะสมที่สุด
    const bestCategory = this.findCategoryByKeywords(desc, filteredCategories);

    if (bestCategory) {
      return bestCategory;
    }

    // 🎯 ขั้นตอนที่ 4: สร้างหมวดหมู่ใหม่อัตโนมัติถ้าไม่เจอ
    const suggestedCategoryName = this.suggestCategoryName(desc, transactionType);
    if (suggestedCategoryName) {
      try {
        // สร้างหมวดหมู่ใหม่ในฐานข้อมูล
        const newCategory = await DatabaseService.createCategory(userId, suggestedCategoryName, transactionType);
        console.log(`🎯 สร้างหมวดหมู่ใหม่: ${suggestedCategoryName} (${transactionType}) สำหรับ user ${userId}`);
        return newCategory;
      } catch (error) {
        console.error('Error creating new category:', error);
      }
    }

    // 🎯 ขั้นตอนที่ 5: ถ้าไม่สามารถสร้างได้ ใช้หมวดเริ่มต้น
    return this.getDefaultCategory(transactionType, categories);
  }

  // 🔍 ตรวจจับประเภทรายการจากคำในข้อความ
  static detectTransactionType(description: string): 'income' | 'expense' {
    const incomeKeywords = [
      // คำบ่งบอกรายรับ
      'เงินเดือน', 'รายได้', 'รับ', 'ได้รับ', 'เซอร์วิส', 'รางวัล', 'โบนัส', 'ค่าคอม',
      'ค่าคมิชชั่น', 'ผลตอบแทน', 'ดอกเบี้ย', 'ลงทุน', 'ออม', 'โอน', 'โอนเข้า',
      'ขาย', 'ได้', 'เก็บ', 'รับมา', 'เข้าบัญชี', 'dividend', 'salary', 'income',
      'เงินพิเศษ', 'เงินรางวัล', 'เงินต่างๆ', 'bonus', 'reward', 'commission'
    ];

    const expenseKeywords = [
      // คำบ่งบอกรายจ่าย - เพิ่มคำใหม่ตามที่ user ขอ
      'จ่าย', 'ค่า', 'ซื้อ', 'โอน', 'สแกน', 'ชำระ', 'เสีย', 'ใช้', 'ออก', 'ลง',
      'ตั้งต่อ', 'เติม', 'เพิ่ม', 'ต่อ', 'ผ่อน', 'ดาวน์', 'มัดจำ', 'เสียเงิน',
      'ซื้อของ', 'จ่ายตัง', 'จ่ายค่า', 'pay', 'spend', 'buy', 'purchase',
      'กิน', 'ฟู้ด', 'อาหาร', 'ข้าว', 'coffee', 'cafe'
    ];

    // ตรวจสอบคำในรายละเอียด
    for (const keyword of incomeKeywords) {
      if (description.includes(keyword)) {
        return 'income';
      }
    }

    for (const keyword of expenseKeywords) {
      if (description.includes(keyword)) {
        return 'expense';
      }
    }

    // ถ้าไม่มีคำบ่งบอกชัดเจน ให้เป็นรายจ่าย (default)
    return 'expense';
  }

  // 🔍 หาหมวดหมู่ที่เหมาะสมจาก keywords
  static findCategoryByKeywords(description: string, categories: Category[]): Category | null {
    // คำที่เชื่อมโยงกับหมวดหมู่ต่างๆ - เพิ่มคำใหม่และปรับปรุง
    const categoryKeywords = {
      'อาหาร': [
        'อาหาร', 'กาแฟ', 'ข้าว', 'ของกิน', 'เครื่องดื่ม', 'ร้านอาหาร', 'ฟู้ด', 'กิน',
        'ก๋วยเตี๋ยว', 'ผัดไทย', 'ส้มตำ', 'แกง', 'ต้มยำ', 'ข้าวผัด', 'ข้าวแกง',
        'อาหารเช้า', 'อาหารเที่ยง', 'อาหารเย็น', 'ขนม', 'เค้ก', 'ไอติม',
        'ข้าวกล่อง', 'ไก่ทอด', 'หมูกระทะ', 'ปลาเผา', 'ลาบ', 'ไส้กรอก',
        'มาม่า', 'คาเฟ่', 'ร้าน', 'รสชาติ', 'อร่อย', 'หิว', 'กะ', 'food', 'eat'
      ],
      'เครื่องดื่ม': [
        'กาแฟ', 'ชา', 'น้ำ', 'เครื่องดื่ม', 'สตาร์บัค', 'คาเฟ่', 'นม', 'โซดา',
        'น้ำส้ม', 'น้ำแข็ง', 'เบียร์', 'ไวน์', 'น้ำผลไม้', 'ชาเขียว', 'ชาไทย',
        'เอสเปรสโซ่', 'ลาเต้', 'คาปูชิโน่', 'มอคค่า', 'เฟรปเป้', 'สมูทตี้',
        'coffee', 'tea', 'drink', 'beverage', 'starbucks', 'cafe'
      ],
      'เดินทาง': [
        'รถ', 'แท็กซี่', 'เบนซิน', 'น้ำมัน', 'รถเมล์', 'รถไฟ', 'เครื่องบิน', 'grab', 'เดินทาง',
        'บีทีเอส', 'เอ็มอาร์ที', 'รถตู้', 'มอเตอร์ไซค์', 'จักรยาน', 'เรือ', 'สายการบิน',
        'ค่าน้ำมัน', 'ค่ารถ', 'โบลท์', 'ไลน์แมน', 'ฟู้ดแพนด้า', 'ขับรถ', 'ปาร์ค',
        'taxi', 'grab', 'bus', 'train', 'transport', 'travel', 'gas', 'fuel'
      ],
      'ค่าใช้จ่ายบ้าน': [
        'ไฟ', 'น้ำ', 'เน็ต', 'ค่าบ้าน', 'ค่าไฟ', 'ค่าน้ำ', 'ค่าเช่า', 'บิล',
        'อินเทอร์เน็ต', 'ไวไฟ', 'เคเบิ้ล', 'ทีวี', 'โทรศัพท์', 'ค่าส่วนกลาง',
        'ค่าจอดรถ', 'ประปา', 'กฟน', 'เอไอเอส', 'ทรู', 'ดีแทค',
        'internet', 'wifi', 'electric', 'water', 'rent', 'bill'
      ],
      'ช้อปปิ้ง': [
        'ซื้อ', 'เสื้อผ้า', 'รองเท้า', 'เครื่องสำอาง', 'ช้อป', 'แฟชั่น',
        'ห้างสรรพสินค้า', 'เซ็นทรัล', 'ไบเทค', 'ยูเนี่ยน', 'เทอร์มินอล',
        'ออนไลน์', 'ช้อปปี้', 'ลาซาด้า', 'เครื่องใช้', 'ของใช้',
        'shopping', 'buy', 'purchase', 'mall', 'online', 'shopee', 'lazada'
      ],
      'ความบันเทิง': [
        'หนัง', 'เกม', 'คอนเสิร์ต', 'ท่องเที่ยว', 'บันเทิง', 'โรงหนัง',
        'เพลง', 'ศิลปิน', 'นักร้อง', 'งานแสดง', 'เทศกาล', 'ปาร์ตี้',
        'คาราโอเกะ', 'โบว์ลิ่ง', 'บิลเลียด', 'สนุกเกอร์',
        'movie', 'game', 'concert', 'entertainment', 'party', 'travel'
      ],
      'สุขภาพ': [
        'หมอ', 'ยา', 'โรงพยาบาล', 'คลินิก', 'สุขภาพ', 'รักษา',
        'ตรวจสุขภาพ', 'เข็มฉีดยา', 'วิตามิน', 'อาหารเสริม',
        'ฟิตเนส', 'ยิม', 'โยคะ', 'นวด', 'สปา',
        'doctor', 'medicine', 'hospital', 'clinic', 'health', 'fitness', 'gym'
      ],
      'การศึกษา': [
        'หนังสือ', 'เรียน', 'คอร์ส', 'เทรนนิ่ง', 'อบรม', 'ค่าเล่าเรียน',
        'โรงเรียน', 'มหาวิทยาลัย', 'เซมินาร์', 'วิทยาลัย', 'เทคนิค',
        'education', 'course', 'training', 'school', 'university', 'book'
      ],
      'เสื้อผ้า': [
        'เสื้อ', 'กางเกง', 'รองเท้า', 'กระเป๋า', 'แฟชั่น', 'เครื่องแต่งกาย',
        'ชุดชั้นใน', 'ถุงเท้า', 'หมวก', 'แว่นตา', 'นาฬิกา', 'เครื่องประดับ',
        'clothes', 'shirt', 'pants', 'shoes', 'bag', 'fashion'
      ],
      'ประกันภัย': [
        'ประกัน', 'เบี้ยประกัน', 'ประกันชีวิต', 'ประกันรถ', 'ประกันสุขภาพ',
        'insurance', 'premium'
      ],
      // รายรับ keywords
      'เงินเดือน': [
        'เงินเดือน', 'salary', 'wage', 'รายได้', 'ได้รับ', 'รับเงิน'
      ],
      'รายได้พิเศษ': [
        'รายได้พิเศษ', 'พิเศษ', 'โบนัส', 'ค่าคอม', 'คอมมิชชั่น', 'ค่าล่วงเวลา',
        'bonus', 'commission', 'overtime', 'extra'
      ],
      'การลงทุน': [
        'ลงทุน', 'หุ้น', 'กองทุน', 'ดอกเบี้ย', 'dividend', 'ผลตอบแทน',
        'investment', 'stock', 'fund', 'interest', 'return'
      ]
    };

    // 1. ตรวจสอบคำในรายละเอียดกับ keywords
    for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (description.includes(keyword)) {
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
      if (description.includes(category.name.toLowerCase())) {
        return category;
      }
    }

    return null;
  }

  // 🎯 หาหมวดหมู่เริ่มต้นตามประเภท
  static getDefaultCategory(transactionType: 'income' | 'expense', categories: Category[]): Category | null {
    if (transactionType === 'income') {
      // หาหมวดรายรับ เช่น "รายได้อื่นๆ", "เงินเดือน"
      return categories.find(cat =>
        cat.type === 'income' && (
          cat.name.includes('อื่น') ||
          cat.name.includes('รายได้') ||
          cat.name.includes('เงินเดือน')
        )
      ) || categories.find(cat => cat.type === 'income') || null;
    } else {
      // หาหมวดรายจ่าย เช่น "อื่นๆ", "อาหาร"
      return categories.find(cat =>
        cat.type === 'expense' && (
          cat.name.includes('อื่น') ||
          cat.name.includes('other')
        )
      ) || categories.find(cat => cat.type === 'expense') || null;
    }
  }

  // 🎯 แนะนำชื่อหมวดหมู่ใหม่ตามเนื้อหา
  static suggestCategoryName(description: string, transactionType: 'income' | 'expense'): string | null {
    const desc = description.toLowerCase();
    
    if (transactionType === 'expense') {
      // แนะนำหมวดหมู่รายจ่าย
      if (/กาแฟ|ชา|เครื่องดื่ม|นม|น้ำ/i.test(desc)) return 'เครื่องดื่ม';
      if (/อาหาร|ข้าว|กิน|ร้าน|ฟู้ด|เที่ยง|เช้า|เย็น|ขนม/i.test(desc)) return 'อาหาร';
      if (/รถ|เบนซิน|น้ำมัน|แท็กซี่|เดินทาง|บีทีเอส|รถไฟ/i.test(desc)) return 'เดินทาง';
      if (/เสื้อ|รองเท้า|กางเกง|แฟชั่น|ซื้อ|ช้อป/i.test(desc)) return 'เสื้อผ้า';
      if (/ไฟ|น้ำ|เน็ต|ค่าเช่า|บิล|โทรศัพท์/i.test(desc)) return 'ค่าใช้จ่ายบ้าน';
      if (/หนัง|เกม|บันเทิง|ท่องเที่ยว|คอนเสิร์ต/i.test(desc)) return 'ความบันเทิง';
      if (/หมอ|ยา|โรงพยาบาล|สุขภาพ|ยิม|ฟิตเนส/i.test(desc)) return 'สุขภาพ';
      if (/เรียน|หนังสือ|คอร์ส|การศึกษา/i.test(desc)) return 'การศึกษา';
      if (/ประกัน|เบี้ย/i.test(desc)) return 'ประกันภัย';
      
      // หมวดหมู่ทั่วไป
      return 'อื่นๆ';
    } else {
      // แนะนำหมวดหมู่รายรับ
      if (/เงินเดือน|salary/i.test(desc)) return 'เงินเดือน';
      if (/โบนัส|ค่าคอม|พิเศษ|bonus/i.test(desc)) return 'รายได้พิเศษ';
      if (/ลงทุน|หุ้น|ดอกเบี้ย|กองทุน/i.test(desc)) return 'การลงทุน';
      
      // หมวดหมู่ทั่วไป
      return 'รายได้อื่นๆ';
    }
  }

  // 🎯 สร้างหมวดหมู่เริ่มต้นสำหรับผู้ใช้ใหม่
  static async createDefaultCategories(userId: string): Promise<void> {
    try {
      const defaultCategories = [
        // หมวดหมู่รายจ่าย
        { name: 'อาหาร', type: 'expense' as const },
        { name: 'เครื่องดื่ม', type: 'expense' as const },
        { name: 'เดินทาง', type: 'expense' as const },
        { name: 'เสื้อผ้า', type: 'expense' as const },
        { name: 'ค่าใช้จ่ายบ้าน', type: 'expense' as const },
        { name: 'ความบันเทิง', type: 'expense' as const },
        { name: 'สุขภาพ', type: 'expense' as const },
        { name: 'การศึกษา', type: 'expense' as const },
        { name: 'ประกันภัย', type: 'expense' as const },
        { name: 'อื่นๆ', type: 'expense' as const },
        
        // หมวดหมู่รายรับ
        { name: 'เงินเดือน', type: 'income' as const },
        { name: 'รายได้พิเศษ', type: 'income' as const },
        { name: 'การลงทุน', type: 'income' as const },
        { name: 'รายได้อื่นๆ', type: 'income' as const }
      ];

      for (const category of defaultCategories) {
        await DatabaseService.createCategory(userId, category.name, category.type);
      }
      
      console.log(`✅ สร้างหมวดหมู่เริ่มต้น ${defaultCategories.length} หมวด สำหรับ user ${userId}`);
    } catch (error) {
      console.error('Error creating default categories:', error);
    }
  }

  static async getSummaryMessage(lineUserId: string): Promise<Message[]> {
    try {
      // ค้นหาผู้ใช้จาก LINE User ID
      const user = await DatabaseService.getUserByLineId(lineUserId);
      if (!user) {
        return [{
          type: 'text',
          text: '❌ ไม่พบข้อมูลผู้ใช้ กรุณาลงทะเบียนก่อนใช้งาน'
        }];
      }

      const now = new Date();
      const summary = await DatabaseService.getMonthlySummary(user.id, now.getFullYear(), now.getMonth() + 1);

      const text = `📊 สรุปประจำเดือน ${now.getMonth() + 1}/${now.getFullYear()}\n\n` +
        `💰 รายรับ: ${summary.total_income.toLocaleString()} บาท\n` +
        `💸 รายจ่าย: ${summary.total_expense.toLocaleString()} บาท\n` +
        `💵 คงเหลือ: ${summary.net_amount.toLocaleString()} บาท`;

      return [
        { type: 'text', text },
        {
          type: 'template',
          altText: 'เมนูการจัดการ',
          template: {
            type: 'buttons',
            text: '🎯 ดูรายละเอียดเพิ่มเติม',
            actions: [
              {
                type: 'uri',
                label: '📊 Dashboard',
                uri: `${getBaseUrl()}/dashboard?lineUserId=${lineUserId}&auto=true`
              },
              {
                type: 'uri',
                label: '📂 หมวดหมู่',
                uri: `${getBaseUrl()}/categories?lineUserId=${lineUserId}&auto=true`
              },
              {
                type: 'uri',
                label: '💎 Premium',
                uri: `${getBaseUrl()}/premium?lineUserId=${lineUserId}&auto=true`
              }
            ]
          }
        }
      ];
    } catch (error) {
      console.error('Error getting summary:', error);
      return [{
        type: 'text',
        text: '❌ ขณะนี้ไม่สามารถดึงข้อมูลสรุปได้ กรุณาลองใหม่ในภายหลัง\n\n🐱 ฟูกุขออภัยด้วยนะ!'
      }];
    }
  }

  // ดูสรุปพร้อมปุ่ม
  static async getSummaryMessageWithButtons(lineUserId: string): Promise<Message[]> {
    try {
      // ค้นหาผู้ใช้จาก LINE User ID หรือสร้างใหม่ถ้าไม่มี
      let user = await DatabaseService.getUserByLineId(lineUserId);
      if (!user) {
        try {
          user = await DatabaseService.createUser(lineUserId);
        } catch (createError) {
          console.error('Failed to create user:', createError);
          return [{
            type: 'text',
            text: '❌ ไม่สามารถลงทะเบียนผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง'
          }];
        }
      }

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // สร้างวันที่เริ่มต้นและสิ้นสุดของเดือน
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);

      const monthlyTransactions = await DatabaseService.getUserTransactions(user.id, startDate, endDate, 1000);

      // คำนวณรายรับ-รายจ่าย แบบปลอดภัย (ป้องกัน NaN)
      let totalIncome = 0;
      let totalExpense = 0;

      if (monthlyTransactions && monthlyTransactions.length > 0) {
        // คำนวณรายรับ (จำนวนเงินเป็นบวก)
        totalIncome = monthlyTransactions
          .filter((t: Transaction) => t.amount && t.amount > 0)
          .reduce((sum: number, t: Transaction) => sum + (parseFloat(t.amount.toString()) || 0), 0);

        // คำนวณรายจ่าย (จำนวนเงินเป็นลบ แต่แสดงผลเป็นบวก)
        totalExpense = Math.abs(monthlyTransactions
          .filter((t: Transaction) => t.amount && t.amount < 0)
          .reduce((sum: number, t: Transaction) => sum + (parseFloat(t.amount.toString()) || 0), 0));
      }

      const balance = totalIncome - totalExpense;

      const message = `📊 สรุปรายรับ-รายจ่าย เดือน ${currentMonth}/${currentYear}\n\n` +
        `💰 รายรับ: +${(totalIncome || 0).toLocaleString()} บาท\n` +
        `💸 รายจ่าย: -${(totalExpense || 0).toLocaleString()} บาท\n` +
        `${balance >= 0 ? '💚' : '💔'} คงเหลือ: ${balance >= 0 ? '+' : ''}${(balance || 0).toLocaleString()} บาท\n\n` +
        `📈 รายการทั้งหมด: ${monthlyTransactions.length || 0} รายการ`;

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
                type: 'uri',
                label: '🏠 หน้าแรก',
                uri: `https://fukuneko-app.vercel.app/?lineUserId=${lineUserId}&auto=true`
              },
              {
                type: 'uri',
                label: '📊 Dashboard',
                uri: `https://fukuneko-app.vercel.app/dashboard?lineUserId=${lineUserId}&auto=true`
              },
              {
                type: 'uri',
                label: '💎 Premium',
                uri: `https://fukuneko-app.vercel.app/premium?lineUserId=${lineUserId}&auto=true`
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
            text: '🎯 จัดการข้อมูลของคุณ', actions: [
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

  // คำแนะนำการบันทึกรายรับ
  static getIncomeGuidanceMessage(): Message[] {
    return [
      {
        type: 'text',
        text: `💰 คำแนะนำการบันทึกรายรับ (+)\n\n` +
          `✨ รูปแบบที่ฟูกุเข้าใจ:\n` +
          `• "+5000 เงินเดือน"\n` +
          `• "เงินเดือน +5000"\n` +
          `• "+1000 โบนัส"\n` +
          `• "ได้รับเงิน +500"\n` +
          `• "รายได้พิเศษ +800"\n` +
          `• "ค่าคอม +300"\n\n` +
          `🎯 ระบบจัดหมวดหมู่อัตโนมัติ:\n` +
          `• เงินเดือน → หมวด "เงินเดือน"\n` +
          `• โบนัส, ค่าคอม → หมวด "รายได้พิเศษ"\n` +
          `• ลงทุน, หุ้น → หมวด "การลงทุน"\n\n` +
          `💡 เคล็ดลับ:\n` +
          `• เครื่องหมาย + หมายถึงเงินเพิ่มขึ้น\n` +
          `• ใส่จำนวนเงินและคำอธิบาย\n` +
          `• ฟูกุจะจัดหมวดหมู่ให้อัตโนมัติ\n` +
          `• แก้ไขหมวดหมู่ได้ใน Dashboard ทีหลัง`
      },
      {
        type: 'template',
        altText: 'ตัวอย่างการบันทึกรายรับ',
        template: {
          type: 'buttons',
          text: '💡 ลองบันทึกรายรับแรก (+)',
          actions: [
            {
              type: 'message',
              label: '💰 +5000 เงินเดือน',
              text: '5000 เงินเดือน'
            },
            {
              type: 'message',
              label: '🎁 +1000 โบนัส',
              text: '1000 โบนัส'
            },
            {
              type: 'message',
              label: '💼 +500 รายได้พิเศษ',
              text: '500 รายได้พิเศษ'
            }
          ]
        }
      }
    ];
  }

  // คำแนะนำการบันทึกรายจ่าย
  static getExpenseGuidanceMessage(): Message[] {
    return [
      {
        type: 'text',
        text: `💸 คำแนะนำการบันทึกรายจ่าย (-)\n\n` +
          `✨ รูปแบบที่ฟูกุเข้าใจ:\n` +
          `• "-50 ค่ากาแฟ"\n` +
          `• "ค่ากาแฟ -50"\n` +
          `• "-120 อาหารเที่ยง"\n` +
          `• "ซื้อเสื้อ -300"\n` +
          `• "จ่ายค่าไฟ -800"\n` +
          `• "ค่าน้ำมัน -1000"\n\n` +
          `🎯 ระบบจัดหมวดหมู่อัตโนมัติ:\n` +
          `• กาแฟ, ชา → หมวด "เครื่องดื่ม"\n` +
          `• อาหาร, ข้าว → หมวด "อาหาร"\n` +
          `• เสื้อ, รองเท้า → หมวด "เสื้อผ้า"\n` +
          `• ค่าไฟ, ค่าน้ำ → หมวด "ค่าใช้จ่ายบ้าน"\n` +
          `• น้ำมัน, แท็กซี่ → หมวด "เดินทาง"\n\n` +
          `💡 เคล็ดลับ:\n` +
          `• เครื่องหมาย - หมายถึงเงินลดลง\n` +
          `• ใส่จำนวนเงินและคำอธิบาย\n` +
          `• ฟูกุจะจัดหมวดหมู่ให้อัตโนมัติ\n` +
          `• แก้ไขหมวดหมู่ได้ใน Dashboard ทีหลัง`
      },
      {
        type: 'template',
        altText: 'ตัวอย่างการบันทึกรายจ่าย',
        template: {
          type: 'buttons',
          text: '💡 ลองบันทึกรายจ่ายแรก (-)',
          actions: [
            {
              type: 'message',
              label: '☕ -50 ค่ากาแฟ',
              text: '50 ค่ากาแฟ'
            },
            {
              type: 'message',
              label: '🍽️ -120 อาหารเที่ยง',
              text: '120 อาหารเที่ยง'
            },
            {
              type: 'message',
              label: '⛽ -1000 ค่าน้ำมัน',
              text: '1000 ค่าน้ำมัน'
            }
          ]
        }
      }
    ];
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
      `📝 บันทึกรายการ (🤖 จัดหมวดหมู่อัตโนมัติ!):\n` +
      `• "50 ค่ากาแฟ" - บันทึกรายจ่าย → หมวด "เครื่องดื่ม"\n` +
      `• "ค่าอาหาร 120" - บันทึกแบบกลับหน้า → หมวด "อาหาร"\n` +
      `• "500 เงินเดือน" - บันทึกรายรับ → หมวด "เงินเดือน"\n` +
      `• "ซื้อเสื้อ 300" - รายจ่าย → หมวด "เสื้อผ้า"\n` +
      `• "จ่ายค่าไฟ 800" - รายจ่าย → หมวด "ค่าใช้จ่ายบ้าน"\n\n` +
      `🎯 ระบบจัดหมวดหมู่อัตโนมัติ:\n` +
      `• 🔍 ตรวจจับรายรับ/รายจ่ายจากคำ "ซื้อ", "จ่าย", "ค่า", "ได้รับ"\n` +
      `• 📂 จัดหมวดหมู่ตามคำในข้อความ เช่น "กาแฟ" → เครื่องดื่ม\n` +
      `• ✏️ แก้ไขหมวดหมู่ได้ทีหลังใน Dashboard\n` +
      `• 📋 หมวดหมู่พื้นฐาน 16 หมวด พร้อมใช้ทันที!\n\n` +
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
      `• เพิ่ม/แก้ไขหมวดหมู่ • ตั้งงบประมาณ\n` +
      `• ดูกราฟ • จัดการรายการโดยละเอียด`;

    if (subscriptionPlan === 'free') {
      helpText += `\n\n⚠️ ฟูกุยังอยู่ในช่วงเดโม่ อาจมีบางฟีเจอร์ยังไม่สมบูรณ์`;
    }

    return [
      { type: 'text', text: helpText },
      {
        type: 'template',
        altText: 'เข้าใช้งานเว็บไซต์',
        template: {
          type: 'buttons',
          text: '🌟 เข้าใช้งานเว็บไซต์',
          actions: [
            {
              type: 'uri',
              label: '🏠 หน้าแรก',
              uri: `${getBaseUrl()}`
            },
            {
              type: 'uri',
              label: '📊 Dashboard',
              uri: `${getBaseUrl()}/dashboard`
            },
            {
              type: 'uri',
              label: '💎 Premium',
              uri: `${getBaseUrl()}/premium`
            }
          ]
        }
      }
    ];
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
      return [
        {
          type: 'text',
          text: `👑 คุณเป็นสมาชิก Premium แล้ว!\n\n` +
            `✨ ฟีเจอร์ที่คุณใช้ได้:\n` +
            pricing.premium.features.join('\n') + '\n\n' +
            `� ขอบคุณที่สนับสนุนฟูกุ! 😸`
        },
        {
          type: 'template',
          altText: 'จัดการสมาชิก Premium',
          template: {
            type: 'buttons',
            text: '⚙️ จัดการสมาชิก Premium',
            actions: [
              {
                type: 'uri',
                label: '📱 จัดการสมาชิก',
                uri: `${getBaseUrl()}/subscription`
              },
              {
                type: 'uri',
                label: '📊 Dashboard',
                uri: `${getBaseUrl()}/dashboard`
              }
            ]
          }
        }
      ];
    }

    return [
      {
        type: 'text',
        text: `📦 แพคเกจของ Fuku Neko\n\n` +
          `🆓 ${pricing.free.name} (ปัจจุบัน)\n` +
          pricing.free.features.join('\n') + '\n\n' +
          `💎 ${pricing.premium.name} - ${pricing.premium.price} บาท${pricing.premium.duration}\n` +
          pricing.premium.features.join('\n') + '\n\n' +
          `� สนับสนุนการพัฒนาฟูกุให้ดีขึ้น!`
      },
      {
        type: 'template',
        altText: 'อัปเกรด Premium',
        template: {
          type: 'buttons',
          text: '�🚀 อัปเกรดเป็น Premium',            actions: [
            {
              type: 'uri',
              label: '💎 อัปเกรด Premium',
              uri: `${getBaseUrl()}/premium`
            },
            {
              type: 'uri',
              label: '📊 ดู Dashboard',
              uri: `${getBaseUrl()}/dashboard`
            }
          ]
        }
      }
    ];
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
      `� พิเศษ! ฟูกุได้สร้างหมวดหมู่พื้นฐาน 16 หมวด พร้อมใช้งานทันทีแล้ว:\n` +
      `📂 รายรับ: เงินเดือน, โบนัส, การลงทุน, รายได้พิเศษ\n` +
      `📂 รายจ่าย: อาหาร, เครื่องดื่ม, เดินทาง, ช้อปปิ้ง และอื่นๆ\n\n` +
      `🤖 ระบบจัดหมวดหมู่อัตโนมัติ:\n` +
      `• พิมพ์ "50 ค่ากาแฟ" → อัตโนมัติไปหมวด "เครื่องดื่ม"\n` +
      `• พิมพ์ "ซื้อข้าว 80" → อัตโนมัติไปหมวด "อาหาร"\n` +
      `• พิมพ์ "500 เงินเดือน" → อัตโนมัติไปหมวด "เงินเดือน"\n\n` +
      `✨ เริ่มต้นง่ายๆ ลองพิมพ์:\n• "50 ค่ากาแฟ" - บันทึกรายจ่าย\n• "สรุป" - ดูยอดเงินเดือนนี้\n• "แมวฟรี" - รับรูปแมวน่ารัก\n• "ช่วยเหลือ" - ดูคำสั่งทั้งหมด`,

      `🐾 ยินดีที่ได้รู้จักนะครับ! 💕\n\n` +
      `🌸 ฟูกุพร้อมเป็นทั้งผู้ช่วยการเงินและเพื่อนคุยสุดน่ารักของเจ้าทาสแล้วครับ~\n\n` +
      `� ของขวัญพิเศษ! หมวดหมู่พื้นฐาน 16 หมวดพร้อมใช้แล้ว:\n` +
      `💰 รายรับ 5 หมวด: เงินเดือน, โบนัส, การลงทุน, รายได้พิเศษ, รายได้อื่นๆ\n` +
      `💸 รายจ่าย 11 หมวด: อาหาร, เครื่องดื่ม, เดินทาง, ช้อปปิ้ง และอื่นๆ\n\n` +
      `🤖 ระบบจัดหมวดหมู่อัตโนมัติใหม่:\n` +
      `• ตรวจจับรายรับ/รายจ่ายจากคำ "ซื้อ", "จ่าย", "ได้รับ"\n` +
      `• จัดหมวดหมู่ตามคำในข้อความ เช่น "กาแฟ" → เครื่องดื่ม\n` +
      `• แก้ไขหมวดหมู่ได้ทีหลังใน Dashboard\n\n` +
      `�🎭 มาลองเล่นกันเถอะ! พิมพ์:\n• "50 ค่ากาแฟ" - บันทึกรายจ่าย\n• "สรุป" - ดูสรุปเงิน\n• "แมวฟรี" - รับรูปแมว\n• "ช่วยเหลือ" - ดูคำสั่งทั้งหมด`,

      `✨ ขอบคุณมากๆ ที่ให้ฟูกุได้เป็นเพื่อนนะครับ! 🥰\n\n` +
      `🌈 ขอให้ทุกวันของเจ้าทาสเต็มไปด้วยรอยยิ้ม ความสุข และเงินทองไหลมาเทมา! เหมียว~ 💰\n\n` +
      `🎁 เริ่มต้นด้วยของขวัญพิเศษ:\n` +
      `📂 หมวดหมู่พื้นฐาน 16 หมวด พร้อมใช้ทันที!\n` +
      `🤖 ระบบจัดหมวดหมู่อัตโนมัติ - ไม่ต้องเลือกเอง!\n` +
      `💡 ตัวอย่าง: "จ่ายค่าไฟ 800" → หมวด "ค่าใช้จ่ายบ้าน"\n\n` +
      `🎪 ลองใช้งานเลย:\n• พิมพ์ "แมวฟรี" - รับรูปแมวน่ารัก! 😻\n• พิมพ์ "แมวเลีย" - ขอคำทำนายมงคล! 🔮\n• พิมพ์ "50 ค่าข้าว" - ลองบันทึกรายจ่าย! 💰\n\n` +
      `📚 พิมพ์ "ช่วยเหลือ" เพื่อดูเมนูความมหัศจรรย์ทั้งหมด!`
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

  // ⭐ เมธอดใหม่สำหรับภาพรวม
  static async getOverviewMessageWithButtons(lineUserId: string): Promise<Message[]> {
    try {
      // ค้นหาผู้ใช้จาก LINE User ID หรือสร้างใหม่ถ้าไม่มี
      let user = await DatabaseService.getUserByLineId(lineUserId);
      if (!user) {
        try {
          user = await DatabaseService.createUser(lineUserId);
        } catch (createError) {
          console.error('Failed to create user:', createError);
          return [{
            type: 'text',
            text: '❌ ไม่สามารถลงทะเบียนผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง'
          }];
        }
      }

      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // สร้างวันที่เริ่มต้นและสิ้นสุดของเดือน
      const startDate = new Date(currentYear, currentMonth - 1, 1);
      const endDate = new Date(currentYear, currentMonth, 0);

      const monthlyTransactions = await DatabaseService.getUserTransactions(user.id, startDate, endDate, 1000);
      const categories = await DatabaseService.getUserCategories(user.id);

      // คำนวณรายรับ-รายจ่าย แบบปลอดภัย
      let totalIncome = 0;
      let totalExpense = 0;

      if (monthlyTransactions && monthlyTransactions.length > 0) {
        totalIncome = monthlyTransactions
          .filter((t: Transaction) => t.amount && t.amount > 0)
          .reduce((sum: number, t: Transaction) => sum + (parseFloat(t.amount.toString()) || 0), 0);

        totalExpense = Math.abs(monthlyTransactions
          .filter((t: Transaction) => t.amount && t.amount < 0)
          .reduce((sum: number, t: Transaction) => sum + (parseFloat(t.amount.toString()) || 0), 0));
      }

      const balance = totalIncome - totalExpense;

      // สรุปแต่ละหมวดหมู่พร้อมบอกงบประมาณ
      const categoryMap = new Map<string, { total: number, count: number, budget?: number, type: string }>();
      
      monthlyTransactions.forEach((transaction: Transaction) => {
        const category = categories.find(cat => cat.id === transaction.category_id);
        const categoryName = category?.name || 'ไม่ระบุหมวดหมู่';
        const categoryType = category?.type || 'expense';
        const amount = Math.abs(parseFloat(transaction.amount?.toString() || '0'));
        
        if (!categoryMap.has(categoryName)) {
          categoryMap.set(categoryName, { 
            total: 0, 
            count: 0,
            budget: category?.budget_amount || undefined,
            type: categoryType
          });
        }
        
        const categoryData = categoryMap.get(categoryName)!;
        categoryData.total += amount;
        categoryData.count += 1;
      });

      let summaryText = `📊 ภาพรวมการเงิน เดือน ${currentMonth}/${currentYear}\n\n`;
      summaryText += `💰 รายรับ: +${(totalIncome || 0).toLocaleString()} บาท\n`;
      summaryText += `💸 รายจ่าย: -${(totalExpense || 0).toLocaleString()} บาท\n`;
      summaryText += `${balance >= 0 ? '💚' : '💔'} คงเหลือ: ${balance >= 0 ? '+' : ''}${(balance || 0).toLocaleString()} บาท\n\n`;

      // แสดงรายละเอียดแต่ละหมวดหมู่
      if (categoryMap.size > 0) {
        summaryText += `📂 สรุปแต่ละหมวดหมู่:\n`;
        
        Array.from(categoryMap.entries())
          .sort(([,a], [,b]) => b.total - a.total)
          .slice(0, 8)
          .forEach(([categoryName, data]) => {
            const typeIcon = data.type === 'income' ? '💰' : '💸';
            summaryText += `${typeIcon} ${categoryName}: ${data.total.toLocaleString()} บาท (${data.count} รายการ)`;
            
            if (data.budget && data.type === 'expense') {
              const percentage = Math.round((data.total / data.budget) * 100);
              const budgetStatus = percentage > 100 ? '⚠️ เกินงบ' : percentage > 80 ? '⚡ ใกล้หมด' : '✅ อยู่ในงบ';
              summaryText += `\n   งบประมาณ: ${data.budget.toLocaleString()} บาท (ใช้ ${percentage}%) ${budgetStatus}`;
            } else if (data.type === 'expense') {
              summaryText += `\n   ⚪ ยังไม่ได้ตั้งงบประมาณ`;
            }
            summaryText += `\n`;
          });
      }

      summaryText += `\n📈 รายการทั้งหมด: ${monthlyTransactions.length || 0} รายการ`;

      return [
        { type: 'text', text: summaryText },
        {
          type: 'template',
          altText: 'เมนูการจัดการ',
          template: {
            type: 'buttons',
            text: '🎯 ดูรายละเอียดเพิ่มเติม',
            actions: [
              {
                type: 'uri',
                label: '📊 Dashboard',
                uri: `${getBaseUrl()}/dashboard?lineUserId=${lineUserId}&auto=true`
              },
              {
                type: 'uri',
                label: '📂 หมวดหมู่',
                uri: `${getBaseUrl()}/categories?lineUserId=${lineUserId}&auto=true`
              },
              {
                type: 'uri',
                label: '💎 Premium',
                uri: `${getBaseUrl()}/premium?lineUserId=${lineUserId}&auto=true`
              }
            ]
          }
        }
      ];
    } catch (error) {
      console.error('Error getting overview:', error);
      return [{
        type: 'text',
        text: '❌ ขณะนี้ไม่สามารถดึงข้อมูลภาพรวมได้ กรุณาลองใหม่ในภายหลัง\n\n🐱 ฟูกุขออภัยด้วยนะ!'
      }];
    }
  }

  // ⭐ เมธอดใหม่สำหรับการนำทางไป Dashboard (สำหรับคำสั่ง "ภาพรวม")
  static async getDashboardNavigationMessage(lineUserId: string): Promise<Message[]> {
    return [
      {
        type: 'text',
        text: '📊 ภาพรวมการเงินของคุณ\n\n🚀 เปิดหน้า Dashboard เพื่อดูข้อมูลครบถ้วน:\n• สรุปรายรับ-รายจ่าย\n• กราฟและแผนภูมิ\n• การจัดการงบประมาณ\n• รายงานรายเดือน\n\n💡 เคล็ดลับ: เปิดในเบราว์เซอร์เพื่อประสบการณ์ที่ดีที่สุด!'
      },
      {
        type: 'template',
        altText: 'เปิดหน้าภาพรวม',
        template: {
          type: 'buttons',
          text: '🎯 เลือกหน้าที่ต้องการ',
          actions: [
            {
              type: 'uri',
              label: '📊 ภาพรวมการเงิน',
              uri: `${getBaseUrl()}/dashboard?lineUserId=${lineUserId}&auto=true`
            },
            {
              type: 'uri',
              label: '📈 ประวัติรายการ',
              uri: `${getBaseUrl()}/transactions?lineUserId=${lineUserId}&auto=true`
            },
            {
              type: 'uri',
              label: '📂 จัดการหมวดหมู่',
              uri: `${getBaseUrl()}/categories?lineUserId=${lineUserId}&auto=true`
            }
          ]
        }
      }
    ];
  }

  // ⭐ เมธอดใหม่สำหรับการนำทางไปหมวดหมู่
  static getCategoriesNavigationMessage(lineUserId: string): Message[] {
    return [
      {
        type: 'text',
        text: '📂 จัดการหมวดหมู่\n\n✨ คุณสมบัติ:\n• ดูหมวดหมู่ทั้งหมด\n• เพิ่มหมวดหมู่ใหม่\n• ตั้งงบประมาณ\n• ดูสถิติการใช้จ่าย\n\n💡 เคล็ดลับ: ตั้งงบประมาณเพื่อควบคุมการใช้จ่าย!'
      },
      {
        type: 'template',
        altText: 'เมนูหมวดหมู่',
        template: {
          type: 'buttons',
          text: '🎯 เลือกการดำเนินการ',
          actions: [
            {
              type: 'uri',
              label: '📂 จัดการหมวดหมู่',
              uri: `${getBaseUrl()}/categories?lineUserId=${lineUserId}&auto=true`
            },
            {
              type: 'uri',
              label: '📊 Dashboard',
              uri: `${getBaseUrl()}/dashboard?lineUserId=${lineUserId}&auto=true`
            },
            {
              type: 'postback',
              label: '💰 ดูสรุป',
              data: 'action=summary'
            }
          ]
        }
      }
    ];
  }

  // ⭐ เมธอดใหม่สำหรับการนำทางไปประวัติ
  static getHistoryNavigationMessage(lineUserId: string): Message[] {
    return [
      {
        type: 'text',
        text: '📜 ประวัติรายการ\n\n✨ คุณสมบัติ:\n• ดูรายการทั้งหมด\n• กรองตามวันที่\n• ค้นหารายการ\n• แก้ไขรายการ\n\n💡 เคล็ดลับ: ใช้ตัวกรองเพื่อหารายการที่ต้องการ!'
      },
      {
        type: 'template',
        altText: 'เมนูประวัติ',
        template: {
          type: 'buttons',
          text: '🎯 เลือกการดำเนินการ',
          actions: [
            {
              type: 'uri',
              label: '📜 ดูประวัติ',
              uri: `${getBaseUrl()}/transactions?lineUserId=${lineUserId}&auto=true`
            },
            {
              type: 'uri',
              label: '📊 Dashboard',
              uri: `${getBaseUrl()}/dashboard?lineUserId=${lineUserId}&auto=true`
            },
            {
              type: 'postback',
              label: '💰 ดูสรุป',
              data: 'action=summary'
            }
          ]
        }
      }
    ];
  }

  // ⭐ เมธอดใหม่สำหรับการนำทางไปตั้งค่า
  static getSettingsNavigationMessage(lineUserId: string): Message[] {
    return [
      {
        type: 'text',
        text: '⚙️ ตั้งค่าระบบ\n\n✨ คุณสมบัติ:\n• จัดการบัญชีผู้ใช้\n• ตั้งค่าการแจ้งเตือน\n• ส่งออกข้อมูล\n• ลบข้อมูล\n\n💡 เคล็ดลับ: ตั้งค่าการแจ้งเตือนเพื่อไม่ลืมบันทึกรายการ!'
      },
      {
        type: 'template',
        altText: 'เมนูตั้งค่า',
        template: {
          type: 'buttons',
          text: '🎯 เลือกการดำเนินการ',
          actions: [
            {
              type: 'uri',
              label: '⚙️ ตั้งค่าระบบ',
              uri: `${getBaseUrl()}/settings?lineUserId=${lineUserId}&auto=true`
            },
            {
              type: 'uri',
              label: '📊 Dashboard',
              uri: `${getBaseUrl()}/dashboard?lineUserId=${lineUserId}&auto=true`
            },
            {
              type: 'postback',
              label: '💰 ดูสรุป',
              data: 'action=summary'
            }
          ]
        }
      }
    ];
  }

  // ⭐ เมธอดใหม่สำหรับการนำทางไปแพคเกจ
  static getPackageNavigationMessage(lineUserId: string): Message[] {
    return [
      {
        type: 'text',
        text: '💎 แพคเกจ Premium\n\n✨ คุณสมบัติพิเศษ:\n• บันทึกรายการไม่จำกัด\n• หมวดหมู่ไม่จำกัด\n• สถิติขั้นสูง\n• การแจ้งเตือนอัตโนมัติ\n\n💰 ราคา: 99 บาท/เดือน'
      },
      {
        type: 'template',
        altText: 'เมนูแพคเกจ',
        template: {
          type: 'buttons',
          text: '🎯 เลือกการดำเนินการ',
          actions: [
            {
              type: 'uri',
              label: '💎 ดูแพคเกจ',
              uri: `${getBaseUrl()}/premium?lineUserId=${lineUserId}&auto=true`
            },
            {
              type: 'uri',
              label: '📊 Dashboard',
              uri: `${getBaseUrl()}/dashboard?lineUserId=${lineUserId}&auto=true`
            },
            {
              type: 'postback',
              label: '📋 ดูสถานะ',
              data: 'action=status'
            }
          ]
        }
      }
    ];
  }

  // ⭐ เมธอดใหม่สำหรับคำแนะนำการจดรายการ
  static getRecordGuidanceMessage(): Message[] {
    return [
      {
        type: 'text',
        text: '📝 วิธีบันทึกรายการ\n\n✨ รูปแบบที่รองรับ:\n• "50 ค่ากาแฟ" → รายจ่าย 50 บาท\n• "ค่าข้าว 80" → รายจ่าย 80 บาท\n• "500 เงินเดือน" → รายรับ 500 บาท\n• "จ่ายค่าไฟ 800" → รายจ่าย 800 บาท\n\n🤖 ระบบจะจัดหมวดหมู่ให้อัตโนมัติ!\n\n💡 เคล็ดลับ: ใส่รายละเอียดชัดเจน เพื่อให้ระบบจัดหมวดหมู่ได้แม่นยำ'
      },
      {
        type: 'template',
        altText: 'ตัวอย่างการบันทึก',
        template: {
          type: 'buttons',
          text: '📚 ดูตัวอย่างเพิ่มเติม',
          actions: [
            {
              type: 'postback',
              label: '💸 ตัวอย่างรายจ่าย',
              data: 'action=expense_examples'
            },
            {
              type: 'postback',
              label: '💰 ตัวอย่างรายรับ',
              data: 'action=income_examples'
            },
            {
              type: 'postback',
              label: '📊 ดูสรุป',
              data: 'action=summary'
            }
          ]
        }
      }
    ];
  }
}
