import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, of, throwError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
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
    objPrograma?: any | null;
  };
  estadosSolicitud: Array<{
    id_estado?: number;
    estado_actual: string;
    fecha_registro_estado: string;
    comentario?: string | null;
  }>;
  documentos?: Array<any>;
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
  CURSO_VERANO_INSCRIPCION = 'CURSO_VERANO_INSCRIPCION'
}

@Injectable({
  providedIn: 'root'
})
export class HistorialSolicitudesService {
  private apiUrl = ApiEndpoints.SOLICITUDES.HISTORIAL;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

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

    return this.http.get<HistorialResponse>(
      this.apiUrl,
      {
        params: params.keys().length > 0 ? params : undefined,
        headers: this.getAuthHeaders()
      }
    ).pipe(
      catchError(error => {
        return of({
          solicitudes: [],
          total: 0,
          total_solicitudes_sistema: 0,
          total_solicitudes_procesadas: 0,
          total_solicitudes_no_procesadas: 0
        });
      })
    );
  }

  /**
   * Obtener tipos de solicitud disponibles
   */
  getTiposSolicitud(): Array<{ codigo: string; display: string }> {
    return [
      { codigo: TipoSolicitud.PAZ_SALVO, display: 'Paz y Salvo Académico' },
      { codigo: TipoSolicitud.ECAES, display: 'ECAES' },
      { codigo: TipoSolicitud.REINGRESO, display: 'Reingreso' },
      { codigo: TipoSolicitud.HOMOLOGACION, display: 'Homologación' },
      { codigo: TipoSolicitud.CURSO_VERANO_PREINSCRIPCION, display: 'Curso Intersemestral - Preinscripción' },
      { codigo: TipoSolicitud.CURSO_VERANO_INSCRIPCION, display: 'Curso Intersemestral - Inscripción' }
    ];
  }

  /**
   * Obtener estados disponibles
   */
  getEstadosDisponibles(): string[] {
    return [
      'ENVIADA',
      'APROBADA_FUNCIONARIO',
      'APROBADA_COORDINADOR',
      'APROBADA',
      'RECHAZADA',
      'EN_PROCESO'
    ];
  }

  /**
   * Obtener historial completo de una solicitud específica
   * @param id ID de la solicitud
   */
  obtenerHistorialSolicitud(id: number): Observable<any> {
    const url = ApiEndpoints.SOLICITUDES.HISTORIAL_BY_ID(id);
    return this.http.get<any>(url, { headers: this.getAuthHeaders() }).pipe(
      catchError(error => {
        throw error;
      })
    );
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
    const url = ApiEndpoints.SOLICITUDES.EXPORTAR_PDF;
    
    // Construir parámetros solo con los que tienen valor
    // Si no se envían parámetros, el backend incluirá todas las solicitudes
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

    // Headers para descargar PDF (sin Content-Type para que el navegador lo maneje)
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });

    return this.http.get(url, {
      headers,
      params: params.keys().length > 0 ? params : undefined,
      responseType: 'blob',
      observe: 'response' // Necesario para acceder a los headers
    }).pipe(
      catchError(error => {
        return throwError(() => error);
      }),
      // Mapear la respuesta para incluir el blob y el nombre del archivo
      map(response => {
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


