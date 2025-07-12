#!/bin/bash

# Script สำหรับ migrate subscription columns
echo "🐱 กำลัง migrate subscription columns..."

# ดู environment
if [ -f .env.local ]; then
    source .env.local
    echo "✅ โหลด .env.local แล้ว"
else
    echo "❌ ไม่เจอ .env.local"
    exit 1
fi

# ตรวจสอบว่า development server รันอยู่หรือไม่
echo "📋 ตรวจสอบว่า development server รันอยู่หรือไม่..."

# ลองทั้ง port 3000 และ 3001
API_URL=""
if curl -s -f "http://localhost:3000/api/migrate-subscription" > /dev/null 2>&1; then
    API_URL="http://localhost:3000"
    echo "✅ Development server รันอยู่ที่ port 3000"
elif curl -s -f "http://localhost:3001/api/migrate-subscription" > /dev/null 2>&1; then
    API_URL="http://localhost:3001"
    echo "✅ Development server รันอยู่ที่ port 3001"
else
    echo "❌ Development server ไม่ได้รันอยู่!"
    echo "กรุณารัน: npm run dev"
    echo ""
    echo "🔧 หรือใช้ manual migration แทน:"
    echo "1. เปิด Supabase Dashboard"
    echo "2. ไปที่ SQL Editor"
    echo "3. รัน SQL จากไฟล์: database/migrations/add_subscription_columns.sql"
    exit 1
fi

# ตรวจสอบสถานะปัจจุบัน
echo "📋 ตรวจสอบสถานะฐานข้อมูลปัจจุบัน..."
CHECK_RESPONSE=$(curl -s "$API_URL/api/migrate-subscription")
echo "Response: $CHECK_RESPONSE"

# ลองใช้ jq ถ้ามี
if command -v jq &> /dev/null; then
    echo "$CHECK_RESPONSE" | jq '.' 2>/dev/null || echo "JSON ไม่ถูกต้อง"
fi

echo ""
echo "🚀 กำลัง migrate..."

# รัน migration
RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $MIGRATION_SECRET" \
  -H "Content-Type: application/json" \
  "$API_URL/api/migrate-subscription")
    
    echo "Migration Response: $RESPONSE"
    
    # ตรวจสอบผลลัพธ์
    if command -v jq &> /dev/null; then
        if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
            echo "✅ Migration สำเร็จ!"
            echo "$RESPONSE" | jq '.'
        else
            echo "❌ Migration ล้มเหลว"
            echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
            exit 1
        fi
    else
        # ไม่มี jq ใช้ grep แทน
        if echo "$RESPONSE" | grep -q '"success":true'; then
            echo "✅ Migration สำเร็จ!"
        else
            echo "❌ Migration ล้มเหลว"
            echo "$RESPONSE"
            exit 1
        fi
    fi
else
    echo "❌ Development server ไม่ได้รันอยู่!"
    echo "กรุณารัน: npm run dev"
    echo ""
    echo "🔧 หรือใช้ manual migration แทน:"
    echo "1. เปิด Supabase Dashboard"
    echo "2. ไปที่ SQL Editor"
    echo "3. รัน SQL จากไฟล์: database/migrations/add_subscription_columns.sql"
    exit 1
fi
