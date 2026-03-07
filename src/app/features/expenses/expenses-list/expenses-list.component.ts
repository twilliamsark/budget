import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { Expense } from '../../../models';

@Component({
  selector: 'app-expenses-list',
  imports: [
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule,
    MatAutocompleteModule,
    MatButtonModule,
  ],
  templateUrl: './expenses-list.component.html',
  styleUrl: './expenses-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesListComponent {
  expenses = input.required<Expense[]>();

  readonly editExpense = output<Expense>();
  readonly deleteExpense = output<Expense>();
  readonly markNotDuplicate = output<Expense>();

  readonly searchValue = signal('');
  readonly categoryFilter = signal<string | null>(null);
  readonly accountFilter = signal<string | null>(null);
  readonly fromFilter = signal<string | null>(null);

  readonly displayedColumns = ['date', 'to', 'from', 'category', 'amount', 'account', 'actions'] as const;

  readonly dataSource = new MatTableDataSource<Expense>([]);
  private readonly sort = viewChild(MatSort);

  constructor() {
    effect(() => {
      this.dataSource.data = this.filteredExpenses();
      const s = this.sort();
      if (s) {
        this.dataSource.sort = s;
      }
    });
  }

  private readonly filteredExpenses = computed(() => {
    const list = this.expenses();
    const search = this.searchValue().toLowerCase();
    const category = this.categoryFilter();
    const account = this.accountFilter();
    const from = this.fromFilter();

    return list.filter((e) => {
      const matchesSearch =
        !search ||
        e.to.toLowerCase().includes(search) ||
        (e.from?.toLowerCase().includes(search)) ||
        e.category.toLowerCase().includes(search) ||
        e.account.toLowerCase().includes(search);
      const matchesCategory =
        !category || e.category.toLowerCase().includes(category.toLowerCase());
      const matchesAccount =
        !account || e.account.toLowerCase().includes(account.toLowerCase());
      const matchesFrom =
        !from || (e.from?.toLowerCase().includes(from.toLowerCase()));
      return matchesSearch && matchesCategory && matchesAccount && matchesFrom;
    });
  });

  readonly categories = computed(() => {
    const set = new Set(this.expenses().map((e) => e.category).filter(Boolean));
    return [...set].sort();
  });

  readonly accounts = computed(() => {
    const set = new Set(this.expenses().map((e) => e.account).filter(Boolean));
    return [...set].sort();
  });

  readonly froms = computed(() => {
    const set = new Set(this.expenses().map((e) => e.from).filter(Boolean));
    return [...set].sort();
  });

  onSearchChange(value: string): void {
    this.searchValue.set(value);
  }

  onCategoryFilterChange(value: string): void {
    this.categoryFilter.set(value || null);
  }

  onAccountFilterChange(value: string): void {
    this.accountFilter.set(value || null);
  }

  onFromFilterChange(value: string): void {
    this.fromFilter.set(value || null);
  }

  clearSearch(): void {
    this.searchValue.set('');
  }

  clearCategoryFilter(): void {
    this.categoryFilter.set(null);
  }

  clearAccountFilter(): void {
    this.accountFilter.set(null);
  }

  clearFromFilter(): void {
    this.fromFilter.set(null);
  }

  clearAllFilters(): void {
    this.searchValue.set('');
    this.categoryFilter.set(null);
    this.accountFilter.set(null);
    this.fromFilter.set(null);
  }

  hasActiveFilters(): boolean {
    return (
      !!this.searchValue() ||
      !!this.categoryFilter() ||
      !!this.accountFilter() ||
      !!this.fromFilter()
    );
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  onEdit(row: Expense): void {
    this.editExpense.emit(row);
  }

  onDelete(row: Expense): void {
    this.deleteExpense.emit(row);
  }

  onMarkNotDuplicate(row: Expense): void {
    this.markNotDuplicate.emit(row);
  }

  /** Returns the currently displayed (filtered and sorted) expenses for export. */
  getFilteredExpenses(): Expense[] {
    return this.dataSource.data ?? [];
  }
}
