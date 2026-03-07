import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Expense } from '../../models';
import { CsvExportService } from '../../services/csv-export.service';
import { ExpenseService } from '../../services/expense.service';
import {
  defaultReportRange,
  fromInputDateString,
  isInRange,
  parseExpenseDate,
  toInputDateString,
} from '../../utils/date-range';
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
    '.date-range { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; }',
    '.date-range label { display: flex; align-items: center; gap: 0.5rem; }',
    '.date-range input { padding: 0.25rem 0.5rem; font: inherit; }',
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
          <button mat-raised-button (click)="exportCsv()" aria-label="Export CSV">
            Export CSV
          </button>
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
      <div class="date-range">
        <label>
          <span>From</span>
          <input
            type="date"
            [value]="startDateStr()"
            (input)="onStartDateChange($any($event.target).value)"
            aria-label="Start date"
          />
        </label>
        <label>
          <span>To</span>
          <input
            type="date"
            [value]="endDateStr()"
            (input)="onEndDateChange($any($event.target).value)"
            aria-label="End date"
          />
        </label>
      </div>
      <app-expenses-list
        #expensesList
        [expenses]="filteredByDateRange()"
        (editExpense)="openEditDialog($event)"
        (deleteExpense)="confirmDelete($event)"
        (markNotDuplicate)="onMarkNotDuplicate($event)"
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
  private readonly csvExport = inject(CsvExportService);
  private readonly expensesListRef = viewChild<ExpensesListComponent>('expensesList');

  private readonly defaultRange = defaultReportRange();
  readonly startDateStr = signal(toInputDateString(this.defaultRange.start));
  readonly endDateStr = signal(toInputDateString(this.defaultRange.end));

  readonly rangeStart = computed(() => {
    const d = fromInputDateString(this.startDateStr());
    return d ?? this.defaultRange.start;
  });

  readonly rangeEnd = computed(() => {
    const d = fromInputDateString(this.endDateStr());
    return d ?? this.defaultRange.end;
  });

  readonly filteredByDateRange = computed(() => {
    const list = this.expenseService.expenses();
    const start = this.rangeStart();
    const end = this.rangeEnd();
    return list.filter((e) => {
      const parsed = parseExpenseDate(e.date);
      return isInRange(parsed, start, end);
    });
  });

  onStartDateChange(value: string): void {
    this.startDateStr.set(value || toInputDateString(this.defaultRange.start));
  }

  onEndDateChange(value: string): void {
    this.endDateStr.set(value || toInputDateString(this.defaultRange.end));
  }

  exportCsv(): void {
    const list = this.expensesListRef();
    if (list) {
      const toExport = list.getFilteredExpenses();
      this.csvExport.exportToCsv(toExport);
    }
  }

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

  onMarkNotDuplicate(expense: Expense): void {
    this.expenseService.markNotDuplicate(expense);
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
