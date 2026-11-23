import { HttpClient, HttpParams } from '@angular/common/http';
import { LOCALE_ID, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '@env/environment';
import { tamanoEnMb } from '../../utils/texto.util';
import { LoggerService } from '../logger.service';

/** Documento como lo devuelve /documentos/{id} (el visor solo usa el comentario). */
export interface DocumentoConComentario {
  comentario?: string | null;
}

/** Oficio como lo devuelve /{idSolicitud}/oficios. */
export interface OficioRespuesta {
  /** El backend envía aquí el id de la solicitud, no el del documento. */
  id: number;
  nombre: string;
  nombreArchivo?: string;
  ruta?: string;
  fecha?: string;
}

/** Error con la forma de un HttpErrorResponse, para que los componentes lo traten igual. */
export interface ErrorArchivo {
  status: number;
  error: { message: string };
}

const TAMANO_MAXIMO_PDF = 10 * 1024 * 1024; // 10 MB

/** Comprueba que el archivo sea un PDF de 10 MB como máximo. `locale` da el separador decimal del tamaño. */
export function validarPdf(archivo: File, locale: string): ErrorArchivo | null {
  if (archivo.size > TAMANO_MAXIMO_PDF) {
    const mb = tamanoEnMb(archivo.size, locale);
    return {
      status: 413,
      error: { message: `El archivo es demasiado grande. Tamaño máximo: 10MB. Tamaño actual: ${mb}MB` },
    };
  }
  if (!archivo.name.toLowerCase().endsWith('.pdf')) {
    return { status: 415, error: { message: 'Solo se permiten archivos PDF' } };
  }
  return null;
}

/**
 * Base de los servicios de solicitudes (homologación, reingreso, paz y salvo, ECAES).
 * Reúne lo que comparten: descargas y comentarios de documentos, cambios de estado y
 * bandejas filtradas por período. El token lo añade JwtInterceptor.
 */
export abstract class SolicitudesBaseService {
  protected readonly http = inject(HttpClient);
  protected readonly logger = inject(LoggerService);
  protected readonly locale = inject(LOCALE_ID);
  protected readonly api = environment.apiUrl;

  /** @param apiUrl URL del recurso, p. ej. `${environment.apiUrl}/solicitudes-homologacion` */
  protected constructor(protected readonly apiUrl: string) {}

  // ---------- Documentos (los usa documentation-viewer a través de [servicio]) ----------

  descargarArchivo(nombreArchivo: string): Observable<Blob> {
    return this.http.get(`${this.api}/archivos?nombre=${encodeURIComponent(nombreArchivo)}`, {
      responseType: 'blob',
    });
  }

  /** Por id de documento: más confiable que por nombre. */
  descargarArchivoPorId(idDocumento: number): Observable<Blob> {
    return this.http.get(`${this.api}/documentos/${idDocumento}/archivo`, { responseType: 'blob' });
  }

  /** Por la ruta guardada en la base de datos (se descarga por el nombre del archivo). */
  descargarArchivoPorRuta(rutaDocumento: string): Observable<Blob> {
    return this.descargarArchivo(rutaDocumento.split('/').pop() || rutaDocumento);
  }

  /** Comentario actual del documento, antes de añadir otro. */
  buscarDocumentoPorId(idDocumento: number): Observable<DocumentoConComentario> {
    return this.http.get<DocumentoConComentario>(`${this.api}/documentos/${idDocumento}`);
  }

  agregarComentario(idDocumento: number, comentario: string): Observable<unknown> {
    return this.http.put(`${this.api}/documentos/${idDocumento}/comentarios`, { comentario });
  }

  // ---------- Ayudas para las subclases ----------

  /** PUT /{id}/estado (convención de rutas EST-7): el id va en la ruta y no en el cuerpo. */
  protected cambiarEstado(idSolicitud: number, nuevoEstado: string, comentario?: string): Observable<unknown> {
    const body: { nuevoEstado: string; comentario?: string } = { nuevoEstado };
    if (comentario !== undefined) body.comentario = comentario;
    return this.http.put(`${this.apiUrl}/${idSolicitud}/estado`, body);
  }

  protected paramsPeriodo(periodoAcademico?: string): HttpParams {
    const params = new HttpParams();
    return periodoAcademico ? params.set('periodoAcademico', periodoAcademico) : params;
  }

  /** Sube un PDF tras validarlo; los campos extra van en el mismo FormData. */
  protected subirPdf<T>(url: string, archivo: File, extra: Record<string, string> = {}): Observable<T> {
    const error = validarPdf(archivo, this.locale);
    if (error) return throwError(() => error);
    const formData = new FormData();
    formData.append('file', archivo);
    for (const [clave, valor] of Object.entries(extra)) formData.append(clave, valor);
    return this.http.post<T>(url, formData);
  }
}
