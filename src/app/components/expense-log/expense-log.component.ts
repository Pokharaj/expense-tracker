import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrackerService } from '../../services/tracker.service';
import { InrCurrencyPipe } from '../../pipes/inr-currency.pipe';
import { IconComponent } from '../icon/icon.component';
import { EXPENSE_CATEGORIES, INCOME_SOURCES, Expense, Income } from '../../models/tracker.model';

@Component({
  selector: 'app-expense-log',
  standalone: true,
  imports: [CommonModule, FormsModule, InrCurrencyPipe, IconComponent],
  styles: [`
    input[type="date"] {
      -webkit-appearance: none !important;
      -moz-appearance: none !important;
      appearance: none !important;
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      min-width: 0 !important;
      box-sizing: border-box !important;
    }
    input[type="date"]::-webkit-date-and-time-value {
      text-align: left !important;
      min-height: 1.4em !important;
      display: block !important;
      width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    input[type="date"]::-webkit-calendar-picker-indicator {
      display: block !important;
      cursor: pointer !important;
      opacity: 0.7 !important;
    }
    input[type="date"]::-webkit-calendar-picker-indicator:hover {
      opacity: 1 !important;
    }
  `],
  template: `
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors" id="expense-ledger-card">
      <div class="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">
            {{ activeTab === 'expenses' ? 'Expense Ledger' : 'Income Ledger' }}
          </h2>
          <p class="text-xs text-slate-400 dark:text-slate-500">Detailed transactions for {{ tracker.selectedMonth() }}</p>
        </div>

        <!-- Tab Switcher -->
        <div class="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto border border-transparent dark:border-slate-700/60">
          <button
            type="button"
            (click)="activeTab = 'expenses'"
            [ngClass]="activeTab === 'expenses'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'"
            class="px-3 py-1.5 rounded-lg text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <span>Expenses</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border dark:border-amber-800/40">
              {{ tracker.currentMonthExpenses().length }}
            </span>
          </button>
          <button
            type="button"
            (click)="activeTab = 'incomes'"
            [ngClass]="activeTab === 'incomes'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium'"
            class="px-3 py-1.5 rounded-lg text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <span>Inflow</span>
            <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:border dark:border-blue-800/40">
              {{ tracker.currentMonthIncomes().length }}
            </span>
          </button>
        </div>
      </div>

      <!-- ==================== EXPENSE TAB ==================== -->
      @if (activeTab === 'expenses') {
        @if (tracker.currentMonthExpenses().length === 0) {
          <div class="py-12 px-4 text-center empty-state" id="expense-ledger-empty">
            <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center mb-3">
              <app-icon name="trending-down"></app-icon>
            </div>
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">No expenses logged for this month</h3>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Use the Log Daily Expense form to add your transactions for {{ tracker.selectedMonth() }}.
            </p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm" id="expense-ledger-table">
              <thead class="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-800">
                <tr>
                  <th scope="col" class="py-3 px-4 sm:px-6">Date</th>
                  <th scope="col" class="py-3 px-4 sm:px-6">Amount</th>
                  <th scope="col" class="py-3 px-4 sm:px-6">Category</th>
                  <th scope="col" class="py-3 px-4 sm:px-6">Note / Description</th>
                  <th scope="col" class="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                @for (item of tracker.currentMonthExpenses(); track item.id) {
                  <tr
                    class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors expense-row"
                    [attr.data-id]="item.id"
                    [attr.data-note]="item.note"
                    [attr.data-category]="item.category"
                  >
                    <td class="py-3.5 px-4 sm:px-6 text-slate-600 dark:text-slate-400 font-mono text-xs expense-date-cell">
                      {{ item.date }}
                    </td>
                    <td class="py-3.5 px-4 sm:px-6 font-bold text-slate-900 dark:text-slate-100 expense-amount-cell">
                      {{ item.amount | inrCurrency }}
                    </td>
                    <td class="py-3.5 px-4 sm:px-6 font-semibold text-slate-800 dark:text-slate-200 expense-category-cell">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {{ item.category }}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 sm:px-6 text-slate-700 dark:text-slate-300 expense-note-cell">
                      {{ item.note || '-' }}
                    </td>
                    <td class="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div class="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          (click)="openEditExpense(item)"
                          [attr.aria-label]="'Edit ' + (item.note || item.category)"
                          class="edit-expense-btn inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors border border-blue-200/60 dark:border-blue-900/40 cursor-pointer"
                        >
                          <app-icon name="edit"></app-icon>
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          (click)="tracker.deleteExpense(item.id)"
                          [attr.aria-label]="'Delete ' + (item.note || item.category)"
                          class="delete-expense-btn inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors border border-rose-200/60 dark:border-rose-900/40 cursor-pointer"
                        >
                          <app-icon name="trash"></app-icon>
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }

      <!-- ==================== INCOME TAB ==================== -->
      @if (activeTab === 'incomes') {
        @if (tracker.currentMonthIncomes().length === 0) {
          <div class="py-12 px-4 text-center empty-state" id="income-ledger-empty">
            <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center mb-3">
              <app-icon name="trending-up"></app-icon>
            </div>
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">No income logged for this month</h3>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Use the Log Income form to record your salary, interest, or revenue for {{ tracker.selectedMonth() }}.
            </p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm" id="income-ledger-table">
              <thead class="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-800">
                <tr>
                  <th scope="col" class="py-3 px-4 sm:px-6">Date</th>
                  <th scope="col" class="py-3 px-4 sm:px-6">Amount</th>
                  <th scope="col" class="py-3 px-4 sm:px-6">Source</th>
                  <th scope="col" class="py-3 px-4 sm:px-6">Note / Description</th>
                  <th scope="col" class="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                @for (item of tracker.currentMonthIncomes(); track item.id) {
                  <tr
                    class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors income-row"
                    [attr.data-id]="item.id"
                    [attr.data-source]="item.source"
                    [attr.data-note]="item.note"
                  >
                    <td class="py-3.5 px-4 sm:px-6 text-slate-600 dark:text-slate-400 font-mono text-xs income-date-cell">
                      {{ item.date }}
                    </td>
                    <td class="py-3.5 px-4 sm:px-6 font-bold text-emerald-600 dark:text-emerald-400 income-amount-cell">
                      {{ item.amount | inrCurrency }}
                    </td>
                    <td class="py-3.5 px-4 sm:px-6 font-semibold text-slate-800 dark:text-slate-200 income-source-cell">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 dark:border dark:border-blue-800/40">
                        {{ item.source }}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 sm:px-6 text-slate-700 dark:text-slate-300 income-note-cell">
                      {{ item.note || '-' }}
                    </td>
                    <td class="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                      <div class="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          (click)="openEditIncome(item)"
                          [attr.aria-label]="'Edit ' + (item.note || item.source)"
                          class="edit-income-btn inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors border border-blue-200/60 dark:border-blue-900/40 cursor-pointer"
                        >
                          <app-icon name="edit"></app-icon>
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          (click)="tracker.deleteIncome(item.id)"
                          [attr.aria-label]="'Delete ' + (item.note || item.source)"
                          class="delete-income-btn inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors border border-rose-200/60 dark:border-rose-900/40 cursor-pointer"
                        >
                          <app-icon name="trash"></app-icon>
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </div>

    <!-- ==================== EDIT ENTRY MODAL ==================== -->
    @if (editingType) {
      <div
        class="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
        (click)="closeEditModal()"
        id="edit-modal-backdrop"
      >
        <div
          class="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors relative"
          (click)="$event.stopPropagation()"
          id="edit-entry-dialog"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="'edit-modal-title'"
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div class="flex items-center space-x-3">
              <span
                class="w-9 h-9 rounded-xl flex items-center justify-center"
                [ngClass]="editingType === 'expense'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40'"
              >
                <app-icon [name]="editingType === 'expense' ? 'trending-down' : 'trending-up'"></app-icon>
              </span>
              <div>
                <h3 id="edit-modal-title" class="text-base font-bold text-slate-900 dark:text-slate-100">
                  {{ editingType === 'expense' ? 'Edit Expense Entry' : 'Edit Income Entry' }}
                </h3>
                <p class="text-xs text-slate-400 dark:text-slate-500">Modify transaction details in the ledger</p>
              </div>
            </div>

            <button
              type="button"
              (click)="closeEditModal()"
              aria-label="Close modal"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <app-icon name="x"></app-icon>
            </button>
          </div>

          <!-- Modal Edit Form -->
          <form (ngSubmit)="saveEdit()" class="mt-5 space-y-4" id="edit-entry-form">
            <!-- 1. Date -->
            <div class="w-full min-w-0">
              <label for="edit-date" class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Date</label>
              <input
                id="edit-date"
                name="date"
                type="date"
                [(ngModel)]="editForm.date"
                required
                class="block w-full min-w-0 max-w-full box-border text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 bg-slate-50/50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
              />
            </div>

            <!-- 2. Amount -->
            <div class="w-full min-w-0">
              <label for="edit-amount" class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Amount (₹)</label>
              <input
                id="edit-amount"
                name="amount"
                type="number"
                min="0.01"
                step="any"
                [(ngModel)]="editForm.amount"
                required
                placeholder="e.g. 5000"
                class="block w-full min-w-0 max-w-full box-border text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 bg-slate-50/50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 dark:[color-scheme:dark]"
              />
            </div>

            <!-- 3. Category (Expense) or Source (Income) -->
            @if (editingType === 'expense') {
              <div class="w-full min-w-0">
                <label for="edit-category" class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Category</label>
                <select
                  id="edit-category"
                  name="category"
                  [(ngModel)]="editForm.categoryOrSource"
                  required
                  class="block w-full min-w-0 max-w-full box-border text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 bg-slate-50/50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark] cursor-pointer"
                >
                  @for (cat of availableCategories; track cat) {
                    <option class="dark:bg-slate-800 dark:text-slate-100" [value]="cat">{{ cat }}</option>
                  }
                </select>
              </div>
            } @else {
              <div class="w-full min-w-0">
                <label for="edit-source" class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Source</label>
                <select
                  id="edit-source"
                  name="source"
                  [(ngModel)]="editForm.categoryOrSource"
                  required
                  class="block w-full min-w-0 max-w-full box-border text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 bg-slate-50/50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark] cursor-pointer"
                >
                  @for (src of availableSources; track src) {
                    <option class="dark:bg-slate-800 dark:text-slate-100" [value]="src">{{ src }}</option>
                  }
                </select>
              </div>
            }

            <!-- 4. Note / Description -->
            <div class="w-full min-w-0">
              <label for="edit-note" class="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Note / Description</label>
              <input
                id="edit-note"
                name="note"
                type="text"
                [(ngModel)]="editForm.note"
                placeholder="e.g. Note or description"
                class="block w-full min-w-0 max-w-full box-border text-sm px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 bg-slate-50/50 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 dark:[color-scheme:dark]"
              />
            </div>

            <!-- Footer Action Buttons -->
            <div class="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                (click)="closeEditModal()"
                class="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-edit-btn"
                class="px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                [ngClass]="editingType === 'expense'
                  ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500'
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500'"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class ExpenseLogComponent {
  readonly tracker = inject(TrackerService);
  activeTab: 'expenses' | 'incomes' = 'expenses';
  readonly expenseCategories = EXPENSE_CATEGORIES;
  readonly incomeSources = INCOME_SOURCES;

  // Edit modal state
  editingType: 'expense' | 'income' | null = null;
  editingId: string | null = null;

  editForm = {
    date: '',
    amount: null as number | string | null,
    categoryOrSource: '',
    note: ''
  };

  get availableCategories(): string[] {
    if (this.editingType === 'expense' && this.editForm.categoryOrSource) {
      const current = this.editForm.categoryOrSource.trim();
      if (current && !this.expenseCategories.some(c => c.toLowerCase() === current.toLowerCase())) {
        return [current, ...this.expenseCategories];
      }
    }
    return [...this.expenseCategories];
  }

  get availableSources(): string[] {
    if (this.editingType === 'income' && this.editForm.categoryOrSource) {
      const current = this.editForm.categoryOrSource.trim();
      if (current && !this.incomeSources.some(s => s.toLowerCase() === current.toLowerCase())) {
        return [current, ...this.incomeSources];
      }
    }
    return [...this.incomeSources];
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.editingType) {
      this.closeEditModal();
    }
  }

  openEditExpense(item: Expense): void {
    this.editingType = 'expense';
    this.editingId = item.id;
    this.editForm = {
      date: item.date,
      amount: item.amount,
      categoryOrSource: item.category,
      note: item.note || ''
    };
  }

  openEditIncome(item: Income): void {
    this.editingType = 'income';
    this.editingId = item.id;
    this.editForm = {
      date: item.date,
      amount: item.amount,
      categoryOrSource: item.source,
      note: item.note || ''
    };
  }

  closeEditModal(): void {
    this.editingType = null;
    this.editingId = null;
    this.editForm = {
      date: '',
      amount: null,
      categoryOrSource: '',
      note: ''
    };
  }

  saveEdit(): void {
    if (!this.editingId || !this.editingType) return;

    const cleanAmt = this.tracker.parseAmount(this.editForm.amount);
    if (!cleanAmt || cleanAmt <= 0) {
      this.tracker.showToast('Please enter an amount greater than 0', 'error');
      return;
    }

    if (!this.editForm.date) {
      this.tracker.showToast('Please select a valid date', 'error');
      return;
    }

    if (this.editingType === 'expense') {
      const success = this.tracker.updateExpense(this.editingId, {
        date: this.editForm.date,
        category: this.editForm.categoryOrSource || 'Groceries',
        amount: cleanAmt,
        note: this.editForm.note
      });
      if (success) {
        this.closeEditModal();
      }
    } else {
      const success = this.tracker.updateIncome(this.editingId, {
        date: this.editForm.date,
        source: this.editForm.categoryOrSource || 'Paycheck',
        amount: cleanAmt,
        note: this.editForm.note
      });
      if (success) {
        this.closeEditModal();
      }
    }
  }
}
