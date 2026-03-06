/**
 * Expense model based on Outgoing_202601.csv columns: Date, To, Category, Amount, Account.
 */
export interface Expense {
  id: string;
  date: string;
  to: string;
  category: string;
  amount: number;
  account: string;
}
