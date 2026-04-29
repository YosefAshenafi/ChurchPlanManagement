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
      {
        path: 'programs',
        loadComponent: () =>
          import('./program-list.component').then(m => m.ProgramListComponent),
      },
      {
        path: 'programs/new',
        loadComponent: () =>
          import('./program-form.component').then(m => m.ProgramFormComponent),
      },
      {
        path: 'programs/:id',
        loadComponent: () =>
          import('./program-form.component').then(m => m.ProgramFormComponent),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./elder-calendar.component').then(m => m.ElderCalendarComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./elder-reports.component').then(m => m.ElderReportsComponent),
      },
      {
        path: 'plans',
        loadComponent: () =>
          import('./elder-plans.component').then(m => m.ElderPlansComponent),
      },
      {
        path: 'activity',
        loadComponent: () =>
          import('./elder-activity.component').then(m => m.ElderActivityComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../shared/profile-settings.component').then(m => m.ProfileSettingsComponent),
      },
    ],
  },
];
