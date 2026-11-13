import { HttpErrorResponse } from '@angular/common/http';

/** Mensaje estándar para respuestas 403 del backend. */
export const MENSAJE_SIN_PERMISOS = 'No tiene permisos para realizar esta acción.';

/** Mensaje estándar para respuestas 401 del backend. */
const MENSAJE_SESION_INVALIDA = 'Su sesión no es válida o expiró. Inicie sesión de nuevo.';

/**
 * Indica si el error HTTP es de autenticación (401) o de autorización (403).
 * En esos casos no tiene sentido reintentar con otros endpoints ni mostrar
 * datos vacíos: hay que informar al usuario.
 */
export function esErrorDeAcceso(error: unknown): error is HttpErrorResponse {
  return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
}

/**
 * Mensaje legible para un error 401/403.
 */
export function mensajeErrorDeAcceso(error: HttpErrorResponse): string {
  return error.status === 401 ? MENSAJE_SESION_INVALIDA : MENSAJE_SIN_PERMISOS;
}

/**
 * Devuelve el mensaje de acceso si el error es 401/403; si no, el mensaje genérico dado.
 * Útil en los `error:` de los componentes para no tapar un 403 con un error genérico.
 */
export function mensajeDeError(error: unknown, mensajeGenerico: string): string {
  return esErrorDeAcceso(error) ? mensajeErrorDeAcceso(error) : mensajeGenerico;
}
