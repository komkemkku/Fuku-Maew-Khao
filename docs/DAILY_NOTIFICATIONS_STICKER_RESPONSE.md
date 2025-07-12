# Daily Notifications & Sticker Response Features

## ภาพรวม

เอกสารนี้อธิบายฟีเจอร์ใหม่ที่เพิ่มเข้ามาใน Fukuneko App:

1. **Daily Notifications** - ระบบส่งข้อความอัตโนมัติทุกวัน
2. **Sticker Response** - ระบบตอบกลับสติกเกอร์ด้วยข้อความน่ารักๆ
3. **Media Message Handling** - จัดการข้อความรูปภาพ, วิดีโอ, เสียง

## 🌅 Daily Notifications

### ฟีเจอร์หลัก

#### Morning Greeting (ข้อความทักทายตอนเช้า)
- **เวลา**: ทุกวันเวลา 08:00 น.
- **เนื้อหา**: 
  - ข้อความทักทายสุ่ม
  - คำทำนายประจำวันจาก FortuneService
  - Tips การใช้งาน
- **ผู้รับ**: ผู้ใช้ที่ใช้งานภายใน 30 วันที่ผ่านมา

#### Evening Digest (สรุปประจำวัน)
- **เวลา**: ทุกวันเวลา 20:00 น.
- **เนื้อหา**:
  - สรุปรายรับ-รายจ่ายวันนี้
  - จำนวนรายการที่บันทึก
  - ผลรวมสุทธิ
  - คำทำนายตอนเย็น
- **ผู้รับ**: ผู้ใช้ที่มีการใช้งาน

#### Weekly Budget Reminder (เตือนงบประมาณรายสัปดาห์)
- **เวลา**: วันอาทิตย์เวลา 18:00 น.
- **เนื้อหา**:
  - สรุปการใช้งบประมาณแต่ละหมวดหมู่
  - เปอร์เซ็นต์การใช้จ่าย
  - คำแนะนำการจัดการงบประมาณ
- **ผู้รับ**: ผู้ใช้ที่มีการตั้งงบประมาณ

### การตั้งค่า

#### Environment Variables
```env
# API Key สำหรับป้องกัน cron jobs
CRON_API_KEY=your_secret_cron_key

# LINE Bot Configuration (มีอยู่แล้ว)
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret
```

#### Cron Job URLs
```bash
# Morning Greeting (08:00 daily)
POST /api/notifications?action=morning
Header: x-api-key: your_secret_cron_key

# Evening Digest (20:00 daily)  
POST /api/notifications?action=evening
Header: x-api-key: your_secret_cron_key

# Weekly Budget Reminder (Sunday 18:00)
POST /api/notifications?action=weekly
Header: x-api-key: your_secret_cron_key
```

### การทดสอบ

#### ส่งข้อความทดสอบให้ผู้ใช้
```bash
# Morning message
POST /api/notifications?action=test&userId=LINE_USER_ID&type=morning

# Evening message
POST /api/notifications?action=test&userId=LINE_USER_ID&type=evening

# Weekly message
POST /api/notifications?action=test&userId=LINE_USER_ID&type=weekly
```

#### ตรวจสอบสถานะ
```bash
GET /api/notifications?action=status
```

## 😸 Sticker Response

### ฟีเจอร์หลัก

#### ประเภทการตอบกลับ
1. **Standard Response** - ข้อความตอบกลับธรรมดา + tips
2. **Special Response** - ข้อความ + คำทำนายจาก FortuneService (30% โอกาส)
3. **Sticker Reply** - ข้อความ + สติกเกอร์ตอบกลับ (20% โอกาส)

#### การจัดประเภทสติกเกอร์
- **Love** ❤️ - สติกเกอร์แสดงความรัก/หัวใจ
- **Happy** 😊 - สติกเกอร์แสดงความสุข/ยิ้ม
- **Sad** 😢 - สติกเกอร์แสดงความเศร้า/ร้องไห้
- **Angry** 😠 - สติกเกอร์แสดงความโกรธ/หงุดหงิด
- **Surprise** 😮 - สติกเกอร์แสดงความประหลาดใจ
- **Sleepy** 😴 - สติกเกอร์นอน/เหนื่อย
- **Food** 🍽️ - สติกเกอร์เกี่ยวกับอาหาร
- **Work** 💼 - สติกเกอร์เกี่ยวกับการทำงาน
- **General** - สติกเกอร์ทั่วไป

#### ตัวอย่างการตอบกลับ

**Love Sticker**:
```
😻 อ๊าaaaา น่ารักจัง! ฟูกุรักเจ้าทาสมากเลย~ 💕

💡 Tip: พิมพ์ 'สรุป' เพื่อดูสถานะการเงินนะ
```

**Sad Sticker**:
```
🥺 ไม่เป็นไรนะ ฟูกุอยู่ข้างๆ เจ้าทาสเสมอ...

🔮 แมวเซียมบอกว่า...
🌈 ความสุขเล็กๆ มากมายสำคัญกว่าความสุขใหญ่ๆ น้อยครั้ง

จงเก็บความคิดดีๆ นี้ไว้! ✨
```

## 📱 Media Message Handling

### ประเภทที่รองรับ
- **Image** 📸 - รูปภาพ
- **Video** 🎬 - วิดีโอ
- **Audio** 🎵 - ไฟล์เสียง
- **File** 📎 - ไฟล์ทั่วไป
- **Location** 📍 - ตำแหน่งที่อยู่

### ตัวอย่างการตอบกลับ

**Image**:
```
📸 รูปสวยมาก! ฟูกุชอบเลย~ เก็บความทรงจำดีๆ ไว้นะ

💡 พิมพ์ 'ช่วยเหลือ' เพื่อดูคำสั่งที่ฟูกุทำได้นะ!
```

## 🔧 Implementation Details

### Database Methods เพิ่มเติม

#### DatabaseService
```typescript
// ดึงผู้ใช้ทั้งหมด
static async getAllUsers(): Promise<User[]>

// ดึงผู้ใช้ที่ใช้งานภายในช่วงเวลาที่กำหนด
static async getActiveUsers(daysBack: number): Promise<User[]>
```

### Services ใหม่

#### DailyNotificationService
```typescript
// ส่งข้อความเช้า
static async sendMorningGreeting(): Promise<void>

// ส่งสรุปตอนเย็น
static async sendEveningDigest(): Promise<void>

// ส่งเตือนงบประมาณรายสัปดาห์
static async sendWeeklyBudgetReminder(): Promise<void>

// ส่งข้อความทดสอบ
static async sendTestMessage(userId: string, type: 'morning' | 'evening' | 'weekly'): Promise<void>
```

#### StickerResponseService
```typescript
// สร้างข้อความตอบกลับสติกเกอร์
static createStickerResponse(packageId?: string, stickerId?: string): Message[]

// สร้างข้อความตอบกลับแบบพิเศษ (มีคำทำนาย)
static createSpecialStickerResponse(packageId?: string, stickerId?: string): Message[]

// สร้างข้อความตอบกลับพร้อมสติกเกอร์
static createStickerReplyWithSticker(packageId?: string, stickerId?: string): Message[]
```

### LineService Methods เพิ่มเติม
```typescript
// จัดการสติกเกอร์
static handleStickerMessage(packageId: string, stickerId: string): Message[]

// จัดการ media messages
static handleMediaMessage(messageType: string): Message[]
```

## 🚀 Deployment

### Vercel Cron Jobs

สร้างไฟล์ `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/notifications?action=morning",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/notifications?action=evening", 
      "schedule": "0 20 * * *"
    },
    {
      "path": "/api/notifications?action=weekly",
      "schedule": "0 18 * * 0"
    }
  ]
}
```

### External Cron Services

#### EasyCron
```bash
# Morning - 08:00 daily
curl -X POST "https://your-domain.com/api/notifications?action=morning" \
  -H "x-api-key: your_secret_cron_key"

# Evening - 20:00 daily
curl -X POST "https://your-domain.com/api/notifications?action=evening" \
  -H "x-api-key: your_secret_cron_key"

# Weekly - Sunday 18:00
curl -X POST "https://your-domain.com/api/notifications?action=weekly" \
  -H "x-api-key: your_secret_cron_key"
```

## 📊 Analytics & Monitoring

### Logs การส่งข้อความ
```typescript
console.log('🌅 เริ่มส่งข้อความทักทายตอนเช้า...');
console.log(`✅ ส่งข้อความเช้าให้ ${user.display_name} แล้ว`);
console.log('🎉 ส่งข้อความทักทายตอนเช้าเสร็จสิ้น');
```

### Error Handling
- จัดการ rate limiting ของ LINE API
- Retry mechanism สำหรับ failed deliveries
- Graceful fallback เมื่อ database error

## 🔍 Testing

### Unit Tests
```bash
# Test sticker response
npm run test:sticker-response

# Test daily notifications
npm run test:daily-notifications

# Test media handling
npm run test:media-handling
```

### Manual Testing
```bash
# Test morning message
curl -X POST "http://localhost:3000/api/notifications?action=test&userId=YOUR_LINE_USER_ID&type=morning"

# Test sticker response
# ส่งสติกเกอร์ผ่าน LINE app และดู response
```

## 🎯 Future Enhancements

### Phase 1
- [ ] Personalized notification timing
- [ ] User preferences for notification types
- [ ] Rich message templates

### Phase 2
- [ ] Machine learning สำหรับ better sticker classification
- [ ] Custom sticker responses per user
- [ ] Voice message handling

### Phase 3
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] AI-powered financial advice

## 🛟 Support

### Common Issues

**Q: ไม่ได้รับข้อความอัตโนมัติ**
A: ตรวจสอบ:
1. Cron jobs ทำงานปกติหรือไม่
2. User อยู่ใน active users list หรือไม่
3. LINE Bot permissions ถูกต้องหรือไม่

**Q: Sticker response ไม่ทำงาน**
A: ตรวจสอบ:
1. Webhook configuration
2. StickerResponseService import ใน LineService
3. Console logs สำหรับ error messages

**Q: Performance issues**
A: พิจารณา:
1. Batch processing สำหรับ large user base
2. Queue system สำหรับ notification delivery
3. Database indexing สำหรับ active users query
