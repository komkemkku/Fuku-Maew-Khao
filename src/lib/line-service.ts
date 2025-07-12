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

    // ข้อความทักทาย และคุยเล่น
    const casualResponse = this.getCasualResponse(text);
    if (casualResponse) {
      return casualResponse;
    }

    // ข้อความที่ไม่เข้าใจ
    return [{
      type: 'text',
      text: '🤔 ฟูกุไม่เข้าใจข้อความนี้เลย\n\n💡 ลองพิมพ์:\n• "แมวฟรี" - ดูรูปแมวสุ่ม 🐱\n• "แมวเลีย" - ขอคำทำนาย 🔮\n• "50 ค่ากาแฟ" - บันทึกรายจ่าย 💰\n• "สรุป" - ดูสรุปรายเดือน 📊\n• "ช่วยเหลือ" - ดูคำสั่งทั้งหมด 📝\n\nหรือเจ้าทาสลองคุยเล่นกับฟูกุก็ได้นะ! 😸'
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
      text: `🤖 Fuku Neko - ผู้ช่วยการเงินส่วนตัว\n\n` +
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

  /**
   * การตอบสนองแบบคุยเล่นของฟูกุ
   */
  static getCasualResponse(text: string): Message[] | null {
    // ทักทาย
    if (/^(สวัสดี|หวัดดี|ดี|hello|hi|เฮ้|เฮย)/.test(text)) {
      const greetings = [
        '😸 นี่ฟูกุเอง! สวัสดีเจ้าทาส~',
        '🐱 หวัดดีค่ะเจ้าทาส! วันนี้จะให้ฟูกุช่วยอะไรดี?',
        '😊 สวัสดีจ้า! ฟูกุพร้อมช่วยดูแลเรื่องเงินของเจ้าทาสแล้ว!',
        '🌟 เฮ้โลเจ้าทาส! วันนี้มีอะไรสนุกๆ บ้างมั้ย?'
      ];
      return [{ type: 'text', text: greetings[Math.floor(Math.random() * greetings.length)] }];
    }

    // ถามความเป็นไป
    if (/^(เป็นไง|ยังไง|สบายดี|อยู่ไหน|ทำอะไร)/.test(text)) {
      const responses = [
        '😸 ฟูกุสบายดีค่ะ! กำลังคิดวิธีช่วยเจ้าทาสประหยัดเงินอยู่เลย',
        '🐾 ตอนนี้ฟูกุกำลังดูแลเรื่องเงินของทุกคนอยู่ค่ะ! เจ้าทาสเป็นไงบ้าง?',
        '💰 ฟูกุกำลังนับเงินให้ทุกคนอยู่เลย! วันนี้เจ้าทาสจ่ายอะไรไปบ้างมั้ย?',
        '😺 อยู่ในแอปรอช่วยเจ้าทาสค่ะ! มีรายรับรายจ่ายใหม่มาบอกฟูกุมั้ย?'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // ชื่นชม
    if (/^(เก่ง|ดี|เยี่ยม|สุดยอด|ขอบคุณ|ขอบใจ|thank|good|great|nice)/.test(text)) {
      const responses = [
        '😸 ยินดีที่ได้ช่วยเจ้าทาสค่ะ! ฟูกุอยากให้เจ้าทาสมีเงินเก็บเยอะๆ',
        '🐱 เหมียว~ ชื่นใจจัง! ฟูกุจะพยายามช่วยดูแลเงินของเจ้าทาสให้ดีที่สุด',
        '😻 ฟูกุดีใจที่เจ้าทาสพอใจค่ะ! มาดูแลเรื่องเงินด้วยกันต่อไปนะ',
        '✨ เจ้าทาสก็เก่งที่ใส่ใจเรื่องเงิน! ฟูกุภูมิใจในตัวเจ้าทาสมากเลย'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // ถามเรื่องอาหาร
    if (/^(หิว|กิน|อาหาร|ข้าว|อิ่ม|อร่อย|กาแฟ|ชา|น้ำ)/.test(text)) {
      const responses = [
        '😋 ฟูกุก็หิวปลาทูน่าเลย! แต่เจ้าทาสอย่าลืมจดรายจ่ายอาหารด้วยนะ',
        '🍽️ กินอะไรดีๆ มั้ย? อย่าลืมบอกฟูกุจำนวนเงินที่จ่ายไปด้วยล่ะ!',
        '☕ ฟูกุขอแชร์กาแฟหน่อยสิ! 😸 จ่ายเท่าไหร่มาบอกฟูกุได้เลย',
        '🐟 ฟูกุอยากกินปลาจัง! เจ้าทาสกินอะไรแล้วมาแชร์ค่าใช้จ่ายกับฟูกุสิ'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // ถามเรื่องอารมณ์
    if (/^(เศร้า|เสียใจ|เครียด|เหนื่อย|งานเยอะ|ปวดหัว|ไม่สบาย)/.test(text)) {
      const responses = [
        '😿 อ๋อ เจ้าทาสเป็นอะไรหรอ? ฟูกุอยากปลอบใจ... มาดูเงินเก็บกันเถอะ ดูแล้วจะดีขึ้น!',
        '🫂 ฟูกุเข้าใจความรู้สึกเจ้าทาส... วันยากๆ แบบนี้อย่าลืมดูแลตัวเองด้วยนะ ฟูกุคอยช่วยดูแลเรื่องเงินให้',
        '💙 ใจเย็นๆ นะเจ้าทาส ฟูกุอยู่ตรงนี้! มาดูว่าเดือนนี้เก็บเงินได้เท่าไหร่ แล้วจะรู้สึกดีขึ้น',
        '🌈 ทุกอย่างจะผ่านไปดีๆ ค่ะ! ฟูกุจะช่วยดูแลเงินให้ เจ้าทาสแค่พักผ่อนให้เพียงพอก็พอ'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // ถามเรื่องสุขภาพ
    if (/^(ป่วย|ไข้|เจ็บ|หาย|แข็งแรง|สุขภาพ|หมอ|ยา|โรงพยาบาล)/.test(text)) {
      const responses = [
        '🏥 เจ้าทาสไม่สบายหรอ? ดูแลตัวเองให้ดีนะ! อย่าลืมจดค่าหมอค่ายาด้วย',
        '💊 หายไวๆ นะเจ้าทาส! ฟูกุคิดถึง... และอย่าลืมเก็บใบเสร็จค่ารักษาไว้ด้วย',
        '❤️‍🩹 สุขภาพสำคัญที่สุดเลย! ค่าใช้จ่ายเรื่องสุขภาพถือว่าเป็นการลงทุนที่คุ้มค่านะ',
        '🌡️ ฟูกุห่วงเจ้าทาสจัง! พักผ่อนให้เพียงพอ และถ้าซื้อยามาบอกฟูกุด้วยนะ'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // ถามเรื่องงาน
    if (/^(งาน|ทำงาน|ออฟฟิศ|เพื่อนร่วมงาน|หัวหน้า|เงินเดือน|โบนัส|ลาง่าน|meeting)/.test(text)) {
      const responses = [
        '💼 งานเป็นไงบ้างเจ้าทาส? ถ้าได้เงินเดือนแล้วอย่าลืมมาอัพเดตกับฟูกุด้วยนะ!',
        '📊 หนักมั้ยงานวันนี้? ฟูกุอยากให้เจ้าทาสมีเงินเก็บเยอะๆ จากการทำงานหนัก',
        '💰 เก่งมากเลยที่ทำงานหาเงิน! มาบอกรายได้เพิ่มกับฟูกุสิ',
        '⏰ ทำงานหนักแบบนี้ อย่าลืมตั้งเป้าประหยัดเงินด้วยนะเจ้าทาส!'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // ถามเรื่องช้อปปิ้ง
    if (/^(ซื้อ|ช้อป|shopping|เสื้อผ้า|รองเท้า|กระเป๋า|เครื่องสำอาง|ของใหม่)/.test(text)) {
      const responses = [
        '🛍️ ซื้ออะไรมาหรอเจ้าทาส? ฟูกุอยากรู้ราคาด้วย! มาบันทึกรายจ่ายกันเถอะ',
        '👗 ซื้อของใหม่ใช่มั้ย? ดีจัง! อย่าลืมบอกฟูกุราคาด้วยนะ ฟูกุจะช่วยจดให้',
        '💳 ช้อปปิ้งสนุกมั้ย? แต่อย่าลืมดูยอดเงินเก็บด้วยล่ะ ฟูกุห่วงเจ้าทาส!',
        '🎁 ของใหม่น่าจะสวยมาก! มาบอกฟูกุว่าใช้เงินไปเท่าไหร่บ้าง จะได้ช่วยคำนวณงบประมาณ'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // เรื่องสภาพอากาศ
    if (/^(ฝน|หนาว|ร้อน|แดด|เมฆ|อากาศ|อุณหภูมิ|ลม|พายุ)/.test(text)) {
      const responses = [
        '🌤️ อากาศเป็นไงบ้างเจ้าทาส? ถ้าฝนตกอย่าลืมเงินค่าแท็กซี่นะ!',
        '☔ ฝนตกใหญ่หรอ? ระวังเปียกน้ำนะเจ้าทาส! ค่าร่มฉุกเฉินถ้าต้องซื้อมาบอกฟูกุ',
        '🌡️ ร้อนมากหรอ? ซื้อเครื่องดื่มเย็นๆ มั้ย? ฟูกุอยากทราบค่าใช้จ่าย!',
        '❄️ อากาศหนาวจัง! อย่าลืมดูแลสุขภาพนะ และถ้าซื้อของกันหนาวมาบอกฟูกุด้วย'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // ประโยคทั่วไป
    if (/^(ว่าไง|เป็นยังไง|มีอะไรใหม่|เล่าให้ฟัง|มีข่าว)/.test(text)) {
      const responses = [
        '😸 มีอะไรเล่าให้ฟูกุฟังมั้ย? โดยเฉพาะเรื่องรายรับรายจ่าย!',
        '🐾 วันนี้ฟูกุช่วยหลายคนดูแลเงินแล้ว! เจ้าทาสมีอะไรอัพเดตมั้ย?',
        '💭 ฟูกุคิดว่าเจ้าทาสน่าจะมีเรื่องดีๆ มาเล่า! แล้วยอดเงินเก็บเป็นไงบ้าง?',
        '📝 ฟูกุอยากฟังเรื่องราวของเจ้าทาส! ไม่ว่าจะเรื่องเงินหรือเรื่องทั่วไป'
      ];
      return [{ type: 'text', text: responses[Math.floor(Math.random() * responses.length)] }];
    }

    // แสดงความรู้สึกบวก
    if (/^(ดีใจ|มีความสุข|สนุก|happy|ดี|เย้|เยี่ยม|เฮ้)/.test(text)) {
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
