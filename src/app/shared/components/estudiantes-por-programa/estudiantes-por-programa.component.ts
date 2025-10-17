import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { EstadisticasService } from '../../../core/services/estadisticas.service';
import { EstudiantesPorProgramaResponse, ProgramaData } from '../../../core/models/estadisticas.model';

@Component({
  selector: 'app-estudiantes-por-programa',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule
  ],
  template: `
    <mat-card class="estudiantes-por-programa-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>school</mat-icon>
          Estudiantes por Programa
        </mat-card-title>
        <mat-card-subtitle>
          Distribución de estudiantes por programa académico
        </mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando datos...</p>
        </div>

        <div *ngIf="error" class="error-container">
          <mat-icon class="error-icon">error</mat-icon>
          <p>{{ error }}</p>
          <button mat-raised-button color="primary" (click)="cargarDatos()">
            <mat-icon>refresh</mat-icon>
            Reintentar
          </button>
        </div>

        <div *ngIf="!loading && !error && programasData.length > 0" class="programas-container">
          <div class="programas-list">
            <div *ngFor="let programa of programasData; let i = index" 
                 class="programa-item" 
                 [class.odd]="i % 2 === 1">
              <div class="programa-info">
                <div class="programa-nombre">{{ programa.nombre }}</div>
                <div class="programa-porcentaje" *ngIf="programa.porcentaje">
                  {{ programa.porcentaje | number:'1.1-1' }}%
                </div>
              </div>
              <div class="programa-cantidad">
                <span class="numero">{{ programa.cantidad }}</span>
                <span class="label">estudiantes</span>
              </div>
            </div>
          </div>
          
          <div class="resumen">
            <div class="total-estudiantes">
              <mat-icon>people</mat-icon>
              <span>Total: {{ totalEstudiantes }} estudiantes</span>
            </div>
            <div class="total-programas">
              <mat-icon>school</mat-icon>
              <span>{{ programasData.length }} programas</span>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && !error && programasData.length === 0" class="no-data">
          <mat-icon>info</mat-icon>
          <p>No hay datos de estudiantes por programa disponibles</p>
        </div>
      </mat-card-content>

      <mat-card-actions *ngIf="!loading">
        <button mat-icon-button (click)="cargarDatos()" 
                matTooltip="Actualizar datos">
          <mat-icon>refresh</mat-icon>
        </button>
        <span class="spacer"></span>
        <small *ngIf="fechaConsulta" class="fecha-actualizacion">
          Actualizado: {{ fechaConsulta | date:'short' }}
        </small>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .estudiantes-por-programa-card {
      background-color: #fff;
      color: #333;
      border-radius: 12px;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
      position: relative;
      overflow: hidden;
      max-height: 600px;
      display: flex;
      flex-direction: column;
      border-left: 4px solid #00138C;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .estudiantes-por-programa-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    }

    .estudiantes-por-programa-card mat-card-header {
      background: linear-gradient(135deg, #00138C, #001a99);
      margin: -16px -16px 16px -16px;
      padding: 16px;
      border-radius: 8px 8px 0 0;
    }

    .estudiantes-por-programa-card mat-card-title {
      color: white;
      font-size: 1.2rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .estudiantes-por-programa-card mat-card-subtitle {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
    }

    .loading-container, .error-container, .no-data {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    }

    .error-container .error-icon {
      font-size: 3rem;
      margin-bottom: 16px;
      opacity: 0.8;
    }

    .no-data mat-icon {
      font-size: 3rem;
      margin-bottom: 16px;
      opacity: 0.6;
    }

    .programas-container {
      padding: 8px 0;
    }

    .programas-list {
      margin-bottom: 20px;
      flex: 1;
      overflow-y: auto;
      max-height: 300px;
    }

    .programa-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      margin: 8px 0;
      background: #f8f9fa;
      border-radius: 8px;
      transition: all 0.3s ease;
      border-left: 4px solid #00138C;
    }

    .programa-item:hover {
      background: #e9ecef;
      transform: translateX(4px);
    }

    .programa-item.odd {
      background: #f1f3f4;
    }

    .programa-item.odd:hover {
      background: #e9ecef;
    }

    .programa-info {
      flex: 1;
    }

    .programa-nombre {
      font-size: 0.95rem;
      font-weight: 500;
      margin-bottom: 4px;
      line-height: 1.3;
      color: #333;
    }

    .programa-porcentaje {
      font-size: 0.8rem;
      color: #6c757d;
      font-weight: 400;
    }

    .programa-cantidad {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      min-width: 80px;
    }

    .programa-cantidad .numero {
      font-size: 1.4rem;
      font-weight: bold;
      line-height: 1;
      color: #00138C;
    }

    .programa-cantidad .label {
      font-size: 0.7rem;
      color: #6c757d;
      margin-top: 2px;
    }

    .resumen {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      margin-top: 16px;
    }

    .total-estudiantes, .total-programas {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .total-estudiantes mat-icon, .total-programas mat-icon {
      font-size: 1.2rem;
    }

    .fecha-actualizacion {
      opacity: 0.7;
      font-size: 0.8rem;
    }

    .spacer {
      flex: 1;
    }

    @keyframes shimmer {
      0% {
        background-position: -200px 0;
      }
      100% {
        background-position: calc(200px + 100%) 0;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .programa-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .programa-cantidad {
        align-self: flex-end;
        flex-direction: row;
        gap: 8px;
      }

      .resumen {
        flex-direction: column;
        gap: 12px;
        text-align: center;
      }
    }
  `]
})
export class EstudiantesPorProgramaComponent implements OnInit, OnDestroy {
  @Input() autoLoad: boolean = true;
  
  programasData: ProgramaData[] = [];
  totalEstudiantes: number = 0;
  fechaConsulta: string | null = null;
  loading = false;
  error: string | null = null;

  private subscription: Subscription = new Subscription();

  constructor(private estadisticasService: EstadisticasService) {}

  ngOnInit(): void {
    if (this.autoLoad) {
      this.cargarDatos();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = null;

    const sub = this.estadisticasService.getEstudiantesPorPrograma()
      .subscribe({
        next: (response: EstudiantesPorProgramaResponse) => {
          console.log('✅ Estudiantes por programa obtenidos:', response);
          
          this.fechaConsulta = response.fechaConsulta;
          this.programasData = this.procesarDatos(response.estudiantesPorPrograma);
          this.totalEstudiantes = this.calcularTotalEstudiantes(response.estudiantesPorPrograma);
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error al obtener estudiantes por programa:', error);
          this.loading = false;
          this.error = 'Error al cargar datos de estudiantes por programa';
        }
      });

    this.subscription.add(sub);
  }

  private procesarDatos(estudiantesPorPrograma: { [programa: string]: number }): ProgramaData[] {
    const total = this.calcularTotalEstudiantes(estudiantesPorPrograma);
    
    return Object.entries(estudiantesPorPrograma)
      .map(([nombre, cantidad]) => ({
        nombre: this.formatearNombrePrograma(nombre),
        cantidad,
        porcentaje: total > 0 ? (cantidad / total) * 100 : 0
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  private calcularTotalEstudiantes(estudiantesPorPrograma: { [programa: string]: number }): number {
    return Object.values(estudiantesPorPrograma).reduce((total, cantidad) => total + cantidad, 0);
  }

  private formatearNombrePrograma(nombre: string): string {
    // Formatear nombres largos de programas
    if (nombre.length > 30) {
      return nombre.substring(0, 27) + '...';
    }
    return nombre;
  }
}
