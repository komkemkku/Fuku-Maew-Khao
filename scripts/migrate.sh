#!/bin/bash

echo "🐱 Fuku Neko Database Migration Helper"
echo ""

# ตรวจสอบว่า development server รันอยู่หรือไม่
if curl -s -f "http://localhost:3001/api/migration-helper" > /dev/null 2>&1; then
    echo "✅ Development server รันอยู่!"
    echo "🌐 เปิด Migration Helper:"
    echo "   http://localhost:3001/api/migration-helper"
    echo ""
    echo "📋 ทำตามขั้นตอนใน Migration Helper เพื่อ migrate database"
    
    # เปิด browser ถ้าเป็น macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "🚀 กำลังเปิด browser..."
        open "http://localhost:3001/api/migration-helper"
    fi
    
elif curl -s -f "http://localhost:3000/api/migration-helper" > /dev/null 2>&1; then
    echo "✅ Development server รันอยู่!"
    echo "🌐 เปิด Migration Helper:"
    echo "   http://localhost:3000/api/migration-helper"
    echo ""
    echo "📋 ทำตามขั้นตอนใน Migration Helper เพื่อ migrate database"
    
    # เปิด browser ถ้าเป็น macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "🚀 กำลังเปิด browser..."
        open "http://localhost:3000/api/migration-helper"
    fi
    
else
    echo "❌ Development server ไม่ได้รันอยู่!"
    echo ""
    echo "🔧 เริ่มต้น:"
    echo "1. รัน: npm run dev"
    echo "2. รัน script นี้อีกครั้ง: ./scripts/migrate.sh"
    echo ""
    echo "🔧 หรือ Manual Migration:"
    echo "1. เปิด Supabase Dashboard"
    echo "2. ไปที่ SQL Editor"  
    echo "3. รัน SQL จากไฟล์: database/migrations/add_subscription_columns.sql"
    echo ""
    echo "📋 หรือ copy SQL นี้ไปรัน:"
    echo "----------------------------------------"
    cat database/migrations/add_subscription_columns.sql
fi
