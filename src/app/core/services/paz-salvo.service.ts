import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, switchMap, of } from 'rxjs';
import { Solicitud, Archivo, Usuario, SolicitudHomologacionDTORespuesta } from '../models/procesos.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PazSalvoService {
  private apiUrl = `${environment.apiUrl}/solicitudes-pazysalvo`;

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
   * Listar solicitudes por rol
   * @param rol - "ESTUDIANTE", "FUNCIONARIO", "COORDINADOR", "SECRETARIA"
   * @param idUsuario - ID del usuario (solo necesario para ESTUDIANTE)
   * @param periodoAcademico - Período académico opcional (formato: "YYYY-P", ej: "2025-1"). Si no se envía, el backend usa el período actual.
   */
  listarSolicitudesPorRol(rol: string, idUsuario?: number, periodoAcademico?: string): Observable<SolicitudHomologacionDTORespuesta[]> {
    const rolUpper = rol.toUpperCase();
    
    // ESTUDIANTE usa el endpoint /porRol con parámetros
    if (rolUpper === 'ESTUDIANTE') {
      let params = new HttpParams()
        .set('rol', 'ESTUDIANTE')
        .set('idUsuario', idUsuario?.toString() || '');
      
      if (periodoAcademico) {
        params = params.set('periodoAcademico', periodoAcademico);
      }
      
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
    
    let params = new HttpParams();
    if (periodoAcademico) {
      params = params.set('periodoAcademico', periodoAcademico);
    }
    
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(
      `${this.apiUrl}/listarSolicitud-PazYSalvo/${endpoint}`,
      { params: params.keys().length > 0 ? params : undefined, headers: this.getAuthHeaders() }
    );
  }

  /**
   * Obtener solicitudes para estudiante
   * Usa el endpoint /porRol con parámetros
   */
  getStudentRequests(studentId: number, periodoAcademico?: string): Observable<SolicitudHomologacionDTORespuesta[]> {
    return this.listarSolicitudesPorRol('ESTUDIANTE', studentId, periodoAcademico);
  }

  /**
   * Obtener solicitudes pendientes para funcionario (con último estado "Enviada")
   */
  getPendingRequests(periodoAcademico?: string): Observable<SolicitudHomologacionDTORespuesta[]> {
    let params = new HttpParams();
    if (periodoAcademico) {
      params = params.set('periodoAcademico', periodoAcademico);
    }
    
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(
      `${this.apiUrl}/listarSolicitud-PazYSalvo/Funcionario`, 
      { params: params.keys().length > 0 ? params : undefined, headers: this.getAuthHeaders() }
    );
  }

  /**
   * Obtener solicitudes para coordinador
   */
  getCoordinatorRequests(periodoAcademico?: string): Observable<SolicitudHomologacionDTORespuesta[]> {
    let params = new HttpParams();
    if (periodoAcademico) {
      params = params.set('periodoAcademico', periodoAcademico);
    }
    
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(
      `${this.apiUrl}/listarSolicitud-PazYSalvo/Coordinador`, 
      { params: params.keys().length > 0 ? params : undefined, headers: this.getAuthHeaders() }
    );
  }

  /**
   * Obtener solicitudes para secretaría (solo las aprobadas por coordinador)
   * Estado: APROBADA_COORDINADOR (pendientes de procesar)
   */
  getSecretariaRequests(periodoAcademico?: string): Observable<SolicitudHomologacionDTORespuesta[]> {
    let params = new HttpParams();
    if (periodoAcademico) {
      params = params.set('periodoAcademico', periodoAcademico);
    }
    
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(
      `${this.apiUrl}/listarSolicitud-PazYSalvo/Secretaria`, 
      { params: params.keys().length > 0 ? params : undefined, headers: this.getAuthHeaders() }
    );
  }

  /**
   * Obtener solicitudes ya procesadas por funcionario (historial)
   * Estado: APROBADA_FUNCIONARIO (ya aprobadas por funcionario)
   */
  getSolicitudesProcesadasFuncionario(periodoAcademico?: string): Observable<SolicitudHomologacionDTORespuesta[]> {
    let params = new HttpParams();
    if (periodoAcademico) {
      params = params.set('periodoAcademico', periodoAcademico);
    }
    
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(
      `${this.apiUrl}/listarSolicitud-PazYSalvo/Funcionario/Aprobadas`, 
      { params: params.keys().length > 0 ? params : undefined, headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        return of([]);
      })
    );
  }

  /**
   * Obtener solicitudes ya procesadas por coordinador (historial)
   * Estado: APROBADA_COORDINADOR (ya aprobadas por coordinador)
   */
  getSolicitudesProcesadasCoordinador(periodoAcademico?: string): Observable<SolicitudHomologacionDTORespuesta[]> {
    let params = new HttpParams();
    if (periodoAcademico) {
      params = params.set('periodoAcademico', periodoAcademico);
    }
    
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(
      `${this.apiUrl}/listarSolicitud-PazYSalvo/Coordinador/Aprobadas`, 
      { params: params.keys().length > 0 ? params : undefined, headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        return of([]);
      })
    );
  }

  /**
   * Obtener solicitudes ya procesadas por secretaría (historial)
   * Estado: APROBADA (ya enviadas al estudiante)
   */
  getSolicitudesProcesadasSecretaria(periodoAcademico?: string): Observable<SolicitudHomologacionDTORespuesta[]> {
    let params = new HttpParams();
    if (periodoAcademico) {
      params = params.set('periodoAcademico', periodoAcademico);
    }
    
    return this.http.get<SolicitudHomologacionDTORespuesta[]>(
      `${this.apiUrl}/listarSolicitud-PazYSalvo/Secretaria/Aprobadas`, 
      { params: params.keys().length > 0 ? params : undefined, headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        return of([]);
      })
    );
  }

  getRequestById(requestId: number): Observable<Solicitud> {
    return this.http.get<Solicitud>(`${this.apiUrl}/listarSolicitud-PazYSalvo/${requestId}`, { headers: this.getAuthHeaders() });
  }

  /**
   * Obtener comentarios filtrados de una solicitud
   * Solo devuelve comentarios existentes (rechazo y documentos con comentarios)
   */
  obtenerComentarios(idSolicitud: number): Observable<{
    comentarioRechazo?: string;
    documentosConComentarios?: Array<{
      id: number;
      nombre: string;
      comentario: string;
    }>;
    mensaje?: string;
  }> {
    return this.http.get<{
      comentarioRechazo?: string;
      documentosConComentarios?: Array<{
        id: number;
        nombre: string;
        comentario: string;
      }>;
      mensaje?: string;
    }>(`${this.apiUrl}/obtenerComentarios/${idSolicitud}`, { headers: this.getAuthHeaders() }).pipe(
      catchError((error: any) => {
        return of({ mensaje: 'Error al obtener comentarios' });
      })
    );
  }

  sendRequest(studentId: number, archivos: Archivo[]): Observable<Solicitud> {
    const usuario = this.authService.getUsuario();
    if (!usuario) throw new Error('Usuario no autenticado');

    // Obtener nombre completo del usuario
    const nombreCompleto = usuario.nombre_completo || 
                          usuario.nombre || 
                          'Usuario';
    const nombreFinal = nombreCompleto.trim() !== '' ? nombreCompleto.trim() : 'Usuario';
    
    const body = {
      nombre_solicitud: `Solicitud Paz y Salvo - ${nombreFinal}`,
      fecha_registro_solicitud: new Date().toISOString(),
      objUsuario: { 
        id_usuario: usuario.id_usuario,
        nombre_completo: usuario.nombre_completo || "Usuario",
        codigo: usuario.codigo || "104612345678",
        correo: usuario.email_usuario || "usuario@unicauca.edu.co",
        id_rol: usuario.id_rol || usuario.objRol?.id_rol || 1, // 1 = ESTUDIANTE por defecto
        id_programa: usuario.id_programa || usuario.objPrograma?.id_programa || 1, // Programa por defecto
        objPrograma: usuario.objPrograma || {
          id_programa: usuario.id_programa || usuario.objPrograma?.id_programa || 1,
          nombre_programa: usuario.objPrograma?.nombre_programa || "Ingeniería de Sistemas"
        }
      },
      archivos: archivos
    };

    return this.http.post<Solicitud>(`${this.apiUrl}/crearSolicitud-PazYSalvo`, body, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
          throw error;
        })
      );
  }

  /**
   * Crea una solicitud de paz y salvo con datos del formulario
   * @param studentId ID del estudiante
   * @param archivos Archivos subidos
   * @param datosFormulario Datos del formulario (nombre_solicitud, fecha_registro_solicitud, periodo_academico, titulo_trabajo_grado, director_trabajo_grado)
   */
  crearSolicitudConFormulario(
    studentId: number, 
    archivos: Archivo[], 
    datosFormulario: {
      nombre_solicitud: string;
      fecha_registro_solicitud: string;
      periodo_academico?: string;
      titulo_trabajo_grado?: string;
      director_trabajo_grado?: string;
    }
  ): Observable<Solicitud> {
    const usuario = this.authService.getUsuario();
    if (!usuario) throw new Error('Usuario no autenticado');

    // Asegurar que el nombre_solicitud tenga el formato correcto
    let nombreSolicitud = datosFormulario.nombre_solicitud;
    
    // Si el nombre no incluye "Solicitud Paz y Salvo -", agregarlo
    if (!nombreSolicitud.includes('Solicitud Paz y Salvo -')) {
      const nombreUsuario = usuario.nombre_completo || 
                           usuario.nombre || 
                           'Usuario';
      const nombreFinal = nombreUsuario.trim() !== '' ? nombreUsuario.trim() : 'Usuario';
      nombreSolicitud = `Solicitud Paz y Salvo - ${nombreFinal}`;
    }
    
    const body: any = {
      idUsuario: studentId,
      nombre_solicitud: nombreSolicitud,
      fecha_registro_solicitud: datosFormulario.fecha_registro_solicitud
    };

    // Agregar período académico si se proporciona
    if (datosFormulario.periodo_academico) {
      body.periodo_academico = datosFormulario.periodo_academico;
    }

    // Agregar campos de trabajo de grado si se proporcionan (con trim para limpiar espacios)
    if (datosFormulario.titulo_trabajo_grado) {
      const tituloLimpio = datosFormulario.titulo_trabajo_grado.trim();
      if (tituloLimpio.length > 0) {
        body.titulo_trabajo_grado = tituloLimpio;
      }
    }

    if (datosFormulario.director_trabajo_grado) {
      const directorLimpio = datosFormulario.director_trabajo_grado.trim();
      if (directorLimpio.length > 0) {
        body.director_trabajo_grado = directorLimpio;
      }
    }

    return this.http.post<Solicitud>(`${this.apiUrl}/crearSolicitud-PazYSalvo`, body, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(error => {
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
    
    return this.http.put(url, body, { headers: this.getAuthHeaders() });
  }

  rejectRequest(requestId: number, reason: string): Observable<any> {
    const url = `${this.apiUrl}/actualizarEstadoSolicitud`;
    const body = {
      idSolicitud: requestId,
      nuevoEstado: 'RECHAZADA',
      comentario: reason
    };
    
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
   * Subir oficio PDF asociado a una solicitud (Secretaría)
   * POST /api/solicitudes-pazysalvo/subir-oficio-pdf/{idSolicitud}
   */
  subirOficioPdf(idSolicitud: number, archivo: File): Observable<any> {
    const url = `${this.apiUrl}/subir-oficio-pdf/${idSolicitud}`;
    const formData = new FormData();
    formData.append('file', archivo);

    return this.http.post(url, formData);
  }

  /**
   * Descargar primer oficio/resolución detectado por solicitud (Funcionario)
   * GET /api/solicitudes-pazysalvo/descargarOficio/{idSolicitud}
   */
  descargarOficioPorSolicitud(idSolicitud: number): Observable<Blob> {
    const url = `${this.apiUrl}/descargarOficio/${idSolicitud}`;
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      switchMap((resp: any) => {
        const parsed = this.parseFilenameFromHeaders(resp);
        if (parsed) {
          const blob: Blob = resp.body as Blob;
          (blob as any).filename = parsed;
          return new Observable<Blob>(observer => { observer.next(blob); observer.complete(); });
        }
        // Fallback: obtener nombre del primer oficio de la solicitud
        return this.obtenerOficios(idSolicitud).pipe(
          map((oficios: any[]) => {
            const candidato = oficios?.[0]?.nombreArchivo || oficios?.[0]?.nombre || `oficio_${idSolicitud}.pdf`;
            const blob: Blob = resp.body as Blob;
            (blob as any).filename = candidato;
            return blob;
          })
        );
      })
    );
  }

  /**
   * Subir documento SIN asociar a una solicitud específica (nuevo flujo)
   * Los documentos se suben ANTES de crear la solicitud
   */
  subirDocumento(archivo: File): Observable<any> {
    const url = `${environment.apiUrl}/solicitudes-pazysalvo/subir-documento`;
    
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
    
    // El JWT interceptor agrega automáticamente el token y NO establece Content-Type para FormData
    return this.http.post(url, formData);
  }

  /**
   * Subir archivo PDF usando endpoint genérico
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
    }
    
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
    
    return this.http.put(url, {
      idSolicitud: idSolicitud,
      documentos: documentos
    }, { headers: this.getAuthHeaders() });
  }

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
   * Aprobar definitivamente la solicitud (usado por SECRETARIA)
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
   * Descargar archivo PDF usando endpoint específico de Paz y Salvo
   */
  descargarArchivo(nombreArchivo: string): Observable<Blob> {
    // USAR ENDPOINT ESPECÍFICO DE PAZ Y SALVO
    const url = `${environment.apiUrl}/solicitudes-pazysalvo/descargar-documento?filename=${encodeURIComponent(nombreArchivo)}`;
    
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map((resp: any) => {
        const filename = this.parseFilenameFromHeaders(resp) || nombreArchivo || 'oficio.pdf';
        const blob: Blob = resp.body as Blob;
        (blob as any).filename = filename;
        return blob;
      })
    );
  }

  /**
   * Alias más semántico para descargar por nombre de archivo
   */
  descargarPorNombre(filename: string): Observable<Blob> {
    return this.descargarArchivo(filename);
  }

  /**
   * NUEVO: Descargar archivo PDF por ID de documento
   * Este método es más confiable que usar el nombre del archivo
   */
  descargarArchivoPorId(idDocumento: number): Observable<Blob> {
    const url = `${environment.apiUrl}/documentos/${idDocumento}/descargar`;
    
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map((resp: any) => {
        const filename = this.parseFilenameFromHeaders(resp) || 'documento.pdf';
        const blob: Blob = resp.body as Blob;
        (blob as any).filename = filename;
        return blob;
      })
    );
  }

  /**
   * NUEVO: Descargar archivo PDF por ruta del documento
   * Usa la ruta almacenada en la base de datos
   */
  descargarArchivoPorRuta(rutaDocumento: string): Observable<Blob> {
    const nombreArchivo = rutaDocumento.split('/').pop() || rutaDocumento;
    const url = `${environment.apiUrl}/solicitudes-pazysalvo/descargar-documento?filename=${encodeURIComponent(nombreArchivo)}`;
    
    return this.http.get(url, {
      headers: this.getAuthHeaders(),
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map((resp: any) => {
        const filename = this.parseFilenameFromHeaders(resp) || nombreArchivo || 'documento.pdf';
        const blob: Blob = resp.body as Blob;
        (blob as any).filename = filename;
        return blob;
      })
    );
  }

  private parseFilenameFromHeaders(resp: any): string | null {
    try {
      const h = resp?.headers;
      const cd: string = h?.get?.('Content-Disposition') || h?.get?.('content-disposition') || '';
      if (!cd) return null;
      const match = cd.match(/filename\*=UTF-8''([^;]+)|filename=\"?([^\";]+)\"?/i);
      const raw = match?.[1] || match?.[2];
      if (!raw) return null;
      return decodeURIComponent(raw);
    } catch {
      return null;
    }
  }

  /**
   * Añadir comentario usando endpoint genérico
   */
  agregarComentario(idDocumento: number, comentario: string): Observable<any> {
    // USAR ENDPOINT GENÉRICO CORRECTO
    const url = `${environment.apiUrl}/documentos/añadirComentario`;
    const body = {
      idDocumento: idDocumento,
      comentario: comentario
    };
    
    return this.http.put(url, body, { headers: this.getAuthHeaders() });
  }

  /**
   * Generar documento de Paz y Salvo usando endpoint específico (para secretaría)
   */
  generarDocumento(idSolicitud: number, numeroDocumento: string, fechaDocumento: string, observaciones?: string): Observable<{blob: Blob, filename: string}> {
    const url = `${environment.apiUrl}/solicitudes-pazysalvo/generar-documento/${idSolicitud}`;

    // Crear FormData con los parámetros como indica el usuario
    const formData = new FormData();
    formData.append('numeroDocumento', numeroDocumento);
    formData.append('fechaDocumento', fechaDocumento);
    if (observaciones) {
      formData.append('observaciones', observaciones);
    }

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
          }
        }
        
        return { blob, filename };
      })
    );
  }

  /**
   * Obtener todos los documentos de una solicitud de Paz y Salvo
   * Para funcionarios
   */
  obtenerDocumentos(idSolicitud: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/obtenerDocumentos/${idSolicitud}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Obtener todos los documentos de una solicitud de Paz y Salvo
   * Para coordinadores
   */
  obtenerDocumentosCoordinador(idSolicitud: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/obtenerDocumentos/coordinador/${idSolicitud}`, {
      headers: this.getAuthHeaders()
    });
  }

  /**
   * Asociar documentos huérfanos a una solicitud
   */
  asociarDocumentosHuerfanos(idSolicitud: number): Observable<any> {
    const url = `${this.apiUrl}/asociar-documentos-huerfanos/${idSolicitud}`;
    
    return this.http.post(url, {}, {
      headers: this.getAuthHeaders()
    });
  }


}
