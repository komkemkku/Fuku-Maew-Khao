#!/usr/bin/env node

import { config } from 'dotenv';
import RichMenuService from '../src/lib/rich-menu.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function deployRichMenus() {
  console.log('🚀 Starting Fuku Neko Rich Menu Deployment...\n');

  try {
    // 1. สร้าง Main Rich Menu (Free Users)
    console.log('📱 Creating Main Rich Menu...');
    const mainRichMenuId = await RichMenuService.createMainRichMenu();
    console.log(`✅ Main Rich Menu ID: ${mainRichMenuId}\n`);

    // 2. สร้าง Premium Rich Menu
    console.log('👑 Creating Premium Rich Menu...');
    const premiumRichMenuId = await RichMenuService.createPremiumRichMenu();
    console.log(`✅ Premium Rich Menu ID: ${premiumRichMenuId}\n`);

    // 3. บันทึก Rich Menu IDs
    console.log('💾 Saving Rich Menu IDs to environment...');
    console.log(`
📋 Add these to your .env file:
LINE_MAIN_RICH_MENU_ID=${mainRichMenuId}
LINE_PREMIUM_RICH_MENU_ID=${premiumRichMenuId}
    `);

    // 4. แสดงข้อมูล Rich Menu
    console.log('📋 Rich Menu List:');
    const richMenus = await RichMenuService.getRichMenuList();
    richMenus.forEach((menu, index) => {
      console.log(`${index + 1}. ${menu.name} (ID: ${menu.richMenuId})`);
    });

    console.log('\n🎉 Rich Menu deployment completed successfully!');
    console.log(`
🎨 Next Steps:
1. Create Rich Menu images (2500x1686px) using the designer: 
   ${process.env.APP_URL || 'http://localhost:3000'}/rich-menu-designer.html

2. Upload images using:
   node scripts/upload-rich-menu-images.js

3. Set default Rich Menu for users:
   node scripts/set-default-rich-menu.js

📱 Rich Menu Features:
┌─ Main Menu (Free) ─────────────────────┐
│ 📊 สรุป    │ 📂 หมวดหมู่   │ 💰 งบประมาณ │
├───────────────────────────────────────┤
│🐱แมวฟรี│🔮ทำนายเงิน│🌐เว็บไซต์│❓ช่วย│
└─────────────────────────────────────────┘

┌─ Premium Menu (👑) ────────────────────┐
│ 📊 สรุป    │ 📈 รายงาน    │ 🌐 เว็บไซต์ │
├───────────────────────────────────────┤
│📷อ่านสลิป│💾ส่งออก│🐱แมวฟรี│❓ช่วย│
└─────────────────────────────────────────┘
    `);

  } catch (error) {
    console.error('❌ Rich Menu deployment failed:', error);
    process.exit(1);
  }
}

// Run deployment
deployRichMenus();
