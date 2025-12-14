import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiEndpoints } from '../utils/api-endpoints';

export interface HistorialSolicitud {
  id_solicitud: number;
  nombre_solicitud: string;
  periodo_academico: string;
  fecha_registro_solicitud: string;
  fecha_ceremonia?: string | null;
  tipo_solicitud: string;
  tipo_solicitud_display: string;
  estado_actual: string;
  fecha_ultimo_estado: string;
  total_estados: number;
  total_documentos: number;
  usuario: {
    id_usuario: number;
    nombre_completo: string;
    codigo: string;
    correo?: string;
  };
  estadosSolicitud: Array<{
    estado_actual: string;
    fecha_registro_estado: string;
    comentario?: string;
  }>;
}

export interface HistorialResponse {
  total: number;
  filtros_aplicados: {
    periodo_academico: string;
    tipo_solicitud: string;
    estado_actual: string;
    id_usuario: string;
  };
  solicitudes: HistorialSolicitud[];
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
        console.error('Error obteniendo historial completo:', error);
        return of({
          total: 0,
          filtros_aplicados: {
            periodo_academico: filtros?.periodoAcademico || 'Todos',
            tipo_solicitud: filtros?.tipoSolicitud || 'Todos',
            estado_actual: filtros?.estadoActual || 'Todos',
            id_usuario: filtros?.idUsuario?.toString() || 'Todos'
          },
          solicitudes: []
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
}

