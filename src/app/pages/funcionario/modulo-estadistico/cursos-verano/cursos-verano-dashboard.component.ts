import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { Chart, ChartConfiguration, ChartData, ChartOptions, registerables } from 'chart.js';

import { EstadisticasService } from '../../../../core/services/estadisticas.service';
import { 
  CursosVeranoResponse, 
  ResumenCursosVerano, 
  TopMateria, 
  AnalisisPrograma, 
  TendenciaTemporal, 
  EstadosSolicitudes, 
  Recomendacion,
  PrediccionesCursosVerano,
  MateriaPrediccion,
  ProgramaPrediccion,
  RecomendacionFutura
} from '../../../../core/models/estadisticas.model';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-cursos-verano-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule,
    MatTabsModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    MatListModule,
    MatExpansionModule,
    MatSnackBarModule
  ],
  templateUrl: './cursos-verano-dashboard.component.html',
  styleUrls: ['./cursos-verano-dashboard.component.css']
})
export class CursosVeranoDashboardComponent implements OnInit, OnDestroy {
  // ===== PROPIEDADES DE DATOS =====
  data: CursosVeranoResponse | null = null;
  loading = true;
  error: string | null = null;

  // ===== PROPIEDADES DE GRÁFICOS =====
  chartMaterias: Chart | null = null;
  chartProgramas: Chart | null = null;
  chartTendencias: Chart | null = null;
  chartPrediccionesMaterias: Chart | null = null;
  chartPrediccionesProgramas: Chart | null = null;
  chartPrediccionesTemporales: Chart | null = null;

  // ===== SUBSCRIPCIONES =====
  private subscriptions: Subscription[] = [];

  // ===== CONFIGURACIÓN DE COLORES =====
  private readonly colors = {
    primary: '#36A2EB',
    secondary: '#FF6384',
    success: '#4BC0C0',
    warning: '#FFCE56',
    danger: '#FF6384',
    info: '#9966FF',
    light: '#E7E9ED',
    dark: '#343A40'
  };

  constructor(
    private estadisticasService: EstadisticasService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.destruirGraficos();
  }

  // ===== MÉTODOS DE CARGA DE DATOS =====

  cargarDatos(): void {
    this.loading = true;
    this.error = null;

    console.log('🏖️ [DEBUG] Llamando al endpoint...');
    
    const subscription = this.estadisticasService.getCursosVeranoEstadisticas().subscribe({
      next: (response) => {
        console.log('✅ [DEBUG] Datos recibidos:', response);
        console.log('🔍 [DEBUG] Top materias:', response.topMaterias);
        console.log('🔍 [DEBUG] Análisis por programa:', response.analisisPorPrograma);
        console.log('🔍 [DEBUG] Tendencias temporales:', response.tendenciasTemporales);
        console.log('🔍 [DEBUG] Predicciones:', response.predicciones);
        console.log('🔍 [DEBUG] Predicciones temporales:', response.predicciones?.prediccionesTemporales);
        console.log('🔍 [DEBUG] Predicciones materias:', response.predicciones?.materiasConTendenciaCreciente);
        console.log('🔍 [DEBUG] Predicciones programas:', response.predicciones?.programasConTendenciaCreciente);
        console.log('🔍 Demanda estimada del backend:', response.predicciones?.demandaEstimadaProximoPeriodo);
        console.log('🔍 [DEBUG] Demanda estimada próximo período:', response.predicciones?.demandaEstimadaProximoPeriodo);
        console.log('🔍 [DEBUG] Demanda estimada mes pico:', response.predicciones?.prediccionesTemporales?.demandaEstimadaMesPico);
        console.log('🔍 [DEBUG] Tendencias temporales detalladas:', response.tendenciasTemporales);
        
        // Verificar que los datos se asignen correctamente
        if (response.predicciones?.demandaEstimadaProximoPeriodo) {
          console.log('🔍 [DEBUG] Demanda estimada asignada:', response.predicciones.demandaEstimadaProximoPeriodo);
        }
        
        // Verificar mapeo completo
        console.log('🔍 Datos completos:', {
          topMaterias: response.topMaterias,
          analisisPorPrograma: response.analisisPorPrograma,
          tendenciasTemporales: response.tendenciasTemporales,
          predicciones: response.predicciones
        });
        
        this.data = response;
        this.loading = false;
        
        // Crear gráficos después de cargar los datos
        setTimeout(() => {
          this.crearGraficos();
        }, 100);
      },
      error: (error) => {
        console.error('❌ [DEBUG] Error:', error);
        console.log('🔄 Cargando datos de prueba...');
        
        // Cargar datos de prueba si falla la API
        this.cargarDatosDePrueba();
        this.loading = false;
      }
    });

    this.subscriptions.push(subscription);
  }

  public cargarDatosDePrueba(): void {
    console.log('🧪 Cargando datos de prueba para cursos de verano');
    
    this.data = {
      fechaConsulta: new Date().toISOString(),
      descripcion: 'Datos de prueba para cursos de verano',
      resumen: {
        totalSolicitudes: 9,
        materiasUnicas: 3,
        programasParticipantes: 4,
        tasaAprobacion: 44.44
      },
      topMaterias: [
        { nombre: 'Programación Avanzada', solicitudes: 4, porcentaje: 44.44 },
        { nombre: 'Base de Datos', solicitudes: 3, porcentaje: 33.33 },
        { nombre: 'Redes de Computadores', solicitudes: 2, porcentaje: 22.22 }
      ],
      analisisPorPrograma: [
        { nombre: 'Ingeniería de Sistemas', solicitudes: 4, porcentaje: 44.44 },
        { nombre: 'Ingeniería Electrónica', solicitudes: 3, porcentaje: 33.33 },
        { nombre: 'Ingeniería Civil', solicitudes: 1, porcentaje: 11.11 },
        { nombre: 'Ingeniería Industrial', solicitudes: 1, porcentaje: 11.11 }
      ],
      tendenciasTemporales: [
        { mes: 'Enero', solicitudes: 2, porcentaje: 22.22 },
        { mes: 'Febrero', solicitudes: 3, porcentaje: 33.33 },
        { mes: 'Marzo', solicitudes: 4, porcentaje: 44.44 }
      ],
      estadosSolicitudes: {
        Aprobada: 4,
        Enviada: 2,
        'En Proceso': 2,
        Rechazada: 1
      },
      recomendaciones: [
        {
          tipo: 'PROGRAMA_DEMANDA',
          titulo: 'Enfocar oferta en Ingeniería de Sistemas',
          descripcion: 'Este programa representa 44.44% de las solicitudes',
          prioridad: 'ALTA',
          accion: 'Priorizar cursos que beneficien a este programa'
        },
        {
          tipo: 'BAJA_APROBACION',
          titulo: 'Mejorar criterios de selección',
          descripcion: 'Tasa de aprobación del 44.44%',
          prioridad: 'MEDIA',
          accion: 'Revisar criterios de selección para cursos de verano'
        }
      ],
      predicciones: {
        demandaEstimadaProximoPeriodo: 11,
        materiasConTendenciaCreciente: [
          {
            nombre: 'Programación Avanzada',
            demandaActual: 4,
            demandaEstimada: 6,
            tendencia: 'CRECIENTE',
            variacion: 2,
            porcentajeVariacion: 50
          },
          {
            nombre: 'Base de Datos',
            demandaActual: 3,
            demandaEstimada: 4,
            tendencia: 'CRECIENTE',
            variacion: 1,
            porcentajeVariacion: 33.33
          }
        ],
        materiasConTendenciaDecreciente: [
          {
            nombre: 'Redes de Computadores',
            demandaActual: 2,
            demandaEstimada: 1,
            tendencia: 'DECRECIENTE',
            variacion: -1,
            porcentajeVariacion: -50
          }
        ],
        materiasEstables: [],
        programasConTendenciaCreciente: [
          {
            nombre: 'Ingeniería de Sistemas',
            demandaActual: 4,
            demandaEstimada: 6,
            tendencia: 'CRECIENTE',
            variacion: 2
          }
        ],
        programasConTendenciaDecreciente: [],
        prediccionesTemporales: {
          mesPico: 'Marzo',
          demandaActualMesPico: 4,
          demandaEstimadaMesPico: 6,
          mesesRecomendados: ['Marzo', 'Abril', 'Mayo']
        },
        recomendacionesFuturas: [
          {
            tipo: 'EXPANSION_OFERTA',
            titulo: 'Expandir oferta de Programación Avanzada',
            descripcion: 'Demanda creciente del 50% para el próximo período',
            prioridad: 'ALTA',
            accion: 'Abrir más secciones de Programación Avanzada'
          },
          {
            tipo: 'NUEVA_MATERIA',
            titulo: 'Considerar nueva materia en IA',
            descripcion: 'Tendencia creciente en tecnologías emergentes',
            prioridad: 'MEDIA',
            accion: 'Evaluar viabilidad de curso de Inteligencia Artificial'
          }
        ],
        confiabilidad: 'ALTA',
        fechaPrediccion: new Date().toISOString(),
        metodologia: 'Análisis de tendencias históricas y patrones estacionales'
      }
    };

    // Crear gráficos con datos de prueba
    setTimeout(() => {
      this.crearGraficos();
    }, 100);
  }

  actualizarDatos(): void {
    this.cargarDatos();
  }

  // ===== MÉTODOS DE GRÁFICOS =====

  crearGraficos(): void {
    if (!this.data) {
      console.log('❌ No hay datos para crear gráficos');
      return;
    }

    console.log('📊 Creando gráficos con datos:', this.data);
    
    try {
      this.crearGraficoMaterias();
      this.crearGraficoProgramas();
      this.crearGraficoTendencias();
      this.crearGraficoPrediccionesMaterias();
      this.crearGraficoPrediccionesProgramas();
      this.crearGraficoPrediccionesTemporales();
      console.log('✅ Gráficos creados exitosamente');
    } catch (error) {
      console.error('❌ Error creando gráficos:', error);
    }
  }

  crearGraficoMaterias(): void {
    if (!this.data?.topMaterias || this.data.topMaterias.length === 0) {
      console.log('❌ No hay datos de materias para crear gráfico');
      return;
    }

    const ctx = document.getElementById('chartMaterias') as HTMLCanvasElement;
    if (!ctx) {
      console.log('❌ No se encontró el canvas chartMaterias');
      return;
    }

    console.log('📊 Creando gráfico de materias con datos:', this.data.topMaterias);
    this.destruirGrafico('chartMaterias');

    const data: ChartData<'doughnut'> = {
      labels: this.data.topMaterias.map(m => m.nombre),
      datasets: [{
        data: this.data.topMaterias.map(m => m.solicitudes),
        backgroundColor: [
          this.colors.primary,
          this.colors.secondary,
          this.colors.success,
          this.colors.warning,
          this.colors.info
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: 'Top Materias por Demanda',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        }
      }
    };

    this.chartMaterias = new Chart(ctx, config);
  }

  crearGraficoProgramas(): void {
    if (!this.data?.analisisPorPrograma) return;

    const ctx = document.getElementById('chartProgramas') as HTMLCanvasElement;
    if (!ctx) return;

    this.destruirGrafico('chartProgramas');

    const data: ChartData<'bar'> = {
      labels: this.data.analisisPorPrograma.map(p => p.nombre),
      datasets: [{
        label: 'Solicitudes',
        data: this.data.analisisPorPrograma.map(p => p.solicitudes),
        backgroundColor: this.colors.primary,
        borderColor: this.colors.primary,
        borderWidth: 1
      }]
    };

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Análisis por Programa',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.chartProgramas = new Chart(ctx, config);
  }

  crearGraficoTendencias(): void {
    if (!this.data?.tendenciasTemporales) return;

    const ctx = document.getElementById('chartTendencias') as HTMLCanvasElement;
    if (!ctx) return;

    this.destruirGrafico('chartTendencias');

    const data: ChartData<'line'> = {
      labels: this.data.tendenciasTemporales.map(t => t.mes),
      datasets: [{
        label: 'Solicitudes por Mes',
        data: this.data.tendenciasTemporales.map(t => t.solicitudes),
        borderColor: this.colors.secondary,
        backgroundColor: this.colors.secondary + '20',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: this.colors.secondary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6
      }]
    };

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Tendencias Temporales',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.chartTendencias = new Chart(ctx, config);
  }

  crearGraficoPrediccionesMaterias(): void {
    if (!this.data?.predicciones?.materiasConTendenciaCreciente) return;

    const ctx = document.getElementById('chartPrediccionesMaterias') as HTMLCanvasElement;
    if (!ctx) return;

    this.destruirGrafico('chartPrediccionesMaterias');

    const materias = this.data.predicciones.materiasConTendenciaCreciente.slice(0, 5); // Top 5

    const data: ChartData<'bar'> = {
      labels: materias.map(m => m.nombre),
      datasets: [
        {
          label: 'Demanda Actual',
          data: materias.map(m => m.demandaActual),
          backgroundColor: this.colors.primary,
          borderColor: this.colors.primary,
          borderWidth: 1
        },
        {
          label: 'Demanda Estimada',
          data: materias.map(m => m.demandaEstimada),
          backgroundColor: this.colors.secondary,
          borderColor: this.colors.secondary,
          borderWidth: 1
        }
      ]
    };

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: 'Predicciones de Demanda por Materia',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.chartPrediccionesMaterias = new Chart(ctx, config);
  }

  crearGraficoPrediccionesProgramas(): void {
    if (!this.data?.predicciones?.programasConTendenciaCreciente) return;

    const ctx = document.getElementById('chartPrediccionesProgramas') as HTMLCanvasElement;
    if (!ctx) return;

    this.destruirGrafico('chartPrediccionesProgramas');

    const programas = this.data.predicciones.programasConTendenciaCreciente.slice(0, 5); // Top 5

    const data: ChartData<'bar'> = {
      labels: programas.map(p => p.nombre),
      datasets: [
        {
          label: 'Demanda Actual',
          data: programas.map(p => p.demandaActual),
          backgroundColor: this.colors.success,
          borderColor: this.colors.success,
          borderWidth: 1
        },
        {
          label: 'Demanda Estimada',
          data: programas.map(p => p.demandaEstimada),
          backgroundColor: this.colors.warning,
          borderColor: this.colors.warning,
          borderWidth: 1
        }
      ]
    };

    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          },
          title: {
            display: true,
            text: 'Predicciones de Demanda por Programa',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.chartPrediccionesProgramas = new Chart(ctx, config);
  }

  crearGraficoPrediccionesTemporales(): void {
    if (!this.data?.predicciones?.prediccionesTemporales) return;

    const ctx = document.getElementById('chartPrediccionesTemporales') as HTMLCanvasElement;
    if (!ctx) return;

    this.destruirGrafico('chartPrediccionesTemporales');

    const temporal = this.data.predicciones.prediccionesTemporales;

    const data: ChartData<'line'> = {
      labels: ['Actual', 'Estimado'],
      datasets: [{
        label: temporal.mesPico,
        data: [temporal.demandaActualMesPico, temporal.demandaEstimadaMesPico],
        borderColor: this.colors.info,
        backgroundColor: this.colors.info + '20',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: this.colors.info,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 8
      }]
    };

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: `Predicción Temporal - ${temporal.mesPico}`,
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.chartPrediccionesTemporales = new Chart(ctx, config);
  }

  // ===== MÉTODOS AUXILIARES =====

  destruirGrafico(chartId: string): void {
    const chartMap: { [key: string]: Chart | null } = {
      'chartMaterias': this.chartMaterias,
      'chartProgramas': this.chartProgramas,
      'chartTendencias': this.chartTendencias,
      'chartPrediccionesMaterias': this.chartPrediccionesMaterias,
      'chartPrediccionesProgramas': this.chartPrediccionesProgramas,
      'chartPrediccionesTemporales': this.chartPrediccionesTemporales
    };

    const chart = chartMap[chartId];
    if (chart) {
      chart.destroy();
      chartMap[chartId] = null;
    }
  }

  destruirGraficos(): void {
    Object.keys({
      'chartMaterias': this.chartMaterias,
      'chartProgramas': this.chartProgramas,
      'chartTendencias': this.chartTendencias,
      'chartPrediccionesMaterias': this.chartPrediccionesMaterias,
      'chartPrediccionesProgramas': this.chartPrediccionesProgramas,
      'chartPrediccionesTemporales': this.chartPrediccionesTemporales
    }).forEach(chartId => this.destruirGrafico(chartId));
  }

  getColorByPriority(prioridad: string): string {
    switch(prioridad) {
      case 'ALTA': return '#dc3545';
      case 'MEDIA': return '#ffc107';
      case 'BAJA': return '#28a745';
      default: return '#6c757d';
    }
  }

  getIconByPriority(prioridad: string): string {
    switch(prioridad) {
      case 'ALTA': return 'priority_high';
      case 'MEDIA': return 'remove';
      case 'BAJA': return 'low_priority';
      default: return 'help';
    }
  }

  getTendenciaIcon(tendencia: string): string {
    switch(tendencia) {
      case 'CRECIENTE': return 'trending_up';
      case 'DECRECIENTE': return 'trending_down';
      case 'ESTABLE': return 'trending_flat';
      default: return 'help';
    }
  }

  getTendenciaColor(tendencia: string): string {
    switch(tendencia) {
      case 'CRECIENTE': return '#28a745';
      case 'DECRECIENTE': return '#dc3545';
      case 'ESTABLE': return '#ffc107';
      default: return '#6c757d';
    }
  }

  mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  // ===== MÉTODOS DE EXPORTACIÓN =====

  exportarPDF(): void {
    // TODO: Implementar exportación a PDF
    this.snackBar.open('Funcionalidad de exportación PDF en desarrollo', 'Cerrar', {
      duration: 3000
    });
  }

  exportarExcel(): void {
    // TODO: Implementar exportación a Excel
    this.snackBar.open('Funcionalidad de exportación Excel en desarrollo', 'Cerrar', {
      duration: 3000
    });
  }
}
