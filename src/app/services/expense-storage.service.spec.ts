import { TestBed } from '@angular/core/testing';
import { ExpenseStorageService } from './expense-storage.service';
import { Expense, Category, Account } from '../models';

describe('ExpenseStorageService', () => {
  let service: ExpenseStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExpenseStorageService);
    service.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should persist and retrieve expenses', () => {
    const expenses: Expense[] = [
      {
        id: '1',
        date: '1/21/26',
        to: 'Test',
        category: 'Food',
        amount: -50,
        account: 'CC-1',
        from: 'Todd W',
      },
    ];
    service.setExpenses(expenses);
    expect(service.getExpenses()).toEqual(expenses);
  });

  it('should default missing from to Todd W when rehydrating', () => {
    const stored = [
      {
        id: '1',
        date: '1/21/26',
        to: 'Test',
        category: 'Food',
        amount: -50,
        account: 'CC-1',
      } as Expense,
    ];
    service.setExpenses(stored);
    const loaded = service.getExpenses();
    expect(loaded.length).toBe(1);
    expect(loaded[0].from).toBe('Todd W');
  });

  it('should persist and retrieve categories', () => {
    const categories: Category[] = [{ id: 'Food' }, { id: 'Medical' }];
    service.setCategories(categories);
    expect(service.getCategories()).toEqual(categories);
  });

  it('should persist and retrieve accounts', () => {
    const accounts: Account[] = [{ id: 'CC-5792' }, { id: 'Chk-3100' }];
    service.setAccounts(accounts);
    expect(service.getAccounts()).toEqual(accounts);
  });

  it('should clear all data', () => {
    service.setExpenses([{ id: '1', date: '', to: '', category: '', amount: 0, account: '', from: '' }]);
    service.clear();
    expect(service.getExpenses()).toEqual([]);
    expect(service.getCategories()).toEqual([]);
    expect(service.getAccounts()).toEqual([]);
  });
});
