import { Injectable, inject } from '@angular/core';
import type { Workbook, Worksheet } from 'exceljs';
import { TrackerService } from './tracker.service';

/**
 * Palette constants matching the Budget September 2026 template
 */
const PALETTE = {
  orange: 'FFF46524',      // Raleway title & primary accent
  navy: 'FF334960',        // Deep Slate Navy for banners, table headers
  darkText: 'FF434343',    // Dark Charcoal for category names
  amountText: 'FF576475',  // Medium slate for bold currency amounts
  mutedText: 'FF687887',   // Muted slate-gray for dates & categories
  descText: 'FF556376',    // Description body text
  lightText: 'FFCCCCCC',   // Light gray for dark banner subtitle
  peachFill: 'FFFFF2ED',   // Soft peach highlight for editable input cells
  savingsBox: 'FFEBEDEF',  // Light grayish box for savings callout
  borderHair: 'FFD9D9D9',  // Hairline border
  white: 'FFFFFFFF'
};

const FONTS = {
  header: 'Raleway',
  body: 'Lato'
};

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {
  private readonly tracker = inject(TrackerService);

  /**
   * Generates and downloads a multi-tab .xlsx workbook matching the exact structure,
   * fonts (Raleway & Lato), and colors of "Budget September 2026.xlsx".
   */
  public async exportFinancialReport(): Promise<void> {
    try {
      const [exceljsModule, fileSaverModule] = await Promise.all([
        import('exceljs'),
        import('file-saver')
      ]);

      const ExcelJS = (exceljsModule as any).default || exceljsModule;
      const WorkbookClass = ExcelJS.Workbook || (exceljsModule as any).Workbook;
      const workbook: Workbook = new WorkbookClass();

      const saveAs = (fileSaverModule as any).saveAs ||
        (fileSaverModule as any).default?.saveAs ||
        (fileSaverModule as any).default ||
        fileSaverModule;

      const selectedMonth = this.tracker.selectedMonth();
      const [year, month] = selectedMonth.split('-').map(Number);
      const monthDate = new Date(year, (month || 1) - 1, 1);
      const formattedMonth = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Attempt to load the pre-configured template containing native charts & layout
      let loadedFromTemplate = false;
      try {
        const templateUrl = new URL('templates/budget-template.xlsx', document.baseURI).href;
        const response = await fetch(templateUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          await workbook.xlsx.load(arrayBuffer);
          loadedFromTemplate = true;
        }
      } catch (err) {
        console.warn('Could not fetch template file, building workbook programmatically:', err);
      }

      if (loadedFromTemplate) {
        this.populateTemplateWorkbook(workbook, selectedMonth, formattedMonth);
      } else {
        this.buildProgrammaticWorkbook(workbook, selectedMonth, formattedMonth);
      }

      // Metadata
      workbook.creator = 'Angular Expense & Budget Tracker';
      workbook.lastModifiedBy = 'Angular Expense & Budget Tracker';
      workbook.modified = new Date();

      // Generate binary buffer & trigger client-side download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const filename = `Budget_${formattedMonth.replace(/\s+/g, '_')}.xlsx`;
      this.downloadBlob(saveAs, blob, filename);

      this.tracker.showToast(`Budget for ${formattedMonth} exported successfully!`, 'success');
    } catch (error) {
      console.error('Failed to export Excel report:', error);
      this.tracker.showToast('Failed to export Excel workbook. Please try again.', 'error');
      throw error;
    }
  }

  /**
   * Populates an already-loaded template workbook with current state data.
   */
  private populateTemplateWorkbook(workbook: Workbook, selectedMonth: string, formattedMonth: string): void {
    const summary = workbook.getWorksheet('Summary');
    const transactions = workbook.getWorksheet('Transactions');

    if (!summary || !transactions) {
      this.buildProgrammaticWorkbook(workbook, selectedMonth, formattedMonth);
      return;
    }

    // 1. Update Title in Summary (Cell B8)
    summary.getCell('B8').value = `Monthly Budget - ${formattedMonth}`;

    // 2. Clear old transactions starting from row 6
    const maxExistingRows = Math.max(transactions.rowCount, 150);
    for (let r = 6; r <= maxExistingRows; r++) {
      const row = transactions.getRow(r);
      for (let c = 1; c <= 12; c++) {
        row.getCell(c).value = null;
      }
    }

    // 3. Populate Transactions & Categories
    this.populateTransactionsAndSummary(summary, transactions, selectedMonth);
  }

  /**
   * Fallback: Builds the entire multi-tab workbook programmatically matching the template styling.
   */
  private buildProgrammaticWorkbook(workbook: Workbook, selectedMonth: string, formattedMonth: string): void {
    // Clear any existing sheets
    while (workbook.worksheets.length > 0) {
      workbook.removeWorksheet(workbook.worksheets[0].id);
    }

    // Sheet 1: Summary
    const summary = workbook.addWorksheet('Summary', {
      properties: { tabColor: { argb: PALETTE.orange } },
      views: [{ showGridLines: true }]
    });
    this.setupSummaryColumnsAndHeaders(summary, formattedMonth);

    // Sheet 2: Transactions
    const transactions = workbook.addWorksheet('Transactions', {
      properties: { tabColor: { argb: PALETTE.navy } },
      views: [{ showGridLines: true }]
    });
    this.setupTransactionsColumnsAndHeaders(transactions);

    // Sheet 3: Visualization
    workbook.addWorksheet('Visualization', {
      properties: { tabColor: { argb: PALETTE.orange } },
      views: [{ showGridLines: true }]
    });

    // Populate data
    this.populateTransactionsAndSummary(summary, transactions, selectedMonth);
  }

  /**
   * Sets up column widths, instructions banner, and layout for Summary sheet.
   */
  private setupSummaryColumnsAndHeaders(sheet: Worksheet, formattedMonth: string): void {
    sheet.columns = [
      { width: 6.13 },  // A (Margin)
      { width: 14.0 },  // B (Category)
      { width: 14.0 },  // C (Spacer)
      { width: 12.0 },  // D (Planned)
      { width: 12.0 },  // E (Actual)
      { width: 12.0 },  // F (Diff)
      { width: 6.13 },  // G (Spacer)
      { width: 14.0 },  // H (Category)
      { width: 14.0 },  // I (Spacer)
      { width: 12.0 },  // J (Planned)
      { width: 12.0 },  // K (Actual)
      { width: 12.0 },  // L (Diff)
      { width: 6.13 }   // M (Margin)
    ];

    // Banner: Instructions
    sheet.mergeCells('B2:H2');
    const getStarted = sheet.getCell('B2');
    getStarted.value = 'GET STARTED';
    getStarted.font = { name: FONTS.body, size: 10, bold: true, color: { argb: PALETTE.lightText } };
    getStarted.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.navy } };

    sheet.mergeCells('I2:L2');
    const note = sheet.getCell('I2');
    note.value = 'NOTE';
    note.font = { name: FONTS.body, size: 10, bold: true, color: { argb: PALETTE.lightText } };
    note.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.navy } };

    sheet.mergeCells('B3:G4');
    const instr1 = sheet.getCell('B3');
    instr1.value = "Set your starting balance in cell L8, then customize your categories and planned spending amounts in the 'Income' and 'Expenses' tables below.";
    instr1.font = { name: FONTS.body, size: 9, italic: true, color: { argb: PALETTE.lightText } };
    instr1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.navy } };
    instr1.alignment = { wrapText: true, vertical: 'top' };

    sheet.mergeCells('I3:L3');
    const note1 = sheet.getCell('I3');
    note1.value = 'Only edit highlighted cells.';
    note1.font = { name: FONTS.body, size: 9, italic: true, color: { argb: PALETTE.lightText } };
    note1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.navy } };

    sheet.mergeCells('I4:L5');
    const note2 = sheet.getCell('I4');
    note2.value = 'Try not to alter cells that contain a formula.';
    note2.font = { name: FONTS.body, size: 9, italic: true, color: { argb: PALETTE.lightText } };
    note2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.navy } };

    sheet.mergeCells('B5:G6');
    const instr2 = sheet.getCell('B5');
    instr2.value = "As you enter data in the 'Transactions' tab, this sheet will automatically update to show a summary of your spending for the month.";
    instr2.font = { name: FONTS.body, size: 9, italic: true, color: { argb: PALETTE.lightText } };
    instr2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.navy } };
    instr2.alignment = { wrapText: true, vertical: 'top' };

    // Row 8: Title & Starting balance
    sheet.mergeCells('B8:E9');
    const titleCell = sheet.getCell('B8');
    titleCell.value = `Monthly Budget - ${formattedMonth}`;
    titleCell.font = { name: FONTS.header, size: 24, bold: true, color: { argb: PALETTE.orange } };
    titleCell.alignment = { vertical: 'middle' };

    sheet.mergeCells('J8:K8');
    const sbLabel = sheet.getCell('J8');
    sbLabel.value = 'Starting balance: ';
    sbLabel.font = { name: FONTS.body, size: 10, bold: true, color: { argb: PALETTE.navy } };
    sbLabel.alignment = { horizontal: 'right', vertical: 'middle' };

    const sbVal = sheet.getCell('L8');
    sbVal.value = 0;
    sbVal.numFmt = '[$₹]#,##0';
    sbVal.font = { name: FONTS.body, size: 10, color: { argb: PALETTE.navy } };
    sbVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.peachFill } };
    sbVal.alignment = { horizontal: 'right', vertical: 'middle' };

    // KPI Cards
    sheet.getCell('D16').value = 'START BALANCE  ';
    sheet.getCell('D16').font = { name: FONTS.body, size: 13, bold: true, color: { argb: PALETTE.navy } };
    sheet.getCell('D17').value = { formula: 'if(isblank(L8),0,L8)', result: 0 };
    sheet.getCell('D17').numFmt = '[$₹]#,##0';
    sheet.getCell('D17').font = { name: FONTS.body, size: 11, color: { argb: PALETTE.amountText } };

    sheet.getCell('E16').value = ' END BALANCE';
    sheet.getCell('E16').font = { name: FONTS.body, size: 13, bold: true, color: { argb: PALETTE.orange } };
    sheet.getCell('E17').value = { formula: 'D17+(I22-C22)', result: 0 };
    sheet.getCell('E17').numFmt = '[$₹]#,##0';
    sheet.getCell('E17').font = { name: FONTS.body, size: 11, bold: true, color: { argb: PALETTE.orange } };

    sheet.mergeCells('I13:K13');
    sheet.mergeCells('I14:K14');
    sheet.mergeCells('I15:K15');
    sheet.mergeCells('I16:K16');

    const savPct = sheet.getCell('I13');
    savPct.value = { formula: 'iferror(E17/D17-1, "")', result: 0 };
    savPct.numFmt = '+#,#%;-#,#%;0%';
    savPct.font = { name: FONTS.body, size: 20, color: { argb: PALETTE.navy } };
    savPct.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.savingsBox } };
    savPct.alignment = { horizontal: 'center' };

    const savStatus = sheet.getCell('I14');
    savStatus.value = { formula: 'if(I13 < 0, "Decrease in total savings", "Increase in total savings")', result: 'Increase in total savings' };
    savStatus.font = { name: FONTS.body, size: 9.5, color: { argb: PALETTE.amountText } };
    savStatus.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.savingsBox } };
    savStatus.alignment = { horizontal: 'center' };

    const savAmt = sheet.getCell('I15');
    savAmt.value = { formula: 'iferror(E17-D17, 0)', result: 0 };
    savAmt.numFmt = '[$₹]#,##0';
    savAmt.font = { name: FONTS.body, size: 22, bold: true, color: { argb: PALETTE.navy } };
    savAmt.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.savingsBox } };
    savAmt.alignment = { horizontal: 'center' };

    const savDesc = sheet.getCell('I16');
    savDesc.value = { formula: 'if(J15<0, "Spent this month", "Saved this month")', result: 'Saved this month' };
    savDesc.font = { name: FONTS.body, size: 9.5, color: { argb: PALETTE.amountText } };
    savDesc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.savingsBox } };
    savDesc.alignment = { horizontal: 'center' };

    // Rows 20-22: Planned vs Actual bars
    sheet.mergeCells('B20:F20');
    sheet.getCell('B20').value = 'Expenses';
    sheet.getCell('B20').font = { name: FONTS.body, size: 13, bold: true, color: { argb: PALETTE.navy } };

    sheet.getCell('B21').value = 'Planned';
    sheet.getCell('B21').font = { name: FONTS.body, size: 10, bold: true, color: { argb: PALETTE.amountText } };
    sheet.getCell('C21').value = { formula: 'D26', result: 0 };
    sheet.getCell('C21').numFmt = '[$₹]#,##0';
    sheet.getCell('C21').font = { name: FONTS.body, size: 10, color: { argb: PALETTE.amountText } };

    sheet.getCell('B22').value = 'Actual';
    sheet.getCell('B22').font = { name: FONTS.body, size: 10, bold: true, color: { argb: PALETTE.navy } };
    sheet.getCell('C22').value = { formula: 'E26', result: 0 };
    sheet.getCell('C22').numFmt = '[$₹]#,##0';
    sheet.getCell('C22').font = { name: FONTS.body, size: 10, color: { argb: PALETTE.navy } };

    sheet.getCell('H20').value = 'Income';
    sheet.getCell('H20').font = { name: FONTS.body, size: 13, bold: true, color: { argb: PALETTE.navy } };

    sheet.getCell('H21').value = 'Planned';
    sheet.getCell('H21').font = { name: FONTS.body, size: 10, bold: true, color: { argb: PALETTE.amountText } };
    sheet.getCell('I21').value = { formula: 'J26', result: 0 };
    sheet.getCell('I21').numFmt = '[$₹]#,##0';
    sheet.getCell('I21').font = { name: FONTS.body, size: 10, color: { argb: PALETTE.amountText } };

    sheet.getCell('H22').value = 'Actual';
    sheet.getCell('H22').font = { name: FONTS.body, size: 10, bold: true, color: { argb: PALETTE.navy } };
    sheet.getCell('I22').value = { formula: 'K26', result: 0 };
    sheet.getCell('I22').numFmt = '[$₹]#,##0';
    sheet.getCell('I22').font = { name: FONTS.body, size: 10, color: { argb: PALETTE.navy } };

    // Tables Header on Row 24
    sheet.mergeCells('B24:C24');
    sheet.getCell('B24').value = 'Expenses';
    sheet.getCell('B24').font = { name: FONTS.header, size: 16, bold: true, color: { argb: PALETTE.orange } };

    sheet.getCell('D25').value = 'Planned';
    sheet.getCell('D25').font = { name: FONTS.body, size: 10.5, bold: true, color: { argb: PALETTE.navy } };
    sheet.getCell('D25').alignment = { horizontal: 'right' };

    sheet.getCell('E25').value = 'Actual';
    sheet.getCell('E25').font = { name: FONTS.body, size: 10.5, bold: true, color: { argb: PALETTE.navy } };
    sheet.getCell('E25').alignment = { horizontal: 'right' };

    sheet.getCell('F25').value = 'Diff.';
    sheet.getCell('F25').font = { name: FONTS.body, size: 10.5, bold: true, color: { argb: PALETTE.navy } };
    sheet.getCell('F25').alignment = { horizontal: 'right' };

    sheet.getCell('H24').value = 'Income';
    sheet.getCell('H24').font = { name: FONTS.header, size: 16, bold: true, color: { argb: PALETTE.orange } };

    sheet.getCell('J25').value = 'Planned';
    sheet.getCell('J25').font = { name: FONTS.body, size: 10.5, bold: true, color: { argb: PALETTE.navy } };
    sheet.getCell('J25').alignment = { horizontal: 'right' };

    sheet.getCell('K25').value = 'Actual';
    sheet.getCell('K25').font = { name: FONTS.body, size: 10.5, bold: true, color: { argb: PALETTE.navy } };
    sheet.getCell('K25').alignment = { horizontal: 'right' };

    sheet.getCell('L25').value = 'Diff.';
    sheet.getCell('L25').font = { name: FONTS.body, size: 10.5, bold: true, color: { argb: PALETTE.navy } };
    sheet.getCell('L25').alignment = { horizontal: 'right' };

    // Totals Row 26
    sheet.getCell('B26').value = 'Totals';
    sheet.getCell('B26').font = { name: FONTS.body, size: 9.5, bold: true, color: { argb: PALETTE.mutedText } };

    sheet.getCell('H26').value = 'Totals';
    sheet.getCell('H26').font = { name: FONTS.body, size: 9.5, bold: true, color: { argb: PALETTE.mutedText } };
  }

  /**
   * Sets up column widths, instructions banner, and column headers for Transactions sheet.
   */
  private setupTransactionsColumnsAndHeaders(sheet: Worksheet): void {
    sheet.columns = [
      { width: 5.13 },  // A (Margin)
      { width: 14.0 },  // B (Date)
      { width: 5.13 },  // C (Spacer)
      { width: 12.0 },  // D (Amount)
      { width: 32.0 },  // E (Description)
      { width: 18.0 },  // F (Category)
      { width: 5.13 },  // G (Divider)
      { width: 14.0 },  // H (Date)
      { width: 12.0 },  // I (Amount)
      { width: 22.0 },  // J (Description)
      { width: 18.0 },  // K (Category)
      { width: 5.13 }   // L (Margin)
    ];

    // Banner: Instructions
    sheet.mergeCells('B1:K1');
    const banner = sheet.getCell('B1');
    banner.value = 'Change or add categories by updating the Expenses and Income tables in the Summary sheet.';
    banner.font = { name: FONTS.body, size: 9.5, italic: true, color: { argb: PALETTE.lightText } };
    banner.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.navy } };
    banner.alignment = { horizontal: 'center', vertical: 'middle' };

    // Row 2: Table Section Titles
    sheet.getCell('B2').value = 'Expenses';
    sheet.getCell('B2').font = { name: FONTS.header, size: 18, bold: true, color: { argb: PALETTE.orange } };

    sheet.getCell('H2').value = 'Income';
    sheet.getCell('H2').font = { name: FONTS.header, size: 18, bold: true, color: { argb: PALETTE.orange } };

    // Row 4: Column Headers
    const headers = [
      { cell: 'B4', text: 'Date', align: 'left' },
      { cell: 'D4', text: 'Amount', align: 'right' },
      { cell: 'E4', text: 'Description', align: 'left' },
      { cell: 'F4', text: 'Category', align: 'left' },
      { cell: 'H4', text: 'Date', align: 'left' },
      { cell: 'I4', text: 'Amount', align: 'right' },
      { cell: 'J4', text: 'Description', align: 'left' },
      { cell: 'K4', text: 'Category', align: 'left' }
    ];

    for (const h of headers) {
      const c = sheet.getCell(h.cell);
      c.value = h.text;
      c.font = { name: FONTS.body, size: 10.5, bold: true, color: { argb: PALETTE.navy } };
      c.alignment = { horizontal: h.align as any, vertical: 'middle' };
    }
  }

  /**
   * Populates all user categories, budgets, and transactions into Summary & Transactions sheets.
   */
  private populateTransactionsAndSummary(summary: Worksheet, transactions: Worksheet, selectedMonth: string): void {
    const rawExpenses = this.tracker.expenses().filter(e => e.month === selectedMonth);
    const rawIncomes = this.tracker.incomes().filter(i => i.month === selectedMonth);
    const rawBudgets = this.tracker.budgets().filter(b => b.month === selectedMonth);

    // Sort chronologically
    const expenses = [...rawExpenses].sort((a, b) => a.date.localeCompare(b.date));
    const incomes = [...rawIncomes].sort((a, b) => a.date.localeCompare(b.date));

    // Calculate actuals by expense category
    const actualExpenseByCat = new Map<string, number>();
    for (const exp of expenses) {
      const cat = exp.category.trim();
      actualExpenseByCat.set(cat, (actualExpenseByCat.get(cat) || 0) + Number(exp.amount));
    }

    // Calculate actuals by income category
    const actualIncomeByCat = new Map<string, number>();
    for (const inc of incomes) {
      const cat = inc.source.trim();
      actualIncomeByCat.set(cat, (actualIncomeByCat.get(cat) || 0) + Number(inc.amount));
    }

    // Build consolidated unique list of expense categories
    const budgetMap = new Map<string, number>();
    for (const b of rawBudgets) {
      budgetMap.set(b.category.trim(), Number(b.plannedAmount) || 0);
    }

    // Standard categories aligned with Budget September 2026.xlsx template rows:
    // Rows 28-41: Groceries, Dining, Healthcare, Rent, Insurance, Petrol,
    // Subscriptions, Transportation, Personal, Utilities, Shopping, Gifts/Donation, Other, Gym/Sports
    // Followed by Entertainment and any user-defined categories.
    const standardCategories: string[] = [
      'Groceries',
      'Dining',
      'Healthcare',
      'Rent',
      'Insurance',
      'Petrol',
      'Subscriptions',
      'Transportation',
      'Personal',
      'Utilities',
      'Shopping',
      'Gifts/Donation',
      'Other',
      'Gym/Sports',
      'Entertainment'
    ];

    const getCategoryAmount = (categoryName: string, amountMap: Map<string, number>): number => {
      if (amountMap.has(categoryName)) {
        return amountMap.get(categoryName) || 0;
      }
      const targetLower = categoryName.trim().toLowerCase();
      for (const [key, val] of amountMap.entries()) {
        const keyLower = key.trim().toLowerCase();
        if (keyLower === targetLower) return val;
        if ((keyLower === 'dining' || keyLower === 'dineout') && (targetLower === 'dining' || targetLower === 'dineout')) return val;
        if ((keyLower === 'healthcare' || keyLower === 'health/medical') && (targetLower === 'healthcare' || targetLower === 'health/medical')) return val;
        if ((keyLower === 'rent' || keyLower === 'home rent') && (targetLower === 'rent' || targetLower === 'home rent')) return val;
        if ((keyLower === 'transportation' || keyLower === 'travel/transportation') && (targetLower === 'transportation' || targetLower === 'travel/transportation')) return val;
      }
      return 0;
    };

    const userCategories = Array.from(new Set([
      ...Array.from(budgetMap.keys()),
      ...Array.from(actualExpenseByCat.keys())
    ])).filter(c => {
      const cLower = c.trim().toLowerCase();
      return !standardCategories.some(s => {
        const sLower = s.toLowerCase();
        if (sLower === cLower) return true;
        if ((sLower === 'dining' || sLower === 'dineout') && (cLower === 'dining' || cLower === 'dineout')) return true;
        if ((sLower === 'healthcare' || sLower === 'health/medical') && (cLower === 'healthcare' || cLower === 'health/medical')) return true;
        if ((sLower === 'rent' || sLower === 'home rent') && (cLower === 'rent' || cLower === 'home rent')) return true;
        if ((sLower === 'transportation' || sLower === 'travel/transportation') && (cLower === 'transportation' || cLower === 'travel/transportation')) return true;
        return false;
      });
    });

    const allExpenseCategories = [
      ...standardCategories,
      ...userCategories
    ];

    // Build consolidated unique list of income categories
    const allIncomeCategories = Array.from(new Set([
      'Paycheck', 'Bonus', 'Interest', 'Savings', 'Other',
      ...Array.from(actualIncomeByCat.keys())
    ])).filter(c => !!c);

    // Hairline border
    const hairBorder = {
      top: { style: 'hair' as const, color: { argb: PALETTE.borderHair } },
      bottom: { style: 'hair' as const, color: { argb: PALETTE.borderHair } }
    };

    // 1. Populate Transactions sheet starting at Row 6
    const maxEntries = Math.max(expenses.length, incomes.length);
    for (let i = 0; i < maxEntries; i++) {
      const r = 6 + i;
      const row = transactions.getRow(r);
      row.height = 19.5;

      // Expenses on left (Cols B, D, E, F)
      if (i < expenses.length) {
        const exp = expenses[i];

        const dCell = row.getCell('B');
        dCell.value = new Date(exp.date + 'T00:00:00.000Z');
        dCell.numFmt = 'd"-"mmm"-"yyyy';
        dCell.font = { name: FONTS.body, size: 10, color: { argb: PALETTE.mutedText } };
        dCell.border = hairBorder;

        const aCell = row.getCell('D');
        aCell.value = Number(exp.amount);
        aCell.numFmt = '[$₹]#,##0';
        aCell.font = { name: FONTS.body, size: 10, bold: true, color: { argb: PALETTE.amountText } };
        aCell.alignment = { horizontal: 'right', vertical: 'bottom' };
        aCell.border = hairBorder;

        const descCell = row.getCell('E');
        descCell.value = exp.note || '-';
        descCell.font = { name: FONTS.body, size: 10, color: { argb: PALETTE.descText } };
        descCell.border = hairBorder;

        const catCell = row.getCell('F');
        catCell.value = exp.category;
        catCell.font = { name: FONTS.body, size: 10, color: { argb: PALETTE.mutedText } };
        catCell.border = hairBorder;
      }

      // Incomes on right (Cols H, I, J, K)
      if (i < incomes.length) {
        const inc = incomes[i];

        const dCell = row.getCell('H');
        dCell.value = new Date(inc.date + 'T00:00:00.000Z');
        dCell.numFmt = 'd"-"mmm"-"yyyy';
        dCell.font = { name: FONTS.body, size: 10, color: { argb: PALETTE.mutedText } };
        dCell.border = hairBorder;

        const aCell = row.getCell('I');
        aCell.value = Number(inc.amount);
        aCell.numFmt = '[$₹]#,##0';
        aCell.font = { name: FONTS.body, size: 10, bold: true, color: { argb: PALETTE.amountText } };
        aCell.alignment = { horizontal: 'right', vertical: 'bottom' };
        aCell.border = hairBorder;

        const descCell = row.getCell('J');
        descCell.value = inc.note || '-';
        descCell.font = { name: FONTS.body, size: 10, color: { argb: PALETTE.amountText } };
        descCell.border = hairBorder;

        const catCell = row.getCell('K');
        catCell.value = inc.source;
        catCell.font = { name: FONTS.body, size: 10, color: { argb: PALETTE.mutedText } };
        catCell.border = hairBorder;
      }
    }

    // 2. Populate Expense Categories in Summary (Rows 28 to 44)
    let totalPlannedExpenses = 0;
    let totalActualExpenses = 0;

    for (let idx = 0; idx < 17; idx++) {
      const r = 28 + idx;
      const cat = allExpenseCategories[idx];

      const bCell = summary.getCell(`B${r}`);
      const dCell = summary.getCell(`D${r}`);
      const eCell = summary.getCell(`E${r}`);
      const fCell = summary.getCell(`F${r}`);

      if (cat) {
        const planned = getCategoryAmount(cat, budgetMap);
        const actual = getCategoryAmount(cat, actualExpenseByCat);
        totalPlannedExpenses += planned;
        totalActualExpenses += actual;

        bCell.value = cat;
        bCell.font = { name: FONTS.body, size: 10, bold: true, color: { argb: PALETTE.darkText } };

        dCell.value = planned;
        dCell.numFmt = '[$₹]#,##0';
        dCell.font = { name: FONTS.body, size: 10, color: { argb: PALETTE.darkText } };
        dCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.peachFill } };
        dCell.alignment = { horizontal: 'right' };

        eCell.value = {
          formula: `if(isblank($B${r}), "", sumif(Transactions!$F:$F,$B${r},Transactions!$D:$D))`,
          result: actual
        };
        eCell.numFmt = '[$₹]#,##0';
        eCell.font = { name: FONTS.body, size: 10, color: { argb: PALETTE.darkText } };
        eCell.alignment = { horizontal: 'right' };

        fCell.value = {
          formula: `if(isblank($B${r}), "", D${r}-E${r})`,
          result: planned - actual
        };
        fCell.numFmt = '[$₹]#,##0';
        fCell.font = { name: FONTS.body, size: 10, color: { argb: PALETTE.mutedText } };
        fCell.alignment = { horizontal: 'right' };
      } else {
        bCell.value = '';
        dCell.value = null;
        dCell.fill = { type: 'pattern', pattern: 'none' };
        eCell.value = {
          formula: `if(isblank($B${r}), "", sumif(Transactions!$F:$F,$B${r},Transactions!$D:$D))`,
          result: undefined
        };
        fCell.value = {
          formula: `if(isblank($B${r}), "", D${r}-E${r})`,
          result: undefined
        };
      }
    }

    // 3. Populate Income Categories in Summary (Rows 28 to 42)
    let totalPlannedIncome = 0;
    let totalActualIncome = 0;

    for (let idx = 0; idx < 15; idx++) {
      const r = 28 + idx;
      const cat = allIncomeCategories[idx];

      const hCell = summary.getCell(`H${r}`);
      const jCell = summary.getCell(`J${r}`);
      const kCell = summary.getCell(`K${r}`);
      const lCell = summary.getCell(`L${r}`);

      if (cat) {
        const actual = actualIncomeByCat.get(cat) || 0;
        const planned = (cat.toLowerCase() === 'paycheck' && actual > 0) ? actual : 0;
        totalPlannedIncome += planned;
        totalActualIncome += actual;

        hCell.value = cat;
        hCell.font = { name: FONTS.body, size: 10, bold: true, color: { argb: PALETTE.darkText } };

        jCell.value = planned;
        jCell.numFmt = '[$₹]#,##0';
        jCell.font = { name: FONTS.body, size: 10, color: { argb: PALETTE.darkText } };
        jCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PALETTE.peachFill } };
        jCell.alignment = { horizontal: 'right' };

        kCell.value = {
          formula: `if(isblank($H${r}), "", sumif(Transactions!$K:$K,$H${r},Transactions!$I:$I))`,
          result: actual
        };
        kCell.numFmt = '[$₹]#,##0';
        kCell.font = { name: FONTS.body, size: 10, color: { argb: PALETTE.darkText } };
        kCell.alignment = { horizontal: 'right' };

        lCell.value = {
          formula: `if(isblank($H${r}), "", K${r}-J${r})`,
          result: actual - planned
        };
        lCell.numFmt = '[$₹]#,##0';
        lCell.font = { name: FONTS.body, size: 10, color: { argb: PALETTE.mutedText } };
        lCell.alignment = { horizontal: 'right' };
      } else {
        hCell.value = '';
        jCell.value = null;
        jCell.fill = { type: 'pattern', pattern: 'none' };
        kCell.value = {
          formula: `if(isblank($H${r}), "", sumif(Transactions!$K:$K,$H${r},Transactions!$I:$I))`,
          result: undefined
        };
        lCell.value = {
          formula: `if(isblank($H${r}), "", K${r}-J${r})`,
          result: undefined
        };
      }
    }

    // 4. Update Summary Totals on Row 26
    summary.getCell('D26').value = { formula: 'sum(D27:D44)', result: totalPlannedExpenses };
    summary.getCell('D26').numFmt = '[$₹]#,##0';
    summary.getCell('D26').font = { name: FONTS.body, size: 9.5, bold: true, color: { argb: PALETTE.mutedText } };
    summary.getCell('D26').alignment = { horizontal: 'right' };

    summary.getCell('E26').value = { formula: 'sum(E27:E44)', result: totalActualExpenses };
    summary.getCell('E26').numFmt = '[$₹]#,##0';
    summary.getCell('E26').font = { name: FONTS.body, size: 9.5, bold: true, color: { argb: PALETTE.mutedText } };
    summary.getCell('E26').alignment = { horizontal: 'right' };

    summary.getCell('F26').value = { formula: 'sum(F27:F44)', result: totalPlannedExpenses - totalActualExpenses };
    summary.getCell('F26').numFmt = '[$₹]#,##0';
    summary.getCell('F26').font = { name: FONTS.body, size: 9.5, bold: true, color: { argb: PALETTE.mutedText } };
    summary.getCell('F26').alignment = { horizontal: 'right' };

    summary.getCell('J26').value = { formula: 'sum(J27:J42)', result: totalPlannedIncome };
    summary.getCell('J26').numFmt = '[$₹]#,##0';
    summary.getCell('J26').font = { name: FONTS.body, size: 9.5, bold: true, color: { argb: PALETTE.mutedText } };
    summary.getCell('J26').alignment = { horizontal: 'right' };

    summary.getCell('K26').value = { formula: 'sum(K27:K42)', result: totalActualIncome };
    summary.getCell('K26').numFmt = '[$₹]#,##0';
    summary.getCell('K26').font = { name: FONTS.body, size: 9.5, bold: true, color: { argb: PALETTE.mutedText } };
    summary.getCell('K26').alignment = { horizontal: 'right' };

    summary.getCell('L26').value = { formula: 'sum(L27:L42)', result: totalActualIncome - totalPlannedIncome };
    summary.getCell('L26').numFmt = '[$₹]#,##0';
    summary.getCell('L26').font = { name: FONTS.body, size: 9.5, bold: true, color: { argb: PALETTE.mutedText } };
    summary.getCell('L26').alignment = { horizontal: 'right' };

    // 5. Update KPI Cards & Top Bars
    summary.getCell('C21').value = { formula: 'D26', result: totalPlannedExpenses };
    summary.getCell('C22').value = { formula: 'E26', result: totalActualExpenses };
    summary.getCell('I21').value = { formula: 'J26', result: totalPlannedIncome };
    summary.getCell('I22').value = { formula: 'K26', result: totalActualIncome };

    const startingBalance = Number(summary.getCell('L8').value) || 0;
    const netSavings = totalActualIncome - totalActualExpenses;
    const endBalance = startingBalance + netSavings;

    summary.getCell('D17').value = { formula: 'if(isblank(L8),0,L8)', result: startingBalance };
    summary.getCell('E17').value = { formula: 'D17+(I22-C22)', result: endBalance };

    summary.getCell('I15').value = { formula: 'iferror(E17-D17, 0)', result: netSavings };
    summary.getCell('I16').value = {
      formula: 'if(J15<0, "Spent this month", "Saved this month")',
      result: netSavings >= 0 ? 'Saved this month' : 'Spent this month'
    };

    summary.getCell('I13').value = {
      formula: 'iferror(E17/D17-1, "")',
      result: startingBalance > 0 ? (netSavings / startingBalance) : 0
    };
    summary.getCell('I14').value = {
      formula: 'if(I13 < 0, "Decrease in total savings", "Increase in total savings")',
      result: netSavings < 0 ? 'Decrease in total savings' : 'Increase in total savings'
    };
  }

  /**
   * Browser file download helper
   */
  private downloadBlob(saveAsFn: any, blob: Blob, fileName: string): void {
    try {
      if (typeof saveAsFn === 'function') {
        saveAsFn(blob, fileName);
        return;
      }
    } catch {
      // Fallback
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
