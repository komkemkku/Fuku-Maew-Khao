'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
}

const AVAILABLE_COLORS = [
  { value: 'blue', label: 'น้ำเงิน', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  { value: 'pink', label: 'ชมพู', bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
  { value: 'green', label: 'เขียว', bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  { value: 'purple', label: 'ม่วง', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  { value: 'yellow', label: 'เหลือง', bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  { value: 'red', label: 'แดง', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  { value: 'indigo', label: 'คราม', bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
  { value: 'gray', label: 'เทา', bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
];

const AVAILABLE_ICONS = [
  '🍽️', '🏠', '🚗', '💰', '🎮', '👕', '📚', '🏥', '✈️', '🍕',
  '☕', '🎬', '💊', '🏋️', '🎵', '🛒', '📱', '💻', '🎁', '🌳',
  '🏦', '⛽', '🎓', '🐱', '🍼', '🧸', '🚌', '🍳', '🧴', '💄'
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColor, setSelectedColor] = useState('');

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: 'blue',
    icon: '📂'
  });

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedColor) params.append('color', selectedColor);

      const response = await fetch(`/api/categories?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedColor]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data: Record<string, unknown> = {
        name: formData.name,
        description: formData.description || null,
        color: formData.color,
        icon: formData.icon
      };

      const url = '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      
      if (editingCategory) {
        data.id = editingCategory.id;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchCategories();
        setShowModal(false);
        setEditingCategory(null);
        setFormData({ name: '', description: '', color: 'blue', icon: '📂' });
      }
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      icon: category.icon
    });
    setShowModal(true);
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('คุณแน่ใจว่าต้องการลบหมวดหมู่นี้?')) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: categoryId }),
      });

      if (response.ok) {
        await fetchCategories();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const getColorClasses = (color: string) => {
    const colorClass = AVAILABLE_COLORS.find(c => c.value === color);
    return colorClass || AVAILABLE_COLORS[0];
  };

  const filteredCategories = categories;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">จัดการหมวดหมู่</h1>
                <p className="text-gray-600">เพิ่ม แก้ไข และจัดการหมวดหมู่รายการเงิน</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingCategory(null);
                setFormData({ name: '', description: '', color: 'blue', icon: '📂' });
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มหมวดหมู่
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ค้นหาชื่อหมวดหมู่
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="พิมพ์ชื่อหมวดหมู่..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                กรองตามสี
              </label>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">ทุกสี</option>
                {AVAILABLE_COLORS.map((color) => (
                  <option key={color.value} value={color.value}>
                    {color.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              รายการหมวดหมู่ ({filteredCategories.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">กำลังโหลด...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📂</div>
              <p className="text-gray-500 text-lg">ยังไม่มีหมวดหมู่</p>
              <p className="text-gray-400">เริ่มต้นสร้างหมวดหมู่แรกของคุณ</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((category) => {
                const colorClasses = getColorClasses(category.color);
                return (
                  <div
                    key={category.id}
                    className={`${colorClasses.bg} ${colorClasses.border} border-2 rounded-lg p-4 hover:shadow-md transition-all duration-200`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <h3 className={`font-semibold ${colorClasses.text}`}>
                            {category.name}
                          </h3>
                          {category.description && (
                            <p className="text-gray-600 text-sm mt-1">
                              {category.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-gray-500 hover:text-blue-600 p-1 rounded"
                          title="แก้ไข"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="text-gray-500 hover:text-red-600 p-1 rounded"
                          title="ลบ"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      สร้างเมื่อ: {new Date(category.created_at).toLocaleDateString('th-TH')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อหมวดหมู่ *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="เช่น อาหาร, เดินทาง, บันเทิง"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    คำอธิบาย
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="คำอธิบายเพิ่มเติม (ไม่บังคับ)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลือกสี
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {AVAILABLE_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({...formData, color: color.value})}
                        className={`${color.bg} ${color.border} border-2 p-3 rounded-lg text-center text-sm font-medium ${color.text} hover:opacity-80 transition-opacity ${
                          formData.color === color.value ? 'ring-2 ring-blue-500' : ''
                        }`}
                      >
                        {color.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลือกไอคอน
                  </label>
                  <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {AVAILABLE_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({...formData, icon})}
                        className={`p-2 text-xl hover:bg-gray-100 rounded transition-colors ${
                          formData.icon === icon ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingCategory ? 'บันทึกการแก้ไข' : 'เพิ่มหมวดหมู่'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
