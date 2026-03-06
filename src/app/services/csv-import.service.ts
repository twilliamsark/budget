import { Injectable } from '@angular/core';
import { parse } from 'csv-parse/browser/esm/sync';
import { Expense, Category, Account } from '../models';

export interface ImportResult {
  expenses: Expense[];
  categories: Category[];
  accounts: Account[];
}

interface CsvRow {
  Date?: string;
  To?: string;
  Category?: string;
  Amount?: string;
  Account?: string;
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
      const date = row.Date?.trim() ?? '';
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

      expenses.push({
        id: crypto.randomUUID(),
        date,
        to,
        category,
        amount,
        account,
      });
    }

    const categories: Category[] = [...categorySet].sort().map((id) => ({ id }));
    const accounts: Account[] = [...accountSet].sort().map((id) => ({ id }));

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
}
