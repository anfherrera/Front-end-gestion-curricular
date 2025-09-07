// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'usuario';
  private readonly ROLE_KEY = 'userRole';
  private role: string | null = null; // Guardamos rol temporal

  constructor(private router: Router) {}

  // ===== Token =====
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.role = null;
  }

  // ===== Usuario =====
  setUsuario(usuario: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
  }

  getUsuario(): any | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  // ===== Rol =====
  setRole(role: string): void {
    this.role = role;
    localStorage.setItem(this.ROLE_KEY, role);
  }

  getRole(): string | null {
    return this.role ?? localStorage.getItem(this.ROLE_KEY);
  }

  // ===== Autenticación =====
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ===== Logout =====
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    this.role = null;
    this.router.navigate(['/login']);
  }

  // Método opcional para navegar a login sin limpiar datos
  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
