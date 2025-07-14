'use client';

import { useState, useEffect } from 'react';
import { MobileNavigation } from '@/components/MobileNavigation';
import Link from 'next/link';

interface User {
  id: string;
  lineUserId: string;
  name: string;
  subscription: string;
}

export default function PremiumPage() {
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    async function getUserInfo() {
      try {
        // ตรวจสอบ LINE User ID จาก URL parameter หรือ cookie
        const urlParams = new URLSearchParams(window.location.search);
        const lineUserIdFromUrl = urlParams.get('lineUserId');
        
        let authenticatedUserId = null;
        
        if (lineUserIdFromUrl) {
          // มี LINE User ID จาก URL (มาจาก LINE Bot)
          authenticatedUserId = lineUserIdFromUrl;
        } else {
          // ลองดึงจาก cookie
          const response = await fetch('/api/line-auth?checkCookie=true');
          if (response.ok) {
            const data = await response.json();
            authenticatedUserId = data.lineUserId;
          }
        }
        
        if (authenticatedUserId) {
          // ดึงข้อมูลผู้ใช้จากฐานข้อมูล
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
        }
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    }

    getUserInfo();
  }, []);

  const handleUpgrade = async () => {
    if (!currentUser) {
      alert('ไม่พบข้อมูลผู้ใช้');
      return;
    }

    setLoading(true);
    try {
      // เรียก API สำหรับอัปเกรด subscription
      const response = await fetch('/api/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineUserId: currentUser.lineUserId,
          plan: 'premium'
        })
      });

      if (response.ok) {
        alert('🎉 การอัปเกรดสำเร็จ! กรุณากลับไปใช้งาน LINE Bot');
        // อัปเดทข้อมูลผู้ใช้
        setCurrentUser({
          ...currentUser,
          subscription: 'premium'
        });
      } else {
        alert('เกิดข้อผิดพลาดในการอัปเกรด กรุณาลองใหม่อีกครั้ง');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('เกิดข้อผิดพลาดในการอัปเกรด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <MobileNavigation />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-24 h-24 bg-white rounded-full animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-white rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 right-1/3 w-20 h-20 bg-white rounded-full animate-bounce delay-500"></div>
        </div>
        
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Premium Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white mb-6">
              <span className="text-2xl mr-2">👑</span>
              <span className="font-semibold">Fuku Neko Premium</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              ปลดล็อกศักยภาพ
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                การเงินสุดพรีเมียม
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              เติมเต็มประสบการณ์การจัดการเงินด้วยฟีเจอร์พิเศษที่จะช่วยให้คุณควบคุมการเงินได้อย่างมืออาชีพ
            </p>

            {/* Status Badge */}
            {currentUser && (
              <div className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl text-white mb-8">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                  <span className="font-medium">สถานะปัจจุบัน: </span>
                  <span className="ml-2 font-bold">
                    {currentUser.subscription === 'premium' ? '👑 Premium Member' : '🆓 Free Member'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Comparison Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              เปรียบเทียบแผนการใช้งาน
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              เลือกแผนที่เหมาะกับคุณ เริ่มฟรีได้เลย หรืออัปเกรดเพื่อฟีเจอร์เต็มรูปแบบ
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 relative">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <span className="text-2xl">🆓</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">แผนฟรี</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  0 บาท
                </div>
                <p className="text-gray-600">ใช้งานได้ตลอดไป</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">บันทึกรายการ <strong>500 รายการ/เดือน</strong></span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">หมวดหมู่ <strong>15 หมวด</strong></span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">รายงานพื้นฐาน + กราฟ</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">LINE Bot + รูปแมวฟรี</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">การจัดหมวดหมู่อัตโนมัติ</span>
                </li>
              </ul>

              <button
                disabled={currentUser?.subscription === 'free'}
                className={`w-full py-4 px-6 rounded-lg font-semibold transition-all duration-300 ${
                  currentUser?.subscription === 'free'
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700 hover:shadow-lg'
                }`}
              >
                {currentUser?.subscription === 'free' ? '✓ แผนปัจจุบัน' : 'เริ่มใช้งานฟรี'}
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-700 border-2 border-blue-500 rounded-2xl p-8 relative shadow-2xl">
              {/* Recommended Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  ⭐ แนะนำ
                </div>
              </div>

              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                  <span className="text-2xl">👑</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">แผนพรีเมียม</h3>
                <div className="text-4xl font-bold text-white mb-2">
                  99 บาท
                </div>
                <p className="text-blue-100">ต่อเดือน</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white">ทุกอย่างในแผนฟรี</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white">บันทึกรายการ <strong>ไม่จำกัด</strong></span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white">หมวดหมู่ <strong>ไม่จำกัด</strong></span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white">รายงานขั้นสูง + AI วิเคราะห์</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white">ส่งออกข้อมูล Excel/PDF</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white">การแจ้งเตือนอัตโนมัติ</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white">ความปลอดภัยขั้นสูง</span>
                </li>
              </ul>

              <button
                onClick={handleUpgrade}
                disabled={loading || currentUser?.subscription === 'premium'}
                className={`w-full py-4 px-6 rounded-lg font-semibold transition-all duration-300 ${
                  currentUser?.subscription === 'premium'
                    ? 'bg-white/20 text-white cursor-not-allowed'
                    : 'bg-white text-blue-600 hover:bg-gray-50 hover:shadow-lg transform hover:scale-105'
                } ${loading ? 'animate-pulse' : ''}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                    กำลังอัปเกรด...
                  </div>
                ) : currentUser?.subscription === 'premium' ? (
                  '✓ คุณเป็นสมาชิก Premium แล้ว'
                ) : (
                  '🚀 อัปเกรดเป็น Premium'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              ทำไมต้อง Premium?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ปลดล็อกฟีเจอร์พิเศษที่จะเปลี่ยนวิธีจัดการเงินของคุณให้ดีขึ้น
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">รายงานขั้นสูง</h3>
              <p className="text-gray-600">
                วิเคราะห์รูปแบบการใช้จ่าย พร้อม AI ที่จะแนะนำวิธีประหยัดเงิน
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">🔔</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">แจ้งเตือนอัตโนมัติ</h3>
              <p className="text-gray-600">
                เตือนเมื่อใช้เงินเกินงบ หรือใกล้วันครบกำหนดชำระบิล
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl">📁</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">ส่งออกข้อมูล</h3>
              <p className="text-gray-600">
                ดาวน์โหลดรายงานเป็น Excel หรือ PDF สำหรับจัดเก็บหรือส่งให้ผู้อื่น
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              พร้อมที่จะเป็นมืออาชีพหรือยัง?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              เข้าร่วมกับผู้ใช้พรีเมียมหลายร้อยคนที่ไว้วางใจ Fuku Neko ในการจัดการการเงิน
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {currentUser ? (
                <>
                  <Link
                    href={`/dashboard?lineUserId=${currentUser.lineUserId}&auto=true`}
                    className="bg-white text-blue-600 px-8 py-3 rounded-lg text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    กลับไป Dashboard
                  </Link>
                  {currentUser.subscription !== 'premium' && (
                    <button
                      onClick={handleUpgrade}
                      disabled={loading}
                      className="px-8 py-3 border-2 border-white text-white rounded-lg text-base font-semibold hover:bg-white/10 transition-all duration-300"
                    >
                      {loading ? 'กำลังอัปเกรด...' : 'อัปเกรดตอนนี้'}
                    </button>
                  )}
                </>
              ) : (
                <Link
                  href="/dashboard"
                  className="bg-white text-blue-600 px-8 py-3 rounded-lg text-base font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                >
                  เริ่มใช้งานเลย
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white py-8 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">
            มีคำถาม? ติดต่อเราผ่าน LINE Bot หรือส่งข้อความมาที่ 
            <span className="font-semibold text-blue-600"> Fuku Neko Official</span>
          </p>
        </div>
      </div>
    </div>
  );
}
