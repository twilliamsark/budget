import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { LedgerService } from '../../../services/ledger.service';

@Component({
  selector: 'app-journal-entry-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: './journal-entry-dialog.component.html',
  styleUrl: './journal-entry-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalEntryDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<JournalEntryDialogComponent>);
  private readonly ledger = inject(LedgerService);
  private readonly fb = inject(NonNullableFormBuilder);

  get accounts() {
    return this.ledger.accounts();
  }

  readonly form = this.fb.group({
    date: this.fb.control('', [Validators.required]),
    description: this.fb.control(''),
    lines: this.fb.array([
      this.createLineGroup(),
      this.createLineGroup(),
    ], [Validators.required, Validators.minLength(2)]),
  });

  private createLineGroup() {
    return this.fb.group({
      accountId: this.fb.control('', [Validators.required]),
      debit: this.fb.control('', [Validators.pattern(/^\d*(\.\d{1,2})?$/)]),
      credit: this.fb.control('', [Validators.pattern(/^\d*(\.\d{1,2})?$/)]),
    });
  }

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  private static todayMMDDYY(): string {
    const now = new Date();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const y = String(now.getFullYear()).slice(-2);
    return `${m}/${d}/${y}`;
  }

  constructor() {
    this.form.patchValue({ date: JournalEntryDialogComponent.todayMMDDYY() });
  }

  addLine(): void {
    this.lines.push(this.createLineGroup());
  }

  removeLine(i: number): void {
    if (this.lines.length > 2) this.lines.removeAt(i);
  }

  get totalDebit(): number {
    return this.lines.controls.reduce((sum, g) => {
      const v = g.get('debit')?.value;
      const n = parseFloat(String(v ?? '').trim());
      return sum + (Number.isNaN(n) ? 0 : n);
    }, 0);
  }

  get totalCredit(): number {
    return this.lines.controls.reduce((sum, g) => {
      const v = g.get('credit')?.value;
      const n = parseFloat(String(v ?? '').trim());
      return sum + (Number.isNaN(n) ? 0 : n);
    }, 0);
  }

  get isBalanced(): boolean {
    const d = this.totalDebit;
    const c = this.totalCredit;
    return d > 0 && c > 0 && Math.abs(d - c) < 1e-6;
  }

  get dateError(): string | null {
    const c = this.form.controls.date;
    return c.touched && c.errors?.['required'] ? 'Date is required' : null;
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.isBalanced) return;

    const date = this.form.controls.date.value?.trim() ?? '';
    const description = this.form.controls.description.value?.trim() || undefined;
    const lineValues = this.lines.controls.map((g) => ({
      accountId: (g.get('accountId')?.value ?? '').trim(),
      debit: parseFloat(String(g.get('debit')?.value ?? '0').trim()) || 0,
      credit: parseFloat(String(g.get('credit')?.value ?? '0').trim()) || 0,
    })).filter((l) => l.accountId && (l.debit > 0 || l.credit > 0));

    if (lineValues.length < 2) return;

    this.ledger.addJournalEntry(date, lineValues, description);
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
