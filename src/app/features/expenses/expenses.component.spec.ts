import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Expense } from '../../models';
import { CsvExportService } from '../../services/csv-export.service';
import { ExpenseService } from '../../services/expense.service';
import { ExpenseStorageService } from '../../services/expense-storage.service';
import { ExpensesComponent } from './expenses.component';

const sampleExpenses: Expense[] = [
  {
    id: '1',
    date: '1/21/26',
    to: 'Payee',
    category: 'Food',
    amount: -50,
    account: 'CC-1',
    from: 'Todd W',
  },
];

describe('ExpensesComponent', () => {
  let component: ExpensesComponent;
  let fixture: ComponentFixture<ExpensesComponent>;
  let storage: ExpenseStorageService;
  let csvExport: CsvExportService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpensesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    storage = TestBed.inject(ExpenseStorageService);
    csvExport = TestBed.inject(CsvExportService);
    storage.clear();

    fixture = TestBed.createComponent(ExpensesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should inject ExpenseService', () => {
    expect(component.expenseService).toBeTruthy();
  });

  it('should export CSV with filtered expenses when Export CSV is used', () => {
    storage.setAccounts([{ id: 'Food', type: 'expense' }, { id: 'CC-1', type: 'liability' }]);
    storage.setTransactions([{ id: '1', date: '01/21/26', type: 'expense', to: 'Payee', from: 'Todd W' }]);
    storage.setJournalLines([
      { id: 'l1', transactionId: '1', accountId: 'Food', debit: 50, credit: 0 },
      { id: 'l2', transactionId: '1', accountId: 'CC-1', debit: 0, credit: 50 },
    ]);
    component.expenseService.loadFromStorage();
    component.dateRange.setStart('2026-01-01');
    component.dateRange.setEnd('2026-01-31');
    fixture.detectChanges();

    const exportSpy = spyOn(csvExport, 'exportToCsv');
    component.exportCsv();

    expect(exportSpy).toHaveBeenCalledOnceWith(jasmine.any(Array));
    expect(exportSpy.calls.mostRecent().args[0].length).toBe(1);
    expect(exportSpy.calls.mostRecent().args[0][0].to).toBe('Payee');
  });
});
