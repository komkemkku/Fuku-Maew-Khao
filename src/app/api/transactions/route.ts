import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get('userId'); // This is actually LINE User ID
    const limit = parseInt(searchParams.get('limit') || '10');
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // For demo purposes, we'll use a mock user ID if the provided one is "demo_user_123"
    let actualUserId: string;
    if (lineUserId === 'demo_user_123') {
      // Create or get demo user
      const demoUser = await DatabaseService.createUser('demo_user_123', 'Demo User');
      actualUserId = demoUser.id;
    } else {
      // Get user by LINE User ID to get internal user ID
      const user = await DatabaseService.getUserByLineId(lineUserId);
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      actualUserId = user.id;
    }

    const transactions = await DatabaseService.getUserTransactions(actualUserId, startDate, endDate, limit);

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId: lineUserId, amount, description, categoryId, transactionDate } = body;

    if (!lineUserId || amount === undefined) {
      return NextResponse.json(
        { error: 'User ID and amount are required' },
        { status: 400 }
      );
    }

    // For demo purposes, we'll use a mock user ID if the provided one is "demo_user_123"
    let actualUserId: string;
    if (lineUserId === 'demo_user_123') {
      // Create or get demo user
      const demoUser = await DatabaseService.createUser('demo_user_123', 'Demo User');
      actualUserId = demoUser.id;
    } else {
      // Get user by LINE User ID to get internal user ID
      const user = await DatabaseService.getUserByLineId(lineUserId);
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      actualUserId = user.id;
    }

    const transaction = await DatabaseService.createTransaction(
      actualUserId,
      amount,
      description,
      categoryId,
      transactionDate ? new Date(transactionDate) : undefined
    );

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: แก้ไขรายการ
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, amount, description, categoryId, transactionDate } = body;

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    const transaction = await DatabaseService.updateTransaction(id, {
      amount,
      description,
      category_id: categoryId,
      transaction_date: transactionDate ? new Date(transactionDate) : undefined
    });

    return NextResponse.json({ transaction });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: ลบรายการ
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    await DatabaseService.deleteTransaction(id);
    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
