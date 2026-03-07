import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Expense } from '../../models';
import { ExpenseService } from '../../services/expense.service';
import {
  ExpenseFormDialogComponent,
  ExpenseFormDialogData,
  ExpenseFormDialogResult,
} from './expense-form-dialog/expense-form-dialog.component';
import { ExpensesListComponent } from './expenses-list/expenses-list.component';

@Component({
  selector: 'app-expenses',
  imports: [ExpensesListComponent, MatButtonModule, MatDialogModule],
  styles: [
    '.error { color: var(--mat-sys-error, #b3261e); }',
    '.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; gap: 0.5rem; }',
    '.header-actions { display: flex; gap: 0.5rem; }',
    'input[type="file"] { display: none; }',
  ],
  template: `
    <div class="header">
      <h1>Expenses</h1>
      <div class="header-actions">
        <button mat-raised-button color="primary" (click)="fileInput.click()" aria-label="Import CSV file">
          Import CSV
        </button>
        <input
          #fileInput
          type="file"
          accept=".csv,text/csv"
          (change)="onFileSelected($event)"
        />
        @if (expenseService.hasData()) {
          <button mat-raised-button (click)="openAddDialog()" aria-label="Add expense">
            Add expense
          </button>
          <button mat-raised-button color="warn" (click)="expenseService.clearAll()" aria-label="Clear all expenses and related data">
            Clear all
          </button>
        }
      </div>
    </div>
    @if (expenseService.hasData()) {
      <app-expenses-list
        [expenses]="expenseService.expenses()"
        (editExpense)="openEditDialog($event)"
        (deleteExpense)="confirmDelete($event)"
      />
    } @else if (expenseService.error()) {
      <p class="error">Error: {{ expenseService.error() }}</p>
    } @else {
      <p>No expenses. Import a CSV file to get started.</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpensesComponent {
  readonly expenseService = inject(ExpenseService);
  private readonly dialog = inject(MatDialog);

  openAddDialog(): void {
    const data: ExpenseFormDialogData = {
      expense: null,
      categories: this.expenseService.categories().map((c) => c.id),
      accounts: this.expenseService.accounts().map((a) => a.id),
    };
    this.dialog
      .open(ExpenseFormDialogComponent, { data, width: '400px' })
      .afterClosed()
      .subscribe((result: ExpenseFormDialogResult) => {
        if (!result || (typeof result === 'object' && 'delete' in result)) return;
        this.expenseService.addExpense(result);
      });
  }

  openEditDialog(expense: Expense): void {
    const data: ExpenseFormDialogData = {
      expense,
      categories: this.expenseService.categories().map((c) => c.id),
      accounts: this.expenseService.accounts().map((a) => a.id),
    };
    this.dialog
      .open(ExpenseFormDialogComponent, { data, width: '400px' })
      .afterClosed()
      .subscribe((result: ExpenseFormDialogResult) => {
        if (result && typeof result === 'object' && 'delete' in result) {
          this.expenseService.deleteExpense(result.id);
          return;
        }
        if (result && typeof result === 'object' && 'id' in result) {
          this.expenseService.updateExpense(result);
        }
      });
  }

  confirmDelete(expense: Expense): void {
    if (confirm(`Delete expense "${expense.to}" (${expense.date})?`)) {
      this.expenseService.deleteExpense(expense.id);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.expenseService
      .importCsv(file)
      .then(() => {
        input.value = '';
      })
      .catch(() => {
        input.value = '';
      });
  }
}
