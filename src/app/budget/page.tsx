'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface BudgetItem {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: 'safe' | 'warning' | 'danger' | 'over';
  created_at: string;
  updated_at: string;
}

interface BudgetFormData {
  categoryId: string;
  budgetAmount: string;
}

const getBudgetAdvice = (status: string, categoryName: string, percentageUsed: number): string => {
  // Special advice for overall budget
  if (categoryName === 'งบรวม') {
    const overallAdvice = {
      'safe': [
        `😸 เยี่ยมมาก! เจ้าทาสจัดการเงินได้ดี ฟูกุชอบใจมาก! เก็บไว้ซื้อขนมฟูกุนะ~`,
        `🐱 ดีใจจัง! งบประมาณโดยรวมยังเหลือเยอะ เจ้าทาสฉลาดจริงๆ ฟูกุภูมิใจ!`,
        `😽 สุดยอด! เจ้าทาสประหยัดได้ขนาดนี้ ฟูกุจะได้อยู่สบายๆ!`,
        `🐾 ว้าว! งบเหลือเยอะมาก เจ้าทาสเก่งมาก ฟูกุขอนอนบนตังค์หน่อย~`
      ],
      'warning': [
        `😼 หืม... งบรวมเริ่มใช้เยอะแล้วนะเจ้าทาส ฟูกุเตือนแล้วนะ อย่าให้ฟูกุหิว`,
        `🙃 เอาน่า! เงินเริ่มลดลงแล้ว เจ้าทาสระวังการใช้จ่ายหน่อยนะ`,
        `😾 โอ๊ย! งบประมาณใช้ไปเยอะแล้ว ฟูกุเริ่มกังวลแล้วนะเจ้าทาส`
      ],
      'danger': [
        `🙀 อันตราย! งบประมาณเหลือน้อยมาก เจ้าทาสจะทำฟูกุหิวเหรอ!`,
        `😰 โอ๊ะโอ! เงินเกือบหมดแล้ว เจ้าทาสต้องระวังมากๆ!`,
        `😱 แย่แล้ว! งบเหลือแค่นิดเดียว ฟูกุเริ่มกังวลจริงๆ แล้ว!`
      ],
      'over': [
        `😡 โกรธแล้ว! เจ้าทาสใช้เงินเกินงบแล้ว! ฟูกุจะได้กินอะไร!`,
        `🔥 วิกฤต! เงินหมดแล้ว เจ้าทาสจะเลี้ยงฟูกุยังไง!`,
        `💀 อุ๊ย! เกินงบมากแล้ว ฟูกุจะต้องอดอาหารเพราะเจ้าทาสเหรอ!`
      ]
    };
    const advice = overallAdvice[status as keyof typeof overallAdvice] || overallAdvice['safe'];
    return advice[Math.floor(Math.random() * advice.length)];
  }

  // Category-specific advice
  const adviceMap = {
    'safe': [
      `😸 เก่งมาก! ${categoryName} ยังใช้แค่ ${Math.round(percentageUsed)}% เอง ฟูกุชอบเจ้าทาสที่ประหยัด!`,
      `🐱 ดีมากนะ! หมวด ${categoryName} ยังเหลือเยอะ เจ้าทาสเก่งจริงๆ ฟูกุภูมิใจ!`,
      `😽 ยอดเยี่ยม! ${categoryName} ใช้น้อยมาก เจ้าทาสจะได้มีเงินซื้อขนมแมวให้ฟูกุ~`,
      `� เฮ้ย! เก่งจัง ${categoryName} ประหยัดได้ขนาดนี้ ฟูกุจะให้รางวัลเป็นเสียงร้องเล่น!`,
      `🐾 ว้าววว! งบ ${categoryName} เหลือเยอะ เจ้าทาสฉลาดมาก ฟูกุอยากนอนบนตังค์!`
    ],
    'warning': [
      `� อืม... ${categoryName} ใช้ไป ${Math.round(percentageUsed)}% แล้วนะ เจ้าทาส ระวังหน่อยดีกว่า`,
      `� เอาน่า! หมวด ${categoryName} เริ่มใช้เยอะแล้ว ฟูกุเริ่มกังวลแล้วนะเจ้าทาส`,
      `😾 เฮ้ย! ${categoryName} ใช้ไปครึ่งกว่าแล้ว ฟูกุเตือนแล้วนะ อย่าโทษฟูกุภายหลัง`,
      `🐱 อู๋ หมวด ${categoryName} เริ่มลดลงแล้ว เจ้าทาสช่วยดูหน่อยนะ ฟูกุไม่อยากหิว`,
      `😿 โอ้โห! ${categoryName} ใช้เยอะขึ้นเรื่อยๆ เจ้าทาสคิดถึงฟูกุด้วยมั้ย?`
    ],
    'danger': [
      `🙀 อันตราย! ${categoryName} เหลือน้อยมากแล้ว ${Math.round(percentageUsed)}% เจ้าทาสจะทำฟูกุหิวเหรอ!`,
      `� โอ๊ะโอ! หมวด ${categoryName} เกือบหมดแล้ว เจ้าทาสต้องหยุดใช้เดี๋ยวนี้!`,
      `� แย่แล้วว! ${categoryName} เหลือแค่นิดเดียว ฟูกุเริ่มกังวลแล้ว เจ้าทาสคิดดีๆ นะ`,
      `🚨 แปลงแดง! หมวด ${categoryName} ใกล้หมดแล้ว เจ้าทาสจะเอาอะไรเลี้ยงฟูกุ!`,
      `😵 อุ๊ย! ${categoryName} เหลือแค่นิดหน่อย เจ้าทาสเก็บตังค์ให้ดีกว่านะ!`
    ],
    'over': [
      `� ไฟแดง! ${categoryName} เกินงบไป ${Math.abs(Math.round(percentageUsed - 100))}% แล้ว! ฟูกุโกรธแล้วนะเจ้าทาส!`,
      `� วิกฤต! หมวด ${categoryName} เกินงบแล้ว! เจ้าทาสจะเอาอะไรซื้อขนมฟูกุ!`,
      `� อุ๊ย! ${categoryName} เกินงบที่ตั้งไว้แล้ว ฟูกุจะได้กินอะไร เจ้าทาสคิดดูสิ!`,
      `😤 หมดแล้ว! หมวด ${categoryName} เกินงบ ฟูกุจะต้องอดอาหารเพราะเจ้าทาสเหรอ!`,
      `👿 เสียแล้ว! ${categoryName} เกินงบมาก เจ้าทาสต้องหาเงินเพิ่มมาให้ฟูกุ!`
    ]
  };

  const advice = adviceMap[status as keyof typeof adviceMap] || adviceMap['safe'];
  return advice[Math.floor(Math.random() * advice.length)];
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'safe': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', progress: 'bg-green-500' };
    case 'warning': return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', progress: 'bg-yellow-500' };
    case 'danger': return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', progress: 'bg-orange-500' };
    case 'over': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', progress: 'bg-red-500' };
    default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', progress: 'bg-gray-500' };
  }
};

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<BudgetItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  const [formData, setFormData] = useState<BudgetFormData>({
    categoryId: '',
    budgetAmount: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const categoriesResponse = await fetch('/api/categories');
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      }

      // Fetch budgets (demo data)
      const demoBudgets: BudgetItem[] = [
        {
          id: '1',
          categoryId: '1',
          categoryName: 'อาหาร',
          categoryIcon: '🍽️',
          categoryColor: 'red',
          budgetAmount: 3000,
          spentAmount: 2300,
          remainingAmount: 700,
          percentageUsed: 76.67,
          status: 'warning',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          categoryId: '2',
          categoryName: 'เดินทาง',
          categoryIcon: '🚗',
          categoryColor: 'blue',
          budgetAmount: 2500,
          spentAmount: 2000,
          remainingAmount: 500,
          percentageUsed: 80,
          status: 'danger',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          categoryId: '3',
          categoryName: 'บันเทิง',
          categoryIcon: '🎮',
          categoryColor: 'purple',
          budgetAmount: 1000,
          spentAmount: 600,
          remainingAmount: 400,
          percentageUsed: 60,
          status: 'safe',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          categoryId: '4',
          categoryName: 'เสื้อผ้า',
          categoryIcon: '👕',
          categoryColor: 'pink',
          budgetAmount: 1500,
          spentAmount: 1800,
          remainingAmount: -300,
          percentageUsed: 120,
          status: 'over',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setBudgets(demoBudgets);
      
      const total = demoBudgets.reduce((sum, budget) => sum + budget.budgetAmount, 0);
      const spent = demoBudgets.reduce((sum, budget) => sum + budget.spentAmount, 0);
      setTotalBudget(total);
      setTotalSpent(spent);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const budgetAmount = parseFloat(formData.budgetAmount);
      const category = categories.find(c => c.id === formData.categoryId);
      
      if (!category) return;

      const newBudget: BudgetItem = {
        id: Date.now().toString(),
        categoryId: formData.categoryId,
        categoryName: category.name,
        categoryIcon: category.icon,
        categoryColor: category.color,
        budgetAmount,
        spentAmount: 0,
        remainingAmount: budgetAmount,
        percentageUsed: 0,
        status: 'safe',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (editingBudget) {
        setBudgets(prev => prev.map(budget => 
          budget.id === editingBudget.id 
            ? { ...budget, budgetAmount, remainingAmount: budgetAmount - budget.spentAmount, percentageUsed: (budget.spentAmount / budgetAmount) * 100 }
            : budget
        ));
      } else {
        setBudgets(prev => [...prev, newBudget]);
      }

      setShowModal(false);
      setEditingBudget(null);
      setFormData({ categoryId: '', budgetAmount: '' });
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const handleEdit = (budget: BudgetItem) => {
    setEditingBudget(budget);
    setFormData({
      categoryId: budget.categoryId,
      budgetAmount: budget.budgetAmount.toString()
    });
    setShowModal(true);
  };

  const handleDelete = async (budgetId: string) => {
    if (!confirm('คุณแน่ใจว่าต้องการลบงบประมาณนี้?')) return;
    setBudgets(prev => prev.filter(budget => budget.id !== budgetId));
  };

  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const overallStatus = overallPercentage > 100 ? 'over' : overallPercentage > 85 ? 'danger' : overallPercentage > 70 ? 'warning' : 'safe';

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
                <h1 className="text-2xl font-bold text-gray-900">จัดการงบประมาณ</h1>
                <p className="text-gray-600">ตั้งและติดตามงบประมาณแต่ละหมวดหมู่</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingBudget(null);
                setFormData({ categoryId: '', budgetAmount: '' });
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มงบประมาณ
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Overall Summary */}
        <div className={`${getStatusColor(overallStatus).bg} ${getStatusColor(overallStatus).border} border-2 rounded-xl p-6 mb-8 shadow-lg`}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 สรุปงบประมาณรวม</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">งบที่ตั้ง</p>
                <p className="text-xl font-bold text-blue-600">฿{totalBudget.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ใช้ไปแล้ว</p>
                <p className="text-xl font-bold text-red-600">฿{totalSpent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">คงเหลือ</p>
                <p className={`text-xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ฿{(totalBudget - totalSpent).toLocaleString()}
                </p>
              </div>
            </div>
            
            {/* Overall Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>ความคืบหน้า</span>
                <span>{Math.round(overallPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full ${getStatusColor(overallStatus).progress} transition-all duration-500`}
                  style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Cat Advice */}
            <div className="mt-4 bg-white/70 rounded-lg p-4">
              <p className="text-lg font-medium text-gray-800">
                {getBudgetAdvice(overallStatus, 'งบรวม', overallPercentage)}
              </p>
            </div>
          </div>
        </div>

        {/* Budget Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              งบประมาณแต่ละหมวดหมู่ ({budgets.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">กำลังโหลด...</p>
            </div>
          ) : budgets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <p className="text-gray-500 text-lg">ยังไม่มีงบประมาณ</p>
              <p className="text-gray-400">เริ่มต้นสร้างงบประมาณแรกของคุณ</p>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const statusColors = getStatusColor(budget.status);
                return (
                  <div
                    key={budget.id}
                    className={`${statusColors.bg} ${statusColors.border} border-2 rounded-lg p-6 hover:shadow-md transition-all duration-200`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{budget.categoryIcon}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {budget.categoryName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            งบ ฿{budget.budgetAmount.toLocaleString()} | ใช้ ฿{budget.spentAmount.toLocaleString()} | 
                            เหลือ <span className={budget.remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'}>
                              ฿{budget.remainingAmount.toLocaleString()}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(budget)}
                          className="text-gray-500 hover:text-blue-600 p-2 rounded"
                          title="แก้ไข"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(budget.id)}
                          className="text-gray-500 hover:text-red-600 p-2 rounded"
                          title="ลบ"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>การใช้งาน</span>
                        <span>{Math.round(budget.percentageUsed)}%</span>
                      </div>
                      <div className="w-full bg-white/50 rounded-full h-4">
                        <div 
                          className={`h-4 rounded-full ${statusColors.progress} transition-all duration-500`}
                          style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Cat Advice */}
                    <div className="bg-white/70 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-700">
                        💬 {getBudgetAdvice(budget.status, budget.categoryName, budget.percentageUsed)}
                      </p>
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingBudget ? 'แก้ไขงบประมาณ' : 'เพิ่มงบประมาณใหม่'}
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
                    หมวดหมู่ *
                  </label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!!editingBudget}
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.filter(cat => !budgets.some(budget => budget.categoryId === cat.id && budget.id !== editingBudget?.id)).map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    จำนวนเงินงบประมาณ (บาท) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.budgetAmount}
                    onChange={(e) => setFormData({...formData, budgetAmount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="เช่น 3000"
                  />
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
                    {editingBudget ? 'บันทึกการแก้ไข' : 'เพิ่มงบประมาณ'}
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
