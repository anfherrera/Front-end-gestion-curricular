import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, filter } from 'rxjs';
import { NotificacionesService, Notificacion } from '../../../core/services/notificaciones.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-cursos-intersemestrales',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    MatIconModule, 
    MatBadgeModule, 
    MatButtonModule, 
    MatTooltipModule
  ],
  templateUrl: './cursos-intersemestrales.component.html',
  styleUrls: ['./cursos-intersemestrales.component.css']
})
export class CursosIntersemestralesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  opciones = [
    { titulo: 'Realizar Solicitud', ruta: 'solicitudes', icon: 'add_circle', badge: 0 },
    { titulo: 'Cursos Disponibles', ruta: 'cursos-ofertados', icon: 'school', badge: 0 },
    { titulo: 'Ver Lista de Cursos para Preinscripción', ruta: 'cursos-preinscripcion', icon: 'playlist_add', badge: 0 },
    { titulo: 'Seguimiento', ruta: 'ver-solicitud', icon: 'list_alt', badge: 0 },
  ];

  notificacionesNoLeidas = 0;
  notificacionesUrgentes = 0;
  notificacionesRecientes: Notificacion[] = [];

  constructor(
    private notificacionesService: NotificacionesService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    console.log('🚀 CURSOS INTERSEMESTRALES COMPONENT INICIADO');
    console.log('📍 URL actual:', this.router.url);
    
    this.cargarNotificaciones();
    this.iniciarPollingNotificaciones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarNotificaciones(): void {
    const usuario = this.authService.getUsuario();
    console.log('🔔 Cargando notificaciones para usuario:', usuario);
    
    if (usuario?.id_usuario) {
      // Cargar dashboard de notificaciones
      this.notificacionesService.getDashboardNotificaciones(usuario.id_usuario)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: dashboard => {
            console.log('📊 Dashboard de notificaciones recibido:', dashboard);
            this.notificacionesNoLeidas = dashboard.notificacionesNoLeidas;
            this.notificacionesUrgentes = dashboard.notificacionesUrgentes;
            this.notificacionesRecientes = dashboard.notificacionesRecientes;
            this.actualizarBadges();
          },
          error: err => {
            console.error('❌ Error cargando notificaciones:', err);
            // Simular notificaciones para desarrollo
            this.simularNotificaciones();
          }
        });

      // Suscribirse a cambios en tiempo real
      this.notificacionesService.noLeidas$
        .pipe(takeUntil(this.destroy$))
        .subscribe(noLeidas => {
          console.log('🔄 Notificaciones no leídas actualizadas:', noLeidas);
          this.notificacionesNoLeidas = noLeidas;
          this.actualizarBadges();
        });
    } else {
      console.log('⚠️ No hay usuario logueado, simulando notificaciones');
      this.simularNotificaciones();
    }
  }

  private iniciarPollingNotificaciones(): void {
    const usuario = this.authService.getUsuario();
    if (usuario?.id_usuario) {
      this.notificacionesService.iniciarPolling(usuario.id_usuario, 30000)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }
  }

  private actualizarBadges(): void {
    // Actualizar badge del dashboard
    const dashboardIndex = this.opciones.findIndex(op => op.ruta === 'dashboard');
    if (dashboardIndex !== -1) {
      this.opciones[dashboardIndex].badge = this.notificacionesNoLeidas;
    }

    // Actualizar badge de seguimiento si hay notificaciones urgentes
    const seguimientoIndex = this.opciones.findIndex(op => op.ruta === 'ver-solicitud');
    if (seguimientoIndex !== -1) {
      this.opciones[seguimientoIndex].badge = this.notificacionesUrgentes;
    }
  }

  marcarTodasLeidas(): void {
    const usuario = this.authService.getUsuario();
    if (usuario?.id_usuario) {
      this.notificacionesService.marcarTodasLeidas(usuario.id_usuario)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('✅ Todas las notificaciones marcadas como leídas');
            this.notificacionesNoLeidas = 0;
            this.notificacionesUrgentes = 0;
            this.actualizarBadges();
          },
          error: err => {
            console.error('❌ Error marcando notificaciones como leídas:', err);
            // Simular marcado como leídas para desarrollo
            this.notificacionesNoLeidas = 0;
            this.notificacionesUrgentes = 0;
            this.actualizarBadges();
          }
        });
    } else {
      // Simular marcado como leídas para desarrollo
      console.log('🎭 Simulando marcado de notificaciones como leídas');
      this.notificacionesNoLeidas = 0;
      this.notificacionesUrgentes = 0;
      this.actualizarBadges();
    }
  }

  getTotalNotificaciones(): number {
    return this.notificacionesNoLeidas;
  }

  getNotificacionesUrgentes(): number {
    return this.notificacionesUrgentes;
  }

  hasActiveRoute(): boolean {
    const currentUrl = this.router.url;
    return currentUrl.includes('/solicitudes') || 
           currentUrl.includes('/cursos-ofertados') || 
           currentUrl.includes('/cursos-preinscripcion') || 
           currentUrl.includes('/ver-solicitud');
  }

  private simularNotificaciones(): void {
    console.log('🎭 Simulando notificaciones para desarrollo');
    
    // Simular algunas notificaciones para demostrar la funcionalidad
    this.notificacionesNoLeidas = 2;
    this.notificacionesUrgentes = 1;
    this.notificacionesRecientes = [
      {
        id_notificacion: 1,
        tipoSolicitud: 'Cursos Intersemestrales',
        tipoNotificacion: 'Aprobación',
        titulo: 'Solicitud Aprobada',
        mensaje: 'Tu solicitud de curso intersemestral ha sido aprobada',
        fechaCreacion: new Date(),
        leida: false,
        esUrgente: true,
        urlAccion: '/estudiante/cursos-intersemestrales/ver-solicitud'
      },
      {
        id_notificacion: 2,
        tipoSolicitud: 'Cursos Intersemestrales',
        tipoNotificacion: 'Recordatorio',
        titulo: 'Recordatorio de Pago',
        mensaje: 'Recuerda subir tu comprobante de pago para completar la inscripción',
        fechaCreacion: new Date(),
        leida: false,
        esUrgente: false,
        urlAccion: '/estudiante/cursos-intersemestrales/inscripciones'
      }
    ];
    
    this.actualizarBadges();
  }
}
