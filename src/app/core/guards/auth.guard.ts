import { Injectable, inject } from '@angular/core';
import { CanActivate, CanActivateChild, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class authGuard implements CanActivate, CanActivateChild {
  private authService = inject(AuthService);
  private router = inject(Router);


  // Necesario porque las rutas por rol usan canActivateChild: [authGuard, RoleGuard].
  // Sin este método Angular no puede ejecutar el guard y cancela la navegación.
  canActivateChild(): boolean {
    return this.canActivate();
  }

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    // Solo redirigir si no estamos ya en la página de login
    if (!this.router.url.includes('/login')) {
      this.router.navigate(['/login']);
    }
    return false;
  }
}