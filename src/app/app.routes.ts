import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'expenses', pathMatch: 'full' },
  {
    path: 'expenses',
    loadComponent: () =>
      import('./features/expenses/expenses.component').then((m) => m.ExpensesComponent),
  },
  {
    path: 'summary',
    loadComponent: () =>
      import('./features/summary/summary-report.component').then((m) => m.SummaryReportComponent),
  },
  {
    path: 'ledger',
    loadComponent: () =>
      import('./features/ledger/ledger.component').then((m) => m.LedgerComponent),
  },
  {
    path: 'transfers',
    loadComponent: () =>
      import('./features/transfers/transfers.component').then((m) => m.TransfersComponent),
  },
  {
    path: 'accounts',
    loadComponent: () =>
      import('./features/accounts/accounts.component').then((m) => m.AccountsComponent),
  },
  { path: 'summary/category', redirectTo: 'summary', pathMatch: 'full' },
  { path: 'summary/account', redirectTo: 'summary', pathMatch: 'full' },
];
