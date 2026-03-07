import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Expense } from '../../../models';

export interface ExpenseFormDialogData {
  expense: Expense | null;
  categories: string[];
  accounts: string[];
}

export type ExpenseFormDialogResult =
  | Expense
  | { delete: true; id: string }
  | null;

@Component({
  selector: 'app-expense-form-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
  ],
  templateUrl: './expense-form-dialog.component.html',
  styleUrl: './expense-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpenseFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<ExpenseFormDialogComponent>);
  private readonly data = inject<ExpenseFormDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly isEdit = signal(!!this.data.expense);

  readonly form = this.fb.group({
    date: this.fb.control('', [Validators.required]),
    to: this.fb.control('', [Validators.required]),
    from: this.fb.control('', [Validators.required]),
    category: this.fb.control('', [Validators.required]),
    amount: this.fb.control('', [
      Validators.required,
      Validators.pattern(/^-?\d+(\.\d{1,2})?$/),
    ]),
    account: this.fb.control('', [Validators.required]),
  });

  readonly categories = this.data.categories;
  readonly accounts = this.data.accounts;

  private static readonly DEFAULT_FROM = 'Todd W';

  private static todayMMDDYY(): string {
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const y = String(now.getFullYear()).slice(-2);
    return `${m}/${d}/${y}`;
  }

  constructor() {
    const e = this.data.expense;
    if (e) {
      this.form.setValue({
        date: e.date,
        to: e.to,
        from: e.from ?? ExpenseFormDialogComponent.DEFAULT_FROM,
        category: e.category,
        amount: String(e.amount),
        account: e.account,
      });
    } else {
      this.form.patchValue({
        from: ExpenseFormDialogComponent.DEFAULT_FROM,
        date: ExpenseFormDialogComponent.todayMMDDYY(),
      });
    }
  }

  get dateError(): string | null {
    const c = this.form.controls.date;
    return c.touched && c.errors ? (c.errors['required'] ? 'Date is required' : null) : null;
  }

  get toError(): string | null {
    const c = this.form.controls.to;
    return c.touched && c.errors ? (c.errors['required'] ? 'Payee is required' : null) : null;
  }

  get fromError(): string | null {
    const c = this.form.controls.from;
    return c.touched && c.errors ? (c.errors['required'] ? 'From is required' : null) : null;
  }

  get categoryError(): string | null {
    const c = this.form.controls.category;
    return c.touched && c.errors ? (c.errors['required'] ? 'Category is required' : null) : null;
  }

  get amountError(): string | null {
    const c = this.form.controls.amount;
    if (!c.touched || !c.errors) return null;
    if (c.errors['required']) return 'Amount is required';
    if (c.errors['pattern']) return 'Enter a valid number (e.g. -50.00)';
    return null;
  }

  get accountError(): string | null {
    const c = this.form.controls.account;
    return c.touched && c.errors ? (c.errors['required'] ? 'Account is required' : null) : null;
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const amount = parseFloat(String(v.amount ?? 0));
    const expense: Expense = {
      id: this.data.expense?.id ?? crypto.randomUUID(),
      date: v.date,
      to: v.to,
      from: v.from,
      category: v.category,
      amount: Number.isNaN(amount) ? 0 : amount,
      account: v.account,
    };
    this.dialogRef.close(expense);
  }

  onDelete(): void {
    if (this.data.expense && confirm('Delete this expense?')) {
      this.dialogRef.close({ delete: true, id: this.data.expense.id });
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
