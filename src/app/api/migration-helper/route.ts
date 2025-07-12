import { NextResponse } from 'next/server';

export async function GET() {
  const migrationSQL = `-- เพิ่มคอลัมน์ subscription ใน users table
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
RETURNS void AS $BODY$
BEGIN
  UPDATE public.users 
  SET subscription_plan = 'free',
      subscription_start_date = NULL,
      subscription_end_date = NULL
  WHERE subscription_plan = 'premium' 
    AND subscription_end_date IS NOT NULL 
    AND subscription_end_date < NOW();
END;
$BODY$ LANGUAGE plpgsql;

-- เพิ่ม comments
COMMENT ON COLUMN public.users.subscription_plan IS 'User subscription plan: free or premium';
COMMENT ON COLUMN public.users.subscription_start_date IS 'When premium subscription started';
COMMENT ON COLUMN public.users.subscription_end_date IS 'When premium subscription expires';`;

  // Return an HTML page with migration instructions
  const html = `
    <!DOCTYPE html>
    <html lang="th">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🐱 Fuku Neko Database Migration</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #333;
                min-height: 100vh;
            }
            .container {
                background: white;
                border-radius: 15px;
                padding: 30px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            h1 {
                color: #764ba2;
                text-align: center;
                margin-bottom: 30px;
            }
            .step {
                background: #f8f9fa;
                border-left: 4px solid #667eea;
                padding: 15px;
                margin: 15px 0;
                border-radius: 5px;
            }
            .step h3 {
                margin-top: 0;
                color: #667eea;
            }
            .sql-box {
                background: #2d3748;
                color: #e2e8f0;
                padding: 20px;
                border-radius: 8px;
                margin: 15px 0;
                overflow-x: auto;
                font-family: 'Monaco', 'Consolas', monospace;
                font-size: 14px;
                line-height: 1.4;
            }
            .copy-btn {
                background: #667eea;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin: 10px 0;
                font-size: 14px;
            }
            .copy-btn:hover {
                background: #5a67d8;
            }
            .success {
                background: #c6f6d5;
                border-color: #38a169;
                color: #2f855a;
            }
            .warning {
                background: #fef5e7;
                border-color: #ed8936;
                color: #c05621;
            }
            .info {
                background: #e6fffa;
                border-color: #38b2ac;
                color: #2c7a7b;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🐱 Fuku Neko Database Migration</h1>
            
            <div class="step warning">
                <h3>⚠️ สำคัญ: อ่านก่อนดำเนินการ</h3>
                <p>Migration นี้จะเพิ่มคอลัมน์ subscription ให้กับ table users ที่มีอยู่แล้ว</p>
                <ul>
                    <li>ปลอดภัย: ใช้ <code>IF NOT EXISTS</code> ไม่ลบข้อมูลเดิม</li>
                    <li>Users ที่มีอยู่จะถูกตั้งเป็น 'free' plan อัตโนมัติ</li>
                    <li>สามารถรันได้หลายครั้งโดยไม่เกิดข้อผิดพลาด</li>
                </ul>
            </div>

            <div class="step info">
                <h3>📋 วิธีใช้งาน</h3>
                <ol>
                    <li>เปิด <a href="https://supabase.com/dashboard" target="_blank">Supabase Dashboard</a></li>
                    <li>เลือกโปรเจค Fuku Neko</li>
                    <li>ไปที่ <strong>SQL Editor</strong> (เมนูซ้าย)</li>
                    <li>สร้าง New Query</li>
                    <li>Copy SQL ด้านล่างแล้ว Paste ลงใน Editor</li>
                    <li>กด <strong>Run</strong> เพื่อ execute</li>
                </ol>
            </div>

            <div class="step">
                <h3>📝 SQL Migration Script</h3>
                <button class="copy-btn" onclick="copySQL()">📋 Copy SQL</button>
                <div class="sql-box" id="sqlCode">${migrationSQL.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </div>

            <div class="step success">
                <h3>✅ ตรวจสอบผลลัพธ์</h3>
                <p>หลังจากรัน migration แล้ว สามารถตรวจสอบได้ด้วย SQL นี้:</p>
                <button class="copy-btn" onclick="copyCheck()">📋 Copy Check SQL</button>
                <div class="sql-box" id="checkCode">-- ตรวจสอบคอลัมน์ใหม่
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

-- ตรวจสอบข้อมูล users
SELECT 
    subscription_plan,
    COUNT(*) as user_count
FROM public.users 
GROUP BY subscription_plan;</div>
            </div>

            <div class="step">
                <h3>🔄 Next Steps</h3>
                <p>หลังจาก migration เสร็จแล้ว:</p>
                <ul>
                    <li>ทดสอบ subscription system ใน LINE bot</li>
                    <li>ลองคำสั่ง <code>premium</code> และ <code>#upgrade-premium</code></li>
                    <li>ตรวจสอบ API endpoints: <code>/api/subscription</code></li>
                    <li>ดู Premium page: <code>/premium</code></li>
                </ul>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                <p style="color: #718096;">🐱 Fuku Neko Migration Helper</p>
                <p style="font-size: 12px; color: #a0aec0;">Generated on ${new Date().toLocaleString('th-TH')}</p>
            </div>
        </div>

        <script>
            function copySQL() {
                const sql = \`${migrationSQL.replace(/`/g, '\\`')}\`;
                navigator.clipboard.writeText(sql).then(() => {
                    alert('✅ SQL copied to clipboard!');
                });
            }

            function copyCheck() {
                const checkSQL = \`-- ตรวจสอบคอลัมน์ใหม่
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

-- ตรวจสอบข้อมูล users
SELECT 
    subscription_plan,
    COUNT(*) as user_count
FROM public.users 
GROUP BY subscription_plan;\`;
                navigator.clipboard.writeText(checkSQL).then(() => {
                    alert('✅ Check SQL copied to clipboard!');
                });
            }
        </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
