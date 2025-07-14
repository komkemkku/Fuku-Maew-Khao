'use client';

import { useState, useEffect } from 'react';
import { MobileNavigation } from '@/components/MobileNavigation';

interface User {
  id: string;
  name: string;
  email?: string;
  lineUserId?: string;
  pictureUrl?: string;
  subscription?: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const lineUserId = urlParams.get('lineUserId');
      
      if (lineUserId) {
        // Try to fetch user data from API
        const response = await fetch(`/api/line-auth?lineUserId=${lineUserId}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        } else {
          // Fallback to demo user
          setCurrentUser({
            id: lineUserId,
            name: 'LINE User',
            lineUserId: lineUserId,
            subscription: 'free',
            createdAt: '2024-01-01T00:00:00Z',
          });
        }
      } else {
        // Demo user
        setCurrentUser({
          id: 'demo',
          name: 'Demo User',
          email: 'demo@example.com',
          subscription: 'free',
          createdAt: '2024-01-01T00:00:00Z',
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Fallback to demo user
      setCurrentUser({
        id: 'demo',
        name: 'Demo User',
        subscription: 'free',
        createdAt: '2024-01-01T00:00:00Z',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (currentUser?.lineUserId) {
        const response = await fetch('/api/line-auth', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ lineUserId: currentUser.lineUserId }),
        });

        if (response.ok) {
          alert('ลบบัญชีเรียบร้อยแล้ว');
          window.location.href = '/';
        } else {
          alert('เกิดข้อผิดพลาดในการลบบัญชี');
        }
      } else {
        alert('นี่เป็นบัญชีทดลอง ไม่สามารถลบได้');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('เกิดข้อผิดพลาดในการลบบัญชี');
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNavigation />
      
      <div className="container mx-auto px-4 py-6 pb-20 lg:pb-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ตั้งค่า</h1>
          <p className="text-gray-600">จัดการบัญชีและการตั้งค่าของคุณ</p>
        </div>

        {/* User Profile Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              {currentUser?.pictureUrl ? (
                <img
                  src={currentUser.pictureUrl}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{currentUser?.name}</h2>
              <p className="text-gray-600">{currentUser?.email || 'LINE User'}</p>
              <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                currentUser?.subscription === 'premium' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {currentUser?.subscription === 'premium' ? 'Premium' : 'Free'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">User ID:</span> {currentUser?.id}
            </div>
            {currentUser?.lineUserId && (
              <div>
                <span className="font-medium">LINE User ID:</span> {currentUser.lineUserId}
              </div>
            )}
            <div>
              <span className="font-medium">สมัครสมาชิกเมื่อ:</span> {formatDate(currentUser?.createdAt || '')}
            </div>
            <div>
              <span className="font-medium">สถานะ:</span> 
              <span className="ml-1 text-green-600">ใช้งานปกติ</span>
            </div>
          </div>
        </div>

        {/* Settings Options */}
        <div className="space-y-6">
          {/* Account Settings */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">การตั้งค่าบัญชี</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">ข้อมูลส่วนตัว</p>
                    <p className="text-sm text-gray-600">แก้ไขชื่อและข้อมูลส่วนตัว</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  แก้ไข
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">ส่งออกข้อมูล</p>
                    <p className="text-sm text-gray-600">ดาวน์โหลดข้อมูลการเงินของคุณ</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  ส่งออก
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">ความเป็นส่วนตัว</p>
                    <p className="text-sm text-gray-600">จัดการการตั้งค่าความเป็นส่วนตัว</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  ตั้งค่า
                </button>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">การแจ้งเตือน</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">แจ้งเตือนรายจ่าย</p>
                    <p className="text-sm text-gray-600">แจ้งเตือนเมื่อใช้จ่ายเกินงบประมาณ</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">แจ้งเตือนผ่าน LINE</p>
                    <p className="text-sm text-gray-600">รับการแจ้งเตือนผ่าน LINE Bot</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">ความช่วยเหลือ</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">คำถามที่พบบ่อย</p>
                    <p className="text-sm text-gray-600">ดูคำตอบสำหรับคำถามที่พบบ่อย</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  ดู
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">ติดต่อเรา</p>
                    <p className="text-sm text-gray-600">ส่งคำถามหรือข้อเสนอแนะ</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  ติดต่อ
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-gray-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">นโยบายความเป็นส่วนตัว</p>
                    <p className="text-sm text-gray-600">อ่านนโยบายการใช้ข้อมูล</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  อ่าน
                </button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-red-200">
            <h3 className="text-lg font-bold text-red-900 mb-4">พื้นที่อันตราย</h3>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-medium text-red-900 mb-2">ลบบัญชี</h4>
                  <p className="text-sm text-red-700 mb-4">
                    การลบบัญชีจะลบข้อมูลทั้งหมดของคุณออกจากระบบอย่างถาวร 
                    และไม่สามารถกู้คืนได้ กรุณาพิจารณาให้ดีก่อนดำเนินการ
                  </p>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    ลบบัญชี
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <svg className="w-8 h-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <h2 className="text-xl font-bold text-gray-900">ยืนยันการลบบัญชี</h2>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีนี้? การดำเนินการนี้จะ:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>ลบข้อมูลการเงินทั้งหมดของคุณ</li>
                    <li>ลบประวัติรายการทั้งหมด</li>
                    <li>ลบการตั้งค่าและหมวดหมู่ทั้งหมด</li>
                    <li>ไม่สามารถกู้คืนข้อมูลได้</li>
                  </ul>
                  <p className="text-red-600 font-medium mt-4">
                    การดำเนินการนี้ไม่สามารถย้อนกลับได้!
                  </p>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                  >
                    ยืนยันลบบัญชี
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
