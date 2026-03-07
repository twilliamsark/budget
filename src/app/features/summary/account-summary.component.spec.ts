import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { Expense } from '../../models';
import { ExpenseService } from '../../services/expense.service';
import { ExpenseStorageService } from '../../services/expense-storage.service';
import { AccountSummaryComponent } from './account-summary.component';

const mockExpenses: Expense[] = [
  {
    id: '1',
    date: '1/21/26',
    to: 'Payee A',
    category: 'Food',
    amount: -50,
    account: 'CC-5792',
    from: 'Todd W',
  },
  {
    id: '2',
    date: '1/22/26',
    to: 'Payee B',
    category: 'Medical',
    amount: -30,
    account: 'CC-5792',
    from: 'Todd W',
  },
  {
    id: '3',
    date: '1/23/26',
    to: 'Payee C',
    category: 'Medical',
    amount: -100,
    account: 'Chk-3100',
    from: 'Todd W',
  },
];

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
    storage.setExpenses(mockExpenses);
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
    storage.setExpenses([]);
    expenseService.loadFromStorage();
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No expenses');
  });
});
