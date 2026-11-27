import { Injectable } from '@angular/core';

/** Cuerpo de error que devuelve el backend (los campos que lee el front). */
interface CuerpoError {
  mensaje?: string;
  message?: string;
  codigo?: string;
  /** Lo usan los rechazos de cambio de estado: { estadoActual, codigo, error }. */
  error?: unknown;
}

/** Lo que se lee de un error HTTP: el estado y el cuerpo, si es un objeto. */
interface ErrorLeido {
  status?: number;
  cuerpo: CuerpoError | null;
  /** El cuerpo tal como llegó, para los mensajes de validación por campo. */
  crudo: unknown;
}

/** El mismo texto que muestra el login cuando no hay respuesta del servidor. */
export const MENSAJE_SIN_CONEXION = 'No se puede conectar al servidor. Verifique su conexión.';

function leerError(error: unknown): ErrorLeido {
  if (!error || typeof error !== 'object') {
    return { cuerpo: null, crudo: undefined };
  }
  const { status, error: crudo } = error as { status?: unknown; error?: unknown };
  const cuerpo = crudo && typeof crudo === 'object' && !Array.isArray(crudo) ? (crudo as CuerpoError) : null;
  return { status: typeof status === 'number' ? status : undefined, cuerpo, crudo };
}

/** El campo `error` del cuerpo, si es un texto. */
function textoDeError(cuerpo: CuerpoError | null): string | null {
  return typeof cuerpo?.error === 'string' && cuerpo.error ? cuerpo.error : null;
}

/**
 * Servicio para manejar errores de forma centralizada
 */
@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  /**
   * Extrae el mensaje de error desde la respuesta del backend
   * @param error Error HTTP recibido
   * @returns Mensaje de error limpio para mostrar al usuario
   */
  extraerMensajeError(error: unknown): string {
    const { status, cuerpo, crudo } = leerError(error);

    // Status 0: no hubo respuesta (backend caído o sin red). Con withFetch, `error` es un
    // TypeError cuyo `message` ("Failed to fetch") no sirve al usuario
    if (status === 0) {
      return MENSAJE_SIN_CONEXION;
    }

    // Error 400 BAD_REQUEST: validación por campos (ej: { fecha_expedicion: "La fecha debe ser..." })
    if (status === 400 && cuerpo) {
      if (cuerpo.mensaje) {
        const match = cuerpo.mensaje.match(/Violación a regla de negocio: (.+)/);
        return match ? match[1] : cuerpo.mensaje;
      }
      const textoError = textoDeError(cuerpo);
      if (textoError) return textoError;
      // Mensajes de validación por campo (clave: nombre del campo, valor: mensaje)
      const mensajesCampo = Object.values(crudo as object).filter((v): v is string => typeof v === 'string');
      if (mensajesCampo.length > 0) {
        return mensajesCampo.join('. ');
      }
    }

    // Error de conflicto (409 CONFLICT) - respaldo para compatibilidad
    if (status === 409 && cuerpo?.mensaje) {
      return cuerpo.mensaje;
    }

    // Error 404 Not Found
    if (status === 404) {
      return cuerpo?.mensaje || 'Recurso no encontrado';
    }

    // Error 500 Internal Server Error
    if (status === 500) {
      return (
        cuerpo?.message || cuerpo?.mensaje || 'Error interno del servidor. Por favor, inténtelo de nuevo más tarde.'
      );
    }

    // Otros errores
    return cuerpo?.mensaje || cuerpo?.message || textoDeError(cuerpo) || 'Ocurrió un error inesperado';
  }

  /**
   * Verifica si el error es por dependencias (no se puede eliminar)
   * @param error Error HTTP recibido
   * @returns true si es error por dependencias
   */
  esErrorDependencias(error: unknown): boolean {
    const mensaje = leerError(error).cuerpo?.mensaje?.toLowerCase() || '';
    return mensaje.includes('asociados') || mensaje.includes('asignados') || mensaje.includes('reasigne');
  }
}
