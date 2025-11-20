import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { EstadisticasService } from '../../../core/services/estadisticas.service';
import { TotalEstudiantesResponse } from '../../../core/models/estadisticas.model';

@Component({
  selector: 'app-estudiantes-kpi',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  template: `
    <mat-card class="estudiantes-kpi-card">
      <mat-card-content>
        <div class="kpi-content">
          <div class="kpi-icon">
            <mat-icon>people</mat-icon>
          </div>
          <div class="kpi-data">
            <h3 class="kpi-value">
              <span *ngIf="loading">...</span>
              <span *ngIf="!loading">{{ totalEstudiantes | number }}</span>
            </h3>
            <p class="kpi-title">Total de Estudiantes</p>
            <p class="kpi-description">Estudiantes registrados en el sistema</p>
            <div *ngIf="fechaConsulta" class="kpi-date">
              <small>Última actualización: {{ fechaConsulta | date:'short' }}</small>
            </div>
          </div>
        </div>
        <div class="kpi-actions">
          <button mat-icon-button (click)="actualizarDatos()" [disabled]="loading" 
                  matTooltip="Actualizar datos">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .estudiantes-kpi-card {
      background: linear-gradient(135deg, #17a2b8, #138496);
      border: none;
      border-radius: 12px;
      color: white;
      box-shadow: 0 4px 15px rgba(23, 162, 184, 0.3);
      position: relative;
      overflow: hidden;
    }

    .estudiantes-kpi-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #17a2b8, #138496, #20c997);
      animation: shimmer 2s infinite;
    }

    .kpi-content {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .kpi-icon {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 15px rgba(255, 255, 255, 0.1);
    }

    .kpi-icon mat-icon {
      font-size: 2rem;
      color: white;
    }

    .kpi-data {
      flex: 1;
    }

    .kpi-value {
      font-size: 2.5rem;
      font-weight: bold;
      margin: 0 0 5px 0;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .kpi-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0 0 5px 0;
      opacity: 0.9;
    }

    .kpi-description {
      font-size: 0.9rem;
      opacity: 0.8;
      margin: 0 0 10px 0;
    }

    .kpi-date {
      opacity: 0.7;
    }

    .kpi-actions {
      position: absolute;
      top: 10px;
      right: 10px;
    }

    .kpi-actions button {
      color: white;
    }

    .kpi-actions button:disabled {
      opacity: 0.5;
    }

    @keyframes shimmer {
      0% {
        background-position: -200px 0;
      }
      100% {
        background-position: calc(200px + 100%) 0;
      }
    }

    .loading .kpi-value {
      background: linear-gradient(90deg, rgba(255,255,255,0.3) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.3) 75%);
      background-size: 200px 100%;
      animation: loading-shimmer 1.5s infinite;
      color: transparent;
      border-radius: 4px;
    }

    @keyframes loading-shimmer {
      0% {
        background-position: -200px 0;
      }
      100% {
        background-position: calc(200px + 100%) 0;
      }
    }
  `]
})
export class EstudiantesKpiComponent implements OnInit, OnDestroy {
  totalEstudiantes: number = 0;
  fechaConsulta: string | null = null;
  loading = false;
  error = false;

  private subscription: Subscription = new Subscription();

  constructor(private estadisticasService: EstadisticasService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = false;

    const sub = this.estadisticasService.getTotalEstudiantes()
      .subscribe({
        next: (response: TotalEstudiantesResponse) => {
          // Total de estudiantes obtenido
          this.totalEstudiantes = response.totalEstudiantes;
          this.fechaConsulta = response.fechaConsulta;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al obtener total de estudiantes:', error);
          this.loading = false;
          this.error = true;
          this.totalEstudiantes = 0;
        }
      });

    this.subscription.add(sub);
  }

  actualizarDatos(): void {
    this.cargarDatos();
  }
}
