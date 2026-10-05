import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackerService } from '../../services/tracker.service';
import { ThemeService, ThemeMode } from '../../services/theme.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <header class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm transition-colors duration-150">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <!-- Brand Identity -->
        <div class="flex items-center space-x-3">
          <div class="bg-indigo-600 dark:bg-indigo-500 text-white p-2 rounded-xl shadow-sm flex items-center justify-center">
            <app-icon name="wallet"></app-icon>
          </div>
          <div>
            <h1 class="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
              Expense & Budget Tracker
            </h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block mt-0.5">
              Personal Wealth & Financial Ledger SPA
            </p>
          </div>
        </div>

        <!-- Controls: Month Selector & Theme Switcher -->
        <div class="flex items-center space-x-2 sm:space-x-3">
          <!-- Month Selector -->
          <div class="flex items-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-colors">
            <span class="text-slate-400 dark:text-slate-400 mr-2 flex items-center">
              <app-icon name="calendar"></app-icon>
            </span>
            <label for="month-selector" class="sr-only">Select Month</label>
            <input
              id="month-selector"
              type="month"
              [value]="tracker.selectedMonth()"
              (change)="onMonthChange($event)"
              class="bg-transparent border-none text-sm font-semibold text-slate-800 dark:text-slate-100 dark:[color-scheme:dark] focus:outline-none cursor-pointer"
            />
          </div>

          <!-- Theme Switcher 3-Way Segmented Control -->
          <div
            class="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 transition-colors"
            role="group"
            aria-label="Toggle theme"
          >
            <button
              type="button"
              id="theme-btn-light"
              (click)="themeService.setTheme('light')"
              [ngClass]="themeService.theme() === 'light'
                ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'"
              class="p-1.5 rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer"
              title="Light theme"
              aria-label="Light theme"
            >
              <app-icon name="sun"></app-icon>
            </button>

            <button
              type="button"
              id="theme-btn-dark"
              (click)="themeService.setTheme('dark')"
              [ngClass]="themeService.theme() === 'dark'
                ? 'bg-white dark:bg-slate-700 text-indigo-400 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'"
              class="p-1.5 rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer"
              title="Dark theme"
              aria-label="Dark theme"
            >
              <app-icon name="moon"></app-icon>
            </button>

            <button
              type="button"
              id="theme-btn-system"
              (click)="themeService.setTheme('system')"
              [ngClass]="themeService.theme() === 'system'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'"
              class="p-1.5 rounded-lg text-xs transition-all flex items-center justify-center cursor-pointer"
              title="System preference"
              aria-label="System theme"
            >
              <app-icon name="monitor"></app-icon>
            </button>
          </div>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  readonly tracker = inject(TrackerService);
  readonly themeService = inject(ThemeService);

  onMonthChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target && target.value) {
      this.tracker.setSelectedMonth(target.value);
    }
  }
}
