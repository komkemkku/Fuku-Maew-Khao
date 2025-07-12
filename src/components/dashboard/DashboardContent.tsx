'use client';

import { useState, useEffect, useCallback } from 'react';
import { MonthlySummary, Transaction } from '@/types';

interface DashboardContentProps {
  userId: string;
}

export function DashboardContent({ userId }: DashboardContentProps) {
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load monthly summary
      const now = new Date();
      const summaryResponse = await fetch(`/api/summary?userId=${userId}&year=${now.getFullYear()}&month=${now.getMonth() + 1}`);
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setSummary(summaryData);
      }

      // Load recent transactions
      const transactionsResponse = await fetch(`/api/transactions?userId=${userId}&limit=10`);
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setRecentTransactions(transactionsData);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50 flex items-center justify-center px-4">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-pink-100">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-2 text-gray-700 text-sm sm:text-base">กำลังโหลดข้อมูล... 🐱</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-white/80 backdrop-blur-sm rounded-2xl p-6 sm:p-8 shadow-xl border border-pink-100">
          <div className="text-3xl mb-4">😿</div>
          <p className="text-red-600 mb-4 text-sm sm:text-base">เกิดข้อผิดพลาด: {error}</p>
          <button 
            onClick={loadDashboardData}
            className="px-4 py-2 bg-gradient-to-r from-pink-400 to-blue-400 text-white rounded-full hover:from-pink-500 hover:to-blue-500 text-sm sm:text-base transition-all transform hover:scale-105"
          >
            ลองใหม่ 💕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-xl border border-pink-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-pink-500 via-blue-500 to-purple-500 bg-clip-text text-transparent mb-2">🐱 ฟูกุแมวขาว</h1>
              <p className="text-sm sm:text-base text-gray-600">แดชบอร์ดการเงินส่วนตัว 💖</p>
            </div>
            <div className="text-3xl sm:text-4xl">🏠</div>
          </div>
        </div>

      {/* Monthly Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl shadow-xl p-4 sm:p-6 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-medium text-green-700">รายรับ</h3>
              <span className="text-lg sm:text-2xl">💰</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-green-600 mt-2">
              ฿{summary.total_income.toLocaleString()}
            </p>
            <div className="text-xs text-green-500 mt-1">เดือนนี้ 💕</div>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-2xl shadow-xl p-4 sm:p-6 hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-medium text-rose-700">รายจ่าย</h3>
              <span className="text-lg sm:text-2xl">💸</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-rose-600 mt-2">
              ฿{summary.total_expense.toLocaleString()}
            </p>
            <div className="text-xs text-rose-500 mt-1">เดือนนี้ 🎀</div>
          </div>

          <div className={`bg-gradient-to-br ${summary.net_amount >= 0 ? 'from-blue-50 to-cyan-50 border-blue-200' : 'from-orange-50 to-red-50 border-orange-200'} border rounded-2xl shadow-xl p-4 sm:p-6 hover:shadow-2xl transition-all transform hover:scale-105 sm:col-span-2 lg:col-span-1`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-xs sm:text-sm font-medium ${summary.net_amount >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>คงเหลือ</h3>
              <span className="text-lg sm:text-2xl">{summary.net_amount >= 0 ? '�' : '⚠️'}</span>
            </div>
            <p className={`text-xl sm:text-2xl font-bold mt-2 ${summary.net_amount >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
              ฿{summary.net_amount.toLocaleString()}
            </p>
            <div className={`text-xs mt-1 ${summary.net_amount >= 0 ? 'text-blue-500' : 'text-orange-500'}`}>
              {summary.net_amount >= 0 ? 'เยี่ยม! ✨' : 'ระวังหน่อยนะ 😿'}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">รายการล่าสุด</h2>
          </div>
          <div className="p-4 sm:p-6">
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">ยังไม่มีรายการ</p>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {transaction.description || 'ไม่ระบุ'}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {new Date(transaction.transaction_date).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`font-bold text-sm sm:text-base ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.amount >= 0 ? '+' : ''}฿{Math.abs(transaction.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">เครื่องมือด่วน</h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="space-y-4">
              <div className="border rounded-lg p-3 sm:p-4">
                <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">📱 LINE Bot</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3">
                  บันทึกรายรับ-จ่ายผ่าน LINE Bot ได้ทันที
                </p>
                <div className="bg-gray-50 rounded p-2 sm:p-3 text-xs sm:text-sm">
                  <p><strong>ตัวอย่าง:</strong></p>
                  <p>• &quot;50 ค่ากาแฟ&quot;</p>
                  <p>• &quot;สรุป&quot; - ดูสรุปรายเดือน</p>
                  <p>• &quot;ช่วยเหลือ&quot; - ดูวิธีใช้</p>
                </div>
              </div>

              <div className="border rounded-lg p-3 sm:p-4">
                <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">💎 Premium Features</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-3">
                  อัปเกรดเพื่อฟีเจอร์เพิ่มเติม
                </p>
                <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                  <li>• อ่านสลิปอัตโนมัติ</li>
                  <li>• รายงานขั้นสูง</li>
                  <li>• Export ข้อมูล</li>
                  <li>• ไม่มีโฆษณา</li>
                </ul>
                <button className="w-full mt-3 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-colors text-xs sm:text-sm">
                  อัปเกรด Premium
                </button>
              </div>

              <div className="border rounded-lg p-3 sm:p-4">
                <h3 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">📊 เครื่องมือวิเคราะห์</h3>
                <div className="space-y-2">
                  <button className="w-full px-3 sm:px-4 py-2 text-left border rounded hover:bg-gray-50 transition-colors text-xs sm:text-sm">
                    📈 กราฟรายจ่าย
                  </button>
                  <button className="w-full px-3 sm:px-4 py-2 text-left border rounded hover:bg-gray-50 transition-colors text-xs sm:text-sm">
                    📂 จัดการหมวดหมู่
                  </button>
                  <button className="w-full px-3 sm:px-4 py-2 text-left border rounded hover:bg-gray-50 transition-colors text-xs sm:text-sm">
                    🎯 ตั้งงบประมาณ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Overview */}
      {summary && summary.categories && summary.categories.length > 0 && (
        <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">ภาพรวมหมวดหมู่</h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Income Categories */}
              <div>
                <h3 className="font-medium text-green-600 mb-3 sm:mb-4 text-sm sm:text-base">💰 รายรับ</h3>
                <div className="space-y-2 sm:space-y-3">
                  {summary.categories
                    .filter(cat => cat.category_type === 'income')
                    .map((category) => (
                      <div key={category.category_name} className="flex justify-between items-center p-2 sm:p-3 border rounded">
                        <span className="text-gray-900 text-sm sm:text-base truncate">{category.category_name}</span>
                        <span className="font-medium text-green-600 text-sm sm:text-base ml-2">
                          ฿{(parseFloat(String(category.total_amount || '0'))).toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Expense Categories */}
              <div>
                <h3 className="font-medium text-red-600 mb-3 sm:mb-4 text-sm sm:text-base">💸 รายจ่าย</h3>
                <div className="space-y-2 sm:space-y-3">
                  {summary.categories
                    .filter(cat => cat.category_type === 'expense')
                    .map((category) => (
                      <div key={category.category_name} className="flex justify-between items-center p-2 sm:p-3 border rounded">
                        <div className="min-w-0 flex-1">
                          <span className="text-gray-900 text-sm sm:text-base truncate block">{category.category_name}</span>
                          {category.budget_amount && (
                            <div className="text-xs text-gray-500">
                              งบ: ฿{category.budget_amount.toLocaleString()}
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-red-600 text-sm sm:text-base ml-2">
                          ฿{(parseFloat(String(category.total_amount || '0'))).toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
