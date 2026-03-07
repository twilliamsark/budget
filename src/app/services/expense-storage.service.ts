import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Expense, Category, Account } from '../models';

const STORAGE_KEYS = {
  expenses: 'budget_expenses',
  categories: 'budget_categories',
  accounts: 'budget_accounts',
} as const;

@Injectable({
  providedIn: 'root',
})
export class ExpenseStorageService {
  private readonly platformId = inject(PLATFORM_ID);
  private get storage(): Storage {
    return isPlatformBrowser(this.platformId) ? window.localStorage : this.memoryStorage;
  }
  private readonly memoryStorage = this.createMemoryStorage();

  private createMemoryStorage(): Storage {
    const store: Record<string, string> = {};
    return {
      getItem: (k) => store[k] ?? null,
      setItem: (k, v) => {
        store[k] = v;
      },
      removeItem: (k) => {
        delete store[k];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
      key: (i) => Object.keys(store)[i] ?? null,
      get length() {
        return Object.keys(store).length;
      },
    };
  }

  private static readonly DEFAULT_FROM = 'Todd W';

  getExpenses(): Expense[] {
    const raw = this.load<Expense[]>(STORAGE_KEYS.expenses) ?? [];
    return raw.map((e) => ({
      ...e,
      from: e.from ?? ExpenseStorageService.DEFAULT_FROM,
    }));
  }

  setExpenses(expenses: Expense[]): void {
    this.save(STORAGE_KEYS.expenses, expenses);
  }

  getCategories(): Category[] {
    return this.load<Category[]>(STORAGE_KEYS.categories) ?? [];
  }

  setCategories(categories: Category[]): void {
    this.save(STORAGE_KEYS.categories, categories);
  }

  getAccounts(): Account[] {
    return this.load<Account[]>(STORAGE_KEYS.accounts) ?? [];
  }

  setAccounts(accounts: Account[]): void {
    this.save(STORAGE_KEYS.accounts, accounts);
  }

  saveAll(expenses: Expense[], categories: Category[], accounts: Account[]): void {
    this.setExpenses(expenses);
    this.setCategories(categories);
    this.setAccounts(accounts);
  }

  clear(): void {
    this.storage.removeItem(STORAGE_KEYS.expenses);
    this.storage.removeItem(STORAGE_KEYS.categories);
    this.storage.removeItem(STORAGE_KEYS.accounts);
  }

  private load<T>(key: string): T | null {
    try {
      const raw = this.storage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private save<T>(key: string, value: T): void {
    this.storage.setItem(key, JSON.stringify(value));
  }
}
