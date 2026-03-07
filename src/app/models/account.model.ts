/**
 * Account model. The identifier is the account value (e.g., "CC-5792", "Chk-3100", "Food").
 * type determines balance sign: asset/expense = debit increases; liability/income = credit increases.
 */
export type AccountType = 'asset' | 'liability' | 'expense' | 'income';

export interface Account {
  id: string;
  name?: string;
  type: AccountType;
}
