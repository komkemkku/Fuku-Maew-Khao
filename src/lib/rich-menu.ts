import { Client, RichMenu } from '@line/bot-sdk';

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!,
};

const client = new Client(lineConfig);

export class RichMenuService {
  /**
   * สร้าง Rich Menu หลักสำหรับ Fuku Neko
   */
  static async createMainRichMenu(): Promise<string> {
    const richMenu: RichMenu = {
      size: {
        width: 2500,
        height: 1686
      },
      selected: false,
      name: "Fuku Neko Main Menu",
      chatBarText: "เมนูฟูกุเนโกะ 🐱",
      areas: [
        // แถวบน - Quick Actions (3 ปุ่ม)
        {
          bounds: {
            x: 0,
            y: 0,
            width: 833,
            height: 843
          },
          action: {
            type: "message",
            text: "สรุป"
          }
        },
        {
          bounds: {
            x: 833,
            y: 0,
            width: 834,
            height: 843
          },
          action: {
            type: "message",
            text: "หมวดหมู่"
          }
        },
        {
          bounds: {
            x: 1667,
            y: 0,
            width: 833,
            height: 843
          },
          action: {
            type: "message",
            text: "งบประมาณ"
          }
        },
        // แถวล่าง - Features & Fun (4 ปุ่ม)
        {
          bounds: {
            x: 0,
            y: 843,
            width: 625,
            height: 843
          },
          action: {
            type: "message",
            text: "แมวฟรี"
          }
        },
        {
          bounds: {
            x: 625,
            y: 843,
            width: 625,
            height: 843
          },
          action: {
            type: "message",
            text: "ทำนายเงิน"
          }
        },
        {
          bounds: {
            x: 1250,
            y: 843,
            width: 625,
            height: 843
          },
          action: {
            type: "uri",
            uri: `${process.env.APP_URL}/dashboard`
          }
        },
        {
          bounds: {
            x: 1875,
            y: 843,
            width: 625,
            height: 843
          },
          action: {
            type: "message",
            text: "ช่วยเหลือ"
          }
        }
      ]
    };

    try {
      const richMenuId = await client.createRichMenu(richMenu);
      console.log('✅ Rich Menu created successfully:', richMenuId);
      return richMenuId;
    } catch (error) {
      console.error('❌ Error creating Rich Menu:', error);
      throw error;
    }
  }

  /**
   * สร้าง Rich Menu พิเศษสำหรับ Premium Users
   */
  static async createPremiumRichMenu(): Promise<string> {
    const richMenu: RichMenu = {
      size: {
        width: 2500,
        height: 1686
      },
      selected: false,
      name: "Fuku Neko Premium Menu",
      chatBarText: "เมนูพรีเมียม 👑",
      areas: [
        // แถวบน - Financial Tools (3 ปุ่ม)
        {
          bounds: {
            x: 0,
            y: 0,
            width: 833,
            height: 843
          },
          action: {
            type: "message",
            text: "สรุป"
          }
        },
        {
          bounds: {
            x: 833,
            y: 0,
            width: 834,
            height: 843
          },
          action: {
            type: "message",
            text: "รายงานขั้นสูง"
          }
        },
        {
          bounds: {
            x: 1667,
            y: 0,
            width: 833,
            height: 843
          },
          action: {
            type: "uri",
            uri: `${process.env.APP_URL}/dashboard`
          }
        },
        // แถวล่าง - Premium Features (4 ปุ่ม)
        {
          bounds: {
            x: 0,
            y: 843,
            width: 625,
            height: 843
          },
          action: {
            type: "message",
            text: "อ่านสลิป"
          }
        },
        {
          bounds: {
            x: 625,
            y: 843,
            width: 625,
            height: 843
          },
          action: {
            type: "message",
            text: "ส่งออกข้อมูล"
          }
        },
        {
          bounds: {
            x: 1250,
            y: 843,
            width: 625,
            height: 843
          },
          action: {
            type: "message",
            text: "แมวฟรี"
          }
        },
        {
          bounds: {
            x: 1875,
            y: 843,
            width: 625,
            height: 843
          },
          action: {
            type: "message",
            text: "ช่วยเหลือ"
          }
        }
      ]
    };

    try {
      const richMenuId = await client.createRichMenu(richMenu);
      console.log('✅ Premium Rich Menu created successfully:', richMenuId);
      return richMenuId;
    } catch (error) {
      console.error('❌ Error creating Premium Rich Menu:', error);
      throw error;
    }
  }

  /**
   * อัปโหลดรูปภาพ Rich Menu
   */
  static async uploadRichMenuImage(richMenuId: string, imagePath: string): Promise<void> {
    try {
      const fs = await import('fs');
      const imageBuffer = fs.readFileSync(imagePath);
      
      await client.setRichMenuImage(richMenuId, imageBuffer, 'image/png');
      console.log('✅ Rich Menu image uploaded successfully');
    } catch (error) {
      console.error('❌ Error uploading Rich Menu image:', error);
      throw error;
    }
  }

  /**
   * กำหนด Rich Menu ให้กับ User
   */
  static async setUserRichMenu(userId: string, richMenuId: string): Promise<void> {
    try {
      await client.linkRichMenuToUser(userId, richMenuId);
      console.log('✅ Rich Menu linked to user successfully');
    } catch (error) {
      console.error('❌ Error linking Rich Menu to user:', error);
      throw error;
    }
  }

  /**
   * เปลี่ยน Rich Menu ตาม Subscription Plan
   */
  static async updateUserRichMenu(userId: string, subscriptionPlan: 'free' | 'premium'): Promise<void> {
    try {
      // ลบ Rich Menu เก่า (ถ้ามี)
      try {
        await client.unlinkRichMenuFromUser(userId);
      } catch {
        // ไม่มี Rich Menu เก่า ข้ามไป
      }

      // กำหนด Rich Menu ใหม่ตาม Plan
      const richMenuId = subscriptionPlan === 'premium' 
        ? process.env.LINE_PREMIUM_RICH_MENU_ID 
        : process.env.LINE_MAIN_RICH_MENU_ID;

      if (richMenuId) {
        await this.setUserRichMenu(userId, richMenuId);
        console.log(`✅ Updated Rich Menu for ${subscriptionPlan} user:`, userId);
      }
    } catch (error) {
      console.error('❌ Error updating user Rich Menu:', error);
      throw error;
    }
  }

  /**
   * ลบ Rich Menu
   */
  static async deleteRichMenu(richMenuId: string): Promise<void> {
    try {
      await client.deleteRichMenu(richMenuId);
      console.log('✅ Rich Menu deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting Rich Menu:', error);
      throw error;
    }
  }

  /**
   * ดูรายการ Rich Menu ทั้งหมด
   */
  static async getRichMenuList(): Promise<RichMenu[]> {
    try {
      const richMenus = await client.getRichMenuList();
      console.log('📋 Rich Menu List:', richMenus);
      return richMenus;
    } catch (error) {
      console.error('❌ Error getting Rich Menu list:', error);
      throw error;
    }
  }

  /**
   * สร้าง Rich Menu แบบ Responsive Design
   */
  static generateRichMenuDesignPrompt(): string {
    return `
🎨 Rich Menu Design Specifications for Fuku Neko:

📏 Main Menu Layout (2500x1686px):
┌─────────────────────────────────────────────┐
│  📊 สรุป    │  📂 หมวดหมู่   │  💰 งบประมาณ  │ แถวบน
├─────────────┼─────────────┼─────────────┼─────────┤
│ 🐱 แมวฟรี │ 🔮 ทำนายเงิน │ 🌐 เว็บไซต์ │ ❓ ช่วย │ แถวล่าง
└─────────────────────────────────────────────┘

🎨 Design Guidelines:
• Background: Gradient สีฟ้าอ่อนถึงสีม่วงอ่อน (#E3F2FD → #F3E5F5)
• Cat Theme: ใช้สีโทนแมว (น้ำตาล, ครีม, เทา)
• Icons: Material Design หรือ Cat-themed icons
• Typography: Sarabun Regular 24px สำหรับข้อความ
• Borders: มุมโค้ง 12px radius
• Shadow: Drop shadow 0px 4px 8px rgba(0,0,0,0.1)

🎯 Button Colors:
• สรุป: #4CAF50 (เขียว)
• หมวดหมู่: #2196F3 (น้ำเงิน) 
• งบประมาณ: #FF9800 (ส้ม)
• แมวฟรี: #E91E63 (ชมพู)
• ทำนายเงิน: #9C27B0 (ม่วง)
• เว็บไซต์: #607D8B (เทา)
• ช่วยเหลือ: #795548 (น้ำตาล)

🐱 Mascot Integration:
• ใส่รูป Fuku (แมว) ในมุมต่างๆ
• Expression ต่างกันตาม function
• Size: 100x100px per icon area
    `;
  }
}

export default RichMenuService;
