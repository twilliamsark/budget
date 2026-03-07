import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { ExpenseService } from '../../services/expense.service';

export interface AccountSummaryRow {
  account: string;
  total: number;
  count: number;
}

@Component({
  selector: 'app-account-summary',
  standalone: true,
  imports: [MatTableModule],
  templateUrl: './account-summary.component.html',
  styleUrl: './account-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSummaryComponent {
  private readonly expenseService = inject(ExpenseService);

  readonly expenses = this.expenseService.expenses;

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
    return [...byAccount.entries()]
      .map(([account, { total, count }]) => ({ account, total, count }))
      .sort((a, b) => a.account.localeCompare(b.account));
  });

  readonly grandTotal = computed(() =>
    this.summaryRows().reduce((sum, row) => sum + row.total, 0)
  );

  readonly displayedColumns = ['account', 'count', 'total'] as const;

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  }
}
