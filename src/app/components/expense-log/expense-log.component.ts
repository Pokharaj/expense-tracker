import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackerService } from '../../services/tracker.service';
import { InrCurrencyPipe } from '../../pipes/inr-currency.pipe';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-expense-log',
  standalone: true,
  imports: [CommonModule, InrCurrencyPipe, IconComponent],
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
                    <td class="py-3.5 px-4 sm:px-6 text-right">
                      <button
                        type="button"
                        (click)="tracker.deleteExpense(item.id)"
                        [attr.aria-label]="'Delete ' + (item.note || item.category)"
                        class="delete-expense-btn inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors border border-rose-200/60 dark:border-rose-900/40 cursor-pointer"
                      >
                        <app-icon name="trash"></app-icon>
                        <span>Delete</span>
                      </button>
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
                  <th scope="col" class="py-3 px-4 sm:px-6">Note</th>
                  <th scope="col" class="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                @for (item of tracker.currentMonthIncomes(); track item.id) {
                  <tr
                    class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors income-row"
                    [attr.data-id]="item.id"
                    [attr.data-source]="item.source"
                  >
                    <td class="py-3.5 px-4 sm:px-6 text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {{ item.date }}
                    </td>
                    <td class="py-3.5 px-4 sm:px-6 font-bold text-emerald-600 dark:text-emerald-400">
                      {{ item.amount | inrCurrency:true }}
                    </td>
                    <td class="py-3.5 px-4 sm:px-6 font-semibold text-slate-800 dark:text-slate-200">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 dark:border dark:border-blue-800/40">
                        {{ item.source }}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 sm:px-6 text-slate-700 dark:text-slate-300">
                      {{ item.note || '-' }}
                    </td>
                    <td class="py-3.5 px-4 sm:px-6 text-right">
                      <button
                        type="button"
                        (click)="tracker.deleteIncome(item.id)"
                        [attr.aria-label]="'Delete ' + item.source"
                        class="delete-income-btn inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors border border-rose-200/60 dark:border-rose-900/40 cursor-pointer"
                      >
                        <app-icon name="trash"></app-icon>
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    </div>
  `
})
export class ExpenseLogComponent {
  readonly tracker = inject(TrackerService);
  activeTab: 'expenses' | 'incomes' = 'expenses';
}
