'use client';

import { useState } from 'react';

export default function PremiumPage() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    setTimeout(() => {
      alert('🎉 การอัปเกรดสำเร็จ! กรุณากลับไปใช้งาน LINE Bot');
      setLoading(false);
    }, 2000);
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
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                🆓 Free Plan
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
            </ul>

            <button
              disabled
              className="w-full py-3 px-6 rounded-xl bg-gray-500 text-white font-semibold cursor-not-allowed"
            >
              แพลนปัจจุบัน
            </button>
          </div>

          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-8 border-2 border-yellow-300">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                👑 Premium Plan
              </h3>
              <div className="text-3xl font-bold text-white">฿299</div>
              <p className="text-white/90">/เดือน</p>
            </div>
            
            <ul className="space-y-3 mb-8">
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
                อ่านสลิปอัตโนมัติ
              </li>
              <li className="flex items-center text-white">
                <span className="text-green-200 mr-3">✓</span>
                รายงานขั้นสูง + กราฟ
              </li>
            </ul>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-white text-orange-600 font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {loading ? '🔄 กำลังดำเนินการ...' : '🚀 อัปเกรดเลย!'}
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
