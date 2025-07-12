/**
 * Daily Notification Service
 * สำหรับส่งข้อความอัตโนมัติทุกวัน
 */

import { Client, Message } from '@line/bot-sdk';
import { DatabaseService } from './database';
import { FortuneService } from './fortune-service';

interface User {
  id: string;
  line_user_id: string;
  display_name?: string;
  subscription_plan?: string;
}

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
};

const client = new Client(lineConfig);

export class DailyNotificationService {
  /**
   * ส่งข้อความทักทายตอนเช้าให้ผู้ใช้ทุกคน
   */
  static async sendMorningGreeting(): Promise<void> {
    try {
      console.log('🌅 เริ่มส่งข้อความทักทายตอนเช้า...');
      
      // ดึงรายชื่อผู้ใช้ทั้งหมดที่ยินยอมรับการแจ้งเตือน
      const users = await this.getActiveUsers();
      
      for (const user of users) {
        try {
          const message = this.createMorningMessage(user);
          
          await client.pushMessage(user.line_user_id, message);
          
          // หน่วงเวลาเล็กน้อยเพื่อไม่ให้ rate limit
          await this.delay(100);
          
          console.log(`✅ ส่งข้อความเช้าให้ ${user.display_name || user.line_user_id} แล้ว`);
        } catch (error) {
          console.error(`❌ ไม่สามารถส่งข้อความให้ ${user.line_user_id}:`, error);
        }
      }
      
      console.log('🎉 ส่งข้อความทักทายตอนเช้าเสร็จสิ้น');
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการส่งข้อความเช้า:', error);
    }
  }

  /**
   * ส่งข้อความสรุปประจำวัน
   */
  static async sendEveningDigest(): Promise<void> {
    try {
      console.log('🌆 เริ่มส่งข้อความสรุปตอนเย็น...');
      
      const users = await this.getActiveUsers();
      
      for (const user of users) {
        try {
          const message = await this.createEveningDigestMessage(user);
          
          await client.pushMessage(user.line_user_id, message);
          await this.delay(100);
          
          console.log(`✅ ส่งสรุปตอนเย็นให้ ${user.display_name || user.line_user_id} แล้ว`);
        } catch (error) {
          console.error(`❌ ไม่สามารถส่งสรุปให้ ${user.line_user_id}:`, error);
        }
      }
      
      console.log('🎉 ส่งข้อความสรุปตอนเย็นเสร็จสิ้น');
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการส่งข้อความเย็น:', error);
    }
  }

  /**
   * ส่งเตือนงบประมาณรายสัปดาห์
   */
  static async sendWeeklyBudgetReminder(): Promise<void> {
    try {
      console.log('📊 เริ่มส่งเตือนงบประมาณรายสัปดาห์...');
      
      const users = await this.getActiveUsers();
      
      for (const user of users) {
        try {
          const message = await this.createWeeklyBudgetMessage(user);
          
          if (message) {
            await client.pushMessage(user.line_user_id, message);
            await this.delay(100);
            
            console.log(`✅ ส่งเตือนงบประมาณให้ ${user.display_name || user.line_user_id} แล้ว`);
          }
        } catch (error) {
          console.error(`❌ ไม่สามารถส่งเตือนงบประมาณให้ ${user.line_user_id}:`, error);
        }
      }
      
      console.log('🎉 ส่งเตือนงบประมาณรายสัปดาห์เสร็จสิ้น');
    } catch (error) {
      console.error('❌ เกิดข้อผิดพลาดในการส่งเตือนงบประมาณ:', error);
    }
  }

  /**
   * สร้างข้อความทักทายตอนเช้า
   */
  private static createMorningMessage(user: User): Message {
    const greetings = [
      `🌅 สวัสดีตอนเช้า ${user.display_name || 'เจ้าทาส'}! 😸`,
      `🌤️ อรุณสวัสดิ์ ${user.display_name || 'คุณ'}! วันใหม่มาแล้วนะ~`,
      `☀️ ฟูกุขอให้วันนี้เป็นวันที่ดีนะ ${user.display_name || 'เจ้าทาสที่รัก'}!`,
      `🌈 เช้าดีๆ ${user.display_name || 'คุณ'}! พร้อมทำผลงานดีๆ กันมั้ย?`,
      `🌞 รุ่งอรุณแล้ว ${user.display_name || 'เพื่อน'}! ฟูกุหวังว่าคุณจะมีความสุขวันนี้`
    ];

    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    const fortune = FortuneService.getTimeBasedFortune();
    
    const tips = [
      "💡 เคล็ดลับวันนี้: ลองบันทึกรายรับ-รายจ่ายผ่านฟูกุเลยนะ!",
      "📝 อย่าลืมติดตามงบประมาณประจำวันด้วยนะ",
      "🎯 ตั้งเป้าหมายการออมเล็กๆ สำหรับวันนี้ดูมั้ย?",
      "🌟 พิมพ์ 'สรุป' เพื่อดูสถานะการเงินได้ทุกเมื่อ",
      "😺 ฟูกุยินดีช่วยดูแลกระเป๋าเงินให้คุณเสมอ!"
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    return {
      type: 'text' as const,
      text: `${randomGreeting}\n\n${fortune}\n\n${randomTip}`
    };
  }

  /**
   * สร้างข้อความสรุปตอนเย็น
   */
  private static async createEveningDigestMessage(user: User): Promise<Message> {
    try {
      const today = new Date();
      const transactions = await DatabaseService.getUserTransactions(user.id);

      // คำนวณรายการวันนี้
      const todayTransactions = transactions?.filter(t => {
        const transactionDate = new Date(t.created_at);
        return transactionDate.toDateString() === today.toDateString();
      }) || [];

      const todayIncome = todayTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

      const todayExpense = todayTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      let summaryText = `🌆 สรุปการเงินประจำวันของ ${user.display_name || 'คุณ'}\n\n`;

      if (todayTransactions.length === 0) {
        summaryText += `📝 วันนี้ยังไม่มีการบันทึกรายการใดๆ\n\n`;
        summaryText += `💡 อย่าลืมบันทึกรายรับ-รายจ่ายนะ ฟูกุช่วยดูแลให้!`;
      } else {
        summaryText += `📊 วันนี้มีรายการทั้งหมด ${todayTransactions.length} รายการ\n`;
        
        if (todayIncome > 0) {
          summaryText += `💰 รายรับ: +${todayIncome.toLocaleString()} บาท\n`;
        }
        
        if (todayExpense > 0) {
          summaryText += `💸 รายจ่าย: -${todayExpense.toLocaleString()} บาท\n`;
        }

        const netAmount = todayIncome - todayExpense;
        summaryText += `\n📈 ผลรวมวันนี้: ${netAmount >= 0 ? '+' : ''}${netAmount.toLocaleString()} บาท`;

        if (netAmount > 0) {
          summaryText += `\n\n🎉 เก่งมาก! วันนี้มีเงินเหลือ`;
        } else if (netAmount < 0) {
          summaryText += `\n\n💪 ไม่เป็นไร พรุ่งนี้ระวังการใช้จ่ายหน่อยนะ`;
        }
      }

      // เพิ่มคำทำนายตอนเย็น
      const eveningFortune = FortuneService.getTimeBasedFortune();
      summaryText += `\n\n${eveningFortune}`;

      return {
        type: 'text' as const,
        text: summaryText
      };
    } catch (error) {
      console.error('Error creating evening digest:', error);
      return {
        type: 'text' as const,
        text: `🌆 สวัสดีตอนเย็น ${user.display_name || 'คุณ'}!\n\n${FortuneService.getTimeBasedFortune()}`
      };
    }
  }

  /**
   * สร้างข้อความเตือนงบประมาณรายสัปดาห์
   */
  private static async createWeeklyBudgetMessage(user: User): Promise<Message | null> {
    try {
      // ตรวจสอบว่าผู้ใช้มีหมวดหมู่ที่ตั้งงบประมาณไว้หรือไม่
      const categories = await DatabaseService.getUserCategories(user.id);
      const budgetCategories = categories?.filter(c => c.budget_amount && c.budget_amount > 0) || [];

      if (budgetCategories.length === 0) {
        return null; // ไม่ส่งข้อความถ้าไม่มีงบประมาณ
      }

      const today = new Date();
      const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
      
      let budgetText = `📊 สรุปงบประมาณสัปดาห์นี้\n\n`;

      for (const category of budgetCategories) {
        // คำนวณการใช้จ่ายในสัปดาห์นี้สำหรับหมวดหมู่นี้
        const weeklyTransactions = await this.getWeeklyTransactionsByCategory(user.id, category.id, weekStart);
        const weeklySpent = weeklyTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const budget = category.budget_amount || 0;
        const percentage = budget > 0 ? (weeklySpent / budget) * 100 : 0;

        budgetText += `📁 ${category.name}\n`;
        budgetText += `   ใช้ไป: ${weeklySpent.toLocaleString()} / ${budget.toLocaleString()} บาท (${percentage.toFixed(1)}%)\n`;
        
        if (percentage >= 90) {
          budgetText += `   ⚠️ ใกล้เกินงบประมาณแล้ว!\n`;
        } else if (percentage >= 70) {
          budgetText += `   🟡 ใช้ไปมากแล้วนะ\n`;
        } else {
          budgetText += `   ✅ ยังใช้ได้\n`;
        }
        budgetText += `\n`;
      }

      budgetText += `💡 พิมพ์ "งบประมาณ" เพื่อดูรายละเอียดเพิ่มเติม`;

      return {
        type: 'text' as const,
        text: budgetText
      };
    } catch (error) {
      console.error('Error creating weekly budget message:', error);
      return null;
    }
  }

  /**
   * ดึงผู้ใช้ที่ยังคงใช้งาน (ไม่รวมผู้ใช้ที่ไม่ได้ใช้งานนานเกินไป)
   */
  private static async getActiveUsers(): Promise<User[]> {
    try {
      // ดึงผู้ใช้ที่มีการใช้งานภายใน 30 วันที่ผ่านมา
      const users = await DatabaseService.getActiveUsers(30);
      return users || [];
    } catch (error) {
      console.error('Error getting active users:', error);
      return [];
    }
  }

  /**
   * ดึงรายการใน category สำหรับสัปดาห์นี้
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static async getWeeklyTransactionsByCategory(userId: string, categoryId: string, weekStart: Date): Promise<any[]> {
    try {
      const transactions = await DatabaseService.getUserTransactions(userId);
      
      return transactions?.filter(t => {
        const transactionDate = new Date(t.created_at);
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        return t.category_id === categoryId && 
               transactionDate >= weekStart && 
               transactionDate <= weekEnd &&
               t.amount < 0; // เฉพาะรายจ่าย
      }) || [];
    } catch (error) {
      console.error('Error getting weekly transactions by category:', error);
      return [];
    }
  }

  /**
   * หน่วงเวลา
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * ส่งข้อความให้ผู้ใช้คนเดียว (สำหรับทดสอบ)
   */
  static async sendTestMessage(userId: string, messageType: 'morning' | 'evening' | 'weekly'): Promise<void> {
    try {
      const user = await DatabaseService.getUserByLineId(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let message: any;
      
      switch (messageType) {
        case 'morning':
          message = this.createMorningMessage(user);
          break;
        case 'evening':
          message = await this.createEveningDigestMessage(user);
          break;
        case 'weekly':
          message = await this.createWeeklyBudgetMessage(user);
          break;
        default:
          throw new Error('Invalid message type');
      }

      if (message) {
        await client.pushMessage(userId, message);
        console.log(`✅ ส่งข้อความทดสอบ (${messageType}) ให้ ${userId} แล้ว`);
      } else {
        console.log(`ℹ️ ไม่มีข้อความ ${messageType} สำหรับส่งให้ ${userId}`);
      }
    } catch (error) {
      console.error(`❌ ไม่สามารถส่งข้อความทดสอบให้ ${userId}:`, error);
      throw error;
    }
  }
}
