import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // ตรวจสอบการเข้าถึงหน้า dashboard และ premium
  if (request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/premium')) {
    
    const lineUserId = request.nextUrl.searchParams.get('lineUserId');
    const auto = request.nextUrl.searchParams.get('auto');
    
    // ถ้ามี lineUserId และ auto=true จาก LINE Bot
    if (lineUserId && auto === 'true') {
      // ตรวจสอบว่า LINE User ID มีรูปแบบที่ถูกต้อง
      if (!lineUserId.match(/^[a-zA-Z0-9]+$/)) {
        const homeUrl = new URL('/', request.url);
        homeUrl.searchParams.set('error', 'invalid_user_id');
        return NextResponse.redirect(homeUrl);
      }
      
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
    
    if (lineUserIdFromCookie && lineUserIdFromCookie.match(/^[a-zA-Z0-9]+$/)) {
      // มี LINE User ID แล้ว ให้เข้าได้
      return NextResponse.next();
    }
    
    // สำหรับ development mode ให้เข้าได้
    if (process.env.NODE_ENV === 'development') {
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
  matcher: ['/dashboard/:path*', '/premium/:path*']
};
