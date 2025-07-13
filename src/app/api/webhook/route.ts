import { NextRequest, NextResponse } from 'next/server';
import { WebhookRequestBody, validateSignature, Client } from '@line/bot-sdk';

const lineConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

const client = new Client(lineConfig);

export async function GET() {
    return NextResponse.json({ 
        status: 'ok', 
        message: 'LINE Bot Webhook is running',
        timestamp: new Date().toISOString()
    });
}

export async function POST(req: NextRequest) {
    try {
        const body: WebhookRequestBody = await req.json();
        const signature = req.headers.get('x-line-signature') || '';

        if (!validateSignature(JSON.stringify(body), lineConfig.channelSecret, signature)) {
            console.error('Invalid signature');
            return new NextResponse('Invalid signature', { status: 401 });
        }

        console.log('✅ Signature validated');
        
        for (const event of body.events) {
            if (event.type === 'message' && event.message.type === 'text') {
                const userId = event.source.userId;
                if (!userId) continue;
                
                const userMessage = event.message.text;
                const simpleResponse = {
                    type: 'text' as const,
                    text: `ฟูกุได้รับข้อความแล้วครับ: "${userMessage}" 🐱`
                };

                if (event.replyToken) {
                    await client.replyMessage(event.replyToken, [simpleResponse]);
                }
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ status: 'error', message: (error as Error).message });
    }
}
