# Fukuneko App 🐱💰

ระบบบอท LINE สำหรับการจัดการการเงินส่วนบุคคลแบบอัจฉริยะ พร้อมระบบคำสั่งลับ การแจ้งเตือนอัตโนมัติ และการตอบกลับสติกเกอร์

## ✨ Features

### 🔐 Secret Commands System
- คำสั่งลับสำหรับนักพัฒนาและการทดสอบ
- ระบบการยืนยันตัวตนด้วย DEV_ACCESS_KEY
- คำสั่งต่างๆ เช่น DEMO_DATA, CLEAR_DATA, SYSTEM_STATUS

### � Daily Notifications
- การแจ้งเตือนอัตโนมัติตอนเช้า พร้อมคำทำนาย
- สรุปข้อมูลการเงินตอนเย็น
- การแจ้งเตือนงบประมาณรายสัปดาห์

### 🎨 Sticker Response System  
- ตอบกลับสติกเกอร์อัตโนมัติด้วยข้อความสร้างสรรค์
- วิเคราะห์อารมณ์จากสติกเกอร์ 8 ประเภท
- การตอบกลับพิเศษแบบสุ่ม

### 💰 Financial Management
- บันทึกรายรับรายจ่าย
- การจัดการหมวดหมู่
- ระบบงบประมาณ
- รายงานทางการเงิน

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL Database
- LINE Bot Account
- Vercel Account (for deployment)

### Installation

```bash
# Clone repository
git clone <repository-url>
cd fukuneko-app

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env file with your configuration

# Check system health
npm run health

# Run development server
npm run dev
```

### Environment Configuration

สร้างไฟล์ `.env` และกรอกข้อมูลต่อไปนี้:

```env
# LINE Bot Configuration
LINE_CHANNEL_SECRET=your_channel_secret_32_chars
LINE_CHANNEL_ACCESS_TOKEN=your_long_access_token

# Database Configuration  
DATABASE_URL=postgresql://user:password@host:port/database

# Security Keys
MIGRATION_SECRET=your_migration_secret
DEV_ACCESS_KEY=your_dev_access_key
CRON_API_KEY=your_cron_api_key

# Optional LIFF Configuration
NEXT_PUBLIC_LIFF_ID=your_liff_id

# Development Configuration
DEV_LINE_USER_ID=your_line_user_id_for_testing

# Feature Toggles (optional)
ENABLE_DAILY_NOTIFICATIONS=true
ENABLE_STICKER_RESPONSE=true
ENABLE_FORTUNE_SERVICE=true

# Notification Timing (optional)
MORNING_NOTIFICATION_TIME=07:00
EVENING_NOTIFICATION_TIME=20:00
WEEKLY_NOTIFICATION_DAY=sunday
WEEKLY_NOTIFICATION_TIME=09:00

# Response Behavior (optional)
SPECIAL_RESPONSE_CHANCE=0.15
STICKER_REPLY_CHANCE=0.7
LOG_LEVEL=info
```

## 🔧 Development Scripts

```bash
# System Health Checks
npm run health              # ตรวจสอบระบบทั้งหมด
npm run health:env         # ตรวจสอบ environment variables
npm run health:db          # ตรวจสอบฐานข้อมูล
npm run health:line        # ตรวจสอบ LINE Bot

# Testing Features
npm run test:notifications  # ทดสอบระบบแจ้งเตือน
npm run test:stickers      # ทดสอบระบบตอบกลับสติกเกอร์
npm run test:secrets       # ทดสอบคำสั่งลับ

# Database Management
npm run db:migrate         # รัน database migrations
npm run db:seed           # เพิ่มข้อมูลตัวอย่าง
npm run db:reset          # รีเซ็ตฐานข้อมูล

# Development
npm run dev               # รันเซิร์ฟเวอร์พัฒนา
npm run build             # สร้าง production build
npm run start             # รันเซิร์ฟเวอร์ production

# Deployment Checks
npm run deploy:check      # ตรวจสอบก่อน deploy
npm run production:ready  # ตรวจสอบความพร้อมสำหรับ production
```

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

## 🎯 Usage Examples

### Secret Commands
```
ผู้ใช้: /secret DEMO_DATA your_dev_access_key
บอท: ✅ Demo data has been added to your account
```

### Daily Notifications
การแจ้งเตือนจะส่งอัตโนมัติตามเวลาที่กำหนด:
- เช้า 07:00 - คำทำนายและคำแนะนำ
- เย็น 20:00 - สรุปรายวัน
- อาทิตย์ 09:00 - สรุปงบประมาณรายสัปดาห์

### Sticker Responses
บอทจะตอบกลับสติกเกอร์อัตโนมัติด้วยข้อความที่เหมาะสม:
- สติกเกอร์เศร้า → ข้อความให้กำลังใจ
- สติกเกอร์รัก → ข้อความหวานๆ
- สติกเกอร์งาน → คำแนะนำการทำงาน

## 🚀 Deployment

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel --prod
   ```

3. **Configure Environment Variables**
   - ไปที่ Vercel Dashboard
   - เพิ่ม environment variables ทั้งหมด
   - Redeploy project

4. **Setup LINE Webhook**
   - URL: `https://your-app.vercel.app/api/webhook`
   - ตั้งค่าใน LINE Developers Console

### Health Monitoring

หลังจาก deploy แล้ว ให้ตรวจสอบระบบ:

```bash
# ตรวจสอบระบบทั้งหมด
npm run health

# หรือตรวจสอบแต่ละส่วน
npm run health:env
npm run health:db  
npm run health:line
```

## 📚 Project Structure

```
fukuneko-app/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── webhook/route.ts     # LINE webhook handler
│   │   │   └── notifications/route.ts # Cron job endpoint
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── lib/
│       ├── secret-commands.ts       # Secret commands system
│       ├── daily-notification.ts    # Daily notifications
│       ├── sticker-response.ts      # Sticker response system
│       ├── database.ts             # Database service
│       └── fortune.ts              # Fortune service
├── scripts/
│   ├── check-env.js               # Environment checker
│   ├── check-db.js                # Database checker
│   ├── check-line.js              # LINE Bot checker
│   └── health-check.js            # Complete health monitor
├── docs/
│   └── SETUP.md                   # Setup documentation
├── vercel.json                    # Vercel configuration
└── package.json                   # Dependencies and scripts
```

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   npm run health:db
   # ตรวจสอบ DATABASE_URL format
   # ตรวจสอบ network connectivity
   ```

2. **LINE Bot Not Responding**
   ```bash
   npm run health:line
   # ตรวจสอบ webhook URL
   # ตรวจสอบ channel access token
   ```

3. **Environment Variables Missing**
   ```bash
   npm run health:env
   # ตรวจสอบไฟล์ .env
   # ตรวจสอบ required variables
   ```

### Debug Mode

เพิ่ม environment variable สำหรับ debug:
```env
LOG_LEVEL=debug
```

## 🎨 Customization

### เพิ่มคำสั่งลับใหม่

แก้ไขไฟล์ `src/lib/secret-commands.ts`:

```typescript
const commands = {
  // ...existing commands...
  NEW_COMMAND: {
    description: 'Description of new command',
    handler: async (userId: string, args: string[]) => {
      // Implementation
      return 'Response message';
    }
  }
};
```

### ปรับการตอบกลับสติกเกอร์

แก้ไขไฟล์ `src/lib/sticker-response.ts`:

```typescript
const emotionResponses = {
  // เพิ่มอารมณ์ใหม่หรือปรับข้อความ
  newEmotion: [
    'ข้อความตอบกลับ 1',
    'ข้อความตอบกลับ 2'
  ]
};
```

## 📈 Monitoring & Analytics

### Cron Jobs Status
- Morning notifications: ทุกวัน 07:00 (GMT+7)
- Evening digest: ทุกวัน 20:00 (GMT+7)  
- Weekly budget: อาทิตย์ 09:00 (GMT+7)

### Performance Monitoring
- Database response times
- LINE API rate limits
- Webhook response times

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

หากมีปัญหาหรือข้อสงสัย:

1. ตรวจสอบ [docs/SETUP.md](docs/SETUP.md)
2. รัน `npm run health` เพื่อดูสถานะระบบ
3. ตรวจสอบ logs ใน Vercel Dashboard
4. เปิด GitHub Issue

---

🎉 **ขอให้สนุกกับการใช้งาน Fukuneko App!** 🐱💰

Env Local
# LINE Bot Credentials
LINE_CHANNEL_SECRET="5cdf0acbed0785781f7aa2274084bb99"
LINE_CHANNEL_ACCESS_TOKEN="zly6dnJR49qQJXxddh/kPtHJTp2g+SsRwpcGSyHkJ2Ik4bSeAXRnW2pgJSgbBXkx3yJKZeWS6RfXSt9zhINcACyGwgxow+88hkDMFdsU0XLPed0Hxa0WqD8A3yKIyX23fwupmZUqn4aX3ghNzNUfJAdB04t89/1O/w1cDnyilFU="

# Database Credentials
DATABASE_URL="postgresql://postgres:062191Komkem@db.lammmeiltbozgvzjyajw.supabase.co:5432/postgres"

# Fuku-Maew-Khao
