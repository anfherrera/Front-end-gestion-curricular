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
import { CursosIntersemestralesService, SolicitudCursoVerano, CursoOfertadoVerano, DashboardEstadisticas } from '../../../../core/services/cursos-intersemestrales.service';
import { CursoEstadosService } from '../../../../core/services/curso-estados.service';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

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
  
  // Estadísticas del backend
  estadisticas: DashboardEstadisticas | null = null;
  
  // Variables para el template (se actualizan desde el backend)
  totalSolicitudesPendientes = 0;
  totalCursosActivos = 0;
  preinscripcionesPendientes = 0;
  inscripcionesPendientes = 0;
  
  cargandoEstadisticas = false;

  constructor(
    private cursosService: CursosIntersemestralesService,
    private cursoEstadosService: CursoEstadosService,
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
    this.cargarEstadisticas();
    this.cargarCursosActivos();
  }

  private cargarEstadisticas(): void {
    this.cargandoEstadisticas = true;
    console.log('📊 Cargando estadísticas del dashboard desde el backend...');
    
    this.cursosService.getDashboardEstadisticas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (estadisticas: DashboardEstadisticas) => {
          console.log('✅ Estadísticas recibidas del backend:', estadisticas);
          this.estadisticas = estadisticas;
          
          // Actualizar variables para el template desde el backend
          this.totalCursosActivos = estadisticas.cursosActivos || 0;
          this.preinscripcionesPendientes = estadisticas.totalPreinscripciones || 0;
          this.inscripcionesPendientes = estadisticas.totalInscripciones || 0;
          
          console.log('📊 Variables actualizadas:', {
            totalCursosActivos: this.totalCursosActivos,
            preinscripcionesPendientes: this.preinscripcionesPendientes,
            inscripcionesPendientes: this.inscripcionesPendientes,
            porcentajeProgreso: estadisticas.porcentajeProgreso
          });
          
          this.cargandoEstadisticas = false;
        },
        error: (error: any) => {
          console.error('❌ Error cargando estadísticas del dashboard:', error);
          // Mantener valores por defecto (ya inicializados en 0)
          this.cargandoEstadisticas = false;
        }
      });
  }

  private cargarCursosActivos(): void {
    console.log('🔄 Intentando cargar cursos activos...');
    console.log('🌐 URL del backend:', `${environment.apiUrl}/cursos-intersemestrales/cursos-verano/todos`);
    
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

  getProgresoGestion(): number {
    // Priorizar el porcentaje del backend si está disponible
    if (this.estadisticas && this.estadisticas.porcentajeProgreso >= 0) {
      return this.estadisticas.porcentajeProgreso;
    }
    // Fallback al cálculo local si no hay datos del backend
    if (this.totalCursosActivos === 0) return 0;
    const cursosGestionados = this.totalCursosActivos - this.preinscripcionesPendientes - this.inscripcionesPendientes;
    return Math.round((cursosGestionados / this.totalCursosActivos) * 100);
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

  // Obtener nombre del docente de forma segura
  obtenerNombreDocente(curso: CursoOfertadoVerano): string {
    if (!curso.objDocente) {
      return 'Sin asignar';
    }
    
    // Priorizar nombre_docente (estructura del backend)
    if ((curso.objDocente as any).nombre_docente) {
      return (curso.objDocente as any).nombre_docente;
    }
    
    // Fallback a nombre y apellido (estructura legacy)
    if (curso.objDocente.nombre && curso.objDocente.apellido) {
      return `${curso.objDocente.nombre} ${curso.objDocente.apellido}`;
    }
    
    if (curso.objDocente.nombre) {
      return curso.objDocente.nombre;
    }
    
    return 'Sin nombre';
  }
}
