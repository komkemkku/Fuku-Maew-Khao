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
    <div className="min-h-screen bg-white">
      {/* Hero Section - สีฟ้าล้วน ไม่ผสม */}
      <div className="relative overflow-hidden bg-blue-600">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-white rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white rounded-full"></div>
        </div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          {/* แสดงข้อความต้อนรับหรือแจ้งเตือน */}
          {message && (
            <div className="mb-8 p-4 bg-white/20 rounded-lg text-center">
              <p className="text-white">{message}</p>
            </div>
          )}
          
          {currentUser && (
            <div className="mb-8 p-4 bg-white/20 rounded-lg text-center">
              <p className="text-white">
                🐱 สวัสดี {currentUser.name}! ยินดีต้อนรับสู่ Fuku Neko
              </p>
              <p className="text-blue-100 text-sm mt-1">
                สถานะ: {currentUser.subscription === 'premium' ? '👑 Premium' : '🆓 Free'}
              </p>
            </div>
          )}
          
          <div className="text-center mb-12 sm:mb-16">
            <div className="mb-6">
              <span className="text-6xl sm:text-8xl">🐱</span>
            </div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Fuku Neko
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              แอปจัดการเงินส่วนตัวที่น่ารักที่สุด พร้อมแมวน้อยช่วยดูแลการเงินของคุณ 💕
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href={currentUser ? `/dashboard?lineUserId=${currentUser.lineUserId}&auto=true` : "/dashboard"}
                className="bg-white hover:bg-blue-50 text-blue-600 px-8 py-4 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                {currentUser ? 'ดูภาพรวมข้อมูล 📊' : 'เริ่มใช้งานฟรี 🐾'}
              </Link>
              {currentUser && (
                <Link
                  href={`/premium?lineUserId=${currentUser.lineUserId}&auto=true`}
                  className="px-8 py-4 border-2 border-blue-200 text-blue-100 rounded-full text-lg font-semibold hover:bg-blue-500 transition-all duration-300 hover:scale-105"
                >
                  ดูแพคเกจ Premium 👑
                </Link>
              )}
              {!currentUser && (
                <button className="px-8 py-4 border-2 border-blue-200 text-blue-100 rounded-full text-lg font-semibold hover:bg-blue-500 transition-all duration-300 hover:scale-105">
                  ดูตัวอย่าง 👀
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section - สีขาวเป็นหลัก */}
      <div className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              ทำไมต้อง <span className="text-blue-600">Fuku Neko</span>?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              เพราะเราเข้าใจว่าการจัดการเงินควรจะง่ายและสนุก เหมือนเล่นกับแมวน้อย
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 - สีฟ้า */}
            <div className="group bg-blue-50 border border-blue-100 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">💰</span>
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">ติดตามรายรับ-รายจ่าย</h3>
                <p className="text-blue-700">
                  บันทึกเงินเข้า-ออกแบบอัตโนมัติ พร้อมแมวน้อยคอยเตือนเมื่อจ่ายเกิน
                </p>
              </div>
            </div>

            {/* Feature 2 - สีขาว */}
            <div className="group bg-white border border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">รายงานสวยๆ</h3>
                <p className="text-gray-600">
                  ดูสถิติการเงินแบบกราฟสีสวย เข้าใจง่าย พร้อมคำแนะนำจากแมวที่ปรึกษา
                </p>
              </div>
            </div>

            {/* Feature 3 - สีชมพู */}
            <div className="group bg-pink-50 border border-pink-100 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-pink-900 mb-2">ตั้งเป้าหมาย</h3>
                <p className="text-pink-700">
                  กำหนดเป้าการออม แมวน้อยจะคอยเชียร์และให้กำลังใจตลอดการเดินทาง
                </p>
              </div>
            </div>

            {/* Feature 4 - สีฟ้า */}
            <div className="group bg-blue-50 border border-blue-100 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">🔒</span>
                </div>
                <h3 className="text-xl font-bold text-blue-900 mb-2">ปลอดภัย 100%</h3>
                <p className="text-blue-700">
                  ข้อมูลการเงินของคุณปลอดภัยเหมือนแมวที่หลับในกล่องที่แข็งแรงที่สุด
                </p>
              </div>
            </div>

            {/* Feature 5 - สีชมพู */}
            <div className="group bg-pink-50 border border-pink-100 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">💬</span>
                </div>
                <h3 className="text-xl font-bold text-pink-900 mb-2">LINE Bot</h3>
                <p className="text-pink-700">
                  บันทึกรายจ่ายผ่าน LINE ได้เลย แค่พิมพ์ &ldquo;กินข้าว 50 บาท&rdquo; แมวก็เข้าใจ
                </p>
              </div>
            </div>

            {/* Feature 6 - สีขาว */}
            <div className="group bg-white border border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl">🎨</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">UI น่ารัก</h3>
                <p className="text-gray-600">
                  ออกแบบมาให้ใช้งานสนุก ดูแล้วอยากจัดการเงินทุกวัน เหมือนเล่นเกม
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section - สีชมพูล้วน ไม่ผสม */}
      <div className="py-16 sm:py-20 bg-pink-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-pink-900 mb-4">
              แผนการใช้งาน
            </h2>
            <p className="text-lg sm:text-xl text-pink-700 max-w-2xl mx-auto">
              เลือกแผนที่เหมาะกับคุณ เริ่มฟรีได้เลย ไม่มีเงื่อนไขซ่อนเร้น
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan - สีขาว */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">🐱</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">ฟรี</h3>
                <div className="text-3xl font-bold text-gray-900 mb-4">
                  0 บาท
                  <span className="text-sm text-gray-500 font-normal">/เดือน</span>
                </div>
                <p className="text-gray-600 text-sm mb-6">เหมาะสำหรับผู้เริ่มต้น</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  บันทึกรายรับ-รายจ่าย 100 รายการ/เดือน
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  รายงานพื้นฐาน + กราฟ
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  หมวดหมู่ 15 หมวด
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  LINE Bot อัจฉริยะ
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-3 text-lg">✓</span>
                  รูปแมวสุ่ม + คำทำนาย
                </li>
              </ul>
              <Link href="/dashboard" className="block w-full py-3 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-all duration-300 text-center">
                เริ่มใช้งานฟรี
              </Link>
            </div>

            {/* Pro Plan - สีชมพูล้วน (แนะนำ) */}
            <div className="bg-pink-600 border border-pink-700 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white text-pink-600 px-3 py-1 rounded-full text-sm font-semibold">
                แนะนำ
              </div>
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">🐾</div>
                <h3 className="text-2xl font-bold text-white mb-2">พรีเมียม</h3>
                <div className="text-3xl font-bold text-white mb-4">
                  99 บาท
                  <span className="text-sm text-pink-100 font-normal">/เดือน</span>
                </div>
                <p className="text-pink-100 text-sm mb-6">สำหรับผู้ใช้งานจริงจัง</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-white">
                  <span className="text-white mr-3 text-lg">✓</span>
                  ทุกอย่างในแผนฟรี
                </li>
                <li className="flex items-center text-white">
                  <span className="text-white mr-3 text-lg">✓</span>
                  บันทึกรายการไม่จำกัด
                </li>
                <li className="flex items-center text-white">
                  <span className="text-white mr-3 text-lg">✓</span>
                  หมวดหมู่ไม่จำกัด
                </li>
                <li className="flex items-center text-white">
                  <span className="text-white mr-3 text-lg">✓</span>
                  อ่านสลิปอัตโนมัติ (เร็วๆ นี้)
                </li>
                <li className="flex items-center text-white">
                  <span className="text-white mr-3 text-lg">✓</span>
                  รายงานขั้นสูง + AI วิเคราะห์
                </li>
                <li className="flex items-center text-white">
                  <span className="text-white mr-3 text-lg">✓</span>
                  การแจ้งเตือนอัจฉริยะ
                </li>
                <li className="flex items-center text-white">
                  <span className="text-white mr-3 text-lg">✓</span>
                  ส่งออกข้อมูล
                </li>
                <li className="flex items-center text-white">
                  <span className="text-white mr-3 text-lg">✓</span>
                  ไม่มีโฆษณา
                </li>
              </ul>
              <Link href="/premium" className="block w-full py-3 bg-white text-pink-600 rounded-full font-semibold hover:bg-pink-50 transition-all duration-300 text-center">
                อัปเกรดเลย
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section - สีฟ้าล้วน */}
      <div className="py-16 sm:py-20 bg-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white rounded-full"></div>
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              พร้อมที่จะมีแมวช่วยจัดการเงินแล้วหรือยัง? 🐱💕
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              เริ่มต้นการเดินทางสู่เสรีภาพทางการเงินกับแมวน้อยที่น่ารักที่สุด
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href={currentUser ? `/dashboard?lineUserId=${currentUser.lineUserId}&auto=true` : "/dashboard"}
                className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 hover:bg-blue-50"
              >
                {currentUser ? 'ดูภาพรวมข้อมูล 📊' : 'เริ่มใช้งานฟรี ตอนนี้เลย! 🚀'}
              </Link>
              {currentUser && (
                <Link
                  href={`/premium?lineUserId=${currentUser.lineUserId}&auto=true`}
                  className="px-8 py-4 border-2 border-white text-white rounded-full text-lg font-semibold hover:bg-white/10 transition-all duration-300"
                >
                  ดูแพคเกจ Premium 👑
                </Link>
              )}
              {!currentUser && (
                <button className="px-8 py-4 border-2 border-white text-white rounded-full text-lg font-semibold hover:bg-white/10 transition-all duration-300">
                  ดูวิธีใช้งาน 📖
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
