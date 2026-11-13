import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { OficioRespuesta, SolicitudesBaseService, ValidezDocumento } from './solicitudes-base.service';

/** Rutas propias de cada proceso; lo demás es igual en homologación y reingreso. */
export interface RutasProceso {
  /** Recurso bajo /api, p. ej. 'solicitudes-homologacion'. */
  recurso: string;
  /** Prefijo de las bandejas, p. ej. 'listarSolicitud-Homologacion'. */
  listar: string;
  /** Endpoint que cambia el estado. */
  estado: string;
  /** Tipo con que se genera el oficio, p. ej. 'OFICIO_HOMOLOGACION'. */
  tipoOficio: string;
}

/**
 * Flujo de aprobación funcionario → coordinador → secretaría que comparten
 * homologación y reingreso: bandejas por rol, cambios de estado y oficios.
 * @typeParam S tipo de solicitud que devuelve el backend
 */
export abstract class SolicitudesAprobacionService<S> extends SolicitudesBaseService {
  protected constructor(protected readonly rutas: RutasProceso) {
    super(`${environment.apiUrl}/${rutas.recurso}`, rutas.estado);
  }

  // ---------- Bandejas ----------

  /** Pendientes del funcionario (último estado ENVIADA). */
  getPendingRequests(periodoAcademico?: string): Observable<S[]> {
    return this.listar<S>(`${this.rutas.listar}/Funcionario`, periodoAcademico);
  }

  getCoordinadorRequests(periodoAcademico?: string): Observable<S[]> {
    return this.listar<S>(`${this.rutas.listar}/Coordinador`, periodoAcademico);
  }

  /** Pendientes de secretaría (aprobadas por el coordinador). */
  getSecretariaRequests(periodoAcademico?: string): Observable<S[]> {
    return this.listar<S>(`${this.rutas.listar}/Secretaria`, periodoAcademico);
  }

  getSecretariaApprovedRequests(periodoAcademico?: string): Observable<S[]> {
    return this.listar<S>(`${this.rutas.listar}/Secretaria/Aprobadas`, periodoAcademico);
  }

  /** Historial del funcionario (APROBADA_FUNCIONARIO). Si falla, lista vacía. */
  getSolicitudesProcesadasFuncionario(periodoAcademico?: string): Observable<S[]> {
    return this.listarOVacio<S>(`${this.rutas.listar}/Funcionario/Aprobadas`, periodoAcademico);
  }

  /** Historial del coordinador (APROBADA_COORDINADOR). Si falla, lista vacía. */
  getSolicitudesProcesadasCoordinador(periodoAcademico?: string): Observable<S[]> {
    return this.listarOVacio<S>(`${this.rutas.listar}/Coordinador/Aprobadas`, periodoAcademico);
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

  actualizarEstadoDocumentos(idSolicitud: number, documentos: ValidezDocumento[]): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoDocumentos`, { idSolicitud, documentos });
  }

  // ---------- Oficios ----------

  obtenerOficios(idSolicitud: number): Observable<OficioRespuesta[]> {
    return this.http.get<OficioRespuesta[]>(`${this.apiUrl}/obtenerOficios/${idSolicitud}`);
  }

  generarOficio(idSolicitud: number, contenido: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/generarOficio`, { idSolicitud, contenido, tipo: this.rutas.tipoOficio });
  }

  descargarOficio(idSolicitud: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/descargarOficio/${idSolicitud}`, { responseType: 'blob' });
  }

  /** Como descargarOficio, pero con la respuesta entera para leer el nombre en Content-Disposition. */
  descargarOficioConNombre(idSolicitud: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/descargarOficio/${idSolicitud}`, { responseType: 'blob', observe: 'response' });
  }

  /** Sube un PDF al endpoint genérico de archivos, asociado a la solicitud si se indica. */
  subirArchivoPDF(archivo: File, idSolicitud?: number): Observable<unknown> {
    return this.subirPdf(`${this.api}/archivos/subir/pdf`, archivo, idSolicitud ? { idSolicitud: String(idSolicitud) } : {});
  }
}
