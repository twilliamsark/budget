import { Expense } from './expense.model';

describe('Expense model', () => {
  it('should have required properties', () => {
    const expense: Expense = {
      id: '1',
      date: '1/21/26',
      to: 'Test Payee',
      category: 'Food',
      amount: -50.0,
      account: 'CC-5792',
    };
    expect(expense.id).toBe('1');
    expect(expense.date).toBe('1/21/26');
    expect(expense.to).toBe('Test Payee');
    expect(expense.category).toBe('Food');
    expect(expense.amount).toBe(-50.0);
    expect(expense.account).toBe('CC-5792');
  });
});
