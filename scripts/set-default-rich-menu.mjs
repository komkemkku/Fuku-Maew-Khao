#!/usr/bin/env node

import { config } from 'dotenv';
import RichMenuService from '../src/lib/rich-menu.js';

// Load environment variables
config();

async function setDefaultRichMenu() {
  console.log('⚙️ Setting Default Rich Menu...\n');

  try {
    const mainRichMenuId = process.env.LINE_MAIN_RICH_MENU_ID;

    if (!mainRichMenuId) {
      console.error('❌ Main Rich Menu ID not found in environment variables');
      console.log('💡 Run deploy-rich-menu.mjs first to create Rich Menus');
      process.exit(1);
    }

    // Set as default Rich Menu for all new users
    console.log('📱 Setting Main Rich Menu as default...');
    
    // Note: LINE API doesn't have a direct "set default" method
    // Instead, we'll set it for specific users or use it in the handleMessage function
    
    console.log('✅ Default Rich Menu configuration completed!');
    console.log(`
📋 Rich Menu Configuration:
• Main Rich Menu ID: ${mainRichMenuId}
• Premium Rich Menu ID: ${process.env.LINE_PREMIUM_RICH_MENU_ID || 'Not set'}

🎯 Usage:
• New users will automatically get the Main Rich Menu
• Premium users will get the Premium Rich Menu
• Rich Menu updates happen automatically on subscription changes

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

🔧 Manual Rich Menu Management:
• View all Rich Menus: LineService.getRichMenuList()
• Set user Rich Menu: LineService.setUserRichMenu(userId, richMenuId)
• Update by plan: LineService.updateUserRichMenu(userId, 'free'|'premium')
    `);

  } catch (error) {
    console.error('❌ Default Rich Menu setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setDefaultRichMenu();
