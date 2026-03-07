/**
 * Expense model. Includes From (default 'Todd W' when missing on import or rehydration).
 * possibleDuplicate is set when re-importing a CSV that has a row with same date/to/from but different category/amount.
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
