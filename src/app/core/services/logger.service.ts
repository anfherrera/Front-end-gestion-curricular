import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Servicio de Logger Condicional
 * Solo muestra logs en desarrollo, no en producción
 * Esto mejora el rendimiento significativamente
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  
  private enabled = !environment.production;

  /**
   * Registra un mensaje de log (solo en desarrollo)
   * @param message Mensaje a registrar
   * @param args Argumentos adicionales a mostrar
   */
  log(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(message, ...args);
    }
  }

  /**
   * Registra una advertencia (solo en desarrollo)
   * @param message Mensaje de advertencia
   * @param args Argumentos adicionales a mostrar
   */
  warn(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.warn(message, ...args);
    }
  }

  /**
   * Registra un error (siempre visible, incluso en producción)
   * @param message Mensaje de error
   * @param args Argumentos adicionales a mostrar
   */
  error(message: string, ...args: any[]): void {
    // Errores siempre se muestran (incluso en producción)
    console.error(message, ...args);
  }

  /**
   * Registra información (solo en desarrollo)
   * @param message Mensaje informativo
   * @param args Argumentos adicionales a mostrar
   */
  info(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.info(message, ...args);
    }
  }

  /**
   * Registra información de depuración (solo en desarrollo)
   * @param message Mensaje de depuración
   * @param args Argumentos adicionales a mostrar
   */
  debug(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.debug(message, ...args);
    }
  }

  /**
   * Habilita o deshabilita los logs manualmente
   * @param enabled true para habilitar, false para deshabilitar
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Verifica si los logs están habilitados
   * @returns true si los logs están habilitados
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

