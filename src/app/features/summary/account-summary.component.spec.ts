import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ExpenseService } from '../../services/expense.service';
import { ExpenseStorageService } from '../../services/expense-storage.service';
import { AccountSummaryComponent } from './account-summary.component';

describe('AccountSummaryComponent', () => {
  let component: AccountSummaryComponent;
  let fixture: ComponentFixture<AccountSummaryComponent>;
  let storage: ExpenseStorageService;
  let expenseService: ExpenseService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountSummaryComponent, NoopAnimationsModule],
      providers: [provideCharts(withDefaultRegisterables())],
    }).compileComponents();

    storage = TestBed.inject(ExpenseStorageService);
    expenseService = TestBed.inject(ExpenseService);
    storage.clear();
    storage.setAccounts([
      { id: 'Food', type: 'expense' },
      { id: 'Medical', type: 'expense' },
      { id: 'CC-5792', type: 'liability' },
      { id: 'Chk-3100', type: 'asset' },
    ]);
    storage.setTransactions([
      { id: '1', date: '01/21/26', type: 'expense', to: 'Payee A', from: 'Todd W' },
      { id: '2', date: '01/22/26', type: 'expense', to: 'Payee B', from: 'Todd W' },
      { id: '3', date: '01/23/26', type: 'expense', to: 'Payee C', from: 'Todd W' },
    ]);
    storage.setJournalLines([
      { id: 'l1', transactionId: '1', accountId: 'Food', debit: 50, credit: 0 },
      { id: 'l2', transactionId: '1', accountId: 'CC-5792', debit: 0, credit: 50 },
      { id: 'l3', transactionId: '2', accountId: 'Medical', debit: 30, credit: 0 },
      { id: 'l4', transactionId: '2', accountId: 'CC-5792', debit: 0, credit: 30 },
      { id: 'l5', transactionId: '3', accountId: 'Medical', debit: 100, credit: 0 },
      { id: 'l6', transactionId: '3', accountId: 'Chk-3100', debit: 0, credit: 100 },
    ]);
    expenseService.loadFromStorage();

    fixture = TestBed.createComponent(AccountSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should aggregate expenses by account', () => {
    const rows = component.summaryRows();
    expect(rows.length).toBe(2);
    const cc = rows.find((r) => r.account === 'CC-5792');
    const chk = rows.find((r) => r.account === 'Chk-3100');
    expect(cc).toBeDefined();
    expect(cc?.total).toBe(-80);
    expect(cc?.count).toBe(2);
    expect(chk).toBeDefined();
    expect(chk?.total).toBe(-100);
    expect(chk?.count).toBe(1);
  });

  it('should compute grand total', () => {
    expect(component.grandTotal()).toBe(-180);
  });

  it('should compute percentage of total for each row', () => {
    const rows = component.summaryRows();
    const cc = rows.find((r) => r.account === 'CC-5792');
    const chk = rows.find((r) => r.account === 'Chk-3100');
    expect(cc?.percentage).toBeCloseTo((80 / 180) * 100, 1);
    expect(chk?.percentage).toBeCloseTo((100 / 180) * 100, 1);
    expect(rows.reduce((s, r) => s + r.percentage, 0)).toBeCloseTo(100, 1);
  });

  it('should format percentage', () => {
    expect(component.formatPercentage(55.6)).toBe('55.6%');
  });

  it('should sort summary rows by account name', () => {
    const rows = component.summaryRows();
    expect(rows[0].account).toBe('CC-5792');
    expect(rows[1].account).toBe('Chk-3100');
  });

  it('should provide chart segments for pie chart', () => {
    const segments = component.chartSegments();
    expect(segments.length).toBe(2);
    expect(segments.map((s) => s.label)).toEqual(['CC-5792', 'Chk-3100']);
    expect(segments.map((s) => s.value)).toEqual([-80, -100]);
  });

  it('should format amount as currency', () => {
    expect(component.formatAmount(-80)).toBe('-$80.00');
  });

  it('should show empty state when no expenses', () => {
    storage.clear();
    storage.setAccounts([{ id: 'CC-5792', type: 'liability' }]);
    storage.setTransactions([]);
    storage.setJournalLines([]);
    expenseService.loadFromStorage();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No expenses');
  });
});
