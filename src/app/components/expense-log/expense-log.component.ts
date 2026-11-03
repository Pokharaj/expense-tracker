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
          <p class="text-xs text-slate-400 dark:text-slate-500">
            {{ filters.month === 'all' ? 'All historical transactions' : (filters.month !== 'current' ? 'Transactions for ' + filters.month : 'Detailed transactions for ' + tracker.selectedMonth()) }}
          </p>
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
              {{ hasActiveFilters && activeTab === 'expenses' ? filteredExpenses.length : tracker.currentMonthExpenses().length }}
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
              {{ hasActiveFilters && activeTab === 'incomes' ? filteredIncomes.length : tracker.currentMonthIncomes().length }}
            </span>
          </button>
        </div>
      </div>

      <!-- ==================== FILTER TOOLBAR & CONTROLS ==================== -->
      <div class="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 transition-colors">
        <!-- Quick Search Bar & Filter Toggle Buttons -->
        <div class="p-3 sm:px-6 flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
          <!-- Unified Quick Search Input -->
          <div class="relative flex-1 min-w-[200px]">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none flex items-center">
              <app-icon name="search"></app-icon>
            </span>
            <input
              id="expense-search-input"
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Quick search across all fields (note, category, date, amount)..."
              class="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
            />
            @if (searchQuery) {
              <button
                type="button"
                (click)="searchQuery = ''"
                aria-label="Clear search"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                <app-icon name="x"></app-icon>
              </button>
            }
          </div>

          <!-- Toggle Advanced Filters Button -->
          <button
            type="button"
            id="toggle-filter-btn"
            (click)="isFilterPanelOpen = !isFilterPanelOpen"
            [attr.aria-expanded]="isFilterPanelOpen"
            [ngClass]="isFilterPanelOpen || hasActiveFilters
              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60 shadow-xs'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'"
            class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0"
          >
            <app-icon name="filter"></app-icon>
            <span>Filters</span>
            @if (activeFilterCount > 0) {
              <span class="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-600 text-white dark:bg-indigo-500">
                {{ activeFilterCount }}
              </span>
            }
          </button>

          <!-- Clear All Filters Button -->
          @if (hasActiveFilters) {
            <button
              type="button"
              id="clear-filters-btn"
              (click)="clearFilters()"
              class="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              <app-icon name="x"></app-icon>
              <span>Clear</span>
            </button>
          }
        </div>

        <!-- Collapsible Multi-Field Filter Panel -->
        @if (isFilterPanelOpen) {
          <div
            id="expense-filter-panel"
            class="px-3 pb-4 sm:px-6 pt-1 border-t border-slate-100 dark:border-slate-800/80 transition-all"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <!-- 1. Category / Source Filter -->
              <div>
                <label [for]="activeTab === 'expenses' ? 'filter-category' : 'filter-source'" class="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {{ activeTab === 'expenses' ? 'Category' : 'Source' }}
                </label>
                @if (activeTab === 'expenses') {
                  <select
                    id="filter-category"
                    [(ngModel)]="filters.category"
                    class="w-full text-xs sm:text-sm px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:[color-scheme:dark] cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    @for (cat of filterCategories; track cat) {
                      <option [value]="cat">{{ cat }}</option>
                    }
                  </select>
                } @else {
                  <select
                    id="filter-source"
                    [(ngModel)]="filters.source"
                    class="w-full text-xs sm:text-sm px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:[color-scheme:dark] cursor-pointer"
                  >
                    <option value="">All Sources</option>
                    @for (src of filterSources; track src) {
                      <option [value]="src">{{ src }}</option>
                    }
                  </select>
                }
              </div>

              <!-- 2. Date Range: From & To -->
              <div>
                <label class="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Date Range
                </label>
                <div class="grid grid-cols-2 gap-1.5">
                  <input
                    id="filter-date-from"
                    type="date"
                    [(ngModel)]="filters.dateFrom"
                    placeholder="From"
                    class="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:[color-scheme:dark]"
                    title="From Date"
                  />
                  <input
                    id="filter-date-to"
                    type="date"
                    [(ngModel)]="filters.dateTo"
                    placeholder="To"
                    class="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:[color-scheme:dark]"
                    title="To Date"
                  />
                </div>
              </div>

              <!-- 3. Amount Range: Min & Max -->
              <div>
                <label class="block font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Amount Range (₹)
                </label>
                <div class="grid grid-cols-2 gap-1.5">
                  <input
                    id="filter-min-amount"
                    type="number"
                    min="0"
                    step="any"
                    [(ngModel)]="filters.minAmount"
                    placeholder="Min ₹"
                    class="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <input
                    id="filter-max-amount"
                    type="number"
                    min="0"
                    step="any"
                    [(ngModel)]="filters.maxAmount"
                    placeholder="Max ₹"
                    class="w-full text-xs px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        }

        <!-- Active Filter Chips / Badges Display -->
        @if (hasActiveFilters) {
          <div class="px-3 sm:px-6 py-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-1.5 text-xs bg-slate-50/40 dark:bg-slate-800/20" id="active-filter-chips">
            <span class="text-slate-400 dark:text-slate-500 text-[11px] font-medium mr-1">Active filters:</span>

            @if (searchQuery) {
              <span class="filter-chip-search inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40 text-[11px]">
                <span>Search: "{{ searchQuery }}"</span>
                <button type="button" (click)="searchQuery = ''" class="hover:text-indigo-900 dark:hover:text-indigo-100 cursor-pointer"><app-icon name="x"></app-icon></button>
              </span>
            }

            @if (activeTab === 'expenses' && filters.category) {
              <span class="filter-chip-category inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 text-[11px]">
                <span>Category: {{ filters.category }}</span>
                <button type="button" (click)="filters.category = ''" class="hover:text-amber-900 dark:hover:text-amber-100 cursor-pointer"><app-icon name="x"></app-icon></button>
              </span>
            }

            @if (activeTab === 'incomes' && filters.source) {
              <span class="filter-chip-source inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 text-[11px]">
                <span>Source: {{ filters.source }}</span>
                <button type="button" (click)="filters.source = ''" class="hover:text-blue-900 dark:hover:text-blue-100 cursor-pointer"><app-icon name="x"></app-icon></button>
              </span>
            }

            @if (filters.dateFrom && filters.dateTo && filters.dateFrom === filters.dateTo) {
              <span class="filter-chip-date inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px]">
                <span>Date: {{ filters.dateFrom }}</span>
                <button type="button" (click)="filters.dateFrom = ''; filters.dateTo = ''" class="hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"><app-icon name="x"></app-icon></button>
              </span>
            } @else {
              @if (filters.dateFrom) {
                <span class="filter-chip-date-from inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px]">
                  <span>From: {{ filters.dateFrom }}</span>
                  <button type="button" (click)="filters.dateFrom = ''" class="hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"><app-icon name="x"></app-icon></button>
                </span>
              }
              @if (filters.dateTo) {
                <span class="filter-chip-date-to inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px]">
                  <span>To: {{ filters.dateTo }}</span>
                  <button type="button" (click)="filters.dateTo = ''" class="hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"><app-icon name="x"></app-icon></button>
                </span>
              }
            }

            @if (filters.minAmount !== null && filters.minAmount !== '' && filters.minAmount !== undefined) {
              <span class="filter-chip-min-amount inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px]">
                <span>Min: ₹{{ filters.minAmount }}</span>
                <button type="button" (click)="filters.minAmount = null" class="hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"><app-icon name="x"></app-icon></button>
              </span>
            }

            @if (filters.maxAmount !== null && filters.maxAmount !== '' && filters.maxAmount !== undefined) {
              <span class="filter-chip-max-amount inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[11px]">
                <span>Max: ₹{{ filters.maxAmount }}</span>
                <button type="button" (click)="filters.maxAmount = null" class="hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"><app-icon name="x"></app-icon></button>
              </span>
            }
          </div>
        }

        <!-- Filter Count and Results Summary Info -->
        @if (activeTab === 'expenses' && (hasActiveFilters || totalExpenseCount > 0)) {
          <div class="px-4 sm:px-6 py-2 bg-slate-100/40 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between" id="filter-results-summary">
            <div>
              <span>Showing </span>
              <strong class="text-slate-700 dark:text-slate-200">{{ filteredExpenses.length }}</strong>
              <span> of </span>
              <strong>{{ totalExpenseCount }}</strong>
              <span> expenses</span>
              @if (hasActiveFilters) {
                <span class="ml-1 text-indigo-600 dark:text-indigo-400 font-medium">(filtered)</span>
              }
            </div>
            @if (filteredExpenses.length > 0) {
              <div class="font-medium text-slate-700 dark:text-slate-300">
                Filtered Total: <strong class="text-slate-900 dark:text-slate-100">{{ filteredExpenseTotal | inrCurrency }}</strong>
              </div>
            }
          </div>
        }

        @if (activeTab === 'incomes' && (hasActiveFilters || totalIncomeCount > 0)) {
          <div class="px-4 sm:px-6 py-2 bg-slate-100/40 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between" id="filter-results-summary-income">
            <div>
              <span>Showing </span>
              <strong class="text-slate-700 dark:text-slate-200">{{ filteredIncomes.length }}</strong>
              <span> of </span>
              <strong>{{ totalIncomeCount }}</strong>
              <span> income entries</span>
              @if (hasActiveFilters) {
                <span class="ml-1 text-indigo-600 dark:text-indigo-400 font-medium">(filtered)</span>
              }
            </div>
            @if (filteredIncomes.length > 0) {
              <div class="font-medium text-slate-700 dark:text-slate-300">
                Filtered Total: <strong class="text-slate-900 dark:text-slate-100">{{ filteredIncomeTotal | inrCurrency }}</strong>
              </div>
            }
          </div>
        }
      </div>

      <!-- ==================== EXPENSE TAB ==================== -->
      @if (activeTab === 'expenses') {
        @if (totalExpenseCount === 0) {
          <div class="py-12 px-4 text-center empty-state" id="expense-ledger-empty">
            <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center mb-3">
              <app-icon name="trending-down"></app-icon>
            </div>
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">No expenses logged for this month</h3>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Use the Log Daily Expense form to add your transactions for {{ tracker.selectedMonth() }}.
            </p>
          </div>
        } @else if (filteredExpenses.length === 0) {
          <div class="py-12 px-4 text-center empty-state" id="expense-filter-empty">
            <div class="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400 mx-auto flex items-center justify-center mb-3">
              <app-icon name="filter"></app-icon>
            </div>
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">No expenses match your filters</h3>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your filter criteria or clear filters to view all {{ totalExpenseCount }} expenses.
            </p>
            <button
              type="button"
              (click)="clearFilters()"
              class="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              <app-icon name="refresh"></app-icon>
              <span>Clear All Filters</span>
            </button>
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
                @for (item of filteredExpenses; track item.id) {
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
        @if (totalIncomeCount === 0) {
          <div class="py-12 px-4 text-center empty-state" id="income-ledger-empty">
            <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center mb-3">
              <app-icon name="trending-up"></app-icon>
            </div>
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">No income logged for this month</h3>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Use the Log Income form to record your salary, interest, or revenue for {{ tracker.selectedMonth() }}.
            </p>
          </div>
        } @else if (filteredIncomes.length === 0) {
          <div class="py-12 px-4 text-center empty-state" id="income-filter-empty">
            <div class="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 mx-auto flex items-center justify-center mb-3">
              <app-icon name="filter"></app-icon>
            </div>
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">No income entries match your filters</h3>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your filter criteria or clear filters to view all {{ totalIncomeCount }} income entries.
            </p>
            <button
              type="button"
              (click)="clearFilters()"
              class="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              <app-icon name="refresh"></app-icon>
              <span>Clear All Filters</span>
            </button>
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
                @for (item of filteredIncomes; track item.id) {
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

  // Filter toolbar state
  isFilterPanelOpen = false;
  searchQuery = '';

  filters = {
    dateFrom: '',
    dateTo: '',
    category: '',
    source: '',
    minAmount: null as number | string | null,
    maxAmount: null as number | string | null,
    note: '',
    month: 'current'
  };

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

  get filterCategories(): string[] {
    const cats = new Set<string>(this.expenseCategories);
    for (const e of this.tracker.expenses()) {
      if (e.category) cats.add(e.category);
    }
    return Array.from(cats);
  }

  get filterSources(): string[] {
    const srcs = new Set<string>(this.incomeSources);
    for (const i of this.tracker.incomes()) {
      if (i.source) srcs.add(i.source);
    }
    return Array.from(srcs);
  }

  get availableMonths(): string[] {
    const months = new Set<string>();
    months.add(this.tracker.selectedMonth());
    for (const e of this.tracker.expenses()) {
      if (e.month) months.add(e.month);
    }
    for (const i of this.tracker.incomes()) {
      if (i.month) months.add(i.month);
    }
    return Array.from(months).sort().reverse();
  }

  get baseExpenses(): Expense[] {
    if (this.filters.month === 'all') {
      return this.tracker.expenses();
    }
    if (this.filters.month && this.filters.month !== 'current') {
      return this.tracker.expenses().filter(e => e.month === this.filters.month);
    }
    return this.tracker.currentMonthExpenses();
  }

  get totalExpenseCount(): number {
    return this.baseExpenses.length;
  }

  get filteredExpenses(): Expense[] {
    const list = this.baseExpenses;
    return list.filter(item => {
      // 1. Category
      if (this.filters.category && item.category.toLowerCase() !== this.filters.category.toLowerCase().trim()) {
        return false;
      }
      // 2. Date From
      if (this.filters.dateFrom && item.date < this.filters.dateFrom) {
        return false;
      }
      // 3. Date To
      if (this.filters.dateTo && item.date > this.filters.dateTo) {
        return false;
      }
      // 4. Min Amount
      if (this.filters.minAmount !== null && this.filters.minAmount !== '' && this.filters.minAmount !== undefined) {
        const min = Number(this.filters.minAmount);
        if (!isNaN(min) && item.amount < min) {
          return false;
        }
      }
      // 5. Max Amount
      if (this.filters.maxAmount !== null && this.filters.maxAmount !== '' && this.filters.maxAmount !== undefined) {
        const max = Number(this.filters.maxAmount);
        if (!isNaN(max) && item.amount > max) {
          return false;
        }
      }
      // 6. Note / Description
      if (this.filters.note && this.filters.note.trim()) {
        const noteFilter = this.filters.note.toLowerCase().trim();
        if (!item.note || !item.note.toLowerCase().includes(noteFilter)) {
          return false;
        }
      }
      // 7. Global Search Query
      if (this.searchQuery && this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        const matchesCategory = (item.category || '').toLowerCase().includes(q);
        const matchesNote = (item.note || '').toLowerCase().includes(q);
        const matchesDate = (item.date || '').toLowerCase().includes(q);
        const matchesAmount = (item.amount || '').toString().includes(q);
        if (!matchesCategory && !matchesNote && !matchesDate && !matchesAmount) {
          return false;
        }
      }
      return true;
    });
  }

  get filteredExpenseTotal(): number {
    return this.filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }

  get baseIncomes(): Income[] {
    if (this.filters.month === 'all') {
      return this.tracker.incomes();
    }
    if (this.filters.month && this.filters.month !== 'current') {
      return this.tracker.incomes().filter(i => i.month === this.filters.month);
    }
    return this.tracker.currentMonthIncomes();
  }

  get totalIncomeCount(): number {
    return this.baseIncomes.length;
  }

  get filteredIncomes(): Income[] {
    const list = this.baseIncomes;
    return list.filter(item => {
      // 1. Source
      if (this.filters.source && item.source.toLowerCase() !== this.filters.source.toLowerCase().trim()) {
        return false;
      }
      // 2. Date From
      if (this.filters.dateFrom && item.date < this.filters.dateFrom) {
        return false;
      }
      // 3. Date To
      if (this.filters.dateTo && item.date > this.filters.dateTo) {
        return false;
      }
      // 4. Min Amount
      if (this.filters.minAmount !== null && this.filters.minAmount !== '' && this.filters.minAmount !== undefined) {
        const min = Number(this.filters.minAmount);
        if (!isNaN(min) && item.amount < min) {
          return false;
        }
      }
      // 5. Max Amount
      if (this.filters.maxAmount !== null && this.filters.maxAmount !== '' && this.filters.maxAmount !== undefined) {
        const max = Number(this.filters.maxAmount);
        if (!isNaN(max) && item.amount > max) {
          return false;
        }
      }
      // 6. Note / Description
      if (this.filters.note && this.filters.note.trim()) {
        const noteFilter = this.filters.note.toLowerCase().trim();
        if (!item.note || !item.note.toLowerCase().includes(noteFilter)) {
          return false;
        }
      }
      // 7. Global Search Query
      if (this.searchQuery && this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase().trim();
        const matchesSource = (item.source || '').toLowerCase().includes(q);
        const matchesNote = (item.note || '').toLowerCase().includes(q);
        const matchesDate = (item.date || '').toLowerCase().includes(q);
        const matchesAmount = (item.amount || '').toString().includes(q);
        if (!matchesSource && !matchesNote && !matchesDate && !matchesAmount) {
          return false;
        }
      }
      return true;
    });
  }

  get filteredIncomeTotal(): number {
    return this.filteredIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.searchQuery && this.searchQuery.trim()) count++;
    if (this.filters.dateFrom) count++;
    if (this.filters.dateTo) count++;
    if (this.activeTab === 'expenses') {
      if (this.filters.category) count++;
    } else {
      if (this.filters.source) count++;
    }
    if (this.filters.minAmount !== null && this.filters.minAmount !== '' && this.filters.minAmount !== undefined) count++;
    if (this.filters.maxAmount !== null && this.filters.maxAmount !== '' && this.filters.maxAmount !== undefined) count++;
    if (this.filters.note && this.filters.note.trim()) count++;
    if (this.filters.month && this.filters.month !== 'current') count++;
    return count;
  }

  get hasActiveFilters(): boolean {
    return this.activeFilterCount > 0;
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filters = {
      dateFrom: '',
      dateTo: '',
      category: '',
      source: '',
      minAmount: null,
      maxAmount: null,
      note: '',
      month: 'current'
    };
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
