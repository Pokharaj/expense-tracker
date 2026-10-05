import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrackerService } from '../../services/tracker.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-analytics-charts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Bar Chart Card -->
      <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base font-bold text-slate-800">Budget vs Actual Outflow</h2>
            <p class="text-xs text-slate-400">Comparison across planned categories</p>
          </div>
          <span class="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">Bar Chart</span>
        </div>
        <div class="relative w-full h-64 sm:h-72">
          <canvas #barCanvas id="bar-chart-canvas"></canvas>
        </div>
      </div>

      <!-- Doughnut / Pie Chart Card -->
      <div class="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base font-bold text-slate-800">Expense Allocation Breakdown</h2>
            <p class="text-xs text-slate-400">Proportional category distribution</p>
          </div>
          <span class="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700">Doughnut Chart</span>
        </div>
        <div class="relative w-full h-64 sm:h-72 flex items-center justify-center">
          <canvas #pieCanvas id="doughnut-chart-canvas"></canvas>
        </div>
      </div>
    </div>
  `
})
export class AnalyticsChartsComponent implements AfterViewInit, OnDestroy {
  readonly tracker = inject(TrackerService);

  @ViewChild('barCanvas') barCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieCanvas') pieCanvasRef!: ElementRef<HTMLCanvasElement>;

  private barChartInstance: Chart | null = null;
  private pieChartInstance: Chart | null = null;
  private viewInitialized = false;

  constructor() {
    // Whenever budgets, expenses or month changes, update charts
    effect(() => {
      // Access reactive signals
      const comparisons = this.tracker.budgetComparison();
      const expenses = this.tracker.currentMonthExpenses();
      const month = this.tracker.selectedMonth();

      if (this.viewInitialized) {
        this.updateCharts(comparisons, expenses);
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.initCharts();
  }

  ngOnDestroy(): void {
    if (this.barChartInstance) {
      this.barChartInstance.destroy();
    }
    if (this.pieChartInstance) {
      this.pieChartInstance.destroy();
    }
  }

  private initCharts(): void {
    const comparisons = this.tracker.budgetComparison();
    const expenses = this.tracker.currentMonthExpenses();
    this.updateCharts(comparisons, expenses);
  }

  private updateCharts(
    comparisons: ReturnType<typeof this.tracker.budgetComparison>,
    expenses: ReturnType<typeof this.tracker.currentMonthExpenses>
  ): void {
    if (!this.barCanvasRef || !this.pieCanvasRef) return;

    // --- 1. BAR CHART: Budget vs Actual ---
    const barLabels = comparisons.length > 0 ? comparisons.map(c => c.category) : ['No Data'];
    const plannedData = comparisons.length > 0 ? comparisons.map(c => c.plannedAmount) : [0];
    const actualData = comparisons.length > 0 ? comparisons.map(c => c.actualAmount) : [0];

    if (this.barChartInstance) {
      this.barChartInstance.data.labels = barLabels;
      this.barChartInstance.data.datasets[0].data = plannedData;
      this.barChartInstance.data.datasets[1].data = actualData;
      this.barChartInstance.update();
    } else {
      const ctx = this.barCanvasRef.nativeElement.getContext('2d');
      if (ctx) {
        this.barChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: barLabels,
            datasets: [
              {
                label: 'Planned Budget (₹)',
                data: plannedData,
                backgroundColor: 'rgba(147, 51, 234, 0.75)',
                borderColor: 'rgb(147, 51, 234)',
                borderWidth: 1,
                borderRadius: 4
              },
              {
                label: 'Actual Outflow (₹)',
                data: actualData,
                backgroundColor: 'rgba(234, 88, 12, 0.75)',
                borderColor: 'rgb(234, 88, 12)',
                borderWidth: 1,
                borderRadius: 4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  boxWidth: 12,
                  font: { size: 11, family: 'Inter, sans-serif' }
                }
              },
              tooltip: {
                callbacks: {
                  label: context => `${context.dataset.label}: ₹${Number(context.raw).toLocaleString('en-IN')}`
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(226, 232, 240, 0.6)' },
                ticks: {
                  callback: val => `₹${Number(val).toLocaleString('en-IN')}`,
                  font: { size: 10 }
                }
              },
              x: {
                grid: { display: false },
                ticks: { font: { size: 10 } }
              }
            }
          }
        });
      }
    }

    // --- 2. DOUGHNUT CHART: Expense Allocation Breakdown ---
    const categoryTotals = new Map<string, number>();
    for (const exp of expenses) {
      const cat = exp.category.trim();
      categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + exp.amount);
    }

    const pieLabels = categoryTotals.size > 0 ? Array.from(categoryTotals.keys()) : ['No Expenses'];
    const pieData = categoryTotals.size > 0 ? Array.from(categoryTotals.values()) : [1];
    const pieColors =
      categoryTotals.size > 0
        ? [
            '#3B82F6',
            '#EC4899',
            '#10B981',
            '#F59E0B',
            '#8B5CF6',
            '#6366F1',
            '#14B8A6',
            '#F97316'
          ]
        : ['#E2E8F0'];

    if (this.pieChartInstance) {
      this.pieChartInstance.data.labels = pieLabels;
      this.pieChartInstance.data.datasets[0].data = pieData;
      this.pieChartInstance.data.datasets[0].backgroundColor = pieColors;
      this.pieChartInstance.update();
    } else {
      const ctx = this.pieCanvasRef.nativeElement.getContext('2d');
      if (ctx) {
        this.pieChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: pieLabels,
            datasets: [
              {
                data: pieData,
                backgroundColor: pieColors,
                borderWidth: 2,
                borderColor: '#FFFFFF'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 10,
                  font: { size: 11, family: 'Inter, sans-serif' }
                }
              },
              tooltip: {
                enabled: categoryTotals.size > 0,
                callbacks: {
                  label: context => ` ${context.label}: ₹${Number(context.raw).toLocaleString('en-IN')}`
                }
              }
            },
            cutout: '65%'
          }
        });
      }
    }
  }
}
