# 🐱 Fuku Neko Rich Menu System

ระบบ Rich Menu ที่สวยงามและครอบคลุมทุกฟีเจอร์ของ Fuku Neko LINE Bot

## 📱 Rich Menu Design

### Main Rich Menu (Free Users)
```
┌─────────────────────────────────────────────┐
│  📊 สรุป    │  📂 หมวดหมู่   │  💰 งบประมาณ  │
├─────────────┼─────────────┼─────────────┼─────────┤
│ 🐱 แมวฟรี │ 🔮 ทำนายเงิน │ 🌐 เว็บไซต์ │ ❓ ช่วย │
└─────────────────────────────────────────────┘
```

### Premium Rich Menu (Premium Users)
```
┌─────────────────────────────────────────────┐
│  📊 สรุป    │  📈 รายงาน    │  🌐 เว็บไซต์  │
├─────────────┼─────────────┼─────────────┼─────────┤
│📷อ่านสลิป │ 💾 ส่งออก   │ 🐱 แมวฟรี │ ❓ ช่วย │
└─────────────────────────────────────────────┘
```

## 🎨 Design Specifications

### Image Requirements
- **Size**: 2500 x 1686 pixels
- **Aspect Ratio**: 1.48:1
- **Format**: PNG
- **Max File Size**: 1MB
- **Color Space**: RGB

### Color Palette
- **Summary**: #4CAF50 (Green)
- **Categories**: #2196F3 (Blue)
- **Budget**: #FF9800 (Orange)
- **Cat Free**: #E91E63 (Pink)
- **Fortune**: #9C27B0 (Purple)
- **Website**: #607D8B (Blue Gray)
- **Help**: #795548 (Brown)

### Typography
- **Font**: Sarabun Regular
- **Main Text**: 24px
- **Icons**: Material Design style
- **Text Color**: #FFFFFF (White)

## 🛠️ Setup & Deployment

### 1. Quick Setup (Recommended)
```bash
npm run rich-menu:all
```

### 2. Step by Step Setup
```bash
# 1. Deploy Rich Menu structures
npm run rich-menu:deploy

# 2. Upload Rich Menu images
npm run rich-menu:upload

# 3. Set default Rich Menu
npm run rich-menu:setup
```

### 3. Manual Commands
```bash
# Deploy Rich Menus
node scripts/deploy-rich-menu.mjs

# Upload images
node scripts/upload-rich-menu-images.mjs

# Set default
node scripts/set-default-rich-menu.mjs
```

## 🎨 Creating Rich Menu Images

### Method 1: Visual Designer
1. เปิด `http://localhost:3000/rich-menu-designer.html`
2. ดู Preview และ Specifications
3. สร้างรูปตาม Design Guidelines

### Method 2: Graphic Design Tools
- **Figma**: ใช้ Template 2500x1686px
- **Canva**: สร้าง Custom size
- **Photoshop**: ใช้ PSD Template

### Image Placement
```
public/images/
├── rich-menu-main.png     (Main Rich Menu)
└── rich-menu-premium.png  (Premium Rich Menu)
```

## 📋 Rich Menu Areas Mapping

### Main Rich Menu Areas
```javascript
[
  { bounds: { x: 0, y: 0, width: 833, height: 843 }, action: "สรุป" },
  { bounds: { x: 833, y: 0, width: 834, height: 843 }, action: "หมวดหมู่" },
  { bounds: { x: 1667, y: 0, width: 833, height: 843 }, action: "งบประมาณ" },
  { bounds: { x: 0, y: 843, width: 625, height: 843 }, action: "แมวฟรี" },
  { bounds: { x: 625, y: 843, width: 625, height: 843 }, action: "ทำนายเงิน" },
  { bounds: { x: 1250, y: 843, width: 625, height: 843 }, action: "เว็บไซต์" },
  { bounds: { x: 1875, y: 843, width: 625, height: 843 }, action: "ช่วยเหลือ" }
]
```

## ⚙️ Environment Variables

เพิ่มใน `.env` file:
```env
LINE_MAIN_RICH_MENU_ID=richmenu-xxxxxxxx
LINE_PREMIUM_RICH_MENU_ID=richmenu-yyyyyyyy
```

## 🔄 Auto Rich Menu Updates

Rich Menu จะอัปเดตอัตโนมัติเมื่อ:
- ผู้ใช้ใหม่เข้าใช้งาน (ได้ Main Rich Menu)
- อัปเกรดเป็น Premium (เปลี่ยนเป็น Premium Rich Menu)
- ดาวน์เกรดเป็น Free (กลับไปใช้ Main Rich Menu)

## 🎯 Rich Menu Features

### Main Menu Actions
- **📊 สรุป**: แสดงสรุปรายรับ-รายจ่ายเดือนนี้
- **📂 หมวดหมู่**: แสดงหมวดหมู่ทั้งหมด
- **💰 งบประมาณ**: แสดงสถานะงบประมาณ
- **🐱 แมวฟรี**: รับรูปแมวสุ่ม
- **🔮 ทำนายเงิน**: ดูดวงการเงิน
- **🌐 เว็บไซต์**: เปิด Dashboard (Auto-login)
- **❓ ช่วยเหลือ**: แสดงคำสั่งทั้งหมด

### Premium Menu Actions
- **📊 สรุป**: แสดงสรุปรายรับ-รายจ่าย
- **📈 รายงานขั้นสูง**: รายงานและกราฟขั้นสูง
- **🌐 เว็บไซต์**: เปิด Dashboard
- **📷 อ่านสลิป**: อ่านสลิปอัตโนมัติ
- **💾 ส่งออกข้อมูล**: ส่งออกข้อมูลทั้งหมด
- **🐱 แมวฟรี**: รับรูปแมวสุ่ม
- **❓ ช่วยเหลือ**: แสดงคำสั่งทั้งหมด

## 🧪 Testing Rich Menu

### Test User Rich Menu
```javascript
// Set Rich Menu for specific user
await LineService.setUserRichMenu(userId, richMenuId);

// Update Rich Menu by subscription plan
await LineService.updateUserRichMenu(userId, 'premium');

// Get Rich Menu list
const richMenus = await LineService.getRichMenuList();
```

## 📚 API Reference

### RichMenuService Methods
- `createMainRichMenu()`: สร้าง Main Rich Menu
- `createPremiumRichMenu()`: สร้าง Premium Rich Menu
- `uploadRichMenuImage(id, imagePath)`: อัปโหลดรูปภาพ
- `setUserRichMenu(userId, richMenuId)`: ตั้ง Rich Menu ให้ user
- `updateUserRichMenu(userId, plan)`: อัปเดต Rich Menu ตาม plan
- `deleteRichMenu(richMenuId)`: ลบ Rich Menu
- `getRichMenuList()`: ดูรายการ Rich Menu ทั้งหมด

## 🎉 Benefits

### User Experience
- ✅ ใช้งานง่าย ไม่ต้องจำคำสั่ง
- ✅ เข้าถึงฟีเจอร์ได้รวดเร็ว
- ✅ UI สวยงาม สีสันน่าดู
- ✅ แยก Premium/Free อย่างชัดเจน

### Developer Experience
- ✅ Automated deployment
- ✅ Easy image management
- ✅ Auto subscription handling
- ✅ Comprehensive testing tools

## 🔧 Troubleshooting

### Common Issues
1. **Rich Menu ไม่แสดง**: ตรวจสอบ Environment Variables
2. **รูปภาพไม่โหลด**: ตรวจสอบไฟล์ในโฟลเดอร์ public/images/
3. **ปุ่มไม่ทำงาน**: ตรวจสอบ Areas mapping ใน rich-menu.ts

### Debug Commands
```bash
# ดู Rich Menu ทั้งหมด
curl -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN" \
https://api.line.me/v2/bot/richmenu/list

# ลบ Rich Menu
curl -X DELETE -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN" \
https://api.line.me/v2/bot/richmenu/RICH_MENU_ID
```

---

Made with 💜 by Fuku Neko Team
