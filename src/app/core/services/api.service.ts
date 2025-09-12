import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiEndpoints } from '../utils/api-endpoints';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // ===== AUTENTICACIÓN =====
  login(correo: string, password: string): Observable<any> {
    // TEMPORAL: Simular login hasta que implementes el backend
    return new Observable(observer => {
      // Crear un JWT mock válido
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ 
        sub: correo, 
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 horas
        iat: Math.floor(Date.now() / 1000)
      }));
      const signature = btoa('mock-signature');
      const mockJWT = `${header}.${payload}.${signature}`;
      
      // Simular respuesta exitosa
      const mockResponse = {
        token: mockJWT,
        usuario: {
          id: 1,
          nombre: 'Usuario de Prueba',
          email: correo,
          codigo: '2021001234',
          rol: { nombre: 'estudiante' }
        }
      };
      
      setTimeout(() => {
        observer.next(mockResponse);
        observer.complete();
      }, 1000);
    });
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
