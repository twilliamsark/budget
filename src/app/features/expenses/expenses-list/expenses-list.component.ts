import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
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

  readonly searchValue = signal('');
  readonly categoryFilter = signal<string | null>(null);
  readonly accountFilter = signal<string | null>(null);

  readonly displayedColumns = ['date', 'to', 'category', 'amount', 'account'] as const;

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

    return list.filter((e) => {
      const matchesSearch =
        !search ||
        e.to.toLowerCase().includes(search) ||
        e.category.toLowerCase().includes(search) ||
        e.account.toLowerCase().includes(search);
      const matchesCategory =
        !category || e.category.toLowerCase().includes(category.toLowerCase());
      const matchesAccount =
        !account || e.account.toLowerCase().includes(account.toLowerCase());
      return matchesSearch && matchesCategory && matchesAccount;
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

  onSearchChange(value: string): void {
    this.searchValue.set(value);
  }

  onCategoryFilterChange(value: string): void {
    this.categoryFilter.set(value || null);
  }

  onAccountFilterChange(value: string): void {
    this.accountFilter.set(value || null);
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

  clearAllFilters(): void {
    this.searchValue.set('');
    this.categoryFilter.set(null);
    this.accountFilter.set(null);
  }

  hasActiveFilters(): boolean {
    return (
      !!this.searchValue() ||
      !!this.categoryFilter() ||
      !!this.accountFilter()
    );
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  }
}
