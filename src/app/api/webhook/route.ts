import { NextRequest, NextResponse } from 'next/server';
import { WebhookRequestBody, validateSignature, Client } from '@line/bot-sdk';
import { LineService } from '@/lib/line-service';

// การตั้งค่าสำหรับเชื่อมต่อกับ LINE
const lineConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

const client = new Client(lineConfig);

// ฟังก์ชันสำหรับดึงชื่อผู้ใช้จาก LINE
async function getDisplayName(userId: string): Promise<string | undefined> {
    try {
        const profile = await client.getProfile(userId);
        return profile.displayName;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return undefined;
    }
}

// ฟังก์ชันหลักสำหรับรับ Request จาก LINE
export async function POST(req: NextRequest) {
    try {
        const body: WebhookRequestBody = await req.json();
        const signature = req.headers.get('x-line-signature') || '';

        // ตรวจสอบลายเซ็นเพื่อให้แน่ใจว่า Request มาจาก LINE จริงๆ
        if (!validateSignature(JSON.stringify(body), lineConfig.channelSecret, signature)) {
            console.error('Invalid signature');
            return new NextResponse('Invalid signature', { status: 401 });
        }

        console.log('✅ Signature validated');
        console.log('Received events:', JSON.stringify(body.events, null, 2));

        // ประมวลผลแต่ละ event
        for (const event of body.events) {
            try {
                if (event.type === 'message' && event.message.type === 'text') {
                    const userId = event.source.userId;
                    if (!userId) continue;
                    
                    const userMessage = event.message.text;
                    const displayName = event.source.type === 'user' 
                        ? await getDisplayName(userId) 
                        : undefined;

                    console.log(`User ${userId} sent message: ${userMessage}`);

                    // ประมวลผลข้อความและตอบกลับ
                    const responseMessages = await LineService.handleMessage(
                        userMessage, 
                        userId, 
                        displayName
                    );

                    // ตอบกลับผู้ใช้
                    if (event.replyToken) {
                        await LineService.replyMessage(event.replyToken, responseMessages);
                    }
                }
                else if (event.type === 'follow') {
                    // เมื่อมีคนแอดเพื่อน
                    const userId = event.source.userId;
                    if (userId) {
                        const displayName = await getDisplayName(userId);
                        await LineService.handleMessage('ช่วยเหลือ', userId, displayName);
                    }
                }
            } catch (eventError) {
                console.error('Error processing event:', event, eventError);
                // ดำเนินการต่อกับ event ถัดไปแม้จะเกิดข้อผิดพลาดot
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Webhook Error:', error);
        // แนะนำให้ตอบกลับ status 200 แม้จะเกิด error ฝั่งเรา
        // เพื่อป้องกัน LINE ส่ง request เดิมมาซ้ำๆ
        return NextResponse.json({ status: 'error', message: (error as Error).message });
    }
}
