import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'expenses', pathMatch: 'full' },
  {
    path: 'expenses',
    loadComponent: () =>
      import('./features/expenses/expenses.component').then((m) => m.ExpensesComponent),
  },
  {
    path: 'summary/category',
    loadComponent: () =>
      import('./features/summary/category-summary.component').then((m) => m.CategorySummaryComponent),
  },
  {
    path: 'summary/account',
    loadComponent: () =>
      import('./features/summary/account-summary.component').then((m) => m.AccountSummaryComponent),
  },
];
