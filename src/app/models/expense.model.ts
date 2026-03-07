/**
 * Expense model. Includes From (default 'Todd W' when missing on import or rehydration).
 * Based on CSV columns: Date, To, Category, Amount, Account, and optional From.
 */
export interface Expense {
  id: string;
  date: string;
  to: string;
  category: string;
  amount: number;
  account: string;
  from: string;
}
