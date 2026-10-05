import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrackerService } from '../../services/tracker.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-transaction-forms',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- 1. Income Logging Form -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
        <div>
          <div class="flex items-center space-x-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <span class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 dark:border dark:border-blue-800/40 flex items-center justify-center">
              <app-icon name="plus"></app-icon>
            </span>
            <div>
              <h2 class="text-base font-bold text-slate-800 dark:text-slate-100">Log Income</h2>
              <p class="text-xs text-slate-400 dark:text-slate-500">Record incoming salary or revenue</p>
            </div>
          </div>

          <form id="income-form" (ngSubmit)="submitIncome()" class="mt-4 space-y-3.5">
            <div>
              <label for="income-date" class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Date</label>
              <input
                id="income-date"
                name="date"
                type="date"
                [(ngModel)]="incomeData.date"
                required
                class="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 bg-slate-50/50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
              />
            </div>

            <div>
              <label for="income-source" class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Source</label>
              <select
                id="income-source"
                name="source"
                [(ngModel)]="incomeData.source"
                required
                class="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 bg-slate-50/50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark] cursor-pointer"
              >
                <option class="dark:bg-slate-800 dark:text-slate-100" value="Paycheck">Paycheck</option>
                <option class="dark:bg-slate-800 dark:text-slate-100" value="Interest">Interest</option>
                <option class="dark:bg-slate-800 dark:text-slate-100" value="Freelance">Freelance</option>
                <option class="dark:bg-slate-800 dark:text-slate-100" value="Investment">Investment</option>
                <option class="dark:bg-slate-800 dark:text-slate-100" value="Bonus">Bonus</option>
                <option class="dark:bg-slate-800 dark:text-slate-100" value="Other">Other</option>
              </select>
            </div>

            <div>
              <label for="income-amount" class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Amount (₹)</label>
              <input
                id="income-amount"
                name="amount"
                type="number"
                min="0.01"
                step="any"
                placeholder="e.g. 75000"
                [(ngModel)]="incomeData.amount"
                required
                class="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 bg-slate-50/50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 dark:[color-scheme:dark]"
              />
            </div>

            <button
              id="income-submit-btn"
              type="submit"
              class="w-full mt-2 inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Add Income
            </button>
          </form>
        </div>
      </div>

      <!-- 2. Budget Planner Form -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
        <div>
          <div class="flex items-center space-x-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <span class="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 dark:border dark:border-purple-800/40 flex items-center justify-center">
              <app-icon name="pie-chart"></app-icon>
            </span>
            <div>
              <h2 class="text-base font-bold text-slate-800 dark:text-slate-100">Budget Planner</h2>
              <p class="text-xs text-slate-400 dark:text-slate-500">Allocate planned monthly limits</p>
            </div>
          </div>

          <form id="budget-form" (ngSubmit)="submitBudget()" class="mt-4 space-y-3.5">
            <div>
              <label for="budget-category" class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Category</label>
              <select
                id="budget-category"
                name="category"
                [(ngModel)]="budgetData.category"
                required
                class="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 bg-slate-50/50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark] cursor-pointer"
              >
                <option class="dark:bg-slate-800 dark:text-slate-100" value="Groceries">Groceries</option>
                <option class="dark:bg-slate-800 dark:text-slate-100" value="Utilities">Utilities</option>
                <option class="dark:bg-slate-800 dark:text-slate-100" value="Entertainment">Entertainment</option>
                <option class="dark:bg-slate-800 dark:text-slate-100" value="Rent">Rent</option>
                <option class="dark:bg-slate-800 dark:text-slate-100" value="Transportation">Transportation</option>
                <option class="dark:bg-slate-800 dark:text-slate-100" value="Dining">Dining</option>
                <option class="dark:bg-slate-800 dark:text-slate-100" value="Healthcare">Healthcare</option>
                <option class="dark:bg-slate-800 dark:text-slate-100" value="Shopping">Shopping</option>
                <option class="dark:bg-slate-800 dark:text-slate-100" value="Other">Other</option>
              </select>
            </div>

            <div>
              <label for="budget-amount" class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Planned Amount (₹)</label>
              <input
                id="budget-amount"
                name="plannedAmount"
                type="number"
                min="0.01"
                step="any"
                placeholder="e.g. 12000"
                [(ngModel)]="budgetData.plannedAmount"
                required
                class="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 bg-slate-50/50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 dark:[color-scheme:dark]"
              />
            </div>

            <div class="pt-6">
              <button
                id="budget-submit-btn"
                type="submit"
                class="w-full inline-flex items-center justify-center px-4 py-2.5 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Set Budget
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 3. Daily Expense Logging Form -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
        <div>
          <div class="flex items-center space-x-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <span class="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 dark:border dark:border-amber-800/40 flex items-center justify-center">
              <app-icon name="trending-down"></app-icon>
            </span>
            <div>
              <h2 class="text-base font-bold text-slate-800 dark:text-slate-100">Log Daily Expense</h2>
              <p class="text-xs text-slate-400 dark:text-slate-500">Track day-to-day expenditure</p>
            </div>
          </div>

          <form id="expense-form" (ngSubmit)="submitExpense()" class="mt-4 space-y-3.5">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="expense-date" class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Date</label>
                <input
                  id="expense-date"
                  name="date"
                  type="date"
                  [(ngModel)]="expenseData.date"
                  required
                  class="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:border-amber-400 bg-slate-50/50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
                />
              </div>

              <div>
                <label for="expense-category" class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Category</label>
                <select
                  id="expense-category"
                  name="category"
                  [(ngModel)]="expenseData.category"
                  required
                  class="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:border-amber-400 bg-slate-50/50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark] cursor-pointer"
                >
                  <option class="dark:bg-slate-800 dark:text-slate-100" value="Groceries">Groceries</option>
                  <option class="dark:bg-slate-800 dark:text-slate-100" value="Utilities">Utilities</option>
                  <option class="dark:bg-slate-800 dark:text-slate-100" value="Entertainment">Entertainment</option>
                  <option class="dark:bg-slate-800 dark:text-slate-100" value="Rent">Rent</option>
                  <option class="dark:bg-slate-800 dark:text-slate-100" value="Transportation">Transportation</option>
                  <option class="dark:bg-slate-800 dark:text-slate-100" value="Dining">Dining</option>
                  <option class="dark:bg-slate-800 dark:text-slate-100" value="Healthcare">Healthcare</option>
                  <option class="dark:bg-slate-800 dark:text-slate-100" value="Shopping">Shopping</option>
                  <option class="dark:bg-slate-800 dark:text-slate-100" value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label for="expense-amount" class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Amount (₹)</label>
              <input
                id="expense-amount"
                name="amount"
                type="number"
                min="0.01"
                step="any"
                placeholder="e.g. 4500"
                [(ngModel)]="expenseData.amount"
                required
                class="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:border-amber-400 bg-slate-50/50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 dark:[color-scheme:dark]"
              />
            </div>

            <div>
              <label for="expense-note" class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Note / Description</label>
              <input
                id="expense-note"
                name="note"
                type="text"
                placeholder="e.g. Supermarket trip"
                [(ngModel)]="expenseData.note"
                class="w-full text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:border-amber-400 bg-slate-50/50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 dark:[color-scheme:dark]"
              />
            </div>

            <button
              id="expense-submit-btn"
              type="submit"
              class="w-full mt-2 inline-flex items-center justify-center px-4 py-2.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Log Expense
            </button>
          </form>
        </div>
      </div>
    </div>
  `
})
export class TransactionFormsComponent {
  readonly tracker = inject(TrackerService);

  private getTodayStr(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  incomeData = {
    date: this.getTodayStr(),
    source: 'Paycheck',
    amount: null as number | string | null,
    note: ''
  };

  budgetData = {
    category: 'Groceries',
    plannedAmount: null as number | string | null
  };

  expenseData = {
    date: this.getTodayStr(),
    category: 'Groceries',
    amount: null as number | string | null,
    note: ''
  };

  constructor() {
    // Keep form dates in sync when selectedMonth changes
    effect(() => {
      const month = this.tracker.selectedMonth();
      const today = this.getTodayStr();
      if (today.startsWith(month)) {
        this.incomeData.date = today;
        this.expenseData.date = today;
      } else {
        this.incomeData.date = `${month}-01`;
        this.expenseData.date = `${month}-01`;
      }
    });
  }

  submitIncome(): void {
    const cleanAmt = this.tracker.parseAmount(this.incomeData.amount);
    if (!cleanAmt || cleanAmt <= 0) {
      this.tracker.showToast('Please enter an income amount greater than 0', 'error');
      return;
    }
    const sourceVal = this.incomeData.source?.trim() || 'Paycheck';
    const dateVal = this.incomeData.date || this.tracker.selectedMonth() + '-01';

    this.tracker.addIncome({
      date: dateVal,
      source: sourceVal,
      amount: cleanAmt,
      note: this.incomeData.note
    });

    this.incomeData.amount = null;
    this.incomeData.note = '';
  }

  submitBudget(): void {
    const cleanAmt = this.tracker.parseAmount(this.budgetData.plannedAmount);
    if (!cleanAmt || cleanAmt <= 0) {
      this.tracker.showToast('Please enter a budget amount greater than 0', 'error');
      return;
    }
    const categoryVal = this.budgetData.category?.trim() || 'Groceries';

    this.tracker.addBudget({
      category: categoryVal,
      plannedAmount: cleanAmt
    });

    this.budgetData.plannedAmount = null;
  }

  submitExpense(): void {
    const cleanAmt = this.tracker.parseAmount(this.expenseData.amount);
    if (!cleanAmt || cleanAmt <= 0) {
      this.tracker.showToast('Please enter an expense amount greater than 0', 'error');
      return;
    }
    const categoryVal = this.expenseData.category?.trim() || 'Groceries';
    const dateVal = this.expenseData.date || this.tracker.selectedMonth() + '-01';

    this.tracker.addExpense({
      date: dateVal,
      category: categoryVal,
      amount: cleanAmt,
      note: this.expenseData.note
    });

    this.expenseData.amount = null;
    this.expenseData.note = '';
  }
}
