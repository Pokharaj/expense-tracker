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
});
