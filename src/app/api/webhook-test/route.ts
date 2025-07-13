import { NextRequest, NextResponse } from 'next/server';

// Minimal webhook for testing
export async function GET() {
    return NextResponse.json({ 
        status: 'ok', 
        message: 'LINE Bot Webhook is running',
        timestamp: new Date().toISOString()
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('Webhook received:', body);
        
        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ status: 'error', message: 'Internal error' });
    }
}
