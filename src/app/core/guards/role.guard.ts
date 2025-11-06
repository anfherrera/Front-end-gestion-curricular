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

    // Normalizar roles para comparación (convertir a minúsculas y manejar sinónimos)
    const normalizedUserRole = this.normalizeRole(userRole);
    const normalizedExpectedRole = this.normalizeRole(expectedRole);

    if (normalizedUserRole !== normalizedExpectedRole) {
      // Rol no coincide, manda a home
      this.router.navigate(['/home']);
      return false;
    }

    return true;
  }

  private normalizeRole(role: string | undefined | null): string {
    if (!role) return '';
    
    const normalized = role.toLowerCase().trim();
    
    // Mapear sinónimos
    if (normalized === 'administrador') return 'admin';
    if (normalized === 'secretario') return 'secretaria';
    
    return normalized;
  }
}
