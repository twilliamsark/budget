import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { SummaryReportComponent } from './summary-report.component';
import { ExpenseService } from '../../services/expense.service';
import { ExpenseStorageService } from '../../services/expense-storage.service';

describe('SummaryReportComponent', () => {
  let component: SummaryReportComponent;
  let fixture: ComponentFixture<SummaryReportComponent>;
  let storage: ExpenseStorageService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummaryReportComponent],
      providers: [
        ExpenseService,
        ExpenseStorageService,
        provideCharts(withDefaultRegisterables()),
      ],
    }).compileComponents();

    storage = TestBed.inject(ExpenseStorageService);
    storage.clear();
    fixture = TestBed.createComponent(SummaryReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default date range to last month', () => {
    const start = component.dateRange.startDateStr();
    const end = component.dateRange.endDateStr();
    expect(start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(start).getTime()).toBeLessThanOrEqual(new Date(end).getTime());
  });

  it('should filter expenses by date range and show category/account totals', () => {
    const expenseService = TestBed.inject(ExpenseService);
    storage.setAccounts([
      { id: 'Food', type: 'expense' },
      { id: 'Medical', type: 'expense' },
      { id: 'CC-1', type: 'liability' },
      { id: 'Chk-1', type: 'asset' },
    ]);
    storage.setTransactions([
      { id: '1', date: '02/01/26', type: 'expense', to: 'Payee', from: 'Todd W' },
      { id: '2', date: '02/15/26', type: 'expense', to: 'Other', from: 'Todd W' },
    ]);
    storage.setJournalLines([
      { id: 'l1', transactionId: '1', accountId: 'Food', debit: 50, credit: 0 },
      { id: 'l2', transactionId: '1', accountId: 'CC-1', debit: 0, credit: 50 },
      { id: 'l3', transactionId: '2', accountId: 'Medical', debit: 100, credit: 0 },
      { id: 'l4', transactionId: '2', accountId: 'Chk-1', debit: 0, credit: 100 },
    ]);
    expenseService.loadFromStorage();
    component.dateRange.setStart('2026-02-01');
    component.dateRange.setEnd('2026-02-28');
    fixture.detectChanges();

    expect(component.filteredExpenses().length).toBe(2);
    expect(component.grandTotal()).toBe(-150);
    const catRows = component.categoryRows();
    expect(catRows.length).toBe(2);
    expect(catRows.find((r) => r.category === 'Food')?.total).toBe(-50);
    expect(catRows.find((r) => r.category === 'Medical')?.total).toBe(-100);
    const accRows = component.accountRows();
    expect(accRows.length).toBe(2);
  });

  it('formatAmount should format as currency', () => {
    expect(component.formatAmount(-123.45)).toContain('123.45');
    expect(component.formatAmount(0)).toContain('0.00');
  });

  it('formatPercentage should format with one decimal', () => {
    expect(component.formatPercentage(33.333)).toBe('33.3%');
  });
});
