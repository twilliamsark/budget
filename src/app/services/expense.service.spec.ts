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
    storage.setAccounts([
      { id: 'Food', type: 'expense' },
      { id: 'CC-1', type: 'liability' },
    ]);
    storage.setTransactions([
      { id: '1', date: '01/21/26', type: 'expense', to: 'Test', from: 'Todd W' },
    ]);
    storage.setJournalLines([
      { id: 'l1', transactionId: '1', accountId: 'Food', debit: 50, credit: 0 },
      { id: 'l2', transactionId: '1', accountId: 'CC-1', debit: 0, credit: 50 },
    ]);
    service.loadFromStorage();
    expect(service.expenses().length).toBe(1);
    expect(service.hasData()).toBe(true);
  });

  it('should have no data when storage is empty', () => {
    service.loadFromStorage();
    expect(service.expenses().length).toBe(0);
    expect(service.hasData()).toBe(false);
  });

  describe('importCsv merge', () => {
    function csvToFile(csv: string): File {
      return new File([csv], 'test.csv', { type: 'text/csv' });
    }

    beforeEach(() => {
      storage.clear();
      service.loadFromStorage();
    });

    it('should add all rows when storage is empty', async () => {
      const csv = `Date,To,From,Category,Amount,Account
1/21/26,Payee A,Todd W,Food,-$50.00,CC-1`;
      await service.importCsv(csvToFile(csv));
      expect(service.expenses().length).toBe(1);
      expect(service.expenses()[0].to).toBe('Payee A');
      expect(service.expenses()[0].possibleDuplicate).toBeFalsy();
    });

    it('should skip exact matches on re-import', async () => {
      const csv = `Date,To,From,Category,Amount,Account
1/21/26,Same,Todd W,Food,-$50.00,CC-1`;
      await service.importCsv(csvToFile(csv));
      expect(service.expenses().length).toBe(1);
      await service.importCsv(csvToFile(csv));
      expect(service.expenses().length).toBe(1);
    });

    it('should add new rows and skip exact matches', async () => {
      const csv1 = `Date,To,From,Category,Amount,Account
1/21/26,First,Todd W,Food,-$50.00,CC-1`;
      await service.importCsv(csvToFile(csv1));
      const csv2 = `Date,To,From,Category,Amount,Account
1/21/26,First,Todd W,Food,-$50.00,CC-1
1/22/26,Second,Todd W,Medical,-$100.00,Chk-1`;
      await service.importCsv(csvToFile(csv2));
      expect(service.expenses().length).toBe(2);
      const tos = service.expenses().map((e) => e.to).sort();
      expect(tos).toEqual(['First', 'Second']);
    });

    it('should mark possible duplicate when same date/to/from but different category or amount', async () => {
      const csv1 = `Date,To,From,Category,Amount,Account
1/21/26,Payee,Todd W,Food,-$50.00,CC-1`;
      await service.importCsv(csvToFile(csv1));
      const csv2 = `Date,To,From,Category,Amount,Account
1/21/26,Payee,Todd W,Medical,-$50.00,CC-1`;
      await service.importCsv(csvToFile(csv2));
      expect(service.expenses().length).toBe(2);
      const possibleDups = service.expenses().filter((e) => e.possibleDuplicate);
      expect(possibleDups.length).toBe(1);
      expect(possibleDups[0].category).toBe('Medical');
    });

    it('should not mark as duplicate when only amount differs but same category', async () => {
      const csv1 = `Date,To,From,Category,Amount,Account
1/21/26,Payee,Todd W,Food,-$50.00,CC-1`;
      await service.importCsv(csvToFile(csv1));
      const csv2 = `Date,To,From,Category,Amount,Account
1/21/26,Payee,Todd W,Food,-$75.00,CC-1`;
      await service.importCsv(csvToFile(csv2));
      const possibleDups = service.expenses().filter((e) => e.possibleDuplicate);
      expect(possibleDups.length).toBe(1);
      expect(possibleDups[0].amount).toBe(-75);
    });

    it('should add fully new row without possibleDuplicate', async () => {
      const csv1 = `Date,To,From,Category,Amount,Account
1/21/26,A,Todd W,Food,-$10.00,CC-1`;
      await service.importCsv(csvToFile(csv1));
      const csv2 = `Date,To,From,Category,Amount,Account
1/22/26,B,Todd W,Medical,-$20.00,Chk-1`;
      await service.importCsv(csvToFile(csv2));
      const b = service.expenses().find((e) => e.to === 'B');
      expect(b).toBeDefined();
      expect(b?.possibleDuplicate).toBeFalsy();
    });
  });

  describe('markNotDuplicate', () => {
    it('should clear possibleDuplicate when set', () => {
      const expense = {
        id: '1',
        date: '01/21/26',
        to: 'Test',
        category: 'Food',
        amount: -50,
        account: 'CC-1',
        from: 'Todd W',
        possibleDuplicate: true,
      };
      storage.setAccounts([{ id: 'Food', type: 'expense' }, { id: 'CC-1', type: 'liability' }]);
      storage.setTransactions([{ id: '1', date: '01/21/26', type: 'expense', to: 'Test', from: 'Todd W', possibleDuplicate: true }]);
      storage.setJournalLines([
        { id: 'l1', transactionId: '1', accountId: 'Food', debit: 50, credit: 0 },
        { id: 'l2', transactionId: '1', accountId: 'CC-1', debit: 0, credit: 50 },
      ]);
      service.loadFromStorage();
      service.markNotDuplicate(expense);
      expect(service.expenses()[0].possibleDuplicate).toBe(false);
    });

    it('should no-op when expense is not possibleDuplicate', () => {
      const expense = {
        id: '1',
        date: '01/21/26',
        to: 'Test',
        category: 'Food',
        amount: -50,
        account: 'CC-1',
        from: 'Todd W',
      };
      storage.setAccounts([{ id: 'Food', type: 'expense' }, { id: 'CC-1', type: 'liability' }]);
      storage.setTransactions([{ id: '1', date: '01/21/26', type: 'expense', to: 'Test', from: 'Todd W' }]);
      storage.setJournalLines([
        { id: 'l1', transactionId: '1', accountId: 'Food', debit: 50, credit: 0 },
        { id: 'l2', transactionId: '1', accountId: 'CC-1', debit: 0, credit: 50 },
      ]);
      service.loadFromStorage();
      service.markNotDuplicate(expense);
      expect(service.expenses().length).toBe(1);
    });
  });

  it('updateExpense should clear possibleDuplicate', () => {
    const expense = {
      id: '1',
      date: '01/21/26',
      to: 'Test',
      category: 'Food',
      amount: -50,
      account: 'CC-1',
      from: 'Todd W',
      possibleDuplicate: true,
    };
    storage.setAccounts([{ id: 'Food', type: 'expense' }, { id: 'CC-1', type: 'liability' }, { id: 'Medical', type: 'expense' }]);
    storage.setTransactions([{ id: '1', date: '01/21/26', type: 'expense', to: 'Test', from: 'Todd W', possibleDuplicate: true }]);
    storage.setJournalLines([
      { id: 'l1', transactionId: '1', accountId: 'Food', debit: 50, credit: 0 },
      { id: 'l2', transactionId: '1', accountId: 'CC-1', debit: 0, credit: 50 },
    ]);
    service.loadFromStorage();
    service.updateExpense({ ...expense, category: 'Medical' });
    expect(service.expenses()[0].possibleDuplicate).toBe(false);
  });
});
