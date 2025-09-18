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
    return this.http.get<Solicitud[]>(`${this.apiUrl}/pendientes`, { headers: this.getAuthHeaders() });
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

    return this.http.post<Solicitud>(`${this.apiUrl}/crearPazYSalvo`, body, { headers: this.getAuthHeaders() });
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

  downloadFile(requestId: number, archivoNombre: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${requestId}/descargar-archivo/${archivoNombre}`, { headers: this.getAuthHeaders(), responseType: 'blob' });
  }

  approveDocument(requestId: number, archivoNombre: string): Observable<Archivo> {
    return this.http.post<Archivo>(`${this.apiUrl}/${requestId}/aprobar-archivo`, { nombreArchivo: archivoNombre }, { headers: this.getAuthHeaders() });
  }

  rejectDocument(requestId: number, archivoNombre: string): Observable<Archivo> {
    return this.http.post<Archivo>(`${this.apiUrl}/${requestId}/rechazar-archivo`, { nombreArchivo: archivoNombre }, { headers: this.getAuthHeaders() });
  }
}
