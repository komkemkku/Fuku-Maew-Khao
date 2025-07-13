'use client';

import { useState, useEffect } from 'react';
import { AuthService } from '@/lib/auth';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { MobileNavigation } from '@/components/MobileNavigation';

interface User {
  id: string;
  name: string;
  email?: string;
  lineUserId?: string;
  pictureUrl?: string;
  subscription?: string;
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [creatingDemo, setCreatingDemo] = useState(false);

  useEffect(() => {
    async function initializeAuth() {
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
          // สร้าง user object จาก LINE User ID
          const user: User = {
            id: authenticatedUserId,
            lineUserId: authenticatedUserId,
            name: 'LINE User',
            subscription: 'free'
          };
          setCurrentUser(user);
        } else {
          // ถ้าไม่มี authentication ในโหมดพัฒนา ให้แสดงหน้าเลือกผู้ใช้
          if (process.env.NODE_ENV === 'development') {
            setShowUserSelect(true);
          }
        }
      } catch (_error) {
        console.error('Auth initialization failed:', _error);
        // Fallback to demo mode in development
        if (process.env.NODE_ENV === 'development') {
          setShowUserSelect(true);
        }
      } finally {
        setLoading(false);
      }
    }

    initializeAuth();
  }, []);

  const handleUserSelect = async (userId: string) => {
    setCreatingDemo(true);
    try {
      // Create demo data for this user
      const response = await fetch('/api/demo-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const user = AuthService.loginAsUser(userId);
        setCurrentUser(user);
        setShowUserSelect(false);
      } else {
        alert('เกิดข้อผิดพลาดในการสร้างข้อมูลทดสอบ');
      }
    } catch (error) {
      console.error('Error creating demo data:', error);
      alert('เกิดข้อผิดพลาดในการสร้างข้อมูลทดสอบ');
    } finally {
      setCreatingDemo(false);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setCurrentUser(null);
    if (process.env.NODE_ENV === 'development') {
      setShowUserSelect(true);
    }
  };

  const handleLineLogin = async () => {
    setLoading(true);
    try {
      const user = await AuthService.loginWithLine();
      if (user) {
        setCurrentUser(user);
        setShowUserSelect(false);
      }
    } catch (error) {
      console.error('LINE login failed:', error);
      alert('เข้าสู่ระบบผ่าน LINE ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🐱</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!currentUser || showUserSelect) {
    const demoUsers = AuthService.getDemoUsers();
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🐱</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Fuku Neko</h1>
            <p className="text-gray-600">
              {process.env.NODE_ENV === 'development' ? 'เลือกผู้ใช้สำหรับทดสอบระบบ' : 'เข้าสู่ระบบผ่าน LINE'}
            </p>
          </div>

          {/* LINE Login Button */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6">
              <button
                onClick={handleLineLogin}
                disabled={loading}
                className="w-full p-4 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <span>📱</span>
                <span>เข้าสู่ระบบด้วย LINE</span>
              </button>
            </div>
          )}

          {/* Demo Users (Development Only) */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-500 text-center">หรือใช้ข้อมูลทดสอบ</p>
              </div>

              <div className="space-y-3">
                {demoUsers.map((user) => (
                  <button
                    key={user.lineUserId}
                    onClick={() => handleUserSelect(user.lineUserId)}
                    disabled={creatingDemo}
                    className="w-full p-4 text-left bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-semibold text-gray-800">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-blue-600 mt-1">ID: {user.lineUserId}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {creatingDemo && (
            <div className="mt-6 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">กำลังสร้างข้อมูลทดสอบ...</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              {process.env.NODE_ENV === 'development' ? 
                '🔮 ระบบจะสร้างข้อมูลตัวอย่างสำหรับทดสอบการทำงาน' :
                '🔗 ใช้งานผ่าน LINE Official Account'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* User Info Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-sm text-gray-600 flex items-center space-x-2">
            <span>👤</span>
            <span>{currentUser.name}</span>
            {currentUser.lineUserId && (
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                LINE
              </span>
            )}
            <span className="text-xs text-gray-400">({currentUser.lineUserId || currentUser.id})</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
          >
            {process.env.NODE_ENV === 'development' ? 'เปลี่ยนผู้ใช้' : 'ออกจากระบบ'}
          </button>
        </div>
      </div>

      {/* Header with Mobile Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl">🐱</span>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">ฟูกุแมวขาว</h1>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden sm:flex space-x-4">
              <a href="/dashboard" className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md">
                แดชบอร์ด
              </a>
              <a href="/transactions" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md">
                รายการ
              </a>
              <a href="/categories" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md">
                หมวดหมู่
              </a>
              <a href="/budget" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md">
                งบประมาณ
              </a>
            </nav>
            
            {/* Mobile Navigation */}
            <MobileNavigation />
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <DashboardContent userId={currentUser.lineUserId || currentUser.id} />
    </div>
  );
}
