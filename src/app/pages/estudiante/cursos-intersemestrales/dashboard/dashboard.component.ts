import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CursosIntersemestralesService, SolicitudCursoVerano, CursoOfertadoVerano } from '../../../../core/services/cursos-intersemestrales.service';
import { NotificacionesService, Notificacion } from '../../../../core/services/notificaciones.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule,
    MatDividerModule,
    RouterModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  usuario: any = null;
  solicitudes: SolicitudCursoVerano[] = [];
  cursosDisponibles: CursoOfertadoVerano[] = [];
  notificaciones: Notificacion[] = [];
  
  // Estadísticas
  totalSolicitudes = 0;
  solicitudesPendientes = 0;
  solicitudesAprobadas = 0;
  solicitudesRechazadas = 0;
  notificacionesNoLeidas = 0;
  cursosDisponiblesCount = 0;

  constructor(
    private cursosService: CursosIntersemestralesService,
    private notificacionesService: NotificacionesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    if (this.usuario?.id_usuario) {
      this.cargarDatos();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarDatos(): void {
    this.cargarSolicitudes();
    this.cargarCursosDisponibles();
    this.cargarNotificaciones();
  }

  private cargarSolicitudes(): void {
    this.cursosService.getSolicitudesUsuario(this.usuario.id_usuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (solicitudes) => {
          this.solicitudes = solicitudes;
          this.calcularEstadisticas();
        },
        error: (error) => {
          console.error('Error cargando solicitudes:', error);
        }
      });
  }

  private cargarCursosDisponibles(): void {
    this.cursosService.getCursosDisponibles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cursos) => {
          this.cursosDisponibles = cursos;
          this.cursosDisponiblesCount = cursos.length;
        },
        error: (error) => {
          console.error('Error cargando cursos:', error);
        }
      });
  }

  private cargarNotificaciones(): void {
    this.notificacionesService.getDashboardNotificaciones(this.usuario.id_usuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dashboard) => {
          this.notificaciones = dashboard.notificacionesRecientes;
          this.notificacionesNoLeidas = dashboard.notificacionesNoLeidas;
        },
        error: (error) => {
          console.error('Error cargando notificaciones:', error);
        }
      });
  }

  private calcularEstadisticas(): void {
    this.totalSolicitudes = this.solicitudes.length;
    this.solicitudesPendientes = this.solicitudes.filter(s => s.estado === 'Pendiente').length;
    this.solicitudesAprobadas = this.solicitudes.filter(s => s.estado === 'Aprobado').length;
    this.solicitudesRechazadas = this.solicitudes.filter(s => s.estado === 'Rechazado').length;
  }

  getProgresoInscripcion(): number {
    if (this.totalSolicitudes === 0) return 0;
    return (this.solicitudesAprobadas / this.totalSolicitudes) * 100;
  }

  getEstadoColor(estado: string): string {
    const colores: { [key: string]: string } = {
      'Pendiente': 'orange',
      'Aprobado': 'green',
      'Rechazado': 'red',
      'Completado': 'blue'
    };
    return colores[estado] || 'gray';
  }

  getTipoSolicitudColor(tipo: string): string {
    return tipo === 'PREINSCRIPCION' ? 'blue' : 'green';
  }

  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  marcarNotificacionLeida(notificacion: Notificacion): void {
    this.notificacionesService.marcarNotificacionLeida(notificacion.id_notificacion)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        notificacion.leida = true;
        this.notificacionesNoLeidas--;
      });
  }

  getIconoTipo(tipoNotificacion: string): string {
    return this.notificacionesService.getIconoTipo(tipoNotificacion);
  }

  getColorTipo(tipoNotificacion: string): string {
    return this.notificacionesService.getColorTipo(tipoNotificacion);
  }
}
