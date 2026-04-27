import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-shell.component').then(m => m.AdminShellComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./admin-dashboard.component').then(m => m.AdminDashboardComponent),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../shared/profile-settings.component').then(m => m.ProfileSettingsComponent),
      },
      {
        path: 'ministries',
        loadComponent: () =>
          import('./admin-ministries.component').then(m => m.AdminMinistriesComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./admin-users.component').then(m => m.AdminUsersComponent),
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('./admin-audit.component').then(m => m.AdminAuditComponent),
      },
    ],
  },
];
