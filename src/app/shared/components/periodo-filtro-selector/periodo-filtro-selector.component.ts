import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
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
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="periodo-filtro-container">
      <mat-form-field appearance="outline" class="periodo-selector">
        <mat-label>{{ label || 'Filtrar por período académico' }}</mat-label>
        <mat-select
          [value]="periodoSeleccionado"
          (selectionChange)="onPeriodoChange($event.value)"
          [disabled]="cargando">
          <mat-option [value]="'todos'" *ngIf="mostrarTodos">
            <span class="option-text">Todos los Períodos</span>
          </mat-option>
          <mat-option [value]="''" *ngIf="incluirActual">
            <span class="option-text">Período actual{{ periodoActualTexto ? ' (' + periodoActualTexto + ')' : '' }}</span>
          </mat-option>
          <mat-option *ngFor="let opcion of opciones" [value]="opcion.valor">
            <span class="option-text">{{ opcion.texto }}</span>
          </mat-option>
        </mat-select>
        <mat-spinner *ngIf="cargando" diameter="20" class="spinner"></mat-spinner>
      </mat-form-field>

      <div class="info-periodo" *ngIf="mostrarInfo">
        <mat-icon>info</mat-icon>
        <span *ngIf="periodoSeleccionado === 'todos'">
          Mostrando <strong>todos los cursos</strong> de todos los períodos
        </span>
        <span *ngIf="periodoSeleccionado && periodoSeleccionado !== 'todos'">
          Mostrando datos del período: <strong>{{ getPeriodoTexto(periodoSeleccionado) }}</strong>
        </span>
        <span *ngIf="!periodoSeleccionado">
          Mostrando datos del <strong>período académico actual</strong>
        </span>
      </div>
    </div>
  `,
  styles: [`
    .periodo-filtro-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .periodo-selector {
      width: 100%;
      max-width: 350px;
      position: relative;
    }

    .spinner {
      position: absolute;
      right: 40px;
      top: 50%;
      transform: translateY(-50%);
    }

    .info-periodo {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: #e3f2fd;
      border-radius: 4px;
      color: #1976d2;
      font-size: 0.9em;
    }

    .info-periodo mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .option-text {
      display: block;
    }

    @media (max-width: 768px) {
      .periodo-selector {
        max-width: 100%;
      }
    }
  `]
})
export class PeriodoFiltroSelectorComponent implements OnInit {
  @Input() label = '';
  @Input() mostrarTodos = true;
  @Input() incluirActual = true;
  @Input() mostrarInfo = true;
  @Input() fuente: FuentePeriodos = 'recientes';
  /** Selección inicial. Sin valor: "todos" si se muestra esa opción, si no el período actual (''). */
  @Input() periodoInicial: string | null = null;
  @Output() periodoChange = new EventEmitter<string>();

  opciones: OpcionPeriodo[] = [];
  periodoSeleccionado = '';
  periodoActualTexto = '';
  cargando = false;

  private readonly periodosService = inject(PeriodosAcademicosService);
  private readonly cursosService = inject(CursosIntersemestralesService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.periodoSeleccionado = this.periodoInicial ?? (this.mostrarTodos ? 'todos' : '');

    const actual = this.periodosService.getPeriodoActualValue();
    if (actual) {
      this.periodoActualTexto = textoPeriodo(actual);
    } else {
      this.periodosService.getPeriodoActual().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: periodo => this.periodoActualTexto = periodo ? textoPeriodo(periodo) : 'No disponible',
        error: () => this.periodoActualTexto = 'No disponible'
      });
    }
    this.periodosService.periodoActual$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(periodo => {
      this.periodoActualTexto = periodo ? textoPeriodo(periodo) : 'No disponible';
    });

    this.cargarPeriodos();
  }

  cargarPeriodos(): void {
    this.cargando = true;
    this.opcionesDeFuente().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: opciones => {
        this.opciones = opciones;
        this.cargando = false;
      },
      error: () => this.cargando = false
    });
  }

  onPeriodoChange(periodo: string): void {
    this.periodoSeleccionado = periodo;
    this.periodoChange.emit(periodo);
  }

  getPeriodoTexto(periodo: string): string {
    if (periodo === 'todos') return 'Todos los Períodos';
    if (!periodo) return this.periodoActualTexto || 'Período actual';
    return this.opciones.find(o => o.valor === periodo)?.texto ?? formatearPeriodo(periodo);
  }

  private opcionesDeFuente(): Observable<OpcionPeriodo[]> {
    if (this.fuente === 'con-cursos') {
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
