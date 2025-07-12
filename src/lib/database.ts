import { pool } from './db';
import { User, Category, Transaction } from '@/types';

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
        'INSERT INTO public.users (line_user_id, display_name) VALUES ($1, $2) RETURNING *',
        [lineUserId, displayName]
      );
      
      const user = result.rows[0];
      
      // Create default categories for new user
      await client.query('SELECT create_default_categories($1)', [user.id]);
      
      return user;
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
      return result.rows[0] || null;
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
}
