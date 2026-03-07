import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  viewChildren,
} from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { DateRangeService } from '../../services/date-range.service';
import { ExpenseService } from '../../services/expense.service';
import { PieChartComponent } from './pie-chart.component';
import { defaultReportRange, fromInputDateString, isInRange, parseExpenseDate } from '../../utils/date-range';
export interface CategorySummaryRow {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface AccountSummaryRow {
  account: string;
  total: number;
  count: number;
  percentage: number;
}

@Component({
  selector: 'app-summary-report',
  standalone: true,
  imports: [MatTableModule, MatSortModule, PieChartComponent],
  templateUrl: './summary-report.component.html',
  styleUrl: './summary-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryReportComponent {
  private readonly expenseService = inject(ExpenseService);
  readonly dateRange = inject(DateRangeService);

  private readonly defaultRange = defaultReportRange();

  readonly rangeStart = computed(() => {
    const d = fromInputDateString(this.dateRange.startDateStr());
    return d ?? this.defaultRange.start;
  });

  readonly rangeEnd = computed(() => {
    const d = fromInputDateString(this.dateRange.endDateStr());
    return d ?? this.defaultRange.end;
  });

  readonly expenses = this.expenseService.expenses;

  readonly filteredExpenses = computed(() => {
    const list = this.expenses();
    const start = this.rangeStart();
    const end = this.rangeEnd();
    return list.filter((e) => {
      const parsed = parseExpenseDate(e.date);
      return isInRange(parsed, start, end);
    });
  });

  readonly categoryRows = computed(() => this.buildCategoryRows(this.filteredExpenses()));
  readonly accountRows = computed(() => this.buildAccountRows(this.filteredExpenses()));

  readonly categoryDataSource = new MatTableDataSource<CategorySummaryRow>([]);
  readonly accountDataSource = new MatTableDataSource<AccountSummaryRow>([]);
  private readonly sorts = viewChildren(MatSort);

  readonly categoryChartSegments = computed(() =>
    this.categoryRows().map((r: CategorySummaryRow) => ({ label: r.category, value: r.total }))
  );
  readonly accountChartSegments = computed(() =>
    this.accountRows().map((r: AccountSummaryRow) => ({ label: r.account, value: r.total }))
  );

  readonly grandTotal = computed(() =>
    this.filteredExpenses().reduce((sum, e) => sum + e.amount, 0)
  );

  readonly categoryDisplayedColumns = ['category', 'count', 'total', 'percentage'] as const;
  readonly accountDisplayedColumns = ['account', 'count', 'total', 'percentage'] as const;

  constructor() {
    effect(() => {
      this.categoryDataSource.data = this.categoryRows();
      this.accountDataSource.data = this.accountRows();
      const sortRefs = this.sorts();
      if (sortRefs.length >= 2) {
        this.categoryDataSource.sort = sortRefs[0];
        this.accountDataSource.sort = sortRefs[1];
      }
    });
  }

  onStartDateChange(value: string): void {
    this.dateRange.setStart(value);
  }

  onEndDateChange(value: string): void {
    this.dateRange.setEnd(value);
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  private buildCategoryRows(list: readonly { category: string; amount: number }[]): CategorySummaryRow[] {
    const byCategory = new Map<string, { total: number; count: number }>();
    for (const e of list) {
      const key = e.category || '(Uncategorized)';
      const curr = byCategory.get(key) ?? { total: 0, count: 0 };
      curr.total += e.amount;
      curr.count += 1;
      byCategory.set(key, curr);
    }
    const rows = [...byCategory.entries()]
      .map(([category, { total, count }]) => ({ category, total, count, percentage: 0 }))
      .sort((a, b) => a.category.localeCompare(b.category));
    const sum = rows.reduce((s, r) => s + r.total, 0);
    return rows.map((r) => ({
      ...r,
      percentage: sum !== 0 ? (r.total / sum) * 100 : 0,
    }));
  }

  private buildAccountRows(list: readonly { account: string; amount: number }[]): AccountSummaryRow[] {
    const byAccount = new Map<string, { total: number; count: number }>();
    for (const e of list) {
      const key = e.account || '(No account)';
      const curr = byAccount.get(key) ?? { total: 0, count: 0 };
      curr.total += e.amount;
      curr.count += 1;
      byAccount.set(key, curr);
    }
    const rows = [...byAccount.entries()]
      .map(([account, { total, count }]) => ({ account, total, count, percentage: 0 }))
      .sort((a, b) => a.account.localeCompare(b.account));
    const sum = rows.reduce((s, r) => s + r.total, 0);
    return rows.map((r) => ({
      ...r,
      percentage: sum !== 0 ? (r.total / sum) * 100 : 0,
    }));
  }
}