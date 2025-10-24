import { Injectable } from '@angular/core';

/**
 * Servicio para manejar errores de forma centralizada
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor() {}

  /**
   * Extrae el mensaje de error desde la respuesta del backend
   * @param error Error HTTP recibido
   * @returns Mensaje de error limpio para mostrar al usuario
   */
  extraerMensajeError(error: any): string {
    // Error de regla de negocio (400 BAD_REQUEST)
    if (error.status === 400 && error.error?.mensaje) {
      const mensajeCompleto = error.error.mensaje;
      // Buscar el texto después de "Violación a regla de negocio: "
      const match = mensajeCompleto.match(/Violación a regla de negocio: (.+)/);
      return match ? match[1] : mensajeCompleto;
    }
    
    // Error de conflicto (409 CONFLICT) - respaldo para compatibilidad
    if (error.status === 409 && error.error?.mensaje) {
      return error.error.mensaje;
    }

    // Error 404 Not Found
    if (error.status === 404) {
      return error.error?.mensaje || 'Recurso no encontrado';
    }

    // Error 500 Internal Server Error
    if (error.status === 500) {
      return error.error?.message || error.error?.mensaje || 
             'Error interno del servidor. Por favor, inténtalo de nuevo más tarde.';
    }
    
    // Otros errores
    return error.error?.mensaje || error.error?.message || 
           'Ocurrió un error inesperado';
  }

  /**
   * Extrae el código de error del backend (ej: GC-0004)
   * @param error Error HTTP recibido
   * @returns Código de error o null
   */
  extraerCodigoError(error: any): string | null {
    return error.error?.codigo || null;
  }

  /**
   * Verifica si el error es por violación de regla de negocio
   * @param error Error HTTP recibido
   * @returns true si es error de regla de negocio
   */
  esErrorReglaNegocio(error: any): boolean {
    return error.status === 400 && error.error?.codigo?.startsWith('GC-');
  }

  /**
   * Verifica si el error es por dependencias (no se puede eliminar)
   * @param error Error HTTP recibido
   * @returns true si es error por dependencias
   */
  esErrorDependencias(error: any): boolean {
    const mensaje = error.error?.mensaje?.toLowerCase() || '';
    return mensaje.includes('asociados') || 
           mensaje.includes('asignados') || 
           mensaje.includes('reasigne');
  }
}

