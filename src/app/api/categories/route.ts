import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

// GET: ดึงหมวดหมู่ทั้งหมดของผู้ใช้
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // For demo purposes, handle demo user
    let actualUserId = userId;
    if (userId === 'demo_user_123') {
      const demoUser = await DatabaseService.createUser('demo_user_123', 'Demo User');
      actualUserId = demoUser.id;
    }

    const categories = await DatabaseService.getUserCategories(actualUserId);
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: สร้างหมวดหมู่ใหม่
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, type, budgetAmount } = body;

    if (!userId || !name || !type) {
      return NextResponse.json({ 
        error: 'userId, name, and type are required' 
      }, { status: 400 });
    }

    if (!['income', 'expense'].includes(type)) {
      return NextResponse.json({ 
        error: 'type must be either "income" or "expense"' 
      }, { status: 400 });
    }

    // For demo purposes
    let actualUserId = userId;
    if (userId === 'demo_user_123') {
      const demoUser = await DatabaseService.createUser('demo_user_123', 'Demo User');
      actualUserId = demoUser.id;
    }

    const category = await DatabaseService.createCategory(
      actualUserId,
      name,
      type,
      budgetAmount
    );

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: แก้ไขหมวดหมู่
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, budgetAmount } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    await DatabaseService.updateCategoryBudget(id, budgetAmount);
    return NextResponse.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: ลบหมวดหมู่
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    await DatabaseService.deleteCategory(id);
    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
