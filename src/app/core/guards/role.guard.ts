import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate, CanActivateChild {

  constructor(private authService: AuthService, private router: Router) {}

  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.canActivate(childRoute, state);
  }

  canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {
    const expectedRole = this.findExpectedRole(route); // rol esperado desde la ruta (o un ancestro)
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
      // Rol no coincide, dirige a página de bienvenida
      this.router.navigate(['/welcome']);
      return false;
    }

    return true;
  }

  private findExpectedRole(route: ActivatedRouteSnapshot): string | undefined {
    let current: ActivatedRouteSnapshot | null = route;
    while (current) {
      const role = current.data?.['role'];
      if (role) return role;
      current = current.parent;
    }
    return undefined;
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
