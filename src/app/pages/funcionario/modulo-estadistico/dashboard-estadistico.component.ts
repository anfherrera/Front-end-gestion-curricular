import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Chart, registerables } from 'chart.js';
import type { ChartConfiguration, ChartData } from 'chart.js';
import { Subscription } from 'rxjs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

import { EstadisticasService } from '../../../core/services/estadisticas.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { 
  ResumenCompleto, 
  EstadisticasProceso, 
  FiltroEstadisticas,
  FiltrosDashboard,
  KPIData 
} from '../../../core/models/estadisticas.model';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-estadistico',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './dashboard-estadistico.component.html',
  styleUrls: ['./dashboard-estadistico.component.css']
})
export class DashboardEstadisticoComponent implements OnInit, OnDestroy {
  
  // Estados del componente
  loading = false;
  error = false;
  
  // Datos del dashboard
  resumenCompleto: ResumenCompleto | null = null;
  estadisticasProceso: EstadisticasProceso | null = null;
  
  // Filtros
  filtros: FiltroEstadisticas = {};
  filtrosForm: FormGroup | null = null;
  procesosDisponibles: string[] = [];
  programasDisponibles: any[] = [];
  
  // KPIs
  kpis: KPIData[] = [];
  
  // Charts
  chartProcesos: Chart | null = null;
  chartTendencia: Chart | null = null;
  chartDistribucion: Chart | null = null;
  
  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private estadisticasService: EstadisticasService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    // El formulario se inicializará en ngOnInit para evitar problemas de hidratación
  }

  ngOnInit(): void {
    // Inicializar formulario reactivo
    this.filtrosForm = this.fb.group({
      proceso: [''],
      programa: [''],
      fechaInicio: [''],
      fechaFin: ['']
    });
    
    this.inicializarDatos();
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.destruirCharts();
  }

  /**
   * Inicializa los datos del componente
   */
  private inicializarDatos(): void {
    this.procesosDisponibles = this.estadisticasService.getProcesosDisponibles();
    this.programasDisponibles = this.estadisticasService.getProgramasDisponibles();
  }

  /**
   * Carga los datos del dashboard con filtros opcionales
   */
  cargarDatos(filtros: FiltroEstadisticas = {}): void {
    this.loading = true;
    this.error = false;

    console.log('🔄 Cargando datos desde el API real con filtros:', filtros);
    
    const subscription = this.estadisticasService.getEstadisticasGlobales(filtros)
      .subscribe({
        next: (datosAPI) => {
          console.log('✅ Datos recibidos del API:', datosAPI);
          
          // Convertir datos del API al formato del dashboard
          this.resumenCompleto = this.estadisticasService.convertirDatosAPI(datosAPI);
          
          this.generarKPIs();
          this.crearCharts();
          this.loading = false;
          
          this.mostrarExito('Datos cargados correctamente desde el backend');
        },
        error: (error) => {
          console.error('❌ Error al cargar datos del API:', error);
          
          // Fallback a datos de prueba si hay error
          console.log('🔄 Usando datos de prueba como fallback...');
          this.resumenCompleto = this.generarDatosDePrueba();
          this.generarKPIs();
          this.crearCharts();
          this.loading = false;
          this.error = true;
          
          this.mostrarError('Error al conectar con el backend. Mostrando datos de prueba.');
        }
      });

    this.subscriptions.push(subscription);

    // Comentamos la llamada real al backend por ahora
    /*
    const subscription = this.estadisticasService.getResumenCompleto().subscribe({
      next: (data) => {
        this.resumenCompleto = data;
        this.generarKPIs();
        this.crearCharts();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        this.error = true;
        this.loading = false;
        this.mostrarError('Error al cargar las estadísticas');
      }
    });

    this.subscriptions.push(subscription);
    */
  }

  /**
   * Genera datos de prueba para el dashboard
   */
  private generarDatosDePrueba(): ResumenCompleto {
    return {
      estadisticasGlobales: {
        totalSolicitudes: 1247,
        solicitudesAprobadas: 892,
        solicitudesRechazadas: 156,
        solicitudesEnProceso: 199,
        totalEstudiantes: 3241,
        totalProgramas: 5
      },
      estadisticasPorProceso: [
        {
          nombreProceso: 'reingreso-estudiante',
          totalSolicitudes: 234,
          aprobadas: 187,
          rechazadas: 23,
          enProceso: 24,
          pendientes: 0,
          porcentajeAprobacion: 79.9,
          tendenciaMensual: [],
          distribucionPorPrograma: []
        },
        {
          nombreProceso: 'homologacion-asignaturas',
          totalSolicitudes: 445,
          aprobadas: 312,
          rechazadas: 67,
          enProceso: 66,
          pendientes: 0,
          porcentajeAprobacion: 70.1,
          tendenciaMensual: [],
          distribucionPorPrograma: []
        },
        {
          nombreProceso: 'cursos-intersemestrales',
          totalSolicitudes: 298,
          aprobadas: 234,
          rechazadas: 28,
          enProceso: 36,
          pendientes: 0,
          porcentajeAprobacion: 78.5,
          tendenciaMensual: [],
          distribucionPorPrograma: []
        },
        {
          nombreProceso: 'pruebas-ecaes',
          totalSolicitudes: 156,
          aprobadas: 98,
          rechazadas: 24,
          enProceso: 34,
          pendientes: 0,
          porcentajeAprobacion: 62.8,
          tendenciaMensual: [],
          distribucionPorPrograma: []
        },
        {
          nombreProceso: 'paz-salvo',
          totalSolicitudes: 114,
          aprobadas: 61,
          rechazadas: 14,
          enProceso: 39,
          pendientes: 0,
          porcentajeAprobacion: 53.5,
          tendenciaMensual: [],
          distribucionPorPrograma: []
        }
      ],
      estadisticasPorPrograma: [],
      ultimaActualizacion: new Date().toISOString()
    };
  }

  /**
   * Genera los KPIs del dashboard
   */
  private generarKPIs(): void {
    if (!this.resumenCompleto) return;

    const globales = this.resumenCompleto.estadisticasGlobales;
    
    this.kpis = [
      {
        titulo: 'Total Solicitudes',
        valor: globales.totalSolicitudes,
        icono: 'description',
        color: 'primary',
        descripcion: 'Solicitudes en todos los procesos'
      },
      {
        titulo: 'Aprobadas',
        valor: globales.solicitudesAprobadas,
        icono: 'check_circle',
        color: 'success',
        descripcion: 'Solicitudes aprobadas'
      },
      {
        titulo: 'En Proceso',
        valor: globales.solicitudesEnProceso,
        icono: 'pending',
        color: 'warning',
        descripcion: 'Solicitudes en revisión'
      },
      {
        titulo: 'Rechazadas',
        valor: globales.solicitudesRechazadas,
        icono: 'cancel',
        color: 'error',
        descripcion: 'Solicitudes rechazadas'
      },
      {
        titulo: 'Estudiantes',
        valor: globales.totalEstudiantes,
        icono: 'people',
        color: 'info',
        descripcion: 'Total de estudiantes'
      },
      {
        titulo: 'Programas',
        valor: globales.totalProgramas,
        icono: 'school',
        color: 'secondary',
        descripcion: 'Programas académicos'
      }
    ];
  }

  /**
   * Crea los gráficos del dashboard
   */
  private crearCharts(): void {
    if (!this.resumenCompleto) return;

    setTimeout(() => {
      this.crearChartProcesos();
      this.crearChartTendencia();
      this.crearChartDistribucion();
    }, 100);
  }

  /**
   * Crea el gráfico de distribución por procesos
   */
  private crearChartProcesos(): void {
    const ctx = document.getElementById('chartProcesos') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('⚠️ Canvas chartProcesos no encontrado');
      return;
    }

    this.destruirChart('chartProcesos');

    if (!this.resumenCompleto || !this.resumenCompleto.estadisticasPorProceso.length) {
      console.warn('⚠️ No hay datos de procesos para el gráfico');
      return;
    }

    console.log('📊 Creando gráfico de procesos con datos:', this.resumenCompleto.estadisticasPorProceso);

    const data: ChartData<'doughnut'> = {
      labels: this.resumenCompleto.estadisticasPorProceso.map(p => this.formatearNombreProceso(p.nombreProceso)),
      datasets: [{
        label: 'Solicitudes',
        data: this.resumenCompleto.estadisticasPorProceso.map(p => p.totalSolicitudes),
        backgroundColor: [
          '#8e24aa', // Púrpura - Reingreso
          '#2196f3', // Azul - Cursos Verano
          '#00bcd4', // Cyan - ECAES
          '#4caf50', // Verde - Homologación
          '#ff9800', // Naranja - Paz y Salvo
          '#f44336'  // Rojo - Extra
        ],
        borderWidth: 3,
        borderColor: '#fff',
        hoverBorderWidth: 4
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
              usePointStyle: true,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed;
                const dataArray = context.dataset.data as number[];
                const total = dataArray.reduce((a: number, b: number) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1000
        }
      }
    };

    try {
    this.chartProcesos = new Chart(ctx, config);
      console.log('✅ Gráfico de procesos creado exitosamente');
    } catch (error) {
      console.error('❌ Error al crear gráfico de procesos:', error);
    }
  }

  /**
   * Crea el gráfico de tendencia
   */
  private crearChartTendencia(): void {
    const ctx = document.getElementById('chartTendencia') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('⚠️ Canvas chartTendencia no encontrado');
      return;
    }

    this.destruirChart('chartTendencia');

    // Generar datos de tendencia basados en los datos reales del backend
    const totalSolicitudes = this.resumenCompleto?.estadisticasGlobales.totalSolicitudes || 46;
    const totalAprobadas = this.resumenCompleto?.estadisticasGlobales.solicitudesAprobadas || 21;
    
    // Crear tendencia mensual simulada basada en los datos reales
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const factorVariacion = 0.3; // 30% de variación
    
    const solicitudesMensual = meses.map((_, index) => {
      const base = totalSolicitudes / 6; // Distribución base
      const variacion = (Math.random() - 0.5) * factorVariacion * base;
      return Math.round(base + variacion);
    });
    
    const aprobadasMensual = meses.map((_, index) => {
      const base = totalAprobadas / 6; // Distribución base
      const variacion = (Math.random() - 0.5) * factorVariacion * base;
      return Math.round(base + variacion);
    });

    console.log('📈 Creando gráfico de tendencia con datos:', { solicitudesMensual, aprobadasMensual });

    const data: ChartData<'line'> = {
      labels: meses,
      datasets: [
        {
          label: 'Solicitudes',
          data: solicitudesMensual,
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#2196f3',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
        },
        {
          label: 'Aprobadas',
          data: aprobadasMensual,
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#4caf50',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6
        }
      ]
    };

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#fff',
            borderWidth: 1
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
    };

    try {
    this.chartTendencia = new Chart(ctx, config);
      console.log('✅ Gráfico de tendencia creado exitosamente');
    } catch (error) {
      console.error('❌ Error al crear gráfico de tendencia:', error);
    }
  }

  /**
   * Crea el gráfico de distribución por programa
   */
  private crearChartDistribucion(): void {
    const ctx = document.getElementById('chartDistribucion') as HTMLCanvasElement;
    if (!ctx) {
      console.warn('⚠️ Canvas chartDistribucion no encontrado');
      return;
    }

    this.destruirChart('chartDistribucion');

    if (!this.resumenCompleto || !this.resumenCompleto.estadisticasPorPrograma.length) {
      console.warn('⚠️ No hay datos de programas para el gráfico');
      return;
    }

    console.log('📊 Creando gráfico de distribución por programas con datos:', this.resumenCompleto.estadisticasPorPrograma);

    const data: ChartData<'bar'> = {
      labels: this.resumenCompleto.estadisticasPorPrograma.map(p => p.nombrePrograma),
      datasets: [{
        label: 'Solicitudes',
        data: this.resumenCompleto.estadisticasPorPrograma.map(p => p.totalSolicitudes),
        backgroundColor: [
          '#2196f3', // Azul - Sistemas
          '#ff9800', // Naranja - Electrónica
          '#4caf50', // Verde - Automática
          '#9c27b0'  // Púrpura - Telemática
        ],
        borderColor: [
          '#1976d2',
          '#f57c00', 
          '#388e3c',
          '#7b1fa2'
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
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
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#fff',
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed?.y || 0;
                const dataArray = context.dataset.data as number[];
                const total = dataArray.reduce((a: number, b: number) => a + b, 0);
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${label}: ${value} solicitudes (${percentage}%)`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              precision: 0
            }
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        }
      }
    };

    try {
    this.chartDistribucion = new Chart(ctx, config);
      console.log('✅ Gráfico de distribución por programas creado exitosamente');
    } catch (error) {
      console.error('❌ Error al crear gráfico de distribución:', error);
    }
  }

  /**
   * Aplica filtros y actualiza los datos usando el endpoint actualizado del backend
   */
  aplicarFiltros(): void {
    if (this.filtrosForm && this.filtrosForm.valid) {
      const formValue = this.filtrosForm.value;
      
      // Convertir filtros al formato correcto
      const filtros: FiltroEstadisticas = {};
      if (formValue.proceso) filtros.proceso = formValue.proceso;
      if (formValue.programa) filtros.programa = formValue.programa;
      if (formValue.fechaInicio) filtros.fechaInicio = formValue.fechaInicio?.toISOString().split('T')[0];
      if (formValue.fechaFin) filtros.fechaFin = formValue.fechaFin?.toISOString().split('T')[0];
      
      console.log('🔍 Aplicando filtros:', filtros);
      
      // Usar el método de carga de datos con filtros
      this.cargarDatos(filtros);
    }
  }

  /**
   * Mapea el proceso interno al formato esperado por el backend
   */
  private mapearProcesoAFiltro(proceso: string): string {
    const mapeo: { [key: string]: string } = {
      'reingreso': 'Solicitud de Reingreso',
      'homologacion': 'Solicitud de Homologacion',
      'cursos-intersemestrales': 'Solicitud Curso Verano',
      'pruebas-ecaes': 'Solicitud ECAES',
      'paz-salvo': 'Solicitud Paz y Salvo'
    };
    
    return mapeo[proceso] || proceso;
  }

  /**
   * Limpia todos los filtros
   */
  limpiarFiltros(): void {
    console.log('🧹 Limpiando filtros...');
    if (this.filtrosForm) {
      this.filtrosForm.reset();
    }
    this.cargarDatos(); // Volver a cargar datos globales
    this.mostrarExito('Filtros limpiados correctamente');
  }

  /**
   * Carga estadísticas de un proceso específico
   */
  onProcesoSeleccionado(proceso: string): void {
    if (!proceso) return;

    this.loading = true;
    
    const subscription = this.estadisticasService.getEstadisticasProceso(proceso).subscribe({
      next: (data) => {
        this.estadisticasProceso = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas del proceso:', error);
        this.loading = false;
        this.mostrarError('Error al cargar estadísticas del proceso');
      }
    });

    this.subscriptions.push(subscription);
  }

  /**
   * Formatea el nombre del proceso para mostrar
   */
  formatearNombreProceso(proceso: string): string {
    const nombres: { [key: string]: string } = {
      'reingreso-estudiante': 'Reingreso',
      'homologacion-asignaturas': 'Homologación',
      'cursos-intersemestrales': 'Cursos Intersemestrales',
      'pruebas-ecaes': 'Pruebas ECAES',
      'paz-salvo': 'Paz y Salvo'
    };
    
    return nombres[proceso] || proceso;
  }

  /**
   * Destruye un gráfico específico
   */
  private destruirChart(chartId: string): void {
    const chartMap: { [key: string]: Chart | null } = {
      'chartProcesos': this.chartProcesos,
      'chartTendencia': this.chartTendencia,
      'chartDistribucion': this.chartDistribucion
    };

    if (chartMap[chartId]) {
      chartMap[chartId]!.destroy();
      chartMap[chartId] = null;
    }
  }

  /**
   * Destruye todos los gráficos
   */
  private destruirCharts(): void {
    if (this.chartProcesos) {
      this.chartProcesos.destroy();
      this.chartProcesos = null;
    }
    if (this.chartTendencia) {
      this.chartTendencia.destroy();
      this.chartTendencia = null;
    }
    if (this.chartDistribucion) {
      this.chartDistribucion.destroy();
      this.chartDistribucion = null;
    }
  }

  /**
   * Muestra un mensaje de éxito
   */
  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Muestra un mensaje de error
   */
  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  /**
   * ===== FUNCIONALIDADES DE EXPORTACIÓN =====
   */

  /**
   * Actualiza los datos del dashboard llamando nuevamente al servicio
   */
  actualizarDatos(): void {
    console.log('🔄 Actualizando datos del dashboard...');
    this.cargarDatos();
  }

  /**
   * Exporta el reporte de estadísticas como archivo de texto (ACTUALIZADO)
   */
  async exportarPDF(): Promise<void> {
    console.log('📄 Iniciando exportación de reporte de texto desde el backend...');
    
    // Obtener filtros actuales
    const filtros: FiltroEstadisticas = {};
    if (this.filtrosForm) {
      const formValue = this.filtrosForm.value;
      if (formValue.proceso) filtros.proceso = formValue.proceso;
      if (formValue.programa) filtros.programa = formValue.programa;
      if (formValue.fechaInicio) filtros.fechaInicio = formValue.fechaInicio?.toISOString().split('T')[0];
      if (formValue.fechaFin) filtros.fechaFin = formValue.fechaFin?.toISOString().split('T')[0];
    }

    console.log('🔍 Filtros aplicados:', filtros);
    this.loading = true;
    this.mostrarExito('Descargando reporte de estadísticas...');

    try {
      // Usar método con fetch para mejor control de errores
      await this.estadisticasService.exportarPDFConFetch(filtros);
      this.loading = false;
      this.mostrarExito('Reporte de estadísticas descargado exitosamente');
    } catch (error) {
      console.error('❌ Error al exportar reporte:', error);
      this.loading = false;
      this.mostrarError('Error al descargar el reporte. Intenta con el método directo.');
      
      // Fallback al método directo
      this.estadisticasService.exportarPDFDirecto(filtros);
    }
  }

  /**
   * Exporta los datos del dashboard a Excel usando el endpoint del backend (ACTUALIZADO)
   */
  async exportarExcel(): Promise<void> {
    console.log('📊 Iniciando exportación a Excel desde el backend...');
    
    // Obtener filtros actuales
    const filtros: FiltroEstadisticas = {};
    if (this.filtrosForm) {
      const formValue = this.filtrosForm.value;
      if (formValue.proceso) filtros.proceso = formValue.proceso;
      if (formValue.programa) filtros.programa = formValue.programa;
      if (formValue.fechaInicio) filtros.fechaInicio = formValue.fechaInicio?.toISOString().split('T')[0];
      if (formValue.fechaFin) filtros.fechaFin = formValue.fechaFin?.toISOString().split('T')[0];
    }

    console.log('🔍 Filtros aplicados:', filtros);
    this.loading = true;
    this.mostrarExito('Descargando Excel desde el backend...');

    try {
      // Usar método con fetch para mejor control de errores
      await this.estadisticasService.exportarExcelConFetch(filtros);
      this.loading = false;
      this.mostrarExito('Excel descargado exitosamente');
    } catch (error) {
      console.error('❌ Error al exportar Excel:', error);
      this.loading = false;
      this.mostrarError('Error al descargar el Excel. Intenta con el método directo.');
      
      // Fallback al método directo
      this.estadisticasService.exportarExcelDirecto(filtros);
    }
  }
}
