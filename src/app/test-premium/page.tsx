'use client';

import { useState, useEffect } from 'react';
import { MobileNavigation } from '@/components/MobileNavigation';
import { SubscriptionService } from '@/lib/subscription';
import Link from 'next/link';

export default function PremiumTestPage() {
  const [userPlan, setUserPlan] = useState<'free' | 'premium'>('free');
  const [testUserId, setTestUserId] = useState('');

  const testUsers = [
    { id: 'test_premium_user', plan: 'premium', name: 'ผู้ใช้พรีเมียม' },
    { id: 'test_free_user', plan: 'free', name: 'ผู้ใช้ฟรี' },
  ];

  const handleTestUser = async (userId: string, plan: 'free' | 'premium') => {
    setTestUserId(userId);
    setUserPlan(plan);
    
    // จำลองการเข้าสู่ระบบ
    const testUrl = `/dashboard?lineUserId=${userId}`;
    window.open(testUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNavigation />
      
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">🧪 ทดสอบระบบพรีเมียม</h1>
              <p className="text-gray-600">ทดสอบฟีเจอร์แตกต่างกันระหว่างผู้ใช้ฟรีและพรีเมียม</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Free User Test */}
              <div className="border-2 border-gray-200 rounded-xl p-6">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">👤</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">ผู้ใช้ฟรี</h3>
                  <p className="text-sm text-gray-600">ข้อจำกัด: 500 รายการ/เดือน, 15 หมวดหมู่</p>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <span className="text-red-500 mr-2">❌</span>
                    <span>ไม่มีการสแกนใบเสร็จ</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-red-500 mr-2">❌</span>
                    <span>ไม่มีรายงานขั้นสูง</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-red-500 mr-2">❌</span>
                    <span>ไม่สามารถส่งออกข้อมูล</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-orange-500 mr-2">⚠️</span>
                    <span>แสดงการเตือนขีดจำกัด</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleTestUser('test_free_user', 'free')}
                  className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  🧪 ทดสอบผู้ใช้ฟรี
                </button>
              </div>

              {/* Premium User Test */}
              <div className="border-2 border-purple-200 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-pink-50">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">👑</span>
                  </div>
                  <h3 className="text-xl font-bold text-purple-900">ผู้ใช้พรีเมียม</h3>
                  <p className="text-sm text-purple-600">ไม่จำกัด + ฟีเจอร์พิเศษ</p>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✅</span>
                    <span>สแกนใบเสร็จอัตโนมัติ</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✅</span>
                    <span>รายงานขั้นสูงพร้อมกราฟ</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✅</span>
                    <span>ส่งออกข้อมูล Excel/PDF</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-green-500 mr-2">✅</span>
                    <span>ไม่มีขีดจำกัด</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleTestUser('test_premium_user', 'premium')}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                >
                  ✨ ทดสอบผู้ใช้พรีเมียม
                </button>
              </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-bold text-blue-900 mb-3">📋 คำแนะนำการทดสอบ:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>คลิกปุ่มทดสอบเพื่อเปิดหน้าต่างใหม่</li>
                <li>สังเกตความแตกต่างของ UI ระหว่างผู้ใช้ฟรีและพรีเมียม</li>
                <li>ทดสอบการเพิ่มรายการ (ผู้ใช้ฟรีจะมีข้อจำกัด)</li>
                <li>ดูฟีเจอร์ที่ล็อกและปลดล็อก</li>
                <li>ทดสอบการแจ้งเตือนขีดจำกัด</li>
              </ol>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/premium"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
              >
                🌟 ดูหน้าแพคเกจพรีเมียม
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
