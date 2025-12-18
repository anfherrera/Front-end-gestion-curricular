// src/app/core/services/auth.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject } from 'rxjs';
import { UserRole } from '../enums/roles.enum';
import { ApiService } from './api.service';
import { ActivityMonitorService } from './activity-monitor.service';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Servicio de autenticación y gestión de sesión
 * Maneja tokens JWT, información de usuario, roles y expiración de sesión
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'usuario';
  private readonly ROLE_KEY = 'userRole';
  private readonly EXP_KEY = 'tokenExp';

  private roleSubject = new BehaviorSubject<UserRole | null>(null);
  role$ = this.roleSubject.asObservable();
  private logoutTimer: any;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private activityMonitor: ActivityMonitorService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private snackBar?: MatSnackBar
  ) {
    this.restoreRoleFromStorage(); // restaura rol al recargar la página
    this.setupActivityMonitoring(); // configura el monitoreo de actividad
  }

  // ===== HELPER METHODS =====
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private safeLocalStorage(): Storage | null {
    return this.isBrowser() ? localStorage : null;
  }

  // ===== TOKEN =====
  
  /**
   * Establece el token JWT y configura la expiración automática
   * @param token Token JWT recibido del servidor
   */
  setToken(token: string): void {
    const storage = this.safeLocalStorage();
    if (!storage) return;

    storage.setItem(this.TOKEN_KEY, token);

    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // milisegundos
    storage.setItem(this.EXP_KEY, exp.toString());

    this.startLogoutTimer(exp);
    this.startActivityMonitoring(); // inicia el monitoreo de actividad
  }

  /**
   * Obtiene el token JWT almacenado
   * @returns Token JWT o null si no existe
   */
  getToken(): string | null {
    const storage = this.safeLocalStorage();
    return storage ? storage.getItem(this.TOKEN_KEY) : null;
  }

  /**
   * Limpia el token y cancela el timer de expiración
   */
  clearToken(): void {
    const storage = this.safeLocalStorage();
    if (storage) {
      storage.removeItem(this.TOKEN_KEY);
      storage.removeItem(this.EXP_KEY);
    }
    clearTimeout(this.logoutTimer);
    this.stopActivityMonitoring(); // detiene el monitoreo de actividad
  }

  // ===== USUARIO =====
  
  /**
   * Almacena la información del usuario en localStorage
   * @param usuario Objeto con la información del usuario
   */
  setUsuario(usuario: any): void {
    const storage = this.safeLocalStorage();
    if (storage) {
      storage.setItem(this.USER_KEY, JSON.stringify(usuario));
    }
  }

  /**
   * Obtiene la información del usuario almacenada
   * Sincroniza el rol del usuario con el almacenado en localStorage
   * @returns Objeto con la información del usuario o null si no existe
   */
  getUsuario(): any | null {
    const storage = this.safeLocalStorage();
    if (!storage) return null;

    const userData = storage.getItem(this.USER_KEY);
    if (!userData) return null;
    
    const usuario = JSON.parse(userData);
    
    // CORRECCIÓN: Sincronizar el rol del localStorage con el del usuario
    if (usuario?.rol?.nombre) {
      const rolActualEnStorage = storage.getItem(this.ROLE_KEY);
      const rolDelUsuario = usuario.rol.nombre.toLowerCase();
      
      // Normalizar el rol esperado
      let rolEsperado = rolDelUsuario;
      if (rolDelUsuario === 'administrador') rolEsperado = 'admin';
      if (rolDelUsuario === 'secretario') rolEsperado = 'secretaria';
      
      // Si el rol guardado no coincide con el del usuario, actualizarlo
      if (rolActualEnStorage !== rolEsperado) {
        this.setRole(usuario.rol.nombre);
      }
    }
    
    return usuario;
  }

  // ===== ROL =====
  
  /**
   * Establece el rol del usuario actual
   * Normaliza el nombre del rol y lo almacena en localStorage
   * @param role Nombre del rol (puede ser en diferentes formatos)
   */
  setRole(role: string): void {
    let normalizedRole: UserRole;

    switch (role.toLowerCase()) {
      case 'admin':
      case 'administrador': normalizedRole = UserRole.ADMIN; break;
      case 'funcionario': normalizedRole = UserRole.FUNCIONARIO; break;
      case 'coordinador': normalizedRole = UserRole.COORDINADOR; break;
      case 'secretario':
      case 'secretaria': normalizedRole = UserRole.SECRETARIA; break;
      case 'decano': normalizedRole = UserRole.DECANO; break;
      case 'estudiante':
      default: normalizedRole = UserRole.ESTUDIANTE;
    }

    const storage = this.safeLocalStorage();
    if (storage) {
      storage.setItem(this.ROLE_KEY, normalizedRole);
    }

    this.roleSubject.next(normalizedRole);
  }

  /**
   * Obtiene el rol actual del usuario
   * @returns Rol del usuario o null si no está autenticado
   */
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
  
  /**
   * Realiza el proceso de login
   * @param correo Correo electrónico del usuario
   * @param password Contraseña del usuario
   * @returns Observable con la respuesta del servidor
   */
  login(correo: string, password: string): Observable<any> {
    return this.apiService.login(correo, password);
  }

  /**
   * Verifica si el usuario está autenticado
   * Comprueba la existencia y validez del token
   * @returns true si el usuario está autenticado y el token no ha expirado
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const storage = this.safeLocalStorage();
    if (!storage) return false;

    const exp = storage.getItem(this.EXP_KEY);
    if (!token || !exp) return false;
    return Date.now() < Number(exp);
  }

  // ===== LOGOUT =====
  
  /**
   * Cierra la sesión del usuario
   * Limpia todos los datos almacenados y redirige al login
   * @param showMessage Si es true, muestra un mensaje de sesión expirada
   */
  logout(showMessage: boolean = false): void {
    if (showMessage && this.snackBar) {
      this.snackBar.open('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'Cerrar', {
        duration: 5000,
        panelClass: ['warning-snackbar']
      });
    }
    const storage = this.safeLocalStorage();
    if (storage) {
      storage.removeItem(this.TOKEN_KEY);
      storage.removeItem(this.USER_KEY);
      storage.removeItem(this.ROLE_KEY);
      storage.removeItem(this.EXP_KEY);
    }
    clearTimeout(this.logoutTimer);
    this.stopActivityMonitoring(); // detiene el monitoreo de actividad
    this.roleSubject.next(null);
    this.router.navigate(['/login']);
  }

  // ===== TIMER PARA LOGOUT AUTOMÁTICO =====
  private startLogoutTimer(expirationTime: number): void {
    const now = Date.now();
    const timeLeft = expirationTime - now;
    if (this.logoutTimer) clearTimeout(this.logoutTimer);
    if (timeLeft > 0) {
      this.logoutTimer = setTimeout(() => this.logout(true), timeLeft);
    } else {
      this.logout(true);
    }
  }

  restoreSession(): void {
    const storage = this.safeLocalStorage();
    if (!storage) return;

    // Verificar primero si el token sigue siendo válido
    if (!this.isAuthenticated()) {
      // Token expirado o inválido - limpiar sesión
      this.clearToken();
      return;
    }

    const exp = storage.getItem(this.EXP_KEY);
    if (exp) {
      this.startLogoutTimer(Number(exp));
      this.startActivityMonitoring(); // reinicia el monitoreo de actividad
    }
  }

  // ===== MONITOREO DE ACTIVIDAD =====
  private setupActivityMonitoring(): void {
    this.activityMonitor.setLogoutCallback(() => {
      this.logout(true); // logout con mensaje de inactividad
    });
  }

  private startActivityMonitoring(): void {
    this.activityMonitor.startMonitoring();
  }

  private stopActivityMonitoring(): void {
    this.activityMonitor.stopMonitoring();
  }

  // ===== MÉTODOS PÚBLICOS PARA ACTIVIDAD =====
  getActivityStatus(): Observable<boolean> {
    return this.activityMonitor.activity$;
  }

  getWarningStatus(): Observable<boolean> {
    return this.activityMonitor.warning$;
  }

  isUserActive(): boolean {
    return this.activityMonitor.isActive();
  }
}
