# 🐱 ฟูกุแมวขาว - Personal Finance Manager

แอปจัดการเงินส่วนตัวที่น่ารักที่สุด พร้อมแมวน้อยช่วยดูแลการเงินของคุณผ่าน LINE Bot และ Web Dashboard ที่สวยงาม

## 🚀 เริ่มต้นใช้งาน

### 1. ติดตั้งและรันแอป
```bash
# ติดตั้ง dependencies
npm install

# รันแอป
npm run dev
```

### 2. ตั้งค่า LINE Bot (Development)
```bash
# ทดสอบ webhook ก่อน
npm run test-webhook

# ตั้งค่า ngrok และ LINE Bot
npm run setup-line
```

### 3. Deploy บน Vercel (Production)
```bash
# Build และ deploy
npm run build
npm run deploy

# ทดสอบ production
npm run test-production https://your-app.vercel.app
```

### 4. เปิดใช้งาน
- 🌐 **Web Dashboard**: 
  - Development: http://localhost:3002
  - Production: https://your-app.vercel.app
- 🤖 **LINE Bot**: สแกน QR Code จาก LINE Developers Console

## ✨ คุณสมบัติหลัก

### 🆓 ฟีเจอร์ฟรี (Free Tier)
- 📝 บันทึกรายรับ-จ่ายไม่จำกัดผ่าน LINE Bot
- 🌐 Web Dashboard ส่วนตัว
- 📊 สรุปภาพรวมพื้นฐาน
- 📂 จัดการหมวดหมู่
- 🎯 ตั้งงบประมาณ
- 🚀 ลงทะเบียนอัตโนมัติผ่าน LINE

### 💎 ฟีเจอร์พรีเมียม (Premium Tier)
- 📷 อ่านสลิปอัตโนมัติ (OCR)
- 📈 รายงานและการวิเคราะห์ขั้นสูง
- 📄 Export ข้อมูลเป็น Excel/CSV
- 👨‍👩‍👧‍👦 Family Sharing
- 🚫 ไม่มีโฆษณา

## 🏗️ สถาปัตยกรรม

- **Frontend**: Next.js 15 with TypeScript
- **Backend**: Next.js API Routes (Serverless Functions)
- **Database**: PostgreSQL (Supabase)
- **Hosting**: Vercel
- **LINE Integration**: LINE Messaging API

## 🚀 การติดตั้งและรันโปรเจกต์

### 1. Clone repository
```bash
git clone https://github.com/komkemkku/Fuku-Maew-Khao.git
cd fukuneko-app
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local` และเพิ่มค่าต่อไปนี้:

```env
# LINE Bot Configuration
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret

# Database Configuration (Supabase)
DATABASE_URL=your_postgresql_connection_string

# App Configuration
APP_URL=http://localhost:3000
```

### 4. ตั้งค่าฐานข้อมูล
รันคำสั่ง SQL ในไฟล์ `database/schema.sql` ในฐานข้อมูล PostgreSQL ของคุณ

### 5. เริ่มต้น Development Server
```bash
npm run dev
```

เปิดเบราว์เซอร์ไปที่ [http://localhost:3000](http://localhost:3000)

## 📱 การใช้งาน LINE Bot

### คำสั่งพื้นฐาน:
- **บันทึกรายการ**: `50 ค่ากาแฟ`, `ค่าอาหาร 120`, `500 เงินเดือน`
- **ดูสรุป**: `สรุป` หรือ `summary`
- **ดูหมวดหมู่**: `หมวดหมู่` หรือ `categories`
- **ดูงบประมาณ**: `งบประมาณ` หรือ `budget`
- **ความช่วยเหลือ**: `ช่วยเหลือ`, `help`, หรือ `วิธีใช้`

### รูปแบบการบันทึกรายการ:
```
50 ค่ากาแฟ
ค่าอาหาร 120 บาท
500 บาท เงินเดือน
100
```

## 🗄️ โครงสร้างฐานข้อมูล

### ตาราง `users`
- `id`: UUID (Primary Key)
- `line_user_id`: TEXT (Unique, LINE User ID)
- `display_name`: TEXT (ชื่อแสดงผล)
- `subscription_plan`: TEXT (free/premium)
- `created_at`: TIMESTAMPTZ

### ตาราง `categories`
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key → users.id)
- `name`: TEXT (ชื่อหมวดหมู่)
- `type`: TEXT (income/expense)
- `budget_amount`: NUMERIC (งบประมาณ)
- `created_at`: TIMESTAMPTZ

### ตาราง `transactions`
- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key → users.id)
- `category_id`: UUID (Foreign Key → categories.id)
- `amount`: NUMERIC (จำนวนเงิน)
- `description`: TEXT (คำอธิบาย)
- `transaction_date`: DATE (วันที่รายการ)
- `created_at`: TIMESTAMPTZ

## 📁 โครงสร้างโปรเจกต์

```
fukuneko-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── webhook/          # LINE Bot webhook
│   │   │   ├── summary/          # API สรุปรายเดือน
│   │   │   └── transactions/     # API จัดการรายการ
│   │   ├── dashboard/            # หน้า Dashboard
│   │   ├── page.tsx              # หน้าแรก (Landing page)
│   │   └── layout.tsx            # Layout หลัก
│   ├── components/
│   │   └── dashboard/
│   │       └── DashboardContent.tsx
│   ├── lib/
│   │   ├── db.ts                 # การเชื่อมต่อฐานข้อมูล
│   │   ├── database.ts           # Database service functions
│   │   └── line-service.ts       # LINE Bot service functions
│   └── types/
│       └── index.ts              # TypeScript type definitions
├── database/
│   └── schema.sql                # โครงสร้างฐานข้อมูล
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## 🔧 API Endpoints

### `/api/webhook` (POST)
- รับ webhook events จาก LINE
- ประมวลผลข้อความและตอบกลับผู้ใช้

### `/api/summary` (GET)
- ดึงสรุปรายเดือนของผู้ใช้
- Parameters: `userId`, `year`, `month`

### `/api/transactions` (GET/POST)
- GET: ดึงรายการธุรกรรมของผู้ใช้
- POST: สร้างรายการธุรกรรมใหม่

## 🚀 Deployment

### Vercel Deployment
1. Connect GitHub repository ไปยัง Vercel
2. ตั้งค่า Environment Variables ใน Vercel Dashboard
3. Deploy อัตโนมัติทุกครั้งที่ push code

### LINE Bot Setup
1. สร้าง LINE Messaging API Channel ใน [LINE Developers Console](https://developers.line.biz/)
2. ตั้งค่า Webhook URL เป็น `https://your-domain.vercel.app/api/webhook`
3. เปิดใช้งาน Webhook และ Reply messages

## 🤝 การมีส่วนร่วม

1. Fork repository
2. สร้าง feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit การเปลี่ยนแปลง (`git commit -m 'Add some AmazingFeature'`)
4. Push ไปยัง branch (`git push origin feature/AmazingFeature`)
5. สร้าง Pull Request

## 📞 ติดต่อ

- GitHub: [@komkemkku](https://github.com/komkemkku)
- Repository: [Fuku-Maew-Khao](https://github.com/komkemkku/Fuku-Maew-Khao)

## 📄 License

MIT License - ดูรายละเอียดใน [LICENSE](LICENSE) file

---

🐱 **ฟูกุแมวขาว** - ผู้ช่วยการเงินส่วนตัวที่ทำให้ชีวิตง่ายขึ้น

Env Local
# LINE Bot Credentials
LINE_CHANNEL_SECRET="5cdf0acbed0785781f7aa2274084bb99"
LINE_CHANNEL_ACCESS_TOKEN="zly6dnJR49qQJXxddh/kPtHJTp2g+SsRwpcGSyHkJ2Ik4bSeAXRnW2pgJSgbBXkx3yJKZeWS6RfXSt9zhINcACyGwgxow+88hkDMFdsU0XLPed0Hxa0WqD8A3yKIyX23fwupmZUqn4aX3ghNzNUfJAdB04t89/1O/w1cDnyilFU="

# Database Credentials
DATABASE_URL="postgresql://postgres:062191Komkem@db.lammmeiltbozgvzjyajw.supabase.co:5432/postgres"

# Fuku-Maew-Khao
