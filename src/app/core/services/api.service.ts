import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../utils/api-endpoints';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // ===== AUTENTICACIÓN =====
  login(correo: string, password: string): Observable<any> {
    // Conectar al backend real
    return this.http.post(ApiEndpoints.AUTH.LOGIN, { correo, password });
  }

  // Método alternativo si el backend requiere el JSON completo
  loginConDatosCompletos(datosUsuario: any): Observable<any> {
    return this.http.post(ApiEndpoints.AUTH.LOGIN, datosUsuario);
  }

  refreshToken(): Observable<any> {
    return this.http.post(ApiEndpoints.AUTH.REFRESH, {});
  }

  logout(): Observable<any> {
    return this.http.post(ApiEndpoints.AUTH.LOGOUT, {});
  }

  getProfile(): Observable<any> {
    return this.http.get(ApiEndpoints.AUTH.PROFILE);
  }

  // ===== USUARIOS =====
  getUsuarios(): Observable<any> {
    return this.http.get(ApiEndpoints.USUARIOS.BASE);
  }

  getUsuarioById(id: string): Observable<any> {
    return this.http.get(ApiEndpoints.USUARIOS.BY_ID(id));
  }

  getUsuarioByEmail(email: string): Observable<any> {
    return this.http.get(ApiEndpoints.USUARIOS.BY_EMAIL(email));
  }

  getUsuariosByRole(role: string): Observable<any> {
    return this.http.get(ApiEndpoints.USUARIOS.BY_ROLE(role));
  }

  updateUsuario(id: string, usuario: any): Observable<any> {
    return this.http.put(ApiEndpoints.USUARIOS.UPDATE(id), usuario);
  }

  deleteUsuario(id: string): Observable<any> {
    return this.http.delete(ApiEndpoints.USUARIOS.DELETE(id));
  }

  // ===== PROCESOS =====
  getProcesos(): Observable<any> {
    return this.http.get(ApiEndpoints.PROCESOS.BASE);
  }

  getProcesoById(id: string): Observable<any> {
    return this.http.get(ApiEndpoints.PROCESOS.BY_ID(id));
  }

  getProcesosByEstado(estado: string): Observable<any> {
    return this.http.get(ApiEndpoints.PROCESOS.BY_ESTADO(estado));
  }

  getProcesosByUsuario(usuarioId: string): Observable<any> {
    return this.http.get(ApiEndpoints.PROCESOS.BY_USUARIO(usuarioId));
  }

  updateProceso(id: string, proceso: any): Observable<any> {
    return this.http.put(ApiEndpoints.PROCESOS.UPDATE(id), proceso);
  }

  deleteProceso(id: string): Observable<any> {
    return this.http.delete(ApiEndpoints.PROCESOS.DELETE(id));
  }
}
