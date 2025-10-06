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
  selector: 'app-dashboard-funcionario',
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
export class DashboardFuncionarioComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  usuario: any = null;
  solicitudesPendientes: SolicitudCursoVerano[] = [];
  cursosActivos: CursoOfertadoVerano[] = [];
  notificaciones: Notificacion[] = [];
  
  // Estadísticas para funcionarios
  totalSolicitudesPendientes = 0;
  totalCursosActivos = 0;
  preinscripcionesPendientes = 0;
  inscripcionesPendientes = 0;
  notificacionesNoLeidas = 0;
  notificacionesUrgentes = 0;

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
    this.cargarCursosActivos();
    this.cargarNotificaciones();
  }

  private cargarCursosActivos(): void {
    this.cursosService.getCursosDisponibles()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cursos) => {
          this.cursosActivos = cursos;
          this.totalCursosActivos = cursos.length;
          this.calcularEstadisticasCursos(cursos);
        },
        error: (error) => {
          console.error('Error cargando cursos activos:', error);
        }
      });
  }

  private calcularEstadisticasCursos(cursos: CursoOfertadoVerano[]): void {
    // Contar cursos por estado
    this.preinscripcionesPendientes = cursos.filter(c => c.estado === 'Preinscripcion').length;
    this.inscripcionesPendientes = cursos.filter(c => c.estado === 'Inscripcion').length;
  }

  private cargarNotificaciones(): void {
    this.notificacionesService.getDashboardNotificaciones(this.usuario.id_usuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dashboard) => {
          this.notificaciones = dashboard.notificacionesRecientes;
          this.notificacionesNoLeidas = dashboard.notificacionesNoLeidas;
          this.notificacionesUrgentes = dashboard.notificacionesUrgentes;
        },
        error: (error) => {
          console.error('Error cargando notificaciones:', error);
        }
      });
  }

  getProgresoGestion(): number {
    if (this.totalCursosActivos === 0) return 0;
    const cursosGestionados = this.totalCursosActivos - this.preinscripcionesPendientes - this.inscripcionesPendientes;
    return (cursosGestionados / this.totalCursosActivos) * 100;
  }

  getEstadoColor(estado: string): string {
    // Todos los estados usan el azul principal de la app
    return '#00138C';
  }

  getTipoSolicitudColor(tipo: string): string {
    // Todos los tipos usan el azul principal de la app
    return '#00138C';
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

  getIconoEstado(estado: string): string {
    const iconos: { [key: string]: string } = {
      'Abierto': 'lock_open',
      'Publicado': 'visibility',
      'Preinscripcion': 'person_add',
      'Inscripcion': 'how_to_reg',
      'Cerrado': 'lock'
    };
    return iconos[estado] || 'help';
  }
}
