import { Injectable, inject } from '@angular/core';
import { TrackerService } from './tracker.service';

/**
 * Standard expense categories matching the template structure.
 */
const STANDARD_EXPENSE_CATEGORIES: string[] = [
  'Groceries',
  'Dining',
  'Healthcare',
  'Rent',
  'Personal',
  'Utilities',
  'Transportation',
  'Entertainment',
  'Shopping',
  'Subscriptions',
  'Gifts/Donation',
  'Gym/Sports',
  'Other'
];

/**
 * Standard income categories matching the template structure.
 */
const STANDARD_INCOME_CATEGORIES: string[] = [
  'Savings',
  'Paycheck',
  'Bonus',
  'Interest',
  'Other',
  'Freelance'
];

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {
  private readonly tracker = inject(TrackerService);
  private cachedTemplateBuffer: ArrayBuffer | null = null;

  /**
   * Generates and downloads an Excel report by copying the authentic
   * budget-template.xlsx workbook. It updates ONLY the required tabs:
   *  1. Summary tab: Planned & actual expenses and income, totals, and month title.
   *  2. Transactions tab: User expenses and incomes for the selected month.
   *
   * The Visualization tab (Sheet 3), its native Excel charts, styles, colors,
   * fonts (Raleway & Lato), and layouts are 100% preserved identical to the template.
   */
  public async exportFinancialReport(): Promise<void> {
    try {
      const [jszipModule, fileSaverModule] = await Promise.all([
        import('jszip'),
        import('file-saver')
      ]);

      const JSZipClass = (jszipModule as any).default || jszipModule;
      const saveAs =
        (fileSaverModule as any).saveAs ||
        (fileSaverModule as any).default?.saveAs ||
        (fileSaverModule as any).default ||
        fileSaverModule;

      const selectedMonth = this.tracker.selectedMonth();
      const [year, month] = selectedMonth.split('-').map(Number);
      const monthDate = new Date(year, (month || 1) - 1, 1);
      const formattedMonth = monthDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });

      // Load clean template copy
      const templateBuffer = await this.getTemplateBuffer();
      const zip = await JSZipClass.loadAsync(templateBuffer.slice(0));

      const sheet1File = zip.file('xl/worksheets/sheet1.xml');
      const sheet2File = zip.file('xl/worksheets/sheet2.xml');

      if (!sheet1File || !sheet2File) {
        throw new Error('Template is missing required worksheet XML files.');
      }

      // Read current XML for the two tabs we need to modify
      const originalSheet1Xml = await sheet1File.async('text');
      const originalSheet2Xml = await sheet2File.async('text');

      // Update Summary (Sheet 1) and Transactions (Sheet 2)
      // Note: Visualization (Sheet 3), drawings, charts, and styles are left untouched!
      const updatedSheet1Xml = this.updateSummarySheet(originalSheet1Xml, selectedMonth, formattedMonth);
      const updatedSheet2Xml = this.updateTransactionsSheet(originalSheet2Xml, selectedMonth);

      zip.file('xl/worksheets/sheet1.xml', updatedSheet1Xml);
      zip.file('xl/worksheets/sheet2.xml', updatedSheet2Xml);

      // Generate binary package
      const blob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
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
   * Fetches the template buffer with in-memory caching.
   */
  private async getTemplateBuffer(): Promise<ArrayBuffer> {
    if (this.cachedTemplateBuffer) {
      return this.cachedTemplateBuffer;
    }

    const buffer = await this.loadTemplateBuffer();
    this.cachedTemplateBuffer = buffer;
    return buffer;
  }

  /**
   * Loads the template buffer across browser and SSR/testing environments.
   */
  private async loadTemplateBuffer(): Promise<ArrayBuffer> {
    // 1. SSR / Node.js filesystem check
    if (typeof window === 'undefined') {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const resolvedPath = path.resolve(process.cwd(), 'public/templates/budget-template.xlsx');
        if (fs.existsSync(resolvedPath)) {
          const buf = fs.readFileSync(resolvedPath);
          return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
        }
      } catch {
        // Fallback to fetch
      }
    }

    // 2. Browser candidate URLs
    const candidateUrls: string[] = [];
    if (typeof document !== 'undefined' && document.baseURI) {
      candidateUrls.push(new URL('templates/budget-template.xlsx', document.baseURI).href);
    }
    candidateUrls.push('templates/budget-template.xlsx');
    candidateUrls.push('/templates/budget-template.xlsx');
    candidateUrls.push('./templates/budget-template.xlsx');
    candidateUrls.push('/base/public/templates/budget-template.xlsx');

    for (const url of candidateUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          return await response.arrayBuffer();
        }
      } catch {
        // Continue to next candidate
      }
    }

    throw new Error('Unable to load budget-template.xlsx from assets.');
  }

  /**
   * Updates the Summary sheet (sheet1.xml) with:
   * - Selected Month title in cell B8
   * - Planned & actual expenses in rows 28-44
   * - Planned & actual incomes in rows 28-42
   * - Row 26 Totals
   * - KPI & Overview cards
   *
   * All original cell styles, formulas, and layouts are preserved.
   */
  private updateSummarySheet(sheet1: string, selectedMonth: string, formattedMonth: string): string {
    const rawExpenses = this.tracker.expenses().filter(e => e.month === selectedMonth);
    const rawIncomes = this.tracker.incomes().filter(i => i.month === selectedMonth);
    const rawBudgets = this.tracker.budgets().filter(b => b.month === selectedMonth);

    // Compute actuals by expense category
    const actualExpenseByCat = new Map<string, number>();
    for (const exp of rawExpenses) {
      const cat = (exp.category || 'Other').trim().toLowerCase();
      actualExpenseByCat.set(cat, (actualExpenseByCat.get(cat) || 0) + Number(exp.amount));
    }

    // Compute actuals by income source
    const actualIncomeByCat = new Map<string, number>();
    for (const inc of rawIncomes) {
      const src = (inc.source || 'Other').trim().toLowerCase();
      actualIncomeByCat.set(src, (actualIncomeByCat.get(src) || 0) + Number(inc.amount));
    }

    // Planned budgets by category
    const budgetMap = new Map<string, number>();
    for (const b of rawBudgets) {
      const cat = (b.category || '').trim().toLowerCase();
      budgetMap.set(cat, Number(b.plannedAmount) || 0);
    }

    // Discover any user-defined categories not in the standard list
    const customExpCategories: string[] = [];
    for (const b of rawBudgets) {
      const cat = b.category.trim();
      if (cat && !STANDARD_EXPENSE_CATEGORIES.some(s => s.toLowerCase() === cat.toLowerCase())) {
        if (!customExpCategories.some(c => c.toLowerCase() === cat.toLowerCase())) {
          customExpCategories.push(cat);
        }
      }
    }
    for (const e of rawExpenses) {
      const cat = e.category.trim();
      if (cat && !STANDARD_EXPENSE_CATEGORIES.some(s => s.toLowerCase() === cat.toLowerCase())) {
        if (!customExpCategories.some(c => c.toLowerCase() === cat.toLowerCase())) {
          customExpCategories.push(cat);
        }
      }
    }

    const customIncCategories: string[] = [];
    for (const i of rawIncomes) {
      const src = i.source.trim();
      if (src && !STANDARD_INCOME_CATEGORIES.some(s => s.toLowerCase() === src.toLowerCase())) {
        if (!customIncCategories.some(c => c.toLowerCase() === src.toLowerCase())) {
          customIncCategories.push(src);
        }
      }
    }

    const allExpenseCategories = [...STANDARD_EXPENSE_CATEGORIES, ...customExpCategories];
    const allIncomeCategories = [...STANDARD_INCOME_CATEGORIES, ...customIncCategories];

    // 1. Update Title in cell B8
    sheet1 = sheet1.replace(
      /(<c r="B8"[^>]*><is><t>)[^<]*(<\/t><\/is><\/c>)/,
      `$1Monthly Budget - ${this.escapeXml(formattedMonth)}$2`
    );

    let totalPlannedExpenses = 0;
    let totalActualExpenses = 0;
    let totalPlannedIncome = 0;
    let totalActualIncome = 0;

    // 2. Update Table Rows 28 to 44
    for (let r = 28; r <= 44; r++) {
      const rowRegex = new RegExp(`<row r="${r}"[^>]*>[\\s\\S]*?<\\/row>`);
      const rowMatch = sheet1.match(rowRegex);
      if (!rowMatch) continue;

      const originalRowXml = rowMatch[0];
      const sMap = this.extractCellStyles(originalRowXml);

      const expIdx = r - 28;
      const expCat = expIdx < allExpenseCategories.length ? allExpenseCategories[expIdx] : null;

      const incIdx = r - 28;
      const incCat = incIdx < allIncomeCategories.length ? allIncomeCategories[incIdx] : null;

      const plannedExp = expCat ? (budgetMap.get(expCat.toLowerCase()) || 0) : 0;
      const actualExp = expCat ? (actualExpenseByCat.get(expCat.toLowerCase()) || 0) : 0;
      const diffExp = plannedExp - actualExp;

      if (expCat) {
        totalPlannedExpenses += plannedExp;
        totalActualExpenses += actualExp;
      }

      const actualInc = incCat ? (actualIncomeByCat.get(incCat.toLowerCase()) || 0) : 0;
      // Planned income matches actual income for sources that have data, else 0
      const plannedInc = actualInc;
      const diffInc = actualInc - plannedInc;

      if (incCat) {
        totalPlannedIncome += plannedInc;
        totalActualIncome += actualInc;
      }

      // Preserve each cell's style ID from the template
      const sA = sMap['A'] || '142';
      const sB = sMap['B'] || '171';
      const sC = sMap['C'] || '172';
      const sD = sMap['D'] || '140';
      const sE = sMap['E'] || '158';
      const sF = sMap['F'] || '146';
      const sG = sMap['G'] || '149';
      const sH = sMap['H'] || '171';
      const sI = sMap['I'] || '172';
      const sJ = sMap['J'] || '140';
      const sK = sMap['K'] || '158';
      const sL = sMap['L'] || '146';
      const sM = sMap['M'] || '142';

      let cellsXml = `<c r="A${r}" s="${sA}" t="n" />`;

      if (expCat) {
        cellsXml += `<c r="B${r}" s="${sB}" t="inlineStr"><is><t>${this.escapeXml(expCat)}</t></is></c>`;
        cellsXml += `<c r="C${r}" s="${sC}" t="n" />`;
        cellsXml += `<c r="D${r}" s="${sD}" t="n"><v>${plannedExp}</v></c>`;
        cellsXml += `<c r="E${r}" s="${sE}"><f>if(isblank($B${r}), "", sumif(Transactions!$F:$F,$B${r},Transactions!$D:$D))</f><v>${actualExp}</v></c>`;
        cellsXml += `<c r="F${r}" s="${sF}"><f>if(isblank($B${r}), "", D${r}-E${r})</f><v>${diffExp}</v></c>`;
      } else {
        cellsXml += `<c r="B${r}" s="${sB}" t="n" />`;
        cellsXml += `<c r="C${r}" s="${sC}" t="n" />`;
        cellsXml += `<c r="D${r}" s="${sD}" t="n" />`;
        cellsXml += `<c r="E${r}" s="${sE}"><f>if(isblank($B${r}), "", sumif(Transactions!$F:$F,$B${r},Transactions!$D:$D))</f><v /></c>`;
        cellsXml += `<c r="F${r}" s="${sF}"><f>if(isblank($B${r}), "", D${r}-E${r})</f><v /></c>`;
      }

      cellsXml += `<c r="G${r}" s="${sG}" t="n" />`;

      if (incCat) {
        cellsXml += `<c r="H${r}" s="${sH}" t="inlineStr"><is><t>${this.escapeXml(incCat)}</t></is></c>`;
        cellsXml += `<c r="I${r}" s="${sI}" t="n" />`;
        cellsXml += `<c r="J${r}" s="${sJ}" t="n"><v>${plannedInc}</v></c>`;
        cellsXml += `<c r="K${r}" s="${sK}"><f>if(isblank($H${r}), "", sumif(Transactions!$K:$K,$H${r},Transactions!$I:$I))</f><v>${actualInc}</v></c>`;
        cellsXml += `<c r="L${r}" s="${sL}"><f>if(isblank($H${r}), "", K${r}-J${r})</f><v>${diffInc}</v></c>`;
      } else {
        cellsXml += `<c r="H${r}" s="${sH}" t="n" />`;
        cellsXml += `<c r="I${r}" s="${sI}" t="n" />`;
        cellsXml += `<c r="J${r}" s="${sJ}" t="n" />`;
        cellsXml += `<c r="K${r}" s="${sK}"><f>if(isblank($H${r}), "", sumif(Transactions!$K:$K,$H${r},Transactions!$I:$I))</f><v /></c>`;
        cellsXml += `<c r="L${r}" s="${sL}"><f>if(isblank($H${r}), "", K${r}-J${r})</f><v /></c>`;
      }

      cellsXml += `<c r="M${r}" s="${sM}" t="n" />`;

      const newRowXml = `<row r="${r}" ht="18" customHeight="1" s="164">${cellsXml}</row>`;
      sheet1 = sheet1.replace(originalRowXml, newRowXml);
    }

    // 3. Update Row 26 Totals
    const netSavings = totalActualIncome - totalActualExpenses;

    sheet1 = sheet1.replace(
      /<c r="D26"[^>]*><f>[^<]*<\/f><v\s*\/?><\/c>/,
      `<c r="D26" s="125"><f>sum(D27:D44)</f><v>${totalPlannedExpenses}</v></c>`
    );
    sheet1 = sheet1.replace(
      /<c r="E26"[^>]*><f>[^<]*<\/f><v\s*\/?><\/c>/,
      `<c r="E26" s="125"><f>sum(E27:E44)</f><v>${totalActualExpenses}</v></c>`
    );
    sheet1 = sheet1.replace(
      /<c r="F26"[^>]*><f>[^<]*<\/f><v\s*\/?><\/c>/,
      `<c r="F26" s="125"><f>sum(F27:F44)</f><v>${totalPlannedExpenses - totalActualExpenses}</v></c>`
    );
    sheet1 = sheet1.replace(
      /<c r="J26"[^>]*><f>[^<]*<\/f><v\s*\/?><\/c>/,
      `<c r="J26" s="125"><f>sum(J27:J42)</f><v>${totalPlannedIncome}</v></c>`
    );
    sheet1 = sheet1.replace(
      /<c r="K26"[^>]*><f>[^<]*<\/f><v\s*\/?><\/c>/,
      `<c r="K26" s="125"><f>sum(K27:K42)</f><v>${totalActualIncome}</v></c>`
    );
    sheet1 = sheet1.replace(
      /<c r="L26"[^>]*><f>[^<]*<\/f><v\s*\/?><\/c>/,
      `<c r="L26" s="125"><f>sum(L27:L42)</f><v>${totalActualIncome - totalPlannedIncome}</v></c>`
    );

    // 4. Update Overview and KPI values
    sheet1 = sheet1.replace(
      /(<c r="C21"[^>]*><f>D26<\/f>)<v\s*\/?>(<\/c>)/,
      `$1<v>${totalPlannedExpenses}</v>$2`
    );
    sheet1 = sheet1.replace(
      /(<c r="C22"[^>]*><f>E26<\/f>)<v\s*\/?>(<\/c>)/,
      `$1<v>${totalActualExpenses}</v>$2`
    );
    sheet1 = sheet1.replace(
      /(<c r="I21"[^>]*><f>J26<\/f>)<v\s*\/?>(<\/c>)/,
      `$1<v>${totalPlannedIncome}</v>$2`
    );
    sheet1 = sheet1.replace(
      /(<c r="I22"[^>]*><f>K26<\/f>)<v\s*\/?>(<\/c>)/,
      `$1<v>${totalActualIncome}</v>$2`
    );
    sheet1 = sheet1.replace(
      /(<c r="E17"[^>]*><f>[^<]*<\/f>)<v\s*\/?>(<\/c>)/,
      `$1<v>${netSavings}</v>$2`
    );
    sheet1 = sheet1.replace(
      /(<c r="I15"[^>]*><f>[^<]*<\/f>)<v\s*\/?>(<\/c>)/,
      `$1<v>${netSavings}</v>$2`
    );
    sheet1 = sheet1.replace(
      /(<c r="I16"[^>]*><f>[^<]*<\/f>)<v\s*\/?>(<\/c>)/,
      `$1<v>${netSavings >= 0 ? 'Saved this month' : 'Spent this month'}</v>$2`
    );
    sheet1 = sheet1.replace(
      /(<c r="I14"[^>]*><f>[^<]*<\/f>)<v\s*\/?>(<\/c>)/,
      `$1<v>${netSavings < 0 ? 'Decrease in total savings' : 'Increase in total savings'}</v>$2`
    );

    return sheet1;
  }

  /**
   * Updates the Transactions sheet (sheet2.xml) with:
   * - Expenses sorted chronologically in columns B, D, E, F
   * - Incomes sorted chronologically in columns H, I, J, K
   *
   * Preserves table headers (rows 1-5), borders, alternating row fills, and formats.
   */
  private updateTransactionsSheet(sheet2: string, selectedMonth: string): string {
    const rawExpenses = this.tracker.expenses().filter(e => e.month === selectedMonth);
    const rawIncomes = this.tracker.incomes().filter(i => i.month === selectedMonth);

    const expenses = [...rawExpenses].sort((a, b) => a.date.localeCompare(b.date));
    const incomes = [...rawIncomes].sort((a, b) => a.date.localeCompare(b.date));

    const maxEntries = Math.max(expenses.length, incomes.length);
    const maxRows = Math.max(163, 5 + maxEntries);
    const newSheet2Rows: string[] = [];

    for (let r = 6; r <= maxRows; r++) {
      const expIdx = r - 6;
      const incIdx = r - 6;
      const exp = expIdx < expenses.length ? expenses[expIdx] : null;
      const inc = incIdx < incomes.length ? incomes[incIdx] : null;

      let rowXml = `<row r="${r}" ht="19.5" customHeight="1" s="164">`;
      rowXml += `<c r="A${r}" s="142" t="n" />`;

      // Expenses on left
      if (exp) {
        rowXml += `<c r="B${r}" s="42" t="n"><v>${this.toExcelDate(exp.date)}</v></c>`;
        rowXml += `<c r="C${r}" s="42" t="n" />`;
        rowXml += `<c r="D${r}" s="45" t="n"><v>${Number(exp.amount) || 0}</v></c>`;
        rowXml += `<c r="E${r}" s="46" t="inlineStr"><is><t>${this.escapeXml(exp.note || '-')}</t></is></c>`;
        rowXml += `<c r="F${r}" s="55" t="inlineStr"><is><t>${this.escapeXml(exp.category)}</t></is></c>`;
      } else {
        rowXml += `<c r="B${r}" s="42" t="n" />`;
        rowXml += `<c r="C${r}" s="42" t="n" />`;
        rowXml += `<c r="D${r}" s="45" t="n" />`;
        rowXml += `<c r="E${r}" s="46" t="n" />`;
        rowXml += `<c r="F${r}" s="55" t="n" />`;
      }

      rowXml += `<c r="G${r}" s="142" t="n" />`;

      // Incomes on right
      if (inc) {
        rowXml += `<c r="H${r}" s="51" t="n"><v>${this.toExcelDate(inc.date)}</v></c>`;
        rowXml += `<c r="I${r}" s="52" t="n"><v>${Number(inc.amount) || 0}</v></c>`;
        rowXml += `<c r="J${r}" s="58" t="inlineStr"><is><t>${this.escapeXml(inc.note || '-')}</t></is></c>`;
        rowXml += `<c r="K${r}" s="59" t="inlineStr"><is><t>${this.escapeXml(inc.source)}</t></is></c>`;
      } else {
        rowXml += `<c r="H${r}" s="66" t="n" />`;
        rowXml += `<c r="I${r}" s="52" t="n" />`;
        rowXml += `<c r="J${r}" s="58" t="n" />`;
        rowXml += `<c r="K${r}" s="59" t="n" />`;
      }

      rowXml += `<c r="L${r}" s="142" t="n" />`;
      rowXml += `</row>`;
      newSheet2Rows.push(rowXml);
    }

    // Replace rows 6 onwards in sheet2
    sheet2 = sheet2.replace(
      /(<row r="5"[^>]*>[\s\S]*?<\/row>)[\s\S]*?(<\/sheetData>)/,
      `$1${newSheet2Rows.join('')}$2`
    );

    // Update dimension ref if expanded beyond row 163
    if (maxRows > 163) {
      sheet2 = sheet2.replace(
        /<dimension ref="A1:L\d+"\s*\/>/,
        `<dimension ref="A1:L${maxRows}" />`
      );
    }

    return sheet2;
  }

  /**
   * Converts a YYYY-MM-DD date string to an Excel serial date number.
   * Excel 1900 date system epoch starts on 1899-12-30.
   */
  private toExcelDate(dateStr: string | null | undefined): number {
    if (!dateStr) return 46266;
    const d = new Date(dateStr + 'T00:00:00Z');
    if (isNaN(d.getTime())) return 46266;
    const epoch = new Date('1899-12-30T00:00:00Z');
    return Math.round((d.getTime() - epoch.getTime()) / 86400000);
  }

  /**
   * Safely escapes strings for XML attribute or tag content.
   */
  private escapeXml(unsafe: any): string {
    if (unsafe == null) return '';
    return String(unsafe)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Helper to extract style IDs of each column from an existing row XML.
   */
  private extractCellStyles(rowXml: string): Record<string, string> {
    const styles: Record<string, string> = {};
    const matches = rowXml.matchAll(/<c r="([A-Z]+)\d+"(?:[^>]*?s="(\d+)")?/g);
    for (const m of matches) {
      if (m[2]) {
        styles[m[1]] = m[2];
      }
    }
    return styles;
  }

  /**
   * Helper to trigger client-side file download.
   */
  private downloadBlob(saveAsFn: any, blob: Blob, fileName: string): void {
    try {
      if (typeof saveAsFn === 'function') {
        saveAsFn(blob, fileName);
        return;
      }
    } catch {
      // Fallback below
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
