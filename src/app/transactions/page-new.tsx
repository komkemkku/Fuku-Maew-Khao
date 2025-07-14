'use client';

import { useState, useEffect } from 'react';
import { MobileNavigation } from '@/components/MobileNavigation';

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
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
  }, []);

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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">ประวัติรายการ</h1>
              <p className="text-gray-600">ดูประวัติรายรับจ่ายทั้งหมด</p>
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
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">ตัวกรองข้อมูล</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">เดือน/ปี</label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ประเภท</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                <option value="income">รายรับ</option>
                <option value="expense">รายจ่าย</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                {categories.map((category) => (
                  <option key={category.name} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterMonth(new Date().toISOString().slice(0, 7));
                  setFilterType('all');
                  setFilterCategory('all');
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
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

        {/* Add Transaction Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">เพิ่มรายการใหม่</h2>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">ประเภท</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="income"
                          checked={formData.type === 'income'}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                          className="mr-2"
                        />
                        รายรับ
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="expense"
                          checked={formData.type === 'expense'}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                          className="mr-2"
                        />
                        รายจ่าย
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนเงิน (บาท)</label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      </div>
    </div>
  );
}
