import { NextRequest, NextResponse } from 'next/server';
import { WebhookRequestBody, validateSignature, Client, Message } from '@line/bot-sdk';
import { LineService } from '../../../lib/line-service';
import { DatabaseService } from '../../../lib/database';

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
                    
                    // Auto-register user ถ้ายังไม่มีในระบบ (กรณีข้าม follow event)
                    try {
                        await DatabaseService.createUser(userId, displayName);
                    } catch (error) {
                        // ไม่ต้องแสดง error ถ้า user มีอยู่แล้ว
                        console.log(`User ${userId} already exists or registration failed:`, error);
                    }

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

                    // แยกข้อมูล action จากปุ่ม
                    const params = new URLSearchParams(postbackData);
                    const action = params.get('action');
                    
                    // ใช้ userId จาก event แทนการตรวจสอบ userId ในปุ่ม
                    // เนื่องจากการตรวจสอบลายเซ็น LINE นั้นปลอดภัยเพียงพอแล้ว

                    let responseMessages: Message[] = [];
                    
                    switch (action) {
                        case 'dashboard':
                            // Dashboard - ปุ่มแทนลิงก์
                            responseMessages = [
                                {
                                    type: 'text',
                                    text: `📊 Dashboard\nภาพรวมข้อมูลการเงินของคุณ`
                                },
                                {
                                    type: 'template',
                                    altText: 'เข้าสู่ Dashboard',
                                    template: {
                                        type: 'buttons',
                                        text: '🔗 เข้าสู่ระบบ',
                                        actions: [
                                            {
                                                type: 'uri',
                                                label: '📊 เปิด Dashboard',
                                                uri: `https://fukuneko-app.vercel.app/dashboard?lineUserId=${userId}&auto=true`
                                            }
                                        ]
                                    }
                                }
                            ];
                            break;
                            
                        case 'subscription':
                            // Premium Package - ปุ่มแทนลิงก์
                            responseMessages = [
                                {
                                    type: 'text',
                                    text: `💎 แพ็กเกจ Premium\n\n🐱 ฟรี: 0 บาท (100 รายการ/เดือน)\n👑 พรีเมียม: 99 บาท/เดือน (ไม่จำกัด)`
                                },
                                {
                                    type: 'template',
                                    altText: 'ดูแพ็กเกจ Premium',
                                    template: {
                                        type: 'buttons',
                                        text: '🚀 เลือกแพ็กเกจ',
                                        actions: [
                                            {
                                                type: 'uri',
                                                label: '� ดูรายละเอียด',
                                                uri: `https://fukuneko-app.vercel.app/premium?lineUserId=${userId}&auto=true`
                                            }
                                        ]
                                    }
                                }
                            ];
                            break;

                        case 'summary':
                            // สรุปข้อมูลการเงิน - เรียกใช้เมธอดใหม่
                            responseMessages = await LineService.getOverviewMessageWithButtons(userId);
                            break;

                        case 'expense_examples':
                            // ตัวอย่างการบันทึกรายจ่าย
                            responseMessages = [
                                {
                                    type: 'text',
                                    text: '💸 ตัวอย่างการบันทึกรายจ่าย:\n\n• "50 ค่ากาแฟ"\n• "80 ข้าวเที่ยง"\n• "15 น้ำดื่ม"\n• "800 ค่าไฟ"\n• "300 เติมน้ำมัน"\n• "150 ยาสามัญ"\n• "50 ค่ารถเมล์"\n• "200 เสื้อใหม่"\n\n💡 เคล็ดลับ: ระบบจะจัดหมวดหมู่ให้อัตโนมัติ!'
                                }
                            ];
                            break;

                        case 'income_examples':
                            // ตัวอย่างการบันทึกรายรับ
                            responseMessages = [
                                {
                                    type: 'text',
                                    text: '💰 ตัวอย่างการบันทึกรายรับ:\n\n• "30000 เงินเดือน"\n• "500 ค่าล่วงเวลา"\n• "1000 โบนัส"\n• "200 ขายของเก่า"\n• "150 ได้รับคืน"\n• "100 ดอกเบี้ย"\n• "2000 รายได้พิเศษ"\n\n💡 เคล็ดลับ: ระบุให้ชัดเจนเพื่อการจัดหมวดหมู่ที่แม่นยำ!'
                                }
                            ];
                            break;

                        case 'status':
                            // ดูสถานะแพคเกจ
                            responseMessages = await LineService.handleMessage('สถานะ', userId);
                            break;
                            
                        case 'home':
                            // หน้าแรก - ปุ่มแทนลิงก์
                            responseMessages = [
                                {
                                    type: 'text',
                                    text: `🏠 Fuku Neko\nผู้ช่วยการเงินส่วนตัว`
                                },
                                {
                                    type: 'template',
                                    altText: 'เข้าสู่หน้าแรก',
                                    template: {
                                        type: 'buttons',
                                        text: '🌟 เริ่มใช้งาน',
                                        actions: [
                                            {
                                                type: 'uri',
                                                label: '🏠 เปิดหน้าแรก',
                                                uri: `https://fukuneko-app.vercel.app/?lineUserId=${userId}&auto=true`
                                            }
                                        ]
                                    }
                                }
                            ];
                            break;
                            
                        case 'categories':
                            // แสดงหมวดหมู่ - ต้องแปลง LINE User ID เป็น internal user ID
                            try {
                                let user = await DatabaseService.getUserByLineId(userId);
                                if (!user) {
                                    // Auto-register user ถ้ายังไม่มีในระบบ
                                    const displayName = await getDisplayName(userId);
                                    user = await DatabaseService.createUser(userId, displayName);
                                }
                                
                                responseMessages = await LineService.getCategoriesMessageWithButtons(user.id);
                            } catch (error) {
                                console.error('Error getting categories:', error);
                                responseMessages = [{
                                    type: 'text',
                                    text: '❌ เกิดข้อผิดพลาดในการดึงข้อมูลหมวดหมู่'
                                }];
                            }
                            break;
                            
                        case 'budget':
                            // แสดงงบประมาณ - ต้องแปลง LINE User ID เป็น internal user ID
                            try {
                                let user = await DatabaseService.getUserByLineId(userId);
                                if (!user) {
                                    // Auto-register user ถ้ายังไม่มีในระบบ
                                    const displayName = await getDisplayName(userId);
                                    user = await DatabaseService.createUser(userId, displayName);
                                }
                                
                                responseMessages = await LineService.getBudgetMessageWithButtons(user.id);
                            } catch (error) {
                                console.error('Error getting budget:', error);
                                responseMessages = [{
                                    type: 'text',
                                    text: '❌ เกิดข้อผิดพลาดในการดึงข้อมูลงบประมาณ'
                                }];
                            }
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
                    // เมื่อมีคนแอดเพื่อน - ลงทะเบียนผู้ใช้ทันที
                    const userId = event.source.userId;
                    if (userId) {
                        const displayName = await getDisplayName(userId);
                        
                        // ลงทะเบียนผู้ใช้ในระบบทันที
                        try {
                            await DatabaseService.createUser(userId, displayName);
                            console.log(`✅ User registered successfully: ${userId} (${displayName})`);
                        } catch (error) {
                            console.error('Failed to register user on follow:', error);
                        }
                        
                        // ส่งข้อความต้อนรับ
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
