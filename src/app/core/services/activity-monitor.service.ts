import { Injectable, OnDestroy, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '@shared/components/confirm-dialog/confirm-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class ActivityMonitorService implements OnDestroy {
  private readonly INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos en milisegundos
  private readonly WARNING_TIME = 1 * 60 * 1000; // 1 minuto antes del logout
  private readonly THROTTLE_DELAY = 2000; // Throttle de 2 segundos para evitar exceso de eventos

  private inactivityTimer: any;
  private warningTimer: any;
  private isWarningShown = false;
  private throttleTimer: any = null; // Timer para throttle

  private activitySubject = new BehaviorSubject<boolean>(true);
  public activity$ = this.activitySubject.asObservable();

  private warningSubject = new BehaviorSubject<boolean>(false);
  public warning$ = this.warningSubject.asObservable();

  private logoutCallback: (() => void) | null = null;

  private readonly dialog = inject(MatDialog);
  private avisoRef: MatDialogRef<ConfirmDialogComponent, boolean> | null = null;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    // Solo iniciar monitoreo en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.startMonitoring();
    }
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
  }


  startMonitoring(): void {
    // Solo ejecutar en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.addEventListeners();
    this.resetInactivityTimer();
  }


  stopMonitoring(): void {
    // Solo ejecutar en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.removeEventListeners();
    this.clearTimers();
  }


  setLogoutCallback(callback: () => void): void {
    this.logoutCallback = callback;
  }


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
   * Muestra la advertencia de inactividad. Mientras está abierta, la actividad del usuario
   * no reinicia los temporizadores: decide el diálogo, y si nadie responde en el minuto
   * que queda, se cierra la sesión (handleInactivity cierra el diálogo).
   */
  private showWarning(): void {
    if (this.isWarningShown) {
      return;
    }
    this.isWarningShown = true;
    this.warningSubject.next(true);
    this.activitySubject.next(false);

    this.avisoRef = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
      width: '440px',
      disableClose: true,
      data: {
        titulo: 'Sesión por expirar',
        mensaje: 'Tu sesión expirará en 1 minuto por inactividad.\n\n¿Deseas continuar con la sesión?',
        textoConfirmar: 'Continuar sesión',
        textoCancelar: 'Cerrar sesión'
      }
    });
    this.avisoRef.afterClosed().subscribe(continuar => {
      this.avisoRef = null;
      if (continuar === true) {
        this.resetInactivityTimer();
      } else if (continuar === false) {
        this.handleInactivity();
      }
      // undefined: lo cerró handleInactivity al vencer el tiempo
    });
  }

  /**
   * Maneja la inactividad del usuario
   */
  private handleInactivity(): void {
    this.avisoRef?.close();
    this.avisoRef = null;
    this.clearTimers();
    this.activitySubject.next(false);
    this.warningSubject.next(false);

    if (this.logoutCallback) {
      this.logoutCallback();
    }
  }


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


  private onUserActivity(): void {
    // Con el aviso abierto decide el diálogo; si ya hay un throttle activo, ignorar el evento
    if (this.isWarningShown || this.throttleTimer) {
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
    // Limpiar throttle timer también
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
