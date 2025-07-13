import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

// Demo data generator
const generateDemoData = () => {
  const demoCategories = [
    { name: 'เงินเดือน', type: 'income', budget_amount: 50000, color: 'green', icon: 'wallet' },
    { name: 'ธุรกิจส่วนตัว', type: 'income', budget_amount: 20000, color: 'blue', icon: 'briefcase' },
    { name: 'อาหาร', type: 'expense', budget_amount: 8000, color: 'orange', icon: 'food' },
    { name: 'ค่าที่พัก', type: 'expense', budget_amount: 15000, color: 'red', icon: 'home' },
    { name: 'เสื้อผ้า', type: 'expense', budget_amount: 3000, color: 'purple', icon: 'shopping' },
    { name: 'ค่าเดินทาง', type: 'expense', budget_amount: 5000, color: 'yellow', icon: 'car' },
    { name: 'ค่าใช้จ่ายอื่นๆ', type: 'expense', budget_amount: 2000, color: 'gray', icon: 'other' },
  ];

  const demoTransactions = [
    // Income transactions
    { categoryName: 'เงินเดือน', amount: 50000, description: 'เงินเดือนประจำเดือน', daysAgo: 1 },
    { categoryName: 'ธุรกิจส่วนตัว', amount: 15000, description: 'ขายของออนไลน์', daysAgo: 3 },
    { categoryName: 'ธุรกิจส่วนตัว', amount: 8000, description: 'รับงานฟรีแลนซ์', daysAgo: 7 },
    
    // Expense transactions  
    { categoryName: 'อาหาร', amount: -350, description: 'ซื้อข้าวกล่อง', daysAgo: 0 },
    { categoryName: 'อาหาร', amount: -120, description: 'กาแฟเช้า', daysAgo: 0 },
    { categoryName: 'อาหาร', amount: -280, description: 'อาหารเที่ยง', daysAgo: 1 },
    { categoryName: 'อาหาร', amount: -450, description: 'อาหารเย็นกับครอบครัว', daysAgo: 1 },
    { categoryName: 'อาหาร', amount: -200, description: 'ขนมเจ้า', daysAgo: 2 },
    { categoryName: 'ค่าที่พัก', amount: -15000, description: 'ค่าเช่าบ้าน', daysAgo: 2 },
    { categoryName: 'เสื้อผ้า', amount: -1200, description: 'เสื้อใหม่', daysAgo: 4 },
    { categoryName: 'ค่าเดินทาง', amount: -80, description: 'ค่าน้ำมันรถ', daysAgo: 1 },
    { categoryName: 'ค่าเดินทาง', amount: -25, description: 'BTS', daysAgo: 0 },
    { categoryName: 'ค่าเดินทาง', amount: -45, description: 'แท็กซี่', daysAgo: 3 },
    { categoryName: 'ค่าใช้จ่ายอื่นๆ', amount: -150, description: 'ซื้อยาแก้ปวดหัว', daysAgo: 5 },
    { categoryName: 'ค่าใช้จ่ายอื่นๆ', amount: -300, description: 'ซ่อมโทรศัพท์', daysAgo: 8 },
  ];

  return { demoCategories, demoTransactions };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, devKey } = body;

    // Check for dev access key
    if (devKey !== process.env.DEV_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized - Dev access required' },
        { status: 403 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user by LINE User ID to get internal user ID, or create if not exists
    let user = await DatabaseService.getUserByLineId(userId);
    if (!user) {
      user = await DatabaseService.createUser(userId, `Demo User ${userId.slice(-3)}`);
    }

    // Clear existing transactions first
    await DatabaseService.clearUserTransactions(user.id);
    
    // Generate demo data
    const { demoCategories, demoTransactions } = generateDemoData();
    
    // Create demo categories
    const createdCategories = [];
    for (const category of demoCategories) {
      try {
        const createdCategory = await DatabaseService.createCategory(
          user.id,
          category.name,
          category.type as 'income' | 'expense',
          category.budget_amount
        );
        createdCategories.push(createdCategory);
      } catch {
        // Category might already exist, continue
        console.log(`Category ${category.name} might already exist`);
      }
    }

    // Get all user categories to map names to IDs
    const userCategories = await DatabaseService.getUserCategories(user.id);
    const categoryMap = new Map(userCategories.map((cat: { name: string; id: string }) => [cat.name, cat.id]));

    // Create demo transactions
    let createdTransactions = 0;
    for (const transaction of demoTransactions) {
      const categoryId = categoryMap.get(transaction.categoryName);
      if (categoryId) {
        try {
          const transactionDate = new Date();
          transactionDate.setDate(transactionDate.getDate() - transaction.daysAgo);
          
          await DatabaseService.createTransaction(
            user.id,
            transaction.amount, // amount (can be negative)
            transaction.description,
            categoryId,
            transactionDate
          );
          createdTransactions++;
        } catch {
          console.log(`Failed to create transaction: ${transaction.description}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created demo data for user ${userId}`,
      data: {
        userId: user.id,
        categoriesCount: createdCategories.length,
        transactionsCount: createdTransactions
      }
    });

  } catch (error) {
    console.error('Error creating demo data:', error);
    return NextResponse.json(
      { error: 'Failed to create demo data' },
      { status: 500 }
    );
  }
}
