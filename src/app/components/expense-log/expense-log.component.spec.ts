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

  it('should display hyphen for income without note in ledger table', () => {
    tracker.setSelectedMonth('2026-10');
    tracker.addIncome({
      date: '2026-10-01',
      source: 'Paycheck',
      amount: 70000
    });

    component.activeTab = 'incomes';
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const noteCell = compiled.querySelector('.income-note-cell') as HTMLElement;
    expect(noteCell.textContent?.trim()).toBe('-');
  });
});
