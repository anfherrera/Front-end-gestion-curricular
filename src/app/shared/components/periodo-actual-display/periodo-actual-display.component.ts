import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CursosIntersemestralesService } from '../../../core/services/cursos-intersemestrales.service';
import { formatearPeriodo } from '../../../core/utils/periodo.utils';

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
export class PeriodoActualDisplayComponent implements OnInit {
  periodoActual: string = '';
  periodoFormateado: string = '';

  constructor(private cursosService: CursosIntersemestralesService) {}

  ngOnInit(): void {
    this.cargarPeriodoActual();
  }

  cargarPeriodoActual(): void {
    this.cursosService.getPeriodoActual().subscribe({
      next: (periodo) => {
        if (periodo) {
          this.periodoActual = periodo;
          this.periodoFormateado = formatearPeriodo(periodo);
        }
      },
      error: (error) => {
        console.error('Error obteniendo período actual:', error);
      }
    });
  }
}

