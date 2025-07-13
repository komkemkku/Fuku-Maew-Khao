import { pool } from './db';
import { User, Category, Transaction } from '../types';

export class DatabaseService {
  // User Management
  static async createUser(lineUserId: string, displayName?: string): Promise<User> {
    const client = await pool.connect();
    try {
      // Check if user already exists
      const existingUser = await this.getUserByLineId(lineUserId);
      if (existingUser) {
        return existingUser;
      }

      // Create new user
      const result = await client.query(
        'INSERT INTO public.users (line_user_id, display_name, subscription_plan) VALUES ($1, $2, $3) RETURNING *',
        [lineUserId, displayName, 'free']
      );
      
      const user = result.rows[0];
      
      // Create default categories for new user
      const defaultCategories = [
        // รายรับ
        { name: 'เงินเดือน', type: 'income' },
        { name: 'รายได้พิเศษ', type: 'income' },
        { name: 'โบนัส', type: 'income' },
        { name: 'การลงทุน', type: 'income' },
        { name: 'รายได้อื่นๆ', type: 'income' },
        
        // รายจ่าย
        { name: 'อาหาร', type: 'expense', budget_amount: 5000 },
        { name: 'เครื่องดื่ม', type: 'expense', budget_amount: 1500 },
        { name: 'เดินทาง', type: 'expense', budget_amount: 3000 },
        { name: 'ช้อปปิ้ง', type: 'expense', budget_amount: 4000 },
        { name: 'ค่าใช้จ่ายบ้าน', type: 'expense', budget_amount: 8000 },
        { name: 'สุขภาพ', type: 'expense', budget_amount: 2000 },
        { name: 'ความบันเทิง', type: 'expense', budget_amount: 2000 },
        { name: 'การศึกษา', type: 'expense', budget_amount: 1000 },
        { name: 'เสื้อผ้า', type: 'expense', budget_amount: 2000 },
        { name: 'ประกันภัย', type: 'expense', budget_amount: 1000 },
        { name: 'อื่นๆ', type: 'expense', budget_amount: 1000 }
      ];

      for (const category of defaultCategories) {
        await client.query(
          'INSERT INTO public.categories (user_id, name, type, budget_amount) VALUES ($1, $2, $3, $4)',
          [user.id, category.name, category.type, category.budget_amount || null]
        );
      }
      
      return user;
    } finally {
      client.release();
    }
  }

  static async createUserWithNewCheck(lineUserId: string, displayName?: string): Promise<{ user: User; isNew: boolean }> {
    const client = await pool.connect();
    try {
      // Check if user already exists
      const existingUser = await this.getUserByLineId(lineUserId);
      if (existingUser) {
        return { user: existingUser, isNew: false };
      }

      // Create new user using existing createUser method
      const user = await this.createUser(lineUserId, displayName);
      return { user, isNew: true };
    } finally {
      client.release();
    }
  }

  static async getUserByLineId(lineUserId: string): Promise<User | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM public.users WHERE line_user_id = $1',
        [lineUserId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }

      const user = result.rows[0];
      
      // ถ้าไม่มี subscription_plan ให้ default เป็น free
      if (!user.subscription_plan) {
        await client.query(
          'UPDATE public.users SET subscription_plan = $1 WHERE id = $2',
          ['free', user.id]
        );
        user.subscription_plan = 'free';
      }
      
      return user;
    } finally {
      client.release();
    }
  }

  static async updateUserSubscription(userId: string, plan: 'free' | 'premium'): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        'UPDATE public.users SET subscription_plan = $1 WHERE id = $2',
        [plan, userId]
      );
    } finally {
      client.release();
    }
  }

  // Category Management
  static async getUserCategories(userId: string): Promise<Category[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM public.categories WHERE user_id = $1 ORDER BY type, name',
        [userId]
      );
      return result.rows;
    } finally {
      client.release();
    }
  }

  static async createCategory(userId: string, name: string, type: 'income' | 'expense', budgetAmount?: number): Promise<Category> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'INSERT INTO public.categories (user_id, name, type, budget_amount) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, name, type, budgetAmount]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  static async updateCategoryBudget(categoryId: string, budgetAmount: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        'UPDATE public.categories SET budget_amount = $1 WHERE id = $2',
        [budgetAmount, categoryId]
      );
    } finally {
      client.release();
    }
  }

  static async deleteCategory(categoryId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM public.categories WHERE id = $1', [categoryId]);
    } finally {
      client.release();
    }
  }

  // Transaction Management
  static async createTransaction(
    userId: string, 
    amount: number, 
    description?: string, 
    categoryId?: string,
    transactionDate?: Date
  ): Promise<Transaction> {
    const client = await pool.connect();
    try {
      const date = transactionDate || new Date();
      const result = await client.query(
        'INSERT INTO public.transactions (user_id, category_id, amount, description, transaction_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, categoryId, amount, description, date]
      );
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  static async getUserTransactions(
    userId: string, 
    startDate?: Date, 
    endDate?: Date, 
    limit = 50
  ): Promise<Transaction[]> {
    const client = await pool.connect();
    try {
      let query = `
        SELECT t.*, c.name as category_name, c.type as category_type 
        FROM public.transactions t 
        LEFT JOIN public.categories c ON t.category_id = c.id 
        WHERE t.user_id = $1
      `;
      const params: (string | Date | number)[] = [userId];

      if (startDate) {
        query += ` AND t.transaction_date >= $${params.length + 1}`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND t.transaction_date <= $${params.length + 1}`;
        params.push(endDate);
      }

      query += ` ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await client.query(query, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  static async deleteTransaction(transactionId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('DELETE FROM public.transactions WHERE id = $1', [transactionId]);
    } finally {
      client.release();
    }
  }

  static async updateTransaction(
    transactionId: string, 
    updates: {
      amount?: number;
      description?: string;
      category_id?: string;
      transaction_date?: Date;
    }
  ): Promise<Transaction> {
    const client = await pool.connect();
    try {
      const setParts: string[] = [];
      const values: (string | number | Date)[] = [];
      let paramCount = 1;

      if (updates.amount !== undefined) {
        setParts.push(`amount = $${paramCount}`);
        values.push(updates.amount);
        paramCount++;
      }

      if (updates.description !== undefined) {
        setParts.push(`description = $${paramCount}`);
        values.push(updates.description);
        paramCount++;
      }

      if (updates.category_id !== undefined) {
        setParts.push(`category_id = $${paramCount}`);
        values.push(updates.category_id);
        paramCount++;
      }

      if (updates.transaction_date !== undefined) {
        setParts.push(`transaction_date = $${paramCount}`);
        values.push(updates.transaction_date);
        paramCount++;
      }

      if (setParts.length === 0) {
        throw new Error('No updates provided');
      }

      setParts.push(`updated_at = NOW()`);
      values.push(transactionId);

      const query = `
        UPDATE public.transactions 
        SET ${setParts.join(', ')} 
        WHERE id = $${paramCount} 
        RETURNING *
      `;

      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Analytics and Reports
  static async getMonthlySummary(userId: string, year: number, month: number) {
    const client = await pool.connect();
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const result = await client.query(`
        SELECT 
          c.name as category_name,
          c.type as category_type,
          c.budget_amount,
          COALESCE(SUM(t.amount), 0) as total_amount,
          COUNT(t.id) as transaction_count
        FROM public.categories c
        LEFT JOIN public.transactions t ON c.id = t.category_id 
          AND t.transaction_date >= $2 
          AND t.transaction_date <= $3
        WHERE c.user_id = $1
        GROUP BY c.id, c.name, c.type, c.budget_amount
        ORDER BY c.type, c.name
      `, [userId, startDate, endDate]);

      const categories = result.rows;
      const totalIncome = categories
        .filter(c => c.category_type === 'income')
        .reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0);
      
      const totalExpense = categories
        .filter(c => c.category_type === 'expense')
        .reduce((sum, c) => sum + parseFloat(c.total_amount || 0), 0);

      return {
        month,
        year,
        total_income: totalIncome,
        total_expense: totalExpense,
        net_amount: totalIncome - totalExpense,
        categories
      };
    } finally {
      client.release();
    }
  }

  static async getBudgetStatus(userId: string, year: number, month: number) {
    const client = await pool.connect();
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const result = await client.query(`
        SELECT 
          c.id as category_id,
          c.name as category_name,
          c.budget_amount,
          COALESCE(SUM(t.amount), 0) as spent_amount
        FROM public.categories c
        LEFT JOIN public.transactions t ON c.id = t.category_id 
          AND t.transaction_date >= $2 
          AND t.transaction_date <= $3
        WHERE c.user_id = $1 
          AND c.type = 'expense' 
          AND c.budget_amount IS NOT NULL
        GROUP BY c.id, c.name, c.budget_amount
        ORDER BY c.name
      `, [userId, startDate, endDate]);

      return result.rows.map(row => ({
        category_id: row.category_id,
        category_name: row.category_name,
        budget_amount: parseFloat(row.budget_amount),
        spent_amount: parseFloat(row.spent_amount),
        remaining_amount: parseFloat(row.budget_amount) - parseFloat(row.spent_amount),
        percentage_used: (parseFloat(row.spent_amount) / parseFloat(row.budget_amount)) * 100
      }));
    } finally {
      client.release();
    }
  }

  // Subscription Management
  static async upgradeToPremium(userId: string, durationMonths: number = 12): Promise<User> {
    const client = await pool.connect();
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + durationMonths);

      const result = await client.query(
        'UPDATE public.users SET subscription_plan = $1, subscription_start_date = $2, subscription_end_date = $3 WHERE id = $4 RETURNING *',
        ['premium', startDate, endDate, userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  static async downgradeToFree(userId: string): Promise<User> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'UPDATE public.users SET subscription_plan = $1, subscription_start_date = NULL, subscription_end_date = NULL WHERE id = $2 RETURNING *',
        ['free', userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  static async checkSubscriptionStatus(userId: string): Promise<User> {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM public.users WHERE id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const user = result.rows[0];
      
      // Check if premium subscription has expired
      if (user.subscription_plan === 'premium' && user.subscription_end_date) {
        const now = new Date();
        const endDate = new Date(user.subscription_end_date);
        
        if (now > endDate) {
          // Auto-downgrade expired premium users
          return await this.downgradeToFree(userId);
        }
      }
      
      return user;
    } finally {
      client.release();
    }
  }

  // Transaction count for subscription limits
  static async getMonthlyTransactionCount(userId: string, year?: number, month?: number): Promise<number> {
    const client = await pool.connect();
    try {
      const now = new Date();
      const targetYear = year || now.getFullYear();
      const targetMonth = month || now.getMonth() + 1;
      
      const result = await client.query(
        `SELECT COUNT(*) as count FROM public.transactions 
         WHERE user_id = $1 
         AND EXTRACT(YEAR FROM transaction_date) = $2 
         AND EXTRACT(MONTH FROM transaction_date) = $3`,
        [userId, targetYear, targetMonth]
      );
      
      return parseInt(result.rows[0].count) || 0;
    } finally {
      client.release();
    }
  }

  // Clear all user transactions (for dev/demo purposes)
  static async clearUserTransactions(userId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(
        'DELETE FROM public.transactions WHERE user_id = $1',
        [userId]
      );
    } finally {
      client.release();
    }
  }
}
