import { Injectable } from '@angular/core';
import { Expense } from '../models';

const CSV_HEADERS = ['Date', 'To', 'From', 'Category', 'Amount', 'Account'] as const;

@Injectable({
  providedIn: 'root',
})
export class CsvExportService {
  /**
   * Builds a CSV string from expenses using the same column names as the expenses table.
   * Amounts are formatted as currency (e.g. -$50.00).
   */
  buildCsv(expenses: Expense[]): string {
    const header = CSV_HEADERS.join(',');
    const rows = expenses.map((e) => this.rowToCsvLine(e));
    return [header, ...rows].join('\n');
  }

  /**
   * Triggers a file download of the given CSV string with the given filename.
   */
  downloadCsv(csv: string, filename: string = 'expenses.csv'): void {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Exports the given expenses to a CSV file and triggers download.
   */
  exportToCsv(expenses: Expense[], filename: string = 'expenses.csv'): void {
    const csv = this.buildCsv(expenses);
    this.downloadCsv(csv, filename);
  }

  private rowToCsvLine(e: Expense): string {
    const amount = this.formatAmount(e.amount);
    return [
      this.escapeCsvField(e.date),
      this.escapeCsvField(e.to),
      this.escapeCsvField(e.from),
      this.escapeCsvField(e.category),
      this.escapeCsvField(amount),
      this.escapeCsvField(e.account),
    ].join(',');
  }

  private formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  private escapeCsvField(value: string): string {
    const s = String(value ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }
}
