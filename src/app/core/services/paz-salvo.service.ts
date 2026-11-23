import { Injectable, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Observable, catchError, map, of, switchMap, throwError } from 'rxjs';
import { Solicitud, Archivo, SolicitudHomologacionDTORespuesta } from '../models/procesos.model';
import { AuthService } from './auth.service';
import { environment } from '@env/environment';
import { nombreDeContentDisposition } from '../utils/download.util';
import { SolicitudesBaseService, validarPdf } from './base/solicitudes-base.service';

type Solicitudes = Observable<SolicitudHomologacionDTORespuesta[]>;

/** Respuesta de /{id}/comentarios: solo trae los comentarios que existen. */
export interface ComentariosPazSalvo {
  comentarioRechazo?: string;
  documentosConComentarios?: { id: number; nombre: string; comentario: string }[];
  mensaje?: string;
}

/** Documento como lo devuelven /{id}/oficios y /{id}/documentos. */
export interface DocumentoPazSalvoRespuesta {
  /** En /{id}/oficios el backend envía aquí el id de la solicitud, no el del documento. */
  id: number;
  nombre: string;
  nombreArchivo?: string;
  ruta?: string;
  fecha?: string;
  esValido?: boolean;
  comentario?: string | null;
}

/** Respuesta de POST /documentos (el documento queda sin asociar). */
export interface DocumentoSubidoPazSalvo {
  success: boolean;
  message: string;
  documento_id: number;
  nombre: string;
  fecha: string;
}

/** Blob descargado con el nombre de archivo que indicó el servidor. */
export type BlobConNombre = Blob & { filename?: string };

const BANDEJA_POR_ROL: Record<string, string> = {
  FUNCIONARIO: 'funcionario',
  COORDINADOR: 'coordinador',
  SECRETARIA: 'secretaria',
  SECRETARIO: 'secretaria',
};

/**
 * Solicitudes de paz y salvo. El token lo añade JwtInterceptor a todas las peticiones.
 */
@Injectable({
  providedIn: 'root',
})
export class PazSalvoService extends SolicitudesBaseService {
  private readonly authService = inject(AuthService);

  constructor() {
    super(`${environment.apiUrl}/solicitudes-pazysalvo`);
  }

  // ================================
  // Listados
  // ================================

  /**
   * Solicitudes según el rol. El estudiante usa GET /?rol=ESTUDIANTE con su id; los demás roles, su bandeja.
   * @param periodoAcademico formato "YYYY-P"; si no se envía, el backend usa el período actual.
   */
  listarSolicitudesPorRol(rol: string, idUsuario?: number, periodoAcademico?: string): Solicitudes {
    const rolUpper = rol.toUpperCase();
    if (rolUpper === 'ESTUDIANTE') {
      const params = this.paramsPeriodo(periodoAcademico)
        .set('rol', 'ESTUDIANTE')
        .set('idUsuario', idUsuario?.toString() || '');
      return this.http.get<SolicitudHomologacionDTORespuesta[]>(this.apiUrl, { params });
    }
    return this.bandeja(BANDEJA_POR_ROL[rolUpper] ?? '', periodoAcademico);
  }

  /** Pendientes del funcionario (último estado ENVIADA). */
  getPendingRequests(periodoAcademico?: string): Solicitudes {
    return this.bandeja('funcionario', periodoAcademico);
  }

  getCoordinadorRequests(periodoAcademico?: string): Solicitudes {
    return this.bandeja('coordinador', periodoAcademico);
  }

  /** Pendientes de secretaría (APROBADA_COORDINADOR). */
  getSecretariaRequests(periodoAcademico?: string): Solicitudes {
    return this.bandeja('secretaria', periodoAcademico);
  }

  /** Historial del funcionario (pasaron por APROBADA_FUNCIONARIO). Si falla, lista vacía. */
  getSolicitudesProcesadasFuncionario(periodoAcademico?: string): Solicitudes {
    return this.historial('funcionario', periodoAcademico);
  }

  /** Historial del coordinador (pasaron por APROBADA_COORDINADOR). Si falla, lista vacía. */
  getSolicitudesProcesadasCoordinador(periodoAcademico?: string): Solicitudes {
    return this.historial('coordinador', periodoAcademico);
  }

  /** Historial de secretaría (APROBADA, ya enviadas al estudiante). Si falla, lista vacía. */
  getSolicitudesProcesadasSecretaria(periodoAcademico?: string): Solicitudes {
    return this.historial('secretaria', periodoAcademico);
  }

  /** Pendientes del rol: GET /solicitudes-pazysalvo?rol=…&bandeja=pendientes (convención de rutas EST-7). */
  private bandeja(rol: string, periodoAcademico?: string): Solicitudes {
    const params = this.paramsPeriodo(periodoAcademico).set('rol', rol).set('bandeja', 'pendientes');
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(this.apiUrl, { params });
  }

  /** Procesadas por el rol: GET /solicitudes-pazysalvo?rol=…&bandeja=procesadas (convención de rutas EST-7). */
  private historial(rol: string, periodoAcademico?: string): Solicitudes {
    const params = this.paramsPeriodo(periodoAcademico).set('rol', rol).set('bandeja', 'procesadas');
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(this.apiUrl, { params }).pipe(
      catchError((error) => {
        this.logger.error(`Error obteniendo las procesadas de ${rol}`, error);
        return of([] as SolicitudHomologacionDTORespuesta[]);
      })
    );
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
      const nombreUsuario = (usuario.nombre_completo || '').trim() || 'Usuario';
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
      fecha_registro_solicitud: datosFormulario.fecha_registro_solicitud,
    };
    if (datosFormulario.periodo_academico) {
      body.periodo_academico = datosFormulario.periodo_academico;
    }
    const titulo = datosFormulario.titulo_trabajo_grado?.trim();
    if (titulo) body.titulo_trabajo_grado = titulo;
    const director = datosFormulario.director_trabajo_grado?.trim();
    if (director) body.director_trabajo_grado = director;

    return this.http.post<Solicitud>(this.apiUrl, body);
  }

  /** Paz y salvo usa PUT /{id}/estado (EST-7, paso 7a): el id va en la ruta y no en el cuerpo. */
  protected override cambiarEstado(idSolicitud: number, nuevoEstado: string, comentario?: string): Observable<unknown> {
    const body: { nuevoEstado: string; comentario?: string } = { nuevoEstado };
    if (comentario !== undefined) body.comentario = comentario;
    return this.http.put(`${this.apiUrl}/${idSolicitud}/estado`, body);
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

  // ================================
  // Comentarios
  // ================================

  obtenerComentarios(idSolicitud: number): Observable<ComentariosPazSalvo> {
    return this.http
      .get<ComentariosPazSalvo>(`${this.apiUrl}/${idSolicitud}/comentarios`)
      .pipe(catchError(() => of({ mensaje: 'Error al obtener comentarios' })));
  }

  // ================================
  // Documentos y oficios
  // ================================

  /** Sube un documento SIN asociarlo: el backend lo asocia al crear la solicitud. */
  subirDocumento(archivo: File): Observable<DocumentoSubidoPazSalvo> {
    const error = validarPdf(archivo, this.locale);
    if (error) return throwError(() => error);

    const formData = new FormData();
    formData.append('file', archivo);
    return this.http.post<DocumentoSubidoPazSalvo>(`${this.apiUrl}/documentos`, formData);
  }

  /** Secretaría sube el oficio firmado en PDF. */
  subirOficioPdf(idSolicitud: number, archivo: File): Observable<unknown> {
    const formData = new FormData();
    formData.append('file', archivo);
    return this.http.post(`${this.apiUrl}/${idSolicitud}/oficios`, formData);
  }

  /** Documentos de la solicitud que ve secretaría (oficios). */
  obtenerOficios(idSolicitud: number): Observable<DocumentoPazSalvoRespuesta[]> {
    return this.http.get<DocumentoPazSalvoRespuesta[]>(`${this.apiUrl}/${idSolicitud}/oficios`);
  }

  /** Documentos de la solicitud que revisa el coordinador. */
  obtenerDocumentosCoordinador(idSolicitud: number): Observable<DocumentoPazSalvoRespuesta[]> {
    return this.http.get<DocumentoPazSalvoRespuesta[]>(`${this.apiUrl}/${idSolicitud}/documentos`);
  }

  /**
   * Oficio de la solicitud. El nombre sale de Content-Disposition o, si no viene,
   * del primer oficio de la solicitud. Queda en `blob.filename`.
   */
  descargarOficioPorSolicitud(idSolicitud: number): Observable<BlobConNombre> {
    return this.http
      .get(`${this.apiUrl}/${idSolicitud}/oficios/archivo`, { responseType: 'blob', observe: 'response' })
      .pipe(
        switchMap((resp) => {
          const nombre = this.nombreDesdeCabeceras(resp);
          if (nombre) return of(this.conNombre(resp.body!, nombre));
          return this.obtenerOficios(idSolicitud).pipe(
            map((oficios) =>
              this.conNombre(
                resp.body!,
                oficios?.[0]?.nombreArchivo || oficios?.[0]?.nombre || `oficio_${idSolicitud}.pdf`
              )
            )
          );
        })
      );
  }

  // Descargas que usa documentation-viewer. Paz y salvo descarga por su propio endpoint
  // y devuelve el nombre del archivo, por eso redefine las de la base.

  override descargarArchivo(nombreArchivo: string): Observable<BlobConNombre> {
    return this.descargarConNombre(this.urlDescargaPorNombre(nombreArchivo), nombreArchivo || 'oficio.pdf');
  }

  /** Por id de documento: más confiable que por nombre. */
  override descargarArchivoPorId(idDocumento: number): Observable<BlobConNombre> {
    return this.descargarConNombre(`${this.api}/documentos/${idDocumento}/archivo`, 'documento.pdf');
  }

  /** Por la ruta guardada en la base de datos. */
  override descargarArchivoPorRuta(rutaDocumento: string): Observable<BlobConNombre> {
    const nombreArchivo = rutaDocumento.split('/').pop() || rutaDocumento;
    return this.descargarConNombre(this.urlDescargaPorNombre(nombreArchivo), nombreArchivo || 'documento.pdf');
  }

  private urlDescargaPorNombre(nombreArchivo: string): string {
    return `${this.apiUrl}/documentos?nombre=${encodeURIComponent(nombreArchivo)}`;
  }

  private descargarConNombre(url: string, nombrePorDefecto: string): Observable<BlobConNombre> {
    return this.http
      .get(url, { responseType: 'blob', observe: 'response' })
      .pipe(map((resp) => this.conNombre(resp.body!, this.nombreDesdeCabeceras(resp) || nombrePorDefecto)));
  }

  private conNombre(blob: Blob, nombre: string): BlobConNombre {
    return Object.assign(blob, { filename: nombre });
  }

  private nombreDesdeCabeceras(resp: HttpResponse<Blob>): string | null {
    return nombreDeContentDisposition(resp.headers);
  }
}
