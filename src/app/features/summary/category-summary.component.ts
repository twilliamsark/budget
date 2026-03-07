import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { ExpenseService } from '../../services/expense.service';

export interface CategorySummaryRow {
  category: string;
  total: number;
  count: number;
}

@Component({
  selector: 'app-category-summary',
  standalone: true,
  imports: [MatTableModule],
  templateUrl: './category-summary.component.html',
  styleUrl: './category-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategorySummaryComponent {
  private readonly expenseService = inject(ExpenseService);

  readonly expenses = this.expenseService.expenses;

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
    return [...byCategory.entries()]
      .map(([category, { total, count }]) => ({ category, total, count }))
      .sort((a, b) => a.category.localeCompare(b.category));
  });

  readonly grandTotal = computed(() =>
    this.summaryRows().reduce((sum, row) => sum + row.total, 0)
  );

  readonly displayedColumns = ['category', 'count', 'total'] as const;

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  }
}
