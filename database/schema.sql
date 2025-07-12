-- เปิดใช้งานส่วนขยาย pgcrypto เพื่อสร้าง UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "public";

-- ตารางสำหรับเก็บข้อมูลผู้ใช้
-- เก็บข้อมูลพื้นฐานของผู้ใช้ที่แอดบอทเข้ามา
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- ID เฉพาะของแต่ละแถว
  line_user_id TEXT NOT NULL UNIQUE, -- User ID ที่ได้จาก LINE (สำคัญที่สุด)
  display_name TEXT, -- ชื่อที่แสดงใน LINE (อาจจะอัปเดตทีหลัง)
  subscription_plan TEXT DEFAULT 'free' CHECK (subscription_plan IN ('free', 'premium')), -- แผนการใช้งาน
  created_at TIMESTAMPTZ NOT NULL DEFAULT now() -- วันเวลาที่สร้าง
);

-- ตารางสำหรับเก็บหมวดหมู่
-- ผู้ใช้แต่ละคนสามารถมีหมวดหมู่เป็นของตัวเองได้ และสามารถตั้งงบประมาณได้
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- เชื่อมกับตาราง users
  name TEXT NOT NULL, -- ชื่อหมวดหมู่ เช่น เงินเดือน, อาหาร, เดินทาง
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')), -- ประเภท: 'รายรับ' หรือ 'รายจ่าย'
  budget_amount NUMERIC(10, 2), -- งบประมาณรายเดือนสำหรับหมวดหมู่นี้ (สามารถเป็น null ได้)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- ป้องกันการสร้างหมวดหมู่ชื่อซ้ำกันสำหรับผู้ใช้คนเดียวกัน
  UNIQUE(user_id, name)
);

-- ตารางสำหรับเก็บรายการธุรกรรม
-- หัวใจของระบบ ใช้เก็บทุกรายการรับ-จ่าย
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- เชื่อมกับตาราง users
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL, -- เชื่อมกับตาราง categories (ถ้าหมวดหมู่ถูกลบ ให้ค่านี้เป็น null)
  amount NUMERIC(10, 2) NOT NULL, -- จำนวนเงิน
  description TEXT, -- คำอธิบายรายการ เช่น "ค่ากาแฟอเมซอน"
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE, -- วันที่ของรายการ
  created_at TIMESTAMPTZ NOT NULL DEFAULT now() -- วันเวลาที่บันทึก
);

-- สร้างดัชนีเพื่อความเร็วในการค้นหา
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date);
CREATE INDEX idx_categories_user_id ON public.categories(user_id);

-- เพิ่มหมวดหมู่เริ่มต้นสำหรับผู้ใช้ใหม่ (ทำผ่าน function)
CREATE OR REPLACE FUNCTION create_default_categories(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- หมวดหมู่รายรับพื้นฐาน
  INSERT INTO public.categories (user_id, name, type) VALUES
    (user_uuid, 'เงินเดือน', 'income'),
    (user_uuid, 'รายได้เสริม', 'income'),
    (user_uuid, 'รายได้อื่นๆ', 'income');
  
  -- หมวดหมู่รายจ่ายพื้นฐาน
  INSERT INTO public.categories (user_id, name, type) VALUES
    (user_uuid, 'อาหาร', 'expense'),
    (user_uuid, 'เดินทาง', 'expense'),
    (user_uuid, 'ค่าใช้จ่ายบ้าน', 'expense'),
    (user_uuid, 'ช้อปปิ้ง', 'expense'),
    (user_uuid, 'ความบันเทิง', 'expense'),
    (user_uuid, 'อื่นๆ', 'expense');
END;
$$ LANGUAGE plpgsql;
