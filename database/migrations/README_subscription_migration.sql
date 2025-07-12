/**
 * Database Migration Script for Subscription Features
 * Run this manually in Supabase SQL Editor or database admin tool
 */

-- เพิ่มคอลัมน์ subscription สำหรับ users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'premium')),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- อัปเดต users ที่มีอยู่แล้วให้เป็น free plan
UPDATE public.users 
SET subscription_plan = 'free' 
WHERE subscription_plan IS NULL;

-- เพิ่ม index สำหรับประสิทธิภาพ
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON public.users(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_users_subscription_end_date ON public.users(subscription_end_date);

-- ตรวจสอบผลลัพธ์
SELECT 
  'Total users:' as label, 
  COUNT(*) as count 
FROM public.users
UNION ALL
SELECT 
  'Free users:' as label, 
  COUNT(*) as count 
FROM public.users WHERE subscription_plan = 'free'
UNION ALL
SELECT 
  'Premium users:' as label, 
  COUNT(*) as count 
FROM public.users WHERE subscription_plan = 'premium';

-- แสดงโครงสร้างตารางใหม่
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
