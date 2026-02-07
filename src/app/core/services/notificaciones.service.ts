import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, Subscription, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  NotificacionDTORespuesta,
  NotificacionDTOPeticion,
  Notificacion,
  NotificacionesResponse
} from '../models/notificaciones.model';
import { enrichNotificaciones } from '../utils/notificaciones.util';

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private apiUrl = `${environment.apiUrl}/notificaciones`;
  private notificacionesSubject = new BehaviorSubject<NotificacionesResponse | null>(null);
  public notificaciones$ = this.notificacionesSubject.asObservable();
  private pollingSubscription?: Subscription;
  private currentUserId?: number;

  constructor(private http: HttpClient) {}

  // ===== ENDPOINTS PRINCIPALES =====

  /**
   * Crear notificación manualmente
   */
  crearNotificacion(notificacion: NotificacionDTOPeticion): Observable<NotificacionDTORespuesta> {
    return this.http.post<NotificacionDTORespuesta>(`${this.apiUrl}/crear`, notificacion)
      .pipe(
        tap((response) => {
          const userId = notificacion.idUsuario || this.currentUserId;
          if (userId) {
            setTimeout(() => {
              this.actualizarNotificaciones(userId);
            }, 500);
          }
        }),
        catchError((error) => {
          return this.handleError(error);
        })
      );
  }

  /**
   * Obtener todas las notificaciones de un usuario
   */
  obtenerNotificacionesPorUsuario(idUsuario: number): Observable<NotificacionDTORespuesta[]> {
    return this.http.get<NotificacionDTORespuesta[]>(`${this.apiUrl}/usuario/${idUsuario}`)
      .pipe(
        catchError((error) => {
          if (error.status === 403) {
            return of([]);
          }
          return this.handleError(error);
        })
      );
  }

  /**
   * Obtener notificaciones no leídas de un usuario
   */
  obtenerNotificacionesNoLeidas(idUsuario: number): Observable<NotificacionDTORespuesta[]> {
    const url = `${this.apiUrl}/usuario/${idUsuario}/no-leidas`;
    return this.http.get<NotificacionDTORespuesta[]>(url)
      .pipe(
        catchError((error) => {
          if (error.status === 403) {
            return of([]);
          }
          return this.handleError(error);
        })
      );
  }

  /**
   * Obtener notificaciones urgentes de un usuario
   */
  obtenerNotificacionesUrgentes(idUsuario: number): Observable<NotificacionDTORespuesta[]> {
    return this.http.get<NotificacionDTORespuesta[]>(`${this.apiUrl}/usuario/${idUsuario}/urgentes`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Contar notificaciones no leídas
   */
  contarNotificacionesNoLeidas(idUsuario: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/usuario/${idUsuario}/contar-no-leidas`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener notificaciones por tipo de solicitud
   */
  obtenerNotificacionesPorTipoSolicitud(tipoSolicitud: string): Observable<NotificacionDTORespuesta[]> {
    return this.http.get<NotificacionDTORespuesta[]>(`${this.apiUrl}/tipo-solicitud/${tipoSolicitud}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener notificaciones por solicitud
   */
  obtenerNotificacionesPorSolicitud(idSolicitud: number): Observable<NotificacionDTORespuesta[]> {
    return this.http.get<NotificacionDTORespuesta[]>(`${this.apiUrl}/solicitud/${idSolicitud}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener notificación por ID
   */
  obtenerNotificacionPorId(idNotificacion: number): Observable<NotificacionDTORespuesta> {
    return this.http.get<NotificacionDTORespuesta>(`${this.apiUrl}/${idNotificacion}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Marcar notificación como leída
   */
  marcarNotificacionLeida(idNotificacion: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${idNotificacion}/marcar-leida`, {})
      .pipe(
        tap(() => {
          // Actualizar estado local
          if (this.currentUserId) {
            this.actualizarNotificaciones(this.currentUserId);
          }
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  marcarTodasComoLeidas(idUsuario: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/usuario/${idUsuario}/marcar-todas-leidas`, {})
      .pipe(
        tap(() => {
          // Actualizar estado local
          this.actualizarNotificaciones(idUsuario);
        }),
        catchError(this.handleError)
      );
  }

  // ===== MÉTODOS COMPATIBLES CON CÓDIGO EXISTENTE =====

  /**
   * Obtiene las notificaciones del header para un usuario específico
   * Compatible con el código existente
   */
  obtenerNotificacionesHeader(idUsuario: number): Observable<NotificacionesResponse> {
    return new Observable(observer => {
      this.obtenerNotificacionesNoLeidas(idUsuario).subscribe({
        next: (notificaciones) => {
          const notificacionesEnriquecidas = enrichNotificaciones(notificaciones);
          
          // Calcular categorías
          const categorias = {
            CURSO_VERANO: 0,
            ECAES: 0,
            REINGRESO: 0,
            HOMOLOGACION: 0,
            PAZ_SALVO: 0
          };

          notificacionesEnriquecidas.forEach(notif => {
            const tipo = notif.tipoSolicitud;
            if (tipo === 'CURSO_VERANO_PREINSCRIPCION' || tipo === 'CURSO_VERANO_INSCRIPCION') {
              categorias.CURSO_VERANO++;
            } else if (tipo === 'ECAES') {
              categorias.ECAES++;
            } else if (tipo === 'REINGRESO') {
              categorias.REINGRESO++;
            } else if (tipo === 'HOMOLOGACION') {
              categorias.HOMOLOGACION++;
            } else if (tipo === 'PAZ_Y_SALVO') {
              categorias.PAZ_SALVO++;
            }
          });

          const cursosVeranoNoLeidas = categorias.CURSO_VERANO;

          const response: NotificacionesResponse = {
            totalNoLeidas: notificacionesEnriquecidas.length,
            cursosVeranoNoLeidas,
            notificaciones: notificacionesEnriquecidas,
            categorias
          };

          this.notificacionesSubject.next(response);
          observer.next(response);
          observer.complete();
        },
        error: (error) => {
          // Retornar respuesta vacía en caso de error
          const emptyResponse: NotificacionesResponse = {
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
          this.notificacionesSubject.next(emptyResponse);
          observer.next(emptyResponse);
          observer.complete();
        }
      });
    });
  }

  /**
   * Marca todas las notificaciones como leídas para un usuario
   * Compatible con el código existente
   */
  marcarNotificacionesComoLeidas(idUsuario: number): Observable<any> {
    return this.marcarTodasComoLeidas(idUsuario);
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
    this.currentUserId = idUsuario;
    this.obtenerNotificacionesHeader(idUsuario).subscribe();
  }

  /**
   * Obtiene notificaciones del dashboard (compatible con código existente)
   */
  getDashboardNotificaciones(idUsuario: number): Observable<any> {
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
    this.currentUserId = idUsuario;
    
    this.detenerPolling();
    
    this.actualizarNotificaciones(idUsuario);
    
    this.pollingSubscription = interval(intervalo).subscribe(() => {
      this.actualizarNotificaciones(idUsuario);
    });
  }

  /**
   * Detiene el polling de notificaciones
   */
  detenerPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }

  /**
   * Marca todas las notificaciones como leídas (alias para compatibilidad)
   */
  marcarTodasLeidas(idUsuario: number): Observable<any> {
    return this.marcarNotificacionesComoLeidas(idUsuario);
  }

  /**
   * Marca una notificación individual como leída (compatible con código existente)
   */
  marcarNotificacionLeidaCompatible(idNotificacion: number): Observable<any> {
    return this.marcarNotificacionLeida(idNotificacion);
  }

  /**
   * Obtiene el icono por tipo de notificación (compatible con código existente)
   */
  getIconoTipo(tipoNotificacion: string): string {
    const iconos: { [key: string]: string } = {
      'APROBADA': 'check_circle',
      'RECHAZADA': 'cancel',
      'ENVIADA': 'send',
      'CAMBIO_ESTADO': 'update',
      'NUEVA_SOLICITUD': 'add_circle',
      'URGENTE': 'priority_high',
      'INFORMACION': 'info'
    };
    return iconos[tipoNotificacion] || 'notifications';
  }

  /**
   * Obtiene el color por tipo de notificación (compatible con código existente)
   */
  getColorTipo(tipoNotificacion: string): string {
    // Colores institucionales - Sistema de Diseño TIC Universidad del Cauca
    const colores: { [key: string]: string } = {
      'APROBADA': '#249337',
      'RECHAZADA': '#FF6D0A',
      'ENVIADA': '#1D72D3',
      'CAMBIO_ESTADO': '#FF6D0A',
      'NUEVA_SOLICITUD': '#1D72D3',
      'URGENTE': '#9D0311',
      'INFORMACION': '#1D72D3'
    };
    return colores[tipoNotificacion] || '#454444';
  }

  /**
   * Crea una notificación de prueba para un usuario (compatible con código existente)
   */
  crearNotificacionPrueba(idUsuario: number): Observable<any> {
    const notificacionPrueba: NotificacionDTOPeticion = {
      tipoSolicitud: 'ECAES',
      tipoNotificacion: 'NUEVA_SOLICITUD',
      titulo: 'Notificación de prueba',
      mensaje: 'Esta es una notificación de prueba generada automáticamente.',
      idUsuario,
      esUrgente: false
    };
    
    return this.crearNotificacion(notificacionPrueba);
  }

  // ===== MANEJO DE ERRORES =====

  private handleError = (error: any): Observable<never> => {
    if (error.status === 401) {
      // Token expirado, redirigir al login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  };
}
