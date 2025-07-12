import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // For demo purposes, we'll use a mock user ID if the provided one is "demo_user_123"
    let actualUserId = userId;
    if (userId === 'demo_user_123') {
      // Create or get demo user
      const demoUser = await DatabaseService.createUser('demo_user_123', 'Demo User');
      actualUserId = demoUser.id;
    }

    const summary = await DatabaseService.getMonthlySummary(actualUserId, year, month);

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
