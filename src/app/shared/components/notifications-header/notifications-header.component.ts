import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { NotificacionService } from '../../../core/services/notificacion.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { AuthService } from '../../../core/services/auth.service';
import { Notificacion, NotificacionesResponse } from '../../../core/models/notificaciones.model';
import { 
  getIconByTipoSolicitud, 
  getColorByTipoSolicitud, 
  getCategoriaDisplay,
  getIconByTipoNotificacion,
  enrichNotificaciones
} from '../../../core/utils/notificaciones.util';

@Component({
  selector: 'app-notifications-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatTooltipModule,
    MatDividerModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './notifications-header.component.html',
  styleUrls: ['./notifications-header.component.css']
})
export class NotificationsHeaderComponent implements OnInit, OnDestroy {
  @Input() userId?: number;
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;
  
  notificaciones: Notificacion[] = [];
  totalNoLeidas = 0;
  isLoading = false;
  private refreshInterval?: any;
  private notificacionesSubscription?: Subscription;
  private notificacionesCargadas = false; // Flag para saber si ya se cargaron


  constructor(
    private notificacionService: NotificacionService,
    private authService: AuthService,
    private router: Router,
    private snackbar: SnackbarService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarContador();
    
    const userId = this.userId || this.authService.getUsuario()?.id_usuario;
    if (userId) {
      this.iniciarPollingContador(userId, 30000);
    }
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
    const userId = this.userId || this.authService.getUsuario()?.id_usuario;
    if (!userId) {
      setTimeout(() => {
        const retryUserId = this.userId || this.authService.getUsuario()?.id_usuario;
        if (retryUserId) {
          this.actualizarContador();
        }
      }, 500);
      return;
    }

    this.actualizarContador();
  }

  actualizarContador(): void {
    const userId = this.userId || this.authService.getUsuario()?.id_usuario;
    if (!userId) return;

    this.notificacionService.contarNoLeidas(userId).subscribe({
      next: (count) => {
        this.totalNoLeidas = count;
        this.cdr.detectChanges();
      },
      error: (error) => {
        // Silenciar errores 403
      }
    });
  }

  cargarNotificaciones(): void {
    const userId = this.userId || this.authService.getUsuario()?.id_usuario;
    if (!userId) {
      return;
    }

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    this.notificacionService.obtenerNoLeidas(userId).subscribe({
      next: (notificaciones) => {
        const notificacionesEnriquecidas = enrichNotificaciones(notificaciones);

        this.notificaciones = notificacionesEnriquecidas;
        this.totalNoLeidas = notificacionesEnriquecidas.length;
        this.notificacionesCargadas = true;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        
        if (error.status !== 403) {
          this.snackbar.error('Error al cargar notificaciones');
        }
      }
    });
  }

  marcarTodasComoLeidas(): void {
    const userId = this.userId || this.authService.getUsuario()?.id_usuario;
    if (!userId) {
      return;
    }

    this.notificacionService.marcarTodasComoLeidas(userId).subscribe({
      next: () => {
        this.totalNoLeidas = 0;
        this.notificaciones = [];
        this.cdr.detectChanges();
        this.snackbar.success('Notificaciones marcadas como leídas');
      },
      error: (error) => {
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
        notificacion.leida = true;
        this.totalNoLeidas = Math.max(0, this.totalNoLeidas - 1);
        this.cdr.detectChanges();
      },
      error: (error) => {
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
    if (!this.notificacionesCargadas) {
      this.cargarNotificaciones();
    }
  }

  onMenuOpened(): void {
    if (!this.notificacionesCargadas) {
      this.cargarNotificaciones();
    }
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
    const acciones: { [key: string]: string } = {
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

  trackByNotificationId(index: number, notificacion: Notificacion): number {
    return notificacion.id_notificacion;
  }

  tieneNotificacionesUrgentes(): boolean {
    return this.notificaciones.some(n => n.esUrgente);
  }

  crearNotificacionPrueba(): void {
    this.snackbar.info('La creación de notificaciones se realiza desde el backend');
  }

  private iniciarPollingContador(userId: number, intervalo: number = 30000): void {
    this.refreshInterval = setInterval(() => {
      this.actualizarContador();
    }, intervalo);
  }
}
