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
  { path: 'summary/category', redirectTo: 'summary', pathMatch: 'full' },
  { path: 'summary/account', redirectTo: 'summary', pathMatch: 'full' },
];
