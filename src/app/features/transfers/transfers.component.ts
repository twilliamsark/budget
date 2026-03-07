import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { LedgerService } from '../../services/ledger.service';
import { TransferFormDialogComponent } from '../expenses/transfer-form-dialog/transfer-form-dialog.component';

@Component({
  selector: 'app-transfers',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './transfers.component.html',
  styleUrl: './transfers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransfersComponent {
  readonly ledger = inject(LedgerService);
  private readonly dialog = inject(MatDialog);

  readonly transfers = this.ledger.transferView;
  readonly displayedColumns = ['date', 'from', 'to', 'amount', 'description', 'actions'];

  formatAmount(value: number): string {
    return `$${value.toFixed(2)}`;
  }

  openAddDialog(): void {
    this.dialog.open(TransferFormDialogComponent, { width: '400px' }).afterClosed().subscribe(() => {});
  }

  deleteTransfer(id: string): void {
    if (confirm('Delete this transfer?')) {
      this.ledger.deleteTransaction(id);
    }
  }
}
