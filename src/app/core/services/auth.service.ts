import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'token';
  private roleKey = 'role';

  constructor(public router: Router) {}

  // Obtener token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Validar si está autenticado
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Guardar token
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  // Guardar rol
  setRole(role: string): void {
    localStorage.setItem(this.roleKey, role);
  }

  // Obtener rol
  getRole(): string | null {
    return localStorage.getItem(this.roleKey);
  }

  // Cerrar sesión
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.roleKey);
    this.router.navigate(['/login']);
  }
}
