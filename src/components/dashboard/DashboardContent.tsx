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
      } else {
        console.error('Summary API error:', summaryResponse.status);
        // ถ้าไม่มีข้อมูล ให้สร้างข้อมูลเริ่มต้น
        setSummary({
          month: (now.getMonth() + 1).toString(),
          year: now.getFullYear(),
          total_income: 0,
          total_expense: 0,
          net_amount: 0,
          categories: []
        });
      }

      // Load recent transactions
      const transactionsResponse = await fetch(`/api/transactions?userId=${userId}&limit=10`);
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        setRecentTransactions(transactionsData);
      } else {
        console.error('Transactions API error:', transactionsResponse.status);
        setRecentTransactions([]);
      }

    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      
      // สร้างข้อมูลเริ่มต้นในกรณีเกิดข้อผิดพลาด
      const now = new Date();
      setSummary({
        month: (now.getMonth() + 1).toString(),
        year: now.getFullYear(),
        total_income: 0,
        total_expense: 0,
        net_amount: 0,
        categories: []
      });
      setRecentTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div className="text-4xl mb-4">🐱</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <div className="text-3xl mb-4">😿</div>
          <p className="text-red-600 mb-4">เกิดข้อผิดพลาด: {error}</p>
          <button 
            onClick={loadDashboardData}
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all transform hover:scale-105"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - สีฟ้าเป็นหลัก */}
      <div className="bg-blue-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">🐱 Fuku Neko</h1>
              <p className="text-blue-100 mt-1">สวัสดี! มาดูสถานะการเงินของคุณกันเถอะ</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-200">วันที่</div>
              <div className="font-semibold">{new Date().toLocaleDateString('th-TH')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Monthly Summary Cards - ใช้สีแยกกัน */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* รายได้ - สีฟ้า */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">รายได้เดือนนี้</p>
                <p className="text-2xl font-bold text-blue-900">
                  ฿{summary?.total_income.toLocaleString() || '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xl">💰</span>
              </div>
            </div>
          </div>

          {/* รายจ่าย - สีชมพู */}
          <div className="bg-pink-50 border border-pink-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-600 text-sm font-medium">รายจ่ายเดือนนี้</p>
                <p className="text-2xl font-bold text-pink-900">
                  ฿{summary?.total_expense.toLocaleString() || '0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                <span className="text-xl">💸</span>
              </div>
            </div>
          </div>

          {/* คงเหลือ - สีขาว */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">คงเหลือ</p>
                <p className={`text-2xl font-bold ${
                  (summary?.net_amount || 0) >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  ฿{(summary?.net_amount || 0).toLocaleString()}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                (summary?.net_amount || 0) >= 0 
                  ? 'bg-green-500' 
                  : 'bg-red-500'
              }`}>
                <span className="text-xl">
                  {(summary?.net_amount || 0) >= 0 ? '😸' : '😿'}
                </span>
              </div>
            </div>
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

      {/* No Data Message */}
      {summary && summary.total_income === 0 && summary.total_expense === 0 && recentTransactions.length === 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-sm border border-blue-200 p-8 mb-8 text-center">
          <div className="text-6xl mb-4">🐱</div>
          <h3 className="text-xl font-bold text-blue-900 mb-2">ยินดีต้อนรับสู่ Fuku Neko!</h3>
          <p className="text-blue-700 mb-6">
            ยังไม่มีข้อมูลรายรับ-รายจ่าย มาเริ่มต้นบันทึกข้อมูลกันเถอะ
          </p>
          
          <div className="space-y-4 max-w-md mx-auto">
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">💡 วิธีเริ่มต้น</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• ส่งข้อความใน LINE Bot: "100 ค่ากาแฟ"</p>
                <p>• พิมพ์ "สรุป" เพื่อดูภาพรวม</p>
                <p>• พิมพ์ "หมวดหมู่" เพื่อจัดการหมวดหมู่</p>
              </div>
            </div>
            
            <button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/demo-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, demo: true })
                  });
                  if (response.ok) {
                    await loadDashboardData();
                  }
                } catch (error) {
                  console.error('Failed to create demo data:', error);
                }
              }}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              🎯 สร้างข้อมูลตัวอย่าง
            </button>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {summary && (
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              📊 สรุปภาพรวม
            </h2>
            
            {/* Income vs Expense Chart */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">รายรับ vs รายจ่าย</h3>
              <div className="space-y-4">
                {/* Income Bar */}
                <div className="flex items-center">
                  <div className="w-20 text-sm text-gray-600 font-medium">รายรับ</div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: summary.total_income > 0 ? '100%' : '0%'
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                        ฿{summary.total_income.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-green-600 font-bold text-sm">
                    💰
                  </div>
                </div>
                
                {/* Expense Bar */}
                <div className="flex items-center">
                  <div className="w-20 text-sm text-gray-600 font-medium">รายจ่าย</div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-6 relative overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-red-400 to-red-600 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: summary.total_expense > 0 && summary.total_income > 0 
                            ? `${Math.min((summary.total_expense / summary.total_income) * 100, 100)}%` 
                            : summary.total_expense > 0 ? '100%' : '0%'
                        }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                        ฿{summary.total_expense.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="w-16 text-right text-red-600 font-bold text-sm">
                    💸
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            {summary.categories && summary.categories.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">รายจ่ายตามหมวดหมู่</h3>
                <div className="space-y-3">
                  {summary.categories
                    .filter(cat => cat.category_type === 'expense' && (cat.total_amount || 0) > 0)
                    .sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0))
                    .slice(0, 5)
                    .map((category, index) => {
                      const colors = [
                        'from-blue-400 to-blue-600',
                        'from-purple-400 to-purple-600', 
                        'from-pink-400 to-pink-600',
                        'from-orange-400 to-orange-600',
                        'from-teal-400 to-teal-600'
                      ];
                      const maxExpense = Math.max(...summary.categories
                        .filter(cat => cat.category_type === 'expense')
                        .map(cat => cat.total_amount || 0));
                      
                      return (
                        <div key={category.id} className="flex items-center">
                          <div className="w-24 text-sm text-gray-600 font-medium truncate">
                            {category.category_name || category.name}
                          </div>
                          <div className="flex-1 mx-4">
                            <div className="bg-gray-200 rounded-full h-4 relative overflow-hidden">
                              <div 
                                className={`bg-gradient-to-r ${colors[index % colors.length]} h-full rounded-full transition-all duration-1000 ease-out`}
                                style={{
                                  width: maxExpense > 0 ? `${((category.total_amount || 0) / maxExpense) * 100}%` : '0%'
                                }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-20 text-right text-gray-700 font-semibold text-sm">
                            ฿{(category.total_amount || 0).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                </div>
                
                {/* Show message if no expense categories */}
                {summary.categories.filter(cat => cat.category_type === 'expense' && (cat.total_amount || 0) > 0).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📝</div>
                    <p>ยังไม่มีรายจ่ายในเดือนนี้</p>
                    <p className="text-sm">ลองบันทึกรายการผ่าน LINE Bot กันเถอะ!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
        {/* Recent Transactions - สีขาว */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">รายการล่าสุด</h2>
              <span className="text-2xl">📝</span>
            </div>
          </div>
          <div className="p-6">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">😺</div>
                <p className="text-gray-500">ยังไม่มีรายการ</p>
                <p className="text-sm text-gray-400 mt-1">เริ่มบันทึกรายรับ-จ่ายผ่าน LINE Bot กันเถอะ!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {transaction.description || 'ไม่ระบุ'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.transaction_date).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`font-bold ${transaction.amount >= 0 ? 'text-blue-600' : 'text-pink-600'}`}>
                        {transaction.amount >= 0 ? '+' : ''}฿{Math.abs(transaction.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions - สีฟ้า */}
        <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-200">
          <div className="p-6 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-blue-900">เครื่องมือด่วน</h2>
              <span className="text-2xl">⚡</span>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-white border border-blue-200 rounded-xl p-4">
                <h3 className="font-medium text-blue-900 mb-2">📱 LINE Bot</h3>
                <p className="text-sm text-blue-700 mb-3">
                  บันทึกรายรับ-จ่ายผ่าน LINE Bot ได้ทันที
                </p>
                <div className="bg-blue-50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-blue-900 mb-2">ตัวอย่าง:</p>
                  <p className="text-blue-700">• &quot;50 ค่ากาแฟ&quot;</p>
                  <p className="text-blue-700">• &quot;สรุป&quot; - ดูสรุปรายเดือน</p>
                  <p className="text-blue-700">• &quot;ช่วยเหลือ&quot; - ดูวิธีใช้</p>
                </div>
              </div>

              <div className="bg-white border border-blue-200 rounded-xl p-4">
                <h3 className="font-medium text-blue-900 mb-2">💎 Premium Features</h3>
                <p className="text-sm text-blue-700 mb-3">
                  อัปเกรดเพื่อฟีเจอร์เพิ่มเติม
                </p>
                <ul className="text-sm text-blue-700 space-y-1 mb-3">
                  <li>• อ่านสลิปอัตโนมัติ</li>
                  <li>• รายงานขั้นสูง</li>
                  <li>• Export ข้อมูล</li>
                  <li>• ไม่มีโฆษณา</li>
                </ul>
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  อัปเกรด Premium
                </button>
              </div>

              <div className="bg-white border border-blue-200 rounded-xl p-4">
                <h3 className="font-medium text-blue-900 mb-3">📊 เครื่องมือวิเคราะห์</h3>
                <div className="space-y-2">
                  <a 
                    href="/transactions"
                    className="w-full px-4 py-2 text-left border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-blue-800 block"
                  >
                    📝 จัดการรายการ
                  </a>
                  <button className="w-full px-4 py-2 text-left border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-blue-800">
                    📈 กราฟรายจ่าย
                  </button>
                  <a 
                    href="/categories"
                    className="w-full px-4 py-2 text-left border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-blue-800 block"
                  >
                    📂 จัดการหมวดหมู่
                  </a>
                  <a 
                    href="/budget"
                    className="w-full px-4 py-2 text-left border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-blue-800 block"
                  >
                    🎯 ตั้งงบประมาณ
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Overview - สีชมพู */}
      {summary && summary.categories && summary.categories.length > 0 && (
        <div className="mt-8 bg-pink-50 rounded-xl shadow-sm border border-pink-200">
          <div className="p-6 border-b border-pink-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-pink-900">ภาพรวมหมวดหมู่</h2>
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Income Categories - สีฟ้า */}
              <div className="bg-white rounded-xl border border-blue-200 p-4">
                <h3 className="font-medium text-blue-600 mb-4 flex items-center">
                  <span className="text-xl mr-2">💰</span>
                  รายรับ
                </h3>
                <div className="space-y-3">
                  {summary.categories
                    .filter(cat => cat.category_type === 'income')
                    .map((category) => (
                      <div key={category.category_name} className="flex justify-between items-center p-3 bg-blue-50 border border-blue-100 rounded-lg">
                        <span className="text-blue-900 truncate">{category.category_name}</span>
                        <span className="font-medium text-blue-600 ml-2">
                          ฿{(parseFloat(String(category.total_amount || '0'))).toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Expense Categories - สีชมพู */}
              <div className="bg-white rounded-xl border border-pink-200 p-4">
                <h3 className="font-medium text-pink-600 mb-4 flex items-center">
                  <span className="text-xl mr-2">💸</span>
                  รายจ่าย
                </h3>
                <div className="space-y-3">
                  {summary.categories
                    .filter(cat => cat.category_type === 'expense')
                    .map((category) => (
                      <div key={category.category_name} className="flex justify-between items-center p-3 bg-pink-50 border border-pink-100 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <span className="text-pink-900 truncate block">{category.category_name}</span>
                          {category.budget_amount && (
                            <div className="text-xs text-pink-600">
                              งบ: ฿{category.budget_amount.toLocaleString()}
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-pink-600 ml-2">
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
