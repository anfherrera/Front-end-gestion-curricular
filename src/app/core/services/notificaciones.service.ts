import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { map, switchMap, startWith } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ================== MODELOS ==================
export interface Notificacion {
  id_notificacion: number;
  tipoSolicitud: string;
  tipoNotificacion: string;
  titulo: string;
  mensaje: string;
  fechaCreacion: Date;
  leida: boolean;
  esUrgente: boolean;
  urlAccion: string;
}

export interface DashboardNotificaciones {
  notificacionesRecientes: Notificacion[];
  notificacionesNoLeidas: number;
  notificacionesUrgentes: number;
}

// ================== SERVICIO ==================
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly BASE_URL = `${environment.apiUrl}/notificaciones`;
  
  // Subject para notificaciones en tiempo real
  private notificacionesSubject = new BehaviorSubject<Notificacion[]>([]);
  public notificaciones$ = this.notificacionesSubject.asObservable();

  // Subject para contador de no leídas
  private noLeidasSubject = new BehaviorSubject<number>(0);
  public noLeidas$ = this.noLeidasSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ====== MÉTODOS PRINCIPALES ======
  
  // Obtener todas las notificaciones de un usuario
  getNotificacionesUsuario(idUsuario: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.BASE_URL}/usuario/${idUsuario}`)
      .pipe(
        map(notificaciones => {
          // Actualizar el subject
          this.notificacionesSubject.next(notificaciones);
          return notificaciones;
        })
      );
  }

  // Obtener notificaciones no leídas
  getNotificacionesNoLeidas(idUsuario: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${this.BASE_URL}/usuario/${idUsuario}/no-leidas`)
      .pipe(
        map(notificaciones => {
          // Actualizar contador
          this.noLeidasSubject.next(notificaciones.length);
          return notificaciones;
        })
      );
  }

  // Obtener dashboard de notificaciones
  getDashboardNotificaciones(idUsuario: number): Observable<DashboardNotificaciones> {
    return this.http.get<Notificacion[]>(`${this.BASE_URL}/dashboard/${idUsuario}`)
      .pipe(
        map(notificaciones => {
          // Asegurar que notificaciones sea un array
          const notificacionesArray = Array.isArray(notificaciones) ? notificaciones : [];
          
          const noLeidas = notificacionesArray.filter(n => !n.leida).length;
          const urgentes = notificacionesArray.filter(n => n.esUrgente && !n.leida).length;
          const recientes = notificacionesArray.slice(0, 5); // Últimas 5

          // Actualizar subjects
          this.notificacionesSubject.next(notificacionesArray);
          this.noLeidasSubject.next(noLeidas);

          return {
            notificacionesRecientes: recientes,
            notificacionesNoLeidas: noLeidas,
            notificacionesUrgentes: urgentes
          };
        })
      );
  }

  // Marcar notificación como leída
  marcarNotificacionLeida(idNotificacion: number): Observable<void> {
    return this.http.put<void>(`${this.BASE_URL}/${idNotificacion}/marcar-leida`, {})
      .pipe(
        map(() => {
          // Actualizar el estado local
          const notificaciones = this.notificacionesSubject.value;
          const index = notificaciones.findIndex(n => n.id_notificacion === idNotificacion);
          if (index !== -1) {
            notificaciones[index].leida = true;
            this.notificacionesSubject.next([...notificaciones]);
            this.noLeidasSubject.next(notificaciones.filter(n => !n.leida).length);
          }
        })
      );
  }

  // Marcar todas las notificaciones como leídas
  marcarTodasLeidas(idUsuario: number): Observable<void> {
    return this.http.put<void>(`${this.BASE_URL}/usuario/${idUsuario}/marcar-todas-leidas`, {})
      .pipe(
        map(() => {
          // Actualizar el estado local
          const notificaciones = this.notificacionesSubject.value;
          notificaciones.forEach(n => n.leida = true);
          this.notificacionesSubject.next([...notificaciones]);
          this.noLeidasSubject.next(0);
        })
      );
  }

  // ====== MÉTODOS DE TIEMPO REAL ======
  
  // Iniciar polling de notificaciones
  iniciarPolling(idUsuario: number, intervalo: number = 30000): Observable<Notificacion[]> {
    return interval(intervalo)
      .pipe(
        startWith(0),
        switchMap(() => this.getNotificacionesNoLeidas(idUsuario))
      );
  }

  // Detener polling (se maneja automáticamente con unsubscribe)
  detenerPolling(): void {
    // El polling se detiene automáticamente cuando se hace unsubscribe
  }

  // ====== MÉTODOS DE UTILIDAD ======
  
  // Obtener notificaciones urgentes
  getNotificacionesUrgentes(): Observable<Notificacion[]> {
    return this.notificaciones$.pipe(
      map(notificaciones => notificaciones.filter(n => n.esUrgente && !n.leida))
    );
  }

  // Obtener notificaciones por tipo
  getNotificacionesPorTipo(tipoSolicitud: string): Observable<Notificacion[]> {
    return this.notificaciones$.pipe(
      map(notificaciones => notificaciones.filter(n => n.tipoSolicitud === tipoSolicitud))
    );
  }

  // Formatear fecha de notificación
  formatearFecha(fecha: Date): string {
    const ahora = new Date();
    const diff = ahora.getTime() - new Date(fecha).getTime();
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(diff / 3600000);
    const dias = Math.floor(diff / 86400000);

    if (minutos < 1) return 'Ahora mismo';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (horas < 24) return `Hace ${horas}h`;
    if (dias < 7) return `Hace ${dias} días`;
    
    return new Date(fecha).toLocaleDateString('es-ES');
  }

  // Obtener icono según tipo de notificación
  getIconoTipo(tipoNotificacion: string): string {
    const iconos: { [key: string]: string } = {
      'APROBACION': 'check_circle',
      'RECHAZO': 'cancel',
      'RECORDATORIO': 'schedule',
      'PAGO': 'payment',
      'DOCUMENTO': 'description',
      'GENERAL': 'notifications'
    };
    return iconos[tipoNotificacion] || 'notifications';
  }

  // Obtener color según tipo de notificación
  getColorTipo(tipoNotificacion: string): string {
    const colores: { [key: string]: string } = {
      'APROBACION': 'green',
      'RECHAZO': 'red',
      'RECORDATORIO': 'orange',
      'PAGO': 'blue',
      'DOCUMENTO': 'purple',
      'GENERAL': 'gray'
    };
    return colores[tipoNotificacion] || 'gray';
  }
}
