/**
 * Sticker Response Service
 * สำหรับตอบกลับสติกเกอร์ด้วยข้อความน่ารักๆ
 */

import { Message } from '@line/bot-sdk';
import { FortuneService } from './fortune-service';

export class StickerResponseService {
  /**
   * ข้อความตอบกลับสติกเกอร์แยกตามประเภท
   */
  private static readonly STICKER_RESPONSES = {
    // สติกเกอร์แสดงความรัก/ใจ ❤️
    love: [
      "😻 อ๊าาาา น่ารักจัง! ฟูกุรักเจ้าทาสมากเลย~ 💕",
      "💖 ฟูกุก็รักเจ้าทาสเหมือนกันนะ! หัวใจเต้นแรงเลย 💓",
      "🥰 เจ้าทาสทำให้ฟูกุมีความสุขมากๆ เลยอะ!",
      "😸 เหมียว~ ฟูกุจะดูแลเจ้าทาสให้ดีที่สุดเลย! 💝",
      "💞 ความรักนี้ยิ่งใหญ่เหมือนความรักของแมวที่มีต่อปลาทูน่า! 🐟"
    ],

    // สติกเกอร์แสดงความสุข/ยิ้ม 😊
    happy: [
      "😄 ดีใจด้วยนะ! ฟูกุก็มีความสุขเหมือนกัน~",
      "🎉 ยินดีด้วยจ้า! มาฉลองด้วยการบันทึกรายรับไหม? 💰",
      "😸 วันนี้เจ้าทาสดูมีความสุขมากเลย ฟูกุก็เป็นสุขด้วย!",
      "🌈 ความสุขของเจ้าทาสคือความสุขของฟูกุด้วย! เหมียว~",
      "✨ รอยยิ้มสวยมาก! อย่าลืมยิ้มทุกวันนะ 😊"
    ],

    // สติกเกอร์แสดงความเศร้า/ร้องไห้ 😢
    sad: [
      "🥺 ไม่เป็นไรนะ ฟูกุอยู่ข้างๆ เจ้าทาสเสมอ...",
      "😿 อย่าเศร้าเลย ฟูกุจะเป็นกำลังใจให้! พิมพ์ 'แมวเลีย' ขอคำทำนายดีๆ มาดูไหม?",
      "💙 ทุกคนมีวันที่ไม่ดีบ้าง แต่พรุ่งนี้จะดีขึ้นแน่ๆ นะ",
      "🤗 ขอกอดหน่อย~ ฟูกุจะให้กำลังใจเจ้าทาสเสมอ",
      "🌟 หลังฝนมาแล้วจะมีรุ้ง ใจเย็นๆ นะคะ"
    ],

    // สติกเกอร์แสดงความโกรธ/หงุดหงิด 😠
    angry: [
      "😾 หืม! ฟูกุเข้าใจความรู้สึกของเจ้าทาส เหมือนตอนขนมแมวหมด!",
      "💢 โกรธไปทำไม ลองหาอะไรดีๆ ทำดีกว่า เช่นดูสรุปการเงิน?",
      "😤 ใจเย็นๆ นะ หายใจเข้าลึกๆ แล้วนับ 1-10",
      "🙄 ฟูกุแนะนำให้ไปกินไอศกรีม แล้วค่อยคิดใหม่นะ",
      "😼 โกรธแล้วแมวหน้าตาจะไม่น่ารักนะ! เอาใจใส่ตัวเองหน่อย"
    ],

    // สติกเกอร์แสดงความประหลาดใจ 😮
    surprise: [
      "😱 OMG! เกิดอะไรขึ้นเหรอ? ฟูกุตกใจมาก!",
      "🤯 วอว! น่าแปลกใจจัง เล่าให้ฟูกุฟังหน่อยสิ~",
      "😲 เออ!? เจ้าทาสทำให้ฟูกุต้องอ้าปากค้าง!",
      "🎪 เซอร์ไพรส์! ฟูกุชอบความแปลกใจแบบนี้~",
      "⚡ ตกใจจัง! หัวใจฟูกุเต้นแรงมาก เหมียว!"
    ],

    // สติกเกอร์นอน/เหนื่อย 😴
    sleepy: [
      "😴 ง่วงแล้วเหรอ? ฟูกุก็อยากนอนเหมือนกัน~ หลับฝันดีนะ",
      "🌙 Good night! อย่าลืมบันทึกรายจ่ายก่อนนอนนะ",
      "😪 นอนให้หลับสบาย พรุ่งนี้ตื่นมาจะสดใสแน่ๆ",
      "🛏️ ฟูกุจะเฝ้าความฝันให้เจ้าทาส หลับฝันดีนะคะ",
      "💤 หลับให้พอ 8 ชั่วโมงนะ สุขภาพจะดี!"
    ],

    // สติกเกอร์อาหาร/หิว 🍽️
    food: [
      "🍽️ หิวแล้วเหรอ? อย่าลืมบันทึกค่าอาหารนะ!",
      "😋 ดูอร่อยมาก! ฟูกุก็อยากกินเหมือนกัน~",
      "🐟 อยากได้ปลาทูน่าบ้าง เหมียว~ แต่เจ้าทาสกินให้อร่อยนะ",
      "🍱 อย่าลืมกินอาหารให้ครบ 3 มื้อนะ สุขภาพสำคัญ!",
      "🥛 กินแล้วอย่าลืมดื่มน้ำด้วยนะ ฟูกุเป็นห่วง"
    ],

    // สติกเกอร์ทำงาน/เหนื่อย 💼
    work: [
      "💼 ทำงานหนักเหรอ? อย่าลืมพักบ้างนะ",
      "📊 การทำงานก็สำคัญ แต่การดูแลการเงินก็สำคัญเหมือนกัน!",
      "⏰ Work-life balance สำคัญนะ ฟูกุเป็นห่วง",
      "💪 สู้ๆ นะเจ้าทาส! ฟูกุเชื่อว่าเจ้าทาสทำได้!",
      "🎯 มุ่งมั่นไปเรื่อยๆ แต่อย่าลืมดูแลตัวเองด้วยนะ"
    ],

    // สติกเกอร์ทั่วไป
    general: [
      "😸 เหมียว~ ฟูกุเข้าใจความรู้สึกของเจ้าทาสนะ!",
      "🐾 ฟูกุอยู่ที่นี่เสมอ มีอะไรปรึกษาได้นะ",
      "💫 วันนี้เป็นไงบ้าง? พิมพ์ 'สรุป' ดูสถานะการเงินไหม?",
      "🎭 สติกเกอร์น่ารักมาก! ฟูกุชอบ~",
      "✨ Thank you for the sticker! ฟูกุรู้สึกดีมาก",
      "🌟 เจ้าทาสใจดี ส่งสติกเกอร์ให้ฟูกุ เหมียว~",
      "💝 ขอบคุณสำหรับสติกเกอร์นะ! ฟูกุมีความสุข"
    ]
  };

  /**
   * สร้างข้อความตอบกลับสติกเกอร์
   */
  static createStickerResponse(packageId?: string, stickerId?: string): Message[] {
    // วิเคราะห์ประเภทสติกเกอร์จาก packageId และ stickerId
    const stickerType = this.analyzeStickerType(packageId, stickerId);
    
    // สุ่มข้อความตอบกลับ
    const responses = this.STICKER_RESPONSES[stickerType] || this.STICKER_RESPONSES.general;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // เพิ่มคำแนะนำสุ่ม
    const tips = this.getRandomTips();
    
    return [{
      type: 'text',
      text: `${randomResponse}\n\n${tips}`
    }];
  }

  /**
   * วิเคราะห์ประเภทสติกเกอร์
   */
  private static analyzeStickerType(packageId?: string, stickerId?: string): keyof typeof StickerResponseService.STICKER_RESPONSES {
    // LINE Official stickers analysis
    if (packageId && stickerId) {
      const id = parseInt(stickerId);
      
      // Package 1 - Brown & Cony
      if (packageId === '1') {
        if ([1, 2, 3, 106, 107, 108, 109, 110].includes(id)) return 'love';
        if ([4, 5, 6, 7, 8].includes(id)) return 'happy';
        if ([9, 10, 11, 12].includes(id)) return 'sad';
        if ([13, 14, 15, 16].includes(id)) return 'angry';
        if ([17, 18, 19, 20].includes(id)) return 'surprise';
      }
      
      // Package 2 - Emoji
      if (packageId === '2') {
        if ([144, 145, 146, 147, 148].includes(id)) return 'love';
        if ([149, 150, 151, 152, 153, 154].includes(id)) return 'happy';
        if ([155, 156, 157, 158].includes(id)) return 'sad';
        if ([159, 160, 161, 162].includes(id)) return 'angry';
      }
      
      // Package 11537 - หิว/อาหาร
      if (packageId === '11537') return 'food';
      
      // Package 11538 - นอน/เหนื่อย  
      if (packageId === '11538') return 'sleepy';
      
      // Package 11539 - ทำงาน
      if (packageId === '11539') return 'work';
    }
    
    return 'general';
  }

  /**
   * สุ่มคำแนะนำ
   */
  private static getRandomTips(): string {
    const tips = [
      "💡 Tip: พิมพ์ 'สรุป' เพื่อดูสถานะการเงินนะ",
      "📝 Tip: ลองบันทึกรายจ่ายวันนี้ดูไหม?",
      "🎯 Tip: ตั้งเป้าหมายการออมเล็กๆ ดูมั้ย?",
      "🌟 Tip: พิมพ์ 'แมวเลีย' เพื่อขอคำทำนาย!",
      "💰 Tip: การติดตามรายจ่ายช่วยให้ประหยัดได้นะ",
      "🐱 Tip: พิมพ์ 'แมวฟรี' เพื่อรับรูปแมวน่ารัก!",
      "📊 Tip: ดูงบประมาณประจำเดือนกันไหม?",
      "✨ Tip: พิมพ์ 'ช่วยเหลือ' เพื่อดูคำสั่งทั้งหมด"
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  }

  /**
   * สร้างข้อความตอบกลับแบบพิเศษ (มีคำทำนายด้วย)
   */
  static createSpecialStickerResponse(packageId?: string, stickerId?: string): Message[] {
    const stickerType = this.analyzeStickerType(packageId, stickerId);
    const responses = this.STICKER_RESPONSES[stickerType] || this.STICKER_RESPONSES.general;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // เพิ่มคำทำนายพิเศษ
    const fortune = FortuneService.getRandomFortune();
    
    return [{
      type: 'text',
      text: `${randomResponse}\n\n${fortune}`
    }];
  }

  /**
   * ตอบกลับด้วยสติกเกอร์ (ถ้าต้องการ)
   */
  static createStickerReplyWithSticker(packageId?: string, stickerId?: string): Message[] {
    const textResponse = this.createStickerResponse(packageId, stickerId);
    
    // สุ่มสติกเกอร์ตอบกลับ (LINE Free stickers)
    const replyStickers = [
      { packageId: '1', stickerId: '1' },    // Brown หัวใจ
      { packageId: '1', stickerId: '2' },    // Cony หัวใจ
      { packageId: '1', stickerId: '4' },    // Brown ยิ้ม
      { packageId: '2', stickerId: '144' },  // หัวใจ
      { packageId: '2', stickerId: '149' }   // ยิ้ม
    ];
    
    const randomSticker = replyStickers[Math.floor(Math.random() * replyStickers.length)];
    
    return [
      ...textResponse,
      {
        type: 'sticker',
        packageId: randomSticker.packageId,
        stickerId: randomSticker.stickerId
      }
    ];
  }

  /**
   * ตรวจสอบว่าควรตอบกลับด้วยข้อความพิเศษหรือไม่
   */
  static shouldUseSpecialResponse(): boolean {
    // 30% โอกาสที่จะใช้คำทำนายพิเศษ
    return Math.random() < 0.3;
  }

  /**
   * ตรวจสอบว่าควรตอบกลับด้วยสติกเกอร์หรือไม่
   */
  static shouldReplyWithSticker(): boolean {
    // 20% โอกาสที่จะตอบกลับด้วยสติกเกอร์
    return Math.random() < 0.2;
  }
}
