'use client';

import { useState, useEffect } from 'react';
import { MobileNavigation } from '@/components/MobileNavigation';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email?: string;
  lineUserId?: string;
  pictureUrl?: string;
  subscription?: string;
}

interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categories: {
    name: string;
    amount: number;
    budget?: number;
    type: 'income' | 'expense';
  }[];
  monthlyData: {
    month: string;
    income: number;
    expense: number;
  }[];
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  useEffect(() => {
    async function initializeAuth() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const lineUserIdFromUrl = urlParams.get('lineUserId');
        
        let authenticatedUserId = null;
        
        if (lineUserIdFromUrl) {
          authenticatedUserId = lineUserIdFromUrl;
        } else {
          try {
            const response = await fetch('/api/line-auth?checkCookie=true');
            if (response.ok) {
              const data = await response.json();
              authenticatedUserId = data.lineUserId;
            }
          } catch {
            console.log('No user session found');
          }
        }
        
        if (authenticatedUserId) {
          const user: User = {
            id: authenticatedUserId,
            lineUserId: authenticatedUserId,
            name: 'LINE User',
            subscription: 'free'
          };
          setCurrentUser(user);
          
          // Load summary data
          await loadSummaryData(authenticatedUserId);
        } else {
          // Create demo data for non-authenticated users
          setCurrentUser({
            id: 'demo',
            name: 'Demo User',
            subscription: 'free'
          });
          loadDemoData();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        loadDemoData();
      } finally {
        setLoading(false);
      }
    }

    initializeAuth();
  }, []);

  const loadSummaryData = async (userId: string) => {
    try {
      const response = await fetch(`/api/summary?lineUserId=${userId}&month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setSummaryData(data);
      } else {
        loadDemoData();
      }
    } catch (error) {
      console.error('Error loading summary data:', error);
      loadDemoData();
    }
  };

  const loadDemoData = () => {
    setSummaryData({
      totalIncome: 50000,
      totalExpense: 35000,
      balance: 15000,
      categories: [
        { name: 'เงินเดือน', amount: 50000, type: 'income' },
        { name: 'อาหาร', amount: 12000, budget: 15000, type: 'expense' },
        { name: 'ค่าเดินทาง', amount: 5000, budget: 6000, type: 'expense' },
        { name: 'ความบันเทิง', amount: 8000, budget: 10000, type: 'expense' },
        { name: 'ช้อปปิ้ง', amount: 10000, budget: 8000, type: 'expense' },
      ],
      monthlyData: [
        { month: '2024-01', income: 48000, expense: 32000 },
        { month: '2024-02', income: 50000, expense: 33000 },
        { month: '2024-03', income: 50000, expense: 35000 },
      ],
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">ภาพรวมการเงิน</h1>
              <p className="text-gray-600">สวัสดี {currentUser?.name}</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">รายรับ</p>
                <p className="text-2xl font-bold text-green-600">
                  ฿{summaryData?.totalIncome.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">รายจ่าย</p>
                <p className="text-2xl font-bold text-red-600">
                  ฿{summaryData?.totalExpense.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">คงเหลือ</p>
                <p className={`text-2xl font-bold ${(summaryData?.balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ฿{summaryData?.balance.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">สรุปรายการตามหมวดหมู่</h2>
            <Link
              href="/categories"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ดูทั้งหมด
            </Link>
          </div>
          
          <div className="space-y-4">
            {summaryData?.categories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full mr-3 ${
                    category.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900">{category.name}</p>
                    {category.budget && (
                      <p className="text-sm text-gray-600">
                        งบประมาณ: ฿{category.budget.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${
                    category.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ฿{category.amount.toLocaleString()}
                  </p>
                  {category.budget && (
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className={`h-2 rounded-full ${
                          category.amount > category.budget ? 'bg-red-500' : 'bg-blue-500'
                        }`}
                        style={{
                          width: `${Math.min((category.amount / category.budget) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">เมนูหลัก</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/categories"
              className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200"
            >
              <svg className="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-sm font-medium text-blue-900">หมวดหมู่</span>
            </Link>

            <Link
              href="/transactions"
              className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200"
            >
              <svg className="w-8 h-8 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="text-sm font-medium text-green-900">ประวัติ</span>
            </Link>

            <Link
              href="/premium"
              className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200"
            >
              <svg className="w-8 h-8 text-purple-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className="text-sm font-medium text-purple-900">แพคเกจ</span>
            </Link>

            <Link
              href="/settings"
              className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <svg className="w-8 h-8 text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-900">ตั้งค่า</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
