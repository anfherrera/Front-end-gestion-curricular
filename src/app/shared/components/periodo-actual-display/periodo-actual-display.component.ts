import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { PeriodosAcademicosService, PeriodoAcademico } from '../../../core/services/periodos-academicos.service';
import { formatearPeriodo } from '../../../core/utils/periodo.utils';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-periodo-actual-display',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="periodo-actual-container" *ngIf="periodoActual">
      <mat-card class="periodo-card">
        <mat-card-content>
          <div class="periodo-content">
            <mat-icon class="periodo-icon">calendar_today</mat-icon>
            <div class="periodo-info">
              <span class="periodo-label">Período Académico Actual</span>
              <span class="periodo-value">{{ periodoFormateado }}</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .periodo-actual-container {
      margin-bottom: 16px;
    }

    .periodo-card {
      background: linear-gradient(135deg, #00138C 0%, #1976d2 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(0, 19, 140, 0.2);
    }

    .periodo-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .periodo-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: white;
    }

    .periodo-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .periodo-label {
      font-size: 0.85rem;
      opacity: 0.9;
      font-weight: 400;
    }

    .periodo-value {
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    @media (max-width: 768px) {
      .periodo-value {
        font-size: 1.1rem;
      }
    }
  `]
})
export class PeriodoActualDisplayComponent implements OnInit, OnDestroy {
  periodoActual: PeriodoAcademico | null = null;
  periodoFormateado: string = '';
  private destroy$ = new Subject<void>();

  constructor(private periodosService: PeriodosAcademicosService) {}

  ngOnInit(): void {
    // Suscribirse al observable del período actual
    this.periodosService.periodoActual$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(periodo => {
      if (periodo) {
        this.periodoActual = periodo;
        this.periodoFormateado = periodo.nombrePeriodo || formatearPeriodo(periodo.valor);
      } else {
        // Si no hay período en el subject, intentar cargarlo
        this.cargarPeriodoActual();
      }
    });

    // Si no hay período cargado, cargarlo
    if (!this.periodosService.getPeriodoActualValue()) {
      this.cargarPeriodoActual();
    } else {
      this.periodoActual = this.periodosService.getPeriodoActualValue();
      if (this.periodoActual) {
        this.periodoFormateado = this.periodoActual.nombrePeriodo || formatearPeriodo(this.periodoActual.valor);
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarPeriodoActual(): void {
    this.periodosService.getPeriodoActual().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (periodo) => {
        if (periodo) {
          this.periodoActual = periodo;
          this.periodoFormateado = periodo.nombrePeriodo || formatearPeriodo(periodo.valor);
        }
      },
      error: (error) => {
      }
    });
  }
}

