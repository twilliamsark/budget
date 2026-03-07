/**
 * Expense view row (derived from Transaction + JournalLines). Used for expense list, form, and CSV export.
 * Not persisted; data lives in Transaction and JournalLine. amount is typically negative for display.
 */
export interface Expense {
  id: string;
  date: string;
  to: string;
  category: string;
  amount: number;
  account: string;
  from: string;
  /** True when added from CSV and an existing expense has same date/to/from but different category or amount. */
  possibleDuplicate?: boolean;
}
