import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NotificacionService } from '../../../core/services/notificacion.service';
import { AuthService } from '../../../core/services/auth.service';
import { Notificacion, TipoSolicitud } from '../../../core/models/notificaciones.model';
import {
  getIconByTipoSolicitud,
  getColorByTipoSolicitud,
  getCategoriaDisplay,
  enrichNotificaciones
} from '../../../core/utils/notificaciones.util';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.css']
})
export class NotificacionesComponent implements OnInit, OnDestroy {
  todasLasNotificaciones: Notificacion[] = [];
  notificacionesFiltradas: Notificacion[] = [];
  notificacionesNoLeidas: Notificacion[] = [];
  
  isLoading = false;
  tabSeleccionada = 0;
  filtroTipoSolicitud: string | null = null;
  
  tiposSolicitud = [
    { valor: null, etiqueta: 'Todas' },
    { valor: TipoSolicitud.ECAES, etiqueta: 'ECAES' },
    { valor: TipoSolicitud.REINGRESO, etiqueta: 'Reingreso' },
    { valor: TipoSolicitud.HOMOLOGACION, etiqueta: 'Homologación' },
    { valor: TipoSolicitud.PAZ_Y_SALVO, etiqueta: 'Paz y Salvo' },
    { valor: TipoSolicitud.CURSO_VERANO_PREINSCRIPCION, etiqueta: 'Cursos Verano - Preinscripción' },
    { valor: TipoSolicitud.CURSO_VERANO_INSCRIPCION, etiqueta: 'Cursos Verano - Inscripción' }
  ];

  constructor(
    private notificacionService: NotificacionService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  ngOnDestroy(): void {
    // El servicio maneja el polling globalmente
  }

  cargarNotificaciones(): void {
    const usuario = this.authService.getUsuario();
    const usuarioId = usuario?.id_usuario || usuario?.id;
    if (!usuarioId) {
      this.snackBar.open('No se pudo obtener la información del usuario', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    // Cargar notificaciones según la categoría seleccionada
    this.cargarNotificacionesPorCategoria(usuarioId);
  }

  /**
   * Carga las notificaciones según la categoría seleccionada usando los endpoints correctos
   */
  cargarNotificacionesPorCategoria(usuarioId: number): void {
    let observable;

    switch (this.tabSeleccionada) {
      case 0: // Todas
        observable = this.notificacionService.obtenerTodas(usuarioId);
        break;
      case 1: // No Leídas
        observable = this.notificacionService.obtenerNoLeidas(usuarioId);
        break;
      default:
        observable = this.notificacionService.obtenerTodas(usuarioId);
    }

    observable.subscribe({
      next: (notificaciones: Notificacion[]) => {
        // Enriquecer notificaciones con campos calculados
        const notificacionesEnriquecidas = enrichNotificaciones(notificaciones);

        // Actualizar según la categoría
        if (this.tabSeleccionada === 0) {
          this.todasLasNotificaciones = notificacionesEnriquecidas;
        } else if (this.tabSeleccionada === 1) {
          this.notificacionesNoLeidas = notificacionesEnriquecidas;
        }

        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('[NOTIFICACIONES] Error al cargar notificaciones:', error);
        this.isLoading = false;
        
        // Si es 403, no mostrar error (puede ser normal)
        if (error.status !== 403) {
          this.snackBar.open('Error al cargar notificaciones', 'Cerrar', { duration: 3000 });
        }
      }
    });
  }

  aplicarFiltros(): void {
    let notificaciones: Notificacion[] = [];

    // Obtener notificaciones según la pestaña seleccionada
    if (this.tabSeleccionada === 0) {
      notificaciones = this.todasLasNotificaciones;
    } else if (this.tabSeleccionada === 1) {
      notificaciones = this.notificacionesNoLeidas;
    }

    // Aplicar filtro por tipo de solicitud
    if (this.filtroTipoSolicitud) {
      notificaciones = notificaciones.filter(n => n.tipoSolicitud === this.filtroTipoSolicitud);
    }

    // Ordenar por fecha (más recientes primero)
    this.notificacionesFiltradas = notificaciones.sort((a, b) => {
      const fechaA = new Date(a.fechaCreacion).getTime();
      const fechaB = new Date(b.fechaCreacion).getTime();
      return fechaB - fechaA;
    });
  }

  cambiarTab(index: number): void {
    this.tabSeleccionada = index;
    // Recargar notificaciones con el endpoint correcto para la nueva categoría
    this.cargarNotificaciones();
  }

  cambiarFiltroTipoSolicitud(tipo: string | null): void {
    this.filtroTipoSolicitud = tipo;
    this.aplicarFiltros();
  }

  marcarComoLeida(notificacion: Notificacion, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (notificacion.leida) {
      return;
    }

    this.notificacionService.marcarComoLeida(notificacion.id_notificacion).subscribe({
      next: () => {
        notificacion.leida = true;
        // Remover de la lista de no leídas si está ahí
        this.notificacionesNoLeidas = this.notificacionesNoLeidas.filter(n => n.id_notificacion !== notificacion.id_notificacion);
        this.aplicarFiltros();
        this.snackBar.open('Notificación marcada como leída', 'Cerrar', { duration: 2000 });
      },
      error: (error: HttpErrorResponse) => {
        console.error('[NOTIFICACIONES] Error al marcar como leída:', error);
        this.snackBar.open('Error al marcar notificación como leída', 'Cerrar', { duration: 3000 });
      }
    });
  }

  marcarTodasComoLeidas(): void {
    const usuario = this.authService.getUsuario();
    const usuarioId = usuario?.id_usuario || usuario?.id;
    if (!usuarioId) {
      return;
    }

    this.notificacionService.marcarTodasComoLeidas(usuarioId).subscribe({
      next: () => {
        this.todasLasNotificaciones.forEach(n => n.leida = true);
        this.notificacionesNoLeidas = [];
        this.aplicarFiltros();
        this.snackBar.open('Todas las notificaciones marcadas como leídas', 'Cerrar', { duration: 2000 });
      },
      error: (error: HttpErrorResponse) => {
        console.error('[NOTIFICACIONES] Error al marcar todas como leídas:', error);
        this.snackBar.open('Error al marcar notificaciones como leídas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  navegarANotificacion(notificacion: Notificacion): void {
    // Solo marcar como leída si no lo está
    if (!notificacion.leida) {
      this.marcarComoLeida(notificacion);
    }
    // No navegar a ningún lado, solo marcar como leída
  }

  getIconoPorTipo(tipoSolicitud: string): string {
    return getIconByTipoSolicitud(tipoSolicitud);
  }

  getColorPorTipo(tipoSolicitud: string): string {
    return getColorByTipoSolicitud(tipoSolicitud);
  }

  getCategoriaDisplay(tipoSolicitud: string): string {
    return getCategoriaDisplay(tipoSolicitud);
  }

  formatDate(dateString: string | Date): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;

    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  trackByNotificationId(index: number, notificacion: Notificacion): number {
    return notificacion.id_notificacion;
  }
}



