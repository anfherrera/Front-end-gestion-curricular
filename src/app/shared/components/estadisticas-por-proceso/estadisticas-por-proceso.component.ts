import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Subscription } from 'rxjs';
import { EstadisticasService } from '../../../core/services/estadisticas.service';
import { EstadisticasPorProcesoResponse } from '../../../core/models/estadisticas.model';

interface ProcesoData {
  nombre: string;
  nombreFormateado: string;
  datos: any;
  totalSolicitudes?: number;
  aprobadas?: number;
  rechazadas?: number;
  enProceso?: number;
  porcentajeAprobacion?: number;
}

@Component({
  selector: 'app-estadisticas-por-proceso',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="estadisticas-por-proceso-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon>analytics</mat-icon>
          Estadísticas por Proceso
        </mat-card-title>
        <mat-card-subtitle>
          Detalle de solicitudes por proceso académico
        </mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div *ngIf="loading" class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Cargando estadísticas...</p>
        </div>

        <div *ngIf="error" class="error-container">
          <mat-icon class="error-icon">error</mat-icon>
          <p>{{ error }}</p>
          <button mat-raised-button color="primary" (click)="cargarDatos()">
            <mat-icon>refresh</mat-icon>
            Reintentar
          </button>
        </div>

        <div *ngIf="!loading && !error && procesosData.length > 0" class="procesos-container">
          <div class="procesos-grid">
            <div *ngFor="let proceso of procesosData" 
                 class="proceso-card"
                 [class]="'proceso-' + getProcesoClass(proceso.nombre)">
              
              <div class="proceso-header">
                <div class="proceso-icon">
                  <mat-icon>{{ getProcesoIcon(proceso.nombre) }}</mat-icon>
                </div>
                <div class="proceso-info">
                  <h3 class="proceso-nombre">{{ proceso.nombreFormateado }}</h3>
                  <div class="proceso-total">
                    <span class="total-solicitudes">{{ proceso.totalSolicitudes || 0 }}</span>
                    <span class="label">solicitudes</span>
                  </div>
                </div>
              </div>

              <div class="proceso-stats" *ngIf="proceso.totalSolicitudes && proceso.totalSolicitudes > 0">
                <div class="stat-row">
                  <div class="stat-item aprobadas">
                    <mat-icon>check_circle</mat-icon>
                    <span class="stat-value">{{ proceso.aprobadas || 0 }}</span>
                    <span class="stat-label">Aprobadas</span>
                  </div>
                  <div class="stat-item rechazadas">
                    <mat-icon>cancel</mat-icon>
                    <span class="stat-value">{{ proceso.rechazadas || 0 }}</span>
                    <span class="stat-label">Rechazadas</span>
                  </div>
                </div>
                
                <div class="stat-row">
                  <div class="stat-item en-proceso">
                    <mat-icon>pending</mat-icon>
                    <span class="stat-value">{{ proceso.enProceso || 0 }}</span>
                    <span class="stat-label">En Proceso</span>
                  </div>
                  <div class="stat-item porcentaje" *ngIf="proceso.porcentajeAprobacion !== undefined">
                    <mat-icon>trending_up</mat-icon>
                    <span class="stat-value">{{ proceso.porcentajeAprobacion | number:'1.1-1' }}%</span>
                    <span class="stat-label">Aprobación</span>
                  </div>
                </div>
              </div>

              <div class="proceso-datos-raw" *ngIf="mostrarDatosRaw">
                <mat-chip-set>
                  <mat-chip *ngFor="let key of getDatosKeys(proceso.datos)" 
                           [matTooltip]="proceso.datos[key]">
                    {{ key }}: {{ proceso.datos[key] }}
                  </mat-chip>
                </mat-chip-set>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && !error && procesosData.length === 0" class="no-data">
          <mat-icon>info</mat-icon>
          <p>No hay estadísticas de procesos disponibles</p>
        </div>
      </mat-card-content>

      <mat-card-actions *ngIf="!loading">
        <button mat-icon-button (click)="toggleDatosRaw()" 
                matTooltip="Mostrar/ocultar datos detallados">
          <mat-icon>{{ mostrarDatosRaw ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
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
    .estadisticas-por-proceso-card {
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

    .estadisticas-por-proceso-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    }

    .estadisticas-por-proceso-card mat-card-header {
      background: linear-gradient(135deg, #00138C, #001a99);
      margin: -16px -16px 16px -16px;
      padding: 16px;
      border-radius: 8px 8px 0 0;
    }

    .estadisticas-por-proceso-card mat-card-title {
      color: white;
      font-size: 1.2rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .estadisticas-por-proceso-card mat-card-subtitle {
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

    .procesos-container {
      padding: 8px 0;
      flex: 1;
      overflow-y: auto;
      max-height: 400px;
    }

    .procesos-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
      align-items: start;
    }

    .proceso-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 12px;
      transition: all 0.3s ease;
      border-left: 4px solid #00138C;
      height: fit-content;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .proceso-card:hover {
      background: #e9ecef;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .proceso-reingreso { border-left-color: #8e24aa; }
    .proceso-homologacion { border-left-color: #4caf50; }
    .proceso-cursos { border-left-color: #2196f3; }
    .proceso-ecaes { border-left-color: #00bcd4; }
    .proceso-paz { border-left-color: #ff9800; }

    .proceso-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .proceso-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .proceso-icon mat-icon {
      font-size: 1.1rem;
    }

    .proceso-info {
      flex: 1;
    }

    .proceso-nombre {
      font-size: 0.95rem;
      font-weight: 600;
      margin: 0 0 4px 0;
      line-height: 1.2;
      color: #333;
    }

    .proceso-total {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }

    .total-solicitudes {
      font-size: 1.1rem;
      font-weight: bold;
      color: #00138C;
    }

    .label {
      font-size: 0.8rem;
      color: #6c757d;
    }

    .proceso-stats {
      margin-bottom: 0;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .stat-row {
      display: flex;
      gap: 8px;
      margin-bottom: 0;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 8px;
      background: #fff;
      border-radius: 6px;
      font-size: 0.75rem;
      min-width: 70px;
      border: 1px solid #e9ecef;
    }

    .stat-item mat-icon {
      font-size: 0.9rem;
    }

    .stat-value {
      font-weight: bold;
      font-size: 0.8rem;
      color: #333;
    }

    .stat-label {
      font-size: 0.7rem;
      color: #6c757d;
    }

    .stat-item.aprobadas mat-icon { color: #4caf50; }
    .stat-item.rechazadas mat-icon { color: #f44336; }
    .stat-item.en-proceso mat-icon { color: #ff9800; }
    .stat-item.porcentaje mat-icon { color: #2196f3; }

    .proceso-datos-raw {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .proceso-datos-raw mat-chip {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      font-size: 0.75rem;
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
      .procesos-grid {
        grid-template-columns: 1fr;
      }

      .stat-row {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class EstadisticasPorProcesoComponent implements OnInit, OnDestroy {
  @Input() autoLoad: boolean = true;
  
  procesosData: ProcesoData[] = [];
  fechaConsulta: string | null = null;
  loading = false;
  error: string | null = null;
  mostrarDatosRaw = false;

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

    const sub = this.estadisticasService.getEstadisticasDetalladasPorProceso()
      .subscribe({
        next: (response: EstadisticasPorProcesoResponse) => {
          console.log('✅ Estadísticas por proceso obtenidas:', response);
          
          this.fechaConsulta = response.fechaConsulta;
          this.procesosData = this.procesarDatos(response.estadisticasPorProceso);
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Error al obtener estadísticas por proceso:', error);
          this.loading = false;
          this.error = 'Error al cargar estadísticas por proceso';
        }
      });

    this.subscription.add(sub);
  }

  private procesarDatos(estadisticasPorProceso: { [proceso: string]: any }): ProcesoData[] {
    return Object.entries(estadisticasPorProceso)
      .map(([nombre, datos]) => ({
        nombre,
        nombreFormateado: this.formatearNombreProceso(nombre),
        datos,
        totalSolicitudes: this.extraerTotalSolicitudes(datos),
        aprobadas: this.extraerAprobadas(datos),
        rechazadas: this.extraerRechazadas(datos),
        enProceso: this.extraerEnProceso(datos),
        porcentajeAprobacion: this.calcularPorcentajeAprobacion(datos)
      }))
      .sort((a, b) => (b.totalSolicitudes || 0) - (a.totalSolicitudes || 0));
  }

  private formatearNombreProceso(nombre: string): string {
    const nombres: { [key: string]: string } = {
      'reingreso': 'Reingreso de Estudiante',
      'homologacion': 'Homologación de Asignaturas',
      'cursos-intersemestrales': 'Cursos Intersemestrales',
      'pruebas-ecaes': 'Pruebas ECAES',
      'paz-salvo': 'Paz y Salvo'
    };
    
    return nombres[nombre.toLowerCase()] || nombre;
  }

  private extraerTotalSolicitudes(datos: any): number {
    if (typeof datos === 'number') return datos;
    if (datos?.totalSolicitudes) return datos.totalSolicitudes;
    if (datos?.total) return datos.total;
    return 0;
  }

  private extraerAprobadas(datos: any): number {
    if (datos?.aprobadas) return datos.aprobadas;
    if (datos?.approved) return datos.approved;
    return 0;
  }

  private extraerRechazadas(datos: any): number {
    if (datos?.rechazadas) return datos.rechazadas;
    if (datos?.rejected) return datos.rejected;
    return 0;
  }

  private extraerEnProceso(datos: any): number {
    if (datos?.enProceso) return datos.enProceso;
    if (datos?.pending) return datos.pending;
    if (datos?.inProcess) return datos.inProcess;
    return 0;
  }

  private calcularPorcentajeAprobacion(datos: any): number {
    const total = this.extraerTotalSolicitudes(datos);
    const aprobadas = this.extraerAprobadas(datos);
    
    if (total > 0) {
      return (aprobadas / total) * 100;
    }
    return 0;
  }

  getProcesoClass(nombre: string): string {
    const clases: { [key: string]: string } = {
      'reingreso': 'reingreso',
      'homologacion': 'homologacion',
      'cursos-intersemestrales': 'cursos',
      'pruebas-ecaes': 'ecaes',
      'paz-salvo': 'paz'
    };
    
    return clases[nombre.toLowerCase()] || 'default';
  }

  getProcesoIcon(nombre: string): string {
    const iconos: { [key: string]: string } = {
      'reingreso': 'person_add',
      'homologacion': 'swap_horiz',
      'cursos-intersemestrales': 'school',
      'pruebas-ecaes': 'quiz',
      'paz-salvo': 'verified'
    };
    
    return iconos[nombre.toLowerCase()] || 'description';
  }

  getDatosKeys(datos: any): string[] {
    if (typeof datos === 'object' && datos !== null) {
      return Object.keys(datos).slice(0, 5); // Mostrar máximo 5 claves
    }
    return [];
  }

  toggleDatosRaw(): void {
    this.mostrarDatosRaw = !this.mostrarDatosRaw;
  }
}
