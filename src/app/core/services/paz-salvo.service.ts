import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { Solicitud, Archivo, SolicitudHomologacionDTORespuesta } from '../models/procesos.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { nombreDeContentDisposition } from '../utils/download.util';

type Solicitudes = Observable<SolicitudHomologacionDTORespuesta[]>;

/** Respuesta de /obtenerComentarios: solo trae los comentarios que existen. */
export interface ComentariosPazSalvo {
  comentarioRechazo?: string;
  documentosConComentarios?: Array<{ id: number; nombre: string; comentario: string }>;
  mensaje?: string;
}

/** Bandejas por rol del endpoint listarSolicitud-PazYSalvo/{rol}. */
/** Documento como lo devuelven obtenerOficios y obtenerDocumentos/coordinador. */
export interface DocumentoPazSalvoRespuesta {
  /** En obtenerOficios el backend envía aquí el id de la solicitud, no el del documento. */
  id: number;
  nombre: string;
  nombreArchivo?: string;
  ruta?: string;
  fecha?: string;
  esValido?: boolean;
  comentario?: string | null;
}

/** Respuesta de /subir-documento (el documento queda sin asociar). */
export interface DocumentoSubidoPazSalvo {
  success: boolean;
  message: string;
  documento_id: number;
  nombre: string;
  fecha: string;
}

/** Blob descargado con el nombre de archivo que indicó el servidor. */
export type BlobConNombre = Blob & { filename?: string };

/** Validez de un documento al aprobar o rechazar. */
export interface ValidezDocumento {
  id_documento: number;
  esValido: boolean;
}

const BANDEJA_POR_ROL: Record<string, string> = {
  FUNCIONARIO: 'Funcionario',
  COORDINADOR: 'Coordinador',
  SECRETARIA: 'Secretaria',
  SECRETARIO: 'Secretaria'
};

const TAMANO_MAXIMO_PDF = 10 * 1024 * 1024; // 10 MB

/**
 * Solicitudes de paz y salvo. El token lo añade JwtInterceptor a todas las peticiones.
 */
@Injectable({
  providedIn: 'root'
})
export class PazSalvoService {
  private apiUrl = `${environment.apiUrl}/solicitudes-pazysalvo`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  // ================================
  // Listados
  // ================================

  /**
   * Solicitudes según el rol. El estudiante usa /porRol con su id; los demás roles, su bandeja.
   * @param periodoAcademico formato "YYYY-P"; si no se envía, el backend usa el período actual.
   */
  listarSolicitudesPorRol(rol: string, idUsuario?: number, periodoAcademico?: string): Solicitudes {
    const rolUpper = rol.toUpperCase();
    if (rolUpper === 'ESTUDIANTE') {
      const params = this.paramsPeriodo(periodoAcademico)
        .set('rol', 'ESTUDIANTE')
        .set('idUsuario', idUsuario?.toString() || '');
      return this.http.get<SolicitudHomologacionDTORespuesta[]>(`${this.apiUrl}/listarSolicitud-PazYSalvo/porRol`, { params });
    }
    return this.bandeja(BANDEJA_POR_ROL[rolUpper] ?? '', periodoAcademico);
  }

  /** Pendientes del funcionario (último estado ENVIADA). */
  getPendingRequests(periodoAcademico?: string): Solicitudes {
    return this.bandeja('Funcionario', periodoAcademico);
  }

  getCoordinatorRequests(periodoAcademico?: string): Solicitudes {
    return this.bandeja('Coordinador', periodoAcademico);
  }

  /** Pendientes de secretaría (APROBADA_COORDINADOR). */
  getSecretariaRequests(periodoAcademico?: string): Solicitudes {
    return this.bandeja('Secretaria', periodoAcademico);
  }

  /** Historial del funcionario (APROBADA_FUNCIONARIO). Si falla, lista vacía. */
  getSolicitudesProcesadasFuncionario(periodoAcademico?: string): Solicitudes {
    return this.historial('Funcionario', periodoAcademico);
  }

  /** Historial del coordinador (APROBADA_COORDINADOR). Si falla, lista vacía. */
  getSolicitudesProcesadasCoordinador(periodoAcademico?: string): Solicitudes {
    return this.historial('Coordinador', periodoAcademico);
  }

  /** Historial de secretaría (APROBADA, ya enviadas al estudiante). Si falla, lista vacía. */
  getSolicitudesProcesadasSecretaria(periodoAcademico?: string): Solicitudes {
    return this.historial('Secretaria', periodoAcademico);
  }

  private bandeja(rol: string, periodoAcademico?: string): Solicitudes {
    const params = this.paramsPeriodo(periodoAcademico);
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(
      `${this.apiUrl}/listarSolicitud-PazYSalvo/${rol}`,
      params.keys().length > 0 ? { params } : {}
    );
  }

  private historial(rol: string, periodoAcademico?: string): Solicitudes {
    return this.bandeja(`${rol}/Aprobadas`, periodoAcademico).pipe(catchError(() => of([])));
  }

  private paramsPeriodo(periodoAcademico?: string): HttpParams {
    const params = new HttpParams();
    return periodoAcademico ? params.set('periodoAcademico', periodoAcademico) : params;
  }

  // ================================
  // Crear solicitud y cambiar estado
  // ================================

  /**
   * Crea la solicitud. Los documentos ya se subieron con subirDocumento; el backend los asocia.
   */
  crearSolicitudConFormulario(
    studentId: number,
    archivos: Archivo[],
    datosFormulario: {
      nombre_solicitud: string;
      fecha_registro_solicitud: string;
      periodo_academico?: string;
      titulo_trabajo_grado?: string;
      director_trabajo_grado?: string;
    }
  ): Observable<Solicitud> {
    const usuario = this.authService.getUsuario();
    if (!usuario) throw new Error('Usuario no autenticado');

    let nombreSolicitud = datosFormulario.nombre_solicitud;
    if (!nombreSolicitud.includes('Solicitud Paz y Salvo -')) {
      const nombreUsuario = (usuario.nombre_completo || usuario.nombre || '').trim() || 'Usuario';
      nombreSolicitud = `Solicitud Paz y Salvo - ${nombreUsuario}`;
    }

    const body: {
      idUsuario: number;
      nombre_solicitud: string;
      fecha_registro_solicitud: string;
      periodo_academico?: string;
      titulo_trabajo_grado?: string;
      director_trabajo_grado?: string;
    } = {
      idUsuario: studentId,
      nombre_solicitud: nombreSolicitud,
      fecha_registro_solicitud: datosFormulario.fecha_registro_solicitud
    };
    if (datosFormulario.periodo_academico) {
      body.periodo_academico = datosFormulario.periodo_academico;
    }
    const titulo = datosFormulario.titulo_trabajo_grado?.trim();
    if (titulo) body.titulo_trabajo_grado = titulo;
    const director = datosFormulario.director_trabajo_grado?.trim();
    if (director) body.director_trabajo_grado = director;

    return this.http.post<Solicitud>(`${this.apiUrl}/crearSolicitud-PazYSalvo`, body);
  }

  /** Funcionario aprueba. */
  approveRequest(requestId: number): Observable<unknown> {
    return this.cambiarEstado(requestId, 'APROBADA_FUNCIONARIO');
  }

  /** Aprobación del coordinador. */
  approveAsCoordinador(requestId: number): Observable<unknown> {
    return this.cambiarEstado(requestId, 'APROBADA_COORDINADOR');
  }

  /** Aprobación definitiva (secretaría, al enviar el oficio). */
  approveDefinitively(idSolicitud: number): Observable<unknown> {
    return this.cambiarEstado(idSolicitud, 'APROBADA');
  }

  rejectRequest(requestId: number, reason: string): Observable<unknown> {
    return this.cambiarEstado(requestId, 'RECHAZADA', reason);
  }

  private cambiarEstado(idSolicitud: number, nuevoEstado: string, comentario?: string): Observable<unknown> {
    const body: { idSolicitud: number; nuevoEstado: string; comentario?: string } = { idSolicitud, nuevoEstado };
    if (comentario !== undefined) body.comentario = comentario;
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, body);
  }

  /** Marca cada documento como válido o no válido. */
  actualizarEstadoDocumentos(idSolicitud: number, documentos: ValidezDocumento[]): Observable<unknown> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoDocumentos`, { idSolicitud, documentos });
  }

  // ================================
  // Comentarios
  // ================================

  obtenerComentarios(idSolicitud: number): Observable<ComentariosPazSalvo> {
    return this.http.get<ComentariosPazSalvo>(`${this.apiUrl}/obtenerComentarios/${idSolicitud}`).pipe(
      catchError(() => of({ mensaje: 'Error al obtener comentarios' }))
    );
  }

  /** GET /api/documentos/buscarPorId/{id}: comentario actual antes de añadir otro (documentation-viewer). */
  buscarDocumentoPorId(idDocumento: number): Observable<{ comentario?: string | null }> {
    return this.http.get<{ comentario?: string | null }>(`${environment.apiUrl}/documentos/buscarPorId/${idDocumento}`);
  }

  agregarComentario(idDocumento: number, comentario: string): Observable<unknown> {
    return this.http.put(`${environment.apiUrl}/documentos/añadirComentario`, { idDocumento, comentario });
  }

  // ================================
  // Documentos y oficios
  // ================================

  /** Sube un documento SIN asociarlo: el backend lo asocia al crear la solicitud. */
  subirDocumento(archivo: File): Observable<DocumentoSubidoPazSalvo> {
    const error = this.validarPdf(archivo);
    if (error) return throwError(() => error);

    const formData = new FormData();
    formData.append('file', archivo);
    return this.http.post<DocumentoSubidoPazSalvo>(`${this.apiUrl}/subir-documento`, formData);
  }

  /** Secretaría sube el oficio firmado en PDF. */
  subirOficioPdf(idSolicitud: number, archivo: File): Observable<unknown> {
    const formData = new FormData();
    formData.append('file', archivo);
    return this.http.post(`${this.apiUrl}/subir-oficio-pdf/${idSolicitud}`, formData);
  }

  /** Documentos de la solicitud que ve secretaría (oficios). */
  obtenerOficios(idSolicitud: number): Observable<DocumentoPazSalvoRespuesta[]> {
    return this.http.get<DocumentoPazSalvoRespuesta[]>(`${this.apiUrl}/obtenerOficios/${idSolicitud}`);
  }

  /** Documentos de la solicitud que revisa el coordinador. */
  obtenerDocumentosCoordinador(idSolicitud: number): Observable<DocumentoPazSalvoRespuesta[]> {
    return this.http.get<DocumentoPazSalvoRespuesta[]>(`${this.apiUrl}/obtenerDocumentos/coordinador/${idSolicitud}`);
  }

  /**
   * Oficio de la solicitud. El nombre sale de Content-Disposition o, si no viene,
   * del primer oficio de la solicitud. Queda en `blob.filename`.
   */
  descargarOficioPorSolicitud(idSolicitud: number): Observable<BlobConNombre> {
    return this.http.get(`${this.apiUrl}/descargarOficio/${idSolicitud}`, { responseType: 'blob', observe: 'response' }).pipe(
      switchMap(resp => {
        const nombre = this.nombreDesdeCabeceras(resp);
        if (nombre) return of(this.conNombre(resp.body!, nombre));
        return this.obtenerOficios(idSolicitud).pipe(
          map(oficios => this.conNombre(resp.body!, oficios?.[0]?.nombreArchivo || oficios?.[0]?.nombre || `oficio_${idSolicitud}.pdf`))
        );
      })
    );
  }

  // Descargas que usa documentation-viewer (recibe el servicio como [servicio])

  descargarArchivo(nombreArchivo: string): Observable<BlobConNombre> {
    return this.descargarConNombre(this.urlDescargaPorNombre(nombreArchivo), nombreArchivo || 'oficio.pdf');
  }

  /** Por id de documento: más confiable que por nombre. */
  descargarArchivoPorId(idDocumento: number): Observable<BlobConNombre> {
    return this.descargarConNombre(`${environment.apiUrl}/documentos/${idDocumento}/descargar`, 'documento.pdf');
  }

  /** Por la ruta guardada en la base de datos. */
  descargarArchivoPorRuta(rutaDocumento: string): Observable<BlobConNombre> {
    const nombreArchivo = rutaDocumento.split('/').pop() || rutaDocumento;
    return this.descargarConNombre(this.urlDescargaPorNombre(nombreArchivo), nombreArchivo || 'documento.pdf');
  }

  private urlDescargaPorNombre(nombreArchivo: string): string {
    return `${this.apiUrl}/descargar-documento?filename=${encodeURIComponent(nombreArchivo)}`;
  }

  private descargarConNombre(url: string, nombrePorDefecto: string): Observable<BlobConNombre> {
    return this.http.get(url, { responseType: 'blob', observe: 'response' }).pipe(
      map(resp => this.conNombre(resp.body!, this.nombreDesdeCabeceras(resp) || nombrePorDefecto))
    );
  }

  private conNombre(blob: Blob, nombre: string): BlobConNombre {
    return Object.assign(blob, { filename: nombre });
  }

  private nombreDesdeCabeceras(resp: HttpResponse<Blob>): string | null {
    return nombreDeContentDisposition(resp.headers);
  }

  private validarPdf(archivo: File): { status: number; error: { message: string } } | null {
    if (archivo.size > TAMANO_MAXIMO_PDF) {
      const mb = (archivo.size / (1024 * 1024)).toFixed(2);
      return { status: 413, error: { message: `El archivo es demasiado grande. Tamaño máximo: 10MB. Tamaño actual: ${mb}MB` } };
    }
    if (!archivo.name.toLowerCase().endsWith('.pdf')) {
      return { status: 415, error: { message: 'Solo se permiten archivos PDF' } };
    }
    return null;
  }
}
