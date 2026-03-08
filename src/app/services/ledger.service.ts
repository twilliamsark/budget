import { Injectable, inject, signal, computed } from '@angular/core';
import { Expense, Account, Transaction, JournalLine, TransactionType } from '../models';
import { ExpenseStorageService } from './expense-storage.service';

const DEFAULT_FROM = 'Todd W';

function inferAccountType(id: string, categoryIds: Set<string>): Account['type'] {
  if (categoryIds.has(id)) return 'expense';
  const upper = id.toUpperCase();
  if (upper.startsWith('CC-') || upper.includes('CARD')) return 'liability';
  return 'asset';
}

@Injectable({
  providedIn: 'root',
})
export class LedgerService {
  private readonly storage = inject(ExpenseStorageService);

  private readonly accountsSignal = signal<Account[]>([]);
  private readonly transactionsSignal = signal<Transaction[]>([]);
  private readonly linesSignal = signal<JournalLine[]>([]);

  readonly accounts = this.accountsSignal.asReadonly();
  readonly transactions = this.transactionsSignal.asReadonly();
  readonly journalLines = this.linesSignal.asReadonly();

  readonly expenseView = computed<Expense[]>(() => {
    const transactions = this.transactionsSignal().filter((t) => t.type === 'expense');
    const lines = this.linesSignal();
    const accountMap = new Map(this.accountsSignal().map((a) => [a.id, a]));
    return transactions.map((t) => {
      const txLines = lines.filter((l) => l.transactionId === t.id);
      const debitLine = txLines.find((l) => (accountMap.get(l.accountId)?.type ?? 'expense') === 'expense' && l.debit > 0) ?? txLines.find((l) => l.debit > 0);
      const creditLine = txLines.find((l) => l.credit > 0);
      const category = debitLine?.accountId ?? '';
      const account = creditLine?.accountId ?? '';
      const amount = debitLine ? -debitLine.debit : 0;
      return {
        id: t.id,
        date: t.date,
        to: t.to ?? '',
        from: t.from ?? DEFAULT_FROM,
        category,
        amount,
        account,
        possibleDuplicate: t.possibleDuplicate,
      };
    });
  });

  readonly hasData = computed(() => this.transactionsSignal().length > 0);

  /** Transfer transactions as view model: id, date, fromAccountId, toAccountId, amount, description. */
  readonly transferView = computed(() => {
    const transactions = this.transactionsSignal().filter((t) => t.type === 'transfer');
    const lines = this.linesSignal();
    return transactions
      .map((t) => {
        const txLines = lines.filter((l) => l.transactionId === t.id);
        const debitLine = txLines.find((l) => l.debit > 0);
        const creditLine = txLines.find((l) => l.credit > 0);
        const amount = debitLine?.debit ?? creditLine?.credit ?? 0;
        return {
          id: t.id,
          date: t.date,
          fromAccountId: creditLine?.accountId ?? '',
          toAccountId: debitLine?.accountId ?? '',
          amount,
          description: t.description ?? '',
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  /** Income transactions as view model: id, date, toAccountId (asset), incomeAccountId, amount, description. */
  readonly incomeView = computed(() => {
    const transactions = this.transactionsSignal().filter((t) => t.type === 'income');
    const lines = this.linesSignal();
    const accountMap = new Map(this.accountsSignal().map((a) => [a.id, a]));
    return transactions
      .map((t) => {
        const txLines = lines.filter((l) => l.transactionId === t.id);
        const debitLine = txLines.find((l) => l.debit > 0);
        const creditLine = txLines.find((l) => l.credit > 0);
        const amount = debitLine?.debit ?? creditLine?.credit ?? 0;
        const toAccountId = debitLine?.accountId ?? '';
        const incomeAccountId = creditLine?.accountId ?? '';
        return {
          id: t.id,
          date: t.date,
          toAccountId,
          incomeAccountId,
          amount,
          description: t.description ?? '',
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  /** General journal entries (type === 'journal') with their lines. */
  readonly journalView = computed(() => {
    const transactions = this.transactionsSignal().filter((t) => t.type === 'journal');
    const lines = this.linesSignal();
    return transactions
      .map((t) => {
        const txLines = lines.filter((l) => l.transactionId === t.id);
        const totalDebit = txLines.reduce((s, l) => s + l.debit, 0);
        return {
          id: t.id,
          date: t.date,
          description: t.description ?? '',
          lines: txLines.map((l) => ({ accountId: l.accountId, debit: l.debit, credit: l.credit })),
          totalDebit,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  });

  constructor() {
    this.runMigrationIfNeeded();
    this.loadFromStorage();
  }

  initialize(): void {
    this.runMigrationIfNeeded();
    this.loadFromStorage();
  }

  private runMigrationIfNeeded(): void {
    const existing = this.storage.getTransactions();
    if (existing.length > 0) return;
    const legacy = this.storage.getLegacyForMigration();
    if (!legacy) return;
    const categorySet = new Set(legacy.categoryIds);
    const accounts: Account[] = [];
    for (const id of legacy.categoryIds) {
      accounts.push({ id, type: 'expense' });
    }
    for (const id of legacy.accountIds) {
      if (accounts.some((a) => a.id === id)) continue;
      accounts.push({ id, type: inferAccountType(id, categorySet) });
    }
    const transactions: Transaction[] = [];
    const lines: JournalLine[] = [];
    for (const e of legacy.expenses) {
      const tx: Transaction = {
        id: e.id,
        date: e.date,
        type: 'expense',
        to: e.to,
        from: e.from ?? DEFAULT_FROM,
      };
      transactions.push(tx);
      const amount = Math.abs(e.amount);
      lines.push(
        { id: crypto.randomUUID(), transactionId: tx.id, accountId: e.category, debit: amount, credit: 0 },
        { id: crypto.randomUUID(), transactionId: tx.id, accountId: e.account, debit: 0, credit: amount }
      );
    }
    this.storage.saveAll(accounts, transactions, lines);
    this.storage.clearLegacy();
  }

  private loadFromStorage(): void {
    this.accountsSignal.set(this.storage.getAccounts());
    this.transactionsSignal.set(this.storage.getTransactions());
    this.linesSignal.set(this.storage.getJournalLines());
  }

  private persist(): void {
    this.storage.saveAll(
      this.accountsSignal(),
      this.transactionsSignal(),
      this.linesSignal()
    );
  }

  private ensureAccount(id: string, type: Account['type']): void {
    const list = this.accountsSignal();
    if (list.some((a) => a.id === id)) return;
    this.accountsSignal.set([...list, { id, type }].sort((a, b) => a.id.localeCompare(b.id)));
  }

  addExpenseTransaction(expense: Omit<Expense, 'id'> & { id?: string }): void {
    const id = expense.id ?? crypto.randomUUID();
    const amount = Math.abs(expense.amount);
    this.ensureAccount(expense.category, 'expense');
    this.ensureAccount(expense.account, inferAccountType(expense.account, new Set([expense.category])));
    const tx: Transaction = {
      id,
      date: expense.date,
      type: 'expense',
      to: expense.to,
      from: expense.from ?? DEFAULT_FROM,
      possibleDuplicate: expense.possibleDuplicate,
    };
    const line1: JournalLine = { id: crypto.randomUUID(), transactionId: id, accountId: expense.category, debit: amount, credit: 0 };
    const line2: JournalLine = { id: crypto.randomUUID(), transactionId: id, accountId: expense.account, debit: 0, credit: amount };
    this.transactionsSignal.update((t) => [...t, tx]);
    this.linesSignal.update((l) => [...l, line1, line2]);
    this.persist();
  }

  updateExpenseTransaction(expense: Expense): void {
    this.deleteTransaction(expense.id);
    this.addExpenseTransaction({ ...expense, possibleDuplicate: false });
  }

  /** Transfer: credit from (source decreases), debit to (destination increases). */
  addTransfer(fromAccountId: string, toAccountId: string, amount: number, date: string, description?: string): void {
    if (amount <= 0) return;
    this.ensureAccount(fromAccountId, 'asset');
    this.ensureAccount(toAccountId, 'asset');
    const id = crypto.randomUUID();
    const tx: Transaction = { id, date, type: 'transfer', description };
    const line1: JournalLine = { id: crypto.randomUUID(), transactionId: id, accountId: fromAccountId, debit: 0, credit: amount };
    const line2: JournalLine = { id: crypto.randomUUID(), transactionId: id, accountId: toAccountId, debit: amount, credit: 0 };
    this.transactionsSignal.update((t) => [...t, tx]);
    this.linesSignal.update((l) => [...l, line1, line2]);
    this.persist();
  }

  /** Income: debit toAccountId (asset), credit incomeAccountId (income). E.g. interest/dividends into checking. */
  addIncomeTransaction(toAccountId: string, incomeAccountId: string, amount: number, date: string, description?: string): void {
    if (amount <= 0) return;
    this.ensureAccount(toAccountId, 'asset');
    this.ensureAccount(incomeAccountId, 'income');
    const id = crypto.randomUUID();
    const tx: Transaction = { id, date, type: 'income', description };
    const line1: JournalLine = { id: crypto.randomUUID(), transactionId: id, accountId: toAccountId, debit: amount, credit: 0 };
    const line2: JournalLine = { id: crypto.randomUUID(), transactionId: id, accountId: incomeAccountId, debit: 0, credit: amount };
    this.transactionsSignal.update((t) => [...t, tx]);
    this.linesSignal.update((l) => [...l, line1, line2]);
    this.persist();
  }

  /** General journal entry: two or more lines, sum(debits) must equal sum(credits). */
  addJournalEntry(
    date: string,
    lines: { accountId: string; debit: number; credit: number }[],
    description?: string
  ): void {
    if (lines.length < 2) return;
    const totalDebit = lines.reduce((s, l) => s + (l.debit ?? 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (l.credit ?? 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 1e-6) return;
    for (const l of lines) {
      const debit = Math.max(0, Number(l.debit) || 0);
      const credit = Math.max(0, Number(l.credit) || 0);
      if (debit > 0 || credit > 0) this.ensureAccount(l.accountId, 'asset');
    }
    const id = crypto.randomUUID();
    const tx: Transaction = { id, date, type: 'journal', description };
    const journalLines: JournalLine[] = lines
      .filter((l) => (l.debit ?? 0) > 0 || (l.credit ?? 0) > 0)
      .map((l) => ({
        id: crypto.randomUUID(),
        transactionId: id,
        accountId: l.accountId,
        debit: Math.max(0, Number(l.debit) || 0),
        credit: Math.max(0, Number(l.credit) || 0),
      }));
    if (journalLines.length < 2) return;
    this.transactionsSignal.update((t) => [...t, tx]);
    this.linesSignal.update((l) => [...l, ...journalLines]);
    this.persist();
  }

  deleteTransaction(transactionId: string): void {
    this.transactionsSignal.update((t) => t.filter((x) => x.id !== transactionId));
    this.linesSignal.update((l) => l.filter((x) => x.transactionId !== transactionId));
    this.persist();
  }

  /** Returns the transaction and its journal lines for a given transaction id, or null if not found. */
  getTransactionWithLines(transactionId: string): { transaction: Transaction; lines: JournalLine[] } | null {
    const transaction = this.transactionsSignal().find((t) => t.id === transactionId);
    if (!transaction) return null;
    const lines = this.linesSignal().filter((l) => l.transactionId === transactionId);
    return { transaction, lines };
  }

  getLinesByAccount(accountId: string): Array<JournalLine & { date: string; description?: string }> {
    const lines = this.linesSignal().filter((l) => l.accountId === accountId);
    const txMap = new Map(this.transactionsSignal().map((t) => [t.id, t]));
    return lines
      .map((l) => ({
        ...l,
        date: txMap.get(l.transactionId)?.date ?? '',
        description: txMap.get(l.transactionId)?.description ?? txMap.get(l.transactionId)?.to,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  getBalanceForAccount(accountId: string): number {
    const account = this.accountsSignal().find((a) => a.id === accountId);
    const type = account?.type ?? 'asset';
    const lines = this.linesSignal().filter((l) => l.accountId === accountId);
    const debit = lines.reduce((s, l) => s + l.debit, 0);
    const credit = lines.reduce((s, l) => s + l.credit, 0);
    if (type === 'asset' || type === 'expense') return debit - credit;
    return credit - debit;
  }

  getCategories(): Account[] {
    return this.accountsSignal().filter((a) => a.type === 'expense').sort((a, b) => a.id.localeCompare(b.id));
  }

  getPaymentAccounts(): Account[] {
    return this.accountsSignal()
      .filter((a) => a.type === 'asset' || a.type === 'liability')
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  getIncomeAccounts(): Account[] {
    return this.accountsSignal()
      .filter((a) => a.type === 'income')
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  addAccount(account: Account): void {
    const list = this.accountsSignal();
    if (list.some((a) => a.id === account.id)) return;
    this.accountsSignal.set([...list, { id: account.id, type: account.type, name: account.name }].sort((a, b) => a.id.localeCompare(b.id)));
    this.persist();
  }

  updateAccount(oldId: string, account: Account): void {
    const list = this.accountsSignal();
    const idx = list.findIndex((a) => a.id === oldId);
    if (idx === -1) return;
    const newId = account.id.trim();
    if (!newId) return;
    const updated = list.map((a) => (a.id === oldId ? { id: newId, type: account.type, name: account.name } : a));
    if (newId !== oldId) {
      this.accountsSignal.set(updated.sort((a, b) => a.id.localeCompare(b.id)));
      this.linesSignal.update((lines) =>
        lines.map((l) => (l.accountId === oldId ? { ...l, accountId: newId } : l))
      );
    } else {
      this.accountsSignal.set(updated);
    }
    this.persist();
  }

  /** Returns true if any journal line references this account. */
  isAccountInUse(accountId: string): boolean {
    return this.linesSignal().some((l) => l.accountId === accountId);
  }

  deleteAccount(accountId: string): boolean {
    if (this.isAccountInUse(accountId)) return false;
    this.accountsSignal.update((list) => list.filter((a) => a.id !== accountId));
    this.persist();
    return true;
  }

  clearAll(): void {
    this.storage.clear();
    this.accountsSignal.set([]);
    this.transactionsSignal.set([]);
    this.linesSignal.set([]);
  }
}
