import { Component, OnInit, OnDestroy, ViewChild, inject, input, signal } from '@angular/core';

import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { Subscription } from 'rxjs';

import { NotificacionesService } from '@core/services/notificaciones.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { AuthService } from '@core/services/auth.service';
import { Notificacion } from '@core/models/notificaciones.model';
import { 
  getColorByTipoSolicitud, 
  getCategoriaDisplay,
  getIconByTipoNotificacion,
  enrichNotificaciones
} from '@core/utils/notificaciones.util';

@Component({
  selector: 'app-notifications-header',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule,
    MatChipsModule
],
  templateUrl: './notifications-header.component.html',
  styleUrls: ['./notifications-header.component.css']
})
export class NotificationsHeaderComponent implements OnInit, OnDestroy {
  private notificacionService = inject(NotificacionesService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);

  readonly userId = input<number>();
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;
  
  readonly notificaciones = signal<Notificacion[]>([]);
  readonly totalNoLeidas = signal(0);
  readonly isLoading = signal(false);
  private refreshInterval?: ReturnType<typeof setInterval>;
  private notificacionesSubscription?: Subscription;

  ngOnInit(): void {
    this.cargarContador();
    
    const userId = this.userId() || this.authService.getUsuario()?.id_usuario;
    if (userId) {
      this.iniciarPollingContador(userId, 30000);
    }
    // Al crear una solicitud el backend genera notificaciones: refrescar sin esperar al sondeo
    this.notificacionesSubscription = this.notificacionService.cambios$.subscribe(() => this.actualizarContador());
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.notificacionesSubscription) {
      this.notificacionesSubscription.unsubscribe();
    }
  }

  cargarContador(): void {
    const userId = this.userId() || this.authService.getUsuario()?.id_usuario;
    if (!userId) {
      setTimeout(() => {
        const retryUserId = this.userId() || this.authService.getUsuario()?.id_usuario;
        if (retryUserId) {
          this.actualizarContador();
        }
      }, 500);
      return;
    }

    this.actualizarContador();
  }

  actualizarContador(): void {
    const userId = this.userId() || this.authService.getUsuario()?.id_usuario;
    if (!userId) return;

    this.notificacionService.contarNoLeidas(userId).subscribe({
      next: (count) => {
        this.totalNoLeidas.set(count);
      },
      error: () => {
        // Silenciar errores 403
      }
    });
  }

  cargarNotificaciones(): void {
    const userId = this.userId() || this.authService.getUsuario()?.id_usuario;
    if (!userId) {
      return;
    }

    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);

    this.notificacionService.obtenerNoLeidas(userId).subscribe({
      next: (notificaciones) => {
        const notificacionesEnriquecidas = enrichNotificaciones(notificaciones);

        this.notificaciones.set(notificacionesEnriquecidas);
        this.totalNoLeidas.set(notificacionesEnriquecidas.length);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.isLoading.set(false);
        
        if (error.status !== 403) {
          this.snackbar.error('Error al cargar notificaciones');
        }
      }
    });
  }

  marcarTodasComoLeidas(): void {
    const userId = this.userId() || this.authService.getUsuario()?.id_usuario;
    if (!userId) {
      return;
    }

    this.notificacionService.marcarTodasComoLeidas(userId).subscribe({
      next: () => {
        this.totalNoLeidas.set(0);
        this.notificaciones.set([]);
        this.snackbar.exito('Notificaciones marcadas como leídas');
      },
      error: () => {
        this.snackbar.error('Error al marcar notificaciones como leídas');
      }
    });
  }

  marcarNotificacionLeida(notificacion: Notificacion, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (notificacion.leida) {
      return;
    }

    this.notificacionService.marcarComoLeida(notificacion.id_notificacion).subscribe({
      next: () => {
        // Actualizar estado local
        this.notificaciones.update(lista => lista.map(n =>
          n.id_notificacion === notificacion.id_notificacion ? { ...n, leida: true } : n));
        this.totalNoLeidas.update(total => Math.max(0, total - 1));
      },
      error: () => {
        // Error silenciado
      }
    });
  }

  navegarANotificacion(notificacion: Notificacion, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!notificacion.leida) {
      this.marcarNotificacionLeida(notificacion);
    }

    if (this.menuTrigger && this.menuTrigger.menuOpen) {
      this.menuTrigger.closeMenu();
    }
    
    setTimeout(() => {
      this.router.navigate(['/notificaciones']);
    }, 150);
  }


  actualizarManual(): void {
    // Siempre recargar al hacer clic en el ícono para datos actualizados
    this.cargarNotificaciones();
  }

  onMenuOpened(): void {
    // Siempre cargar al abrir para sincronizar con el contador (evitar estado inconsistente)
    this.cargarNotificaciones();
  }

  getIconoPorTipo(tipoNotificacion: string): string {
    return getIconByTipoNotificacion(tipoNotificacion);
  }

  getColorPorTipo(tipoSolicitud: string): string {
    return getColorByTipoSolicitud(tipoSolicitud);
  }

  getCategoriaDisplay(categoria: string): string {
    return getCategoriaDisplay(categoria);
  }

  getAccionDisplay(accion: string): string {
    const acciones: Record<string, string> = {
      'VER_SOLICITUD': 'Ver solicitud',
      'REALIZAR_INSCRIPCION': 'Inscribirse',
      'COMPLETAR_PAGO': 'Completar pago',
      'REVISAR_DOCUMENTOS': 'Revisar documentos',
      'ACTUALIZAR_INFO': 'Actualizar información'
    };
    return acciones[accion] || accion;
  }

  verTodasLasNotificaciones(): void {
    this.router.navigate(['/notificaciones']);
  }


  tieneNotificacionesUrgentes(): boolean {
    return this.notificaciones().some(n => n.esUrgente);
  }

  private iniciarPollingContador(userId: number, intervalo = 30000): void {
    this.refreshInterval = setInterval(() => {
      this.actualizarContador();
    }, intervalo);
  }
}
