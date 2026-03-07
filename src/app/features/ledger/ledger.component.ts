import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { LedgerService } from '../../services/ledger.service';
import { AccountType } from '../../models';

export interface LedgerLineRow {
  date: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

@Component({
  selector: 'app-ledger',
  standalone: true,
  imports: [MatFormFieldModule, MatSelectModule, MatTableModule],
  templateUrl: './ledger.component.html',
  styleUrl: './ledger.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LedgerComponent {
  private readonly ledger = inject(LedgerService);

  readonly selectedAccountId = signal<string>('');
  readonly accounts = this.ledger.accounts;

  readonly ledgerRows = computed<LedgerLineRow[]>(() => {
    const accountId = this.selectedAccountId();
    if (!accountId) return [];
    const lines = this.ledger.getLinesByAccount(accountId);
    const account = this.ledger.accounts().find((a) => a.id === accountId);
    const type: AccountType = account?.type ?? 'asset';
    const isDebitPositive = type === 'asset' || type === 'expense';
    let running = 0;
    return lines.map((line) => {
      const delta = isDebitPositive ? line.debit - line.credit : line.credit - line.debit;
      running += delta;
      return {
        date: line.date,
        description: line.description ?? '',
        debit: line.debit,
        credit: line.credit,
        runningBalance: running,
      };
    });
  });

  readonly currentBalance = computed(() => {
    const accountId = this.selectedAccountId();
    if (!accountId) return 0;
    return this.ledger.getBalanceForAccount(accountId);
  });

  readonly displayedColumns = ['date', 'description', 'debit', 'credit', 'runningBalance'];

  formatAmount(value: number): string {
    if (value === 0) return '—';
    const n = Math.abs(value);
    const s = n.toFixed(2);
    return value < 0 ? `-$${s}` : `$${s}`;
  }

  onAccountChange(value: string): void {
    this.selectedAccountId.set(value ?? '');
  }
}
