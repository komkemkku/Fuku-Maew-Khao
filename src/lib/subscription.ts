import { SubscriptionFeatures } from '@/types';

export class SubscriptionService {
  /**
   * Get subscription features for free plan
   */
  static getFreeFeatures(): SubscriptionFeatures {
    return {
      receiptOCR: false,
      advancedReports: false,
      smartNotifications: false,
      noAds: false,
      categoryLimit: 15, // จากการตั้งค่าเริ่มต้น
      transactionLimit: 100, // จำกัด 100 รายการต่อเดือน
      budgetAlerts: false,
      exportData: false,
      prioritySupport: false
    };
  }

  /**
   * Get subscription features for premium plan
   */
  static getPremiumFeatures(): SubscriptionFeatures {
    return {
      receiptOCR: true,
      advancedReports: true,
      smartNotifications: true,
      noAds: true,
      categoryLimit: -1, // ไม่จำกัด
      transactionLimit: -1, // ไม่จำกัด
      budgetAlerts: true,
      exportData: true,
      prioritySupport: true
    };
  }

  /**
   * Get features based on subscription plan
   */
  static getFeatures(plan: 'free' | 'premium'): SubscriptionFeatures {
    return plan === 'premium' ? this.getPremiumFeatures() : this.getFreeFeatures();
  }

  /**
   * Check if user can access a specific feature
   */
  static canAccessFeature(plan: 'free' | 'premium', feature: keyof SubscriptionFeatures): boolean {
    const features = this.getFeatures(plan);
    return !!features[feature];
  }

  /**
   * Get subscription plan pricing
   */
  static getPricing() {
    return {
      free: {
        name: 'ฟรี',
        price: 0,
        duration: 'ตลอดชีพ',
        features: [
          '✅ จัดการรายรับ-รายจ่ายพื้นฐาน',
          '✅ หมวดหมู่เริ่มต้น 15 หมวด',
          '✅ บันทึกรายการ 100 รายการ/เดือน',
          '✅ ดูสรุปรายเดือน',
          '✅ แชทกับฟูกุแมว',
          '❌ อ่านสลิปอัตโนมัติ',
          '❌ รายงานขั้นสูง',
          '❌ การแจ้งเตือนอัจฉริยะ',
          '❌ ส่งออกข้อมูล'
        ]
      },
      premium: {
        name: 'พรีเมียม',
        price: 99,
        duration: 'ต่อเดือน',
        features: [
          '✅ ทุกฟีเจอร์ของแพลนฟรี',
          '✨ อ่านสลิปอัตโนมัติ (ส่งรูปใบเสร็จ)',
          '📊 รายงานการเงินขั้นสูง + กราฟ',
          '🔔 การแจ้งเตือนอัจฉริยะ',
          '🚫 ไม่มีโฆษณา',
          '📂 หมวดหมู่ไม่จำกัด',
          '📝 บันทึกรายการไม่จำกัด',
          '💾 ส่งออกข้อมูล Excel/PDF',
          '⭐ การสนับสนุนลำดับความสำคัญ'
        ]
      }
    };
  }

  /**
   * Get upgrade benefits message
   */
  static getUpgradeMessage(): string {
    const pricing = this.getPricing();
    
    return `🌟 อัปเกรดเป็น Fuku Neko Premium!\n\n` +
      `💎 ราคาเพียง ${pricing.premium.price} บาท${pricing.premium.duration}\n\n` +
      `🎁 ฟีเจอร์พิเศษที่คุณจะได้รับ:\n` +
      pricing.premium.features.join('\n') + '\n\n' +
      `📱 สมัครได้ที่: ${process.env.APP_URL}/premium\n\n` +
      `🎪 สนับสนุนการพัฒนาฟูกุให้ดีขึ้นไปอีก! 😸`;
  }

  /**
   * Check if user has reached limits
   */
  static async checkLimits(plan: 'free' | 'premium', currentUsage: {
    categories: number;
    monthlyTransactions: number;
  }): Promise<{
    categoriesExceeded: boolean;
    transactionsExceeded: boolean;
    message?: string;
  }> {
    const features = this.getFeatures(plan);
    
    const categoriesExceeded = features.categoryLimit > 0 && currentUsage.categories >= features.categoryLimit;
    const transactionsExceeded = features.transactionLimit > 0 && currentUsage.monthlyTransactions >= features.transactionLimit;
    
    let message = '';
    
    if (categoriesExceeded && transactionsExceeded) {
      message = `🚫 คุณใช้ครบโควต้าแล้ว!\n• หมวดหมู่: ${currentUsage.categories}/${features.categoryLimit}\n• รายการต่อเดือน: ${currentUsage.monthlyTransactions}/${features.transactionLimit}\n\n${this.getUpgradeMessage()}`;
    } else if (categoriesExceeded) {
      message = `🚫 หมวดหมู่เต็มแล้ว! (${currentUsage.categories}/${features.categoryLimit})\n\n${this.getUpgradeMessage()}`;
    } else if (transactionsExceeded) {
      message = `🚫 บันทึกรายการครบโควต้าเดือนนี้แล้ว! (${currentUsage.monthlyTransactions}/${features.transactionLimit})\n\n${this.getUpgradeMessage()}`;
    }
    
    return {
      categoriesExceeded,
      transactionsExceeded,
      message: message || undefined
    };
  }
}
