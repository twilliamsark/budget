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
   * Imports expenses from a CSV file.
   */
  async importCsv(file: File): Promise<void> {
    this.loadError.set(null);
    try {
      const result = await this.csvImport.importCsv(file);
      this.saveAll(result.expenses, result.categories, result.accounts);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse CSV';
      this.loadError.set(message);
    }
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

  private saveAll(expenses: Expense[], categories: Category[], accounts: Account[]): void {
    this.storage.saveAll(expenses, categories, accounts);
    this.expensesSignal.set(expenses);
    this.categoriesSignal.set(categories);
    this.accountsSignal.set(accounts);
  }
}
