import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionFormsComponent } from './transaction-forms.component';
import { TrackerService } from '../../services/tracker.service';

describe('TransactionFormsComponent', () => {
  let component: TransactionFormsComponent;
  let fixture: ComponentFixture<TransactionFormsComponent>;
  let tracker: TrackerService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TransactionFormsComponent],
      providers: [TrackerService]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionFormsComponent);
    component = fixture.componentInstance;
    tracker = TestBed.inject(TrackerService);
    tracker.clearAllData();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should render income note/description input field', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const noteInput = compiled.querySelector('#income-note') as HTMLInputElement;
    expect(noteInput).toBeTruthy();
    expect(noteInput.placeholder).toContain('October Salary');
  });

  it('should log income with note/description and clear form', () => {
    component.incomeData.date = '2026-10-10';
    component.incomeData.source = 'Bonus';
    component.incomeData.amount = 12000;
    component.incomeData.note = 'Annual bonus';

    component.submitIncome();

    const incomes = tracker.currentMonthIncomes();
    expect(incomes.length).toBe(1);
    expect(incomes[0].amount).toBe(12000);
    expect(incomes[0].source).toBe('Bonus');
    expect(incomes[0].note).toBe('Annual bonus');

    // Note and amount should reset after submission
    expect(component.incomeData.amount).toBeNull();
    expect(component.incomeData.note).toBe('');
  });
});
