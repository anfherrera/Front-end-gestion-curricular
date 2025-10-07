import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CursoEstadosService } from '../../../core/services/curso-estados.service';

export interface BackendError {
  message: string;
  error?: string;
  statusCode?: number;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor(
    private snackBar: MatSnackBar,
    private cursoEstadosService: CursoEstadosService
  ) {}

  /**
   * Maneja errores específicos del backend de cursos intersemestrales
   */
  handleCursoError(error: any, operacion: string = 'operación'): void {
    console.error('❌ Error en cursos intersemestrales:', error);

    let mensaje = 'Ha ocurrido un error inesperado';
    let tipoError: 'error' | 'warning' = 'error';

    if (error.error?.message) {
      mensaje = this.procesarMensajeEspecifico(error.error.message, error.error);
    } else if (error.message) {
      mensaje = this.procesarMensajeEspecifico(error.message, error);
    } else if (error.status) {
      mensaje = this.procesarErrorPorStatus(error.status);
    }

    // Determinar si es un error de validación (warning) o error crítico
    if (this.esErrorDeValidacion(mensaje)) {
      tipoError = 'warning';
    }

    this.mostrarMensaje(mensaje, tipoError);
  }

  /**
   * Procesa mensajes específicos del backend
   */
  private procesarMensajeEspecifico(mensaje: string, error: any): string {
    // Errores de transición de estado
    if (mensaje.includes('Desde') && mensaje.includes('solo se puede cambiar a')) {
      return `⚠️ ${mensaje}`;
    }

    if (mensaje.includes('debe tener') && mensaje.includes('para pasar a')) {
      return `⚠️ ${mensaje}`;
    }

    if (mensaje.includes('Debe haber al menos') && mensaje.includes('para abrir')) {
      return `⚠️ ${mensaje}`;
    }

    if (mensaje.includes('está cerrado y no se puede cambiar')) {
      return `❌ ${mensaje}`;
    }

    // Errores de permisos
    if (mensaje.includes('no puede realizar la operación')) {
      return `🚫 ${mensaje}`;
    }

    if (mensaje.includes('no tiene permisos para realizar operaciones')) {
      return `🚫 ${mensaje}`;
    }

    // Errores de validación de datos
    if (mensaje.includes('es requerido') || mensaje.includes('es obligatorio')) {
      return `📝 ${mensaje}`;
    }

    if (mensaje.includes('debe ser mayor a') || mensaje.includes('debe ser menor a')) {
      return `📝 ${mensaje}`;
    }

    // Errores de duplicación
    if (mensaje.includes('ya existe') || mensaje.includes('duplicado')) {
      return `🔄 ${mensaje}`;
    }

    // Errores de integridad referencial
    if (mensaje.includes('no se puede eliminar porque tiene')) {
      return `🔗 ${mensaje}`;
    }

    // Errores de estado del curso
    if (mensaje.includes('no está en estado') || mensaje.includes('estado inválido')) {
      return `📊 ${mensaje}`;
    }

    // Errores de fechas
    if (mensaje.includes('fecha') && (mensaje.includes('anterior') || mensaje.includes('posterior'))) {
      return `📅 ${mensaje}`;
    }

    // Errores de cupos
    if (mensaje.includes('cupo') && (mensaje.includes('lleno') || mensaje.includes('excedido'))) {
      return `👥 ${mensaje}`;
    }

    // Mensaje genérico con contexto
    return `❌ ${mensaje}`;
  }

  /**
   * Procesa errores por código de estado HTTP
   */
  private procesarErrorPorStatus(status: number): string {
    switch (status) {
      case 400:
        return '❌ Datos inválidos enviados al servidor';
      case 401:
        return '🔐 No tienes autorización para realizar esta acción';
      case 403:
        return '🚫 Acceso denegado - No tienes permisos suficientes';
      case 404:
        return '🔍 Recurso no encontrado';
      case 409:
        return '🔄 Conflicto - El recurso ya existe o está en uso';
      case 422:
        return '📝 Error de validación - Verifica los datos ingresados';
      case 500:
        return '⚠️ Error interno del servidor - Intenta más tarde';
      case 503:
        return '🔧 Servicio no disponible temporalmente';
      default:
        return '❌ Error inesperado del servidor';
    }
  }

  /**
   * Determina si un error es de validación (warning) o crítico (error)
   */
  private esErrorDeValidacion(mensaje: string): boolean {
    const erroresValidacion = [
      'debe tener',
      'es requerido',
      'es obligatorio',
      'debe ser mayor a',
      'debe ser menor a',
      'fecha anterior',
      'fecha posterior',
      'solo se puede cambiar a'
    ];

    return erroresValidacion.some(palabra => mensaje.toLowerCase().includes(palabra));
  }

  /**
   * Muestra el mensaje de error al usuario
   */
  private mostrarMensaje(mensaje: string, tipo: 'error' | 'warning'): void {
    const config = {
      duration: tipo === 'warning' ? 5000 : 7000,
      panelClass: [`error-snackbar-${tipo}`],
      horizontalPosition: 'center' as const,
      verticalPosition: 'top' as const
    };

    this.snackBar.open(mensaje, 'Cerrar', config);
  }

  /**
   * Maneja errores de cambio de estado con validaciones específicas
   */
  handleCambioEstadoError(error: any, estadoActual: string, nuevoEstado: string): void {
    console.error('❌ Error cambiando estado:', error);

    let mensaje = 'No se pudo cambiar el estado del curso';

    if (error.error?.message) {
      // Si el backend ya proporciona un mensaje específico, usarlo
      mensaje = this.procesarMensajeEspecifico(error.error.message, error.error);
    } else {
      // Si no, generar mensaje basado en validaciones del frontend
      const esTransicionValida = this.cursoEstadosService.validarTransicionEstado(estadoActual, nuevoEstado);
      
      if (!esTransicionValida) {
        const estadosPermitidos = this.cursoEstadosService.getEstadosPermitidos(estadoActual);
        mensaje = this.cursoEstadosService.getMensajeErrorTransicion(estadoActual, nuevoEstado);
      }
    }

    this.mostrarMensaje(mensaje, 'warning');
  }

  /**
   * Maneja errores de permisos
   */
  handlePermisoError(error: any, estado: string, rol: string, operacion: string): void {
    console.error('❌ Error de permisos:', error);

    let mensaje = 'No tienes permisos para realizar esta acción';

    if (error.error?.message) {
      mensaje = this.procesarMensajeEspecifico(error.error.message, error.error);
    } else {
      mensaje = this.cursoEstadosService.getMensajeErrorPermiso(estado, rol, operacion);
    }

    this.mostrarMensaje(mensaje, 'error');
  }

  /**
   * Maneja errores de conexión
   */
  handleConexionError(): void {
    const mensaje = '🌐 Error de conexión - Verifica tu internet y vuelve a intentar';
    this.mostrarMensaje(mensaje, 'error');
  }

  /**
   * Maneja errores de carga de datos
   */
  handleCargaError(entidad: string): void {
    const mensaje = `📊 No se pudieron cargar los ${entidad} - Intenta recargar la página`;
    this.mostrarMensaje(mensaje, 'warning');
  }

  /**
   * Muestra mensaje de éxito
   */
  mostrarExito(mensaje: string): void {
    const config = {
      duration: 4000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center' as const,
      verticalPosition: 'top' as const
    };

    this.snackBar.open(`✅ ${mensaje}`, 'Cerrar', config);
  }

  /**
   * Muestra mensaje informativo
   */
  mostrarInfo(mensaje: string): void {
    const config = {
      duration: 5000,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'center' as const,
      verticalPosition: 'top' as const
    };

    this.snackBar.open(`ℹ️ ${mensaje}`, 'Cerrar', config);
  }
}
