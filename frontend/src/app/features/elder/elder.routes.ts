import { Routes } from '@angular/router';

export const ELDER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./elder-shell.component').then(m => m.ElderShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./elder-dashboard.component').then(m => m.ElderDashboardComponent),
      },
      {
        path: 'plan/:id',
        loadComponent: () =>
          import('./plan-review.component').then(m => m.PlanReviewComponent),
      },
    ],
  },
];
