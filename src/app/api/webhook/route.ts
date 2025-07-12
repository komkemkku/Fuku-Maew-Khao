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
        console.log('📨 Webhook received');
        console.log('Headers:', Object.fromEntries(req.headers.entries()));

        const bodyText = await req.text();
        console.log('Raw body:', bodyText);

        const body: WebhookRequestBody = JSON.parse(bodyText);
        const signature = req.headers.get('x-line-signature') || '';

        console.log('Parsed body:', JSON.stringify(body, null, 2));
        console.log('Signature:', signature);

        // ตรวจสอบลายเซ็นเพื่อให้แน่ใจว่า Request มาจาก LINE จริงๆ
        const isValidSignature = validateSignature(bodyText, lineConfig.channelSecret, signature);
        console.log('Signature validation result:', isValidSignature);

        if (!isValidSignature) {
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

                    console.log('Response messages:', JSON.stringify(responseMessages, null, 2));

                    // ตอบกลับผู้ใช้
                    if (event.replyToken && responseMessages && responseMessages.length > 0) {
                        console.log(`Replying with ${responseMessages.length} messages...`);
                        await LineService.replyMessage(event.replyToken, responseMessages);
                        console.log('✅ Reply sent successfully');
                    } else {
                        console.log('⚠️ No reply token or no response messages');
                    }
                }
                else if (event.type === 'follow') {
                    // เมื่อมีคนแอดเพื่อน
                    const userId = event.source.userId;
                    if (userId) {
                        const displayName = await getDisplayName(userId);
                        // ส่งข้อความทักทายสุดน่ารักและสร้างสรรค์
                        const greetings = [
                            `🌟 เหมียว~ สวัสดีจ้า${displayName ? ' คุณ' + displayName : ''}! ยินดีต้อนรับสู่โลกน่ารักของฟูกุนะคะ 😸\n\n` +
                            `💫 ฟูกุจะเป็นผู้ช่วยการเงินส่วนตัวของเจ้าทาส และคอยดูแลกระเป๋าเงินให้เรียบร้อยเสมอ~\n\n` +
                            `🎪 ลองพิมพ์ 'ช่วยเหลือ' เพื่อดูเวทมนตร์ที่ฟูกุทำได้ หรือ 'แมวฟรี' เพื่อรับของขวัญแมวน่ารักฟรี! 🐾\n\n` +
                            `💎 ถ้าเจ้าทาสอยากสนับสนุนฟูกุ สามารถอัปเกรดเป็น Premium เพื่อปลดล็อคความมหัศจรรย์เพิ่มเติมได้นะ! ✨`,
                            
                            `🐾 ยินดีที่ได้รู้จักนะคะ${displayName ? ' คุณ' + displayName : ''}! 💕\n\n` +
                            `🌸 ฟูกุพร้อมเป็นทั้งผู้ช่วยการเงินและเพื่อนคุยสุดน่ารักของเจ้าทาสแล้วค่ะ~\n\n` +
                            `🎭 มาลองเล่นกันเถอะ! พิมพ์ '50 ค่ากาแฟ' หรือ 'สรุป' ดูสิ ฟูกุจะโชว์ความเก่งให้ดู! ✨\n` +
                            `📚 อยากรู้ทุกความลับของฟูกุไหม? พิมพ์ 'ช่วยเหลือ' มาค่ะ!\n\n` +
                            `💝 เจ้าทาสสามารถสนับสนุนฟูกุด้วยการอัปเกรด Premium เพื่อปลดล็อคฟีเจอร์พิเศษได้นะ! 😸`,
                            
                            `✨ ขอบคุณมากๆ ที่ให้ฟูกุได้เป็นเพื่อนนะคะ! 🥰\n\n` +
                            `🌈 ขอให้ทุกวันของเจ้าทาสเต็มไปด้วยรอยยิ้ม ความสุข และเงินทองไหลมาเทมา! เหมียว~ 💰\n\n` +
                            `🎁 อยากได้ของขวัญแมวน่ารักฟรีไหม? พิมพ์ 'แมวฟรี' เลย! 😻\n` +
                            `🔮 หรือจะขอคำทำนายมงคลก็ได้นะ~ พิมพ์ 'ช่วยเหลือ' เพื่อดูเมนูความมหัศจรรย์ทั้งหมด!\n\n` +
                            `💜 ถ้าเจ้าทาสอยากให้ฟูกุมีความสามารถเพิ่มขึ้น การอัปเกรด Premium จะช่วยให้ฟูกุแข็งแกร่งขึ้นได้นะ! 🌟`
                        ];
                        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
                        await LineService.replyMessage(event.replyToken, [
                            { type: 'text', text: greeting }
                        ]);
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

// เพิ่ม GET method สำหรับทดสอบ webhook
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Webhook is working',
        config: {
            hasAccessToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
            hasSecret: !!process.env.LINE_CHANNEL_SECRET,
            timestamp: new Date().toISOString()
        }
    });
}
