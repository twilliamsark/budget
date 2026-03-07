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

export interface CategorySummaryRow {
  category: string;
  total: number;
  count: number;
  /** Percentage of this row's total relative to the page grand total (0–100). */
  percentage: number;
}

@Component({
  selector: 'app-category-summary',
  standalone: true,
  imports: [MatTableModule, MatSortModule, PieChartComponent],
  templateUrl: './category-summary.component.html',
  styleUrl: './category-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategorySummaryComponent {
  private readonly expenseService = inject(ExpenseService);

  readonly expenses = this.expenseService.expenses;

  readonly dataSource = new MatTableDataSource<CategorySummaryRow>([]);
  private readonly sort = viewChild(MatSort);

  readonly summaryRows = computed<CategorySummaryRow[]>(() => {
    const list = this.expenses();
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
  });

  readonly grandTotal = computed(() =>
    this.summaryRows().reduce((sum, row) => sum + row.total, 0)
  );

  /** Segments for pie chart: category label and total amount. */
  readonly chartSegments = computed(() =>
    this.summaryRows().map((row) => ({ label: row.category, value: row.total }))
  );

  readonly displayedColumns = ['category', 'count', 'total', 'percentage'] as const;

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
