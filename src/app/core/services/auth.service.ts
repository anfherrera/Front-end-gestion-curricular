// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { UserRole } from '../models/roles.ennum';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'usuario';
  private readonly ROLE_KEY = 'userRole';
  private readonly EXP_KEY = 'tokenExp';
  private role: UserRole | null = null;
  private logoutTimer: any;

  constructor(private router: Router) {}

  // ===== TOKEN =====
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);

    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    localStorage.setItem(this.EXP_KEY, exp.toString());

    this.startLogoutTimer(exp);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.EXP_KEY);
    this.role = null;
    clearTimeout(this.logoutTimer);
  }

  // ===== USUARIO =====
  setUsuario(usuario: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));

    // Extraer rol del backend y normalizar a UserRole
    if (usuario?.rol?.nombre) {
      const normalized = usuario.rol.nombre.toLowerCase();
      switch (normalized) {
        case 'admin':
        case 'administrador':
          this.setRole(UserRole.ADMIN);
          break;
        case 'funcionario':
          this.setRole(UserRole.FUNCIONARIO);
          break;
        case 'coordinador':
          this.setRole(UserRole.COORDINADOR);
          break;
        case 'secretario':
        case 'secretaria':
          this.setRole(UserRole.SECRETARIA);
          break;
        case 'estudiante':
          this.setRole(UserRole.ESTUDIANTE);
          break;
        default:
          this.setRole(UserRole.ESTUDIANTE); // valor por defecto
      }
    }
  }

  getUsuario(): any | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  // ===== ROL =====
  setRole(role: UserRole): void {
    this.role = role;
    localStorage.setItem(this.ROLE_KEY, role);
  }

  getRole(): UserRole {
    if (this.role) return this.role;

    const stored = localStorage.getItem(this.ROLE_KEY) as UserRole | null;
    if (stored) {
      this.role = stored;
      return stored;
    }

    return UserRole.ESTUDIANTE; // default
  }

  // ===== AUTENTICACIÓN =====
  isAuthenticated(): boolean {
    const token = this.getToken();
    const exp = localStorage.getItem(this.EXP_KEY);

    if (!token || !exp) return false;

    return Date.now() < Number(exp);
  }

  // ===== LOGOUT =====
  logout(showMessage: boolean = false): void {
    if (showMessage) {
      alert('⚠️ Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.EXP_KEY);
    this.role = null;
    clearTimeout(this.logoutTimer);
    this.router.navigate(['/login']);
  }

  private startLogoutTimer(expirationTime: number): void {
    const now = Date.now();
    const timeLeft = expirationTime - now;

    if (this.logoutTimer) clearTimeout(this.logoutTimer);

    if (timeLeft > 0) {
      this.logoutTimer = setTimeout(() => this.logout(), timeLeft);
    } else {
      this.logout();
    }
  }

  // Restaurar timer tras recargar la página
  restoreSession(): void {
    const exp = localStorage.getItem(this.EXP_KEY);
    if (exp) this.startLogoutTimer(Number(exp));
  }
}
