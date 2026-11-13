import { Component, OnInit, OnDestroy, Output, EventEmitter, Input, inject } from '@angular/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CursoEstadosService, EstadoCurso } from '@core/services/curso-estados.service';
import { CursosIntersemestralesService } from '@core/services/cursos-intersemestrales.service';
import { CursoOfertadoVerano } from '@core/models/cursos-intersemestrales.model';
import { Subject, takeUntil } from 'rxjs';
import { estadoCurso } from '@core/utils/cursos-verano.utils';

@Component({
  selector: 'app-estado-filters',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule
],
  templateUrl: './estado-filters.component.html',
  styleUrl: './estado-filters.component.css'
})
export class EstadoFiltersComponent implements OnInit, OnDestroy {
  private cursoEstadosService = inject(CursoEstadosService);
  private cursosService = inject(CursosIntersemestralesService);

  @Input() cursos: CursoOfertadoVerano[] = [];
  @Output() cursosFiltradosChange = new EventEmitter<CursoOfertadoVerano[]>();
  @Output() estadoSeleccionadoChange = new EventEmitter<string>();

  private destroy$ = new Subject<void>();
  
  estadosDisponibles: EstadoCurso[] = [];
  estadoSeleccionado = '';
  cursosFiltrados: CursoOfertadoVerano[] = [];
  conteosEstados: Record<string, number> = {};
  estadoInfo: EstadoCurso | undefined;
  cargandoFiltro = false;

  ngOnInit(): void {
    this.estadosDisponibles = this.cursoEstadosService.getEstadosDisponibles();
    this.estadoSeleccionado = ''; // Inicializar como "TODOS"
    this.calcularConteos();
    this.aplicarFiltro();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onEstadoChange(estado: string): void {
    // Cambiando filtro a estado
    this.estadoSeleccionado = estado;
    this.estadoInfo = estado ? this.cursoEstadosService.getEstadoPorValor(estado) : undefined;
    this.cargandoFiltro = true;
    
    if (estado) {
      // Llamar al backend para obtener cursos específicos por estado
      this.cursosService.getCursosPorEstado(estado)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (cursos) => {
            // Cursos obtenidos para estado
            this.cursosFiltrados = cursos;
            this.cursosFiltradosChange.emit(this.cursosFiltrados);
            this.cargandoFiltro = false;
          },
          error: () => {
            // Fallback: filtrar localmente
            // Usando filtro local como fallback
            this.aplicarFiltro();
            this.cargandoFiltro = false;
          }
        });
    } else {
      // Si no hay estado seleccionado, mostrar todos los cursos
      // Mostrando todos los cursos (sin filtro)
      this.aplicarFiltro();
      this.cargandoFiltro = false;
    }
    
    this.estadoSeleccionadoChange.emit(estado);
  }

  private aplicarFiltro(): void {
    if (!this.estadoSeleccionado) {
      this.cursosFiltrados = [...this.cursos];
    } else {
      this.cursosFiltrados = this.cursos.filter(curso => {
        const estadoActual = estadoCurso(curso);
        return estadoActual === this.estadoSeleccionado;
      });
    }
    
    this.cursosFiltradosChange.emit(this.cursosFiltrados);
  }

  private calcularConteos(): void {
    this.conteosEstados = {};
    
    // Calcular conteos locales primero usando la nueva estructura de estados
    this.estadosDisponibles.forEach(estado => {
      this.conteosEstados[estado.value] = this.cursos.filter(curso => {
        const estadoActual = estadoCurso(curso);
        return estadoActual === estado.value;
      }).length;
    });
    
    // Conteos locales calculados
    
    // Actualizar conteos desde el backend para cada estado
    this.estadosDisponibles.forEach(estado => {
      this.cursosService.getCursosPorEstado(estado.value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (cursos) => {
            this.conteosEstados[estado.value] = cursos.length;
            // Conteo actualizado para estado
          },
          error: () => {
            // Mantener el conteo local
          }
        });
    });
  }
}
