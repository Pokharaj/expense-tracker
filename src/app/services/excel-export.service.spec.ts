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

    // Authentic template styles should be used for dates, amounts, descriptions, and alignments
    // Expense date (Col B) should have date style 132 (numFmt: d-mmm-yyyy)
    expect(updatedSheet2Xml).toMatch(/<c r="B6" s="132" t="n"><v>\d+<\/v><\/c>/);
    // Expense amount (Col D) should have currency style 133 (numFmt: [$₹]#,##0, right-aligned)
    expect(updatedSheet2Xml).toMatch(/<c r="D6" s="133" t="n"><v>450<\/v><\/c>/);
    // Expense note (Col E) should have standard Lato style 134 (not right/bottom aligned style 46)
    expect(updatedSheet2Xml).toMatch(/<c r="E6" s="134"/);
    // Income date (Col H) should have date style 136 (numFmt: d-mmm-yyyy, not currency style 51)
    expect(updatedSheet2Xml).toMatch(/<c r="H6" s="136" t="n"><v>\d+<\/v><\/c>/);
    // Income amount (Col I) should have currency style 137 (not center/top aligned style 52)
    expect(updatedSheet2Xml).toMatch(/<c r="I6" s="137" t="n"><v>5500<\/v><\/c>/);
    // Income note (Col J) and category (Col K) should have styles 138 and 139
    expect(updatedSheet2Xml).toMatch(/<c r="J6" s="138"/);
    expect(updatedSheet2Xml).toMatch(/<c r="K6" s="139"/);

    // Rows must not have invalid s="164" attribute
    expect(updatedSheet2Xml).not.toContain('s="164"');
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
