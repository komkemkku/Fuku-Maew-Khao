#!/bin/bash

# 🧪 ทดสอบ LINE Bot บน Production (Vercel)

echo "🐱 ทดสอบ Production LINE Bot"
echo "============================="

# รับ URL จาก argument หรือใช้ default
VERCEL_URL=${1:-"https://your-app.vercel.app"}

if [ "$VERCEL_URL" = "https://your-app.vercel.app" ]; then
    echo "❓ กรุณาใส่ URL ของ Vercel app:"
    echo "Usage: $0 https://your-project.vercel.app"
    echo ""
    echo "หรือแก้ไขในไฟล์นี้ที่บรรทัด VERCEL_URL"
    exit 1
fi

echo "🌐 ทดสอบ: $VERCEL_URL"
echo ""

# ทดสอบว่า app ทำงานไหม
echo "🔍 ตรวจสอบ app..."
if curl -s "$VERCEL_URL" > /dev/null; then
    echo "✅ App ทำงานปกติ"
else
    echo "❌ ไม่สามารถเข้าถึง app ได้"
    exit 1
fi

# ทดสอบ webhook endpoint
echo ""
echo "🧪 ทดสอบ webhook..."

RESPONSE=$(curl -s -w "%{http_code}" -X POST "$VERCEL_URL/api/webhook" \
  -H "Content-Type: application/json" \
  -H "x-line-signature: test" \
  -d '{
    "events": [{
      "type": "message", 
      "message": {
        "type": "text",
        "text": "ทดสอบ production"
      },
      "source": {
        "type": "user",
        "userId": "test-user-production"
      },
      "replyToken": "test-reply-token"
    }]
  }' 2>/dev/null)

# ดึง status code
STATUS_CODE="${RESPONSE: -3}"

echo "📝 Response Status: $STATUS_CODE"

if [ "$STATUS_CODE" = "401" ]; then
    echo "✅ Webhook ทำงานถูกต้อง (Invalid signature - ปกติสำหรับการทดสอบ)"
elif [ "$STATUS_CODE" = "200" ]; then
    echo "✅ Webhook ตอบสนองสำเร็จ"
elif [ "$STATUS_CODE" = "500" ]; then
    echo "❌ Server Error - ตรวจสอบ environment variables"
    echo "   ไปดู logs: vercel logs --function=webhook"
else
    echo "⚠️  Unexpected status: $STATUS_CODE"
fi

echo ""
echo "📋 ขั้นตอนต่อไป:"
echo "1. ตรวจสอบ Environment Variables ใน Vercel Dashboard"
echo "2. อัปเดต Webhook URL ใน LINE Console: $VERCEL_URL/api/webhook"
echo "3. ทดสอบส่งข้อความจริงผ่าน LINE Bot"

echo ""
echo "🔗 ลิงค์สำคัญ:"
echo "   - Dashboard: $VERCEL_URL/dashboard"
echo "   - Webhook: $VERCEL_URL/api/webhook"
echo "   - Vercel Logs: vercel logs --follow"
