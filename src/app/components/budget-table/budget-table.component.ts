import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackerService } from '../../services/tracker.service';
import { InrCurrencyPipe } from '../../pipes/inr-currency.pipe';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-budget-table',
  standalone: true,
  imports: [CommonModule, InrCurrencyPipe, IconComponent],
  template: `
    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-colors" id="budget-matrix-card">
      <div class="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-800 dark:text-slate-100">Budget Performance Matrix</h2>
          <p class="text-xs text-slate-400 dark:text-slate-500">Planned targets vs actual expenditures for {{ tracker.selectedMonth() }}</p>
        </div>
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 dark:border dark:border-purple-800/50">
          {{ tracker.budgetComparison().length }} Categories
        </span>
      </div>

      <!-- Empty State -->
      @if (tracker.budgetComparison().length === 0) {
        <div class="py-12 px-4 text-center empty-state" id="budget-table-empty">
          <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center mb-3">
            <app-icon name="pie-chart"></app-icon>
          </div>
          <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">No budgets allocated for this month</h3>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Use the Budget Planner form above to set category spending limits for {{ tracker.selectedMonth() }}.
          </p>
        </div>
      } @else {
        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm" id="budget-matrix-table">
            <thead class="bg-slate-50 dark:bg-slate-800/60 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200/60 dark:border-slate-800">
              <tr>
                <th scope="col" class="py-3 px-4 sm:px-6">Category</th>
                <th scope="col" class="py-3 px-4 sm:px-6">Planned Budget</th>
                <th scope="col" class="py-3 px-4 sm:px-6">Actual Outflow</th>
                <th scope="col" class="py-3 px-4 sm:px-6">Remaining / Variance</th>
                <th scope="col" class="py-3 px-4 sm:px-6">Utilization</th>
                <th scope="col" class="py-3 px-4 sm:px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              @for (item of tracker.budgetComparison(); track item.category) {
                <tr class="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors budget-row" [attr.data-category]="item.category">
                  <td class="py-3.5 px-4 sm:px-6 font-semibold text-slate-800 dark:text-slate-200">
                    <div class="flex items-center space-x-2">
                      <span>{{ item.category }}</span>
                      @if (item.isUnplanned) {
                        <span class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border dark:border-amber-800/50">
                          Unplanned
                        </span>
                      }
                    </div>
                  </td>
                  <td class="py-3.5 px-4 sm:px-6 text-slate-600 dark:text-slate-300 planned-cell font-medium">
                    {{ item.plannedAmount | inrCurrency }}
                  </td>
                  <td class="py-3.5 px-4 sm:px-6 font-semibold text-slate-800 dark:text-slate-200 actual-cell">
                    {{ item.actualAmount | inrCurrency }}
                  </td>
                  <td class="py-3.5 px-4 sm:px-6 font-semibold variance-cell">
                    <span [ngClass]="item.remainingAmount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'">
                      {{ item.remainingAmount | inrCurrency:true }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 sm:px-6 w-36 sm:w-48">
                    <div class="flex items-center space-x-2">
                      <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          class="h-2 rounded-full transition-all duration-300"
                          [ngClass]="item.status === 'Over Budget' ? 'bg-rose-500 dark:bg-rose-400' : 'bg-emerald-500 dark:bg-emerald-400'"
                          [style.width.%]="item.percentUsed > 100 ? 100 : item.percentUsed"
                        ></div>
                      </div>
                      <span class="text-xs text-slate-400 dark:text-slate-500 font-mono w-9 text-right">
                        {{ item.percentUsed | number:'1.0-0' }}%
                      </span>
                    </div>
                  </td>
                  <td class="py-3.5 px-4 sm:px-6 text-center status-cell">
                    @if (item.status === 'Over Budget') {
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:border dark:border-rose-800/50 status-tag status-over-budget">
                        Over Budget
                      </span>
                    } @else {
                      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border dark:border-emerald-800/50 status-tag status-on-track">
                        On Track
                      </span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `
})
export class BudgetTableComponent {
  readonly tracker = inject(TrackerService);
}
