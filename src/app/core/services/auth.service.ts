// src/app/core/services/auth.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject } from 'rxjs';
import { UserRole } from '../enums/roles.enum';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'usuario';
  private readonly ROLE_KEY = 'userRole';
  private readonly EXP_KEY = 'tokenExp';

  private roleSubject = new BehaviorSubject<UserRole | null>(null);
  role$ = this.roleSubject.asObservable(); // 👈 los componentes se suscriben a esto
  private logoutTimer: any;

  constructor(
    private router: Router,
    private apiService: ApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.restoreRoleFromStorage(); // restaura rol al recargar la página
  }

  // ===== HELPER METHODS =====
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private safeLocalStorage(): Storage | null {
    return this.isBrowser() ? localStorage : null;
  }

  // ===== TOKEN =====
  setToken(token: string): void {
    const storage = this.safeLocalStorage();
    if (!storage) return;

    storage.setItem(this.TOKEN_KEY, token);

    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // milisegundos
    storage.setItem(this.EXP_KEY, exp.toString());

    this.startLogoutTimer(exp);
  }

  getToken(): string | null {
    const storage = this.safeLocalStorage();
    return storage ? storage.getItem(this.TOKEN_KEY) : null;
  }

  clearToken(): void {
    const storage = this.safeLocalStorage();
    if (storage) {
      storage.removeItem(this.TOKEN_KEY);
      storage.removeItem(this.EXP_KEY);
    }
    clearTimeout(this.logoutTimer);
  }

  // ===== USUARIO =====
  setUsuario(usuario: any): void {
    const storage = this.safeLocalStorage();
    if (storage) {
      storage.setItem(this.USER_KEY, JSON.stringify(usuario));
    }
  }

  getUsuario(): any | null {
    const storage = this.safeLocalStorage();
    if (!storage) return null;

    const userData = storage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  // ===== ROL =====
  setRole(role: string): void {
    let normalizedRole: UserRole;

    switch (role.toLowerCase()) {
      case 'admin': normalizedRole = UserRole.ADMIN; break;
      case 'funcionario': normalizedRole = UserRole.FUNCIONARIO; break;
      case 'coordinador': normalizedRole = UserRole.COORDINADOR; break;
      case 'secretario':
      case 'secretaria': normalizedRole = UserRole.SECRETARIA; break;
      case 'estudiante':
      default: normalizedRole = UserRole.ESTUDIANTE;
    }

    const storage = this.safeLocalStorage();
    if (storage) {
      storage.setItem(this.ROLE_KEY, normalizedRole);
    }

    this.roleSubject.next(normalizedRole); // 👈 actualiza en tiempo real
  }

  getRole(): UserRole | null {
    return this.roleSubject.value;
  }

  private restoreRoleFromStorage(): void {
    const storage = this.safeLocalStorage();
    if (!storage) return;

    const storedRole = storage.getItem(this.ROLE_KEY) as UserRole | null;
    if (storedRole) {
      this.roleSubject.next(storedRole);
    }
  }

  // ===== AUTENTICACIÓN =====
  login(correo: string, password: string): Observable<any> {
    return this.apiService.login(correo, password);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    const storage = this.safeLocalStorage();
    if (!storage) return false;

    const exp = storage.getItem(this.EXP_KEY);
    if (!token || !exp) return false;
    return Date.now() < Number(exp);
  }

  // ===== LOGOUT =====
  logout(showMessage: boolean = false): void {
    if (showMessage) {
      alert('⚠️ Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }
    const storage = this.safeLocalStorage();
    if (storage) {
      storage.removeItem(this.TOKEN_KEY);
      storage.removeItem(this.USER_KEY);
      storage.removeItem(this.ROLE_KEY);
      storage.removeItem(this.EXP_KEY);
    }
    clearTimeout(this.logoutTimer);
    this.roleSubject.next(null); // 👈 limpia el rol
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
    const storage = this.safeLocalStorage();
    if (!storage) return;

    const exp = storage.getItem(this.EXP_KEY);
    if (exp) this.startLogoutTimer(Number(exp));
  }
}
