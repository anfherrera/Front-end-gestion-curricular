import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Solicitud, SolicitudHomologacionDTORespuesta } from '../models/procesos.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HomologacionAsignaturasService {
  private apiUrl = `${environment.apiUrl}/solicitudes-homologacion`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(isFile: boolean = false): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      ...(isFile ? {} : { 'Content-Type': 'application/json' }),
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  crearSolicitud(solicitud: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/crearSolicitud-Homologacion`,
      solicitud,
      { headers: this.getAuthHeaders() }
    );
  }

  listarSolicitudes(idUsuario: number): Observable<any> {
    return this.http.get(
      //`${this.apiUrl}/listarPorRol/${idUsuario}`,
      `${this.apiUrl}/listarSolicitud-Homologacion`,
      { headers: this.getAuthHeaders() }
    );
  }

  listarSolicitudesPorRol(rol: string, idUsuario?: number): Observable<SolicitudHomologacionDTORespuesta[]> {
    let params: any = { rol: rol };
    if (idUsuario) {
      params.idUsuario = idUsuario;
    }

    const url = `${this.apiUrl}/listarSolicitud-Homologacion/porRol`;
    // Log de depuración (comentado para producción)

    return this.http.get<SolicitudHomologacionDTORespuesta[]>(url, {
      params: params,
      headers: this.getAuthHeaders()
    });
  }

  // ================================
  // Métodos para Funcionario
  // ================================
  
  /**
   * Obtener solicitudes pendientes para funcionario (con último estado "Enviada")
   */
  getPendingRequests(): Observable<SolicitudHomologacionDTORespuesta[]> {
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(`${this.apiUrl}/listarSolicitud-Homologacion/Funcionario`, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Obtener solicitudes para coordinador
   */
  getCoordinadorRequests(): Observable<SolicitudHomologacionDTORespuesta[]> {
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(`${this.apiUrl}/listarSolicitud-Homologacion/Coordinador`, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Obtener solicitudes para secretaría (solo las aprobadas por coordinador)
   */
  getSecretariaRequests(): Observable<SolicitudHomologacionDTORespuesta[]> {
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(`${this.apiUrl}/listarSolicitud-Homologacion/Secretaria`, { 
      headers: this.getAuthHeaders() 
    });
  }

  /**
   * Obtener solicitudes aprobadas para secretaría
   * Endpoint: /listarSolicitud-Homologacion/Secretaria/Aprobadas
   */
  getSecretariaApprovedRequests(): Observable<SolicitudHomologacionDTORespuesta[]> {
    const url = `${this.apiUrl}/listarSolicitud-Homologacion/Secretaria/Aprobadas`;

    // URL solicitudes homologación aprobadas secretaría

    return this.http.get<SolicitudHomologacionDTORespuesta[]>(url, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Aprobar solicitud de homologación como funcionario
   */
  approveRequest(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'APROBADA_FUNCIONARIO'
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Rechazar solicitud de homologación
   */
  rejectRequest(requestId: number, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'RECHAZADA',
      comentario: reason
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Completar validación de solicitud
   */
  completeValidation(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'EN_REVISION_COORDINADOR'
    }, { headers: this.getAuthHeaders() });
  }

  // ================================
  // Métodos para Coordinador
  // ================================

  /**
   * Aprobar solicitud como coordinador
   */
  approveAsCoordinador(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'APROBADA_COORDINADOR'
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Aprobar definitivamente la solicitud
   */
  approveDefinitively(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'APROBADA'
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Rechazar solicitud como coordinador
   */
  rejectAsCoordinador(requestId: number, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'RECHAZADA',
      comentario: reason
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Descargar archivo PDF por nombre
   */
  descargarArchivo(nombreArchivo: string): Observable<Blob> {
    // URL directa al backend (CORS configurado)
    const url = `${environment.apiUrl}/archivos/descargar/pdf?filename=${encodeURIComponent(nombreArchivo)}`;
    // URL de descarga
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
    
    console.log('💬 Añadiendo comentario:', body);
    
    return this.http.put(url, body, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Obtener comentarios de un documento
   */
  obtenerComentariosDocumento(idDocumento: number): Observable<any> {
    const url = `${environment.apiUrl}/documentos/${idDocumento}/comentarios`;
    
    return this.http.get(url, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Obtener solicitud completa con documentos y comentarios
   */
  obtenerSolicitudCompleta(idSolicitud: number): Observable<SolicitudHomologacionDTORespuesta> {
    const url = `${this.apiUrl}/obtenerSolicitud/${idSolicitud}`;
    
    return this.http.get<SolicitudHomologacionDTORespuesta>(url, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Actualizar estado de documentos de una solicitud
   */
  actualizarEstadoDocumentos(idSolicitud: number, documentos: any[]): Observable<any> {
    const url = `${this.apiUrl}/actualizarEstadoDocumentos`;
    
    return this.http.put(url, {
      idSolicitud: idSolicitud,
      documentos: documentos
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Generar oficio/resolución para una solicitud
   */
  generarOficio(idSolicitud: number, contenido: string): Observable<any> {
    const url = `${this.apiUrl}/generarOficio`;
    
    return this.http.post(url, {
      idSolicitud: idSolicitud,
      contenido: contenido,
      tipo: 'OFICIO_HOMOLOGACION'
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Obtener oficios/resoluciones de una solicitud
   */
  obtenerOficios(idSolicitud: number): Observable<any[]> {
    const url = `${this.apiUrl}/obtenerOficios/${idSolicitud}`;
    
    return this.http.get<any[]>(url, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Descargar oficio/resolución
   */
  descargarOficio(idOficio: number): Observable<Blob> {
    const url = `${this.apiUrl}/descargarOficio/${idOficio}`;
    
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }



//============
/**
  //  * Obtener una solicitud por ID
  //  */
  // obtenerSolicitudPorId(idSolicitud: number): Observable<any> {
  //   return this.http.get(
  //     `${this.apiUrl}/obtenerSolicitud/${idSolicitud}`,
  //     { headers: this.getAuthHeaders() }
  //   );
  // }

  // /**
  //  * Subir un archivo asociado a una solicitud
  //  */
  // subirArchivo(idSolicitud: number, archivo: File): Observable<any> {
  //   const formData = new FormData();
  //   formData.append('file', archivo);

  //   return this.http.post(
  //     `${this.apiUrl}/subirArchivo/${idSolicitud}`,
  //     formData,
  //     { headers: this.getAuthHeaders(true) }
  //   );
  // }

  // /**
  //  * Descargar archivo asociado a una solicitud
  //  */
  // descargarArchivo(idSolicitud: number): Observable<Blob> {
  //   return this.http.get(
  //     `${this.apiUrl}/descargarArchivo/${idSolicitud}`,
  //     { headers: this.getAuthHeaders(), responseType: 'blob' }
  //   );
  // }

  /**
   * Subir archivo PDF
   */
  subirArchivoPDF(archivo: File, idSolicitud?: number): Observable<any> {
    const url = `${environment.apiUrl}/archivos/subir/pdf`;
    
    // Validaciones del frontend
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (archivo.size > maxFileSize) {
      return new Observable(observer => {
        observer.error({
          status: 413,
          error: { message: `El archivo es demasiado grande. Tamaño máximo: 10MB. Tamaño actual: ${(archivo.size / (1024 * 1024)).toFixed(2)}MB` }
        });
      });
    }
    
    if (!archivo.name.toLowerCase().endsWith('.pdf')) {
      return new Observable(observer => {
        observer.error({
          status: 415,
          error: { message: 'Solo se permiten archivos PDF' }
        });
      });
    }
    
    const formData = new FormData();
    formData.append('file', archivo);
    
    // Agregar idSolicitud si se proporciona
    if (idSolicitud) {
      formData.append('idSolicitud', idSolicitud.toString());
      // Asociando archivo a solicitud
    }
    
    // URL para subir archivo PDF
    // Archivo a subir
    // Tamaño del archivo
    
    // El JWT interceptor agrega automáticamente el token y NO establece Content-Type para FormData
    // Esto permite que el navegador establezca el Content-Type correcto: multipart/form-data
    return this.http.post(url, formData);
  }

  /**
   * Validar documentos requeridos para homologación
   */
  validarDocumentosRequeridos(idSolicitud: number): Observable<any> {
    const url = `${environment.apiUrl}/solicitudes-homologacion/validarDocumentosRequeridos/${idSolicitud}`;
    
    // URL para validar documentos requeridos
    
    return this.http.get(url, {
      headers: this.getAuthHeaders()
    });
  }

//============

}
