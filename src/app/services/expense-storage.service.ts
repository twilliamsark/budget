import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Account, Transaction, JournalLine } from '../models';

const STORAGE_KEYS = {
  accounts: 'budget_accounts',
  transactions: 'budget_transactions',
  journalLines: 'budget_journal_lines',
  legacy_expenses: 'budget_expenses',
  legacy_categories: 'budget_categories',
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

  getAccounts(): Account[] {
    return this.load<Account[]>(STORAGE_KEYS.accounts) ?? [];
  }

  setAccounts(accounts: Account[]): void {
    this.save(STORAGE_KEYS.accounts, accounts);
  }

  getTransactions(): Transaction[] {
    return this.load<Transaction[]>(STORAGE_KEYS.transactions) ?? [];
  }

  setTransactions(transactions: Transaction[]): void {
    this.save(STORAGE_KEYS.transactions, transactions);
  }

  getJournalLines(): JournalLine[] {
    return this.load<JournalLine[]>(STORAGE_KEYS.journalLines) ?? [];
  }

  setJournalLines(lines: JournalLine[]): void {
    this.save(STORAGE_KEYS.journalLines, lines);
  }

  saveAll(accounts: Account[], transactions: Transaction[], journalLines: JournalLine[]): void {
    this.setAccounts(accounts);
    this.setTransactions(transactions);
    this.setJournalLines(journalLines);
  }

  clear(): void {
    this.storage.removeItem(STORAGE_KEYS.accounts);
    this.storage.removeItem(STORAGE_KEYS.transactions);
    this.storage.removeItem(STORAGE_KEYS.journalLines);
    this.storage.removeItem(STORAGE_KEYS.legacy_expenses);
    this.storage.removeItem(STORAGE_KEYS.legacy_categories);
  }

  /**
   * Returns legacy data for one-time migration when old keys exist and new transactions are empty.
   * Old format: budget_expenses, budget_categories, budget_accounts (Account had no .type).
   */
  getLegacyForMigration(): {
    expenses: Array<{ id: string; date: string; to: string; from?: string; category: string; amount: number; account: string }>;
    categoryIds: string[];
    accountIds: string[];
  } | null {
    const expenses = this.load<Array<{ id: string; date: string; to: string; from?: string; category: string; amount: number; account: string }>>(STORAGE_KEYS.legacy_expenses);
    const categories = this.load<Array<{ id: string }>>(STORAGE_KEYS.legacy_categories);
    const accountsRaw = this.load<Array<{ id: string; type?: string }>>(STORAGE_KEYS.accounts);
    const alreadyNewFormat = accountsRaw?.some((a) => 'type' in a && a.type);
    if (alreadyNewFormat) return null;
    const accountIds = accountsRaw?.map((a) => a.id) ?? [];
    const categoryIds = categories?.map((c) => c.id) ?? [];
    if (!expenses?.length && !categoryIds.length && !accountIds.length) return null;
    return {
      expenses: expenses ?? [],
      categoryIds: [...new Set(categoryIds)],
      accountIds: [...new Set(accountIds)],
    };
  }

  clearLegacy(): void {
    this.storage.removeItem(STORAGE_KEYS.legacy_expenses);
    this.storage.removeItem(STORAGE_KEYS.legacy_categories);
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
