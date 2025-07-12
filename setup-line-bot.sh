#!/bin/bash

# 🐱 สคริปต์สำหรับตั้งค่าและทดสอบ LINE Bot

echo "🐱 ฟูกุแมวขาว - การตั้งค่า LINE Bot"
echo "================================="

# ตรวจสอบว่า Next.js รันอยู่ไหม
if ! lsof -i:3002 > /dev/null; then
    echo "❌ Next.js ไม่ได้รันอยู่บนพอร์ต 3002"
    echo "กรุณารัน: npm run dev"
    exit 1
fi

echo "✅ Next.js รันอยู่บนพอร์ต 3002"

# ตรวจสอบว่ามี ngrok ไหม
if ! command -v ngrok &> /dev/null; then
    echo "📥 กำลังติดตั้ง ngrok..."
    
    # ตรวจสอบระบบปฏิบัติการ
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install ngrok/ngrok/ngrok
        else
            echo "❌ กรุณาติดตั้ง Homebrew ก่อน หรือดาวน์โหลด ngrok จาก https://ngrok.com/"
            exit 1
        fi
    else
        echo "❌ กรุณาติดตั้ง ngrok จาก https://ngrok.com/"
        exit 1
    fi
fi

echo "✅ ngrok พร้อมใช้งาน"

# เริ่ม ngrok tunnel
echo "🚀 กำลังเริ่ม ngrok tunnel..."
ngrok http 3002 &
NGROK_PID=$!

# รอให้ ngrok เริ่มทำงาน
sleep 3

# ดึง URL จาก ngrok
NGROK_URL=$(curl -s localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"[^"]*' | grep https | cut -d'"' -f4 | head -1)

if [ -n "$NGROK_URL" ] && [ "$NGROK_URL" != "No tunnels found" ]; then
    echo ""
    echo "🎉 ngrok tunnel พร้อมใช้งาน!"
    echo "================================="
    echo "Webhook URL: ${NGROK_URL}/api/webhook"
    echo ""
    echo "📋 ขั้นตอนต่อไป:"
    echo "1. ไปที่ LINE Developers Console"
    echo "2. เปิด Messaging API channel ของคุณ"
    echo "3. ไปที่หน้า Messaging API"
    echo "4. ใส่ Webhook URL: ${NGROK_URL}/api/webhook"
    echo "5. เปิดใช้งาน 'Use webhook'"
    echo "6. ทดสอบส่งข้อความผ่าน LINE"
    echo ""
    echo "🧪 ทดสอบ Webhook:"
    echo "curl -X POST ${NGROK_URL}/api/webhook \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -d '{\"events\":[]}'"
    echo ""
    echo "กด Ctrl+C เพื่อหยุด ngrok"
    
    # รอให้ผู้ใช้หยุด
    wait $NGROK_PID
else
    echo "❌ ไม่สามารถเริ่ม ngrok tunnel ได้"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi
