import { Client, Message } from '@line/bot-sdk';
import { DatabaseService } from './database';
import { Category } from '@/types';
import { CatApiService } from './cat-api';
import { FortuneService } from './fortune-service';

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
};

const client = new Client(lineConfig);

export class LineService {
  static async handleMessage(userMessage: string, userId: string, displayName?: string) {
    // สร้างหรืออัปเดตผู้ใช้ในฐานข้อมูล
    const user = await DatabaseService.createUser(userId, displayName);
    
    // ประมวลผลข้อความ
    const response = await this.processUserMessage(userMessage, user.id);
    
    return response;
  }

  static async processUserMessage(message: string, userId: string): Promise<Message[]> {
    const text = message.trim().toLowerCase();

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
      return this.getHelpMessage();
    }

    // ลองแปลงเป็นรายการรับ-จ่าย
    const transaction = this.parseTransactionMessage(message);
    if (transaction) {
      try {
        // ค้นหาหมวดหมู่ที่เหมาะสม
        const categories = await DatabaseService.getUserCategories(userId);
        const category = this.findBestCategory(transaction.description || '', categories);

        // บันทึกรายการ
        await DatabaseService.createTransaction(
          userId,
          transaction.amount,
          transaction.description,
          category?.id
        );

        return [{
          type: 'text',
          text: `✅ บันทึกสำเร็จ!\n💰 จำนวน: ${transaction.amount.toLocaleString()} บาท\n📝 รายละเอียด: ${transaction.description}\n📂 หมวดหมู่: ${category?.name || 'ไม่ระบุ'}`
        }];
      } catch (error) {
        console.error('Error saving transaction:', error);
        return [{
          type: 'text',
          text: '❌ เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่อีกครั้ง'
        }];
      }
    }

    // ข้อความที่ไม่เข้าใจ
    return [{
      type: 'text',
      text: '🤔 ไม่เข้าใจข้อความนี้\n\n💡 ลองพิมพ์:\n• "แมวฟรี" - ดูรูปแมวสุ่ม 🐱\n• "แมวเลีย" - ขอคำทำนาย 🔮\n• "50 ค่ากาแฟ" - บันทึกรายจ่าย 💰\n• "สรุป" - ดูสรุปรายเดือน 📊\n• "ช่วยเหลือ" - ดูคำสั่งทั้งหมด 📝'
    }];
  }

  static parseTransactionMessage(message: string): { amount: number; description: string } | null {
    // รองรับรูปแบบต่างๆ เช่น:
    // "50 ค่ากาแฟ", "ค่ากาแฟ 50", "50", "100 บาท อาหารเย็น"
    
    const patterns = [
      /^(\d+(?:\.\d+)?)\s*บาท?\s*(.*)$/i,      // "50 บาท ค่ากาแฟ"
      /^(.+?)\s+(\d+(?:\.\d+)?)\s*บาท?$/i,     // "ค่ากาแฟ 50 บาท"
      /^(\d+(?:\.\d+)?)\s+(.+)$/,              // "50 ค่ากาแฟ"
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
      'อาหาร': ['อาหาร', 'กาแฟ', 'ข้าว', 'ของกิน', 'เครื่องดื่ม', 'ร้านอาหาร', 'ฟู้ด'],
      'เดินทาง': ['รถ', 'แท็กซี่', 'เบนซิน', 'น้ำมัน', 'รถเมล์', 'รถไฟ', 'เครื่องบิน', 'grab'],
      'ค่าใช้จ่ายบ้าน': ['ไฟ', 'น้ำ', 'เน็ต', 'ค่าบ้าน', 'ค่าไฟ', 'ค่าน้ำ', 'ค่าเช่า'],
      'ช้อปปิ้ง': ['ซื้อ', 'เสื้อผ้า', 'รองเท้า', 'เครื่องสำอาง', 'ช้อป'],
      'ความบันเทิง': ['หนัง', 'เกม', 'คอนเสิร์ต', 'ท่องเที่ยว', 'บันเทิง']
    };

    for (const category of categories) {
      if (category.type === 'expense') {
        const keywords = categoryKeywords[category.name as keyof typeof categoryKeywords];
        if (keywords && keywords.some(keyword => desc.includes(keyword))) {
          return category;
        }
      }
    }

    // ถ้าไม่เจอให้ใช้หมวดหมู่ "อื่นๆ" สำหรับรายจ่าย
    return categories.find(c => c.name === 'อื่นๆ' && c.type === 'expense');
  }

  static async getSummaryMessage(userId: string): Promise<Message[]> {
    const now = new Date();
    const summary = await DatabaseService.getMonthlySummary(userId, now.getFullYear(), now.getMonth() + 1);

    const text = `📊 สรุปประจำเดือน ${now.getMonth() + 1}/${now.getFullYear()}\n\n` +
      `💰 รายรับ: ${summary.total_income.toLocaleString()} บาท\n` +
      `💸 รายจ่าย: ${summary.total_expense.toLocaleString()} บาท\n` +
      `💵 คงเหลือ: ${summary.net_amount.toLocaleString()} บาท\n\n` +
      `📱 ดูรายละเอียดเพิ่มเติมที่ ${process.env.APP_URL}/dashboard`;

    return [{ type: 'text', text }];
  }

  static async getCategoriesMessage(userId: string): Promise<Message[]> {
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

    text += `\n📱 จัดการหมวดหมู่ที่ ${process.env.APP_URL}/dashboard`;

    return [{ type: 'text', text }];
  }

  static async getBudgetMessage(userId: string): Promise<Message[]> {
    const now = new Date();
    const budgetStatus = await DatabaseService.getBudgetStatus(userId, now.getFullYear(), now.getMonth() + 1);

    if (budgetStatus.length === 0) {
      return [{
        type: 'text',
        text: '📊 ยังไม่มีการตั้งงบประมาณ\n\n📱 ตั้งงบประมาณที่ ${process.env.APP_URL}/dashboard'
      }];
    }

    let text = `📊 สถานะงบประมาณเดือน ${now.getMonth() + 1}/${now.getFullYear()}\n\n`;

    budgetStatus.forEach(budget => {
      const percentage = Math.round(budget.percentage_used);
      const status = percentage > 100 ? '🔴' : percentage > 80 ? '🟡' : '🟢';
      
      text += `${status} ${budget.category_name}\n`;
      text += `   ใช้: ${budget.spent_amount.toLocaleString()}/${budget.budget_amount.toLocaleString()} บาท (${percentage}%)\n`;
      text += `   เหลือ: ${budget.remaining_amount.toLocaleString()} บาท\n\n`;
    });

    text += `📱 ดูรายละเอียดที่ ${process.env.APP_URL}/dashboard`;

    return [{ type: 'text', text }];
  }

  static getHelpMessage(): Message[] {
    return [{
      type: 'text',
      text: `🤖 ฟูกุแมวขาว - ผู้ช่วยการเงินส่วนตัว\n\n` +
        `🎪 ฟีเจอร์สนุกๆ:\n` +
        `• "แมวฟรี" - รูปแมวสุ่ม �\n` +
        `• "แมวเลีย" - คำทำนาย 🔮\n` +
        `• "ทำนายเงิน" - ดวงการเงิน 💰\n\n` +
        `📝 บันทึกรายการ:\n` +
        `• "50 ค่ากาแฟ"\n` +
        `• "ค่าอาหาร 120"\n` +
        `• "500 เงินเดือน"\n\n` +
        `📊 ดูข้อมูล:\n` +
        `• "สรุป" - สรุปรายเดือน\n` +
        `• "หมวดหมู่" - ดูหมวดหมู่\n` +
        `• "งบประมาณ" - สถานะงบ\n\n` +
        `📱 จัดการขั้นสูง:\n` +
        `${process.env.APP_URL}/dashboard\n\n` +
        `💎 อัปเกรดเป็น Premium:\n` +
        `• อ่านสลิปอัตโนมัติ\n` +
        `• รายงานขั้นสูง\n` +
        `• ไม่มีโฆษณา`
    }];
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

  static async replyMessage(replyToken: string, messages: Message[]) {
    try {
      await client.replyMessage(replyToken, messages);
    } catch (error) {
      console.error('Error replying message:', error);
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
}
