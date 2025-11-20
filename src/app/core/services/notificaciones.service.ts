import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Notificacion {
  id: number;
  id_notificacion?: number;
  titulo: string;
  mensaje: string;
  tipoSolicitud: string;
  tipoNotificacion: string;
  fechaCreacion: string;
  esUrgente: boolean;
  accion: string;
  urlAccion: string;
  categoria: string;
  icono: string;
  color: string;
  tiempoTranscurrido: string;
  leida?: boolean;
}

export interface NotificacionesResponse {
  totalNoLeidas: number;
  cursosVeranoNoLeidas: number;
  notificaciones: Notificacion[];
  categorias: {
    CURSO_VERANO: number;
    ECAES: number;
    REINGRESO: number;
    HOMOLOGACION: number;
    PAZ_SALVO: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private apiUrl = `${environment.apiUrl}/notificaciones`;
  private notificacionesSubject = new BehaviorSubject<NotificacionesResponse | null>(null);
  public notificaciones$ = this.notificacionesSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtiene las notificaciones del header para un usuario específico
   */
  obtenerNotificacionesHeader(idUsuario: number): Observable<NotificacionesResponse> {
    // Notificaciones deshabilitadas - retornar vacío
    const notificacionesVacias: NotificacionesResponse = {
      totalNoLeidas: 0,
      cursosVeranoNoLeidas: 0,
      notificaciones: [],
      categorias: {
        CURSO_VERANO: 0,
        ECAES: 0,
        REINGRESO: 0,
        HOMOLOGACION: 0,
        PAZ_SALVO: 0
      }
    };

    return new Observable(observer => {
      observer.next(notificacionesVacias);
      observer.complete();
    });
  }

  /**
   * Marca todas las notificaciones como leídas para un usuario
   */
  marcarNotificacionesComoLeidas(idUsuario: number): Observable<any> {
    // Marcando notificaciones como leídas
    
    return this.http.put(`${this.apiUrl}/header/${idUsuario}/marcar-leidas`, {})
      .pipe(
        tap(response => {
          // Notificaciones marcadas como leídas
          // Actualizar el estado local
          const currentNotificaciones = this.notificacionesSubject.value;
          if (currentNotificaciones) {
            currentNotificaciones.totalNoLeidas = 0;
            currentNotificaciones.notificaciones.forEach(notif => {
              // Aquí podrías marcar individualmente como leídas si el backend lo soporta
            });
            this.notificacionesSubject.next(currentNotificaciones);
          }
        })
      );
  }

  /**
   * Obtiene el estado actual de las notificaciones
   */
  getNotificacionesActuales(): NotificacionesResponse | null {
    return this.notificacionesSubject.value;
  }

  /**
   * Actualiza manualmente las notificaciones (útil para refresh)
   */
  actualizarNotificaciones(idUsuario: number): void {
    this.obtenerNotificacionesHeader(idUsuario).subscribe({
      next: () => {
        // Notificaciones actualizadas manualmente
      },
      error: (error) => {
        console.error('[NOTIFICACIONES] Error al actualizar notificaciones:', error);
      }
    });
  }

  /**
   * Obtiene notificaciones del dashboard (compatible con código existente)
   */
  getDashboardNotificaciones(idUsuario: number): Observable<any> {
    // Obteniendo notificaciones del dashboard
    return this.obtenerNotificacionesHeader(idUsuario);
  }

  /**
   * Observable para el número de notificaciones no leídas
   */
  get noLeidas$(): Observable<number> {
    return new Observable(observer => {
      const currentNotificaciones = this.notificacionesSubject.value;
      observer.next(currentNotificaciones?.totalNoLeidas || 0);
      
      const subscription = this.notificaciones$.subscribe(response => {
        observer.next(response?.totalNoLeidas || 0);
      });
      
      return () => subscription.unsubscribe();
    });
  }

  /**
   * Inicia el polling de notificaciones (compatible con código existente)
   */
  iniciarPolling(idUsuario: number, intervalo: number = 30000): void {
    // Iniciando polling de notificaciones
    
    // Cargar notificaciones inmediatamente
    this.actualizarNotificaciones(idUsuario);
    
    // Configurar polling periódico
    const interval = setInterval(() => {
      this.actualizarNotificaciones(idUsuario);
    }, intervalo);
    
    // Almacenar el intervalo para poder limpiarlo después
    (this as any).pollingInterval = interval;
  }

  /**
   * Detiene el polling de notificaciones
   */
  detenerPolling(): void {
    if ((this as any).pollingInterval) {
      clearInterval((this as any).pollingInterval);
      (this as any).pollingInterval = null;
      // Polling detenido
    }
  }

  /**
   * Marca todas las notificaciones como leídas (alias para compatibilidad)
   */
  marcarTodasLeidas(idUsuario: number): Observable<any> {
    return this.marcarNotificacionesComoLeidas(idUsuario);
  }

  /**
   * Marca una notificación individual como leída
   */
  marcarNotificacionLeida(idNotificacion: number): Observable<any> {
    // Marcando notificación como leída
    return this.http.put(`${this.apiUrl}/notificaciones/${idNotificacion}/marcar-leida`, {});
  }

  /**
   * Obtiene el icono por tipo de notificación
   */
  getIconoTipo(tipoNotificacion: string): string {
    const iconos: { [key: string]: string } = {
      'APROBADO': 'check_circle',
      'RECHAZADO': 'cancel',
      'PENDIENTE': 'schedule',
      'URGENTE': 'priority_high',
      'INFORMACION': 'info'
    };
    return iconos[tipoNotificacion] || 'notifications';
  }

  /**
   * Obtiene el color por tipo de notificación
   */
  getColorTipo(tipoNotificacion: string): string {
    const colores: { [key: string]: string } = {
      'APROBADO': '#4caf50', // Verde
      'RECHAZADO': '#f44336', // Rojo
      'PENDIENTE': '#ff9800', // Naranja
      'URGENTE': '#e91e63', // Rosa
      'INFORMACION': '#2196f3' // Azul
    };
    return colores[tipoNotificacion] || '#666666';
  }

  /**
   * Crea una notificación de prueba para un usuario
   */
  crearNotificacionPrueba(idUsuario: number): Observable<any> {
    // Creando notificación de prueba
    
    return this.http.post(`${this.apiUrl}/prueba/${idUsuario}`, {})
      .pipe(
        tap(response => {
          // Notificación de prueba creada
          // Actualizar las notificaciones después de crear la de prueba
          this.actualizarNotificaciones(idUsuario);
        })
      );
  }
}