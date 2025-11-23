import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, timeout } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { Notificacion } from '../models/notificaciones.model';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private apiUrl = `${environment.apiUrl}/notificaciones`;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  /**
   * Método privado para obtener los headers con el token
   * Nota: El JWT interceptor también agrega el token automáticamente,
   * pero lo incluimos aquí según las instrucciones
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Obtener notificaciones no leídas de un usuario
   * GET /api/notificaciones/usuario/{idUsuario}/no-leidas
   */
  obtenerNoLeidas(idUsuario: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(
      `${this.apiUrl}/usuario/${idUsuario}/no-leidas`,
      { headers: this.getHeaders() }
    ).pipe(
      timeout(5000), // Timeout de 5 segundos
      map(notificaciones => {
        // Convertir fechaCreacion de string a Date si es necesario
        return notificaciones.map(notif => ({
          ...notif,
          fechaCreacion: typeof notif.fechaCreacion === 'string' 
            ? new Date(notif.fechaCreacion) 
            : notif.fechaCreacion
        }));
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Contar notificaciones no leídas
   * GET /api/notificaciones/usuario/{idUsuario}/contar-no-leidas
   */
  contarNoLeidas(idUsuario: number): Observable<number> {
    return this.http.get<number>(
      `${this.apiUrl}/usuario/${idUsuario}/contar-no-leidas`,
      { headers: this.getHeaders() }
    ).pipe(
      timeout(3000), // Timeout de 3 segundos para el contador (más rápido)
      catchError(this.handleError)
    );
  }

  /**
   * Obtener todas las notificaciones de un usuario
   * GET /api/notificaciones/usuario/{idUsuario}
   */
  obtenerTodas(idUsuario: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(
      `${this.apiUrl}/usuario/${idUsuario}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(notificaciones => {
        // Convertir fechaCreacion de string a Date si es necesario
        return notificaciones.map(notif => ({
          ...notif,
          fechaCreacion: typeof notif.fechaCreacion === 'string' 
            ? new Date(notif.fechaCreacion) 
            : notif.fechaCreacion
        }));
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener notificaciones urgentes de un usuario
   * GET /api/notificaciones/usuario/{idUsuario}/urgentes
   */
  obtenerUrgentes(idUsuario: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(
      `${this.apiUrl}/usuario/${idUsuario}/urgentes`,
      { headers: this.getHeaders() }
    ).pipe(
      map(notificaciones => {
        // Convertir fechaCreacion de string a Date si es necesario
        return notificaciones.map(notif => ({
          ...notif,
          fechaCreacion: typeof notif.fechaCreacion === 'string' 
            ? new Date(notif.fechaCreacion) 
            : notif.fechaCreacion
        }));
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Marcar notificación como leída
   * PUT /api/notificaciones/{idNotificacion}/marcar-leida
   */
  marcarComoLeida(idNotificacion: number): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/${idNotificacion}/marcar-leida`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Marcar todas como leídas
   * PUT /api/notificaciones/usuario/{idUsuario}/marcar-todas-leidas
   */
  marcarTodasComoLeidas(idUsuario: number): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/usuario/${idUsuario}/marcar-todas-leidas`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Manejo de errores según las instrucciones
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    if (error.status === 401) {
      // Token inválido - redirigir a login
      console.error('Token inválido - redirigiendo a login');
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
      return throwError(() => error);
    } else if (error.status === 403) {
      // Sin permisos
      console.warn('No tienes permisos para ver estas notificaciones');
      return throwError(() => error);
    } else {
      // Error genérico
      console.error('Error al procesar la solicitud:', error);
      return throwError(() => error);
    }
  };
}

