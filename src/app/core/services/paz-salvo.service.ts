import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Solicitud, Archivo, Usuario } from '../models/procesos.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PazSalvoService {

  private apiUrl = 'http://localhost:5000/api/solicitudes-paz-salvo';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(isFile: boolean = false): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      ...(isFile ? {} : { 'Content-Type': 'application/json' }),
      Authorization: token ? `Bearer ${token}` : ''
    });
  }

  // ================================
  // Solicitudes estudiante
  // ================================
  getStudentRequests(studentId: number): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(
      `${this.apiUrl}/listar/${studentId}`,
      { headers: this.getAuthHeaders() }
    );
  }

  sendRequest(studentId: number, archivos: Archivo[]): Observable<Solicitud> {
    const usuario: Usuario | null = this.authService.getUsuario();
    if (!usuario) throw new Error('Usuario no autenticado');

    const body = {
      nombre_solicitud: 'Solicitud Paz y Salvo',
      fecha_registro: new Date().toISOString(),
      usuario,
      archivos
    };

    return this.http.post<Solicitud>(
      `${this.apiUrl}/crearSolicitud`,
      body,
      { headers: this.getAuthHeaders() }
    );
  }

  uploadFile(requestId: number, archivo: File): Observable<Archivo> {
    const formData = new FormData();
    formData.append('file', archivo);

    return this.http.post<Archivo>(
      `${this.apiUrl}/${requestId}/subir-archivo`,
      formData,
      { headers: this.getAuthHeaders(true) }
    );
  }

  downloadFile(requestId: number, archivoNombre: string): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/${requestId}/descargar-archivo/${archivoNombre}`,
      { headers: this.getAuthHeaders(), responseType: 'blob' }
    );
  }

  approveDocument(requestId: number, archivoNombre: string): Observable<Archivo> {
    return this.http.post<Archivo>(
      `${this.apiUrl}/${requestId}/aprobar-archivo`,
      { nombreArchivo: archivoNombre },
      { headers: this.getAuthHeaders() }
    );
  }

  rejectDocument(requestId: number, archivoNombre: string): Observable<Archivo> {
    return this.http.post<Archivo>(
      `${this.apiUrl}/${requestId}/rechazar-archivo`,
      { nombreArchivo: archivoNombre },
      { headers: this.getAuthHeaders() }
    );
  }

  generateOfficio(requestId: number): Observable<string> {
    return this.http.get<string>(
      `${this.apiUrl}/${requestId}/generar-oficio`,
      { headers: this.getAuthHeaders() }
    );
  }

  sendOfficio(requestId: number): Observable<Solicitud> {
    return this.http.post<Solicitud>(
      `${this.apiUrl}/${requestId}/enviar-oficio`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // ================================
  // Solicitudes para revisión de funcionarios/coordinadores
  // ================================
  getPendingRequests(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(
      `${this.apiUrl}/pendientes`,
      { headers: this.getAuthHeaders() }
    );
  }

  approveRequest(requestId: number): Observable<Solicitud> {
    return this.http.post<Solicitud>(
      `${this.apiUrl}/${requestId}/aprobar`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  rejectRequest(requestId: number, motivo?: string): Observable<Solicitud> {
    return this.http.post<Solicitud>(
      `${this.apiUrl}/${requestId}/rechazar`,
      { motivo },
      { headers: this.getAuthHeaders() }
    );
  }

  completeValidation(requestId: number): Observable<Solicitud> {
    return this.http.post<Solicitud>(
      `${this.apiUrl}/${requestId}/completar-validacion`,
      {},
      { headers: this.getAuthHeaders() }
    );
  }
}
