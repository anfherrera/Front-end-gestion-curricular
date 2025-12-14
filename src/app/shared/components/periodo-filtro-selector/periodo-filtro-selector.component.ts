import { Component, OnInit, Output, EventEmitter, Input, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { PeriodosAcademicosService, PeriodoAcademico } from '../../../core/services/periodos-academicos.service';
import { formatearPeriodo } from '../../../core/utils/periodo.utils';

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
          <mat-option [value]="''" *ngIf="mostrarTodos">
            <span class="option-text">Período actual ({{ periodoActualTexto }})</span>
          </mat-option>
          <mat-option [value]="''" *ngIf="!mostrarTodos && incluirActual">
            <span class="option-text">Período actual ({{ periodoActualTexto }})</span>
          </mat-option>
          <mat-option *ngFor="let periodo of periodosDisponibles" [value]="periodo.valor">
            <span class="option-text">{{ getPeriodoDisplay(periodo) }}</span>
          </mat-option>
        </mat-select>
        <mat-spinner *ngIf="cargando" diameter="20" class="spinner"></mat-spinner>
      </mat-form-field>
      
      <div class="info-periodo" *ngIf="periodoSeleccionado && mostrarInfo">
        <mat-icon>info</mat-icon>
        <span>Mostrando datos del período: <strong>{{ getPeriodoTexto(periodoSeleccionado) }}</strong></span>
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
export class PeriodoFiltroSelectorComponent implements OnInit, OnDestroy {
  @Input() label: string = '';
  @Input() mostrarTodos: boolean = true;
  @Input() incluirActual: boolean = true;
  @Input() mostrarInfo: boolean = true;
  @Input() periodoInicial: string = '';
  @Output() periodoChange = new EventEmitter<string>();

  periodosDisponibles: PeriodoAcademico[] = [];
  periodoActual: PeriodoAcademico | null = null;
  periodoSeleccionado: string = '';
  periodoActualTexto: string = '';
  cargando = false;
  private subscriptions: Subscription[] = [];

  constructor(private periodosService: PeriodosAcademicosService) {}

  ngOnInit(): void {
    // Suscribirse al período actual
    const periodoSub = this.periodosService.periodoActual$.subscribe(periodo => {
      this.periodoActual = periodo;
      if (periodo) {
        this.periodoActualTexto = periodo.nombrePeriodo || formatearPeriodo(periodo.valor);
        // Si no hay período seleccionado, usar el actual
        if (!this.periodoSeleccionado && !this.periodoInicial) {
          this.periodoSeleccionado = periodo.valor;
        }
      }
    });
    this.subscriptions.push(periodoSub);

    // Cargar período actual si no está cargado
    if (!this.periodosService.getPeriodoActualValue()) {
      this.periodosService.getPeriodoActual().subscribe();
    } else {
      this.periodoActual = this.periodosService.getPeriodoActualValue();
      if (this.periodoActual) {
        this.periodoActualTexto = this.periodoActual.nombrePeriodo || formatearPeriodo(this.periodoActual.valor);
      }
    }

    // Establecer período inicial
    if (this.periodoInicial) {
      this.periodoSeleccionado = this.periodoInicial;
    } else if (this.periodoActual) {
      this.periodoSeleccionado = this.periodoActual.valor;
    }

    // Cargar períodos disponibles
    this.cargarPeriodos();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  cargarPeriodos(): void {
    this.cargando = true;
    
    this.periodosService.getPeriodosRecientes().subscribe({
      next: (periodos) => {
        this.periodosDisponibles = periodos;
        this.cargando = false;
      },
      error: (error) => {
        console.error('Error cargando períodos:', error);
        this.cargando = false;
      }
    });
  }

  onPeriodoChange(periodo: string): void {
    this.periodoSeleccionado = periodo;
    this.periodoChange.emit(periodo);
  }

  getPeriodoDisplay(periodo: PeriodoAcademico): string {
    return periodo.nombrePeriodo || formatearPeriodo(periodo.valor);
  }

  getPeriodoTexto(periodo: string): string {
    if (!periodo) {
      return this.periodoActualTexto || 'Período actual';
    }
    const periodoObj = this.periodosDisponibles.find(p => p.valor === periodo);
    return periodoObj ? this.getPeriodoDisplay(periodoObj) : formatearPeriodo(periodo);
  }
}

