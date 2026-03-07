/**
 * Transaction (journal entry). For expense: two lines (debit expense account, credit payment account).
 * For transfer: two lines (debit from-account, credit to-account).
 */
export type TransactionType = 'expense' | 'transfer';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  description?: string;
  /** Payee or description for expense display (e.g. "Groceries"). */
  to?: string;
  /** From/payer for expense display (e.g. "Todd W"). */
  from?: string;
  /** True when added from CSV and matches same date/to/from but different category or amount. */
  possibleDuplicate?: boolean;
}

/**
 * One line of a transaction. Each transaction has sum(debit) === sum(credit).
 */
export interface JournalLine {
  id: string;
  transactionId: string;
  accountId: string;
  debit: number;
  credit: number;
}
