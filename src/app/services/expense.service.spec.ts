import { TestBed } from '@angular/core/testing';
import { ExpenseService } from './expense.service';
import { ExpenseStorageService } from './expense-storage.service';

describe('ExpenseService', () => {
  let service: ExpenseService;
  let storage: ExpenseStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExpenseService);
    storage = TestBed.inject(ExpenseStorageService);
    storage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load from storage when data exists', () => {
    const expenses = [
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
    storage.setExpenses(expenses);
    storage.setCategories([{ id: 'Food' }]);
    storage.setAccounts([{ id: 'CC-1' }]);

    service.loadFromStorage();
    expect(service.expenses().length).toBe(1);
    expect(service.hasData()).toBe(true);
  });

  it('should have no data when storage is empty', () => {
    service.loadFromStorage();
    expect(service.expenses().length).toBe(0);
    expect(service.hasData()).toBe(false);
  });
});
