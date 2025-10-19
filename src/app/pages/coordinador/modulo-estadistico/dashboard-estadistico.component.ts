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
import { ApiEndpoints } from '../../../core/utils/api-endpoints';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EstudiantesPorProgramaComponent } from '../../../shared/components/estudiantes-por-programa/estudiantes-por-programa.component';
import { EstadisticasPorProcesoComponent } from '../../../shared/components/estadisticas-por-proceso/estadisticas-por-proceso.component';
import { EstadisticasPorEstadoComponent } from '../../../shared/components/estadisticas-por-estado/estadisticas-por-estado.component';
import { TendenciasComparativasComponent } from '../../../shared/components/tendencias-comparativas/tendencias-comparativas.component';
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
    LoadingSpinnerComponent,
    EstudiantesPorProgramaComponent,
    EstadisticasPorProcesoComponent,
    EstadisticasPorEstadoComponent,
    TendenciasComparativasComponent
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
  totalEstudiantes: number = 0;
  loadingEstudiantes = false;
  
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

    // Cargar total de estudiantes desde el endpoint específico
    this.cargarTotalEstudiantes();
    
    // Cargar datos de estado de solicitudes para KPIs correctos
    this.cargarDatosEstadoSolicitudes();

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
   * Carga el total de estudiantes desde el endpoint específico
   */
  private cargarTotalEstudiantes(): void {
    this.loadingEstudiantes = true;
    
    const subscription = this.estadisticasService.getTotalEstudiantes()
      .subscribe({
        next: (response) => {
          console.log('✅ Total de estudiantes obtenido:', response);
          this.totalEstudiantes = response.totalEstudiantes;
          this.loadingEstudiantes = false;
          
          // Actualizar KPIs si ya están generados
          if (this.kpis.length > 0) {
            this.actualizarKPIEstudiantes();
          }
        },
        error: (error) => {
          console.error('❌ Error al obtener total de estudiantes:', error);
          this.loadingEstudiantes = false;
          
          // Usar valor por defecto en caso de error
          this.totalEstudiantes = 0;
          this.mostrarError('Error al cargar el total de estudiantes');
        }
      });

    this.subscriptions.push(subscription);
  }

  /**
   * Carga los datos de estado de solicitudes para actualizar los KPIs correctos
   */
  private cargarDatosEstadoSolicitudes(): void {
    console.log('🚀 INICIANDO cargarDatosEstadoSolicitudes...');
    console.log('📊 Cargando datos de estado de solicitudes para KPIs...');
    
    const subscription = this.estadisticasService.getEstadoSolicitudesMejorado()
      .subscribe({
        next: (response) => {
          console.log('✅ DATOS DE ESTADO DE SOLICITUDES OBTENIDOS:', response);
          
          // Actualizar KPIs con datos correctos según las instrucciones
          this.actualizarKPIsConEstadoSolicitudes(response);
        },
        error: (error) => {
          console.error('❌ ERROR al obtener estado de solicitudes:', error);
          // No mostrar error al usuario, solo log
        }
      });

    this.subscriptions.push(subscription);
    console.log('✅ Suscripción agregada para estado de solicitudes');
  }

  /**
   * Actualiza los KPIs con los datos correctos del endpoint de estado de solicitudes
   */
  private actualizarKPIsConEstadoSolicitudes(data: any): void {
    if (!data || !data.estados) {
      console.warn('⚠️ No hay datos de estados disponibles:', data);
      return;
    }

    console.log('🔍 DATOS COMPLETOS DEL BACKEND:', data);
    console.log('🔍 ESTADOS DISPONIBLES:', data.estados);

    // 🔧 Verificar cada estado individualmente
    const estados = data.estados;
    console.log('🔍 APROBADA:', estados.Aprobada);
    console.log('🔍 ENVIADA:', estados.Enviada);
    console.log('🔍 EN PROCESO:', estados["En Proceso"]);
    console.log('🔍 RECHAZADA:', estados.Rechazada);

    // 🔧 VERIFICACIÓN DETALLADA DEL ESTADO "ENVIADA"
    console.log('🔍 VERIFICACIÓN DETALLADA ENVIADA:');
    console.log('  - estados.Enviada existe?', !!estados.Enviada);
    console.log('  - estados.Enviada:', estados.Enviada);
    console.log('  - estados.Enviada.cantidad:', estados.Enviada?.cantidad);
    console.log('  - tipo de cantidad:', typeof estados.Enviada?.cantidad);

    // 🔧 Usar datos correctos según las instrucciones del usuario
    const kpis = {
      totalSolicitudes: data.totalSolicitudes || 0,
      aprobadas: estados.Aprobada?.cantidad || 0,
      enviadas: estados.Enviada?.cantidad || 0,
      enProceso: estados["En Proceso"]?.cantidad || 0,
      rechazadas: estados.Rechazada?.cantidad || 0
    };

    console.log('🔧 KPIs CALCULADOS:', kpis);
    console.log('🔧 VALORES INDIVIDUALES:', {
      'Total Solicitudes': kpis.totalSolicitudes,
      'Aprobadas': kpis.aprobadas,
      'Enviadas': kpis.enviadas,
      'En Proceso': kpis.enProceso,
      'Rechazadas': kpis.rechazadas
    });

    // Actualizar cada KPI
    this.actualizarKPI('Total Solicitudes', kpis.totalSolicitudes);
    this.actualizarKPI('Aprobadas', kpis.aprobadas);
    this.actualizarKPI('Enviadas', kpis.enviadas);
    this.actualizarKPI('En Proceso', kpis.enProceso);
    this.actualizarKPI('Rechazadas', kpis.rechazadas);

    console.log('✅ KPIs actualizados en el dashboard');
  }

  /**
   * Actualiza un KPI específico por título
   */
  private actualizarKPI(titulo: string, valor: number): void {
    const kpi = this.kpis.find(k => k.titulo === titulo);
    if (kpi) {
      kpi.valor = valor;
      console.log(`🔧 KPI "${titulo}" actualizado a: ${valor}`);
    } else {
      console.warn(`⚠️ KPI "${titulo}" no encontrado`);
    }
  }

  /**
   * 🔧 Método temporal para verificar la conexión del endpoint
   */
  verificarEndpoint(): void {
    console.log('🔍 Verificando conexión del endpoint...');
    console.log('📍 URL del endpoint:', 'http://localhost:5000/api/estadisticas/estado-solicitudes');
    console.log('🔍 BASE_URL configurado:', 'http://localhost:5000/api');
    
    // Hacer una llamada directa para verificar
    fetch('http://localhost:5000/api/estadisticas/estado-solicitudes')
      .then(response => {
        console.log('✅ Respuesta del servidor:', response.status, response.statusText);
        return response.json();
      })
      .then(data => {
        console.log('✅ Datos recibidos directamente:', data);
        
        // Verificar estructura de datos
        if (data.estados) {
          console.log('✅ Estructura de estados encontrada');
          console.log('🔍 Estados disponibles:', Object.keys(data.estados));
          
          // Verificar cada estado
          Object.entries(data.estados).forEach(([nombre, info]: [string, any]) => {
            console.log(`🔍 ${nombre}:`, {
              cantidad: info.cantidad,
              porcentaje: info.porcentaje,
              descripcion: info.descripcion
            });
          });

          // 🔧 FORZAR ACTUALIZACIÓN DE KPIs CON DATOS CORRECTOS
          console.log('🔧 FORZANDO actualización de KPIs...');
          this.actualizarKPIsConEstadoSolicitudes(data);
        } else {
          console.warn('⚠️ No se encontró la estructura de estados');
        }
      })
      .catch(error => {
        console.error('❌ Error al verificar endpoint:', error);
        console.log('💡 Posibles soluciones:');
        console.log('   1. Verificar que el backend esté ejecutándose en puerto 5000');
        console.log('   2. Verificar la URL del endpoint');
             console.log('   3. Limpiar caché del navegador (Ctrl + F5)');
           });
   }

   /**
    * 🔧 Método temporal para forzar la actualización de KPIs
    */
   forzarActualizacionKPIs(): void {
     console.log('🔧 FORZANDO actualización de KPIs...');
     
     // Simular datos del backend con la estructura correcta
     const datosSimulados = {
       totalSolicitudes: 46,
       estados: {
         Aprobada: { cantidad: 21, porcentaje: 45.65, color: "#28a745", icono: "fas fa-check-circle" },
         Enviada: { cantidad: 9, porcentaje: 19.57, color: "#ffc107", icono: "fas fa-paper-plane" },
         "En Proceso": { cantidad: 11, porcentaje: 23.91, color: "#17a2b8", icono: "fas fa-clock" },
         Rechazada: { cantidad: 5, porcentaje: 10.87, color: "#dc3545", icono: "fas fa-times-circle" }
       }
     };
     
     console.log('🔧 Datos simulados con estructura correcta:', datosSimulados);
     this.actualizarKPIsConEstadoSolicitudes(datosSimulados);
   }

  /**
   * Actualiza el KPI de estudiantes con el valor real del endpoint
   */
  private actualizarKPIEstudiantes(): void {
    const kpiEstudiantes = this.kpis.find(kpi => kpi.titulo === 'Estudiantes');
    if (kpiEstudiantes) {
      kpiEstudiantes.valor = this.totalEstudiantes;
    }
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
        titulo: 'Enviadas',
        valor: 0, // Se actualizará desde el endpoint de estado de solicitudes
        icono: 'send',
        color: 'accent',
        descripcion: 'Solicitudes enviadas pendientes'
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
        valor: this.totalEstudiantes > 0 ? this.totalEstudiantes : globales.totalEstudiantes,
        icono: 'people',
        color: 'info',
        descripcion: 'Total de estudiantes registrados'
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
