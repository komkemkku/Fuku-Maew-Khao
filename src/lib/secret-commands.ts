/**
 * Secret Commands Service
 * จัดการคำสั่งลับสำหรับการทดสอบและ development
 */

import { Message } from '@line/bot-sdk';
import { DatabaseService } from './database';

export interface SecretCommand {
  commands: string[];
  description: string;
  requiresAuth?: boolean;
  handler: (userId: string, params?: string[]) => Promise<Message[]>;
}

export class SecretCommandsService {
  private static readonly DEV_USER_IDS = [
    // เพิ่ม LINE User ID ของ Developer ที่ได้รับอนุญาต
    process.env.DEV_LINE_USER_ID || '',
    // เพิ่ม User ID อื่นๆ ตามต้องการ
  ].filter(id => id.length > 0);

  private static readonly commands: Record<string, SecretCommand> = {
    // คำสั่งสร้างข้อมูลทดสอบ
    DEMO_DATA: {
      commands: ['#demo-data', '#dev-create-demo-data', '#create-demo'],
      description: 'สร้างข้อมูลทดสอบ (Demo transactions)',
      requiresAuth: true,
      handler: async (userId: string) => {
        try {
          const demoTransactions = await this.createDemoData(userId);
          return [{
            type: 'text',
            text: `🛠️ [DEV MODE] สร้าง Demo Data สำเร็จ!\n\n📊 สร้างรายการตัวอย่าง ${demoTransactions.length} รายการ\n\n💡 ลองพิมพ์ "สรุป" เพื่อดูผลลัพธ์`
          }];
        } catch (error) {
          console.error('Error creating demo data:', error);
          return [{
            type: 'text',
            text: '❌ [DEV MODE] เกิดข้อผิดพลาดในการสร้าง Demo Data'
          }];
        }
      }
    },

    // คำสั่งลบข้อมูลทั้งหมด
    CLEAR_DATA: {
      commands: ['#clear-data', '#dev-clear-all-data', '#clear-all'],
      description: 'ลบข้อมูลทั้งหมดของผู้ใช้',
      requiresAuth: true,
      handler: async (userId: string) => {
        try {
          await DatabaseService.clearUserTransactions(userId);
          return [{
            type: 'text',
            text: `🛠️ [DEV MODE] ลบข้อมูลทั้งหมดสำเร็จ!\n\n🗑️ ลบรายการทั้งหมดแล้ว\n\n💡 ลองพิมพ์ "#demo-data" เพื่อสร้างข้อมูลตัวอย่างใหม่`
          }];
        } catch (error) {
          console.error('Error clearing data:', error);
          return [{
            type: 'text',
            text: '❌ [DEV MODE] เกิดข้อผิดพลาดในการลบข้อมูล'
          }];
        }
      }
    },

    // คำสั่งทดสอบข้อความต้อนรับ
    TEST_WELCOME: {
      commands: ['#test-welcome', '#dev-test-welcome', '#welcome-test'],
      description: 'ทดสอบข้อความต้อนรับผู้ใช้ใหม่',
      requiresAuth: false,
      handler: async () => {
        return this.getWelcomeTestMessage();
      }
    },

    // คำสั่งอัปเกรด Premium (สำหรับทดสอบ)
    UPGRADE_PREMIUM: {
      commands: ['#upgrade-premium', '#demo-premium', '#test-premium'],
      description: 'อัปเกรดเป็น Premium (ทดสอบ)',
      requiresAuth: false,
      handler: async (userId: string) => {
        try {
          await DatabaseService.upgradeToPremium(userId, 12);
          return [{
            type: 'text',
            text: '🎉 [DEV MODE] อัปเกรดเป็น Premium สำเร็จ!\n\n✨ คุณสามารถใช้งานฟีเจอร์ Premium ได้แล้ว\n\n💡 ลองพิมพ์ "สรุป" เพื่อดูฟีเจอร์ใหม่'
          }];
        } catch (error) {
          console.error('Error upgrading to premium:', error);
          return [{
            type: 'text',
            text: '❌ [DEV MODE] เกิดข้อผิดพลาดในการอัปเกรด Premium'
          }];
        }
      }
    },

    // คำสั่งดูสถานะระบบ
    SYSTEM_STATUS: {
      commands: ['#status', '#system-status', '#dev-status'],
      description: 'ดูสถานะระบบและข้อมูลผู้ใช้',
      requiresAuth: true,
      handler: async (userId: string) => {
        try {
          const user = await DatabaseService.getUserByLineId(userId);
          const transactions = await DatabaseService.getUserTransactions(userId);
          const categories = await DatabaseService.getUserCategories(userId);
          
          return [{
            type: 'text',
            text: `🛠️ [DEV MODE] สถานะระบบ\n\n👤 User ID: ${userId}\n📊 Subscription: ${user?.subscription_plan || 'unknown'}\n💰 Transactions: ${transactions?.length || 0} รายการ\n📁 Categories: ${categories?.length || 0} หมวดหมู่\n\n🔧 Environment: ${process.env.NODE_ENV || 'development'}`
          }];
        } catch (error) {
          console.error('Error getting system status:', error);
          return [{
            type: 'text',
            text: '❌ [DEV MODE] เกิดข้อผิดพลาดในการดูสถานะระบบ'
          }];
        }
      }
    },

    // คำสั่งดูรายการคำสั่งทั้งหมด
    HELP: {
      commands: ['#help', '#dev-help', '#commands'],
      description: 'ดูรายการคำสั่งลับทั้งหมด',
      requiresAuth: false,
      handler: async () => {
        const commandList = Object.values(this.commands)
          .map((cmd) => `${cmd.commands[0]} - ${cmd.description}`)
          .join('\n');

        return [{
          type: 'text',
          text: `🛠️ [DEV MODE] รายการคำสั่งลับ\n\n${commandList}\n\n🔒 คำสั่งที่มี [AUTH] ต้องการสิทธิ์ Developer`
        }];
      }
    }
  };

  /**
   * ตรวจสอบว่าข้อความเป็นคำสั่งลับหรือไม่
   */
  static isSecretCommand(text: string): boolean {
    const normalizedText = text.trim().toLowerCase();
    return Object.values(this.commands).some(cmd => 
      cmd.commands.some(command => command.toLowerCase() === normalizedText)
    );
  }

  /**
   * ประมวลผลคำสั่งลับ
   */
  static async processSecretCommand(text: string, userId: string): Promise<Message[] | null> {
    const normalizedText = text.trim().toLowerCase();
    
    // หาคำสั่งที่ตรงกัน
    const command = Object.values(this.commands).find(cmd => 
      cmd.commands.some(command => command.toLowerCase() === normalizedText)
    );

    if (!command) {
      return null;
    }

    // ตรวจสอบสิทธิ์การใช้งาน
    if (command.requiresAuth && !this.isAuthorizedUser(userId)) {
      return [{
        type: 'text',
        text: '🔒 [DEV MODE] คำสั่งนี้ต้องการสิทธิ์ Developer เท่านั้น'
      }];
    }

    // รันคำสั่ง
    try {
      return await command.handler(userId);
    } catch (error) {
      console.error(`Error executing secret command ${normalizedText}:`, error);
      return [{
        type: 'text',
        text: `❌ [DEV MODE] เกิดข้อผิดพลาดในการรันคำสั่ง: ${normalizedText}`
      }];
    }
  }

  /**
   * ตรวจสอบว่าผู้ใช้มีสิทธิ์ใช้คำสั่งที่ต้องการ auth หรือไม่
   */
  private static isAuthorizedUser(userId: string): boolean {
    // อนุญาตทุกคนใน development mode
    if (process.env.NODE_ENV === 'development') {
      return true;
    }

    // ตรวจสอบจาก DEV_USER_IDS ใน production
    return this.DEV_USER_IDS.includes(userId);
  }

  /**
   * สร้างข้อมูลทดสอบ
   */
  private static async createDemoData(userId: string) {
    const categories = await DatabaseService.getUserCategories(userId);
    const demoTransactions = [];

    // สร้างรายการตัวอย่าง
    const sampleTransactions = [
      { amount: -350, description: 'ข้าวผัดกะเพรา', category: 'อาหาร' },
      { amount: -50, description: 'กาแฟเย็น', category: 'เครื่องดื่ม' },
      { amount: -1200, description: 'ค่าเดินทาง BTS', category: 'การเดินทาง' },
      { amount: 5000, description: 'เงินเดือน', category: 'รายได้' },
      { amount: -2500, description: 'ค่าไฟฟ้า', category: 'ค่าใช้จ่ายบ้าน' },
      { amount: -180, description: 'ซื้อขนม', category: 'อาหาร' },
      { amount: -890, description: 'ค่ามือถือ', category: 'ค่าสื่อสาร' },
      { amount: -250, description: 'ค่าน้ำมันรถ', category: 'การเดินทาง' }
    ];

    for (const transaction of sampleTransactions) {
      let categoryId = categories.find((c: { id: string; name: string }) => c.name === transaction.category)?.id;
      
      // หากไม่มีหมวดหมู่ ให้สร้างใหม่
      if (!categoryId) {
        const categoryType = transaction.amount > 0 ? 'income' : 'expense';
        const newCategory = await DatabaseService.createCategory(userId, transaction.category, categoryType);
        categoryId = newCategory.id;
      }

      const newTransaction = await DatabaseService.createTransaction(
        userId,
        transaction.amount,
        transaction.description,
        categoryId
      );
      demoTransactions.push(newTransaction);
    }

    return demoTransactions;
  }

  /**
   * ข้อความทดสอบการต้อนรับ
   */
  private static getWelcomeTestMessage(): Message[] {
    const greetings = [
      "สวัสดีครับ! 😸",
      "หวัดดีครับ! 🐱",
      "ยินดีต้อนรับครับ! 😺",
      "สวัสดีค่ะ! 😻",
      "หวัดดีค่ะ! 😽"
    ];

    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];

    return [{
      type: 'text',
      text: `🛠️ [DEV MODE] ทดสอบข้อความต้อนรับผู้ใช้ใหม่\n\n${randomGreeting}\n\n🔧 นี่คือข้อความที่ผู้ใช้ใหม่จะได้รับเมื่อเพิ่มฟูกุเป็นเพื่อน`
    }];
  }

  /**
   * เพิ่มคำสั่งลับใหม่
   */
  static addCustomCommand(_key: string, command: SecretCommand): void {
    // Store command in runtime registry if needed  
    console.log('Adding custom command:', command.description);
  }

  /**
   * ดูรายการคำสั่งทั้งหมด (สำหรับ admin)
   */
  static getAllCommands(): Record<string, SecretCommand> {
    return { ...this.commands };
  }
}
