import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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
  
  /**
   * ✅ CORREGIDO FINAL: Listar solicitudes por rol
   * @param rol - "ESTUDIANTE", "FUNCIONARIO", "COORDINADOR", "SECRETARIA"
   * @param idUsuario - ID del usuario (solo necesario para ESTUDIANTE)
   * 
   * IMPORTANTE: Ahora usa endpoints específicos con mayúscula inicial (igual que Homologación)
   * - FUNCIONARIO → /Funcionario
   * - COORDINADOR → /Coordinador
   * - SECRETARIA → /Secretaria
   * - ESTUDIANTE → /porRol?rol=ESTUDIANTE&idUsuario=X
   */
  listarSolicitudesPorRol(rol: string, idUsuario?: number): Observable<SolicitudHomologacionDTORespuesta[]> {
    const rolUpper = rol.toUpperCase();
    
    // ESTUDIANTE usa el endpoint /porRol con parámetros
    if (rolUpper === 'ESTUDIANTE') {
      let params = new HttpParams()
        .set('rol', 'ESTUDIANTE')
        .set('idUsuario', idUsuario?.toString() || '');
      
      console.log(`📋 [ESTUDIANTE] Usando endpoint /porRol`);
      console.log(`📋 URL: ${this.apiUrl}/listarSolicitud-PazYSalvo/porRol?${params.toString()}`);
      
      return this.http.get<SolicitudHomologacionDTORespuesta[]>(
        `${this.apiUrl}/listarSolicitud-PazYSalvo/porRol`,
        { params, headers: this.getAuthHeaders() }
      );
    }
    
    // FUNCIONARIO, COORDINADOR, SECRETARIA usan endpoints específicos con mayúscula inicial
    let endpoint = '';
    if (rolUpper === 'FUNCIONARIO') {
      endpoint = 'Funcionario';
    } else if (rolUpper === 'COORDINADOR') {
      endpoint = 'Coordinador';
    } else if (rolUpper === 'SECRETARIA' || rolUpper === 'SECRETARIO') {
      endpoint = 'Secretaria';
    }
    
    console.log(`📋 [${rol}] Usando endpoint específico: /${endpoint}`);
    console.log(`📋 URL: ${this.apiUrl}/listarSolicitud-PazYSalvo/${endpoint}`);
    
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(
      `${this.apiUrl}/listarSolicitud-PazYSalvo/${endpoint}`,
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Obtener solicitudes para estudiante
   * Usa el endpoint /porRol con parámetros
   */
  getStudentRequests(studentId: number): Observable<SolicitudHomologacionDTORespuesta[]> {
    return this.listarSolicitudesPorRol('ESTUDIANTE', studentId);
  }

  /**
   * Obtener solicitudes pendientes para funcionario (con último estado "Enviada")
   * Igual que Homologación: usa endpoint directo /Funcionario
   */
  getPendingRequests(): Observable<SolicitudHomologacionDTORespuesta[]> {
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(
      `${this.apiUrl}/listarSolicitud-PazYSalvo/Funcionario`, 
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Obtener solicitudes para coordinador
   * Igual que Homologación: usa endpoint directo /Coordinador
   */
  getCoordinatorRequests(): Observable<SolicitudHomologacionDTORespuesta[]> {
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(
      `${this.apiUrl}/listarSolicitud-PazYSalvo/Coordinador`, 
      { headers: this.getAuthHeaders() }
    );
  }

  /**
   * Obtener solicitudes para secretaría (solo las aprobadas por coordinador)
   * Igual que Homologación: usa endpoint directo /Secretaria
   */
  getSecretariaRequests(): Observable<SolicitudHomologacionDTORespuesta[]> {
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(
      `${this.apiUrl}/listarSolicitud-PazYSalvo/Secretaria`, 
      { headers: this.getAuthHeaders() }
    );
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
        // ✅ FIX: Agregar id_rol e id_programa como campos requeridos
        id_rol: usuario.id_rol || usuario.objRol?.id_rol || 1, // 1 = ESTUDIANTE por defecto
        id_programa: usuario.id_programa || usuario.objPrograma?.id_programa || 1, // Programa por defecto
        objPrograma: usuario.objPrograma || {
          id_programa: usuario.id_programa || usuario.objPrograma?.id_programa || 1,
          nombre_programa: usuario.objPrograma?.nombre_programa || "Ingeniería de Sistemas"
        }
      },
      archivos: archivos
    };

    console.log('📤 Enviando solicitud de paz y salvo:', body);
    console.log('📤 Usuario completo:', usuario);
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

    // El JWT interceptor agrega automáticamente el token y NO establece Content-Type para FormData
    return this.http.post<Archivo>(`${this.apiUrl}/${requestId}/subir-archivo`, formData);
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
    
    // El JWT interceptor agrega automáticamente el token y NO establece Content-Type para FormData
    return this.http.post(url, formData);
  }

  /**
   * ✅ IGUAL QUE HOMOLOGACIÓN: Subir archivo PDF usando endpoint genérico
   */
  subirArchivoPDF(archivo: File, idSolicitud?: number): Observable<any> {
    const url = `http://localhost:5000/api/archivos/subir/pdf`;
    
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
      console.log('📎 Asociando archivo a solicitud ID:', idSolicitud);
    }
    
    console.log('🔗 URL para subir archivo PDF:', url);
    console.log('📁 Archivo a subir:', archivo.name);
    console.log('📊 Tamaño del archivo:', (archivo.size / (1024 * 1024)).toFixed(2) + 'MB');
    
    // El JWT interceptor agrega automáticamente el token y NO establece Content-Type para FormData
    return this.http.post(url, formData);
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

  /**
   * Aprobar solicitud como coordinador
   * ✅ IGUAL QUE HOMOLOGACIÓN: Envía 'APROBADA_COORDINADOR'
   */
  approveAsCoordinador(requestId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: requestId,
      nuevoEstado: 'APROBADA_COORDINADOR'
    }, { headers: this.getAuthHeaders() });
  }

  /**
   * Aprobar definitivamente la solicitud (usado por SECRETARIA)
   * ✅ IGUAL QUE HOMOLOGACIÓN: Envía 'APROBADA' como estado final
   */
  approveDefinitively(idSolicitud: number): Observable<any> {
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
