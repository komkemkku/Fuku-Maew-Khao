import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { SubscriptionService } from '@/lib/subscription';

export async function POST(request: NextRequest) {
  try {
    const { userId, action, durationMonths } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    switch (action) {
      case 'upgrade':
        const upgradedUser = await DatabaseService.upgradeToPremium(userId, durationMonths || 12);
        return NextResponse.json({ 
          success: true, 
          user: upgradedUser,
          message: 'Successfully upgraded to Premium!'
        });

      case 'downgrade':
        const downgradedUser = await DatabaseService.downgradeToFree(userId);
        return NextResponse.json({ 
          success: true, 
          user: downgradedUser,
          message: 'Downgraded to Free plan'
        });

      case 'check':
        const user = await DatabaseService.checkSubscriptionStatus(userId);
        const features = SubscriptionService.getFeatures(user.subscription_plan);
        return NextResponse.json({ 
          success: true, 
          user,
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
    const userId = url.searchParams.get('userId');

    if (!userId) {
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

    // Return user-specific subscription info
    const user = await DatabaseService.checkSubscriptionStatus(userId);
    const features = SubscriptionService.getFeatures(user.subscription_plan);
    
    return NextResponse.json({
      success: true,
      user,
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
