import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExpenseLogComponent } from './expense-log.component';
import { TrackerService } from '../../services/tracker.service';

describe('ExpenseLogComponent', () => {
  let component: ExpenseLogComponent;
  let fixture: ComponentFixture<ExpenseLogComponent>;
  let tracker: TrackerService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ExpenseLogComponent],
      providers: [TrackerService]
    }).compileComponents();

    fixture = TestBed.createComponent(ExpenseLogComponent);
    component = fixture.componentInstance;
    tracker = TestBed.inject(TrackerService);
    tracker.clearAllData();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should display income notes in the income ledger table', () => {
    tracker.setSelectedMonth('2026-10');
    tracker.addIncome({
      date: '2026-10-05',
      source: 'Freelance',
      amount: 45000,
      note: 'Mobile app consultation'
    });

    component.activeTab = 'incomes';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const incomeRow = compiled.querySelector('.income-row') as HTMLElement;
    expect(incomeRow).toBeTruthy();
    expect(incomeRow.getAttribute('data-note')).toBe('Mobile app consultation');

    const noteCell = compiled.querySelector('.income-note-cell') as HTMLElement;
    expect(noteCell.textContent?.trim()).toBe('Mobile app consultation');
  });

  it('should open edit modal for expense with all fields pre-populated and save changes', () => {
    tracker.setSelectedMonth('2026-10');
    tracker.addExpense({
      date: '2026-10-04',
      category: 'Dining',
      amount: 1200,
      note: 'Coffee meetup'
    });

    component.activeTab = 'expenses';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const editBtn = compiled.querySelector('.edit-expense-btn') as HTMLButtonElement;
    expect(editBtn).toBeTruthy();

    // Click Edit button
    editBtn.click();
    fixture.detectChanges();

    // Modal should now be open
    expect(component.editingType).toBe('expense');
    expect(component.editForm.date).toBe('2026-10-04');
    expect(component.editForm.amount).toBe(1200);
    expect(component.editForm.categoryOrSource).toBe('Dining');
    expect(component.editForm.note).toBe('Coffee meetup');

    // Modify all fields
    component.editForm.date = '2026-10-14';
    component.editForm.amount = 1800;
    component.editForm.categoryOrSource = 'Entertainment';
    component.editForm.note = 'Movie night & dinner';

    // Submit edit
    component.saveEdit();
    fixture.detectChanges();

    // Modal should close
    expect(component.editingType).toBeNull();

    // Ledger should display updated values
    const updated = tracker.currentMonthExpenses()[0];
    expect(updated.date).toBe('2026-10-14');
    expect(updated.amount).toBe(1800);
    expect(updated.category).toBe('Entertainment');
    expect(updated.note).toBe('Movie night & dinner');
  });

  it('should open edit modal for income with all fields pre-populated and save changes', () => {
    tracker.setSelectedMonth('2026-10');
    tracker.addIncome({
      date: '2026-10-02',
      source: 'Bonus',
      amount: 20000,
      note: 'Spot bonus'
    });

    component.activeTab = 'incomes';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const editBtn = compiled.querySelector('.edit-income-btn') as HTMLButtonElement;
    expect(editBtn).toBeTruthy();

    // Click Edit button
    editBtn.click();
    fixture.detectChanges();

    expect(component.editingType).toBe('income');
    expect(component.editForm.date).toBe('2026-10-02');
    expect(component.editForm.amount).toBe(20000);
    expect(component.editForm.categoryOrSource).toBe('Bonus');
    expect(component.editForm.note).toBe('Spot bonus');

    // Update all fields
    component.editForm.date = '2026-10-10';
    component.editForm.amount = 35000;
    component.editForm.categoryOrSource = 'Investment';
    component.editForm.note = 'Dividend payout';

    component.saveEdit();
    fixture.detectChanges();

    expect(component.editingType).toBeNull();
    const updated = tracker.currentMonthIncomes()[0];
    expect(updated.date).toBe('2026-10-10');
    expect(updated.amount).toBe(35000);
    expect(updated.source).toBe('Investment');
    expect(updated.note).toBe('Dividend payout');
  });

  it('should cancel edit modal without modifying the entry', () => {
    tracker.setSelectedMonth('2026-10');
    tracker.addExpense({
      date: '2026-10-05',
      category: 'Rent',
      amount: 25000
    });

    const exp = tracker.currentMonthExpenses()[0];
    component.openEditExpense(exp);
    component.editForm.amount = 99999;
    component.closeEditModal();

    expect(component.editingType).toBeNull();
    expect(tracker.currentMonthExpenses()[0].amount).toBe(25000);
  });

  describe('Expense Filtering', () => {
    beforeEach(() => {
      tracker.setSelectedMonth('2026-10');
      tracker.addExpense({
        date: '2026-10-02',
        category: 'Groceries',
        amount: 3500,
        note: 'Supermarket weekly buy'
      });
      tracker.addExpense({
        date: '2026-10-08',
        category: 'Dining',
        amount: 1200,
        note: 'Coffee and brunch'
      });
      tracker.addExpense({
        date: '2026-10-15',
        category: 'Utilities',
        amount: 2400,
        note: 'Electricity bill'
      });
      tracker.addExpense({
        date: '2026-10-22',
        category: 'Dining',
        amount: 4500,
        note: 'Team dinner party'
      });

      component.activeTab = 'expenses';
      fixture.detectChanges();
    });

    it('should display all current month expenses initially', () => {
      expect(component.filteredExpenses.length).toBe(4);
      expect(component.totalExpenseCount).toBe(4);
      expect(component.hasActiveFilters).toBeFalse();

      const rows = fixture.nativeElement.querySelectorAll('.expense-row');
      expect(rows.length).toBe(4);
    });

    it('should filter expenses by category', () => {
      component.filters.category = 'Dining';
      fixture.detectChanges();

      expect(component.filteredExpenses.length).toBe(2);
      expect(component.filteredExpenses.every(e => e.category === 'Dining')).toBeTrue();

      const rows = fixture.nativeElement.querySelectorAll('.expense-row');
      expect(rows.length).toBe(2);
    });

    it('should filter expenses by date range (from and to)', () => {
      component.filters.dateFrom = '2026-10-05';
      component.filters.dateTo = '2026-10-20';
      fixture.detectChanges();

      expect(component.filteredExpenses.length).toBe(2);
      const dates = component.filteredExpenses.map(e => e.date);
      expect(dates).toContain('2026-10-08');
      expect(dates).toContain('2026-10-15');
    });

    it('should filter expenses by minimum amount', () => {
      component.filters.minAmount = 3000;
      fixture.detectChanges();

      expect(component.filteredExpenses.length).toBe(2);
      expect(component.filteredExpenses.every(e => e.amount >= 3000)).toBeTrue();
    });

    it('should filter expenses by maximum amount', () => {
      component.filters.maxAmount = 2000;
      fixture.detectChanges();

      expect(component.filteredExpenses.length).toBe(1);
      expect(component.filteredExpenses[0].category).toBe('Dining');
      expect(component.filteredExpenses[0].amount).toBe(1200);
    });

    it('should filter expenses by amount range (min and max)', () => {
      component.filters.minAmount = 2000;
      component.filters.maxAmount = 4000;
      fixture.detectChanges();

      expect(component.filteredExpenses.length).toBe(2);
      const amounts = component.filteredExpenses.map(e => e.amount);
      expect(amounts).toContain(3500);
      expect(amounts).toContain(2400);
    });

    it('should search expenses by note keyword using quick search', () => {
      component.searchQuery = 'electricity';
      fixture.detectChanges();

      expect(component.filteredExpenses.length).toBe(1);
      expect(component.filteredExpenses[0].note).toBe('Electricity bill');
    });

    it('should filter expenses using quick search across all fields', () => {
      // Search by category
      component.searchQuery = 'Utilities';
      expect(component.filteredExpenses.length).toBe(1);

      // Search by note
      component.searchQuery = 'brunch';
      expect(component.filteredExpenses.length).toBe(1);

      // Search by date
      component.searchQuery = '2026-10-22';
      expect(component.filteredExpenses.length).toBe(1);

      // Search by amount
      component.searchQuery = '4500';
      expect(component.filteredExpenses.length).toBe(1);
    });

    it('should filter expenses across multiple fields simultaneously', () => {
      component.filters.category = 'Dining';
      component.filters.minAmount = 2000;
      component.filters.dateFrom = '2026-10-20';
      fixture.detectChanges();

      expect(component.filteredExpenses.length).toBe(1);
      expect(component.filteredExpenses[0].amount).toBe(4500);
      expect(component.filteredExpenses[0].note).toBe('Team dinner party');
    });

    it('should show empty filter results state when no expenses match criteria', () => {
      component.filters.category = 'Gym/Sports';
      fixture.detectChanges();

      expect(component.filteredExpenses.length).toBe(0);
      const emptyFilterEl = fixture.nativeElement.querySelector('#expense-filter-empty');
      expect(emptyFilterEl).toBeTruthy();
      expect(emptyFilterEl.textContent).toContain('No expenses match your filters');
    });

    it('should reset all filters when clearFilters is called', () => {
      component.searchQuery = 'team';
      component.filters.category = 'Dining';
      component.filters.minAmount = 1000;
      component.filters.maxAmount = 5000;
      component.filters.dateFrom = '2026-10-01';
      component.filters.dateTo = '2026-10-31';
      expect(component.hasActiveFilters).toBeTrue();

      component.clearFilters();
      fixture.detectChanges();

      expect(component.hasActiveFilters).toBeFalse();
      expect(component.activeFilterCount).toBe(0);
      expect(component.filteredExpenses.length).toBe(4);
    });

    it('should toggle filter panel visibility when toggle button is clicked', () => {
      expect(component.isFilterPanelOpen).toBeFalse();
      const toggleBtn = fixture.nativeElement.querySelector('#toggle-filter-btn') as HTMLButtonElement;
      expect(toggleBtn).toBeTruthy();

      toggleBtn.click();
      fixture.detectChanges();
      expect(component.isFilterPanelOpen).toBeTrue();
      expect(fixture.nativeElement.querySelector('#expense-filter-panel')).toBeTruthy();

      toggleBtn.click();
      fixture.detectChanges();
      expect(component.isFilterPanelOpen).toBeFalse();
      expect(fixture.nativeElement.querySelector('#expense-filter-panel')).toBeFalsy();
    });
  });
});
