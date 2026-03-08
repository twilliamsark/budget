import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Account, AccountType } from '../../../models';

export interface AccountFormDialogData {
  account: Account | null;
  existingIds: string[];
}

@Component({
  selector: 'app-account-form-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './account-form-dialog.component.html',
  styleUrl: './account-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountFormDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<AccountFormDialogComponent>);
  private readonly data = inject<AccountFormDialogData>(MAT_DIALOG_DATA);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly isEdit = !!this.data.account;
  readonly existingIds = new Set(this.data.existingIds);

  readonly types: AccountType[] = ['asset', 'liability', 'expense', 'income'];

  readonly form = this.fb.group({
    id: this.fb.control('', [Validators.required]),
    type: this.fb.control<AccountType>('asset', [Validators.required]),
  });

  constructor() {
    const a = this.data.account;
    if (a) {
      this.form.setValue({ id: a.id, type: a.type });
    }
  }

  get idError(): string | null {
    const c = this.form.controls.id;
    if (!c.touched) return null;
    const val = c.value?.trim() ?? '';
    if (c.errors?.['required'] || !val) return 'ID is required';
    const isDuplicate = this.existingIds.has(val) && (this.data.account == null || val !== this.data.account.id);
    if (isDuplicate || c.errors?.['duplicate']) return 'An account with this ID already exists';
    return null;
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    const id = this.form.controls.id.value?.trim() ?? '';
    if (!id) return;
    if (this.isEdit) {
      const existing = this.data.account!;
      if (id !== existing.id && this.existingIds.has(id)) {
        this.form.controls.id.setErrors({ duplicate: true });
        return;
      }
      this.dialogRef.close({ update: true, oldId: existing.id, account: { id, type: this.form.controls.type.value } });
    } else {
      if (this.existingIds.has(id)) {
        this.form.controls.id.setErrors({ duplicate: true });
        return;
      }
      this.dialogRef.close({ add: true, account: { id, type: this.form.controls.type.value } });
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
