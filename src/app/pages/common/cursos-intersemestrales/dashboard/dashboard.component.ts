import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CursosIntersemestralesService } from '../../../../core/services/cursos-intersemestrales.service';
import { CursoOfertadoVerano, DashboardEstadisticas } from '../../../../core/models/cursos-intersemestrales.model';
import { CursoEstadosService } from '../../../../core/services/curso-estados.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UsuarioSesion } from '../../../../core/models/usuario-sesion.model';
import { estadoCurso, } from '../../../../core/utils/cursos-verano.utils';
import { formatearFecha } from '../../../../core/utils/fecha.util';
import { NombreDocentePipe } from '../../../../shared/pipes/nombre-docente.pipe';

@Component({
  selector: 'app-dashboard-cursos-intersemestrales',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    RouterModule,
    NombreDocentePipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardCursosIntersemestralesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  usuario: UsuarioSesion | null = null;
  cursosActivos: CursoOfertadoVerano[] = [];
  
  // Estadísticas del backend
  estadisticas: DashboardEstadisticas | null = null;
  
  // Variables para el template (se actualizan desde el backend)
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
  }

  private cargarDatos(): void {
    this.cargarEstadisticas();
    this.cargarCursosActivos();
  }

  private cargarEstadisticas(): void {
    this.cargandoEstadisticas = true;
    
    this.cursosService.getDashboardEstadisticas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (estadisticas: DashboardEstadisticas) => {
          this.estadisticas = estadisticas;
          
          // Actualizar variables para el template desde el backend
          this.totalCursosActivos = estadisticas.cursosActivos || 0;
          this.preinscripcionesPendientes = estadisticas.totalPreinscripciones || 0;
          this.inscripcionesPendientes = estadisticas.totalInscripciones || 0;
          
          this.cargandoEstadisticas = false;
        },
        error: () => {
          // Mantener valores por defecto (ya inicializados en 0)
          this.cargandoEstadisticas = false;
        }
      });
  }

  private cargarCursosActivos(): void {
    this.cursosService.getTodosLosCursosParaFuncionarios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cursos) => {
          // NO filtrar cursos, mostrar todos (incluso con campos null)
          // El backend calcula valores por defecto, pero si aún hay null, los manejamos en el template
          this.cursosActivos = cursos;
          this.totalCursosActivos = cursos.length;
          this.calcularEstadisticasCursos(cursos);
        },
        error: (error) => {
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

  formatearRangoFechas(fechaInicio: Date | string | null | undefined, fechaFin: Date | string | null | undefined): string {
    if (!fechaInicio && !fechaFin) {
      return 'Fechas no definidas';
    }
    return `${formatearFecha(fechaInicio, 'media', 'N/A')} - ${formatearFecha(fechaFin, 'media', 'N/A')}`;
  }

  // Obtener período académico de forma segura
  obtenerPeriodo(curso: CursoOfertadoVerano): string {
    // El backend calcula valores por defecto, pero por si acaso manejamos null
    return curso.periodo || curso.periodoAcademico || 'N/A';
  }

  getEstadoColor(estado: string | undefined): string {
    return this.cursoEstadosService.getColorEstado(estado || 'Borrador');
  }

  // TrackBy functions para optimizar ngFor
  trackByCursoId(index: number, curso: CursoOfertadoVerano): number {
    return curso.id_curso;
  }

  obtenerNombreMateria(curso: CursoOfertadoVerano): string {
    if (!curso.objMateria) {
      return 'Sin materia';
    }
    return curso.objMateria.nombre || curso.objMateria.codigo || 'Sin nombre';
  }

  obtenerEstadoActual(curso: CursoOfertadoVerano): string {
    return estadoCurso(curso);
  }
}
