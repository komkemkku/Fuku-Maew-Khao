# 🐱 การตั้งค่า LINE Bot สำหรับฟูกุแมวขาว

## 📋 ขั้นตอนการตั้งค่า LINE Bot

### 1. สร้าง LINE Bot Channel

1. เข้าไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. เข้าสู่ระบบด้วยบัญชี LINE ของคุณ
3. สร้าง Provider ใหม่ (ถ้ายังไม่มี)
4. คลิก **Create a Messaging API channel**

### 2. กรอกข้อมูล Channel

```
Channel name: ฟูกุแมวขาว - จัดการเงินส่วนตัว
Description: แอปจัดการเงินส่วนตัวที่น่ารักที่สุด พร้อมแมวน้อยช่วยดูแลการเงินของคุณ
Category: Finance
Subcategory: Personal Finance
```

### 3. ตั้งค่า Webhook

#### URL สำหรับ Development:
```
https://your-ngrok-url.ngrok.io/api/webhook
```

#### URL สำหรับ Production (Vercel):
```
https://your-app-name.vercel.app/api/webhook
```

> **📝 หมายเหตุ**: สำหรับ Vercel, URL จะมีรูปแบบ `https://project-name-git-branch-username.vercel.app/api/webhook`

### 4. การตั้งค่าที่สำคัญ

#### ✅ เปิดใช้งาน:
- **Use webhook**: ✅ เปิด
- **Allow bot to join group chats**: ✅ เปิด (ถ้าต้องการ)
- **Auto-reply messages**: ❌ ปิด
- **Greeting messages**: ✅ เปิด

#### 🔑 ข้อมูลสำคัญที่ต้องคัดลอก:
- **Channel Secret**: จากหน้า Basic settings
- **Channel Access Token**: จากหน้า Messaging API (ต้องกด Issue ก่อน)

### 5. การทดสอบด้วย ngrok (Development)

```bash
# ติดตั้ง ngrok
npm install -g ngrok

# เริ่ม tunnel
ngrok http 3002

# คัดลอก URL ที่ได้ เช่น https://abc123.ngrok.io
# แล้วใส่ใน LINE Console: https://abc123.ngrok.io/api/webhook
```

### 6. ข้อความที่ Bot รองรับ

#### 📝 บันทึกรายจ่าย:
```
"กินข้าว 50"
"ค่าน้ำมัน 500 บาท"  
"ซื้อของ 150"
"ค่าไฟ 800 บาท"
```

#### 📊 ดูสถิติ:
```
"สถิติ"
"ยอดรวม"
"รายงาน"
```

#### ❓ ช่วยเหลือ:
```
"ช่วยเหลือ"
"help"
"วิธีใช้"
```

### 7. QR Code สำหรับเพิ่มเพื่อน

หลังจากสร้าง Channel แล้ว คุณจะได้ QR Code ที่ผู้ใช้สามารถสแกนเพื่อเพิ่มเพื่อน

### 8. การตั้งค่า Rich Menu (ตัวเลือก)

```json
{
  "size": {
    "width": 2500,
    "height": 1686
  },
  "selected": false,
  "name": "ฟูกุแมวขาว Menu",
  "chatBarText": "เมนู",
  "areas": [
    {
      "bounds": {
        "x": 0,
        "y": 0,
        "width": 833,
        "height": 843
      },
      "action": {
        "type": "message",
        "text": "สถิติ"
      }
    },
    {
      "bounds": {
        "x": 834,
        "y": 0,
        "width": 833,
        "height": 843
      },
      "action": {
        "type": "message",
        "text": "เพิ่มรายจ่าย"
      }
    },
    {
      "bounds": {
        "x": 1667,
        "y": 0,
        "width": 833,
        "height": 843
      },
      "action": {
        "type": "uri",
        "uri": "https://your-domain.com/dashboard"
      }
    }
  ]
}
```

## 🔧 การ Troubleshooting

### ปัญหาที่พบบ่อย:

1. **Bot ไม่ตอบกลับ**
   - ตรวจสอบ Webhook URL
   - ดู Console log ใน browser developer tools
   - ตรวจสอบ ngrok ยังทำงานอยู่ไหม

2. **Signature validation failed**
   - ตรวจสอบ Channel Secret ถูกต้องไหม
   - ตรวจสอบ environment variables

3. **Database connection error**
   - ตรวจสอบ DATABASE_URL
   - ตรวจสอบการเชื่อมต่อ Supabase

### การดู Log:

```bash
# ดู log จาก terminal ที่รัน Next.js
npm run dev

# หรือดูใน browser console
# เปิด Network tab เพื่อดู webhook requests
```

## 🎯 ขั้นตอนต่อไป

### Development:
1. ✅ สร้าง LINE Channel
2. ✅ ตั้งค่า Webhook URL ด้วย ngrok
3. ✅ ทดสอบการส่งข้อความ

### Production (Vercel):
1. 🚀 Deploy บน Vercel
2. ⚙️ ตั้งค่า Environment Variables
3. 🔗 อัปเดต Webhook URL ใน LINE Console
4. 🔄 ปรับแต่ง Rich Menu
5. 🔄 เพิ่มคุณสมบัติใหม่ๆ

## 🚀 การ Deploy บน Vercel

### 1. เตรียมโปรเจค
```bash
# สร้าง production build
npm run build

# ตรวจสอบว่า build สำเร็จ
npm run start
```

### 2. Deploy ผ่าน Vercel CLI
```bash
# ติดตั้ง Vercel CLI
npm i -g vercel

# Login เข้า Vercel
vercel login

# Deploy โปรเจค
vercel --prod
```

### 3. ตั้งค่า Environment Variables ใน Vercel
ไปที่ Vercel Dashboard → Settings → Environment Variables

```
LINE_CHANNEL_ACCESS_TOKEN = ค่าจาก LINE Console
LINE_CHANNEL_SECRET = ค่าจาก LINE Console  
DATABASE_URL = ค่าจาก Supabase
```

### 4. อัปเดต Webhook URL
ใน LINE Developers Console เปลี่ยน Webhook URL เป็น:
```
https://your-project.vercel.app/api/webhook
```

### 5. ทดสอบ Production
```bash
# ทดสอบ webhook บน production
curl -X POST https://your-project.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -H "x-line-signature: test" \
  -d '{"events":[]}'
```

## 🔧 การแก้ปัญหาบน Vercel

### 1. Function Timeout
เพิ่มใน `vercel.json`:
```json
{
  "functions": {
    "app/api/webhook/route.ts": {
      "maxDuration": 30
    }
  }
}
```

### 2. Environment Variables ไม่ทำงาน
- ตรวจสอบว่าตั้งค่าใน Vercel Dashboard แล้ว
- Redeploy หลังจากเพิ่ม env vars
- ใช้ `vercel env pull` เพื่อ sync local env

### 3. Database Connection Error
- ตรวจสอบ DATABASE_URL format สำหรับ serverless
- ใช้ connection pooling (เช่น Supabase Pooler)
- เพิ่ม SSL configuration ถ้าจำเป็น

### 4. Cold Start Issues
- Vercel serverless functions มี cold start
- ข้อความแรกอาจตอบช้า (ปกติ)
- ใช้ warming strategies ถ้าต้องการ

## 📱 ตัวอย่างการใช้งาน

```
ผู้ใช้: "กินข้าว 50"
Bot: "🐱 บันทึกรายจ่าย 'อาหาร' จำนวน 50 บาท เรียบร้อยแล้วนะ!"

ผู้ใช้: "สถิติ"  
Bot: "📊 สถิติการเงินของคุณวันนี้:
💰 รายจ่ายวันนี้: 250 บาท
📈 เดือนนี้: 5,500 บาท
🎯 เป้าหมาย: เหลือ 1,500 บาท"
```

---

🎉 **เสร็จแล้ว!** ตอนนี้คุณมี LINE Bot ที่พร้อมใช้งานแล้ว!
