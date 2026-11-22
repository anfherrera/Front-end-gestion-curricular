import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, throwError, map } from 'rxjs';
import { ApiEndpoints } from '../utils/api-endpoints';

export interface HistorialSolicitud {
  id_solicitud: number;
  nombre_solicitud: string;
  categoria?: string; // Categoría de la solicitud: "Cursos de Verano", "Paz y Salvo", "Reingreso", "Homologación", "ECAES", "Otro"
  periodo_academico: string;
  fecha_registro_solicitud: string;
  fecha_ceremonia?: string | null;
  tipo_solicitud?: string; // Tipo específico: "Preinscripcion", "Inscripcion", "Curso Nuevo", "Paz y Salvo", "Reingreso", "Homologacion", "ECAES", "Otro"
  tipo_solicitud_display?: string;
  estado_actual?: string;
  fecha_ultimo_estado?: string;
  total_estados?: number;
  total_documentos?: number;
  objUsuario?: {
    id_usuario: number;
    nombre_completo: string;
    codigo: string;
    cedula?: string;
    correo?: string;
    estado_usuario?: boolean;
    rol?: string | null;
    objPrograma?: { id_programa: number; nombre_programa: string } | null;
  };
  estadosSolicitud: {
    id_estado?: number;
    estado_actual: string;
    fecha_registro_estado: string;
    comentario?: string | null;
  }[];
  documentos?: unknown[];
}

/** Detalle de una solicitud, armado con `GET /api/solicitudes/{id}` (BUG-49). */
export interface EstadoDetalle {
  id_estado: number | null;
  estado_actual: string;
  fecha_registro_estado: string | null;
  comentario?: string | null;
}

export interface DocumentoDetalle {
  id_documento: number;
  nombre_documento: string;
  ruta_documento: string | null;
}

export interface DetalleSolicitud {
  id_solicitud: number;
  nombre_solicitud: string;
  periodo_academico: string | null;
  fecha_registro_solicitud: string | null;
  fecha_ceremonia?: string | null;
  /** Categoría deducida del nombre, como la columna Tipo del historial. */
  tipo_solicitud_display: string;
  estado_actual: string;
  fecha_ultimo_estado: string | null;
  usuario: {
    id_usuario: number;
    nombre_completo: string;
    codigo: string | null;
    correo?: string | null;
    cedula?: string | null;
  } | null;
  historial_estados: EstadoDetalle[];
  total_estados: number;
  documentos: DocumentoDetalle[];
  total_documentos: number;
}

/** Cuerpo de `GET /api/solicitudes/{id}` (`SolicitudDTORespuesta` del backend), con los campos que usa el detalle. */
interface SolicitudPorIdRespuesta {
  id_solicitud: number;
  nombre_solicitud: string | null;
  periodo_academico: string | null;
  fecha_registro_solicitud: string | null;
  fecha_ceremonia?: string | null;
  estadosSolicitud?: EstadoDetalle[] | null;
  objUsuario?: {
    id_usuario: number;
    nombre_completo: string;
    codigo: string | null;
    correo?: string | null;
    cedula?: string | null;
  } | null;
  documentos?: { id_documento: number; nombre: string; ruta_documento: string | null }[] | null;
}

/** Categoría de una solicitud a partir de su nombre ("Otro" si no se reconoce; "N/A" sin nombre). */
export function categoriaPorNombre(nombreSolicitud: string | null | undefined): string {
  if (!nombreSolicitud) return 'N/A';
  if (nombreSolicitud.includes('Reingreso')) return 'Reingreso';
  if (nombreSolicitud.includes('Homologacion') || nombreSolicitud.includes('Homologación')) return 'Homologación';
  if (nombreSolicitud.includes('Paz y Salvo')) return 'Paz y Salvo';
  if (nombreSolicitud.includes('ECAES')) return 'ECAES';
  if (nombreSolicitud.includes('Curso Verano') || nombreSolicitud.includes('Curso Intersemestral'))
    return 'Cursos de Verano';
  return 'Otro';
}

/** Estados en orden cronológico; los que no tienen fecha van al principio, como hacía el backend. */
function ordenarEstados(estados: EstadoDetalle[]): EstadoDetalle[] {
  const instante = (e: EstadoDetalle) =>
    e.fecha_registro_estado ? new Date(e.fecha_registro_estado).getTime() : -Infinity;
  return [...estados].sort((a, b) => instante(a) - instante(b));
}

function aDetalle(s: SolicitudPorIdRespuesta): DetalleSolicitud {
  const estados = ordenarEstados(s.estadosSolicitud ?? []);
  const ultimo = estados.length > 0 ? estados[estados.length - 1] : null;
  const documentos = (s.documentos ?? []).map((d) => ({
    id_documento: d.id_documento,
    nombre_documento: d.nombre,
    ruta_documento: d.ruta_documento,
  }));
  const u = s.objUsuario;
  return {
    id_solicitud: s.id_solicitud,
    nombre_solicitud: s.nombre_solicitud ?? '',
    periodo_academico: s.periodo_academico,
    fecha_registro_solicitud: s.fecha_registro_solicitud,
    fecha_ceremonia: s.fecha_ceremonia ?? null,
    tipo_solicitud_display: categoriaPorNombre(s.nombre_solicitud),
    estado_actual: ultimo?.estado_actual ?? 'Sin estado',
    fecha_ultimo_estado: ultimo?.fecha_registro_estado ?? null,
    usuario: u
      ? {
          id_usuario: u.id_usuario,
          nombre_completo: u.nombre_completo,
          codigo: u.codigo,
          correo: u.correo,
          cedula: u.cedula,
        }
      : null,
    historial_estados: estados,
    total_estados: estados.length,
    documentos,
    total_documentos: documentos.length,
  };
}

export interface HistorialResponse {
  solicitudes: HistorialSolicitud[];
  total: number;
  total_solicitudes_sistema?: number;
  total_solicitudes_procesadas?: number;
  total_solicitudes_no_procesadas?: number;
}

export interface FiltrosHistorial {
  periodoAcademico?: string;
  tipoSolicitud?: string;
  estadoActual?: string;
  idUsuario?: number;
}

export enum TipoSolicitud {
  PAZ_SALVO = 'PAZ_SALVO',
  ECAES = 'ECAES',
  REINGRESO = 'REINGRESO',
  HOMOLOGACION = 'HOMOLOGACION',
  CURSO_VERANO_PREINSCRIPCION = 'CURSO_VERANO_PREINSCRIPCION',
  CURSO_VERANO_INSCRIPCION = 'CURSO_VERANO_INSCRIPCION',
}

@Injectable({
  providedIn: 'root',
})
export class HistorialSolicitudesService {
  private http = inject(HttpClient);

  private apiUrl = ApiEndpoints.SOLICITUDES.HISTORIAL;

  /**
   * Obtener historial completo de todas las solicitudes procesadas
   * @param filtros Filtros opcionales para el historial
   */
  obtenerHistorialCompleto(filtros?: FiltrosHistorial): Observable<HistorialResponse> {
    let params = new HttpParams();

    if (filtros?.periodoAcademico) {
      params = params.set('periodoAcademico', filtros.periodoAcademico);
    }
    if (filtros?.tipoSolicitud) {
      params = params.set('tipoSolicitud', filtros.tipoSolicitud);
    }
    if (filtros?.estadoActual) {
      params = params.set('estadoActual', filtros.estadoActual);
    }
    if (filtros?.idUsuario) {
      params = params.set('idUsuario', filtros.idUsuario.toString());
    }

    return this.http
      .get<HistorialResponse>(this.apiUrl, {
        params: params.keys().length > 0 ? params : undefined,
      })
      .pipe(
        catchError(() => {
          return of({
            solicitudes: [],
            total: 0,
            total_solicitudes_sistema: 0,
            total_solicitudes_procesadas: 0,
            total_solicitudes_no_procesadas: 0,
          });
        })
      );
  }

  /**
   * Obtener tipos de solicitud disponibles
   */
  getTiposSolicitud(): { codigo: string; display: string }[] {
    return [
      { codigo: TipoSolicitud.PAZ_SALVO, display: 'Paz y Salvo Académico' },
      { codigo: TipoSolicitud.ECAES, display: 'ECAES' },
      { codigo: TipoSolicitud.REINGRESO, display: 'Reingreso' },
      { codigo: TipoSolicitud.HOMOLOGACION, display: 'Homologación' },
      { codigo: TipoSolicitud.CURSO_VERANO_PREINSCRIPCION, display: 'Curso Intersemestral - Preinscripción' },
      { codigo: TipoSolicitud.CURSO_VERANO_INSCRIPCION, display: 'Curso Intersemestral - Inscripción' },
    ];
  }

  /**
   * Obtener estados disponibles
   */
  getEstadosDisponibles(): string[] {
    return ['ENVIADA', 'APROBADA_FUNCIONARIO', 'APROBADA_COORDINADOR', 'APROBADA', 'RECHAZADA', 'EN_PROCESO'];
  }

  /**
   * Detalle de una solicitud con sus estados y documentos, a partir de `GET /api/solicitudes/{id}`
   * (BUG-49: la ruta `/{id}/historial` que pedía antes no existe). Los errores se propagan.
   * @param id ID de la solicitud
   */
  obtenerDetalleSolicitud(id: number): Observable<DetalleSolicitud> {
    return this.http.get<SolicitudPorIdRespuesta>(ApiEndpoints.SOLICITUDES.BY_ID(id)).pipe(map(aDetalle));
  }

  /**
   * Exporta el historial de solicitudes a PDF
   *
   * El endpoint respeta todos los filtros enviados como parámetros de consulta.
   * - Si se envían filtros, el PDF solo incluirá las solicitudes que cumplan con esos criterios.
   * - Si NO se envían filtros (filtros vacío o undefined), el PDF incluirá todas las solicitudes del sistema.
   * - El PDF siempre mostrará qué filtros se aplicaron (o "Todos" si no hay filtro).
   *
   * @param filtros Objeto con los filtros opcionales a aplicar:
   *   - periodoAcademico: Filtra por período académico (ej: "2025-2")
   *   - tipoSolicitud: Filtra por tipo (ej: "Reingreso", "Homologacion", "Curso de Verano", "ECAES", "Paz y Salvo")
   *   - estadoActual: Filtra por estado (ej: "APROBADA", "ENVIADA", "RECHAZADA", etc.)
   *   - idUsuario: Filtra por ID de usuario
   * @returns Observable con el blob del PDF y el nombre del archivo extraído del header Content-Disposition
   */
  exportarHistorialPDF(filtros?: FiltrosHistorial): Observable<{ blob: Blob; filename: string }> {
    // El mismo recurso que el historial, con formato=pdf (EST-7, paso 5)
    const url = ApiEndpoints.SOLICITUDES.HISTORIAL;

    // Construir parámetros solo con los que tienen valor
    // Si no se envían parámetros, el backend incluirá todas las solicitudes
    let params = new HttpParams().set('formato', 'pdf');

    if (filtros?.periodoAcademico) {
      params = params.set('periodoAcademico', filtros.periodoAcademico);
    }
    if (filtros?.tipoSolicitud) {
      params = params.set('tipoSolicitud', filtros.tipoSolicitud);
    }
    if (filtros?.estadoActual) {
      params = params.set('estadoActual', filtros.estadoActual);
    }
    if (filtros?.idUsuario) {
      params = params.set('idUsuario', filtros.idUsuario.toString());
    }

    return this.http
      .get(url, {
        params: params.keys().length > 0 ? params : undefined,
        responseType: 'blob',
        observe: 'response', // Necesario para acceder a los headers
      })
      .pipe(
        catchError((error) => {
          return throwError(() => error);
        }),
        // Mapear la respuesta para incluir el blob y el nombre del archivo
        map((response) => {
          const blob = response.body as Blob;
          let filename = 'historial_solicitudes.pdf';

          // Intentar obtener el nombre del archivo del header Content-Disposition
          const contentDisposition = response.headers.get('content-disposition');
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1].replace(/['"]/g, '');
              // Decodificar si está codificado en URL
              try {
                filename = decodeURIComponent(filename);
              } catch (e) {
                // Si falla la decodificación, usar el nombre tal cual
              }
            }
          }

          // Si no se obtuvo del header, generar uno con la fecha actual
          if (filename === 'historial_solicitudes.pdf') {
            const fecha = new Date();
            const fechaStr = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
            filename = `historial_solicitudes_${fechaStr}.pdf`;
          }

          return { blob, filename };
        })
      );
  }
}
