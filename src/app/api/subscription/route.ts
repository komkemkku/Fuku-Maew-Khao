import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { SubscriptionService } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  try {
    const { userId: lineUserId, action, durationMonths } = await request.json();

    if (!lineUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user by LINE User ID to get internal user ID
    const user = await DatabaseService.getUserByLineId(lineUserId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'upgrade':
        const upgradedUser = await DatabaseService.upgradeToPremium(user.id, durationMonths || 12);
        return NextResponse.json({ 
          success: true, 
          user: upgradedUser,
          message: 'Successfully upgraded to Premium!'
        });

      case 'downgrade':
        const downgradedUser = await DatabaseService.downgradeToFree(user.id);
        return NextResponse.json({ 
          success: true, 
          user: downgradedUser,
          message: 'Downgraded to Free plan'
        });

      case 'check':
        const checkedUser = await DatabaseService.checkSubscriptionStatus(user.id);
        const features = SubscriptionService.getFeatures(checkedUser.subscription_plan);
        return NextResponse.json({ 
          success: true, 
          user: checkedUser,
          features,
          pricing: SubscriptionService.getPricing()
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const lineUserId = url.searchParams.get('userId');

    if (!lineUserId) {
      // Return pricing information for anonymous users
      return NextResponse.json({
        success: true,
        pricing: SubscriptionService.getPricing(),
        features: {
          free: SubscriptionService.getFreeFeatures(),
          premium: SubscriptionService.getPremiumFeatures()
        }
      });
    }

    // Get user by LINE User ID to get internal user ID
    const user = await DatabaseService.getUserByLineId(lineUserId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user-specific subscription info
    const checkedUser = await DatabaseService.checkSubscriptionStatus(user.id);
    const features = SubscriptionService.getFeatures(checkedUser.subscription_plan);
    
    return NextResponse.json({
      success: true,
      user: checkedUser,
      features,
      pricing: SubscriptionService.getPricing()
    });

  } catch (error) {
    console.error('Subscription GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
