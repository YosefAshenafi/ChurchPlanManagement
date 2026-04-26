import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/login']);
  return false;
};

export const roleGuard = (allowed: string[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.currentUser();
    if (!user) { router.navigate(['/login']); return false; }
    if (allowed.includes(user.role)) return true;
    router.navigate(['/unauthorized']);
    return false;
  };
