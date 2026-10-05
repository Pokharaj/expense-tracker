import { Injectable, inject } from '@angular/core';
import type { Workbook } from 'exceljs';
import { TrackerService } from './tracker.service';
import { ThemeService } from './theme.service';

@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {
  private readonly tracker = inject(TrackerService);
  private readonly themeService = inject(ThemeService);

  /**
   * Generates and downloads a multi-tab, professionally styled .xlsx workbook
   * with embedded chart analytics, KPI summaries, and detailed financial ledgers.
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

      workbook.creator = 'Angular Expense & Budget Tracker';
      workbook.lastModifiedBy = 'Angular Expense & Budget Tracker';
      workbook.created = new Date();
      workbook.modified = new Date();

      const selectedMonth = this.tracker.selectedMonth();
      const isDark = this.themeService.isDarkMode();

      // 1. Tab 1: Overview & Analytics
      await this.buildOverviewSheet(workbook, selectedMonth, isDark);

      // 2. Tab 2: Income Log
      this.buildIncomeSheet(workbook);

      // 3. Tab 3: Budget Planner
      this.buildBudgetSheet(workbook);

      // 4. Tab 4: Expense Ledger
      this.buildExpenseSheet(workbook);

      // Generate buffer and trigger browser download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const todayStr = new Date().toISOString().slice(0, 10);
      const filename = `Expense_Tracker_Report_${selectedMonth}_${todayStr}.xlsx`;

      this.downloadBlob(saveAs, blob, filename);

      this.tracker.showToast('Financial report exported successfully!', 'success');
    } catch (error) {
      console.error('Failed to export Excel report:', error);
      this.tracker.showToast('Failed to export Excel workbook. Please try again.', 'error');
      throw error;
    }
  }

  /**
   * Native file download trigger with file-saver & anchor fallback
   */
  private downloadBlob(saveAsFn: any, blob: Blob, fileName: string): void {
    try {
      if (typeof saveAsFn === 'function') {
        saveAsFn(blob, fileName);
        return;
      }
    } catch (e) {
      // Fallback to DOM anchor tag
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

  /**
   * Builds Tab 1: Overview & Analytics (Executive KPIs, Budget Matrix, and Embedded Charts)
   */
  private async buildOverviewSheet(workbook: Workbook, selectedMonth: string, isDark: boolean): Promise<void> {
    const sheet = workbook.addWorksheet('Overview & Analytics', {
      properties: { tabColor: { argb: 'FF4338CA' } },
      views: [{ showGridLines: true }]
    });

    // Set Column Widths
    sheet.columns = [
      { width: 24 }, // A: Metric / Category
      { width: 20 }, // B: Value / Planned
      { width: 20 }, // C: Actual
      { width: 20 }, // D: Variance
      { width: 16 }, // E: % Used
      { width: 16 }, // F: Status
      { width: 14 }  // G: Spacer
    ];

    // --- Row 1-2: Title Header Banner ---
    sheet.mergeCells('A1:F2');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'EXPENSE & BUDGET TRACKER — EXECUTIVE SUMMARY';
    titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E1B4B' } // Deep Navy / Indigo
    };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // --- Row 3: Metadata Row ---
    sheet.mergeCells('A3:F3');
    const metaCell = sheet.getCell('A3');
    const now = new Date();
    metaCell.value = `Reporting Period: ${selectedMonth}   |   Exported: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}   |   Currency: INR (₹)`;
    metaCell.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF64748B' } };
    metaCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }
    };
    metaCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // --- Row 5: KPI Section Header ---
    sheet.mergeCells('A5:F5');
    const kpiHeader = sheet.getCell('A5');
    kpiHeader.value = '1. MONTHLY KEY PERFORMANCE INDICATORS (KPIs)';
    kpiHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    kpiHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF312E81' } // Darker Indigo
    };
    kpiHeader.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    // KPI Rows: Inflow, Budget, Outflow, Net Savings, Savings Rate
    const totalInflow = this.tracker.totalInflow();
    const totalBudget = this.tracker.totalBudget();
    const actualOutflow = this.tracker.actualOutflow();
    const netSavings = this.tracker.netSavings();
    const savingsRate = totalInflow > 0 ? (netSavings / totalInflow) : 0;

    const kpiData = [
      { label: 'Total Inflow (Revenue)', value: totalInflow, format: '"₹"#,##0.00', bg: 'FFECFDF5', fg: 'FF065F46' },
      { label: 'Total Budget (Planned)', value: totalBudget, format: '"₹"#,##0.00', bg: 'FFF5F3FF', fg: 'FF5B21B6' },
      { label: 'Actual Outflow (Spent)', value: actualOutflow, format: '"₹"#,##0.00', bg: 'FFFFFBEB', fg: 'FF92400E' },
      { label: 'Net Savings (Balance)', value: netSavings, format: '"₹"#,##0.00', bg: netSavings >= 0 ? 'FFECFDF5' : 'FFFFF1F2', fg: netSavings >= 0 ? 'FF047857' : 'FFBE123C' },
      { label: 'Monthly Savings Rate', value: savingsRate, format: '0.0%', bg: savingsRate >= 0 ? 'FFEFF6FF' : 'FFFFF1F2', fg: savingsRate >= 0 ? 'FF1E40AF' : 'FFBE123C' }
    ];

    let rowIdx = 6;
    for (const kpi of kpiData) {
      sheet.mergeCells(`A${rowIdx}:C${rowIdx}`);
      const lCell = sheet.getCell(`A${rowIdx}`);
      lCell.value = kpi.label;
      lCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
      lCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      lCell.border = this.getThinBorder();

      sheet.mergeCells(`D${rowIdx}:F${rowIdx}`);
      const vCell = sheet.getCell(`D${rowIdx}`);
      vCell.value = kpi.value;
      vCell.numFmt = kpi.format;
      vCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: kpi.fg } };
      vCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: kpi.bg }
      };
      vCell.alignment = { horizontal: 'right', vertical: 'middle' };
      vCell.border = this.getThinBorder();

      rowIdx++;
    }

    // --- Row idx + 1: Budget Performance Section Header ---
    rowIdx++;
    sheet.mergeCells(`A${rowIdx}:F${rowIdx}`);
    const bpHeader = sheet.getCell(`A${rowIdx}`);
    bpHeader.value = '2. BUDGET VS. ACTUAL OUTFLOW PERFORMANCE';
    bpHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    bpHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF312E81' }
    };
    bpHeader.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    // Performance Table Column Headers
    rowIdx++;
    const headers = ['Category', 'Planned Limit (₹)', 'Actual Spent (₹)', 'Remaining (₹)', 'Utilized (%)', 'Status'];
    const colLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

    headers.forEach((h, i) => {
      const cell = sheet.getCell(`${colLetters[i]}${rowIdx}`);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' } // Indigo-600
      };
      cell.alignment = {
        horizontal: i === 0 ? 'left' : (i === 5 ? 'center' : 'right'),
        vertical: 'middle'
      };
      cell.border = this.getThinBorder();
    });

    const comparisonData = this.tracker.budgetComparison();
    const dataStartRow = rowIdx + 1;

    if (comparisonData.length === 0) {
      rowIdx++;
      sheet.mergeCells(`A${rowIdx}:F${rowIdx}`);
      const emptyCell = sheet.getCell(`A${rowIdx}`);
      emptyCell.value = 'No budget or expense allocations recorded for this month.';
      emptyCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
      emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
      emptyCell.border = this.getThinBorder();
    } else {
      for (const row of comparisonData) {
        rowIdx++;
        const zebraBg = (rowIdx % 2 === 0) ? 'FFFFFFFF' : 'FFF8FAFC';

        // A: Category
        const cCell = sheet.getCell(`A${rowIdx}`);
        cCell.value = row.category + (row.isUnplanned ? ' (Unplanned)' : '');
        cCell.font = { name: 'Calibri', size: 10, bold: false, color: { argb: 'FF0F172A' } };
        cCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        cCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        cCell.border = this.getThinBorder();

        // B: Planned Amount
        const pCell = sheet.getCell(`B${rowIdx}`);
        pCell.value = row.plannedAmount;
        pCell.numFmt = '"₹"#,##0.00';
        pCell.font = { name: 'Calibri', size: 10 };
        pCell.alignment = { horizontal: 'right', vertical: 'middle' };
        pCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        pCell.border = this.getThinBorder();

        // C: Actual Amount
        const aCell = sheet.getCell(`C${rowIdx}`);
        aCell.value = row.actualAmount;
        aCell.numFmt = '"₹"#,##0.00';
        aCell.font = { name: 'Calibri', size: 10 };
        aCell.alignment = { horizontal: 'right', vertical: 'middle' };
        aCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        aCell.border = this.getThinBorder();

        // D: Remaining (Formula)
        const rCell = sheet.getCell(`D${rowIdx}`);
        rCell.value = { formula: `B${rowIdx}-C${rowIdx}`, result: row.remainingAmount };
        rCell.numFmt = '"₹"#,##0.00;[Red]-"₹"#,##0.00;"₹0.00"';
        rCell.font = { name: 'Calibri', size: 10, color: { argb: row.remainingAmount < 0 ? 'FFBE123C' : 'FF047857' } };
        rCell.alignment = { horizontal: 'right', vertical: 'middle' };
        rCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        rCell.border = this.getThinBorder();

        // E: Utilized % (Formula)
        const uCell = sheet.getCell(`E${rowIdx}`);
        uCell.value = { formula: `IF(B${rowIdx}>0, C${rowIdx}/B${rowIdx}, 1)`, result: (row.percentUsed / 100) };
        uCell.numFmt = '0.0%';
        uCell.font = { name: 'Calibri', size: 10 };
        uCell.alignment = { horizontal: 'right', vertical: 'middle' };
        uCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        uCell.border = this.getThinBorder();

        // F: Status Badge
        const sCell = sheet.getCell(`F${rowIdx}`);
        sCell.value = row.status;
        const isOver = row.status === 'Over Budget';
        sCell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: isOver ? 'FF9F1239' : 'FF065F46' } };
        sCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isOver ? 'FFFFE4E6' : 'FFD1FAE5' }
        };
        sCell.alignment = { horizontal: 'center', vertical: 'middle' };
        sCell.border = this.getThinBorder();
      }

      // Summary Total Row
      rowIdx++;
      const dataEndRow = rowIdx - 1;

      const totLabel = sheet.getCell(`A${rowIdx}`);
      totLabel.value = 'Total Monthly Portfolio';
      totLabel.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF1E1B4B' } };
      totLabel.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      totLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      totLabel.border = this.getTotalBorder();

      const totPlan = sheet.getCell(`B${rowIdx}`);
      totPlan.value = { formula: `SUM(B${dataStartRow}:B${dataEndRow})`, result: totalBudget };
      totPlan.numFmt = '"₹"#,##0.00';
      totPlan.font = { name: 'Calibri', size: 10.5, bold: true };
      totPlan.alignment = { horizontal: 'right', vertical: 'middle' };
      totPlan.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      totPlan.border = this.getTotalBorder();

      const totAct = sheet.getCell(`C${rowIdx}`);
      totAct.value = { formula: `SUM(C${dataStartRow}:C${dataEndRow})`, result: actualOutflow };
      totAct.numFmt = '"₹"#,##0.00';
      totAct.font = { name: 'Calibri', size: 10.5, bold: true };
      totAct.alignment = { horizontal: 'right', vertical: 'middle' };
      totAct.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      totAct.border = this.getTotalBorder();

      const totRem = sheet.getCell(`D${rowIdx}`);
      totRem.value = { formula: `SUM(D${dataStartRow}:D${dataEndRow})`, result: totalBudget - actualOutflow };
      totRem.numFmt = '"₹"#,##0.00;[Red]-"₹"#,##0.00;"₹0.00"';
      totRem.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: (totalBudget - actualOutflow) < 0 ? 'FFBE123C' : 'FF047857' } };
      totRem.alignment = { horizontal: 'right', vertical: 'middle' };
      totRem.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      totRem.border = this.getTotalBorder();

      const totUtil = sheet.getCell(`E${rowIdx}`);
      totUtil.value = { formula: `IF(B${rowIdx}>0, C${rowIdx}/B${rowIdx}, 0)`, result: totalBudget > 0 ? (actualOutflow / totalBudget) : 0 };
      totUtil.numFmt = '0.0%';
      totUtil.font = { name: 'Calibri', size: 10.5, bold: true };
      totUtil.alignment = { horizontal: 'right', vertical: 'middle' };
      totUtil.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      totUtil.border = this.getTotalBorder();

      const totStatus = sheet.getCell(`F${rowIdx}`);
      const overallOver = actualOutflow > totalBudget;
      totStatus.value = overallOver ? 'Over Budget' : 'On Track';
      totStatus.font = { name: 'Calibri', size: 10, bold: true, color: { argb: overallOver ? 'FF9F1239' : 'FF065F46' } };
      totStatus.alignment = { horizontal: 'center', vertical: 'middle' };
      totStatus.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      totStatus.border = this.getTotalBorder();
    }

    // --- Embedded Chart Snapshots ---
    rowIdx += 2;
    sheet.mergeCells(`A${rowIdx}:F${rowIdx}`);
    const chartHeader = sheet.getCell(`A${rowIdx}`);
    chartHeader.value = '3. VISUAL ANALYTICS SNAPSHOTS (EMBEDDED CHARTS)';
    chartHeader.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    chartHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF312E81' }
    };
    chartHeader.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

    rowIdx++;
    const chartPlacementRow = rowIdx;

    // Capture Bar Chart Canvas
    const barCanvas = document.getElementById('bar-chart-canvas') as HTMLCanvasElement | null;
    if (barCanvas) {
      try {
        const barImgBase64 = this.renderCanvasWithBackground(barCanvas, isDark);
        const barImageId = workbook.addImage({
          base64: barImgBase64,
          extension: 'png'
        });

        sheet.addImage(barImageId, {
          tl: { col: 0, row: chartPlacementRow },
          ext: { width: 520, height: 260 }
        });
      } catch (err) {
        console.warn('Failed to embed bar chart snapshot:', err);
      }
    }

    // Capture Doughnut Chart Canvas
    const pieCanvas = document.getElementById('doughnut-chart-canvas') as HTMLCanvasElement | null;
    if (pieCanvas) {
      try {
        const pieImgBase64 = this.renderCanvasWithBackground(pieCanvas, isDark);
        const pieImageId = workbook.addImage({
          base64: pieImgBase64,
          extension: 'png'
        });

        // Place doughnut chart below bar chart or adjacent
        sheet.addImage(pieImageId, {
          tl: { col: 0, row: chartPlacementRow + 15 },
          ext: { width: 520, height: 260 }
        });
      } catch (err) {
        console.warn('Failed to embed doughnut chart snapshot:', err);
      }
    }
  }

  /**
   * Builds Tab 2: Detailed Income Log
   */
  private buildIncomeSheet(workbook: Workbook): void {
    const sheet = workbook.addWorksheet('Income Log', {
      properties: { tabColor: { argb: 'FF059669' } },
      views: [{ showGridLines: true }]
    });

    sheet.columns = [
      { width: 16 }, // A: Date
      { width: 22 }, // B: Source
      { width: 20 }, // C: Amount (₹)
      { width: 16 }, // D: Month
      { width: 30 }  // E: Notes / ID
    ];

    // Banner Header
    sheet.mergeCells('A1:E1');
    const header = sheet.getCell('A1');
    header.value = 'INCOME & REVENUE LEDGER';
    header.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } }; // Dark Emerald
    header.alignment = { horizontal: 'center', vertical: 'middle' };

    // Column Headers
    const headers = ['Date', 'Source', 'Amount (₹)', 'Reporting Month', 'Entry ID / Reference'];
    const colLetters = ['A', 'B', 'C', 'D', 'E'];

    headers.forEach((h, i) => {
      const cell = sheet.getCell(`${colLetters[i]}2`);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
      cell.alignment = { horizontal: i === 2 ? 'right' : 'left', vertical: 'middle', indent: i === 2 ? 0 : 1 };
      cell.border = this.getThinBorder();
    });

    const incomes = this.tracker.incomes();
    let rowIdx = 2;

    if (incomes.length === 0) {
      rowIdx++;
      sheet.mergeCells(`A${rowIdx}:E${rowIdx}`);
      const emptyCell = sheet.getCell(`A${rowIdx}`);
      emptyCell.value = 'No income records found.';
      emptyCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
      emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
      emptyCell.border = this.getThinBorder();
    } else {
      const dataStartRow = 3;
      for (const item of incomes) {
        rowIdx++;
        const zebraBg = (rowIdx % 2 === 0) ? 'FFFFFFFF' : 'FFF8FAFC';

        const dCell = sheet.getCell(`A${rowIdx}`);
        dCell.value = item.date;
        dCell.font = { name: 'Calibri', size: 10 };
        dCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        dCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        dCell.border = this.getThinBorder();

        const sCell = sheet.getCell(`B${rowIdx}`);
        sCell.value = item.source;
        sCell.font = { name: 'Calibri', size: 10, bold: true };
        sCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        sCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        sCell.border = this.getThinBorder();

        const aCell = sheet.getCell(`C${rowIdx}`);
        aCell.value = Number(item.amount);
        aCell.numFmt = '"₹"#,##0.00';
        aCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF065F46' } };
        aCell.alignment = { horizontal: 'right', vertical: 'middle' };
        aCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        aCell.border = this.getThinBorder();

        const mCell = sheet.getCell(`D${rowIdx}`);
        mCell.value = item.month;
        mCell.font = { name: 'Calibri', size: 10, color: { argb: 'FF64748B' } };
        mCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        mCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        mCell.border = this.getThinBorder();

        const idCell = sheet.getCell(`E${rowIdx}`);
        idCell.value = item.note || item.id;
        idCell.font = { name: 'Calibri', size: 9, color: { argb: 'FF94A3B8' } };
        idCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        idCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        idCell.border = this.getThinBorder();
      }

      // Total Row
      rowIdx++;
      const dataEndRow = rowIdx - 1;

      sheet.mergeCells(`A${rowIdx}:B${rowIdx}`);
      const tLabel = sheet.getCell(`A${rowIdx}`);
      tLabel.value = 'Total Cumulative Inflow';
      tLabel.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF065F46' } };
      tLabel.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      tLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
      tLabel.border = this.getTotalBorder();

      const tAmt = sheet.getCell(`C${rowIdx}`);
      tAmt.value = { formula: `SUM(C${dataStartRow}:C${dataEndRow})` };
      tAmt.numFmt = '"₹"#,##0.00';
      tAmt.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF065F46' } };
      tAmt.alignment = { horizontal: 'right', vertical: 'middle' };
      tAmt.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
      tAmt.border = this.getTotalBorder();

      sheet.mergeCells(`D${rowIdx}:E${rowIdx}`);
      const tSpacer = sheet.getCell(`D${rowIdx}`);
      tSpacer.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECFDF5' } };
      tSpacer.border = this.getTotalBorder();
    }
  }

  /**
   * Builds Tab 3: Detailed Monthly Budget Allocations
   */
  private buildBudgetSheet(workbook: Workbook): void {
    const sheet = workbook.addWorksheet('Budget Planner', {
      properties: { tabColor: { argb: 'FF7C3AED' } },
      views: [{ showGridLines: true }]
    });

    sheet.columns = [
      { width: 16 }, // A: Month
      { width: 24 }, // B: Category
      { width: 22 }, // C: Planned Allocation (₹)
      { width: 26 }  // D: Allocation ID
    ];

    sheet.mergeCells('A1:D1');
    const header = sheet.getCell('A1');
    header.value = 'MONTHLY BUDGET ALLOCATIONS';
    header.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5B21B6' } };
    header.alignment = { horizontal: 'center', vertical: 'middle' };

    const headers = ['Reporting Month', 'Category', 'Planned Limit (₹)', 'Budget Allocation ID'];
    const colLetters = ['A', 'B', 'C', 'D'];

    headers.forEach((h, i) => {
      const cell = sheet.getCell(`${colLetters[i]}2`);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
      cell.alignment = { horizontal: i === 2 ? 'right' : 'left', vertical: 'middle', indent: i === 2 ? 0 : 1 };
      cell.border = this.getThinBorder();
    });

    const budgets = this.tracker.budgets();
    let rowIdx = 2;

    if (budgets.length === 0) {
      rowIdx++;
      sheet.mergeCells(`A${rowIdx}:D${rowIdx}`);
      const emptyCell = sheet.getCell(`A${rowIdx}`);
      emptyCell.value = 'No budget limits configured.';
      emptyCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
      emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
      emptyCell.border = this.getThinBorder();
    } else {
      const dataStartRow = 3;
      for (const item of budgets) {
        rowIdx++;
        const zebraBg = (rowIdx % 2 === 0) ? 'FFFFFFFF' : 'FFF8FAFC';

        const mCell = sheet.getCell(`A${rowIdx}`);
        mCell.value = item.month;
        mCell.font = { name: 'Calibri', size: 10 };
        mCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        mCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        mCell.border = this.getThinBorder();

        const cCell = sheet.getCell(`B${rowIdx}`);
        cCell.value = item.category;
        cCell.font = { name: 'Calibri', size: 10, bold: true };
        cCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        cCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        cCell.border = this.getThinBorder();

        const aCell = sheet.getCell(`C${rowIdx}`);
        aCell.value = Number(item.plannedAmount);
        aCell.numFmt = '"₹"#,##0.00';
        aCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF5B21B6' } };
        aCell.alignment = { horizontal: 'right', vertical: 'middle' };
        aCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        aCell.border = this.getThinBorder();

        const idCell = sheet.getCell(`D${rowIdx}`);
        idCell.value = item.id;
        idCell.font = { name: 'Calibri', size: 9, color: { argb: 'FF94A3B8' } };
        idCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        idCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        idCell.border = this.getThinBorder();
      }

      // Total Row
      rowIdx++;
      const dataEndRow = rowIdx - 1;

      sheet.mergeCells(`A${rowIdx}:B${rowIdx}`);
      const tLabel = sheet.getCell(`A${rowIdx}`);
      tLabel.value = 'Total Configured Budgets';
      tLabel.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF5B21B6' } };
      tLabel.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      tLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F3FF' } };
      tLabel.border = this.getTotalBorder();

      const tAmt = sheet.getCell(`C${rowIdx}`);
      tAmt.value = { formula: `SUM(C${dataStartRow}:C${dataEndRow})` };
      tAmt.numFmt = '"₹"#,##0.00';
      tAmt.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF5B21B6' } };
      tAmt.alignment = { horizontal: 'right', vertical: 'middle' };
      tAmt.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F3FF' } };
      tAmt.border = this.getTotalBorder();

      const tSpacer = sheet.getCell(`D${rowIdx}`);
      tSpacer.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F3FF' } };
      tSpacer.border = this.getTotalBorder();
    }
  }

  /**
   * Builds Tab 4: Detailed Expense Ledger
   */
  private buildExpenseSheet(workbook: Workbook): void {
    const sheet = workbook.addWorksheet('Expense Ledger', {
      properties: { tabColor: { argb: 'FFD97706' } },
      views: [{ showGridLines: true }]
    });

    sheet.columns = [
      { width: 16 }, // A: Date
      { width: 22 }, // B: Category
      { width: 20 }, // C: Amount (₹)
      { width: 32 }, // D: Description / Note
      { width: 16 }, // E: Month
      { width: 24 }  // F: Expense ID
    ];

    sheet.mergeCells('A1:F1');
    const header = sheet.getCell('A1');
    header.value = 'DAILY EXPENSE TRANSACTION LEDGER';
    header.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92400E' } };
    header.alignment = { horizontal: 'center', vertical: 'middle' };

    const headers = ['Date', 'Category', 'Amount (₹)', 'Description / Note', 'Reporting Month', 'Expense ID'];
    const colLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

    headers.forEach((h, i) => {
      const cell = sheet.getCell(`${colLetters[i]}2`);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } };
      cell.alignment = { horizontal: i === 2 ? 'right' : 'left', vertical: 'middle', indent: i === 2 ? 0 : 1 };
      cell.border = this.getThinBorder();
    });

    const expenses = this.tracker.expenses();
    let rowIdx = 2;

    if (expenses.length === 0) {
      rowIdx++;
      sheet.mergeCells(`A${rowIdx}:F${rowIdx}`);
      const emptyCell = sheet.getCell(`A${rowIdx}`);
      emptyCell.value = 'No expenses logged.';
      emptyCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF94A3B8' } };
      emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
      emptyCell.border = this.getThinBorder();
    } else {
      const dataStartRow = 3;
      for (const item of expenses) {
        rowIdx++;
        const zebraBg = (rowIdx % 2 === 0) ? 'FFFFFFFF' : 'FFF8FAFC';

        const dCell = sheet.getCell(`A${rowIdx}`);
        dCell.value = item.date;
        dCell.font = { name: 'Calibri', size: 10 };
        dCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        dCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        dCell.border = this.getThinBorder();

        const cCell = sheet.getCell(`B${rowIdx}`);
        cCell.value = item.category;
        cCell.font = { name: 'Calibri', size: 10, bold: true };
        cCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        cCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        cCell.border = this.getThinBorder();

        const aCell = sheet.getCell(`C${rowIdx}`);
        aCell.value = Number(item.amount);
        aCell.numFmt = '"₹"#,##0.00';
        aCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFB45309' } };
        aCell.alignment = { horizontal: 'right', vertical: 'middle' };
        aCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        aCell.border = this.getThinBorder();

        const nCell = sheet.getCell(`D${rowIdx}`);
        nCell.value = item.note || '-';
        nCell.font = { name: 'Calibri', size: 10 };
        nCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        nCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        nCell.border = this.getThinBorder();

        const mCell = sheet.getCell(`E${rowIdx}`);
        mCell.value = item.month;
        mCell.font = { name: 'Calibri', size: 10, color: { argb: 'FF64748B' } };
        mCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        mCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        mCell.border = this.getThinBorder();

        const idCell = sheet.getCell(`F${rowIdx}`);
        idCell.value = item.id;
        idCell.font = { name: 'Calibri', size: 9, color: { argb: 'FF94A3B8' } };
        idCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
        idCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebraBg } };
        idCell.border = this.getThinBorder();
      }

      // Total Row
      rowIdx++;
      const dataEndRow = rowIdx - 1;

      sheet.mergeCells(`A${rowIdx}:B${rowIdx}`);
      const tLabel = sheet.getCell(`A${rowIdx}`);
      tLabel.value = 'Total Cumulative Expenditure';
      tLabel.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF92400E' } };
      tLabel.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      tLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
      tLabel.border = this.getTotalBorder();

      const tAmt = sheet.getCell(`C${rowIdx}`);
      tAmt.value = { formula: `SUM(C${dataStartRow}:C${dataEndRow})` };
      tAmt.numFmt = '"₹"#,##0.00';
      tAmt.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF92400E' } };
      tAmt.alignment = { horizontal: 'right', vertical: 'middle' };
      tAmt.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
      tAmt.border = this.getTotalBorder();

      sheet.mergeCells(`D${rowIdx}:F${rowIdx}`);
      const tSpacer = sheet.getCell(`D${rowIdx}`);
      tSpacer.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
      tSpacer.border = this.getTotalBorder();
    }
  }

  /**
   * Renders the given canvas onto an offscreen canvas with a high-contrast solid background
   * ensuring crystal-clear readability when embedded into Excel.
   */
  private renderCanvasWithBackground(sourceCanvas: HTMLCanvasElement, isDark: boolean): string {
    const offscreen = document.createElement('canvas');
    offscreen.width = sourceCanvas.width;
    offscreen.height = sourceCanvas.height;
    const ctx = offscreen.getContext('2d');

    if (!ctx) {
      return sourceCanvas.toDataURL('image/png');
    }

    // Fill with high-contrast card background
    ctx.fillStyle = isDark ? '#0F172A' : '#FFFFFF';
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);

    // Draw the chart canvas over it
    ctx.drawImage(sourceCanvas, 0, 0);

    // Add a subtle border
    ctx.strokeStyle = isDark ? '#334155' : '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, offscreen.width - 2, offscreen.height - 2);

    return offscreen.toDataURL('image/png');
  }

  private getThinBorder() {
    return {
      top: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } }
    };
  }

  private getTotalBorder() {
    return {
      top: { style: 'thin' as const, color: { argb: 'FF94A3B8' } },
      bottom: { style: 'double' as const, color: { argb: 'FF334155' } },
      left: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } }
    };
  }
}
