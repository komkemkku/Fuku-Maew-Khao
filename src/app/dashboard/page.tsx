'use client';

import { useState, useEffect, useRef } from 'react';
import { MobileNavigation } from '@/components/MobileNavigation';
import { SubscriptionService } from '@/lib/subscription';
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

interface MonthPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const MonthPicker: React.FC<MonthPickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'month' | 'year'>('month');
  const [viewYear, setViewYear] = useState(() => {
    if (value) {
      const [year] = value.split('-');
      return parseInt(year);
    }
    return new Date().getFullYear();
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const getCurrentDisplay = () => {
    if (!value) return 'เลือกเดือน/ปี';
    const [year, month] = value.split('-');
    return `${months[parseInt(month) - 1]} ${parseInt(year) + 543}`;
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newValue = `${viewYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    onChange(newValue);
    setIsOpen(false);
  };

  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (value) {
      const [year] = value.split('-');
      setViewYear(parseInt(year));
    }
  }, [value]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="appearance-none bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-blue-900 px-4 py-3 pr-10 rounded-lg shadow-sm hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 font-semibold cursor-pointer w-full text-left text-base"
      >
        {getCurrentDisplay()}
      </button>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2 min-w-[240px]">
          {/* Year selector header */}
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setViewYear(viewYear - 1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentView(currentView === 'month' ? 'year' : 'month')}
              className="font-medium text-gray-800 hover:text-blue-600 transition-colors text-base"
            >
              {viewYear + 543}
            </button>
            <button
              onClick={() => setViewYear(viewYear + 1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {currentView === 'month' ? (
            <div className="grid grid-cols-3 gap-1">
              {months.map((month, index) => {
                const isCurrentMonth = value && value.split('-')[1] === String(index + 1).padStart(2, '0');
                return (
                  <button
                    key={index}
                    onClick={() => handleMonthSelect(index)}
                    className={`p-1.5 text-xs rounded-md transition-colors font-normal ${
                      isCurrentMonth 
                        ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                        : 'hover:bg-blue-50 hover:text-blue-700 text-gray-700'
                    }`}
                  >
                    {month}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {generateYearOptions().map((year) => {
                const isCurrentYear = value && value.split('-')[0] === String(year);
                return (
                  <button
                    key={year}
                    onClick={() => {
                      setViewYear(year);
                      setCurrentView('month');
                    }}
                    className={`p-2 text-xs rounded-md transition-colors font-normal ${
                      isCurrentYear 
                        ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                        : 'hover:bg-blue-50 hover:text-blue-700 text-gray-700'
                    }`}
                  >
                    {year + 543}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [userPlan, setUserPlan] = useState<'free' | 'premium'>('free');
  const [planLoading, setPlanLoading] = useState(true);
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
          // ตรวจสอบสถานะพรีเมียม
          const plan = await SubscriptionService.getUserPlan(authenticatedUserId);
          setUserPlan(plan);
          setPlanLoading(false);
          
          const user: User = {
            id: authenticatedUserId,
            lineUserId: authenticatedUserId,
            name: 'LINE User',
            subscription: plan
          };
          setCurrentUser(user);
          
          // Load summary data with subscription info
          await loadSummaryData(authenticatedUserId, plan);
        } else {
          // Create demo data for non-authenticated users
          setUserPlan('free');
          setPlanLoading(false);
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

  useEffect(() => {
    // Reload data when selectedMonth changes
    if (currentUser && currentUser.id !== 'demo') {
      loadSummaryData(currentUser.lineUserId || currentUser.id, userPlan);
    }
  }, [selectedMonth, currentUser, userPlan]);

  const loadSummaryData = async (userId: string, plan: 'free' | 'premium' = 'free') => {
    try {
      const response = await fetch(`/api/summary?lineUserId=${userId}&month=${selectedMonth}&plan=${plan}`);
      if (response.ok) {
        const data = await response.json();
        setSummaryData(data);
      } else {
        loadDemoData(plan);
      }
    } catch (error) {
      console.error('Error loading summary data:', error);
      loadDemoData(plan);
    }
  };

  const loadDemoData = (plan: 'free' | 'premium' = 'free') => {
    // ข้อมูลพื้นฐานสำหรับทุกแผน
    const baseData = {
      totalIncome: 50000,
      totalExpense: 35000,
      balance: 15000,
      categories: [
        { name: 'เงินเดือน', amount: 50000, type: 'income' as const },
        { name: 'อาหาร', amount: 12000, budget: 15000, type: 'expense' as const },
        { name: 'ค่าเดินทาง', amount: 5000, budget: 6000, type: 'expense' as const },
        { name: 'ความบันเทิง', amount: 8000, budget: 10000, type: 'expense' as const },
        { name: 'ช้อปปิ้ง', amount: 10000, budget: 8000, type: 'expense' as const },
      ],
      monthlyData: [
        { month: '2024-01', income: 48000, expense: 32000 },
        { month: '2024-02', income: 50000, expense: 33000 },
        { month: '2024-03', income: 50000, expense: 35000 },
      ],
    };

    // เพิ่มข้อมูลขั้นสูงสำหรับ Premium
    if (plan === 'premium') {
      baseData.monthlyData = [
        ...baseData.monthlyData,
        { month: '2024-04', income: 52000, expense: 34000 },
        { month: '2024-05', income: 55000, expense: 36000 },
        { month: '2024-06', income: 51000, expense: 33000 },
        { month: '2024-07', income: 53000, expense: 37000 },
      ];
    }

    setSummaryData(baseData);
  };

  const getUsageWarnings = () => {
    if (userPlan !== 'free') return null;
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyTransactions = 30; // จำลองข้อมูล
    const categoryCount = 6; // จำลองข้อมูล
    
    const warnings = [];
    
    // เตือนรายการใกล้เต็ม (80% ขึ้นไป)
    if (monthlyTransactions >= 400) { // 80% ของ 500
      warnings.push({
        type: 'transactions',
        level: monthlyTransactions >= 475 ? 'danger' : 'warning', // 95% ของ 500
        message: `รายการเดือนนี้ใช้ไป ${monthlyTransactions}/500 รายการ`,
        action: 'อัปเกรดเพื่อบันทึกไม่จำกัด'
      });
    }
    
    // เตือนหมวดหมู่ใกล้เต็ม (80% ขึ้นไป)
    if (categoryCount >= 12) {
      warnings.push({
        type: 'categories',
        level: categoryCount >= 14 ? 'danger' : 'warning',
        message: `หมวดหมู่ใช้ไป ${categoryCount}/15 หมวด`,
        action: 'อัปเกรดเพื่อหมวดหมู่ไม่จำกัด'
      });
    }
    
    return warnings;
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
              <MonthPicker
                value={selectedMonth}
                onChange={(value) => setSelectedMonth(value)}
              />
            </div>
          </div>
        </div>

        {/* Free Plan Usage Banner */}
        {userPlan === 'free' && (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 mr-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-orange-800">แผนฟรี - ใช้งานไปแล้ว</h3>
                  <div className="flex items-center space-x-6 mt-2">
                    <div>
                      <p className="text-sm text-orange-700">รายการเดือนนี้</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-orange-200 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{width: '6%'}}></div>
                        </div>
                        <span className="text-sm font-medium text-orange-800">30/500</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-orange-700">หมวดหมู่</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-orange-200 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{width: '40%'}}></div>
                        </div>
                        <span className="text-sm font-medium text-orange-800">6/15</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <Link
                href="/premium"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
              >
                🌟 อัปเกรด
              </Link>
            </div>
          </div>
        )}

        {/* Usage Warnings */}
        {userPlan === 'free' && (() => {
          const warnings = getUsageWarnings();
          return warnings && warnings.length > 0 ? (
            <div className="space-y-4 mb-6">
              {warnings.map((warning, index) => (
                <div
                  key={index}
                  className={`rounded-xl p-4 border-l-4 ${
                    warning.level === 'danger'
                      ? 'bg-red-50 border-red-400'
                      : 'bg-yellow-50 border-yellow-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full mr-3 ${
                        warning.level === 'danger' ? 'bg-red-100' : 'bg-yellow-100'
                      }`}>
                        {warning.level === 'danger' ? '🚨' : '⚠️'}
                      </div>
                      <div>
                        <p className={`font-medium ${
                          warning.level === 'danger' ? 'text-red-800' : 'text-yellow-800'
                        }`}>
                          {warning.message}
                        </p>
                        <p className={`text-sm ${
                          warning.level === 'danger' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                          {warning.action}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/premium"
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm font-medium"
                    >
                      อัปเกรด
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : null;
        })()}

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

        {/* Premium Features Section */}
        {userPlan === 'free' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Advanced Reports - Locked */}
            <div className="bg-white rounded-xl shadow-lg p-6 relative">
              <div className="absolute inset-0 bg-gray-100 bg-opacity-50 rounded-xl flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="p-4 rounded-full bg-yellow-100 inline-block mb-3">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">🔒 รายงานขั้นสูง</h3>
                  <p className="text-sm text-gray-600 mb-3">แสดงกราฟและวิเคราะห์เชิงลึก</p>
                  <Link
                    href="/premium"
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                  >
                    ปลดล็อก
                  </Link>
                </div>
              </div>
              <div className="blur-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📊 รายงานขั้นสูง</h3>
                <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg mb-4"></div>
                <p className="text-gray-600">กราฟแสดงแนวโน้มรายรับ-รายจ่าย 6 เดือน</p>
              </div>
            </div>

            {/* Export Data - Locked */}
            <div className="bg-white rounded-xl shadow-lg p-6 relative">
              <div className="absolute inset-0 bg-gray-100 bg-opacity-50 rounded-xl flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="p-4 rounded-full bg-green-100 inline-block mb-3">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">🔒 ส่งออกข้อมูล</h3>
                  <p className="text-sm text-gray-600 mb-3">ดาวน์โหลด Excel/PDF</p>
                  <Link
                    href="/premium"
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                  >
                    ปลดล็อก
                  </Link>
                </div>
              </div>
              <div className="blur-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📄 ส่งออกข้อมูล</h3>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl mr-3">📊</span>
                    <span>Excel Report</span>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl mr-3">📋</span>
                    <span>PDF Summary</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Premium Only: Advanced Features */}
        {userPlan === 'premium' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Advanced Reports - Unlocked */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">📊 รายงานขั้นสูง</h3>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                  ✨ Premium
                </span>
              </div>
              <div className="h-32 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl mb-2">📈</div>
                  <p className="text-sm text-gray-600">แนวโน้มการเงิน 12 เดือน</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  ดูรายงาน
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                  ตั้งค่า
                </button>
              </div>
            </div>

            {/* Export Data - Unlocked */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">📄 ส่งออกข้อมูล</h3>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  ✨ Premium
                </span>
              </div>
              <div className="space-y-3">
                <button className="w-full flex items-center p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <span className="text-2xl mr-3">📊</span>
                  <div className="text-left">
                    <div className="font-medium">Excel Report</div>
                    <div className="text-sm text-gray-600">ข้อมูลครบถ้วน</div>
                  </div>
                </button>
                <button className="w-full flex items-center p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                  <span className="text-2xl mr-3">📋</span>
                  <div className="text-left">
                    <div className="font-medium">PDF Summary</div>
                    <div className="text-sm text-gray-600">สรุปรายเดือน</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
