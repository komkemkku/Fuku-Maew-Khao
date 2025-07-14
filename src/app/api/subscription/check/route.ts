import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lineUserId = searchParams.get('lineUserId');

  if (!lineUserId) {
    return NextResponse.json({ error: 'LINE User ID required' }, { status: 400 });
  }

  try {
    // ตรวจสอบสถานะการสมัครสมาชิกจากฐานข้อมูล
    // สำหรับตอนนี้ใช้ข้อมูลจำลอง - ในระบบจริงจะเชื่อมต่อกับฐานข้อมูล
    
    // จำลองผู้ใช้พรีเมียม (ใช้ LINE User ID สำหรับทดสอบ)
    const premiumUsers = [
      'test_premium_user',
      'premium123',
      'Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' // ตัวอย่าง LINE User ID
    ];

    const isPremium = premiumUsers.includes(lineUserId);
    
    return NextResponse.json({
      lineUserId,
      plan: isPremium ? 'premium' : 'free',
      status: 'active',
      features: isPremium ? {
        receiptOCR: true,
        advancedReports: true,
        smartNotifications: true,
        noAds: true,
        categoryLimit: -1,
        transactionLimit: -1,
        budgetAlerts: true,
        exportData: true,
        prioritySupport: true
      } : {
        receiptOCR: false,
        advancedReports: false,
        smartNotifications: false,
        noAds: false,
        categoryLimit: 15,
        transactionLimit: 500,
        budgetAlerts: false,
        exportData: false,
        prioritySupport: false
      }
    });

  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json({ 
      error: 'Failed to check subscription',
      plan: 'free' // Default to free on error
    }, { status: 500 });
  }
}
