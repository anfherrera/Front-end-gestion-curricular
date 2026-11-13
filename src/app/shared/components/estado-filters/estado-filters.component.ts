import { Component, OnInit, input, inject, DestroyRef, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CursoEstadosService, EstadoCurso } from '@core/services/curso-estados.service';
import { CursosIntersemestralesService } from '@core/services/cursos-intersemestrales.service';
import { CursoOfertadoVerano } from '@core/models/cursos-intersemestrales.model';
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
export class EstadoFiltersComponent implements OnInit {
  private cursoEstadosService = inject(CursoEstadosService);
  private cursosService = inject(CursosIntersemestralesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly cursos = input<CursoOfertadoVerano[]>([]);
  readonly cursosFiltradosChange = output<CursoOfertadoVerano[]>();
  readonly estadoSeleccionadoChange = output<string>();

  readonly estadosDisponibles = signal<EstadoCurso[]>([]);
  /** '' significa TODOS. */
  readonly estadoSeleccionado = signal('');
  readonly cursosFiltrados = signal<CursoOfertadoVerano[]>([]);
  readonly conteosEstados = signal<Record<string, number>>({});
  readonly estadoInfo = signal<EstadoCurso | undefined>(undefined);
  readonly cargandoFiltro = signal(false);

  ngOnInit(): void {
    this.estadosDisponibles.set(this.cursoEstadosService.getEstadosDisponibles());
    this.calcularConteos();
    this.aplicarFiltro();
  }

  onEstadoChange(estado: string): void {
    this.estadoSeleccionado.set(estado);
    this.estadoInfo.set(estado ? this.cursoEstadosService.getEstadoPorValor(estado) : undefined);
    this.cargandoFiltro.set(true);

    if (estado) {
      // Pedir al backend los cursos de ese estado
      this.cursosService.getCursosPorEstado(estado)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (cursos) => {
            this.cursosFiltrados.set(cursos);
            this.cursosFiltradosChange.emit(cursos);
            this.cargandoFiltro.set(false);
          },
          error: () => {
            // Si falla, filtrar localmente
            this.aplicarFiltro();
            this.cargandoFiltro.set(false);
          }
        });
    } else {
      // Sin estado: todos los cursos
      this.aplicarFiltro();
      this.cargandoFiltro.set(false);
    }

    this.estadoSeleccionadoChange.emit(estado);
  }

  private aplicarFiltro(): void {
    const estado = this.estadoSeleccionado();
    const filtrados = estado
      ? this.cursos().filter(curso => estadoCurso(curso) === estado)
      : [...this.cursos()];
    this.cursosFiltrados.set(filtrados);
    this.cursosFiltradosChange.emit(filtrados);
  }

  private calcularConteos(): void {
    // Conteos locales primero
    const conteos: Record<string, number> = {};
    this.estadosDisponibles().forEach(estado => {
      conteos[estado.value] = this.cursos().filter(curso => estadoCurso(curso) === estado.value).length;
    });
    this.conteosEstados.set(conteos);

    // Luego los del backend para cada estado (si falla, se mantiene el local)
    this.estadosDisponibles().forEach(estado => {
      this.cursosService.getCursosPorEstado(estado.value)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (cursos) => this.conteosEstados.update(actuales => ({ ...actuales, [estado.value]: cursos.length })),
          error: () => { /* se mantiene el conteo local */ }
        });
    });
  }
}
