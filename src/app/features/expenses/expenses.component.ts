import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ExpenseService } from '../../services/expense.service';
import { ExpensesListComponent } from './expenses-list/expenses-list.component';

@Component({
  selector: 'app-expenses',
  imports: [ExpensesListComponent, MatButtonModule],
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
          <button mat-raised-button color="warn" (click)="expenseService.clearAll()" aria-label="Clear all expenses and related data">
            Clear all
          </button>
        }
      </div>
    </div>
    @if (expenseService.hasData()) {
      <app-expenses-list [expenses]="expenseService.expenses()" />
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
