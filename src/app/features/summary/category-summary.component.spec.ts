import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { Expense } from '../../models';
import { ExpenseService } from '../../services/expense.service';
import { ExpenseStorageService } from '../../services/expense-storage.service';
import { CategorySummaryComponent } from './category-summary.component';

const mockExpenses: Expense[] = [
  {
    id: '1',
    date: '1/21/26',
    to: 'Payee A',
    category: 'Food',
    amount: -50,
    account: 'CC-1',
    from: 'Todd W',
  },
  {
    id: '2',
    date: '1/22/26',
    to: 'Payee B',
    category: 'Food',
    amount: -30,
    account: 'CC-1',
    from: 'Todd W',
  },
  {
    id: '3',
    date: '1/23/26',
    to: 'Payee C',
    category: 'Medical',
    amount: -100,
    account: 'Chk-1',
    from: 'Todd W',
  },
];

describe('CategorySummaryComponent', () => {
  let component: CategorySummaryComponent;
  let fixture: ComponentFixture<CategorySummaryComponent>;
  let storage: ExpenseStorageService;
  let expenseService: ExpenseService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategorySummaryComponent, NoopAnimationsModule],
      providers: [provideCharts(withDefaultRegisterables())],
    }).compileComponents();

    storage = TestBed.inject(ExpenseStorageService);
    expenseService = TestBed.inject(ExpenseService);
    storage.clear();
    storage.setExpenses(mockExpenses);
    expenseService.loadFromStorage();

    fixture = TestBed.createComponent(CategorySummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should aggregate expenses by category', () => {
    const rows = component.summaryRows();
    expect(rows.length).toBe(2);
    const food = rows.find((r) => r.category === 'Food');
    const medical = rows.find((r) => r.category === 'Medical');
    expect(food).toBeDefined();
    expect(food?.total).toBe(-80);
    expect(food?.count).toBe(2);
    expect(medical).toBeDefined();
    expect(medical?.total).toBe(-100);
    expect(medical?.count).toBe(1);
  });

  it('should compute grand total', () => {
    expect(component.grandTotal()).toBe(-180);
  });

  it('should compute percentage of total for each row', () => {
    const rows = component.summaryRows();
    const food = rows.find((r) => r.category === 'Food');
    const medical = rows.find((r) => r.category === 'Medical');
    expect(food?.percentage).toBeCloseTo((80 / 180) * 100, 1);
    expect(medical?.percentage).toBeCloseTo((100 / 180) * 100, 1);
    expect(rows.reduce((s, r) => s + r.percentage, 0)).toBeCloseTo(100, 1);
  });

  it('should format percentage', () => {
    expect(component.formatPercentage(44.4)).toBe('44.4%');
  });

  it('should sort summary rows by category name', () => {
    const rows = component.summaryRows();
    expect(rows[0].category).toBe('Food');
    expect(rows[1].category).toBe('Medical');
  });

  it('should provide chart segments for pie chart', () => {
    const segments = component.chartSegments();
    expect(segments.length).toBe(2);
    expect(segments.map((s) => s.label)).toEqual(['Food', 'Medical']);
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
