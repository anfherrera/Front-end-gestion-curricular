import { HttpErrorResponse } from '@angular/common/http';

import { ErrorHandlerService, MENSAJE_SIN_CONEXION } from './error-handler.service';

describe('ErrorHandlerService', () => {
  const servicio = new ErrorHandlerService();
  const errorHttp = (status: number, error: unknown) => new HttpErrorResponse({ status, error });

  describe('extraerMensajeError', () => {
    it('sin respuesta (status 0, withFetch) da el mensaje de conexión y no "Failed to fetch"', () => {
      expect(servicio.extraerMensajeError(errorHttp(0, new TypeError('Failed to fetch')))).toBe(MENSAJE_SIN_CONEXION);
    });

    it('sin respuesta (status 0, XHR) da el mensaje de conexión', () => {
      expect(servicio.extraerMensajeError(errorHttp(0, new ProgressEvent('error')))).toBe(MENSAJE_SIN_CONEXION);
    });

    it('400 con regla de negocio da solo el texto de la regla', () => {
      const err = errorHttp(400, {
        mensaje: 'Violación a regla de negocio: Ya existe una solicitud',
        codigo: 'GC-0004',
      });
      expect(servicio.extraerMensajeError(err)).toBe('Ya existe una solicitud');
    });

    it('400 con mensajes por campo los une', () => {
      const err = errorHttp(400, { fecha_expedicion: 'Fecha no válida', numero_documento: 'Muy corto' });
      expect(servicio.extraerMensajeError(err)).toBe('Fecha no válida. Muy corto');
    });

    it('400 de cambio de estado rechazado da el texto de error', () => {
      const err = errorHttp(400, {
        estadoActual: 'APROBADA',
        codigo: 'TRANSICION_NO_PERMITIDA',
        error: 'No se puede pasar de APROBADA a RECHAZADA',
      });
      expect(servicio.extraerMensajeError(err)).toBe('No se puede pasar de APROBADA a RECHAZADA');
    });

    it('403 con texto de error lo muestra', () => {
      const err = errorHttp(403, {
        estadoActual: 'ENVIADA',
        codigo: 'ROL_NO_AUTORIZADO',
        error: 'El rol no puede decidir este paso',
      });
      expect(servicio.extraerMensajeError(err)).toBe('El rol no puede decidir este paso');
    });

    it('404 sin cuerpo da "Recurso no encontrado"', () => {
      expect(servicio.extraerMensajeError(errorHttp(404, null))).toBe('Recurso no encontrado');
    });

    it('500 usa el mensaje del backend si viene', () => {
      expect(servicio.extraerMensajeError(errorHttp(500, { message: 'Fallo interno' }))).toBe('Fallo interno');
    });

    it('otro estado sin cuerpo da el mensaje genérico', () => {
      expect(servicio.extraerMensajeError(errorHttp(502, null))).toBe('Ocurrió un error inesperado');
    });
  });
});
