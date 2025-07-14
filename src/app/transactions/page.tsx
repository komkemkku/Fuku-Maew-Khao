'use client';

import { useState, useEffect, useRef } from 'react';
import { MobileNavigation } from '@/components/MobileNavigation';
import { SubscriptionService } from '@/lib/subscription';
import Link from 'next/link';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  type: 'income' | 'expense';
  date: string;
  created_at: string;
}

interface TransactionFormData {
  amount: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  date: string;
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
            <div className="grid grid-cols-2 gap-1">
              {generateYearOptions().map((year) => {
                const isCurrentYear = value && value.split('-')[0] === String(year);
                return (
                  <button
                    key={year}
                    onClick={() => {
                      setViewYear(year);
                      setCurrentView('month');
                    }}
                    className={`p-1.5 text-xs rounded-md transition-colors font-normal ${
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<'free' | 'premium'>('free');
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [limitMessage, setLimitMessage] = useState('');
  
  // Filter states
  const [filterMonth, setFilterMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<TransactionFormData>({
    amount: '',
    description: '',
    category: 'อาหาร',
    type: 'expense',
    date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    { name: 'เงินเดือน', icon: '💰', color: 'green', type: 'income' },
    { name: 'อาหาร', icon: '🍽️', color: 'red', type: 'expense' },
    { name: 'ค่าเดินทาง', icon: '🚗', color: 'blue', type: 'expense' },
    { name: 'ความบันเทิง', icon: '🎬', color: 'purple', type: 'expense' },
    { name: 'ช้อปปิ้ง', icon: '🛒', color: 'yellow', type: 'expense' },
    { name: 'สาธารณูปโภค', icon: '🏠', color: 'gray', type: 'expense' },
  ];

  useEffect(() => {
    loadTransactions();
    checkUserSubscription();
  }, []);

  const checkUserSubscription = async () => {
    try {
      // ตรวจสอบ LINE User ID จาก URL หรือ session
      const urlParams = new URLSearchParams(window.location.search);
      const lineUserId = urlParams.get('lineUserId');
      
      if (lineUserId) {
        const plan = await SubscriptionService.getUserPlan(lineUserId);
        setUserPlan(plan);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setUserPlan('free'); // Default to free
    }
  };

  useEffect(() => {
    applyFilters();
  }, [transactions, filterMonth, filterType, filterCategory]);

  const loadTransactions = async () => {
    try {
      // Load demo data or fetch from API
      const demoTransactions: Transaction[] = [
        {
          id: '1',
          amount: 50000,
          description: 'เงินเดือนประจำเดือน',
          category: 'เงินเดือน',
          categoryIcon: '💰',
          categoryColor: 'green',
          type: 'income',
          date: '2024-03-01',
          created_at: '2024-03-01T09:00:00Z',
        },
        {
          id: '2',
          amount: 350,
          description: 'ข้าวกล่องเที่ยง',
          category: 'อาหาร',
          categoryIcon: '🍽️',
          categoryColor: 'red',
          type: 'expense',
          date: '2024-03-01',
          created_at: '2024-03-01T12:00:00Z',
        },
        {
          id: '3',
          amount: 120,
          description: 'ค่าน้ำมันรถ',
          category: 'ค่าเดินทาง',
          categoryIcon: '🚗',
          categoryColor: 'blue',
          type: 'expense',
          date: '2024-03-02',
          created_at: '2024-03-02T08:00:00Z',
        },
        {
          id: '4',
          amount: 450,
          description: 'ซื้อหนังสือ',
          category: 'ช้อปปิ้ง',
          categoryIcon: '🛒',
          categoryColor: 'yellow',
          type: 'expense',
          date: '2024-03-02',
          created_at: '2024-03-02T15:30:00Z',
        },
        {
          id: '5',
          amount: 280,
          description: 'ดูหนังในโรงภาพยนตร์',
          category: 'ความบันเทิง',
          categoryIcon: '🎬',
          categoryColor: 'purple',
          type: 'expense',
          date: '2024-03-03',
          created_at: '2024-03-03T19:00:00Z',
        },
        {
          id: '6',
          amount: 2500,
          description: 'ค่าไฟฟ้าประจำเดือน',
          category: 'สาธารณูปโภค',
          categoryIcon: '🏠',
          categoryColor: 'gray',
          type: 'expense',
          date: '2024-03-05',
          created_at: '2024-03-05T10:00:00Z',
        },
      ];
      
      setTransactions(demoTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = transactions;

    // Filter by month
    if (filterMonth) {
      filtered = filtered.filter(transaction => 
        transaction.date.startsWith(filterMonth)
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filterType);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(transaction => transaction.category === filterCategory);
    }

    setFilteredTransactions(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ตรวจสอบขข้อจำกัดของแผนฟรี
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyTransactions = transactions.filter(t => t.date.startsWith(currentMonth)).length;
    const currentCategories = categories.length;
    
    const limits = await SubscriptionService.checkLimits(userPlan, {
      categories: currentCategories,
      monthlyTransactions: monthlyTransactions
    });
    
    if (limits.transactionsExceeded && userPlan === 'free') {
      setLimitMessage(limits.message || 'คุณเพิ่มรายการครบโควต้าแล้ว');
      setShowLimitWarning(true);
      return;
    }
    
    const categoryData = categories.find(cat => cat.name === formData.category);
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: formData.category,
      categoryIcon: categoryData?.icon || '💰',
      categoryColor: categoryData?.color || 'gray',
      type: formData.type,
      date: formData.date,
      created_at: new Date().toISOString(),
    };

    setTransactions([...transactions, newTransaction]);
    setShowAddForm(false);
    resetForm();
  };

  const handleDelete = (transactionId: string) => {
    if (window.confirm('คุณต้องการลบรายการนี้หรือไม่?')) {
      setTransactions(transactions.filter(t => t.id !== transactionId));
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      category: 'อาหาร',
      type: 'expense',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      green: 'bg-green-100 text-green-800',
      red: 'bg-red-100 text-red-800',
      blue: 'bg-blue-100 text-blue-800',
      purple: 'bg-purple-100 text-purple-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return colorMap[color] || colorMap.gray;
  };

  const groupTransactionsByDate = (transactions: Transaction[]) => {
    const grouped: { [date: string]: Transaction[] } = {};
    transactions.forEach(transaction => {
      if (!grouped[transaction.date]) {
        grouped[transaction.date] = [];
      }
      grouped[transaction.date].push(transaction);
    });
    
    // Sort dates in descending order
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
    return sortedDates.map(date => ({
      date,
      transactions: grouped[date].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalIncome = () => {
    return filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getTotalExpense = () => {
    return filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const getCurrentMonthTransactionCount = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return transactions.filter(t => t.date.startsWith(currentMonth)).length;
  };

  const getRemainingTransactions = () => {
    if (userPlan === 'premium') return -1; // ไม่จำกัด
    const features = SubscriptionService.getFreeFeatures();
    return Math.max(0, features.transactionLimit - getCurrentMonthTransactionCount());
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

  const groupedTransactions = groupTransactionsByDate(filteredTransactions);

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileNavigation />
      
      <div className="container mx-auto px-4 py-6 pb-20 lg:pb-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">ประวัติการเงิน</h1>
              <p className="text-gray-600 text-lg">ดูประวัติรายรับจ่ายทั้งหมด</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              เพิ่มรายการ
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
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
                  ฿{getTotalIncome().toLocaleString()}
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
                  ฿{getTotalExpense().toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">จำนวนรายการ</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredTransactions.length}
                </p>
              </div>
            </div>
          </div>

          {/* Free Plan Quota Card */}
          {userPlan === 'free' && (
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-400">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100 mr-4">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">โควต้าเดือนนี้</p>
                  <p className="text-lg font-bold text-orange-600">
                    {getCurrentMonthTransactionCount()}/500
                  </p>
                  <p className="text-xs text-gray-500">
                    เหลือ {getRemainingTransactions()} รายการ
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">ตัวกรองข้อมูล</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">เดือน/ปี</label>
              <MonthPicker
                value={filterMonth}
                onChange={(value) => setFilterMonth(value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">ประเภท</label>
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
                  className="appearance-none w-full bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-gray-800 px-4 py-3 pr-8 rounded-lg shadow-sm hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 font-medium cursor-pointer"
                >
                  <option value="all">🔍 ทั้งหมด</option>
                  <option value="income">💰 รายรับ</option>
                  <option value="expense">💸 รายจ่าย</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">หมวดหมู่</label>
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="appearance-none w-full bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 text-gray-800 px-4 py-3 pr-8 rounded-lg shadow-sm hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 font-medium cursor-pointer"
                >
                  <option value="all">📂 ทั้งหมด</option>
                  {categories.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.type === 'income' ? '💰' : '💸'} {category.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterMonth(new Date().toISOString().slice(0, 7));
                  setFilterType('all');
                  setFilterCategory('all');
                }}
                className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium flex items-center justify-center group"
              >
                <svg className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                รีเซ็ต
              </button>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-6">
          {groupedTransactions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-600 text-lg">ไม่พบรายการในช่วงเวลาที่เลือก</p>
            </div>
          ) : (
            groupedTransactions.map(({ date, transactions }) => (
              <div key={date} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h3 className="font-bold text-gray-900">{formatDate(date)}</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 ${getColorClasses(transaction.categoryColor)}`}>
                            <span className="text-xl">{transaction.categoryIcon}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{transaction.description}</h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <span>{transaction.category}</span>
                              <span>•</span>
                              <span>{formatTime(transaction.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`text-lg font-bold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}฿{transaction.amount.toLocaleString()}
                          </span>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Limit Warning Modal */}
        {showLimitWarning && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="p-3 rounded-full bg-orange-100 mr-4">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">ถึงขีดจำกัดแล้ว!</h2>
                </div>
                
                <div className="mb-6 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                  <div className="whitespace-pre-line text-sm text-gray-700">
                    {limitMessage}
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <button
                    onClick={() => window.open('/premium', '_blank')}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                  >
                    🌟 อัปเกรดเป็น Premium
                  </button>
                  <button
                    onClick={() => setShowLimitWarning(false)}
                    className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Transaction Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">เพิ่มรายการใหม่</h2>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-3">ประเภท</label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        formData.type === 'income' 
                          ? 'border-green-500 bg-green-50 text-green-700' 
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-green-300 hover:bg-green-50'
                      }`}>
                        <input
                          type="radio"
                          value="income"
                          checked={formData.type === 'income'}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <div className="text-2xl mb-1">💰</div>
                          <div className="font-bold text-green-700">รายรับ</div>
                        </div>
                      </label>
                      <label className={`flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        formData.type === 'expense' 
                          ? 'border-red-500 bg-red-50 text-red-700' 
                          : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-red-300 hover:bg-red-50'
                      }`}>
                        <input
                          type="radio"
                          value="expense"
                          checked={formData.type === 'expense'}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <div className="text-2xl mb-1">💸</div>
                          <div className="font-bold text-red-700">รายจ่าย</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">จำนวนเงิน (บาท)</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">คำอธิบาย</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">หมวดหมู่</label>
                    <div className="relative">
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="appearance-none w-full bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-blue-800 px-4 py-3 pr-8 rounded-lg shadow-sm hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 font-medium cursor-pointer"
                        required
                      >
                        {categories
                          .filter(cat => cat.type === formData.type)
                          .map((category) => (
                            <option key={category.name} value={category.name}>
                              {category.icon} {category.name}
                            </option>
                          ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">วันที่</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      เพิ่ม
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Premium Feature: Receipt OCR */}
        {userPlan === 'premium' ? (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-purple-800">📸 สแกนใบเสร็จอัตโนมัติ</h3>
                  <p className="text-sm text-purple-600">ถ่ายรูปใบเสร็จเพื่อเพิ่มรายการอัตโนมัติ</p>
                </div>
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium">
                📸 สแกนใบเสร็จ
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6 relative">
            <div className="absolute inset-0 bg-gray-100 bg-opacity-50 rounded-xl flex items-center justify-center z-10">
              <div className="text-center">
                <div className="p-4 rounded-full bg-purple-100 inline-block mb-3">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-bold text-gray-800 mb-2">🔒 สแกนใบเสร็จอัตโนมัติ</h3>
                <p className="text-sm text-gray-600 mb-3">ถ่ายรูปใบเสร็จเพื่อเพิ่มรายการอัตโนมัติ</p>
                <Link
                  href="/premium"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  ปลดล็อก Premium
                </Link>
              </div>
            </div>
            <div className="blur-sm flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-100 mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-purple-800">สแกนใบเสร็จอัตโนมัติ</h3>
                  <p className="text-sm text-purple-600">ถ่ายรูปใบเสร็จเพื่อเพิ่มรายการอัตโนมัติ</p>
                </div>
              </div>
              <button className="px-6 py-3 bg-purple-600 text-white rounded-lg">
                สแกนใบเสร็จ
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
