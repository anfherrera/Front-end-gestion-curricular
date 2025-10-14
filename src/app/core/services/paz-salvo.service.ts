import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, switchMap } from 'rxjs';
import { Solicitud, Archivo, Usuario, SolicitudHomologacionDTORespuesta } from '../models/procesos.model';
import { AuthService } from './auth.service';
@Injectable({
  providedIn: 'root'
})
export class PazSalvoService {
  private apiUrl = 'http://localhost:5000/api/solicitudes-pazysalvo';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(isFile: boolean = false): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      ...(isFile ? {} : { 'Content-Type': 'application/json' }),
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  // ================================
  // Solicitudes
  // ================================
  getStudentRequests(studentId: number): Observable<SolicitudHomologacionDTORespuesta[]> {
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(`${this.apiUrl}/listarSolicitud-PazYSalvo`, { headers: this.getAuthHeaders() });
  }

  getPendingRequests(): Observable<SolicitudHomologacionDTORespuesta[]> {
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(`${this.apiUrl}/listarSolicitud-PazYSalvo/funcionario`, { headers: this.getAuthHeaders() });
  }

  getCoordinatorRequests(): Observable<SolicitudHomologacionDTORespuesta[]> {
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(`${this.apiUrl}/listarSolicitud-PazYSalvo/coordinador`, { headers: this.getAuthHeaders() });
  }

  /**
   * Obtener solicitudes para secretaría (solo las aprobadas por coordinador)
   * Nota: El backend no tiene endpoint específico para secretaria, usamos el general y filtramos
   */
  getSecretariaRequests(): Observable<SolicitudHomologacionDTORespuesta[]> {
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(`${this.apiUrl}/listarSolicitud-PazYSalvo`, { 
      headers: this.getAuthHeaders() 
    });
  }

  getRequestById(requestId: number): Observable<Solicitud> {
    return this.http.get<Solicitud>(`${this.apiUrl}/listarSolicitud-PazYSalvo/${requestId}`, { headers: this.getAuthHeaders() });
  }

  sendRequest(studentId: number, archivos: Archivo[]): Observable<Solicitud> {
    const usuario = this.authService.getUsuario();
    if (!usuario) throw new Error('Usuario no autenticado');

    const body = {
      nombre_solicitud: `Solicitud_paz_salvo_${usuario.nombre_completo || "Usuario"}`,
      fecha_registro_solicitud: new Date().toISOString(),
      objUsuario: { 
        id_usuario: usuario.id_usuario,
        nombre_completo: usuario.nombre_completo || "Usuario",
        codigo: usuario.codigo || "104612345678",
        correo: usuario.email_usuario || "usuario@unicauca.edu.co",
        objPrograma: usuario.objPrograma || {
          id_programa: 1,
          nombre_programa: "Ingeniería de Sistemas"
        }
      },
      archivos: archivos
    };

    console.log('📤 Enviando solicitud de paz y salvo:', body);
    console.log('📤 Headers:', this.getAuthHeaders());
    console.log('📤 URL:', `${this.apiUrl}/crearSolicitud-PazYSalvo`);
    
    return this.http.post<Solicitud>(`${this.apiUrl}/crearSolicitud-PazYSalvo`, body, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          console.error('❌ Error al crear solicitud de paz y salvo:', error);
          console.error('❌ Error status:', error.status);
          console.error('❌ Error message:', error.message);
          console.error('❌ Error body:', error.error);
          throw error;
        })
      );
  }

  approveRequest(requestId: number): Observable<any> {
    const url = `${this.apiUrl}/actualizarEstadoSolicitud`;
    const body = {
      idSolicitud: requestId,
      nuevoEstado: 'APROBADA_FUNCIONARIO'
    };
    
    console.log('✅ Aprobando solicitud de Paz y Salvo:', {
      url: url,
      requestId: requestId,
      body: body
    });
    
    return this.http.put(url, body, { headers: this.getAuthHeaders() });
  }

  rejectRequest(requestId: number, reason: string): Observable<any> {
    const url = `${this.apiUrl}/actualizarEstadoSolicitud`;
    const body = {
      idSolicitud: requestId,
      nuevoEstado: 'RECHAZADA',
      comentario: reason
    };
    
    console.log('❌ Rechazando solicitud de Paz y Salvo:', {
      url: url,
      requestId: requestId,
      body: body
    });
    
    return this.http.put(url, body, { headers: this.getAuthHeaders() });
  }

  completeValidation(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'EN_REVISION_COORDINADOR'
    }, { headers: this.getAuthHeaders() });
  }

  generateOfficio(requestId: number): Observable<string> {
    return this.http.get(`${this.apiUrl}/${requestId}/generar-oficio`, { headers: this.getAuthHeaders(), responseType: 'text' });
  }

  // ================================
  // Archivos
  // ================================
  uploadFile(requestId: number, archivo: File): Observable<Archivo> {
    const formData = new FormData();
    formData.append('archivo', archivo);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token') || ''}`
    });

    return this.http.post<Archivo>(`${this.apiUrl}/${requestId}/subir-archivo`, formData, { headers });
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

  /**
   * Subir documento SIN asociar a una solicitud específica (nuevo flujo)
   * Los documentos se suben ANTES de crear la solicitud
   */
  subirDocumento(archivo: File): Observable<any> {
    const url = `http://localhost:5000/api/solicitudes-pazysalvo/subir-documento`;
    
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
    
    console.log('🔗 URL para subir documento (nuevo flujo):', url);
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
   * Método legacy para mantener compatibilidad (DEPRECATED)
   * @deprecated Usar subirDocumento() en su lugar
   */
  subirArchivoPDF(archivo: File, idSolicitud?: number): Observable<any> {
    console.warn('⚠️ subirArchivoPDF() está deprecated. Usar subirDocumento() para el nuevo flujo.');
    
    // Si no hay idSolicitud, usar el nuevo endpoint
    if (!idSolicitud) {
      return this.subirDocumento(archivo);
    }
    
    // Para casos legacy con idSolicitud, usar el endpoint anterior
    const url = `http://localhost:5000/api/solicitudes-pazysalvo/${idSolicitud}/subir-archivo`;
    
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
    
    console.log('🔗 URL para subir archivo PDF (legacy):', url);
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

  downloadFile(requestId: number, archivoNombre: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${requestId}/descargar-archivo/${archivoNombre}`, { headers: this.getAuthHeaders(), responseType: 'blob' });
  }

  approveDocument(requestId: number, archivoNombre: string): Observable<Archivo> {
    return this.http.post<Archivo>(`${this.apiUrl}/${requestId}/aprobar-archivo`, { nombreArchivo: archivoNombre }, { headers: this.getAuthHeaders() });
  }

  rejectDocument(requestId: number, archivoNombre: string): Observable<Archivo> {
    return this.http.post<Archivo>(`${this.apiUrl}/${requestId}/rechazar-archivo`, { nombreArchivo: archivoNombre }, { headers: this.getAuthHeaders() });
  }

  // ================================
  // Estados y Comentarios
  // ================================
  actualizarEstadoDocumentos(idSolicitud: number, documentos: any[]): Observable<any> {
    const url = `${this.apiUrl}/actualizarEstadoDocumentos`;
    
    console.log('📄 Actualizando estado de documentos de Paz y Salvo:', {
      url: url,
      idSolicitud: idSolicitud,
      documentos: documentos
    });
    
    return this.http.put(url, {
      idSolicitud: idSolicitud,
      documentos: documentos
    }, { headers: this.getAuthHeaders() });
  }

  approveDefinitively(idSolicitud: number): Observable<any> {
    // Usar el endpoint correcto de paz y salvo
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: idSolicitud,
      nuevoEstado: 'APROBADA'
    }, { headers: this.getAuthHeaders() });
  }

  actualizarEstadoSolicitud(idSolicitud: number, nuevoEstado: string, comentario?: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: idSolicitud,
      nuevoEstado: nuevoEstado,
      comentario: comentario
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * ✅ CORREGIDO: Descargar archivo PDF usando endpoint específico de Paz y Salvo
   */
  descargarArchivo(nombreArchivo: string): Observable<Blob> {
    // ✅ USAR ENDPOINT ESPECÍFICO DE PAZ Y SALVO
    const url = `http://localhost:5000/api/solicitudes-pazysalvo/descargar-documento?filename=${encodeURIComponent(nombreArchivo)}`;
    console.log('🔗 URL de descarga (endpoint Paz y Salvo):', url);
    console.log('📁 Nombre del archivo:', nombreArchivo);
    
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  /**
   * ✅ CORREGIDO: Añadir comentario usando endpoint genérico (igual que homologación)
   */
  agregarComentario(idDocumento: number, comentario: string): Observable<any> {
    // ✅ USAR ENDPOINT GENÉRICO CORRECTO
    const url = `http://localhost:5000/api/documentos/añadirComentario`;
    const body = {
      idDocumento: idDocumento,
      comentario: comentario
    };
    
    console.log('💬 Añadiendo comentario (endpoint genérico):', body);
    console.log('🔗 URL:', url);
    
    return this.http.put(url, body, { headers: this.getAuthHeaders() });
  }

  /**
   * 🆕 Generar documento de Paz y Salvo usando endpoint específico (para secretaría)
   */
  generarDocumento(idSolicitud: number, numeroDocumento: string, fechaDocumento: string, observaciones?: string): Observable<{blob: Blob, filename: string}> {
    const url = `http://localhost:5000/api/solicitudes-pazysalvo/generar-documento/${idSolicitud}`;
    
    console.log('📄 Generando documento de Paz y Salvo usando endpoint específico:', {
      idSolicitud,
      numeroDocumento,
      fechaDocumento,
      observaciones
    });
    console.log('🔗 URL:', url);

    // Crear FormData con los parámetros como indica el usuario
    const formData = new FormData();
    formData.append('numeroDocumento', numeroDocumento);
    formData.append('fechaDocumento', fechaDocumento);
    if (observaciones) {
      formData.append('observaciones', observaciones);
    }

    console.log('📋 FormData creado:', {
      numeroDocumento,
      fechaDocumento,
      observaciones: observaciones || 'Sin observaciones'
    });

    // Llamar al endpoint específico de Paz y Salvo
    return this.http.post(url, formData, {
      headers: this.getAuthHeaders(true), // true para FormData
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      // Procesar respuesta y crear archivo
      map((response: any) => {
        const blob = response.body!;
        let filename = `PAZ_SALVO_${numeroDocumento}.docx`; // Fallback
        
        // Obtener nombre del archivo del header Content-Disposition
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
          if (filenameMatch) {
            filename = filenameMatch[1];
            console.log('📁 Nombre del archivo desde header:', filename);
          }
        }
        
        console.log('✅ Documento generado exitosamente:', filename);
        return { blob, filename };
      })
    );
  }

  /**
   * 🆕 Obtener TODOS los documentos de una solicitud de Paz y Salvo
   * Para funcionarios
   */
  obtenerDocumentos(idSolicitud: number): Observable<any[]> {
    console.log('🌐 Llamando a API: GET /api/solicitudes-pazysalvo/obtenerDocumentos/' + idSolicitud);
    return this.http.get<any[]>(`${this.apiUrl}/obtenerDocumentos/${idSolicitud}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * 🆕 Obtener TODOS los documentos de una solicitud de Paz y Salvo
   * Para coordinadores
   */
  obtenerDocumentosCoordinador(idSolicitud: number): Observable<any[]> {
    console.log('🌐 Llamando a API: GET /api/solicitudes-pazysalvo/obtenerDocumentos/coordinador/' + idSolicitud);
    return this.http.get<any[]>(`${this.apiUrl}/obtenerDocumentos/coordinador/${idSolicitud}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * 🆕 Asociar documentos huérfanos a una solicitud
   * Para mantener compatibilidad con el flujo anterior si es necesario
   */
  asociarDocumentosHuerfanos(idSolicitud: number): Observable<any> {
    const url = `${this.apiUrl}/asociar-documentos-huerfanos/${idSolicitud}`;
    console.log('🔗 Asociando documentos huérfanos a solicitud:', idSolicitud);
    
    return this.http.post(url, {}, {
      headers: this.getAuthHeaders()
    });
  }


}
