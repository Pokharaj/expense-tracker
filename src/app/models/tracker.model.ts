export const EXPENSE_CATEGORIES = [
  'Groceries',
  'Dining',
  'Healthcare',
  'Rent',
  'Personal',
  'Utilities',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Subscriptions',
  'Gifts/Donation',
  'Gym/Sports',
  'Other'
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number] | string;

export const INCOME_SOURCES = [
  'Paycheck',
  'Interest',
  'Freelance',
  'Investment',
  'Bonus',
  'Other'
] as const;

export type IncomeSource = (typeof INCOME_SOURCES)[number] | string;

export interface Income {
  id: string;
  month: string; // YYYY-MM
  date: string;  // YYYY-MM-DD
  source: IncomeSource;
  amount: number;
  note?: string;
}

export interface Budget {
  id: string;
  month: string; // YYYY-MM
  category: ExpenseCategory;
  plannedAmount: number;
}

export interface Expense {
  id: string;
  month: string; // YYYY-MM
  date: string;  // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  note?: string;
}

export interface BudgetComparison {
  category: ExpenseCategory;
  plannedAmount: number;
  actualAmount: number;
  remainingAmount: number; // planned - actual
  percentUsed: number;
  status: 'On Track' | 'Over Budget';
  isUnplanned?: boolean;
}

export interface MonthlySummary {
  totalInflow: number;
  totalBudget: number;
  actualOutflow: number;
  netSavings: number;
}

