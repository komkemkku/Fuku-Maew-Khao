#!/bin/bash

# 🧪 ทดสอบ LINE Bot Webhook อย่างง่าย

echo "🐱 ทดสอบ LINE Bot Webhook"
echo "========================="

# ตรวจสอบว่าแอปรันอยู่ไหม
if ! curl -s http://localhost:3002 > /dev/null; then
    echo "❌ แอปไม่ได้รันอยู่บนพอร์ต 3002"
    echo "กรุณารัน: npm run dev"
    exit 1
fi

echo "✅ แอปรันอยู่บนพอร์ต 3002"

# ทดสอบ webhook endpoint
echo ""
echo "🧪 ทดสอบ webhook..."

# ทดสอบข้อความ "ช่วยเหลือ"
echo "📝 ทดสอบข้อความ: 'ช่วยเหลือ'"
RESPONSE=$(curl -s -w "%{http_code}" -X POST http://localhost:3002/api/webhook \
  -H "Content-Type: application/json" \
  -H "x-line-signature: test" \
  -d '{
    "events": [{
      "type": "message",
      "message": {
        "type": "text",
        "text": "ช่วยเหลือ"
      },
      "source": {
        "type": "user",
        "userId": "test-user-123"
      },
      "replyToken": "test-reply-token"
    }]
  }' 2>/dev/null)

# ดึง status code
STATUS_CODE="${RESPONSE: -3}"

if [ "$STATUS_CODE" = "401" ]; then
    echo "✅ Webhook ทำงานถูกต้อง (Invalid signature - นี่คือพฤติกรรมที่ถูกต้อง)"
elif [ "$STATUS_CODE" = "200" ]; then
    echo "✅ Webhook ทำงานได้ (Status: 200)"
else
    echo "❌ เกิดข้อผิดพลาด (Status: $STATUS_CODE)"
fi

echo ""
echo "📋 ขั้นตอนต่อไป:"
echo "1. ใช้ ngrok เพื่อเปิด tunnel: npm run setup-line"
echo "2. ไปตั้งค่าใน LINE Developers Console"
echo "3. ทดสอบส่งข้อความจริงผ่าน LINE"

echo ""
echo "🔗 ลิงค์สำคัญ:"
echo "   - LINE Console: https://developers.line.biz/console/"
echo "   - Webhook URL: YOUR_NGROK_URL/api/webhook"
echo "   - Dashboard: http://localhost:3002/dashboard"
