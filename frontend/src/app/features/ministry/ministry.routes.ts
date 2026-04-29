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
        path: 'reports',
        loadComponent: () =>
          import('./ministry-reports.component').then(m => m.MinistryReportsComponent),
      },
      {
        path: 'report/:quarter',
        loadComponent: () =>
          import('./report-wizard/report-wizard.component').then(
            m => m.ReportWizardComponent
          ),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./ministry-history.component').then(m => m.MinistryHistoryComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../shared/profile-settings.component').then(m => m.ProfileSettingsComponent),
      },
    ],
  },
];
