import { Routes } from '@angular/router';

export const MINISTRY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./ministry-shell.component').then(m => m.MinistryShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./dashboard/ministry-dashboard.component').then(
            m => m.MinistryDashboardComponent
          ),
      },
      {
        path: 'plan',
        loadComponent: () =>
          import('./plan-wizard/plan-wizard.component').then(
            m => m.PlanWizardComponent
          ),
      },
      {
        path: 'report/:quarter',
        loadComponent: () =>
          import('./report-wizard/report-wizard.component').then(
            m => m.ReportWizardComponent
          ),
      },
    ],
  },
];
