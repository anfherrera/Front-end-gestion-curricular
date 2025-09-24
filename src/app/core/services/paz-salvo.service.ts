import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Solicitud, Archivo, Usuario } from '../models/procesos.model';
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
  getStudentRequests(studentId: number): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.apiUrl}/listarSolicitud-PazYSalvo/${studentId}`, { headers: this.getAuthHeaders() });
  }

  getPendingRequests(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.apiUrl}/listarSolicitud-PazYSalvo/funcionario`, { headers: this.getAuthHeaders() });
  }

  getCoordinatorRequests(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.apiUrl}/listarSolicitud-PazYSalvo/coordinador`, { headers: this.getAuthHeaders() });
  }

  getRequestById(requestId: number): Observable<Solicitud> {
    return this.http.get<Solicitud>(`${this.apiUrl}/listarSolicitud-PazYSalvo/${requestId}`, { headers: this.getAuthHeaders() });
  }

  sendRequest(studentId: number, archivos: Archivo[]): Observable<Solicitud> {
    const usuario = this.authService.getUsuario();
    if (!usuario) throw new Error('Usuario no autenticado');

    const body = {
      nombre_solicitud: 'Solicitud Paz y Salvo',
      esSeleccionado: false,
      objUsuario: { id_usuario: usuario.id_usuario },
      archivos
    };

    return this.http.post<Solicitud>(`${this.apiUrl}/crearSolicitud-PazYSalvo`, body, { headers: this.getAuthHeaders() });
  }

  approveRequest(requestId: number): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.apiUrl}/${requestId}/aprobar`, {}, { headers: this.getAuthHeaders() });
  }

  rejectRequest(requestId: number, reason: string): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.apiUrl}/${requestId}/rechazar`, { motivo: reason }, { headers: this.getAuthHeaders() });
  }

  completeValidation(requestId: number): Observable<Solicitud> {
    return this.http.post<Solicitud>(`${this.apiUrl}/${requestId}/completar-validacion`, {}, { headers: this.getAuthHeaders() });
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
    return this.http.put(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: idSolicitud,
      documentos: documentos
    }, { headers: this.getAuthHeaders() });
  }

  approveDefinitively(idSolicitud: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/actualizarEstadoSolicitud`, {
      idSolicitud: idSolicitud,
      nuevoEstado: 'APROBADA'
    }, { headers: this.getAuthHeaders() });
  }
}
