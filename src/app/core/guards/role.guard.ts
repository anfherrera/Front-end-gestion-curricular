import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const expectedRole = route.data['role']; // rol esperado desde la ruta
    const userRole = this.authService.getRole();

    if (!userRole) {
      // Token o rol ausente, manda a login
      this.router.navigate(['/login']);
      return false;
    }

    if (userRole !== expectedRole) {
      // Rol no coincide, manda a home
      this.router.navigate(['/home']);
      return false;
    }

    return true;
  }
}
