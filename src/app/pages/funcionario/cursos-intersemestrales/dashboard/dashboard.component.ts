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
import { CursoEstadosService } from '../../../../core/services/curso-estados.service';
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
    private cursoEstadosService: CursoEstadosService,
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
    // ✅ Limpiar cache al destruir componente
    this.fechasFormateadas.clear();
  }

  private cargarDatos(): void {
    this.cargarCursosActivos();
    this.cargarNotificaciones();
  }

  private cargarCursosActivos(): void {
    console.log('🔄 Intentando cargar cursos activos...');
    console.log('🌐 URL del backend:', 'http://localhost:5000/api/cursos-intersemestrales/cursos-verano/todos');
    
    this.cursosService.getTodosLosCursosParaFuncionarios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cursos) => {
          console.log('✅ Cursos recibidos del backend:', cursos);
          console.log('📊 Total de cursos:', cursos.length);
          
          if (cursos.length === 0) {
            console.warn('⚠️ PROBLEMA: El backend devolvió un array vacío []');
            console.warn('📋 POSIBLES CAUSAS:');
            console.warn('   1. El query SQL en el backend tiene filtros muy restrictivos');
            console.warn('   2. Los JOINs con materias/usuarios están fallando');
            console.warn('   3. No hay datos en la tabla cursos_ofertados_verano');
            console.warn('📖 Sigue la guía: ARREGLAR-CONEXION-BACKEND-FRONTEND.md');
          } else {
            console.log('✅ Primer curso:', cursos[0]);
          }
          
          this.cursosActivos = cursos;
          this.totalCursosActivos = cursos.length;
          this.calcularEstadisticasCursos(cursos);
        },
        error: (error) => {
          console.error('❌ Error cargando cursos activos:', error);
          console.error('❌ Detalles del error:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url
          });
          console.error('🔧 SOLUCIONES:');
          console.error('   - Si ves error 404: El endpoint no existe en el backend');
          console.error('   - Si ves error 500: Hay un error en el query SQL del backend');
          console.error('   - Si ves CORS: Configura CORS en el backend');
          console.error('   - Si no ves nada: El backend no está corriendo');
        }
      });
  }

  private calcularEstadisticasCursos(cursos: CursoOfertadoVerano[]): void {
    // Contar cursos por estado usando la nueva estructura
    this.preinscripcionesPendientes = cursos.filter(c => {
      const estadoActual = this.obtenerEstadoActual(c);
      return estadoActual === 'Preinscripción';
    }).length;
    
    this.inscripcionesPendientes = cursos.filter(c => {
      const estadoActual = this.obtenerEstadoActual(c);
      return estadoActual === 'Inscripción';
    }).length;
  }

  // Método para obtener el estado actual del curso
  private obtenerEstadoActual(curso: CursoOfertadoVerano): string {
    // Si hay estado_actual, usarlo
    if (curso.estado_actual) {
      return curso.estado_actual;
    }
    
    // Si hay estados y hay al menos uno, tomar el más reciente
    if (curso.estados && curso.estados.length > 0) {
      // Ordenar por fecha_registro_estado descendente y tomar el más reciente
      const estadoMasReciente = curso.estados
        .sort((a, b) => new Date(b.fecha_registro_estado).getTime() - new Date(a.fecha_registro_estado).getTime())[0];
      return estadoMasReciente.estado_actual;
    }
    
    // Fallback al campo estado legacy
    return curso.estado || 'Borrador';
  }

  private cargarNotificaciones(): void {
    this.notificacionesService.getDashboardNotificaciones(this.usuario.id_usuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dashboard: any) => {
          this.notificaciones = dashboard.notificaciones || [];
          this.notificacionesNoLeidas = dashboard.totalNoLeidas || 0;
          this.notificacionesUrgentes = dashboard.notificaciones?.filter((n: any) => n.esUrgente)?.length || 0;
        },
        error: (error: any) => {
          console.error('Error cargando notificaciones:', error);
        }
      });
  }

  getProgresoGestion(): number {
    if (this.totalCursosActivos === 0) return 0;
    const cursosGestionados = this.totalCursosActivos - this.preinscripcionesPendientes - this.inscripcionesPendientes;
    return (cursosGestionados / this.totalCursosActivos) * 100;
  }

  getTipoSolicitudColor(tipo: string): string {
    // Todos los tipos usan el azul principal de la app
    return '#00138C';
  }

  // ✅ Cachear para no recalcular en cada detección de cambios
  private fechasFormateadas = new Map<string, string>();

  formatearFecha(fecha: Date | string): string {
    const key = fecha.toString();
    if (!this.fechasFormateadas.has(key)) {
      this.fechasFormateadas.set(key, new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }));
    }
    return this.fechasFormateadas.get(key)!;
  }

  marcarNotificacionLeida(notificacion: Notificacion): void {
    this.notificacionesService.marcarNotificacionLeida(notificacion.id || notificacion.id_notificacion || 0)
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

  getEstadoColor(estado: string | undefined): string {
    return this.cursoEstadosService.getColorEstado(estado || 'Borrador');
  }

  getIconoEstado(estado: string | undefined): string {
    return this.cursoEstadosService.getIconoEstado(estado || 'Borrador');
  }

  // ✅ TrackBy functions para optimizar ngFor
  trackByCursoId(index: number, curso: CursoOfertadoVerano): number {
    return curso.id_curso;
  }

  trackByNotificacionId(index: number, notificacion: Notificacion): number {
    return notificacion.id || notificacion.id_notificacion || index;
  }
}
