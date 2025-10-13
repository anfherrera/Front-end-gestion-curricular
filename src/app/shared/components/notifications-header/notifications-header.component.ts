import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { NotificacionesService, Notificacion, NotificacionesResponse } from '../../../core/services/notificaciones.service';
import { AuthService } from '../../../core/services/auth.service';

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
  
  notificaciones: Notificacion[] = [];
  totalNoLeidas = 0;
  isLoading = false;
  private refreshInterval?: any;

  constructor(
    private notificacionesService: NotificacionesService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    console.log('🔔 [NOTIFICACIONES] Componente inicializado');
    this.cargarNotificaciones();
    
    // Actualizar notificaciones cada 30 segundos
    this.refreshInterval = setInterval(() => {
      this.cargarNotificaciones();
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  cargarNotificaciones(): void {
    const userId = this.userId || this.authService.getUsuario()?.id;
    if (!userId) {
      console.warn('⚠️ [NOTIFICACIONES] No hay ID de usuario disponible');
      return;
    }

    this.isLoading = true;
    console.log('🔄 [NOTIFICACIONES] Cargando notificaciones para usuario:', userId);

    this.notificacionesService.obtenerNotificacionesHeader(userId).subscribe({
      next: (response: NotificacionesResponse) => {
        this.notificaciones = response.notificaciones;
        this.totalNoLeidas = response.totalNoLeidas;
        this.isLoading = false;
        
        console.log('✅ [NOTIFICACIONES] Notificaciones cargadas exitosamente');
        console.log('📊 [NOTIFICACIONES] Total no leídas:', this.totalNoLeidas);
        console.log('📋 [NOTIFICACIONES] Cantidad de notificaciones:', this.notificaciones.length);
      },
      error: (error) => {
        console.error('❌ [NOTIFICACIONES] Error al cargar notificaciones:', error);
        this.isLoading = false;
        this.snackBar.open('Error al cargar notificaciones', 'Cerrar', { duration: 3000 });
      }
    });
  }

  marcarTodasComoLeidas(): void {
    const userId = this.userId || this.authService.getUsuario()?.id;
    if (!userId) {
      console.warn('⚠️ [NOTIFICACIONES] No hay ID de usuario disponible para marcar como leídas');
      return;
    }

    console.log('✅ [NOTIFICACIONES] Marcando todas las notificaciones como leídas');
    
    this.notificacionesService.marcarNotificacionesComoLeidas(userId).subscribe({
      next: (response) => {
        console.log('✅ [NOTIFICACIONES] Notificaciones marcadas como leídas:', response);
        this.totalNoLeidas = 0;
        this.snackBar.open('Notificaciones marcadas como leídas', 'Cerrar', { duration: 2000 });
      },
      error: (error) => {
        console.error('❌ [NOTIFICACIONES] Error al marcar como leídas:', error);
        this.snackBar.open('Error al marcar notificaciones como leídas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  navegarANotificacion(notificacion: Notificacion): void {
    console.log('🧭 [NOTIFICACIONES] Navegando a notificación:', notificacion.titulo);
    console.log('🔗 [NOTIFICACIONES] URL de acción:', notificacion.urlAccion);
    
    if (notificacion.urlAccion) {
      this.router.navigate([notificacion.urlAccion]);
    } else {
      console.warn('⚠️ [NOTIFICACIONES] No hay URL de acción disponible');
      this.snackBar.open('No hay acción disponible para esta notificación', 'Cerrar', { duration: 2000 });
    }
  }

  actualizarManual(): void {
    console.log('🔄 [NOTIFICACIONES] Actualización manual solicitada');
    this.cargarNotificaciones();
  }

  getIconoPorTipo(tipoSolicitud: string): string {
    const iconos: { [key: string]: string } = {
      'CURSO_VERANO': 'school',
      'ECAES': 'quiz',
      'REINGRESO': 'person_add',
      'HOMOLOGACION': 'swap_horiz',
      'PAZ_SALVO': 'verified'
    };
    return iconos[tipoSolicitud] || 'notifications';
  }

  getColorPorTipo(tipoSolicitud: string): string {
    const colores: { [key: string]: string } = {
      'CURSO_VERANO': '#1976d2', // Azul
      'ECAES': '#f57c00', // Naranja
      'REINGRESO': '#388e3c', // Verde
      'HOMOLOGACION': '#7b1fa2', // Púrpura
      'PAZ_SALVO': '#d32f2f' // Rojo
    };
    return colores[tipoSolicitud] || '#666666';
  }

  getCategoriaDisplay(categoria: string): string {
    const categorias: { [key: string]: string } = {
      'Cursos Intersemestrales': 'Cursos Intersemestrales',
      'Pruebas ECAES': 'ECAES',
      'Reingreso': 'Reingreso',
      'Homologación': 'Homologación',
      'Paz y Salvo': 'Paz y Salvo'
    };
    return categorias[categoria] || categoria;
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
    console.log('📋 [NOTIFICACIONES] Navegando a vista completa de notificaciones');
    // Aquí podrías navegar a una página dedicada de notificaciones
    this.router.navigate(['/notificaciones']);
  }

  trackByNotificationId(index: number, notificacion: Notificacion): number {
    return notificacion.id;
  }

  tieneNotificacionesUrgentes(): boolean {
    return this.notificaciones.some(n => n.esUrgente);
  }

  crearNotificacionPrueba(): void {
    const userId = this.userId || this.authService.getUsuario()?.id;
    if (!userId) {
      console.warn('⚠️ [NOTIFICACIONES] No hay ID de usuario disponible para crear notificación de prueba');
      this.snackBar.open('No hay usuario disponible para crear notificación de prueba', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('🧪 [NOTIFICACIONES] Creando notificación de prueba para usuario:', userId);
    
    this.notificacionesService.crearNotificacionPrueba(userId).subscribe({
      next: (response) => {
        console.log('✅ [NOTIFICACIONES] Notificación de prueba creada:', response);
        this.snackBar.open('Notificación de prueba creada exitosamente', 'Cerrar', { duration: 2000 });
        // Las notificaciones se actualizarán automáticamente
      },
      error: (error) => {
        console.error('❌ [NOTIFICACIONES] Error al crear notificación de prueba:', error);
        this.snackBar.open('Error al crear notificación de prueba', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
