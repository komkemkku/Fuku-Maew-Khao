# 🐱 วิธีตั้งค่า LINE Bot อย่างง่าย

## 🚀 เริ่มต้นอย่างรวดเร็ว

### 1. เริ่มแอป
```bash
npm run dev
```

### 2. รันสคริปต์ตั้งค่า
```bash
./setup-line-bot.sh
```

สคริปต์จะ:
- ✅ ตรวจสอบว่าแอปรันอยู่
- 📥 ติดตั้ง ngrok (ถ้าไม่มี)  
- 🌐 สร้าง tunnel สำหรับ webhook
- 📋 แสดง URL ที่ต้องใส่ใน LINE Console

### 3. ตั้งค่าใน LINE Developers Console

1. เข้า [LINE Developers Console](https://developers.line.biz/console/)
2. เลือก Channel ของคุณ
3. ไปที่ **Messaging API**
4. ใส่ **Webhook URL** ที่ได้จากสคริปต์
5. เปิด **Use webhook**
6. ปิด **Auto-reply messages**

### 4. ทดสอบ

เพิ่มเพื่อน LINE Bot แล้วส่งข้อความ:
- `50 ค่ากาแฟ` - บันทึกรายจ่าย
- `สรุป` - ดูสรุปรายเดือน  
- `ช่วยเหลือ` - ดูวิธีใช้

## 🔧 ข้อมูลเพิ่มเติม

- **LINE_CHANNEL_SECRET**: ได้จาก Basic settings
- **LINE_CHANNEL_ACCESS_TOKEN**: ได้จาก Messaging API (กด Issue)
- **QR Code**: หาได้ใน Messaging API สำหรับให้ผู้ใช้แอดเพื่อน

## 🆘 แก้ปัญหา

### Bot ไม่ตอบ?
1. ตรวจสอบ Webhook URL ถูกต้องไหม
2. ดู log ใน terminal ที่รัน `npm run dev`
3. ตรวจสอบ ngrok ยังทำงานอยู่ไหม (`curl localhost:4040/api/tunnels`)
4. รัน `npm run test-webhook` เพื่อทดสอบ

### Signature error?
- ตรวจสอบ LINE_CHANNEL_SECRET ใน `.env.local`
- ตรวจสอบ Webhook URL ใน LINE Console
- Status 401 ในการทดสอบเป็นเรื่องปกติ (signature validation)

### Database error?
- ตรวจสอบ DATABASE_URL ใน `.env.local`
- ตรวจสอบการเชื่อมต่อ Supabase

## 🛠 คำสั่งที่มีประโยชน์

```bash
npm run dev          # รันแอป
npm run test-webhook # ทดสอบ webhook
npm run test-line-bot # ทดสอบ LINE Bot
npm run setup-line   # ตั้งค่า ngrok
npm run build        # build สำหรับ production
```

---

🎉 **เสร็จแล้ว!** ตอนนี้คุณมี LINE Bot ที่น่ารักแล้ว! 🐾
