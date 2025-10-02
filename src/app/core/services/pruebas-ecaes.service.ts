import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FechaEcaes {
  idFechaEcaes: number;
  periodoAcademico: string;
  inscripcion_est_by_facultad: string;
  registro_recaudo_ordinario: string;
  registro_recaudo_extraordinario: string;
  citacion: string;
  aplicacion: string;
  resultados_individuales: string;
}

export interface SolicitudEcaesRequest {
  nombre_solicitud: string;
  fecha_registro_solicitud: string;
  esSeleccionado: boolean;
  objUsuario: {
    id_usuario: number;
    nombre_completo: string;
    codigo: string;
    correo: string;
    rol: any;
    estado_usuario: boolean;
    objPrograma: any;
  };
  tipoDocumento: string;
  numero_documento: string;
  fecha_expedicion: string;
  fecha_nacimiento: string;
  documentos: Array<{
    nombre: string;
    ruta_documento: string;
    fecha_documento: string;
    esValido: boolean;
    comentario: string;
    tipoDocumentoSolicitudPazYSalvo: string;
  }>;
}

export interface SolicitudEcaesResponse {
  id_solicitud: number;
  nombre_solicitud: string;
  fecha_registro_solicitud: string;
  esSeleccionado: boolean;
  estadosSolicitud: Array<{
    id_estado: number | null;
    estado_actual: string;
    fecha_registro_estado: string;
    comentario?: string | null;
    objSolicitud: any;
  }>;
  objUsuario: {
    id_usuario: number;
    nombre_completo: string;
    rol: {
      id_rol: number;
      nombre: string | null;
    };
    codigo: string;
    correo: string;
    estado_usuario: boolean;
    objPrograma: {
      id_programa: number;
      codigo: string;
      nombre_programa: string;
    };
  };
  documentos: any[];
  tipoDocumento: string;
  numero_documento: string;
  fecha_expedicion: string;
  fecha_nacimiento: string;
}

@Injectable({
  providedIn: 'root'
})
export class PruebasEcaesService {
  private apiUrl = 'http://localhost:5000/api/solicitudes-ecaes';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  /**
   * Obtener todas las fechas de ECAES
   */
  listarFechasEcaes(): Observable<FechaEcaes[]> {
    return this.http.get<FechaEcaes[]>(`${this.apiUrl}/listarFechasEcaes`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Crear solicitud de ECAES
   */
  crearSolicitudEcaes(solicitud: SolicitudEcaesRequest): Observable<SolicitudEcaesResponse> {
    return this.http.post<SolicitudEcaesResponse>(`${this.apiUrl}/crearSolicitud-Ecaes`, solicitud, {
      headers: this.getAuthHeaders()
    });
  }

  actualizarEstadoSolicitud(idSolicitud: number, nuevoEstado: string): Observable<any> {
    const payload = {
      idSolicitud: idSolicitud,
      nuevoEstado: nuevoEstado
    };
    return this.http.post(`${this.apiUrl}/actualizarEstadoSolicitud`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  listarSolicitudesEcaes(): Observable<SolicitudEcaesResponse[]> {
    return this.http.get<SolicitudEcaesResponse[]>(`${this.apiUrl}/listarSolicitudes-Ecaes`, {
      headers: this.getAuthHeaders()
    });
  }
}
