import { HttpResponse } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '@env/environment';
import { OficioRespuesta, SolicitudesBaseService } from './solicitudes-base.service';

/** Rol que revisa una bandeja, como lo espera el parámetro `rol` del backend. */
export type RolBandeja = 'funcionario' | 'coordinador' | 'secretaria';

/**
 * Flujo de aprobación funcionario → coordinador → secretaría que comparten
 * homologación y reingreso: bandejas por rol, cambios de estado y oficios.
 * Las rutas siguen la convención de EST-7: `GET /?rol=…&bandeja=pendientes|procesadas`,
 * `PUT /{id}/estado` y `/{id}/oficios`.
 * @typeParam S tipo de solicitud que devuelve el backend
 */
export abstract class SolicitudesAprobacionService<S> extends SolicitudesBaseService {
  /** @param recurso recurso bajo /api, p. ej. 'solicitudes-homologacion' */
  protected constructor(recurso: string) {
    super(`${environment.apiUrl}/${recurso}`);
  }

  // ---------- Bandejas ----------

  /** Pendientes del funcionario (último estado ENVIADA). */
  getPendingRequests(periodoAcademico?: string): Observable<S[]> {
    return this.bandeja('funcionario', 'pendientes', periodoAcademico);
  }

  getCoordinadorRequests(periodoAcademico?: string): Observable<S[]> {
    return this.bandeja('coordinador', 'pendientes', periodoAcademico);
  }

  /** Pendientes de secretaría (aprobadas por el coordinador). */
  getSecretariaRequests(periodoAcademico?: string): Observable<S[]> {
    return this.bandeja('secretaria', 'pendientes', periodoAcademico);
  }

  /** Las que la secretaría ya aprobó (APROBADA). */
  getSecretariaApprovedRequests(periodoAcademico?: string): Observable<S[]> {
    return this.bandeja('secretaria', 'procesadas', periodoAcademico);
  }

  /** Historial del funcionario (APROBADA_FUNCIONARIO). Si falla, lista vacía. */
  getSolicitudesProcesadasFuncionario(periodoAcademico?: string): Observable<S[]> {
    return this.oVacio(this.bandeja('funcionario', 'procesadas', periodoAcademico), 'funcionario');
  }

  /** Historial del coordinador (APROBADA_COORDINADOR). Si falla, lista vacía. */
  getSolicitudesProcesadasCoordinador(periodoAcademico?: string): Observable<S[]> {
    return this.oVacio(this.bandeja('coordinador', 'procesadas', periodoAcademico), 'coordinador');
  }

  /** GET /?rol=…&bandeja=…; el período solo se envía si viene (si no, el backend usa el actual o todos). */
  protected bandeja(rol: RolBandeja, bandeja: 'pendientes' | 'procesadas', periodoAcademico?: string): Observable<S[]> {
    const params = this.paramsPeriodo(periodoAcademico).set('rol', rol).set('bandeja', bandeja);
    return this.http.get<S[]>(this.apiUrl, { params });
  }

  private oVacio(listado: Observable<S[]>, rol: RolBandeja): Observable<S[]> {
    return listado.pipe(
      catchError((error) => {
        this.logger.error(`Error obteniendo las procesadas de ${rol}`, error);
        return of([] as S[]);
      })
    );
  }

  // ---------- Cambios de estado ----------

  /** Funcionario aprueba. */
  approveRequest(idSolicitud: number): Observable<unknown> {
    return this.cambiarEstado(idSolicitud, 'APROBADA_FUNCIONARIO');
  }

  /** Funcionario termina la validación y la pasa al coordinador. */
  completeValidation(idSolicitud: number): Observable<unknown> {
    return this.cambiarEstado(idSolicitud, 'EN_REVISION_COORDINADOR');
  }

  approveAsCoordinador(idSolicitud: number): Observable<unknown> {
    return this.cambiarEstado(idSolicitud, 'APROBADA_COORDINADOR');
  }

  /** Aprobación final (secretaría). */
  approveDefinitively(idSolicitud: number): Observable<unknown> {
    return this.cambiarEstado(idSolicitud, 'APROBADA');
  }

  /** Rechazo, desde cualquier rol que revisa. */
  rejectRequest(idSolicitud: number, motivo: string): Observable<unknown> {
    return this.cambiarEstado(idSolicitud, 'RECHAZADA', motivo);
  }

  // ---------- Oficios ----------

  obtenerOficios(idSolicitud: number): Observable<OficioRespuesta[]> {
    return this.http.get<OficioRespuesta[]>(`${this.apiUrl}/${idSolicitud}/oficios`);
  }

  descargarOficio(idSolicitud: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${idSolicitud}/oficios/archivo`, { responseType: 'blob' });
  }

  /** Como descargarOficio, pero con la respuesta entera para leer el nombre en Content-Disposition. */
  descargarOficioConNombre(idSolicitud: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${idSolicitud}/oficios/archivo`, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  /** Sube un PDF al endpoint genérico de archivos, asociado a la solicitud si se indica. */
  subirArchivoPDF(archivo: File, idSolicitud?: number): Observable<unknown> {
    return this.subirPdf(`${this.api}/archivos`, archivo, idSolicitud ? { idSolicitud: String(idSolicitud) } : {});
  }
}
