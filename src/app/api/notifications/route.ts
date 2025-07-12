import { NextRequest, NextResponse } from 'next/server';
import { DailyNotificationService } from '@/lib/daily-notification';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const messageType = searchParams.get('type') as 'morning' | 'evening' | 'weekly';
    
    // ตรวจสอบ API key สำหรับการป้องกัน
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== process.env.CRON_API_KEY && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'daily':
        // Check time and decide morning or evening
        const currentHour = new Date().getHours();
        if (currentHour >= 0 && currentHour < 12) {
          // Morning (00:00 - 11:59)
          await DailyNotificationService.sendMorningGreeting();
          return NextResponse.json({ 
            success: true, 
            message: 'Morning greetings sent successfully',
            time: 'morning'
          });
        } else {
          // Evening (12:00 - 23:59) 
          await DailyNotificationService.sendEveningDigest();
          return NextResponse.json({ 
            success: true, 
            message: 'Evening digests sent successfully',
            time: 'evening'
          });
        }

      case 'morning':
        await DailyNotificationService.sendMorningGreeting();
        return NextResponse.json({ 
          success: true, 
          message: 'Morning greetings sent successfully' 
        });

      case 'evening':
        await DailyNotificationService.sendEveningDigest();
        return NextResponse.json({ 
          success: true, 
          message: 'Evening digests sent successfully' 
        });

      case 'weekly':
        await DailyNotificationService.sendWeeklyBudgetReminder();
        return NextResponse.json({ 
          success: true, 
          message: 'Weekly budget reminders sent successfully' 
        });

      case 'test':
        if (!userId || !messageType) {
          return NextResponse.json(
            { error: 'userId and type are required for test' },
            { status: 400 }
          );
        }
        
        await DailyNotificationService.sendTestMessage(userId, messageType);
        return NextResponse.json({ 
          success: true, 
          message: `Test ${messageType} message sent to ${userId}` 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: morning, evening, weekly, or test' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'status') {
      return NextResponse.json({
        status: 'active',
        services: {
          morning: 'Available at 08:00 daily',
          evening: 'Available at 20:00 daily', 
          weekly: 'Available on Sundays at 18:00'
        },
        timezone: 'Asia/Bangkok',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      message: 'Daily Notification Service API',
      endpoints: {
        'POST ?action=morning': 'Send morning greetings to all users',
        'POST ?action=evening': 'Send evening digest to all users',
        'POST ?action=weekly': 'Send weekly budget reminder to all users',
        'POST ?action=test&userId=USER_ID&type=TYPE': 'Send test message to specific user',
        'GET ?action=status': 'Get service status'
      }
    });
  } catch (error) {
    console.error('Error in notifications GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
