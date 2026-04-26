import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./shared/components/unauthorized.component').then(m => m.UnauthorizedComponent),
  },
  {
    path: 'ministry',
    canActivate: [authGuard, roleGuard(['ministry_leader'])],
    loadChildren: () =>
      import('./features/ministry/ministry.routes').then(m => m.MINISTRY_ROUTES),
  },
  {
    path: 'elder',
    canActivate: [authGuard, roleGuard(['elder', 'admin'])],
    loadChildren: () =>
      import('./features/elder/elder.routes').then(m => m.ELDER_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['admin'])],
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  { path: '**', redirectTo: 'login' },
];
