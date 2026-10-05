import { Injectable, signal, computed, effect } from '@angular/core';
import { Income, Budget, Expense, BudgetComparison } from '../models/tracker.model';

const STORAGE_KEY = 'expense_tracker_state_v1';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class TrackerService {
  // Current month in YYYY-MM format
  readonly selectedMonth = signal<string>(this.getInitialMonth());

  // Global collections
  readonly incomes = signal<Income[]>([]);
  readonly budgets = signal<Budget[]>([]);
  readonly expenses = signal<Expense[]>([]);

  // Toast notifications
  readonly toasts = signal<ToastMessage[]>([]);

  constructor() {
    this.loadFromLocalStorage();

    // Auto-save whenever state changes
    effect(() => {
      const data = {
        incomes: this.incomes(),
        budgets: this.budgets(),
        expenses: this.expenses(),
        selectedMonth: this.selectedMonth()
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    });
  }

  private getInitialMonth(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  public loadFromLocalStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.incomes)) this.incomes.set(parsed.incomes);
        if (Array.isArray(parsed.budgets)) this.budgets.set(parsed.budgets);
        if (Array.isArray(parsed.expenses)) this.expenses.set(parsed.expenses);
        if (parsed.selectedMonth) this.selectedMonth.set(parsed.selectedMonth);
      }
    } catch (err) {
      console.warn('Failed to load from localStorage:', err);
    }
  }

  public clearAllData(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.incomes.set([]);
    this.budgets.set([]);
    this.expenses.set([]);
  }

  public setSelectedMonth(month: string): void {
    if (month && month.trim()) {
      this.selectedMonth.set(month);
    }
  }

  // Filtered views by selected month
  readonly currentMonthIncomes = computed(() => {
    const month = this.selectedMonth();
    return this.incomes().filter(i => i.month === month);
  });

  readonly currentMonthBudgets = computed(() => {
    const month = this.selectedMonth();
    return this.budgets().filter(b => b.month === month);
  });

  readonly currentMonthExpenses = computed(() => {
    const month = this.selectedMonth();
    return this.expenses().filter(e => e.month === month);
  });

  // KPI Calculations
  readonly totalInflow = computed(() => {
    return this.currentMonthIncomes().reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  });

  readonly totalBudget = computed(() => {
    return this.currentMonthBudgets().reduce((sum, b) => sum + (Number(b.plannedAmount) || 0), 0);
  });

  readonly actualOutflow = computed(() => {
    return this.currentMonthExpenses().reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  });

  readonly netSavings = computed(() => {
    return this.totalInflow() - this.actualOutflow();
  });

  // Budget comparison table data
  readonly budgetComparison = computed<BudgetComparison[]>(() => {
    const budgets = this.currentMonthBudgets();
    const expenses = this.currentMonthExpenses();

    // Map expense totals by category
    const expenseByCategory = new Map<string, number>();
    for (const exp of expenses) {
      const cat = exp.category.trim();
      expenseByCategory.set(cat, (expenseByCategory.get(cat) || 0) + Number(exp.amount));
    }

    const result: BudgetComparison[] = [];
    const plannedCategories = new Set<string>();

    // Process planned budgets
    for (const b of budgets) {
      const cat = b.category.trim();
      plannedCategories.add(cat.toLowerCase());
      const planned = Number(b.plannedAmount) || 0;
      const actual = expenseByCategory.get(cat) || 0;
      const remaining = planned - actual;
      const percentUsed = planned > 0 ? (actual / planned) * 100 : 0;
      const status: 'On Track' | 'Over Budget' = actual > planned ? 'Over Budget' : 'On Track';

      result.push({
        category: cat,
        plannedAmount: planned,
        actualAmount: actual,
        remainingAmount: remaining,
        percentUsed,
        status,
        isUnplanned: false
      });
    }

    // Process any expenses with categories that were not planned
    for (const [cat, actual] of expenseByCategory.entries()) {
      if (!plannedCategories.has(cat.toLowerCase())) {
        result.push({
          category: cat,
          plannedAmount: 0,
          actualAmount: actual,
          remainingAmount: -actual,
          percentUsed: 100,
          status: 'Over Budget',
          isUnplanned: true
        });
      }
    }

    return result;
  });

  public extractMonth(dateStr: string | null | undefined, fallbackMonth: string): string {
    if (!dateStr || typeof dateStr !== 'string') {
      return fallbackMonth;
    }
    const trimmed = dateStr.trim();
    // 1. YYYY-MM-DD or YYYY/MM/DD
    const ymd = trimmed.match(/^(\d{4})[-/.](\d{1,2})/);
    if (ymd) {
      return `${ymd[1]}-${ymd[2].padStart(2, '0')}`;
    }
    // 2. DD/MM/YYYY or DD-MM-YYYY
    const dmy = trimmed.match(/^\d{1,2}[-/.](\d{1,2})[-/.](\d{4})/);
    if (dmy) {
      return `${dmy[2]}-${dmy[1].padStart(2, '0')}`;
    }
    // 3. Date.parse
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    }
    return fallbackMonth;
  }

  public parseAmount(val: any): number {
    if (typeof val === 'number') {
      return isNaN(val) ? 0 : Math.abs(val);
    }
    if (!val) return 0;
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.abs(num);
  }

  // Actions
  public addIncome(data: { date?: string; source: string; amount: number | string; note?: string }): void {
    const cleanAmount = this.parseAmount(data.amount);
    if (cleanAmount <= 0) {
      this.showToast('Income amount must be greater than zero', 'error');
      return;
    }

    const dateStr = data.date ? String(data.date).trim() : '';
    const targetMonth = this.extractMonth(dateStr, this.selectedMonth());
    const finalDate = dateStr || `${targetMonth}-01`;

    const newIncome: Income = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'inc-' + Date.now() + '-' + Math.random(),
      month: targetMonth,
      date: finalDate,
      source: (data.source || 'Paycheck').trim(),
      amount: cleanAmount,
      note: data.note?.trim()
    };

    this.incomes.update(list => [newIncome, ...list]);

    // Automatically switch to the month of the added income so Total Inflow reflects it immediately
    if (this.selectedMonth() !== targetMonth) {
      this.selectedMonth.set(targetMonth);
    }

    this.showToast(
      `Income added: ₹${cleanAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      'success'
    );
  }

  public addBudget(data: { category: string; plannedAmount: number | string }): void {
    const month = this.selectedMonth();
    const category = data.category.trim();
    const plannedAmount = this.parseAmount(data.plannedAmount);

    if (plannedAmount <= 0) {
      this.showToast('Budget amount must be greater than zero', 'error');
      return;
    }

    const existingIndex = this.budgets().findIndex(
      b => b.month === month && b.category.toLowerCase() === category.toLowerCase()
    );

    if (existingIndex >= 0) {
      this.budgets.update(list => {
        const copy = [...list];
        copy[existingIndex] = {
          ...copy[existingIndex],
          plannedAmount
        };
        return copy;
      });
      this.showToast(`Budget updated for ${category}: ₹${plannedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'success');
    } else {
      const newBudget: Budget = {
        id: crypto.randomUUID ? crypto.randomUUID() : 'bud-' + Date.now() + '-' + Math.random(),
        month,
        category,
        plannedAmount
      };
      this.budgets.update(list => [...list, newBudget]);
      this.showToast(`Budget set for ${category}: ₹${plannedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'success');
    }
  }

  public addExpense(data: { date?: string; category: string; amount: number | string; note?: string }): void {
    const cleanAmount = this.parseAmount(data.amount);
    if (cleanAmount <= 0) {
      this.showToast('Expense amount must be greater than zero', 'error');
      return;
    }

    const dateStr = data.date ? String(data.date).trim() : '';
    const targetMonth = this.extractMonth(dateStr, this.selectedMonth());
    const finalDate = dateStr || `${targetMonth}-01`;

    const newExpense: Expense = {
      id: crypto.randomUUID ? crypto.randomUUID() : 'exp-' + Date.now() + '-' + Math.random(),
      month: targetMonth,
      date: finalDate,
      category: data.category.trim(),
      amount: cleanAmount,
      note: data.note?.trim()
    };

    this.expenses.update(list => [newExpense, ...list]);

    if (this.selectedMonth() !== targetMonth) {
      this.selectedMonth.set(targetMonth);
    }

    this.showToast(
      `Expense added: ₹${cleanAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      'success'
    );
  }

  public deleteExpense(id: string): void {
    const item = this.expenses().find(e => e.id === id);
    this.expenses.update(list => list.filter(e => e.id !== id));
    if (item) {
      this.showToast(`Expense deleted: ₹${item.amount.toLocaleString('en-IN')}`, 'info');
    }
  }

  public deleteIncome(id: string): void {
    const item = this.incomes().find(i => i.id === id);
    this.incomes.update(list => list.filter(i => i.id !== id));
    if (item) {
      this.showToast(`Income deleted: ₹${item.amount.toLocaleString('en-IN')}`, 'info');
    }
  }

  public deleteBudget(id: string): void {
    this.budgets.update(list => list.filter(b => b.id !== id));
  }

  public showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const toast: ToastMessage = {
      id: 'toast-' + Date.now() + '-' + Math.random(),
      message,
      type
    };
    this.toasts.update(current => [...current, toast]);
    setTimeout(() => {
      this.toasts.update(current => current.filter(t => t.id !== toast.id));
    }, 4000);
  }

  public removeToast(id: string): void {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
