import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { ExpenseService } from '../../services/expense.service';
import { PieChartComponent } from './pie-chart.component';

export interface AccountSummaryRow {
  account: string;
  total: number;
  count: number;
  /** Percentage of this row's total relative to the page grand total (0–100). */
  percentage: number;
}

@Component({
  selector: 'app-account-summary',
  standalone: true,
  imports: [MatTableModule, MatSortModule, PieChartComponent],
  templateUrl: './account-summary.component.html',
  styleUrl: './account-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSummaryComponent {
  private readonly expenseService = inject(ExpenseService);

  readonly expenses = this.expenseService.expenses;

  readonly dataSource = new MatTableDataSource<AccountSummaryRow>([]);
  private readonly sort = viewChild(MatSort);

  readonly summaryRows = computed<AccountSummaryRow[]>(() => {
    const list = this.expenses();
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
  });

  readonly grandTotal = computed(() =>
    this.summaryRows().reduce((sum, row) => sum + row.total, 0)
  );

  /** Segments for pie chart: account label and total amount. */
  readonly chartSegments = computed(() =>
    this.summaryRows().map((row) => ({ label: row.account, value: row.total }))
  );

  readonly displayedColumns = ['account', 'count', 'total', 'percentage'] as const;

  constructor() {
    effect(() => {
      this.dataSource.data = this.summaryRows();
      const s = this.sort();
      if (s) {
        this.dataSource.sort = s;
      }
    });
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
}
