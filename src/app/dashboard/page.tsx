import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { MobileNavigation } from '@/components/MobileNavigation';

// For demo purposes, we'll simulate user authentication
// In a real app, you'd integrate with NextAuth.js or similar
async function getCurrentUser() {
  // This is a placeholder - in reality you'd get the user from session/JWT
  const lineUserId = 'demo_user_123'; // This would come from authentication
  return { lineUserId };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
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

      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500 mx-auto"></div>
            <div className="mt-2 text-sm sm:text-base text-gray-600">กำลังโหลด...</div>
          </div>
        </div>
      }>
        <DashboardContent userId={user.lineUserId} />
      </Suspense>
    </div>
  );
}
