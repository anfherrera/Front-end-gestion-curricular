import { Component, DestroyRef, OnInit, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, catchError, map } from 'rxjs';
import { PeriodosAcademicosService, PeriodoAcademico } from '@core/services/periodos-academicos.service';
import { CursosIntersemestralesService } from '@core/services/cursos-intersemestrales.service';
import { formatearPeriodo } from '@core/utils/periodo.utils';

/** De dónde salen los períodos de la lista. */
export type FuentePeriodos =
  | 'recientes'   // PeriodosAcademicosService.getPeriodosRecientes()
  | 'con-cursos'; // períodos con cursos intersemestrales registrados (si falla, todos los períodos)

interface OpcionPeriodo {
  valor: string;
  texto: string;
}

/**
 * Selector de período académico para filtrar listados.
 * Emite 'todos', '' (período actual) o el valor del período ("2025-1").
 */
@Component({
  selector: 'app-periodo-filtro-selector',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule
],
  templateUrl: './periodo-filtro-selector.component.html',
  styleUrl: './periodo-filtro-selector.component.css'
})
export class PeriodoFiltroSelectorComponent implements OnInit {
  readonly label = input('');
  readonly mostrarTodos = input(true);
  readonly incluirActual = input(true);
  readonly mostrarInfo = input(true);
  readonly fuente = input<FuentePeriodos>('recientes');
  /** Selección inicial. Sin valor: "todos" si se muestra esa opción, si no el período actual (''). */
  readonly periodoInicial = input<string | null>(null);
  readonly periodoChange = output<string>();

  readonly opciones = signal<OpcionPeriodo[]>([]);
  readonly periodoSeleccionado = signal('');
  readonly periodoActualTexto = signal('');
  readonly cargando = signal(false);

  private readonly periodosService = inject(PeriodosAcademicosService);
  private readonly cursosService = inject(CursosIntersemestralesService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.periodoSeleccionado.set(this.periodoInicial() ?? (this.mostrarTodos() ? 'todos' : ''));

    const actual = this.periodosService.getPeriodoActualValue();
    if (actual) {
      this.periodoActualTexto.set(textoPeriodo(actual));
    } else {
      this.periodosService.getPeriodoActual().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: periodo => this.periodoActualTexto.set(periodo ? textoPeriodo(periodo) : 'No disponible'),
        error: () => this.periodoActualTexto.set('No disponible')
      });
    }
    this.periodosService.periodoActual$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(periodo => {
      this.periodoActualTexto.set(periodo ? textoPeriodo(periodo) : 'No disponible');
    });

    this.cargarPeriodos();
  }

  cargarPeriodos(): void {
    this.cargando.set(true);
    this.opcionesDeFuente().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: opciones => {
        this.opciones.set(opciones);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  onPeriodoChange(periodo: string): void {
    this.periodoSeleccionado.set(periodo);
    this.periodoChange.emit(periodo);
  }

  getPeriodoTexto(periodo: string): string {
    if (periodo === 'todos') return 'Todos los Períodos';
    if (!periodo) return this.periodoActualTexto() || 'Período actual';
    return this.opciones().find(o => o.valor === periodo)?.texto ?? formatearPeriodo(periodo);
  }

  private opcionesDeFuente(): Observable<OpcionPeriodo[]> {
    if (this.fuente() === 'con-cursos') {
      const aOpciones = (valores: string[]) => valores.map(valor => ({ valor, texto: formatearPeriodo(valor) }));
      return this.cursosService.getPeriodosRegistrados().pipe(
        // Si falla, todos los períodos (el servicio devuelve [] si también falla)
        catchError(() => this.cursosService.getPeriodosAcademicos()),
        map(aOpciones)
      );
    }
    return this.periodosService.getPeriodosRecientes().pipe(
      map(periodos => periodos.map(p => ({ valor: p.valor, texto: textoPeriodo(p) })))
    );
  }
}

function textoPeriodo(periodo: PeriodoAcademico): string {
  return periodo.nombrePeriodo || formatearPeriodo(periodo.valor);
}
