'use client';

import { useState, useEffect, useCallback } from 'react';
import { Transaction, Category } from '@/types';

interface TransactionFormData {
  amount: string;
  description: string;
  categoryId: string;
  transactionDate: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState<TransactionFormData>({
    amount: '',
    description: '',
    categoryId: '',
    transactionDate: new Date().toISOString().split('T')[0]
  });

  // Filter states
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [transactionsRes, categoriesRes] = await Promise.all([
        fetch(`/api/transactions?userId=demo_user_123&category=${filterCategory}&type=${filterType}&startDate=${startDate}&endDate=${endDate}`),
        fetch('/api/categories?userId=demo_user_123')
      ]);

      if (!transactionsRes.ok || !categoriesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const transactionsData = await transactionsRes.json();
      const categoriesData = await categoriesRes.json();

      setTransactions(transactionsData.transactions || transactionsData);
      setCategories(categoriesData.categories || categoriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterType, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const data: Record<string, unknown> = {
        userId: 'demo_user_123',
        amount: parseFloat(formData.amount),
        description: formData.description,
        categoryId: formData.categoryId || null,
        transactionDate: formData.transactionDate
      };

      const url = '/api/transactions';
      const method = editingTransaction ? 'PUT' : 'POST';
      
      if (editingTransaction) {
        data.id = editingTransaction.id;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to save transaction');
      }

      resetForm();
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: Math.abs(transaction.amount).toString(),
      description: transaction.description || '',
      categoryId: transaction.category_id || '',
      transactionDate: new Date(transaction.transaction_date).toISOString().split('T')[0]
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้?')) return;

    try {
      const response = await fetch(`/api/transactions?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      categoryId: '',
      transactionDate: new Date().toISOString().split('T')[0]
    });
    setEditingTransaction(null);
    setShowAddForm(false);
  };

  const formatCurrency = (amount: number) => {
    return `฿${Math.abs(amount).toLocaleString()}`;
  };

  const getCategoryName = (categoryId: string | null | undefined) => {
    if (!categoryId) return 'ไม่ระบุหมวดหมู่';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'ไม่ระบุหมวดหมู่';
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🐱</div>
          <div className="text-gray-600">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - สีฟ้า */}
      <div className="bg-blue-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a
                href="/dashboard"
                className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ← กลับ
              </a>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">📝 จัดการรายการ</h1>
                <p className="text-blue-100 mt-1">เพิ่ม แก้ไข ลบ รายการรับ-จ่ายของคุณ</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-white text-blue-600 px-6 py-3 rounded-full font-semibold hover:bg-blue-50 transition-colors shadow-lg"
            >
              + เพิ่มรายการ
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="text-red-800">❌ {error}</div>
          </div>
        )}

        {/* Filters - สีขาว */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🔍 ตัวกรอง</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">ทั้งหมด</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ประเภท</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">ทั้งหมด</option>
                <option value="income">รายรับ</option>
                <option value="expense">รายจ่าย</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วันที่เริ่มต้น</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วันที่สิ้นสุด</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-90vh overflow-y-auto">
              <div className="bg-pink-100 px-6 py-4 border-b border-pink-200">
                <h3 className="text-lg font-bold text-pink-900">
                  {editingTransaction ? '✏️ แก้ไขรายการ' : '➕ เพิ่มรายการใหม่'}
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนเงิน *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียด</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="เช่น ค่ากาแฟ, เงินเดือน"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="">เลือกหมวดหมู่</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.type === 'income' ? '💰' : '💸'} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">วันที่</label>
                    <input
                      type="date"
                      value={formData.transactionDate}
                      onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-pink-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'กำลังบันทึก...' : editingTransaction ? 'อัปเดต' : 'เพิ่มรายการ'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    ยกเลิก
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transactions List - สีขาว */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">📋 รายการทั้งหมด ({transactions.length} รายการ)</h2>
          </div>
          
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">😸</div>
              <div className="text-gray-500">ยังไม่มีรายการ</div>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                เพิ่มรายการแรก
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {transactions.map((transaction) => {
                const isIncome = transaction.amount > 0;
                
                return (
                  <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">
                            {isIncome ? '💰' : '💸'}
                          </span>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {transaction.description || 'ไม่ระบุรายละเอียด'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>📂 {getCategoryName(transaction.category_id)}</span>
                              <span>•</span>
                              <span>📅 {new Date(transaction.transaction_date).toLocaleDateString('th-TH')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${isIncome ? 'text-blue-600' : 'text-pink-600'}`}>
                            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                          >
                            ✏️ แก้ไข
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                          >
                            🗑️ ลบ
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
