import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackerService } from '../../services/tracker.service';
import { InrCurrencyPipe } from '../../pipes/inr-currency.pipe';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-summary-cards',
  standalone: true,
  imports: [CommonModule, InrCurrencyPipe, IconComponent],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <!-- Total Inflow Card -->
      <div
        id="kpi-total-inflow"
        class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Inflow</span>
          <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 dark:border dark:border-blue-800/40 flex items-center justify-center">
            <app-icon name="trending-up"></app-icon>
          </div>
        </div>
        <div class="mt-3">
          <div class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight kpi-value">
            {{ tracker.totalInflow() | inrCurrency }}
          </div>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {{ tracker.currentMonthIncomes().length }} income entries in {{ tracker.selectedMonth() }}
          </p>
        </div>
      </div>

      <!-- Total Budget Card -->
      <div
        id="kpi-total-budget"
        class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Budget</span>
          <div class="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 dark:border dark:border-purple-800/40 flex items-center justify-center">
            <app-icon name="pie-chart"></app-icon>
          </div>
        </div>
        <div class="mt-3">
          <div class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight kpi-value">
            {{ tracker.totalBudget() | inrCurrency }}
          </div>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Target allocation for {{ tracker.selectedMonth() }}
          </p>
        </div>
      </div>

      <!-- Actual Outflow Card -->
      <div
        id="kpi-actual-outflow"
        class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actual Outflow</span>
          <div class="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 dark:border dark:border-amber-800/40 flex items-center justify-center">
            <app-icon name="trending-down"></app-icon>
          </div>
        </div>
        <div class="mt-3">
          <div class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight kpi-value">
            {{ tracker.actualOutflow() | inrCurrency }}
          </div>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Expenses incurred in {{ tracker.selectedMonth() }}
          </p>
        </div>
      </div>

      <!-- Net Savings Card -->
      <div
        id="kpi-net-savings"
        class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Net Savings</span>
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            [ngClass]="tracker.netSavings() >= 0
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 dark:border dark:border-emerald-800/40'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 dark:border dark:border-rose-800/40'"
          >
            <app-icon name="wallet"></app-icon>
          </div>
        </div>
        <div class="mt-3">
          <div
            class="text-2xl sm:text-3xl font-extrabold tracking-tight kpi-value transition-colors"
            [ngClass]="tracker.netSavings() > 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : (tracker.netSavings() < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100')"
          >
            {{ tracker.netSavings() | inrCurrency }}
          </div>
          <div class="flex items-center mt-1">
            <span
              class="text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center transition-colors"
              [ngClass]="tracker.netSavings() >= 0
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border dark:border-emerald-800/50'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 dark:border dark:border-rose-800/50'"
            >
              {{ tracker.netSavings() >= 0 ? 'Positive Savings' : 'Deficit' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SummaryCardsComponent {
  readonly tracker = inject(TrackerService);
}
