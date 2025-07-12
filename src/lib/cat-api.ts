/**
 * Cat API Service - สำหรับดึงรูปแมวสุ่มและฟีเจอร์เกี่ยวกับแมว
 */

interface CatApiResponse {
  id: string;
  url: string;
  width: number;
  height: number;
}

interface CatFact {
  fact: string;
  length: number;
}

export class CatApiService {
  private static readonly CAT_API_URL = 'https://api.thecatapi.com/v1/images/search';
  private static readonly CAT_FACT_URL = 'https://catfact.ninja/fact';

  /**
   * ดึงรูปแมวสุ่ม 1 รูป
   */
  static async getRandomCatImage(): Promise<string | null> {
    try {
      const response = await fetch(this.CAT_API_URL);
      
      if (!response.ok) {
        console.error('Cat API Error:', response.status, response.statusText);
        return null;
      }

      const data: CatApiResponse[] = await response.json();
      
      if (data && data.length > 0) {
        return data[0].url;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching cat image:', error);
      return null;
    }
  }

  /**
   * ดึงข้อเท็จจริงเกี่ยวกับแมว (สำหรับอนาคต)
   */
  static async getCatFact(): Promise<string | null> {
    try {
      const response = await fetch(this.CAT_FACT_URL);
      
      if (!response.ok) {
        console.error('Cat Fact API Error:', response.status, response.statusText);
        return null;
      }

      const data: CatFact = await response.json();
      return data.fact;
    } catch (error) {
      console.error('Error fetching cat fact:', error);
      return null;
    }
  }

  /**
   * รูปแมวสำรองในกรณีที่ API ล่ม
   */
  static getFallbackCatImages(): string[] {
    return [
      'https://placekitten.com/400/300',
      'https://placekitten.com/350/400',
      'https://placekitten.com/380/350',
      'https://placekitten.com/420/320',
      'https://placekitten.com/360/380'
    ];
  }

  /**
   * ดึงรูปแมวพร้อม fallback
   */
  static async getCatImageWithFallback(): Promise<string> {
    const image = await this.getRandomCatImage();
    
    if (image) {
      return image;
    }
    
    // ใช้รูปสำรอง
    const fallbackImages = this.getFallbackCatImages();
    const randomIndex = Math.floor(Math.random() * fallbackImages.length);
    return fallbackImages[randomIndex];
  }
}
