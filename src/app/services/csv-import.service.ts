import { Injectable } from '@angular/core';
import { parse } from 'csv-parse/browser/esm/sync';
import { formatToMMDDYY } from '../utils/date-range';
import { Expense, Category, Account, AccountType } from '../models';

export interface ImportResult {
  expenses: Expense[];
  categories: Category[];
  accounts: Account[];
}

/** Parsed row from CSV without id or possibleDuplicate (for merge import). */
export interface ParsedExpenseRow {
  date: string;
  to: string;
  from: string;
  category: string;
  amount: number;
  account: string;
}

/** Parsed income row from CSV for import. */
export interface ParsedIncomeRow {
  date: string;
  toAccountId: string;
  incomeAccountId: string;
  amount: number;
  description: string;
}

/** Parsed transfer row from CSV for import. */
export interface ParsedTransferRow {
  date: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description: string;
}

const DEFAULT_FROM = 'Todd W';

interface CsvRow {
  Date?: string;
  To?: string;
  From?: string;
  Category?: string;
  Amount?: string;
  Account?: string;
}

interface IncomeCsvRow {
  Date?: string;
  'To account'?: string;
  'Income account'?: string;
  Amount?: string;
  Memo?: string;
}

interface TransferCsvRow {
  Date?: string;
  'From account'?: string;
  'To account'?: string;
  Amount?: string;
  Memo?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CsvImportService {
  /**
   * Parses a CSV file and returns expenses with extracted categories and accounts.
   * Expects columns: Date, To, Category, Amount, Account.
   */
  async importCsv(file: File): Promise<ImportResult> {
    const csvText = await this.readFileAsText(file);
    const rows = parse<CsvRow>(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const categorySet = new Set<string>();
    const accountSet = new Set<string>();
    const expenses: Expense[] = [];

    for (const row of rows) {
      const rawDate = row.Date?.trim() ?? '';
      const to = row.To?.trim() ?? '';
      const category = row.Category?.trim() ?? '';
      const amountStr = row.Amount?.trim() ?? '';
      const account = row.Account?.trim() ?? '';

      // Skip empty/summary rows
      if (!to && !category && !account) {
        continue;
      }

      const amount = this.parseAmount(amountStr);
      if (Number.isNaN(amount)) {
        continue;
      }

      if (category) categorySet.add(category);
      if (account) accountSet.add(account);

      const from = (row.From?.trim() || DEFAULT_FROM);
      const date = formatToMMDDYY(rawDate);

      expenses.push({
        id: crypto.randomUUID(),
        date,
        to,
        category,
        amount,
        account,
        from,
      });
    }

    const categories: Category[] = [...categorySet].sort().map((id) => ({ id }));
    const accounts: Account[] = [...accountSet].sort().map((id) => ({ id, type: 'asset' as AccountType }));

    return { expenses, categories, accounts };
  }

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  private parseAmount(value: string): number {
    const cleaned = value.replace(/[$,]/g, '').trim();
    return parseFloat(cleaned) || 0;
  }

  /**
   * Parses a CSV file to expense rows (no id). Used for merge import.
   * Columns: Date, To, From (optional), Category, Amount, Account.
   */
  async parseCsvToExpenseRows(file: File): Promise<ParsedExpenseRow[]> {
    const csvText = await this.readFileAsText(file);
    const rows = parse<CsvRow>(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const result: ParsedExpenseRow[] = [];

    for (const row of rows) {
      const rawDate = row.Date?.trim() ?? '';
      const to = row.To?.trim() ?? '';
      const category = row.Category?.trim() ?? '';
      const amountStr = row.Amount?.trim() ?? '';
      const account = row.Account?.trim() ?? '';

      if (!to && !category && !account) continue;

      const amount = this.parseAmount(amountStr);
      if (Number.isNaN(amount)) continue;

      const from = row.From?.trim() || DEFAULT_FROM;
      const date = formatToMMDDYY(rawDate);

      result.push({ date, to, from, category, amount, account });
    }

    return result;
  }

  /**
   * Parses a CSV file to income rows for import.
   * Columns: Date, To account, Income account, Amount, Memo (optional).
   */
  async parseCsvToIncomeRows(file: File): Promise<ParsedIncomeRow[]> {
    const csvText = await this.readFileAsText(file);
    const rows = parse<IncomeCsvRow>(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const result: ParsedIncomeRow[] = [];

    for (const row of rows) {
      const rawDate = row.Date?.trim() ?? '';
      const toAccountId = (row['To account'] ?? '').trim();
      const incomeAccountId = (row['Income account'] ?? '').trim();
      const amountStr = row.Amount?.trim() ?? '';
      const description = (row.Memo ?? '').trim();

      if (!toAccountId || !incomeAccountId) continue;

      const amount = this.parseAmount(amountStr);
      if (Number.isNaN(amount) || amount <= 0) continue;

      const date = formatToMMDDYY(rawDate);

      result.push({
        date,
        toAccountId,
        incomeAccountId,
        amount,
        description,
      });
    }

    return result;
  }

  /**
   * Parses a CSV file to transfer rows for import.
   * Columns: Date, From account, To account, Amount, Memo (optional).
   */
  async parseCsvToTransferRows(file: File): Promise<ParsedTransferRow[]> {
    const csvText = await this.readFileAsText(file);
    const rows = parse<TransferCsvRow>(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const result: ParsedTransferRow[] = [];

    for (const row of rows) {
      const rawDate = row.Date?.trim() ?? '';
      const fromAccountId = (row['From account'] ?? '').trim();
      const toAccountId = (row['To account'] ?? '').trim();
      const amountStr = row.Amount?.trim() ?? '';
      const description = (row.Memo ?? '').trim();

      if (!fromAccountId || !toAccountId) continue;
      if (fromAccountId === toAccountId) continue;

      const amount = this.parseAmount(amountStr);
      if (Number.isNaN(amount) || amount <= 0) continue;

      const date = formatToMMDDYY(rawDate);

      result.push({
        date,
        fromAccountId,
        toAccountId,
        amount,
        description,
      });
    }

    return result;
  }
}
