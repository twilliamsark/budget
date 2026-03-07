import { Injectable, inject, signal, computed } from '@angular/core';
import { Expense, Category, Account } from '../models';
import { CsvImportService } from './csv-import.service';
import { ExpenseStorageService } from './expense-storage.service';

@Injectable({
  providedIn: 'root',
})
export class ExpenseService {
  private readonly csvImport = inject(CsvImportService);
  private readonly storage = inject(ExpenseStorageService);

  private readonly expensesSignal = signal<Expense[]>([]);
  private readonly categoriesSignal = signal<Category[]>([]);
  private readonly accountsSignal = signal<Account[]>([]);

  readonly expenses = this.expensesSignal.asReadonly();
  readonly categories = this.categoriesSignal.asReadonly();
  readonly accounts = this.accountsSignal.asReadonly();

  readonly hasData = computed(() => this.expensesSignal().length > 0);

  constructor() {
    this.loadFromStorage();
  }

  private readonly loadError = signal<string | null>(null);
  readonly error = this.loadError.asReadonly();

  /**
   * Loads data from storage. Does not auto-import; user must use Import CSV.
   */
  initialize(): void {
    this.loadError.set(null);
    this.loadFromStorage();
  }

  /**
   * Imports expenses from a CSV file. Merges with existing data:
   * - Exact match (same date, to, from, category, amount, account) → skipped.
   * - Same date/to/from but different category or amount → added with possibleDuplicate: true.
   * - Otherwise → added as new.
   */
  async importCsv(file: File): Promise<void> {
    this.loadError.set(null);
    try {
      const rows = await this.csvImport.parseCsvToExpenseRows(file);
      const existing = this.expensesSignal();
      const categorySet = new Set(this.categoriesSignal().map((c) => c.id));
      const accountSet = new Set(this.accountsSignal().map((a) => a.id));

      const toAdd: Expense[] = [];

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

        categorySet.add(row.category);
        accountSet.add(row.account);

        toAdd.push({
          id: crypto.randomUUID(),
          ...row,
          possibleDuplicate: possibleDup,
        });
      }

      const categories = [...categorySet].sort().map((id) => ({ id }));
      const accounts = [...accountSet].sort().map((id) => ({ id }));
      const expenses = [...existing, ...toAdd];
      this.saveAll(expenses, categories, accounts);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse CSV';
      this.loadError.set(message);
    }
  }

  private amountEqual(a: number, b: number): boolean {
    return Math.abs(a - b) < 1e-6;
  }

  loadFromStorage(): void {
    this.expensesSignal.set(this.storage.getExpenses());
    this.categoriesSignal.set(this.storage.getCategories());
    this.accountsSignal.set(this.storage.getAccounts());
  }

  /**
   * Clears all expenses, categories, and accounts from storage.
   */
  clearAll(): void {
    this.loadError.set(null);
    this.storage.clear();
    this.expensesSignal.set([]);
    this.categoriesSignal.set([]);
    this.accountsSignal.set([]);
  }

  /**
   * Adds an expense and persists. Ensures category/account exist in lists.
   */
  addExpense(expense: Expense): void {
    this.loadError.set(null);
    const expenses = [...this.expensesSignal(), expense];
    const categories = this.ensureCategory(this.categoriesSignal(), expense.category);
    const accounts = this.ensureAccount(this.accountsSignal(), expense.account);
    this.saveAll(expenses, categories, accounts);
  }

  /**
   * Updates an expense by id and persists. Clears possibleDuplicate so edit marks as not duplicate.
   */
  updateExpense(expense: Expense): void {
    this.loadError.set(null);
    const updated = { ...expense, possibleDuplicate: false };
    const expenses = this.expensesSignal().map((e) => (e.id === expense.id ? updated : e));
    const categories = this.ensureCategory(this.categoriesSignal(), updated.category);
    const accounts = this.ensureAccount(this.accountsSignal(), updated.account);
    this.saveAll(expenses, categories, accounts);
  }

  /**
   * Marks an expense as not a duplicate (clears possibleDuplicate flag).
   */
  markNotDuplicate(expense: Expense): void {
    if (!expense.possibleDuplicate) return;
    this.updateExpense({ ...expense, possibleDuplicate: false });
  }

  /**
   * Deletes an expense by id and persists.
   */
  deleteExpense(id: string): void {
    this.loadError.set(null);
    const expenses = this.expensesSignal().filter((e) => e.id !== id);
    this.storage.setExpenses(expenses);
    this.expensesSignal.set(expenses);
  }

  private ensureCategory(list: Category[], name: string): Category[] {
    if (!name || list.some((c) => c.id === name)) return list;
    return [...list, { id: name }].sort((a, b) => a.id.localeCompare(b.id));
  }

  private ensureAccount(list: Account[], name: string): Account[] {
    if (!name || list.some((a) => a.id === name)) return list;
    return [...list, { id: name }].sort((a, b) => a.id.localeCompare(b.id));
  }

  private saveAll(expenses: Expense[], categories: Category[], accounts: Account[]): void {
    this.storage.saveAll(expenses, categories, accounts);
    this.expensesSignal.set(expenses);
    this.categoriesSignal.set(categories);
    this.accountsSignal.set(accounts);
  }
}
