export interface User {
  id: string;
  line_user_id: string;
  display_name?: string;
  subscription_plan: 'free' | 'premium';
  created_at: Date;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  budget_amount?: number;
  created_at: Date;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id?: string;
  amount: number;
  description?: string;
  transaction_date: Date;
  created_at: Date;
}

export interface CategoryWithTransactions extends Category {
  transactions?: Transaction[];
  total_amount?: number;
  category_name?: string; // for database query results
  category_type?: 'income' | 'expense'; // for database query results
}

export interface MonthlyBudgetSummary {
  category_id: string;
  category_name: string;
  budget_amount: number;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
}

export interface MonthlySummary {
  month: string;
  year: number;
  total_income: number;
  total_expense: number;
  net_amount: number;
  categories: CategoryWithTransactions[];
}
