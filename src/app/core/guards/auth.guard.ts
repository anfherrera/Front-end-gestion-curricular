import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);

  if (!authService.isAuthenticated()) {
    authService.router.navigate(['/login']); // 🚀 funciona porque router es público
    return false;
  }

  return true;
};
