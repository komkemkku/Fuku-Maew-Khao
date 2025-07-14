'use client';

import { useState, useEffect } from 'react';
import { MobileNavigation } from '@/components/MobileNavigation';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  type: 'income' | 'expense';
  budget_amount?: number;
  current_amount?: number;
  created_at: string;
  updated_at?: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  type: 'income' | 'expense';
  budget_amount: string;
}

const AVAILABLE_COLORS = [
  { value: 'blue', label: 'น้ำเงิน', bg: 'bg-blue-100', text: 'text-blue-800' },
  { value: 'green', label: 'เขียว', bg: 'bg-green-100', text: 'text-green-800' },
  { value: 'purple', label: 'ม่วง', bg: 'bg-purple-100', text: 'text-purple-800' },
  { value: 'red', label: 'แดง', bg: 'bg-red-100', text: 'text-red-800' },
  { value: 'yellow', label: 'เหลือง', bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { value: 'gray', label: 'เทา', bg: 'bg-gray-100', text: 'text-gray-800' },
];

const AVAILABLE_ICONS = [
  '🍽️', '🏠', '🚗', '💰', '🎮', '👕', '📚', '🏥', '✈️', '🍕',
  '☕', '🎬', '💊', '🏋️', '🎵', '🛒', '📱', '💻', '🎁', '🏦'
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: 'blue',
    icon: '🍽️',
    type: 'expense',
    budget_amount: '',
  });
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const lineUserId = urlParams.get('lineUserId');
      
      if (lineUserId) {
        const response = await fetch(`/api/categories?lineUserId=${lineUserId}`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        } else {
          loadDemoCategories();
        }
      } else {
        loadDemoCategories();
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      loadDemoCategories();
    } finally {
      setLoading(false);
    }
  };

  const loadDemoCategories = () => {
    setCategories([
      {
        id: '1',
        name: 'เงินเดือน',
        description: 'เงินเดือนประจำ',
        color: 'green',
        icon: '💰',
        type: 'income',
        current_amount: 50000,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'อาหาร',
        description: 'ค่าอาหารและเครื่องดื่ม',
        color: 'red',
        icon: '🍽️',
        type: 'expense',
        budget_amount: 15000,
        current_amount: 12000,
        created_at: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'ค่าเดินทาง',
        description: 'ค่าน้ำมัน ค่าโดยสาร',
        color: 'blue',
        icon: '🚗',
        type: 'expense',
        budget_amount: 6000,
        current_amount: 5000,
        created_at: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'ความบันเทิง',
        description: 'ภาพยนตร์ เกม ดนตรี',
        color: 'purple',
        icon: '🎬',
        type: 'expense',
        budget_amount: 10000,
        current_amount: 8000,
        created_at: new Date().toISOString(),
      },
      {
        id: '5',
        name: 'ช้อปปิ้ง',
        description: 'เสื้อผ้า อุปกรณ์ต่างๆ',
        color: 'yellow',
        icon: '🛒',
        type: 'expense',
        budget_amount: 8000,
        current_amount: 10000,
        created_at: new Date().toISOString(),
      },
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission (create/update category)
    console.log('Form submitted:', formData);
    setShowForm(false);
    setEditingCategory(null);
    resetForm();
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      icon: category.icon,
      type: category.type,
      budget_amount: category.budget_amount?.toString() || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (window.confirm('คุณต้องการลบหมวดหมู่นี้หรือไม่?')) {
      // Handle delete
      setCategories(categories.filter(cat => cat.id !== categoryId));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: 'blue',
      icon: '🍽️',
      type: 'expense',
      budget_amount: '',
    });
  };

  const getColorClasses = (color: string) => {
    const colorConfig = AVAILABLE_COLORS.find(c => c.value === color);
    return colorConfig || AVAILABLE_COLORS[0];
  };

  const filteredCategories = categories.filter(category => {
    if (filter === 'all') return true;
    return category.type === filter;
  });

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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">จัดการหมวดหมู่</h1>
              <p className="text-gray-600">เพิ่ม ลบ แก้ไขหมวดหมู่และตั้งงบประมาณ</p>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingCategory(null);
                resetForm();
              }}
              className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              เพิ่มหมวดหมู่
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setFilter('income')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                filter === 'income'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              รายรับ
            </button>
            <button
              onClick={() => setFilter('expense')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                filter === 'expense'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              รายจ่าย
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {filteredCategories.map((category) => {
            const colorClasses = getColorClasses(category.color);
            const budgetPercentage = category.budget_amount && category.current_amount
              ? (category.current_amount / category.budget_amount) * 100
              : 0;
            
            return (
              <div key={category.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`w-12 h-12 ${colorClasses.bg} rounded-lg flex items-center justify-center mr-3`}>
                      <span className="text-xl">{category.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  category.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                } mb-3`}>
                  {category.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                </div>

                {category.budget_amount && category.type === 'expense' && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">งบประมาณ</span>
                      <span className="font-medium">
                        ฿{category.current_amount?.toLocaleString()} / ฿{category.budget_amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          budgetPercentage > 100 ? 'bg-red-500' : budgetPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                      ></div>
                    </div>
                    {budgetPercentage > 100 && (
                      <p className="text-xs text-red-600 mt-1">เกินงบประมาณ {(budgetPercentage - 100).toFixed(1)}%</p>
                    )}
                  </div>
                )}

                {category.current_amount && category.type === 'income' && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">จำนวนเงิน</p>
                    <p className="text-lg font-bold text-green-600">฿{category.current_amount.toLocaleString()}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อหมวดหมู่</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">คำอธิบาย</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

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

                  {formData.type === 'expense' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">งบประมาณ (บาท)</label>
                      <input
                        type="number"
                        value={formData.budget_amount}
                        onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="0"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">สี</label>
                    <div className="grid grid-cols-4 gap-2">
                      {AVAILABLE_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: color.value })}
                          className={`p-3 rounded-lg border-2 ${
                            formData.color === color.value ? 'border-blue-500' : 'border-gray-200'
                          } ${color.bg}`}
                        >
                          {color.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ไอคอน</label>
                    <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto">
                      {AVAILABLE_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon })}
                          className={`p-2 rounded-lg border-2 text-xl ${
                            formData.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      {editingCategory ? 'บันทึก' : 'เพิ่ม'}
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
