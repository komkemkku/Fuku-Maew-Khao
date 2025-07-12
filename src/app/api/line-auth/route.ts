import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

// Verify LINE token and get user info
async function verifyLineToken(accessToken: string) {
  try {
    const response = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Invalid LINE token');
    }
    
    const profile = await response.json();
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      pictureUrl: profile.pictureUrl,
      statusMessage: profile.statusMessage
    };
  } catch (error) {
    console.error('LINE token verification failed:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    // Verify LINE token and get user profile
    const lineProfile = await verifyLineToken(accessToken);
    
    if (!lineProfile) {
      return NextResponse.json(
        { error: 'Invalid LINE access token' },
        { status: 401 }
      );
    }

    // Create or get user from database
    const user = await DatabaseService.createUser(
      lineProfile.userId,
      lineProfile.displayName
    );

    // Return user info for client
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        lineUserId: user.line_user_id,
        name: user.display_name,
        pictureUrl: lineProfile.pictureUrl,
        subscription: user.subscription_plan
      }
    });

  } catch (error) {
    console.error('LINE authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Get current user info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get('lineUserId');

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'LINE user ID is required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await DatabaseService.getUserByLineId(lineUserId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        lineUserId: user.line_user_id,
        name: user.display_name,
        subscription: user.subscription_plan
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user info' },
      { status: 500 }
    );
  }
}
