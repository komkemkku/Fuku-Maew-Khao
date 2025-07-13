import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // ตรวจสอบการเข้าถึงหน้า dashboard และ subscription
  if (request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/subscription')) {
    
    const lineUserId = request.nextUrl.searchParams.get('lineUserId');
    const auto = request.nextUrl.searchParams.get('auto');
    
    // ถ้ามี lineUserId และ auto=true จาก LINE Bot
    if (lineUserId && auto === 'true') {
      // อนุญาตให้เข้าได้โดยตรง - ไม่ต้อง login
      const response = NextResponse.next();
      
      // เก็บ LINE User ID ใน cookie สำหรับใช้ในหน้าอื่นๆ
      response.cookies.set('line_user_id', lineUserId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 7 วัน
      });
      
      return response;
    }
    
    // ตรวจสอบว่ามี LINE User ID ใน cookie หรือไม่
    const lineUserIdFromCookie = request.cookies.get('line_user_id')?.value;
    
    if (lineUserIdFromCookie) {
      // มี LINE User ID แล้ว ให้เข้าได้
      return NextResponse.next();
    }
    
    // ไม่มี authentication ให้กลับไปหน้าแรกพร้อมข้อความ
    const homeUrl = new URL('/', request.url);
    homeUrl.searchParams.set('message', 'กรุณาเข้าถึงจากบอท LINE Fuku Neko');
    
    return NextResponse.redirect(homeUrl);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/subscription/:path*']
};
