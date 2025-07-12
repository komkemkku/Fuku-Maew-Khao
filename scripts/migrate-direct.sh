#!/bin/bash

# Simple migration script ที่ใช้ psql โดยตรง
echo "🐱 Direct Database Migration..."

# ดู environment
if [ -f .env.local ]; then
    source .env.local
    echo "✅ โหลด .env.local แล้ว"
else
    echo "❌ ไม่เจอ .env.local"
    exit 1
fi

# ตรวจสอบว่ามี psql หรือไม่
if ! command -v psql &> /dev/null; then
    echo "❌ ไม่เจอ psql command"
    echo "กรุณาติดตั้ง PostgreSQL client หรือใช้ manual migration"
    echo ""
    echo "🔧 Manual migration:"
    echo "1. เปิด Supabase Dashboard"
    echo "2. ไปที่ SQL Editor"
    echo "3. รัน SQL จากไฟล์: database/migrations/add_subscription_columns.sql"
    echo ""
    echo "📋 หรือ copy SQL นี้ไปรัน:"
    echo "----------------------------------------"
    cat database/migrations/add_subscription_columns.sql
    exit 1
fi

echo "🚀 กำลัง migrate โดยใช้ psql..."

# รัน migration ด้วย psql
if psql "$DATABASE_URL" -f database/migrations/add_subscription_columns.sql; then
    echo "✅ Migration สำเร็จ!"
    
    # ตรวจสอบผลลัพธ์
    echo "📊 ตรวจสอบผลลัพธ์..."
    psql "$DATABASE_URL" -c "
        SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
            AND table_schema = 'public'
            AND column_name LIKE '%subscription%'
        ORDER BY ordinal_position;
    "
    
    echo ""
    echo "📈 สถิติ users:"
    psql "$DATABASE_URL" -c "
        SELECT 
            COALESCE(subscription_plan, 'no_plan') as plan,
            COUNT(*) as count
        FROM public.users 
        GROUP BY subscription_plan;
    "
    
else
    echo "❌ Migration ล้มเหลว"
    echo ""
    echo "🔧 กรุณาใช้ manual migration แทน:"
    echo "1. เปิด Supabase Dashboard"
    echo "2. ไปที่ SQL Editor"  
    echo "3. รัน SQL นี้:"
    echo "----------------------------------------"
    cat database/migrations/add_subscription_columns.sql
    exit 1
fi
