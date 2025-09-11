import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'usuario';
  private readonly ROLE_KEY = 'userRole';
  private readonly EXP_KEY = 'tokenExp';
  private role: string | null = null;
  private logoutTimer: any;

  constructor(private router: Router) {}

  // ===== TOKEN =====
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);

    // Extraer fecha de expiración del token
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // milisegundos
    localStorage.setItem(this.EXP_KEY, exp.toString());

    // Programar logout automático
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
  }

  getUsuario(): any | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  // ===== ROL NORMALIZADO =====
  setRole(role: string): void {
    let normalizedRole: string;
    switch (role.toLowerCase()) {
      case 'admin': normalizedRole = 'admin'; break;
      case 'funcionario': normalizedRole = 'funcionario'; break;
      case 'coordinador': normalizedRole = 'coordinador'; break;
      case 'secretario':
      case 'secretaria': normalizedRole = 'secretaria'; break;
      case 'estudiante':
      default: normalizedRole = 'estudiante';
    }
    this.role = normalizedRole;
    localStorage.setItem(this.ROLE_KEY, normalizedRole);
  }

  getRole(): string | null {
    return this.role ?? localStorage.getItem(this.ROLE_KEY);
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
    if (showMessage) alert('⚠️ Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(this.EXP_KEY);
    this.role = null;
    clearTimeout(this.logoutTimer);
    this.router.navigate(['/login']);
  }

  // ===== TIMER PARA LOGOUT AUTOMÁTICO =====
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

  restoreSession(): void {
    const exp = localStorage.getItem(this.EXP_KEY);
    if (exp) this.startLogoutTimer(Number(exp));
  }
}
