-- เพิ่มคอลัมน์ subscription ใน users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'premium')),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;

-- อัปเดต users ที่มีอยู่แล้วให้เป็น free plan
UPDATE public.users 
SET subscription_plan = 'free' 
WHERE subscription_plan IS NULL;

-- เพิ่ม index สำหรับ subscription_plan
CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON public.users(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_users_subscription_end_date ON public.users(subscription_end_date);

-- สร้างฟังก์ชันตรวจสอบ subscription หมดอายุ
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE public.users 
  SET subscription_plan = 'free',
      subscription_start_date = NULL,
      subscription_end_date = NULL
  WHERE subscription_plan = 'premium' 
    AND subscription_end_date IS NOT NULL 
    AND subscription_end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- เพิ่ม comments
COMMENT ON COLUMN public.users.subscription_plan IS 'User subscription plan: free or premium';
COMMENT ON COLUMN public.users.subscription_start_date IS 'When premium subscription started';
COMMENT ON COLUMN public.users.subscription_end_date IS 'When premium subscription expires';
