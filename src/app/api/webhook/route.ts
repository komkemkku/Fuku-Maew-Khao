import { NextRequest, NextResponse } from 'next/server';
import { WebhookRequestBody, validateSignature, Client, Message } from '@line/bot-sdk';
import { LineService } from '../../../lib/line-service';

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

// GET method handler สำหรับ health check
export async function GET() {
    return NextResponse.json({ 
        status: 'ok', 
        message: 'LINE Bot Webhook is running',
        timestamp: new Date().toISOString()
    });
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
                else if (event.type === 'message' && event.message.type === 'sticker') {
                    // จัดการสติกเกอร์
                    const userId = event.source.userId;
                    if (!userId) continue;
                    
                    const stickerMessage = event.message;

                    console.log(`User ${userId} sent sticker: packageId=${stickerMessage.packageId}, stickerId=${stickerMessage.stickerId}`);

                    // ประมวลผลสติกเกอร์และตอบกลับ
                    const responseMessages = LineService.handleStickerMessage(
                        stickerMessage.packageId, 
                        stickerMessage.stickerId
                    );

                    // ตอบกลับผู้ใช้
                    if (event.replyToken) {
                        await LineService.replyMessage(event.replyToken, responseMessages);
                    }
                }
                else if (event.type === 'postback') {
                    // จัดการ postback events จากปุ่ม
                    const userId = event.source.userId;
                    if (!userId) continue;
                    
                    const postbackData = event.postback.data;
                    console.log(`User ${userId} pressed button: ${postbackData}`);

                    // แยกข้อมูล action และ userId
                    const params = new URLSearchParams(postbackData);
                    const action = params.get('action');
                    const targetUserId = params.get('userId');
                    
                    // ตรวจสอบว่า userId ตรงกัน (security)
                    if (targetUserId !== userId) {
                        console.error('User ID mismatch in postback');
                        continue;
                    }

                    let responseMessages: Message[] = [];
                    
                    switch (action) {
                        case 'dashboard':
                            // เปิด dashboard URL - ใช้ LINE User ID โดยตรง
                            responseMessages = [{
                                type: 'text',
                                text: `📊 Dashboard\n\n🔗 กดลิงก์นี้เพื่อดู Dashboard แบบละเอียด:\nhttps://fukuneko-app.vercel.app/dashboard?lineUserId=${userId}&auto=true`
                            }];
                            break;
                            
                        case 'subscription':
                            // เปิดหน้า subscription
                            responseMessages = [{
                                type: 'text',
                                text: `💎 Premium Subscription\n\n🔗 กดลิงก์นี้เพื่ออัปเกรดเป็น Premium:\nhttps://fukuneko-app.vercel.app/subscription?lineUserId=${userId}&auto=true`
                            }];
                            break;
                            
                        case 'home':
                            // เปิดหน้าแรก
                            responseMessages = [{
                                type: 'text',
                                text: `🏠 หน้าแรก Fuku Neko\n\n🔗 กดลิงก์นี้เพื่อดูข้อมูลและแพคเกจ:\nhttps://fukuneko-app.vercel.app/?lineUserId=${userId}&auto=true`
                            }];
                            break;
                            
                        case 'categories':
                            // แสดงหมวดหมู่
                            responseMessages = await LineService.getCategoriesMessageWithButtons(userId);
                            break;
                            
                        case 'budget':
                            // แสดงงบประมาณ
                            responseMessages = await LineService.getBudgetMessageWithButtons(userId);
                            break;
                            
                        default:
                            responseMessages = [{
                                type: 'text',
                                text: '❌ ไม่เข้าใจคำสั่ง กรุณาลองใหม่อีกครั้ง'
                            }];
                    }

                    // ตอบกลับผู้ใช้
                    if (event.replyToken && responseMessages.length > 0) {
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
                // ดำเนินการต่อกับ event ถัดไปแม้จะเกิดข้อผิดพลาด
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
