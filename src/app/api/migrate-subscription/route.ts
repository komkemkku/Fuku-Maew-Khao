import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  // เช็ค authorization (ในการใช้งานจริงควรมี auth)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = await pool.connect();
  
  try {
    // เพิ่มคอลัมน์ subscription
    await client.query(`
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'premium')),
      ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ
    `);

    // อัปเดต users ที่มีอยู่แล้ว
    await client.query(`
      UPDATE public.users 
      SET subscription_plan = 'free' 
      WHERE subscription_plan IS NULL
    `);

    // เพิ่ม indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_subscription_plan ON public.users(subscription_plan)
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_subscription_end_date ON public.users(subscription_end_date)
    `);

    // ตรวจสอบผลลัพธ์
    const result = await client.query(`
      SELECT 
        subscription_plan,
        COUNT(*) as user_count
      FROM public.users 
      GROUP BY subscription_plan
    `);

    const schemaResult = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND table_schema = 'public'
        AND column_name LIKE '%subscription%'
      ORDER BY ordinal_position
    `);

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      userCounts: result.rows,
      newColumns: schemaResult.rows
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function GET() {
  const client = await pool.connect();
  
  try {
    // ตรวจสอบว่าคอลัมน์มีอยู่หรือไม่
    const columnCheck = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
        AND table_schema = 'public'
        AND column_name LIKE '%subscription%'
      ORDER BY ordinal_position
    `);

    const userStats = await client.query(`
      SELECT 
        COALESCE(subscription_plan, 'no_plan') as plan,
        COUNT(*) as count
      FROM public.users 
      GROUP BY subscription_plan
    `);

    return NextResponse.json({
      success: true,
      migrationNeeded: columnCheck.rows.length === 0,
      existingColumns: columnCheck.rows,
      userStats: userStats.rows
    });

  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    client.release();
  }
}
