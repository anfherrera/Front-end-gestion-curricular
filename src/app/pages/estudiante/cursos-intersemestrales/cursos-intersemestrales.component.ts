import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
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
    { titulo: 'Dashboard', ruta: 'dashboard', icon: 'dashboard', badge: 0 },
    { titulo: 'Cursos Disponibles', ruta: 'cursos-ofertados', icon: 'school', badge: 0 },
    { titulo: 'Preinscripciones', ruta: 'cursos-preinscripcion', icon: 'playlist_add', badge: 0 },
    { titulo: 'Mis Inscripciones', ruta: 'inscripciones', icon: 'how_to_reg', badge: 0 },
    { titulo: 'Seguimiento', ruta: 'ver-solicitud', icon: 'list_alt', badge: 0 },
  ];

  notificacionesNoLeidas = 0;
  notificacionesUrgentes = 0;
  notificacionesRecientes: Notificacion[] = [];

  constructor(
    private notificacionesService: NotificacionesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.cargarNotificaciones();
    this.iniciarPollingNotificaciones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarNotificaciones(): void {
    const usuario = this.authService.getUsuario();
    if (usuario?.id_usuario) {
      // Cargar dashboard de notificaciones
      this.notificacionesService.getDashboardNotificaciones(usuario.id_usuario)
        .pipe(takeUntil(this.destroy$))
        .subscribe(dashboard => {
          this.notificacionesNoLeidas = dashboard.notificacionesNoLeidas;
          this.notificacionesUrgentes = dashboard.notificacionesUrgentes;
          this.notificacionesRecientes = dashboard.notificacionesRecientes;
          this.actualizarBadges();
        });

      // Suscribirse a cambios en tiempo real
      this.notificacionesService.noLeidas$
        .pipe(takeUntil(this.destroy$))
        .subscribe(noLeidas => {
          this.notificacionesNoLeidas = noLeidas;
          this.actualizarBadges();
        });
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
        .subscribe();
    }
  }

  getTotalNotificaciones(): number {
    return this.notificacionesNoLeidas;
  }

  getNotificacionesUrgentes(): number {
    return this.notificacionesUrgentes;
  }
}
