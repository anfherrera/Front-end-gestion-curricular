import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SNACKBAR_CONFIG_TIC } from '../design-system/design-tokens';

/** `destacado`: avisos generales con el fondo institucional (p. ej. cambio de período). */
export type TipoSnackbar = 'exito' | 'error' | 'advertencia' | 'info' | 'destacado';

/** Clase de estilo de cada tipo (ver src/styles/notificaciones.css). */
const CLASE: Record<TipoSnackbar, string> = {
  exito: 'snackbar-success',
  error: 'snackbar-error',
  advertencia: 'snackbar-warning',
  info: 'snackbar-info',
  destacado: 'snackbar-destacado',
};

/**
 * Notificaciones del Sistema de Diseño TIC: arriba a la derecha, 5 s, con botón "Cerrar".
 * Usar este servicio en lugar de inyectar MatSnackBar.
 */
@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private readonly snackBar = inject(MatSnackBar);

  exito(mensaje: string, duracion?: number): void {
    this.mostrar(mensaje, 'exito', duracion);
  }

  error(mensaje: string, duracion?: number): void {
    this.mostrar(mensaje, 'error', duracion);
  }

  advertencia(mensaje: string, duracion?: number): void {
    this.mostrar(mensaje, 'advertencia', duracion);
  }

  info(mensaje: string, duracion?: number): void {
    this.mostrar(mensaje, 'info', duracion);
  }

  mostrar(mensaje: string, tipo: TipoSnackbar = 'info', duracion = SNACKBAR_CONFIG_TIC.duration): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      ...SNACKBAR_CONFIG_TIC,
      duration: duracion,
      panelClass: [CLASE[tipo]],
    });
  }
}
