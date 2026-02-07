import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart, ChartConfiguration, ChartData, ChartOptions, registerables } from 'chart.js';

import { EstadisticasService } from '../../../../core/services/estadisticas.service';
import { snackbarConfig } from '../../../../core/design-system/design-tokens';
import { environment } from '../../../../../environments/environment';
import { PeriodoFiltroSelectorComponent } from '../../../../shared/components/periodo-filtro-selector/periodo-filtro-selector.component';
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
    FormsModule,
    ReactiveFormsModule,
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
    MatSnackBarModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    PeriodoFiltroSelectorComponent
  ],
  templateUrl: './cursos-verano-dashboard.component.html',
  styleUrls: ['./cursos-verano-dashboard.component.css']
})
export class CursosVeranoDashboardComponent implements OnInit, OnDestroy {
  // ===== PROPIEDADES DE DATOS =====
  data: CursosVeranoResponse | null = null;
  loading = true;
  error: string | null = null;
  ultimaActualizacion: Date = new Date();
  private intervalId: any;

  // ===== FILTROS =====
  filtrosForm: FormGroup | null = null;
  programasDisponibles: any[] = [];
  filtrosAplicados: { periodoAcademico?: string; idPrograma?: number } = {};

  // Propiedades para mapear datos del backend a las gráficas
  tendenciasTemporalesData: any[] = [];
  topMateriasData: any[] = [];
  analisisProgramaData: any[] = [];
  prediccionesData: any = {};

  // Control de navegación entre pestañas
  activeTab: string = 'analisis-actual';
  
  // Propiedades para Predicciones y Recomendaciones
  recomendaciones: any[] = [];
  alertasCriticas: any[] = [];
  estadisticasRecomendaciones: any = {};
  expandidas = new Set<string>();
  totalRecomendaciones: number = 0;

  // ===== PROPIEDADES DE GRÁFICOS =====
  chartMaterias: Chart | null = null;
  chartProgramas: Chart | null = null;
  chartTendencias: Chart | null = null;
  chartPrediccionesMaterias: Chart | null = null;
  chartPrediccionesProgramas: Chart | null = null;
  chartPrediccionesTemporales: Chart | null = null;

  // ===== SUBSCRIPCIONES =====
  private destroy$ = new Subject<void>();

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
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Inicializar formulario de filtros
    this.filtrosForm = this.fb.group({
      periodoAcademico: [''],
      idPrograma: ['']
    });
    
    // Cargar programas disponibles
    this.programasDisponibles = this.estadisticasService.getProgramasDisponibles();
    
    // Cargar primero las tendencias temporales de forma optimizada para una carga más rápida
    this.cargarTendenciasTemporalesOptimizadas();
    
    // Luego cargar todos los datos completos en segundo plano
    setTimeout(() => {
      this.cargarDatos();
    }, 100);
    
    // Actualizar cada 30 segundos (con filtros aplicados)
    this.intervalId = setInterval(() => {
      this.filtrosAplicados = this.obtenerFiltrosActuales();
      this.cargarDatos();
    }, 30000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destruirGraficos();
    
    // Limpiar el intervalo de actualización automática
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // ===== MÉTODOS DE CARGA DE DATOS =====

  /**
   * Obtiene los filtros actuales del formulario
   */
  obtenerFiltrosActuales(): { periodoAcademico?: string; idPrograma?: number } {
    if (!this.filtrosForm) {
      return {};
    }
    
    const formValue = this.filtrosForm.value;
    const filtros: { periodoAcademico?: string; idPrograma?: number } = {};
    
    if (formValue.periodoAcademico) {
      filtros.periodoAcademico = formValue.periodoAcademico;
    }
    
    if (formValue.idPrograma) {
      filtros.idPrograma = formValue.idPrograma;
    }
    
    return filtros;
  }

  /**
   * Aplica los filtros y recarga los datos
   */
  aplicarFiltros(): void {
    this.filtrosAplicados = this.obtenerFiltrosActuales();
    this.cargarTendenciasTemporalesOptimizadas();
    this.cargarDatos();
  }

  /**
   * Limpia los filtros y recarga los datos
   */
  limpiarFiltros(): void {
    if (this.filtrosForm) {
      this.filtrosForm.patchValue({
        periodoAcademico: '',
        idPrograma: ''
      });
    }
    this.filtrosAplicados = {};
    this.cargarTendenciasTemporalesOptimizadas();
    this.cargarDatos();
  }

  /**
   * Carga solo las tendencias temporales de forma optimizada (MÁS RÁPIDO)
   */
  cargarTendenciasTemporalesOptimizadas(): void {
    const filtros = this.obtenerFiltrosActuales();
    this.estadisticasService.getCursosVeranoTendenciasTemporales(filtros).subscribe({
      next: (response) => {
        // Asignar solo los datos de tendencias temporales
        this.tendenciasTemporalesData = response.tendenciasTemporales || [];
        
        // Actualizar la gráfica inmediatamente
        if (this.tendenciasTemporalesData.length > 0) {
          this.crearGraficaTendencias();
        }
      },
      error: (error: any) => {
        // Fallback: cargar datos completos
        this.cargarDatos();
      }
    });
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = null;
    const filtros = this.obtenerFiltrosActuales();
    this.estadisticasService.getCursosVeranoEstadisticas(filtros).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        // Verificar que los datos se asignen correctamente
        if (response.predicciones?.demandaEstimadaProximoPeriodo) {
        }
        
        // Verificar mapeo completo
        // Asignar datos reales del backend
        this.data = response;
        this.tendenciasTemporalesData = response.tendenciasTemporales || [];
        this.topMateriasData = response.topMaterias || [];
        this.analisisProgramaData = response.analisisPorPrograma || [];
        this.prediccionesData = response.predicciones || {};
        
        this.recomendaciones = response.recomendaciones || [];
        if (response.predicciones) {
          this.alertasCriticas = response.predicciones.alertasCriticas || [];
          this.estadisticasRecomendaciones = response.predicciones.estadisticasRecomendaciones || {};
          this.totalRecomendaciones = this.estadisticasRecomendaciones.totalRecomendaciones || this.recomendaciones.length;
        }
        
        // Ordenar recomendaciones por prioridad
        this.ordenarPorPrioridad();
        this.ultimaActualizacion = new Date(); // Actualizar timestamp
        this.loading = false;
        
        // Cargar gráficas después de un pequeño delay
        setTimeout(() => {
          this.cargarGraficasAsync();
        }, 200);
      },
      error: (error: any) => {
        this.error = 'Error al cargar datos del backend. Verifique que el servidor esté ejecutándose.';
        this.loading = false;
      }
    });
  }

  public cargarDatosDePrueba(): void {
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
        APROBADA: 4,
        ENVIADA: 2,
        EN_PROCESO: 2,
        RECHAZADA: 1
      },
      recomendaciones: [
        {
          tipo: 'PROGRAMA_DEMANDA',
          titulo: 'Enfocar oferta en Ingeniería de Sistemas',
          descripcion: 'Este programa representa 44.44% de las solicitudes',
          prioridad: 'ALTA',
          acciones: [
            'Priorizar cursos que beneficien a este programa',
            'Aumentar oferta de cupos para este programa',
            'Evaluar demanda específica por materia'
          ]
        },
        {
          tipo: 'BAJA_APROBACION',
          titulo: 'Mejorar criterios de selección',
          descripcion: 'Tasa de aprobación del 44.44%',
          prioridad: 'MEDIA',
          acciones: [
            'Revisar criterios de selección para cursos de verano',
            'Analizar causas de rechazo',
            'Mejorar comunicación de requisitos'
          ]
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
            variacion: 2,
            porcentajeVariacion: 50
          }
        ],
        todasLasPrediccionesPorPrograma: [
          {
            nombre: 'Ingeniería de Sistemas',
            demandaActual: 4,
            demandaEstimada: 6,
            tendencia: 'CRECIENTE',
            variacion: 2,
            porcentajeVariacion: 50
          },
          {
            nombre: 'Ingeniería Electrónica',
            demandaActual: 3,
            demandaEstimada: 4,
            tendencia: 'CRECIENTE',
            variacion: 1,
            porcentajeVariacion: 33.33
          },
          {
            nombre: 'Ingeniería Automática',
            demandaActual: 2,
            demandaEstimada: 2,
            tendencia: 'ESTABLE',
            variacion: 0,
            porcentajeVariacion: 0
          },
          {
            nombre: 'Tecnología Telemática',
            demandaActual: 2,
            demandaEstimada: 1,
            tendencia: 'DECRECIENTE',
            variacion: -1,
            porcentajeVariacion: -50
          }
        ],
        programasConTendenciaDecreciente: [],
        prediccionesTemporales: {
          mesPico: 'Marzo',
          demandaActualMesPico: 4,
          demandaEstimadaMesPico: 6,
          mesesRecomendados: ['Marzo', 'Abril', 'Mayo']
        },
        confiabilidad: 'ALTA',
        fechaPrediccion: new Date().toISOString()
      }
    };

    // Crear gráficos con datos de prueba
    setTimeout(() => {
      this.crearGraficos();
    }, 100);
  }

  actualizarDatos(): void {
    // Aplicar filtros actuales al recargar
    this.filtrosAplicados = this.obtenerFiltrosActuales();
    this.cargarTendenciasTemporalesOptimizadas();
    this.cargarDatos();
  }

  refrescarDatos(): void {
    // Aplicar filtros actuales al refrescar
    this.filtrosAplicados = this.obtenerFiltrosActuales();
    this.cargarTendenciasTemporalesOptimizadas();
    this.cargarDatos();
  }

  // Método para cambiar de pestaña
  cambiarTab(tab: string): void {
    this.activeTab = tab;
    // Solo cargar gráficas si NO es recomendaciones
    if (tab !== 'recomendaciones') {
      setTimeout(() => {
        this.cargarGraficasAsync();
      }, 100);
    } else {
    }
  }

  /**
   * Navega a una pestaña específica desde botones de acción
   */
  irAPestana(pestana: string): void {
    this.cambiarTab(pestana);
    // Scroll suave al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  verificarConexionBackend(): void {
    // Hacer una llamada directa para verificar la conexión
    fetch(`${environment.apiUrl}/estadisticas/cursos-verano`)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      })
      .then(data => {
      })
      .catch(error => {
      });
  }

  /**
   * Prueba la diferencia de velocidad entre carga completa y optimizada
   */
  probarVelocidadCarga(): void {
    // Prueba 1: Carga completa
    const inicioCompleta = performance.now();
    
    this.estadisticasService.getCursosVeranoEstadisticas().subscribe({
      next: (response) => {
        const finCompleta = performance.now();
        const tiempoCompleta = finCompleta - inicioCompleta;
        
        // Prueba 2: Carga optimizada
        const inicioOptimizada = performance.now();
        
        const filtros = this.obtenerFiltrosActuales();
        this.estadisticasService.getCursosVeranoTendenciasTemporales(filtros).subscribe({
          next: (responseOpt) => {
            const finOptimizada = performance.now();
            const tiempoOptimizada = finOptimizada - inicioOptimizada;
            
            // Comparación
            const mejora = ((tiempoCompleta - tiempoOptimizada) / tiempoCompleta) * 100;
            
            this.snackBar.open(
              `Carga optimizada ${mejora.toFixed(1)}% más rápida (${tiempoOptimizada.toFixed(0)}ms vs ${tiempoCompleta.toFixed(0)}ms)`, 
              'Cerrar', 
              snackbarConfig(['success-snackbar'])
            );
          },
          error: (error: any) => {
          }
        });
      },
      error: (error: any) => {
      }
    });
  }

  // ===== MÉTODOS PARA ACTUALIZAR GRÁFICAS CON DATOS REALES =====

  // Método para cargar gráficas de forma asíncrona
  cargarGraficasAsync(): void {
    // Cargar gráficas después de que los datos estén listos
    setTimeout(() => {
      this.inicializarGraficas();
    }, 100); // Pequeño delay para asegurar que el DOM esté listo
  }

  inicializarGraficas(): void {
    // Solo crear gráficos si NO estamos en recomendaciones
    if (this.activeTab !== 'recomendaciones') {
      // Inicializar gráfica de tendencias temporales
      if (this.tendenciasTemporalesData && this.tendenciasTemporalesData.length > 0) {
        this.crearGraficaTendencias();
      }
      
      // Inicializar gráfica de top materias
      if (this.topMateriasData && this.topMateriasData.length > 0) {
        this.crearGraficaTopMaterias();
      }
      
      // Inicializar gráfica de análisis por programa
      if (this.analisisProgramaData && this.analisisProgramaData.length > 0) {
        this.crearGraficaAnalisisPrograma();
      }
    } else {
    }
  }

  actualizarGraficas(): void {
    // Actualizar gráfica de tendencias temporales
    if (this.tendenciasTemporalesData && this.tendenciasTemporalesData.length > 0) {
      this.actualizarGraficaTendencias();
    }
    
    // Actualizar gráfica de top materias
    if (this.topMateriasData && this.topMateriasData.length > 0) {
      this.actualizarGraficaTopMaterias();
    }
    
    // Actualizar gráfica de análisis por programa
    if (this.analisisProgramaData && this.analisisProgramaData.length > 0) {
      this.actualizarGraficaAnalisisPrograma();
    }
    
    // Crear gráficos adicionales
    this.crearGraficos();
  }

  actualizarGraficaTendencias(): void {
    // Mapear datos del backend a la estructura de la gráfica
    const labels = this.tendenciasTemporalesData.map(t => t.mes);
    const data = this.tendenciasTemporalesData.map(t => t.solicitudes);
    // Si existe la gráfica, actualizarla
    if (this.chartTendencias) {
      this.chartTendencias.data.labels = labels;
      this.chartTendencias.data.datasets[0].data = data;
      this.chartTendencias.update();
    }
  }

  actualizarGraficaTopMaterias(): void {
    const labels = this.topMateriasData.map(m => m.nombre);
    const data = this.topMateriasData.map(m => m.solicitudes);
    // Si existe la gráfica, actualizarla
    if (this.chartMaterias) {
      this.chartMaterias.data.labels = labels;
      this.chartMaterias.data.datasets[0].data = data;
      this.chartMaterias.update();
    }
  }

  actualizarGraficaAnalisisPrograma(): void {
    const labels = this.analisisProgramaData.map(p => p.nombre);
    const data = this.analisisProgramaData.map(p => p.solicitudes);
    // Si existe la gráfica, actualizarla
    if (this.chartProgramas) {
      this.chartProgramas.data.labels = labels;
      this.chartProgramas.data.datasets[0].data = data;
      this.chartProgramas.update();
    }
  }

  // ===== MÉTODOS PARA CREAR GRÁFICAS =====

  crearGraficaTendencias(): void {
    const ctx = document.getElementById('tendenciasChart') as HTMLCanvasElement;
    if (!ctx) {
      return;
    }
    
    // Destruir gráfica anterior si existe
    if (this.chartTendencias) {
      this.chartTendencias.destroy();
    }
    
    // NO filtrar meses con solicitudes 0 - mostrar todos los meses del array tendenciasTemporales
    // Crear nueva gráfica
    this.chartTendencias = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.tendenciasTemporalesData.map(t => t.mes),
        datasets: [{
          label: 'Solicitudes',
          data: this.tendenciasTemporalesData.map(t => t.solicitudes),
          borderColor: '#36A2EB',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: true,
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000 // Animación más rápida
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  crearGraficaTopMaterias(): void {
    const ctx = document.getElementById('materiasChart') as HTMLCanvasElement;
    if (!ctx) {
      return;
    }
    
    // Destruir gráfica anterior si existe
    if (this.chartMaterias) {
      this.chartMaterias.destroy();
    }
    
    // Crear nueva gráfica
    this.chartMaterias = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.topMateriasData.map(m => m.nombre),
        datasets: [{
          data: this.topMateriasData.map(m => m.solicitudes),
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000
        }
      }
    });
  }

  crearGraficaAnalisisPrograma(): void {
    const ctx = document.getElementById('programasChart') as HTMLCanvasElement;
    if (!ctx) {
      return;
    }
    
    // Destruir gráfica anterior si existe
    if (this.chartProgramas) {
      this.chartProgramas.destroy();
    }
    
    // Crear nueva gráfica
    this.chartProgramas = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.analisisProgramaData.map(p => p.nombre),
        datasets: [{
          label: 'Solicitudes por Programa',
          data: this.analisisProgramaData.map(p => p.solicitudes),
          backgroundColor: '#FF6384'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // ===== MÉTODOS DE GRÁFICOS =====

  crearGraficos(): void {
    if (!this.data) {
      return;
    }
    try {
      this.crearGraficoMaterias();
      this.crearGraficoProgramas();
      this.crearGraficoTendencias();
      this.crearGraficoPrediccionesMaterias();
      this.crearGraficoPrediccionesProgramas();
      this.crearGraficoPrediccionesTemporales();
    } catch (error) {
    }
  }

  crearGraficoMaterias(): void {
    if (!this.data?.topMaterias || this.data.topMaterias.length === 0) {
      return;
    }

    const ctx = document.getElementById('chartMaterias') as HTMLCanvasElement;
    if (!ctx) {
      return;
    }
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
    if (!this.data?.predicciones?.todasLasPrediccionesPorPrograma) return;

    const ctx = document.getElementById('chartPrediccionesProgramas') as HTMLCanvasElement;
    if (!ctx) return;

    this.destruirGrafico('chartPrediccionesProgramas');

    const programas = this.data.predicciones.todasLasPrediccionesPorPrograma.slice(0, 5); // Top 5

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
    this.snackBar.open(mensaje, 'Cerrar', snackbarConfig(['error-snackbar']));
  }

  // ===== MÉTODOS PARA PREDICCIONES Y RECOMENDACIONES =====

  /**
   * Ordena las recomendaciones por prioridad
   */
  ordenarPorPrioridad(): void {
    const orden: any = { 'CRITICA': 0, 'ALTA': 1, 'MEDIA': 2, 'BAJA': 3 };
    this.recomendaciones.sort((a, b) => {
      const prioridadA = orden[a.prioridad] !== undefined ? orden[a.prioridad] : 999;
      const prioridadB = orden[b.prioridad] !== undefined ? orden[b.prioridad] : 999;
      return prioridadA - prioridadB;
    });
  }

  /**
   * Alterna el estado expandido de una recomendación
   */
  toggleExpandir(id: string): void {
    if (this.expandidas.has(id)) {
      this.expandidas.delete(id);
    } else {
      this.expandidas.add(id);
    }
  }

  /**
   * Verifica si una recomendación está expandida
   */
  estaExpandida(id: string): boolean {
    return this.expandidas.has(id);
  }

  /**
   * Obtiene el color según la prioridad
   */
  getColorPrioridad(prioridad: string): string {
    const colores: any = {
      'CRITICA': '#DC2626',
      'ALTA': '#EF4444',
      'MEDIA': '#F59E0B',
      'BAJA': '#10B981'
    };
    return colores[prioridad] || '#6B7280';
  }

  /**
   * Obtiene el icono según la prioridad
   */
  getIconoPrioridad(prioridad: string): string {
    const iconos: any = {
      'CRITICA': '🔴',
      'ALTA': '🔴',
      'MEDIA': '🟡',
      'BAJA': '🟢'
    };
    return iconos[prioridad] || '⚪';
  }

  /**
   * TrackBy function para programas
   */
  trackByProgramaId(index: number, programa: any): any {
    return programa?.id || index;
  }

  /**
   * Maneja el cambio de período académico desde el selector
   */
  onPeriodoChange(periodo: string): void {
    if (this.filtrosForm) {
      this.filtrosForm.patchValue({ periodoAcademico: periodo });
    }
  }

  // ===== MÉTODOS DE EXPORTACIÓN =====

  /**
   * Genera un nombre de archivo dinámico basado en los filtros aplicados
   * Formato: estadisticas_cursos_verano_{periodo}_{programa}.{extension}
   */
  generarNombreArchivo(extension: 'pdf' | 'xlsx', filtros: { periodoAcademico?: string; idPrograma?: number }): string {
    let nombre = 'estadisticas_cursos_verano';
    
    if (filtros.periodoAcademico) {
      // Reemplazar guiones por guiones bajos para el nombre de archivo
      const periodo = filtros.periodoAcademico.replace(/-/g, '_');
      nombre += `_${periodo}`;
    }
    
    if (filtros.idPrograma !== undefined && filtros.idPrograma !== null) {
      nombre += `_programa_${filtros.idPrograma}`;
    }
    
    return `${nombre}.${extension}`;
  }

  exportarPDF(): void {
    const filtros = this.obtenerFiltrosActuales();
    this.estadisticasService.exportarReporteCursosVerano(filtros).subscribe({
      next: (blob: Blob) => {
        // Verificar que sea un blob válido
        if (blob && blob.size > 0) {
          // Crear URL del blob
          const url = window.URL.createObjectURL(blob);
          
          // Crear enlace de descarga con nombre dinámico
          const link = document.createElement('a');
          link.href = url;
          link.download = this.generarNombreArchivo('pdf', filtros);
          
          // Simular clic para descargar
          document.body.appendChild(link);
          link.click();
          
          // Limpiar
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          this.snackBar.open('Reporte PDF descargado exitosamente', 'Cerrar', snackbarConfig(['success-snackbar']));
        } else {
          this.snackBar.open('El archivo PDF está vacío o corrupto', 'Cerrar', snackbarConfig(['error-snackbar']));
        }
      },
      error: (error: any) => {
        
        this.snackBar.open('Error al exportar el reporte PDF', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  /**
   * Calcula el porcentaje de un estado respecto al total de solicitudes
   */
  calcularPorcentajeEstado(cantidad: number, total: number): number {
    if (total === 0) return 0;
    // Redondear a 2 decimales
    return Math.round((cantidad / total) * 100 * 100) / 100;
  }

  exportarExcel(): void {
    const filtros = this.obtenerFiltrosActuales();
    this.estadisticasService.exportarExcelCursosVerano(filtros).subscribe({
      next: (blob: Blob) => {
        // Verificar que sea un blob válido
        if (blob && blob.size > 0) {
          // Crear URL del blob
          const url = window.URL.createObjectURL(blob);
          
          // Crear enlace de descarga con nombre dinámico
          const link = document.createElement('a');
          link.href = url;
          link.download = this.generarNombreArchivo('xlsx', filtros);
          
          // Simular clic para descargar
          document.body.appendChild(link);
          link.click();
          
          // Limpiar
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          this.snackBar.open('Reporte Excel descargado exitosamente', 'Cerrar', snackbarConfig(['success-snackbar']));
        } else {
          this.snackBar.open('El archivo Excel está vacío o corrupto', 'Cerrar', snackbarConfig(['error-snackbar']));
        }
      },
      error: (error: any) => {
        
        this.snackBar.open('Error al exportar el reporte Excel', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }
}
