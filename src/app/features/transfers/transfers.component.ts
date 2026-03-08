import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CsvExportService } from '../../services/csv-export.service';
import { CsvImportService } from '../../services/csv-import.service';
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
  private readonly csvExport = inject(CsvExportService);
  private readonly csvImport = inject(CsvImportService);

  readonly transfers = this.ledger.transferView;
  readonly displayedColumns = ['expand', 'date', 'from', 'to', 'amount', 'description', 'actions'] as const;

  readonly expandedRowIds = signal<Set<string>>(new Set());

  private readonly importError = signal<string | null>(null);
  readonly error = this.importError.asReadonly();

  formatAmount(value: number): string {
    return `$${value.toFixed(2)}`;
  }

  isExpanded(row: { id: string }): boolean {
    return this.expandedRowIds().has(row.id);
  }

  toggleExpanded(row: { id: string }): void {
    const set = new Set(this.expandedRowIds());
    if (set.has(row.id)) set.delete(row.id);
    else set.add(row.id);
    this.expandedRowIds.set(set);
  }

  getDetail(row: { id: string }) {
    return this.ledger.getTransactionWithLines(row.id);
  }

  openAddDialog(): void {
    this.dialog.open(TransferFormDialogComponent, { width: '400px' }).afterClosed().subscribe(() => {});
  }

  exportCsv(): void {
    const rows = this.transfers().map((r) => ({
      date: r.date,
      fromAccountId: r.fromAccountId,
      toAccountId: r.toAccountId,
      amount: r.amount,
      description: r.description ?? '',
    }));
    this.csvExport.exportTransferToCsv(rows);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.importError.set(null);
    this.csvImport
      .parseCsvToTransferRows(file)
      .then((rows) => {
        let existing = this.ledger.transferView();
        for (const row of rows) {
          const exactMatch = existing.some(
            (e) =>
              e.date === row.date &&
              e.fromAccountId === row.fromAccountId &&
              e.toAccountId === row.toAccountId &&
              Math.abs(e.amount - row.amount) < 1e-6
          );
          if (exactMatch) continue;
          this.ledger.addTransfer(
            row.fromAccountId,
            row.toAccountId,
            row.amount,
            row.date,
            row.description || undefined
          );
          existing = this.ledger.transferView();
        }
        input.value = '';
      })
      .catch((err) => {
        this.importError.set(err instanceof Error ? err.message : 'Failed to parse CSV');
        input.value = '';
      });
  }

  deleteTransfer(id: string): void {
    if (confirm('Delete this transfer?')) {
      this.ledger.deleteTransaction(id);
    }
  }
}
