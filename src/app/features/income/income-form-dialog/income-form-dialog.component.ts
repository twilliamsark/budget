import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LedgerService } from '../../../services/ledger.service';

@Component({
  selector: 'app-income-form-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './income-form-dialog.component.html',
  styleUrl: './income-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IncomeFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<IncomeFormDialogComponent>);
  private readonly ledger = inject(LedgerService);
  private readonly fb = inject(NonNullableFormBuilder);

  get toAccounts() {
    return this.ledger.getPaymentAccounts();
  }

  get incomeAccounts() {
    return this.ledger.getIncomeAccounts();
  }

  readonly form = this.fb.group({
    toAccount: this.fb.control('', [Validators.required]),
    incomeAccount: this.fb.control('', [Validators.required]),
    amount: this.fb.control('', [
      Validators.required,
      Validators.pattern(/^\d+(\.\d{1,2})?$/),
    ]),
    date: this.fb.control('', [Validators.required]),
    memo: this.fb.control(''),
  });

  private static todayMMDDYY(): string {
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const y = String(now.getFullYear()).slice(-2);
    return `${m}/${d}/${y}`;
  }

  constructor() {
    this.form.patchValue({ date: IncomeFormDialogComponent.todayMMDDYY() });
  }

  get toAccountError(): string | null {
    const c = this.form.controls.toAccount;
    return c.touched && c.errors?.['required'] ? 'To account is required' : null;
  }

  get incomeAccountError(): string | null {
    const c = this.form.controls.incomeAccount;
    return c.touched && c.errors?.['required'] ? 'Income account is required' : null;
  }

  get amountError(): string | null {
    const c = this.form.controls.amount;
    if (!c.touched || !c.errors) return null;
    if (c.errors['required']) return 'Amount is required';
    if (c.errors['pattern']) return 'Enter a positive number (e.g. 100.00)';
    return null;
  }

  get dateError(): string | null {
    const c = this.form.controls.date;
    return c.touched && c.errors?.['required'] ? 'Date is required' : null;
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const toId = v.toAccount;
    const incomeId = v.incomeAccount;
    const amount = parseFloat(String(v.amount ?? 0));
    if (Number.isNaN(amount) || amount <= 0) return;

    this.ledger.addIncomeTransaction(
      toId,
      incomeId,
      amount,
      v.date,
      v.memo?.trim() || undefined
    );
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
