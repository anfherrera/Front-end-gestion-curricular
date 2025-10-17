import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EstadisticasService } from '../../../core/services/estadisticas.service';
import { EstadoSolicitudesResponse, EstadoInfo } from '../../../core/models/estadisticas.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-estadisticas-por-estado',
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
    <mat-card class="estadisticas-por-estado-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>assessment</mat-icon> Estado de Solicitudes
        </mat-card-title>
        <mat-card-subtitle>Distribución de solicitudes por estado</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div *ngIf="loading" class="loading-overlay">
          <mat-spinner diameter="30"></mat-spinner>
          <p>Cargando estados...</p>
        </div>
        
        <div *ngIf="!loading && error" class="error-message">
          <mat-icon color="warn">error_outline</mat-icon>
          <p>Error al cargar estadísticas por estado.</p>
        </div>
        
        <div *ngIf="!loading && !error && estadosData.length === 0" class="no-data-message">
          <mat-icon>info_outline</mat-icon>
          <p>No hay datos de estados disponibles.</p>
        </div>
        
        <div *ngIf="!loading && !error && estadosData.length > 0" class="estados-container">
          <div class="total-solicitudes">
            <span class="total-label">Total:</span>
            <span class="total-value">{{ totalSolicitudes }}</span>
            <span class="total-text">solicitudes</span>
          </div>
          
          <div class="estados-grid">
            <div *ngFor="let estado of estadosData" 
                 class="estado-card"
                 [style.border-left-color]="estado.color">
              <div class="estado-header">
                <div class="estado-icon" [style.background-color]="estado.color + '20'">
                  <mat-icon [style.color]="estado.color">{{ getIconName(estado.icono) }}</mat-icon>
                </div>
                <div class="estado-info">
                  <h4 class="estado-nombre" [style.color]="estado.color">{{ estado.nombre }}</h4>
                  <p class="estado-descripcion">{{ estado.descripcion }}</p>
                </div>
              </div>
              
              <div class="estado-stats">
                <div class="estado-cantidad" [style.color]="estado.color">
                  {{ estado.cantidad }}
                </div>
                <div class="estado-porcentaje">
                  {{ estado.porcentaje }}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </mat-card-content>
      
      <mat-card-actions *ngIf="!loading && !error && estadosData.length > 0">
        <button mat-icon-button (click)="actualizarDatos()" [disabled]="loading" 
                matTooltip="Actualizar datos">
          <mat-icon>refresh</mat-icon>
        </button>
        <small class="fecha-actualizacion">
          Actualizado: {{ fechaConsulta | date:'short' }}
        </small>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .estadisticas-por-estado-card {
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

    .estadisticas-por-estado-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    }

    .estadisticas-por-estado-card mat-card-header {
      background: linear-gradient(135deg, #00138C, #001a99);
      margin: -16px -16px 16px -16px;
      padding: 16px;
      border-radius: 8px 8px 0 0;
    }

    .estadisticas-por-estado-card mat-card-title {
      color: white;
      font-size: 1.2rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .estadisticas-por-estado-card mat-card-subtitle {
      color: rgba(255, 255, 255, 0.8);
      font-size: 0.9rem;
    }

    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    }

    .loading-overlay p {
      margin-top: 16px;
      color: #666;
      font-size: 0.9rem;
    }

    .error-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    }

    .error-message mat-icon {
      font-size: 3rem;
      margin-bottom: 16px;
      opacity: 0.6;
    }

    .error-message p {
      color: #f44336;
      font-size: 0.9rem;
    }

    .no-data-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    }

    .no-data-message mat-icon {
      font-size: 3rem;
      margin-bottom: 16px;
      opacity: 0.6;
    }

    .no-data-message p {
      color: #666;
      font-size: 0.9rem;
    }

    .estados-container {
      padding: 8px 0;
      flex: 1;
      overflow-y: auto;
      max-height: 400px;
    }

    .total-solicitudes {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 20px;
      padding: 12px 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #00138C;
    }

    .total-label {
      font-size: 0.9rem;
      color: #6c757d;
      font-weight: 500;
    }

    .total-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #00138C;
    }

    .total-text {
      font-size: 0.9rem;
      color: #6c757d;
    }

    .estados-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .estado-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.3s ease;
      border-left: 4px solid;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .estado-card:hover {
      background: #e9ecef;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .estado-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .estado-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .estado-icon mat-icon {
      font-size: 1.2rem;
    }

    .estado-info {
      flex: 1;
    }

    .estado-nombre {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 4px 0;
      line-height: 1.2;
    }

    .estado-descripcion {
      font-size: 0.8rem;
      color: #6c757d;
      margin: 0;
      line-height: 1.3;
    }

    .estado-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
    }

    .estado-cantidad {
      font-size: 2rem;
      font-weight: bold;
      line-height: 1;
    }

    .estado-porcentaje {
      font-size: 1.1rem;
      font-weight: 600;
      color: #6c757d;
    }

    .fecha-actualizacion {
      color: #6c757d;
      font-size: 0.8rem;
      margin-left: auto;
    }

    @media (max-width: 768px) {
      .estados-grid {
        grid-template-columns: 1fr;
      }
      
      .estado-card {
        padding: 12px;
      }
      
      .estado-cantidad {
        font-size: 1.5rem;
      }
    }
  `]
})
export class EstadisticasPorEstadoComponent implements OnInit, OnDestroy {
  estadosData: Array<{nombre: string} & EstadoInfo> = [];
  totalSolicitudes = 0;
  fechaConsulta = '';
  loading = true;
  error = false;
  private subscription: Subscription = new Subscription();

  constructor(private estadisticasService: EstadisticasService) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = false;

    const sub = this.estadisticasService.getEstadoSolicitudes()
      .subscribe({
        next: (response: EstadoSolicitudesResponse) => {
          console.log('✅ Estado de solicitudes obtenido:', response);
          
          this.fechaConsulta = response.fechaConsulta;
          this.totalSolicitudes = response.totalSolicitudes;
          
          // Convertir el objeto de estados a array para el template
          this.estadosData = Object.entries(response.estados).map(([nombre, info]) => ({
            nombre,
            ...info
          }));
          
          this.loading = false;
        },
        error: (err) => {
          console.error('❌ Error al obtener estado de solicitudes:', err);
          this.error = true;
          this.loading = false;
        }
      });

    this.subscription.add(sub);
  }

  actualizarDatos(): void {
    this.cargarDatos();
  }

  getIconName(icono: string): string {
    // Convertir iconos de FontAwesome a Material Icons
    const iconMap: { [key: string]: string } = {
      'fas fa-check-circle': 'check_circle',
      'fas fa-paper-plane': 'send',
      'fas fa-times-circle': 'cancel',
      'fas fa-clock': 'schedule',
      'fas fa-pause-circle': 'pause_circle',
      'fas fa-exclamation-circle': 'warning',
      'fas fa-info-circle': 'info'
    };
    
    return iconMap[icono] || 'help_outline';
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
