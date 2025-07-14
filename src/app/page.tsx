'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

interface User {
  id: string;
  lineUserId: string;
  name: string;
  subscription: string;
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    async function getUserInfo() {
      try {
        // ตรวจสอบ message จาก URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const messageParam = urlParams.get('message');
        const errorParam = urlParams.get('error');
        
        if (messageParam) {
          setMessage(messageParam);
        }
        if (errorParam) {
          setMessage('เกิดข้อผิดพลาดในการเข้าถึง กรุณาใช้งานผ่าน LINE Bot');
        }
        
        // ตรวจสอบ LINE User ID จาก URL parameter หรือ cookie
        const lineUserIdFromUrl = urlParams.get('lineUserId');
        
        let authenticatedUserId = null;
        
        if (lineUserIdFromUrl) {
          // มี LINE User ID จาก URL (มาจาก LINE Bot)
          authenticatedUserId = lineUserIdFromUrl;
        } else {
          // ลองดึงจาก cookie
          try {
            const response = await fetch('/api/line-auth?checkCookie=true');
            if (response.ok) {
              const data = await response.json();
              authenticatedUserId = data.lineUserId;
            }
          } catch {
            // ไม่สามารถเข้าถึง cookie ได้
            console.log('No user session found');
          }
        }
        
        if (authenticatedUserId) {
          // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
          try {
            const userResponse = await fetch(`/api/line-auth?lineUserId=${authenticatedUserId}`);
            if (userResponse.ok) {
              const userData = await userResponse.json();
              setCurrentUser(userData.user);
            } else {
              // ถ้าไม่พบผู้ใช้ สร้าง user object พื้นฐาน
              const user: User = {
                id: authenticatedUserId,
                lineUserId: authenticatedUserId,
                name: 'LINE User',
                subscription: 'free'
              };
              setCurrentUser(user);
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    }

    getUserInfo();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white rounded-full"></div>
        </div>
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          {/* แสดงข้อความต้อนรับหรือแจ้งเตือน */}
          {message && (
            <div className="mb-8 p-4 bg-white/20 backdrop-blur-sm rounded-lg text-center">
              <p className="text-white">{message}</p>
            </div>
          )}
          
          {currentUser && (
            <div className="mb-8 p-4 bg-white/20 backdrop-blur-sm rounded-lg text-center">
              <p className="text-white">
                สวัสดี {currentUser.name}! ยินดีต้อนรับสู่ Fuku Neko
              </p>
              <p className="text-blue-100 text-sm mt-1">
                สถานะ: {currentUser.subscription === 'premium' ? 'Premium' : 'Free'}
              </p>
            </div>
          )}
          
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              Fuku Neko
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              แอปจัดการเงินส่วนตัวที่ทันสมัย เน้นความเป็นมืออาชีพและใช้งานง่าย
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href={currentUser ? `/dashboard?lineUserId=${currentUser.lineUserId}&auto=true` : "/dashboard"}
                className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-3 rounded-lg text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                {currentUser ? 'ดูภาพรวมข้อมูล' : 'เริ่มใช้งานฟรี'}
              </Link>
              {currentUser && (
                <Link
                  href={`/premium?lineUserId=${currentUser.lineUserId}&auto=true`}
                  className="px-8 py-3 border-2 border-white text-white rounded-lg text-base font-semibold hover:bg-white/10 transition-all duration-300"
                >
                  ดูแพคเกจ Premium
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              คุณสมบัติหลัก
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              เครื่องมือจัดการเงินครบครันสำหรับยุคดิจิทัล
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">ภาพรวมการเงิน</h3>
              <p className="text-blue-700">ติดตามรายรับ-รายจ่าย พร้อมกราฟแสดงผลรายเดือน</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">จัดการหมวดหมู่</h3>
              <p className="text-gray-600">เพิ่ม ลบ แก้ไขหมวดหมู่ และตั้งงบประมาณในแต่ละหมวด</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">ประวัติรายการ</h3>
              <p className="text-blue-700">ดูประวัติธุรกรรมทั้งหมด พร้อมตัวกรองตามวันที่และหมวดหมู่</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">ตั้งค่าระบบ</h3>
              <p className="text-gray-600">จัดการบัญชีผู้ใช้ และการตั้งค่าต่างๆ ของระบบ</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">LINE Bot</h3>
              <p className="text-blue-700">บันทึกรายการผ่าน LINE ได้ทันที ง่ายและสะดวก</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">ปลอดภัย</h3>
              <p className="text-gray-600">ข้อมูลการเงินของคุณได้รับการรักษาความปลอดภัยสูงสุด</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              แผนการใช้งาน
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              เลือกแผนที่เหมาะกับคุณ เริ่มฟรีได้เลย ไม่มีเงื่อนไขซ่อนเร้น
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-lg">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">ฟรี</h3>
                <div className="text-3xl font-bold text-gray-900 mb-4">
                  0 บาท
                  <span className="text-sm text-gray-500 font-normal">/เดือน</span>
                </div>
                <p className="text-gray-600 text-sm mb-6">เหมาะสำหรับผู้เริ่มต้น</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  บันทึกรายรับ-รายจ่าย 100 รายการ/เดือน
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  รายงานพื้นฐาน + กราฟ
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  หมวดหมู่ 15 หมวด
                </li>
                <li className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  LINE Bot
                </li>
              </ul>
              <Link href="/dashboard" className="block w-full py-3 border-2 border-blue-500 text-blue-500 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300 text-center">
                เริ่มใช้งานฟรี
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-blue-600 border border-blue-700 rounded-xl p-8 shadow-xl relative">
              <div className="absolute top-4 right-4 bg-white text-blue-600 px-3 py-1 rounded-full text-sm font-semibold">
                แนะนำ
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">พรีเมียม</h3>
                <div className="text-3xl font-bold text-white mb-4">
                  99 บาท
                  <span className="text-sm text-blue-100 font-normal">/เดือน</span>
                </div>
                <p className="text-blue-100 text-sm mb-6">สำหรับผู้ใช้งานจริงจัง</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-white">
                  <svg className="w-5 h-5 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ทุกอย่างในแผนฟรี
                </li>
                <li className="flex items-center text-white">
                  <svg className="w-5 h-5 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  บันทึกรายการไม่จำกัด
                </li>
                <li className="flex items-center text-white">
                  <svg className="w-5 h-5 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  หมวดหมู่ไม่จำกัด
                </li>
                <li className="flex items-center text-white">
                  <svg className="w-5 h-5 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  รายงานขั้นสูง + AI วิเคราะห์
                </li>
                <li className="flex items-center text-white">
                  <svg className="w-5 h-5 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ส่งออกข้อมูล
                </li>
              </ul>
              <Link href="/premium" className="block w-full py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300 text-center">
                อัปเกรดเลย
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-br from-blue-600 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white rounded-full"></div>
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              เริ่มจัดการเงินอย่างมืออาชีพวันนี้
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              เข้าร่วมกับผู้ใช้หลายพันคนที่เลือกใช้ Fuku Neko ในการจัดการการเงินส่วนตัว
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href={currentUser ? `/dashboard?lineUserId=${currentUser.lineUserId}&auto=true` : "/dashboard"}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 hover:bg-gray-50"
              >
                {currentUser ? 'ดูภาพรวมข้อมูล' : 'เริ่มใช้งานฟรี ตอนนี้เลย'}
              </Link>
              {currentUser && (
                <Link
                  href={`/premium?lineUserId=${currentUser.lineUserId}&auto=true`}
                  className="px-8 py-3 border-2 border-white text-white rounded-lg text-base font-semibold hover:bg-white/10 transition-all duration-300"
                >
                  ดูแพคเกจ Premium
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
