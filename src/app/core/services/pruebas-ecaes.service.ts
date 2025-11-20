import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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
    // El backend ahora espera identificadores en lugar de objetos anidados
    estado_usuario: boolean;
    id_rol?: number;
    id_programa?: number;
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
  private apiUrl = `${environment.apiUrl}/solicitudes-ecaes`;

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

  /**
   * Aprobar solicitud ECAES como funcionario
   */
  approveRequest(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'PRE_REGISTRADO' // Cambiar directamente a PRE_REGISTRADO
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Rechazar solicitud ECAES
   */
  rejectRequest(requestId: number, reason?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'Rechazada',
      comentario: reason || 'Solicitud rechazada por el funcionario'
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Método genérico para actualizar estado (mantener para compatibilidad)
   */
  actualizarEstadoSolicitud(idSolicitud: number, nuevoEstado: string): Observable<any> {
    const payload = {
      idSolicitud: idSolicitud,
      nuevoEstado: nuevoEstado
    };
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, payload, {
      headers: this.getAuthHeaders()
    });
  }

  listarSolicitudesEcaes(): Observable<SolicitudEcaesResponse[]> {
    return this.http.get<SolicitudEcaesResponse[]>(`${this.apiUrl}/listarSolicitudes-Ecaes`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Listar solicitudes ECAES por rol y usuario
   */
  listarSolicitudesPorRol(rol: string, idUsuario?: number): Observable<SolicitudEcaesResponse[]> {
    let params: any = { rol: rol };
    if (idUsuario) {
      params.idUsuario = idUsuario;
    }

    const url = `${this.apiUrl}/listarSolicitud-ecaes/porRol`;
    // Log de depuración (comentado para producción)

    return this.http.get<SolicitudEcaesResponse[]>(url, {
      params: params,
      headers: this.getAuthHeaders()
    });
  }


  /**
   * Publicar fechas de ECAES
   */
  publicarFechasEcaes(fechasData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/publicarFechasEcaes`, fechasData, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Buscar fechas ECAES por período académico
   */
  buscarFechasPorPeriodo(periodoAcademico: string): Observable<FechaEcaes> {
    return this.http.get<FechaEcaes>(`${this.apiUrl}/buscarFechasPorPeriodo/${encodeURIComponent(periodoAcademico)}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Actualizar fechas ECAES existentes
   */
  actualizarFechasEcaes(fechasData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/actualizarFechasEcaes`, fechasData, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Listar solicitudes ECAES para funcionario
   */
  listarSolicitudesFuncionario(): Observable<SolicitudEcaesResponse[]> {
    return this.http.get<SolicitudEcaesResponse[]>(`${this.apiUrl}/listarSolicitudes-Ecaes/Funcionario`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Descargar archivo PDF por nombre
   */
  descargarArchivo(nombreArchivo: string): Observable<Blob> {
    // URL directa al backend (CORS configurado)
    const url = `${environment.apiUrl}/archivos/descargar/pdf?filename=${encodeURIComponent(nombreArchivo)}`;
    // URL de descarga ECAES
    console.log('📁 Nombre del archivo:', nombreArchivo);

    return this.http.get(url, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  /**
   * NUEVO: Descargar archivo PDF por ID de documento
   * Este método es más confiable que usar el nombre del archivo
   */
  descargarArchivoPorId(idDocumento: number): Observable<Blob> {
    const url = `${environment.apiUrl}/documentos/${idDocumento}/descargar`;
    // URL de descarga por ID
    console.log('📁 ID del documento:', idDocumento);
    
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  /**
   * NUEVO: Descargar archivo PDF por ruta del documento
   * Usa la ruta almacenada en la base de datos
   */
  descargarArchivoPorRuta(rutaDocumento: string): Observable<Blob> {
    // Extraer el nombre del archivo de la ruta si es necesario
    const nombreArchivo = rutaDocumento.split('/').pop() || rutaDocumento;
    const url = `${environment.apiUrl}/archivos/descargar/pdf?filename=${encodeURIComponent(nombreArchivo)}`;
    // URL de descarga por ruta
    console.log('📁 Ruta del documento:', rutaDocumento);
    console.log('📁 Nombre extraído:', nombreArchivo);
    
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  /**
   * Añadir comentario a un documento
   */
  agregarComentario(idDocumento: number, comentario: string): Observable<any> {
    const url = `${environment.apiUrl}/documentos/añadirComentario`;
    const body = {
      idDocumento: idDocumento,
      comentario: comentario
    };

    console.log('💬 Añadiendo comentario ECAES:', body);

    return this.http.put(url, body, {
      headers: this.getAuthHeaders()
    });
  }
}
