import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SolicitudReingresoDTOPeticion, SolicitudReingresoDTORespuesta, CambioEstadoSolicitudDTOPeticion } from '../models/procesos.model';

@Injectable({
  providedIn: 'root'
})
export class ReingresoEstudianteService {
  private apiUrl = 'http://localhost:5000/api/solicitudes-reingreso';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(isFile: boolean = false): HttpHeaders {
    const token = localStorage.getItem('token');
    console.log('🔑 Token encontrado:', token ? 'Sí' : 'No');
    console.log('🔑 Token completo:', token);

    const headers = new HttpHeaders({
      ...(isFile ? {} : { 'Content-Type': 'application/json' }),
      Authorization: token ? `Bearer ${token}` : ''
    });

    console.log('🔑 Headers creados:', headers);
    return headers;
  }

  // ================================
  // Métodos básicos
  // ================================

  crearSolicitud(solicitud: SolicitudReingresoDTOPeticion): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/crearSolicitud-Reingreso`,
      solicitud,
      { headers: this.getAuthHeaders() }
    );
  }

  listarSolicitudes(): Observable<SolicitudReingresoDTORespuesta[]> {
    return this.http.get<SolicitudReingresoDTORespuesta[]>(
      `${this.apiUrl}/listarSolicitudes-Reingreso`,
      { headers: this.getAuthHeaders() }
    );
  }

  listarSolicitudesPorRol(rol: string, idUsuario?: number): Observable<SolicitudReingresoDTORespuesta[]> {
    const headers = this.getAuthHeaders();

    let url: string;
    switch (rol.toLowerCase()) {
      case 'funcionario':
        url = `${this.apiUrl}/listarSolicitud-Reingreso/Funcionario`;
        break;
      case 'coordinador':
        url = `${this.apiUrl}/listarSolicitud-Reingreso/Coordinador`;
        break;
      case 'secretaria':
        url = `${this.apiUrl}/listarSolicitud-Reingreso/Secretaria`;
        break;
      default:
        // Fallback al endpoint general
        url = `${this.apiUrl}/listarSolicitud-Reingreso/porUser`;
        let params: any = { rol: rol };
        if (idUsuario) {
          params.idUsuario = idUsuario;
        }
        return this.http.get<SolicitudReingresoDTORespuesta[]>(url, {
          params: params,
          headers: headers
        });
    }

    console.log('🌐 URL del endpoint:', url);
    console.log('🔑 Headers:', headers);

    return this.http.get<SolicitudReingresoDTORespuesta[]>(url, { headers });
  }

  obtenerSolicitudPorId(id: number): Observable<SolicitudReingresoDTORespuesta> {
    return this.http.get<SolicitudReingresoDTORespuesta>(
      `${this.apiUrl}/listarSolicitud-Reingreo/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  actualizarEstadoSolicitud(cambioEstado: CambioEstadoSolicitudDTOPeticion): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/actualizarEstadoSolicitud-Reingreso`,
      cambioEstado,
      { headers: this.getAuthHeaders() }
    );
  }

  // ================================
  // Métodos para Funcionario
  // ================================

  /**
   * Obtener solicitudes pendientes para funcionario (con último estado "Enviada")
   */
  getPendingRequests(): Observable<SolicitudReingresoDTORespuesta[]> {
    return this.listarSolicitudesPorRol('funcionario');
  }

  /**
   * Aprobar solicitud de reingreso como funcionario
   */
  approveRequest(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud-Reingreso`, {
      idSolicitud: requestId,
      nuevoEstado: 'APROBADA_FUNCIONARIO'
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Rechazar solicitud de reingreso
   */
  rejectRequest(requestId: number, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud-Reingreso`, {
      idSolicitud: requestId,
      nuevoEstado: 'RECHAZADA',
      comentario: reason
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Completar validación de solicitud
   */
  completeValidation(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud-Reingreso`, {
      idSolicitud: requestId,
      nuevoEstado: 'EN_REVISION_COORDINADOR'
    }, { headers: this.getAuthHeaders() });
  }

  // ================================
  // Métodos para Coordinador
  // ================================

  /**
   * Obtener solicitudes para coordinador (con último estado "APROBADA_FUNCIONARIO")
   */
  getCoordinadorRequests(): Observable<SolicitudReingresoDTORespuesta[]> {
    return this.listarSolicitudesPorRol('coordinador');
  }

  /**
   * Aprobar solicitud como coordinador
   */
  approveAsCoordinador(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud-Reingreso`, {
      idSolicitud: requestId,
      nuevoEstado: 'APROBADA_COORDINADOR'
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Aprobar definitivamente la solicitud
   */
  approveDefinitively(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud-Reingreso`, {
      idSolicitud: requestId,
      nuevoEstado: 'APROBADA'
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Rechazar solicitud como coordinador
   */
  rejectAsCoordinador(requestId: number, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud-Reingreso`, {
      idSolicitud: requestId,
      nuevoEstado: 'RECHAZADA',
      comentario: reason
    }, { headers: this.getAuthHeaders() });
  }

  // ================================
  // Métodos para Secretaría
  // ================================

  /**
   * Obtener solicitudes para secretaría (con último estado "APROBADA_COORDINADOR")
   */
  getSecretariaRequests(): Observable<SolicitudReingresoDTORespuesta[]> {
    return this.listarSolicitudesPorRol('secretaria');
  }

  // ================================
  // Métodos para archivos y documentos
  // ================================

  /**
   * Descargar archivo PDF por nombre
   */
  descargarArchivo(nombreArchivo: string): Observable<Blob> {
    // URL directa al backend (CORS configurado)
    const url = `http://localhost:5000/api/archivos/descargar/pdf?filename=${encodeURIComponent(nombreArchivo)}`;
    console.log('🔗 URL de descarga:', url);
    console.log('📁 Nombre del archivo:', nombreArchivo);

    return this.http.get(url, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  /**
   * Añadir comentario a un documento
   */
  agregarComentario(idDocumento: number, comentario: string): Observable<any> {
    const url = `http://localhost:5000/api/documentos/añadirComentario`;
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
    const url = `http://localhost:5000/api/documentos/${idDocumento}/comentarios`;

    return this.http.get(url, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Obtener solicitud completa con documentos y comentarios
   */
  obtenerSolicitudCompleta(idSolicitud: number): Observable<SolicitudReingresoDTORespuesta> {
    const url = `${this.apiUrl}/obtenerSolicitud/${idSolicitud}`;

    return this.http.get<SolicitudReingresoDTORespuesta>(url, {
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
      tipo: 'OFICIO_REINGRESO'
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Obtener oficios/resoluciones de una solicitud de reingreso
   */
  obtenerOficios(idSolicitud: number): Observable<any[]> {
    const url = `${this.apiUrl}/obtenerOficios/${idSolicitud}`;

    return this.http.get<any[]>(url, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Descargar oficio/resolución de reingreso
   */
  descargarOficio(idSolicitud: number): Observable<Blob> {
    const url = `${this.apiUrl}/descargarOficio/${idSolicitud}`;

    return this.http.get(url, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  /**
   * Subir archivo PDF
   */
  subirArchivoPDF(archivo: File, idSolicitud?: number): Observable<any> {
    // Determinar la URL correcta
    let url: string;
    if (idSolicitud) {
      url = `http://localhost:5000/api/solicitudes-reingreso/${idSolicitud}/subir-archivo`;
    } else {
      // Fallback al endpoint genérico si no hay idSolicitud
      url = `http://localhost:5000/api/archivos/subir/pdf`;
    }

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

    // Agregar idSolicitud si se proporciona (solo para endpoint genérico)
    if (idSolicitud && !url.includes('/subir-archivo')) {
      formData.append('idSolicitud', idSolicitud.toString());
      console.log('📎 Asociando archivo a solicitud ID:', idSolicitud);
    }

    console.log('🔗 URL para subir archivo PDF:', url);
    console.log('📁 Archivo a subir:', archivo.name);
    console.log('📊 Tamaño del archivo:', (archivo.size / (1024 * 1024)).toFixed(2) + 'MB');

    // Para archivos, no necesitamos Content-Type en los headers
    const headers = new HttpHeaders({
      'Authorization': this.getAuthHeaders().get('Authorization') || ''
    });

    return this.http.post(url, formData, {
      headers: headers
    });
  }

  /**
   * Validar documentos requeridos para reingreso
   */
  validarDocumentosRequeridos(idSolicitud: number): Observable<any> {
    const url = `http://localhost:5000/api/solicitudes-reingreso/validarDocumentosRequeridos/${idSolicitud}`;

    console.log('🔗 URL para validar documentos requeridos:', url);

    return this.http.get(url, {
      headers: this.getAuthHeaders()
    });
  }
}
