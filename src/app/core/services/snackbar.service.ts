import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

/**
 * Servicio centralizado de Snackbar - Sistema de Diseño TIC
 * Aplica estilos institucionales automáticamente a todas las notificaciones
 */
@Injectable({ providedIn: 'root' })
export class SnackbarService {
  constructor(private snackBar: MatSnackBar) {}

  /**
   * Muestra notificación de éxito (verde institucional)
   */
  success(mensaje: string, duracion = 5000): void {
    this.mostrar(mensaje, 'success', duracion);
  }

  /**
   * Muestra notificación de error (naranja institucional)
   */
  error(mensaje: string, duracion = 6000): void {
    this.mostrar(mensaje, 'error', duracion);
  }

  /**
   * Muestra notificación de advertencia
   */
  warning(mensaje: string, duracion = 5000): void {
    this.mostrar(mensaje, 'warning', duracion);
  }

  /**
   * Muestra notificación informativa
   */
  info(mensaje: string, duracion = 5000): void {
    this.mostrar(mensaje, 'info', duracion);
  }

  /**
   * Muestra notificación con tipo y estilos TIC
   * Posición: superior derecha según Sistema de Diseño TIC
   */
  mostrar(mensaje: string, tipo: SnackbarType = 'info', duracion = 5000): void {
    const config = {
      duration: duracion,
      horizontalPosition: 'end' as const,
      verticalPosition: 'top' as const,
      panelClass: [`snackbar-${tipo}`],
    };
    this.snackBar.open(mensaje, 'Cerrar', config);
  }
}
