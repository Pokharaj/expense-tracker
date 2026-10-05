import { Component } from '@angular/core';
import { HeaderComponent } from './components/header/header.component';
import { SummaryCardsComponent } from './components/summary-cards/summary-cards.component';
import { TransactionFormsComponent } from './components/transaction-forms/transaction-forms.component';
import { BudgetTableComponent } from './components/budget-table/budget-table.component';
import { ExpenseLogComponent } from './components/expense-log/expense-log.component';
import { AnalyticsChartsComponent } from './components/analytics-charts/analytics-charts.component';
import { ToastComponent } from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    SummaryCardsComponent,
    TransactionFormsComponent,
    BudgetTableComponent,
    ExpenseLogComponent,
    AnalyticsChartsComponent,
    ToastComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'Expense & Budget Tracker';
}
