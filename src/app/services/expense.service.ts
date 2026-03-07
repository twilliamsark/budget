import { Injectable, inject, computed, signal } from '@angular/core';
import { Expense } from '../models';
import { CsvImportService } from './csv-import.service';
import { LedgerService } from './ledger.service';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private readonly csvImport = inject(CsvImportService);
  private readonly ledger = inject(LedgerService);

  readonly expenses = this.ledger.expenseView;
  readonly categories = computed(() => {
    this.ledger.accounts();
    return this.ledger.getCategories();
  });
  readonly accounts = this.ledger.accounts;
  readonly hasData = this.ledger.hasData;

  private readonly loadErrorSignal = signal<string | null>(null);
  readonly error = this.loadErrorSignal.asReadonly();

  initialize(): void {
    this.loadErrorSignal.set(null);
    this.ledger.initialize();
  }

  async importCsv(file: File): Promise<void> {
    this.loadErrorSignal.set(null);
    try {
      const rows = await this.csvImport.parseCsvToExpenseRows(file);
      let existing = this.ledger.expenseView();
      for (const row of rows) {
        const exactMatch = existing.some(
          (e) =>
            e.date === row.date &&
            e.to === row.to &&
            e.from === row.from &&
            e.category === row.category &&
            this.amountEqual(e.amount, row.amount) &&
            e.account === row.account
        );
        if (exactMatch) continue;
        const possibleDup = existing.some(
          (e) =>
            e.date === row.date &&
            e.to === row.to &&
            e.from === row.from &&
            (e.category !== row.category || !this.amountEqual(e.amount, row.amount))
        );
        this.ledger.addExpenseTransaction({
          id: crypto.randomUUID(),
          ...row,
          possibleDuplicate: possibleDup,
        });
        existing = this.ledger.expenseView();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse CSV';
      this.loadErrorSignal.set(message);
    }
  }

  private amountEqual(a: number, b: number): boolean {
    return Math.abs(a - b) < 1e-6;
  }

  loadFromStorage(): void {
    this.ledger.initialize();
  }

  clearAll(): void {
    this.loadErrorSignal.set(null);
    this.ledger.clearAll();
  }

  addExpense(expense: Expense): void {
    this.ledger.addExpenseTransaction(expense);
  }

  updateExpense(expense: Expense): void {
    this.ledger.updateExpenseTransaction(expense);
  }

  markNotDuplicate(expense: Expense): void {
    if (!expense.possibleDuplicate) return;
    this.ledger.updateExpenseTransaction({ ...expense, possibleDuplicate: false });
  }

  deleteExpense(id: string): void {
    this.ledger.deleteTransaction(id);
  }
}
