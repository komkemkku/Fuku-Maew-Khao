'use client';

import { useState, useEffect } from 'react';

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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-500">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            🐱 Fuku Neko Premium
          </h1>
          <p className="text-xl text-white/90">
            ปลดล็อคความสามารถเต็มรูปแบบของฟูกุ
          </p>
          {currentUser && (
            <div className="mt-4 bg-white/20 rounded-lg p-4 inline-block">
              <p className="text-white">
                สถานะปัจจุบัน: {currentUser.subscription === 'premium' ? '👑 Premium' : '🆓 Free'}
              </p>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                🐱 แมวน้อย
              </h3>
              <div className="text-3xl font-bold text-white">ฟรี</div>
              <p className="text-white/80">ตลอดไป</p>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-white/90">
                <span className="text-green-400 mr-3">✓</span>
                บันทึกรายการ 100 รายการ/เดือน
              </li>
              <li className="flex items-center text-white/90">
                <span className="text-green-400 mr-3">✓</span>
                หมวดหมู่ 15 หมวด
              </li>
              <li className="flex items-center text-white/90">
                <span className="text-green-400 mr-3">✓</span>
                รูปแมวฟรี & คำทำนาย
              </li>
              <li className="flex items-center text-white/90">
                <span className="text-green-400 mr-3">✓</span>
                รายงานพื้นฐาน
              </li>
            </ul>

            <button
              disabled
              className="w-full py-3 px-6 rounded-xl bg-gray-500 text-white font-semibold cursor-not-allowed"
            >
              {currentUser?.subscription === 'free' ? 'แพลนปัจจุบัน' : 'แพลนฟรี'}
            </button>
          </div>

          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-8 border-2 border-yellow-300">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                👑 แมวโปร
              </h3>
              <div className="text-3xl font-bold text-white">฿99</div>
              <p className="text-white/90">/เดือน</p>
            </div>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center text-white">
                <span className="text-green-200 mr-3">✓</span>
                ทุกอย่างในแพลนฟรี
              </li>
              <li className="flex items-center text-white">
                <span className="text-green-200 mr-3">✓</span>
                บันทึกรายการไม่จำกัด
              </li>
              <li className="flex items-center text-white">
                <span className="text-green-200 mr-3">✓</span>
                หมวดหมู่ไม่จำกัด
              </li>
              <li className="flex items-center text-white">
                <span className="text-green-200 mr-3">✓</span>
                อ่านสลิปอัตโนมัติ (เร็วๆ นี้)
              </li>
              <li className="flex items-center text-white">
                <span className="text-green-200 mr-3">✓</span>
                รายงานขั้นสูง + กราฟ
              </li>
              <li className="flex items-center text-white">
                <span className="text-green-200 mr-3">✓</span>
                ส่งออกข้อมูล
              </li>
              <li className="flex items-center text-white">
                <span className="text-green-200 mr-3">✓</span>
                ไม่มีโฆษณา
              </li>
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={loading || currentUser?.subscription === 'premium'}
              className="w-full py-3 px-6 rounded-xl bg-white text-orange-600 font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔄 กำลังดำเนินการ...' : 
               currentUser?.subscription === 'premium' ? '✅ อัปเกรดแล้ว' : '🚀 อัปเกรดเลย!'}
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <a
            href="https://line.me/R/ti/p/@fukuneko"
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            🔙 กลับไป LINE Bot
          </a>
        </div>
      </div>
    </div>
  );
}
