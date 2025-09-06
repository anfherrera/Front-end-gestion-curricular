// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'authToken';
  private role: string | null = null; // Guardamos rol temporal

  constructor(private router: Router) {}

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('userRole');
    this.role = null;
  }

  // Guardar rol
  setRole(role: string): void {
    this.role = role;
    localStorage.setItem('userRole', role); // persistencia opcional
  }

  getRole(): string | null {
    return this.role ?? localStorage.getItem('userRole');
  }

  // ✅ Logout: limpia todo y redirige a login
  logout(): void {
    this.clearToken();
    this.router.navigate(['/login']);
  }

  // Método opcional para navegar a login sin limpiar datos
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
