import { TestBed } from '@angular/core/testing';
import { TrackerService } from './tracker.service';

describe('TrackerService', () => {
  let service: TrackerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TrackerService]
    });
    localStorage.clear();
    service = TestBed.inject(TrackerService);
    service.clearAllData();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add income with description/note correctly', () => {
    service.setSelectedMonth('2026-10');
    service.addIncome({
      date: '2026-10-15',
      source: 'Bonus',
      amount: 25000,
      note: 'Q3 Performance Incentive'
    });

    const incomes = service.currentMonthIncomes();
    expect(incomes.length).toBe(1);
    expect(incomes[0].source).toBe('Bonus');
    expect(incomes[0].amount).toBe(25000);
    expect(incomes[0].note).toBe('Q3 Performance Incentive');
    expect(incomes[0].month).toBe('2026-10');
    expect(service.totalInflow()).toBe(25000);
  });

  it('should add income without note or with whitespace note', () => {
    service.setSelectedMonth('2026-10');
    service.addIncome({
      date: '2026-10-01',
      source: 'Paycheck',
      amount: 80000,
      note: '   '
    });

    const incomes = service.currentMonthIncomes();
    expect(incomes.length).toBe(1);
    expect(incomes[0].source).toBe('Paycheck');
    expect(incomes[0].amount).toBe(80000);
    expect(incomes[0].note).toBeFalsy();
  });

  it('should update expense entry across all fields', () => {
    service.setSelectedMonth('2026-10');
    service.addExpense({
      date: '2026-10-05',
      category: 'Groceries',
      amount: 2000,
      note: 'Weekly essentials'
    });

    const added = service.currentMonthExpenses()[0];
    expect(added).toBeDefined();

    const success = service.updateExpense(added.id, {
      date: '2026-10-12',
      category: 'Dining',
      amount: 3200,
      note: 'Team dinner'
    });

    expect(success).toBeTrue();
    const updated = service.currentMonthExpenses()[0];
    expect(updated.date).toBe('2026-10-12');
    expect(updated.category).toBe('Dining');
    expect(updated.amount).toBe(3200);
    expect(updated.note).toBe('Team dinner');
    expect(service.actualOutflow()).toBe(3200);
  });

  it('should update income entry across all fields', () => {
    service.setSelectedMonth('2026-10');
    service.addIncome({
      date: '2026-10-01',
      source: 'Paycheck',
      amount: 50000,
      note: 'Regular salary'
    });

    const added = service.currentMonthIncomes()[0];
    expect(added).toBeDefined();

    const success = service.updateIncome(added.id, {
      date: '2026-10-03',
      source: 'Freelance',
      amount: 65000,
      note: 'Consulting retainer'
    });

    expect(success).toBeTrue();
    const updated = service.currentMonthIncomes()[0];
    expect(updated.date).toBe('2026-10-03');
    expect(updated.source).toBe('Freelance');
    expect(updated.amount).toBe(65000);
    expect(updated.note).toBe('Consulting retainer');
    expect(service.totalInflow()).toBe(65000);
  });

  it('should reject invalid amounts when updating', () => {
    service.setSelectedMonth('2026-10');
    service.addExpense({
      date: '2026-10-05',
      category: 'Groceries',
      amount: 1000
    });

    const exp = service.currentMonthExpenses()[0];
    const failed = service.updateExpense(exp.id, {
      amount: 0
    });
    expect(failed).toBeFalse();
    expect(service.currentMonthExpenses()[0].amount).toBe(1000);
  });

  it('should delete income entry correctly', () => {
    service.setSelectedMonth('2026-10');
    service.addIncome({
      date: '2026-10-05',
      source: 'Freelance',
      amount: 15000,
      note: 'Website design project'
    });

    const added = service.currentMonthIncomes()[0];
    expect(added).toBeDefined();

    service.deleteIncome(added.id);
    expect(service.currentMonthIncomes().length).toBe(0);
    expect(service.totalInflow()).toBe(0);
  });
});
