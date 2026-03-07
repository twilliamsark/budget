import { TestBed } from '@angular/core/testing';
import { ExpenseStorageService } from './expense-storage.service';
import { Account, Transaction, JournalLine } from '../models';

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

  it('should persist and retrieve accounts', () => {
    const accounts: Account[] = [
      { id: 'CC-5792', type: 'liability' },
      { id: 'Chk-3100', type: 'asset' },
      { id: 'Food', type: 'expense' },
    ];
    service.setAccounts(accounts);
    expect(service.getAccounts()).toEqual(accounts);
  });

  it('should persist and retrieve transactions', () => {
    const transactions: Transaction[] = [
      { id: 'tx1', date: '01/21/26', type: 'expense', to: 'Test', from: 'Todd W' },
    ];
    service.setTransactions(transactions);
    expect(service.getTransactions()).toEqual(transactions);
  });

  it('should persist and retrieve journal lines', () => {
    const lines: JournalLine[] = [
      { id: 'l1', transactionId: 'tx1', accountId: 'Food', debit: 50, credit: 0 },
      { id: 'l2', transactionId: 'tx1', accountId: 'CC-1', debit: 0, credit: 50 },
    ];
    service.setJournalLines(lines);
    expect(service.getJournalLines()).toEqual(lines);
  });

  it('should clear all data', () => {
    service.setAccounts([{ id: 'A', type: 'asset' }]);
    service.setTransactions([{ id: 't', date: '01/01/26', type: 'transfer' }]);
    service.setJournalLines([{ id: 'l', transactionId: 't', accountId: 'A', debit: 0, credit: 0 }]);
    service.clear();
    expect(service.getAccounts()).toEqual([]);
    expect(service.getTransactions()).toEqual([]);
    expect(service.getJournalLines()).toEqual([]);
  });

  it('should return null from getLegacyForMigration when accounts have type', () => {
    service.setAccounts([{ id: 'CC-1', type: 'liability' }]);
    expect(service.getLegacyForMigration()).toBeNull();
  });
});
