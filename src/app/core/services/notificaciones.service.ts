import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, map, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notificacion } from '../models/notificaciones.model';

/**
 * Notificaciones del usuario. Los errores 401 los gestiona errorInterceptor
 * (cierra sesión y redirige a /login).
 */
@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/notificaciones`;
  private readonly cambios = new Subject<void>();

  /** Emite cuando algo pudo cambiar las notificaciones (p. ej. al crear una solicitud). */
  readonly cambios$ = this.cambios.asObservable();

  obtenerNoLeidas(idUsuario: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.apiUrl}/usuario/${idUsuario}/no-leidas`).pipe(
      timeout(5000),
      map(conFechas)
    );
  }

  contarNoLeidas(idUsuario: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/usuario/${idUsuario}/contar-no-leidas`).pipe(timeout(3000));
  }

  obtenerTodas(idUsuario: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.apiUrl}/usuario/${idUsuario}`).pipe(map(conFechas));
  }

  marcarComoLeida(idNotificacion: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${idNotificacion}/marcar-leida`, {});
  }

  marcarTodasComoLeidas(idUsuario: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/usuario/${idUsuario}/marcar-todas-leidas`, {});
  }

  /** Avisa al contador del header para que se actualice sin esperar al siguiente sondeo. */
  actualizarNotificaciones(): void {
    this.cambios.next();
  }
}

/** El backend envía fechaCreacion como texto. */
function conFechas(notificaciones: Notificacion[]): Notificacion[] {
  return notificaciones.map(n => ({
    ...n,
    fechaCreacion: typeof n.fechaCreacion === 'string' ? new Date(n.fechaCreacion) : n.fechaCreacion
  }));
}
