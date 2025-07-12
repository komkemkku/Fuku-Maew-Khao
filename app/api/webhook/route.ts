import { NextRequest, NextResponse } from 'next/server';
import { Client, WebhookRequestBody, validateSignature } from '@line/bot-sdk';

// การตั้งค่าสำหรับเชื่อมต่อกับ LINE
const lineConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

// สร้าง client สำหรับสื่อสารกับ LINE
const client = new Client(lineConfig);

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

        // ใน Phase 1 เราจะแค่ log event ที่ได้รับมาดูก่อน
        // Phase 2 เราจะมาเขียน logic จัดการ event ตรงนี้
        // เช่น การบันทึกข้อมูลลง database, การตอบกลับผู้ใช้

        // ตัวอย่างการวนลูปดู event แต่ละอัน
        for (const event of body.events) {
            if (event.type === 'message' && event.message.type === 'text') {
                const userId = event.source.userId;
                const userMessage = event.message.text;
                console.log(`User ${userId} sent message: ${userMessage}`);

                // TODO: Phase 2 - Parse message and save to DB
                // TODO: Phase 2 - Reply to user
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
