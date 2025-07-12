#!/usr/bin/env node

import { config } from 'dotenv';
import RichMenuService from '../src/lib/rich-menu.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadRichMenuImages() {
  console.log('🖼️ Starting Rich Menu Image Upload...\n');

  try {
    const mainRichMenuId = process.env.LINE_MAIN_RICH_MENU_ID;
    const premiumRichMenuId = process.env.LINE_PREMIUM_RICH_MENU_ID;

    if (!mainRichMenuId || !premiumRichMenuId) {
      console.error('❌ Rich Menu IDs not found in environment variables');
      console.log('💡 Run deploy-rich-menu.mjs first to create Rich Menus');
      process.exit(1);
    }

    // Upload Main Rich Menu Image
    const mainImagePath = path.join(__dirname, '../public/images/rich-menu-main.png');
    console.log('📤 Uploading Main Rich Menu image...');
    try {
      await RichMenuService.uploadRichMenuImage(mainRichMenuId, mainImagePath);
      console.log('✅ Main Rich Menu image uploaded successfully\n');
    } catch (error) {
      console.warn('⚠️ Main Rich Menu image not found, skipping upload');
      console.log(`💡 Create image at: ${mainImagePath}\n`);
    }

    // Upload Premium Rich Menu Image
    const premiumImagePath = path.join(__dirname, '../public/images/rich-menu-premium.png');
    console.log('📤 Uploading Premium Rich Menu image...');
    try {
      await RichMenuService.uploadRichMenuImage(premiumRichMenuId, premiumImagePath);
      console.log('✅ Premium Rich Menu image uploaded successfully\n');
    } catch (error) {
      console.warn('⚠️ Premium Rich Menu image not found, skipping upload');
      console.log(`💡 Create image at: ${premiumImagePath}\n`);
    }

    console.log('🎉 Rich Menu image upload process completed!');
    console.log(`
📋 Image Requirements:
• Size: 2500 x 1686 pixels
• Format: PNG
• Max File Size: 1MB
• Color Space: RGB

🎨 Design your Rich Menu images using:
${process.env.APP_URL || 'http://localhost:3000'}/rich-menu-designer.html

📂 Save images to:
• ${mainImagePath}
• ${premiumImagePath}
    `);

  } catch (error) {
    console.error('❌ Rich Menu image upload failed:', error);
    process.exit(1);
  }
}

// Run upload
uploadRichMenuImages();
