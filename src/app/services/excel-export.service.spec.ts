import { TestBed } from '@angular/core/testing';
import { ExcelExportService } from './excel-export.service';
import { TrackerService } from './tracker.service';

describe('ExcelExportService', () => {
  let service: ExcelExportService;
  let tracker: TrackerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExcelExportService, TrackerService]
    });
    service = TestBed.inject(ExcelExportService);
    tracker = TestBed.inject(TrackerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have exportFinancialReport method', () => {
    expect(typeof service.exportFinancialReport).toBe('function');
  });

  it('should handle template update logic for Summary and Transactions', async () => {
    tracker.setSelectedMonth('2026-10');
    tracker.addBudget({ category: 'Groceries', plannedAmount: 500 });
    tracker.addExpense({ date: '2026-10-02', category: 'Groceries', amount: 150, note: 'Weekly shopping' });
    tracker.addIncome({ date: '2026-10-01', source: 'Paycheck', amount: 3000, note: 'Salary' });

    // Mock download to avoid opening file download dialog in test runner
    const downloadSpy = spyOn<any>(service, 'downloadBlob').and.stub();

    // Trigger export
    await service.exportFinancialReport();

    expect(downloadSpy).toHaveBeenCalled();
    const args = downloadSpy.calls.mostRecent().args;
    expect(args[2]).toContain('Budget_October_2026.xlsx');
  });
});
