export interface Income {
  id: string;
  month: string; // YYYY-MM
  date: string;  // YYYY-MM-DD
  source: string;
  amount: number;
  note?: string;
}

export interface Budget {
  id: string;
  month: string; // YYYY-MM
  category: string;
  plannedAmount: number;
}

export interface Expense {
  id: string;
  month: string; // YYYY-MM
  date: string;  // YYYY-MM-DD
  category: string;
  amount: number;
  note?: string;
}

export interface BudgetComparison {
  category: string;
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
