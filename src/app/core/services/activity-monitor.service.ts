import { Injectable, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ActivityMonitorService implements OnDestroy {
  private readonly INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutos en milisegundos
  private readonly WARNING_TIME = 1 * 60 * 1000; // 1 minuto antes del logout
  private readonly THROTTLE_DELAY = 2000; // ✅ Throttle de 2 segundos para evitar exceso de eventos
  
  private inactivityTimer: any;
  private warningTimer: any;
  private isWarningShown = false;
  private throttleTimer: any = null; // ✅ Timer para throttle
  
  private activitySubject = new BehaviorSubject<boolean>(true);
  public activity$ = this.activitySubject.asObservable();
  
  private warningSubject = new BehaviorSubject<boolean>(false);
  public warning$ = this.warningSubject.asObservable();
  
  private logoutCallback: (() => void) | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    // Solo iniciar monitoreo en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.startMonitoring();
    }
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }

  /**
   * Inicia el monitoreo de actividad del usuario
   */
  startMonitoring(): void {
    // Solo ejecutar en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.addEventListeners();
    this.resetInactivityTimer();
  }

  /**
   * Detiene el monitoreo de actividad
   */
  stopMonitoring(): void {
    // Solo ejecutar en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.removeEventListeners();
    this.clearTimers();
  }

  /**
   * Establece el callback que se ejecutará cuando expire la inactividad
   */
  setLogoutCallback(callback: () => void): void {
    this.logoutCallback = callback;
  }

  /**
   * Reinicia el timer de inactividad (se llama cuando detecta actividad)
   */
  resetInactivityTimer(): void {
    this.clearTimers();
    this.isWarningShown = false;
    this.warningSubject.next(false);
    this.activitySubject.next(true);

    // Timer de advertencia (4 minutos)
    this.warningTimer = setTimeout(() => {
      this.showWarning();
    }, this.INACTIVITY_TIMEOUT - this.WARNING_TIME);

    // Timer de logout (5 minutos)
    this.inactivityTimer = setTimeout(() => {
      this.handleInactivity();
    }, this.INACTIVITY_TIMEOUT);
  }

  /**
   * Muestra la advertencia de inactividad
   */
  private showWarning(): void {
    if (!this.isWarningShown) {
      this.isWarningShown = true;
      this.warningSubject.next(true);
      this.activitySubject.next(false);
      
      // Mostrar alerta al usuario
      const userConfirmed = confirm(
        '⚠️ Tu sesión expirará en 1 minuto por inactividad.\n\n' +
        '¿Deseas continuar con la sesión?\n\n' +
        'Haz clic en "Aceptar" para mantener la sesión activa.'
      );
      
      if (userConfirmed) {
        this.resetInactivityTimer();
      } else {
        this.handleInactivity();
      }
    }
  }

  /**
   * Maneja la inactividad del usuario
   */
  private handleInactivity(): void {
    this.clearTimers();
    this.activitySubject.next(false);
    this.warningSubject.next(false);
    
    if (this.logoutCallback) {
      this.logoutCallback();
    }
  }

  /**
   * Agrega los event listeners para detectar actividad
   */
  private addEventListeners(): void {
    // Solo ejecutar en el navegador
    if (!isPlatformBrowser(this.platformId) || typeof document === 'undefined') {
      return;
    }

    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
    ];

    events.forEach(event => {
      document.addEventListener(event, this.onUserActivity.bind(this), true);
    });
  }

  /**
   * Remueve los event listeners
   */
  private removeEventListeners(): void {
    // Solo ejecutar en el navegador
    if (!isPlatformBrowser(this.platformId) || typeof document === 'undefined') {
      return;
    }

    const events = [
      'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'
    ];

    events.forEach(event => {
      document.removeEventListener(event, this.onUserActivity.bind(this), true);
    });
  }

  /**
   * Se ejecuta cuando detecta actividad del usuario
   * ✅ OPTIMIZADO: Con throttle para evitar llamadas excesivas
   */
  private onUserActivity(): void {
    // Si ya hay un throttle activo, ignorar el evento
    if (this.throttleTimer) {
      return;
    }
    
    // Ejecutar el reset
    this.resetInactivityTimer();
    
    // Establecer throttle por 2 segundos
    this.throttleTimer = setTimeout(() => {
      this.throttleTimer = null;
    }, this.THROTTLE_DELAY);
  }

  /**
   * Limpia todos los timers
   */
  private clearTimers(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    // ✅ Limpiar throttle timer también
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = null;
    }
  }

  /**
   * Obtiene el estado actual de actividad
   */
  isActive(): boolean {
    return this.activitySubject.value;
  }

  /**
   * Obtiene si se está mostrando la advertencia
   */
  isWarningActive(): boolean {
    return this.warningSubject.value;
  }
}
