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
    localStorage.clear();
    tracker.clearAllData();
  });

  afterEach(() => {
    localStorage.clear();
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
    expect(args[2]).toMatch(/^Budget October 2026 - \d{2}-[A-Za-z]{3}-\d{2}-\d{2}:\d{2} (AM|PM)\.xlsx$/);
  });

  it('should reflect edited ledger entries in exported excel transactions', async () => {
    tracker.setSelectedMonth('2026-10');
    tracker.addExpense({ date: '2026-10-02', category: 'Groceries', amount: 150, note: 'Initial grocery' });
    tracker.addIncome({ date: '2026-10-01', source: 'Paycheck', amount: 3000, note: 'Initial salary' });

    const exp = tracker.currentMonthExpenses()[0];
    const inc = tracker.currentMonthIncomes()[0];

    // Edit expense: date, category, amount, note
    tracker.updateExpense(exp.id, {
      date: '2026-10-18',
      category: 'Dining',
      amount: 450,
      note: 'Team celebration lunch'
    });

    // Edit income: date, source, amount, note
    tracker.updateIncome(inc.id, {
      date: '2026-10-05',
      source: 'Bonus',
      amount: 5500,
      note: 'Quarterly achievement'
    });

    // Load template XML and run updateTransactionsSheet
    const templateBuffer = await (service as any).getTemplateBuffer();
    const jszipModule = await import('jszip');
    const JSZipClass = (jszipModule as any).default || jszipModule;
    const zip = await JSZipClass.loadAsync(templateBuffer.slice(0));
    const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml')!.async('text');

    const updatedSheet2Xml = (service as any).updateTransactionsSheet(sheet2Xml, '2026-10');

    // Updated expense details should be reflected in the Excel output
    expect(updatedSheet2Xml).toContain('Team celebration lunch');
    expect(updatedSheet2Xml).toContain('Dining');
    expect(updatedSheet2Xml).toContain('<v>450</v>');

    // Updated income details should be reflected in the Excel output
    expect(updatedSheet2Xml).toContain('Quarterly achievement');
    expect(updatedSheet2Xml).toContain('Bonus');
    expect(updatedSheet2Xml).toContain('<v>5500</v>');
  });

  it('should format filename with dynamic budget month and export date/time', () => {
    // 2026-10-17 15:24:00 (3:24 PM)
    const fixedExportDate = new Date(2026, 9, 17, 15, 24, 0);
    const filename = service.generateExportFilename('2026-10', fixedExportDate);
    expect(filename).toBe('Budget October 2026 - 17-Oct-26-03:24 PM.xlsx');

    // Test morning AM time and single-digit day
    const morningDate = new Date(2026, 0, 5, 9, 7, 0); // Jan 05 2026 09:07 AM
    const janFilename = service.generateExportFilename('2026-01', morningDate);
    expect(janFilename).toBe('Budget January 2026 - 05-Jan-26-09:07 AM.xlsx');
  });
});
