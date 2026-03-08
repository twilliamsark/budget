import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { CsvExportService, JournalCsvLine } from '../../services/csv-export.service';
import { CsvImportService } from '../../services/csv-import.service';
import { LedgerService } from '../../services/ledger.service';
import { JournalEntryDialogComponent } from './journal-entry-dialog/journal-entry-dialog.component';

@Component({
  selector: 'app-journal',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './journal.component.html',
  styleUrl: './journal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalComponent {
  readonly ledger = inject(LedgerService);
  private readonly dialog = inject(MatDialog);
  private readonly csvExport = inject(CsvExportService);
  private readonly csvImport = inject(CsvImportService);

  readonly journalList = this.ledger.journalView;
  readonly displayedColumns = ['expand', 'date', 'description', 'linesCount', 'total', 'actions'] as const;

  readonly expandedRowIds = signal<Set<string>>(new Set());

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
    this.dialog.open(JournalEntryDialogComponent, { width: '560px' }).afterClosed().subscribe(() => {});
  }

  exportCsv(): void {
    const lines: JournalCsvLine[] = [];
    for (const entry of this.journalList()) {
      for (const l of entry.lines) {
        lines.push({
          entryId: entry.id,
          date: entry.date,
          description: entry.description,
          accountId: l.accountId,
          debit: l.debit,
          credit: l.credit,
        });
      }
    }
    this.csvExport.exportJournalToCsv(lines);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.importError.set(null);
    this.csvImport
      .parseCsvToJournalEntries(file)
      .then((entries) => {
        for (const e of entries) {
          this.ledger.addJournalEntry(e.date, e.lines, e.description || undefined);
        }
        input.value = '';
      })
      .catch((err) => {
        this.importError.set(err instanceof Error ? err.message : 'Failed to parse CSV');
        input.value = '';
      });
  }

  private readonly importError = signal<string | null>(null);
  readonly error = this.importError.asReadonly();

  deleteEntry(id: string): void {
    if (confirm('Delete this journal entry?')) {
      this.ledger.deleteTransaction(id);
    }
  }
}
