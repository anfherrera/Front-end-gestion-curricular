import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MATERIAL_IMPORTS } from '../material.imports';
import { CursosIntersemestralesService } from '../../../core/services/cursos-intersemestrales.service';
import { formatearPeriodo } from '../../../core/utils/periodo.utils';

@Component({
  selector: 'app-periodo-selector',
  standalone: true,
  imports: [CommonModule, ...MATERIAL_IMPORTS],
  template: `
    <div class="periodo-selector-container">
      <mat-form-field appearance="outline" class="periodo-selector">
        <mat-label>Filtrar por período académico</mat-label>
        <mat-select [(value)]="periodoSeleccionado" (selectionChange)="onPeriodoChange()">
          <mat-option [value]="''">Período Actual</mat-option>
          <mat-option [value]="'todos'">Todos los Períodos</mat-option>
          <mat-option *ngFor="let periodo of periodos" [value]="periodo">
            {{ formatearPeriodoDisplay(periodo) }}
          </mat-option>
        </mat-select>
      </mat-form-field>
      
      <div class="info-periodo" *ngIf="periodoSeleccionado === 'todos'">
        <mat-icon>info</mat-icon>
        <span>Mostrando <strong>todos los cursos</strong> de todos los períodos</span>
      </div>
      <div class="info-periodo" *ngIf="periodoSeleccionado && periodoSeleccionado !== 'todos'">
        <mat-icon>info</mat-icon>
        <span>Mostrando cursos del período: <strong>{{ formatearPeriodoDisplay(periodoSeleccionado) }}</strong></span>
      </div>
      <div class="info-periodo" *ngIf="!periodoSeleccionado">
        <mat-icon>info</mat-icon>
        <span>Mostrando cursos del <strong>período académico actual</strong></span>
      </div>
    </div>
  `,
  styles: [`
    .periodo-selector-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 16px;
    }

    .periodo-selector {
      width: 100%;
      max-width: 300px;
    }

    .info-periodo {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background-color: #e3f2fd;
      border-radius: 4px;
      color: #1976d2;
    }

    .info-periodo mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .info-periodo span {
      font-size: 0.9em;
    }

    @media (max-width: 768px) {
      .periodo-selector {
        max-width: 100%;
      }
    }
  `]
})
export class PeriodoSelectorComponent implements OnInit {
  @Input() mostrarTodos = true; // Si se muestra la opción "Todos los períodos"
  @Input() soloRegistrados = true; // Si solo se muestran períodos con cursos registrados
  @Output() periodoChange = new EventEmitter<string>();

  periodos: string[] = [];
  periodoSeleccionado = '';
  cargando = false;

  constructor(private cursosService: CursosIntersemestralesService) {}

  ngOnInit(): void {
    this.cargarPeriodos();
  }

  cargarPeriodos(): void {
    this.cargando = true;
    
    if (this.soloRegistrados) {
      // Cargar solo períodos que tienen cursos registrados
      this.cursosService.getPeriodosRegistrados().subscribe({
        next: (periodos) => {
          this.periodos = periodos;
          this.cargando = false;
          // Períodos registrados cargados
        },
        error: (error) => {
          console.error('Error cargando períodos registrados:', error);
          this.cargando = false;
          // Fallback: cargar todos los períodos
          this.cargarTodosLosPeriodos();
        }
      });
    } else {
      // Cargar todos los períodos académicos disponibles
      this.cargarTodosLosPeriodos();
    }
  }

  private cargarTodosLosPeriodos(): void {
    this.cursosService.getPeriodosAcademicos().subscribe({
      next: (periodos) => {
        this.periodos = periodos;
        this.cargando = false;
        // Todos los períodos cargados
      },
      error: (error) => {
        console.error('Error cargando todos los períodos:', error);
        this.cargando = false;
      }
    });
  }

  onPeriodoChange(): void {
    this.periodoChange.emit(this.periodoSeleccionado);
  }

  formatearPeriodoDisplay(periodo: string): string {
    if (periodo === 'todos') {
      return 'Todos los Períodos';
    }
    return formatearPeriodo(periodo);
  }
}



