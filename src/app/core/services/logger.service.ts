import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * 🔧 Servicio de Logger Condicional
 * Solo muestra logs en desarrollo, no en producción
 * Esto mejora el rendimiento significativamente
 */
@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  
  private enabled = !environment.production;

  log(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.warn(message, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    // ✅ Errores siempre se muestran (incluso en producción)
    console.error(message, ...args);
  }

  info(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.info(message, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.debug(message, ...args);
    }
  }

  // ✅ Método para habilitar/deshabilitar logs manualmente
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

