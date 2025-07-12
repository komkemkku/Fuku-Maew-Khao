# 🚀 Vercel Deployment Guide

## ขั้นตอนการ Deploy ฟูกุแมวขาว บน Vercel

### 1. เตรียมพร้อม Deploy

```bash
# ตรวจสอบว่าแอปทำงานได้
npm run build
npm run start

# ตรวจสอบ environment variables
cat .env.local
```

### 2. Deploy ด้วย Vercel CLI (แนะนำ)

```bash
# ติดตั้ง Vercel CLI
npm i -g vercel

# Login เข้า Vercel
vercel login

# Deploy
vercel

# สำหรับ production
vercel --prod
```

### 3. Deploy ด้วย GitHub (ง่ายกว่า)

1. Push code ขึ้น GitHub
2. เข้า [vercel.com](https://vercel.com)
3. Import GitHub repository
4. Vercel จะ deploy อัตโนมัติ

### 4. ตั้งค่า Environment Variables

ไปที่ Vercel Dashboard → Project → Settings → Environment Variables

```
Environment Variable ที่จำเป็น:
┌─────────────────────────────┬─────────────────────────────┐
│ Name                        │ Value                       │
├─────────────────────────────┼─────────────────────────────┤
│ LINE_CHANNEL_ACCESS_TOKEN   │ ค่าจาก LINE Console          │
│ LINE_CHANNEL_SECRET         │ ค่าจาก LINE Console          │
│ DATABASE_URL                │ ค่าจาก Supabase             │
│ NEXTAUTH_URL                │ https://your-app.vercel.app │
│ NEXTAUTH_SECRET             │ random string สำหรับ auth   │
└─────────────────────────────┴─────────────────────────────┘
```

### 5. อัปเดต LINE Webhook URL

1. เข้า [LINE Developers Console](https://developers.line.biz/console/)
2. เลือก Channel ของคุณ
3. ไปที่ **Messaging API**
4. อัปเดต **Webhook URL**:
   ```
   https://your-project-name.vercel.app/api/webhook
   ```
5. กด **Verify** เพื่อทดสอบ
6. กด **Update**

### 6. ทดสอบ Production

```bash
# ทดสอบ webhook
curl -X POST https://your-project.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -H "x-line-signature: test" \
  -d '{"events":[]}'

# ควรได้ response: {"message":"Invalid signature"}
```

## 🔧 การแก้ปัญหา

### Deployment Failed
```bash
# ดู error log
vercel logs

# แก้ไขแล้ว deploy ใหม่
vercel --prod
```

### Environment Variables ไม่ทำงาน
```bash
# Pull env vars จาก Vercel
vercel env pull .env.local

# ตรวจสอบใน Vercel Dashboard
# Redeploy หลังจากเพิ่ม env vars
```

### Function Timeout
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

### Database Connection Error
- ใช้ Supabase connection pooling
- ตรวจสอบ SSL configuration
- เพิ่ม `?ssl=true` ใน DATABASE_URL

## 📊 การ Monitor

### 1. Vercel Analytics
- เปิดใช้งานใน Vercel Dashboard
- ดู performance metrics
- ตรวจสอบ function invocations

### 2. Vercel Logs
```bash
# ดู real-time logs
vercel logs --follow

# ดู logs ของ function specific
vercel logs --function=webhook
```

### 3. LINE Bot Info
```bash
# ตรวจสอบ bot info
curl -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN" \
  https://api.line.me/v2/bot/info
```

## 🎯 Best Practices สำหรับ Production

### 1. Security
- ใช้ HTTPS เสมอ (Vercel ทำให้อัตโนมัติ)
- ตรวจสอบ LINE signature
- ไม่ expose sensitive data ใน logs

### 2. Performance
- ใช้ edge functions ถ้าเป็นไปได้
- Optimize database queries
- ใช้ caching สำหรับ static data

### 3. Monitoring
- ตั้งค่า alerts สำหรับ errors
- Monitor database connection limits
- ดู function execution time

## 🚀 หลังจาก Deploy แล้ว

1. **แชร์ QR Code** ให้ผู้ใช้แอดเพื่อน
2. **ทดสอบทุกฟีเจอร์** ผ่าน LINE
3. **ดู Dashboard** ที่ https://your-app.vercel.app
4. **Monitor logs** สำหรับ errors
5. **รอ feedback** จากผู้ใช้งานจริง

---

🎉 **ยินดีด้วย!** ฟูกุแมวขาว ของคุณ online แล้ว! 🐱✨
