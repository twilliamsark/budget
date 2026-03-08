import { Injectable } from '@angular/core';
import { Expense } from '../models';

const CSV_HEADERS = ['Date', 'To', 'From', 'Category', 'Amount', 'Account'] as const;

const INCOME_CSV_HEADERS = ['Date', 'To account', 'Income account', 'Amount', 'Memo'] as const;

export interface IncomeCsvRow {
  date: string;
  toAccountId: string;
  incomeAccountId: string;
  amount: number;
  description: string;
}

const TRANSFER_CSV_HEADERS = ['Date', 'From account', 'To account', 'Amount', 'Memo'] as const;

export interface TransferCsvRow {
  date: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
}

const JOURNAL_CSV_HEADERS = ['EntryId', 'Date', 'Description', 'Account', 'Debit', 'Credit'] as const;

export interface JournalCsvLine {
  entryId: string;
  date: string;
  description: string;
  accountId: string;
  debit: number;
  credit: number;
}

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

  /**
   * Builds a CSV string from income rows. Columns: Date, To account, Income account, Amount, Memo.
   */
  buildIncomeCsv(rows: IncomeCsvRow[]): string {
    const header = INCOME_CSV_HEADERS.join(',');
    const lines = rows.map((r) =>
      [
        this.escapeCsvField(r.date),
        this.escapeCsvField(r.toAccountId),
        this.escapeCsvField(r.incomeAccountId),
        this.escapeCsvField(this.formatAmountPositive(r.amount)),
        this.escapeCsvField(r.description ?? ''),
      ].join(',')
    );
    return [header, ...lines].join('\n');
  }

  /**
   * Exports the given income rows to a CSV file and triggers download.
   */
  exportIncomeToCsv(rows: IncomeCsvRow[], filename: string = 'income.csv'): void {
    const csv = this.buildIncomeCsv(rows);
    this.downloadCsv(csv, filename);
  }

  /**
   * Builds a CSV string from transfer rows. Columns: Date, From account, To account, Amount, Memo.
   */
  buildTransferCsv(rows: TransferCsvRow[]): string {
    const header = TRANSFER_CSV_HEADERS.join(',');
    const lines = rows.map((r) =>
      [
        this.escapeCsvField(r.date),
        this.escapeCsvField(r.fromAccountId),
        this.escapeCsvField(r.toAccountId),
        this.escapeCsvField(this.formatAmountPositive(r.amount)),
        this.escapeCsvField(r.description ?? ''),
      ].join(',')
    );
    return [header, ...lines].join('\n');
  }

  /**
   * Exports the given transfer rows to a CSV file and triggers download.
   */
  exportTransferToCsv(rows: TransferCsvRow[], filename: string = 'transfers.csv'): void {
    const csv = this.buildTransferCsv(rows);
    this.downloadCsv(csv, filename);
  }

  /**
   * Builds a CSV string from journal entry lines. One row per line; EntryId groups lines into one entry.
   */
  buildJournalCsv(lines: JournalCsvLine[]): string {
    const header = JOURNAL_CSV_HEADERS.join(',');
    const rows = lines.map((r) =>
      [
        this.escapeCsvField(r.entryId),
        this.escapeCsvField(r.date),
        this.escapeCsvField(r.description ?? ''),
        this.escapeCsvField(r.accountId),
        this.escapeCsvField(r.debit.toFixed(2)),
        this.escapeCsvField(r.credit.toFixed(2)),
      ].join(',')
    );
    return [header, ...rows].join('\n');
  }

  exportJournalToCsv(lines: JournalCsvLine[], filename: string = 'journal.csv'): void {
    const csv = this.buildJournalCsv(lines);
    this.downloadCsv(csv, filename);
  }

  private formatAmountPositive(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
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
