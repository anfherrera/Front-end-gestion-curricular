import { Component, OnInit, OnDestroy, OnChanges, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Subscription } from 'rxjs';
import { EstadisticasService } from '@core/services/estadisticas.service';
import { EstadisticasPorProcesoResponse, ProcesoDetallado } from '@core/models/estadisticas/generales.model';

interface ProcesoData {
  nombre: string;
  nombreFormateado: string;
  datos: ProcesoDetallado;
  totalSolicitudes: number;
  aprobadas: number;
  rechazadas: number;
  enProceso: number;
  enviadas: number;
  porcentajeAprobacion: number;
}

@Component({
  selector: 'app-estadisticas-por-proceso',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './estadisticas-por-proceso.component.html',
  styleUrl: './estadisticas-por-proceso.component.css'
})
export class EstadisticasPorProcesoComponent implements OnInit, OnDestroy, OnChanges {
  private estadisticasService = inject(EstadisticasService);

  @Input() autoLoad = true;
  @Input() periodoAcademico?: string;
  @Input() idPrograma?: number;
  
  procesosData: ProcesoData[] = [];
  fechaConsulta: string | null = null;
  loading = false;
  error: string | null = null;
  mostrarDatosRaw = false;

  private subscription: Subscription = new Subscription();

  ngOnInit(): void {
    if (this.autoLoad) {
      this.cargarDatos();
    }
  }

  ngOnChanges(): void {
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

    // Preparar filtros
    const filtros: { periodoAcademico?: string; idPrograma?: number } = {};
    
    if (this.periodoAcademico && this.periodoAcademico.trim() !== '' && this.periodoAcademico !== 'todos') {
      filtros.periodoAcademico = this.periodoAcademico.trim();
    }
    
    if (this.idPrograma !== undefined && this.idPrograma !== null && !isNaN(this.idPrograma) && this.idPrograma > 0) {
      filtros.idPrograma = this.idPrograma;
    }

    const sub = this.estadisticasService.getEstadisticasDetalladasPorProceso(filtros)
      .subscribe({
        next: (response: EstadisticasPorProcesoResponse) => {
          this.fechaConsulta = response.fechaConsulta;
          this.procesosData = this.procesarDatos(response.estadisticasPorProceso);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.error = 'Error al cargar estadísticas por proceso';
        }
      });

    this.subscription.add(sub);
  }

  private procesarDatos(estadisticasPorProceso: Record<string, ProcesoDetallado>): ProcesoData[] {
    return Object.entries(estadisticasPorProceso)
      .map(([nombre, datos]) => {
        const total = datos.totalSolicitudes || 0;
        const aprobadas = datos.aprobadas || 0;
        return {
          nombre,
          nombreFormateado: this.formatearNombreProceso(nombre),
          datos,
          totalSolicitudes: total,
          aprobadas,
          rechazadas: datos.rechazadas || 0,
          enProceso: datos.enProceso || 0,
          enviadas: datos.enviadas || 0,
          porcentajeAprobacion: total > 0 ? (aprobadas / total) * 100 : 0
        };
      })
      .sort((a, b) => b.totalSolicitudes - a.totalSolicitudes);
  }

  private formatearNombreProceso(nombre: string): string {
    const nombres: Record<string, string> = {
      'reingreso': 'Reingreso de Estudiante',
      'homologacion': 'Homologación de Asignaturas',
      'cursos-intersemestrales': 'Cursos Intersemestrales',
      'pruebas-ecaes': 'Pruebas ECAES',
      'paz-salvo': 'Paz y Salvo'
    };
    
    return nombres[nombre.toLowerCase()] || nombre;
  }

  getProcesoClass(nombre: string): string {
    const clases: Record<string, string> = {
      'reingreso': 'reingreso',
      'homologacion': 'homologacion',
      'cursos-intersemestrales': 'cursos',
      'pruebas-ecaes': 'ecaes',
      'paz-salvo': 'paz'
    };
    
    return clases[nombre.toLowerCase()] || 'default';
  }

  getProcesoIcon(nombre: string): string {
    const iconos: Record<string, string> = {
      'reingreso': 'person_add',
      'homologacion': 'swap_horiz',
      'cursos-intersemestrales': 'school',
      'pruebas-ecaes': 'quiz',
      'paz-salvo': 'verified'
    };
    
    return iconos[nombre.toLowerCase()] || 'description';
  }

  /** Hasta 5 campos del proceso, para la vista de datos detallados. */
  getDatosKeys(datos: ProcesoDetallado): (keyof ProcesoDetallado)[] {
    return (Object.keys(datos) as (keyof ProcesoDetallado)[]).slice(0, 5);
  }

  toggleDatosRaw(): void {
    this.mostrarDatosRaw = !this.mostrarDatosRaw;
  }
}
