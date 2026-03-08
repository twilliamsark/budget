import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Account } from '../../models';
import { LedgerService } from '../../services/ledger.service';
import {
  AccountFormDialogComponent,
  AccountFormDialogData,
} from './account-form-dialog/account-form-dialog.component';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountsComponent {
  readonly ledger = inject(LedgerService);
  private readonly dialog = inject(MatDialog);

  readonly accounts = this.ledger.accounts;
  readonly displayedColumns = ['id', 'type', 'actions'] as const;

  openAddDialog(): void {
    const data: AccountFormDialogData = {
      account: null,
      existingIds: this.ledger.accounts().map((a) => a.id),
    };
    this.dialog
      .open(AccountFormDialogComponent, { data, width: '400px' })
      .afterClosed()
      .subscribe((result: { add?: boolean; account?: Account } | null) => {
        if (result?.add && result.account) this.ledger.addAccount(result.account);
      });
  }

  openEditDialog(account: Account): void {
    const data: AccountFormDialogData = {
      account,
      existingIds: this.ledger.accounts().map((a) => a.id),
    };
    this.dialog
      .open(AccountFormDialogComponent, { data, width: '400px' })
      .afterClosed()
      .subscribe((result: { update?: boolean; oldId?: string; account?: Account } | null) => {
        if (result?.update && result.oldId != null && result.account)
          this.ledger.updateAccount(result.oldId, result.account);
      });
  }

  deleteAccount(account: Account): void {
    if (this.ledger.isAccountInUse(account.id)) {
      alert(`Cannot delete "${account.id}": it is used in transactions. Remove or reassign those entries first.`);
      return;
    }
    if (confirm(`Delete account "${account.id}"?`)) {
      const ok = this.ledger.deleteAccount(account.id);
      if (!ok) alert(`Could not delete "${account.id}". It may be in use.`);
    }
  }
}
