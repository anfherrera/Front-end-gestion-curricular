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
import { PeriodoSelectorComponent } from '../../../shared/components/periodo-selector/periodo-selector.component'; // ✨ NUEVO
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
    TendenciasComparativasComponent,
    PeriodoSelectorComponent // ✨ NUEVO
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
  
  // ❌ ELIMINADO: Predicciones (ya no están disponibles en /api/estadisticas/globales)
  
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
      fechaFin: [''],
      periodoAcademico: [''] // ✨ NUEVO: Campo para período académico
    });
    
    this.inicializarDatos();
    
    // ❌ ELIMINADO: No llamar generarKPIs() aquí porque resumenCompleto aún no tiene datos
    // generarKPIs() se llamará automáticamente en cargarDatos() después de recibir los datos del backend
    
    // Cargar datos del backend
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
    const subscription = this.estadisticasService.getEstadisticasGlobales(filtros)
      .subscribe({
        next: (datosAPI) => {
          // Convertir datos del API al formato del dashboard
          this.resumenCompleto = this.estadisticasService.convertirDatosAPI(datosAPI);
          
          // ❌ ELIMINADO: Predicciones (ya no están disponibles en /api/estadisticas/globales)
          
          this.generarKPIs();
          this.crearCharts();
          this.loading = false;
          
          this.mostrarExito('Datos cargados correctamente desde el backend');
        },
        error: (error) => {
          console.error('❌ Error al cargar datos del API:', error);
          
          // Fallback a datos de prueba si hay error
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
    
    // ❌ DESHABILITADO: No usar endpoint separado de estado de solicitudes
    // Los datos ya vienen correctos desde /api/estadisticas/globales
    // this.cargarDatosEstadoSolicitudes();

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
    const subscription = this.estadisticasService.getEstadoSolicitudesMejorado()
      .subscribe({
        next: (response) => {
          this.actualizarKPIsConEstadoSolicitudes(response);
        },
        error: (error) => {
          console.error('❌ ERROR al obtener estado de solicitudes:', error);
          
          // ✅ FALLBACK: Usar valores reales si el endpoint falla
          const datosFallback = {
            totalSolicitudes: 50,
            estados: {
              APROBADA: { cantidad: 32, porcentaje: 64.0 },
              ENVIADA: { cantidad: 9, porcentaje: 18.0 },
              APROBADA_FUNCIONARIO: { cantidad: 15, porcentaje: 30.0 },
              RECHAZADA: { cantidad: 5, porcentaje: 10.0 }
            }
          };
          
          this.actualizarKPIsConEstadoSolicitudes(datosFallback);
        }
      });

    this.subscriptions.push(subscription);
  }

  /**
   * Actualiza los KPIs con los datos correctos del endpoint de estado de solicitudes
   */
  private actualizarKPIsConEstadoSolicitudes(data: any): void {
    if (!data || !data.estados) {
      return;
    }
    // 🔧 Verificar cada estado individualmente
    const estados = data.estados;
    // 🔧 VERIFICACIÓN DETALLADA DEL ESTADO "ENVIADA"
    // ✅ CALCULAR totalSolicitudes sumando todos los estados
    // El backend envía: APROBADA, APROBADA_FUNCIONARIO, ENVIADA, RECHAZADA
    const aprobadas = (estados.APROBADA?.cantidad || 0) + (estados.APROBADA_FUNCIONARIO?.cantidad || 0);
    const enviadas = estados.ENVIADA?.cantidad || 0;
    const enProceso = estados.APROBADA_FUNCIONARIO?.cantidad || 0; // Las aprobadas por funcionario están "en proceso"
    const rechazadas = estados.RECHAZADA?.cantidad || 0;
    
    const totalCalculado = aprobadas + enviadas + enProceso + rechazadas;

    const kpis = {
      totalSolicitudes: totalCalculado,
      aprobadas: aprobadas,
      enviadas: enviadas,
      enProceso: enProceso,
      rechazadas: rechazadas
    };
    // Actualizar cada KPI
    this.actualizarKPI('Total Solicitudes', kpis.totalSolicitudes);
    this.actualizarKPI('Aprobadas', kpis.aprobadas);
    this.actualizarKPI('Enviadas', kpis.enviadas);
    this.actualizarKPI('En Proceso', kpis.enProceso);
    this.actualizarKPI('Rechazadas', kpis.rechazadas);
    this.kpis.forEach(kpi => {
    });
  }

  /**
   * Actualiza un KPI específico por título
   */
  private actualizarKPI(titulo: string, valor: number): void {
    const kpi = this.kpis.find(k => k.titulo === titulo);
    if (kpi) {
      kpi.valor = valor;
    } else {
    }
  }

  /**
   * 🔧 Método temporal para verificar la conexión del endpoint
   */
  verificarEndpoint(): void {
    // Hacer una llamada directa para verificar
    fetch('http://localhost:5000/api/estadisticas/estado-solicitudes')
      .then(response => {
        return response.json();
      })
      .then(data => {
        // Verificar estructura de datos
        if (data.estados) {
          
          // Verificar cada estado
          Object.entries(data.estados).forEach(([nombre, info]: [string, any]) => {
          });

          // 🔧 FORZAR ACTUALIZACIÓN DE KPIs CON DATOS CORRECTOS
          this.actualizarKPIsConEstadoSolicitudes(data);
        } else {
        }
      })
      .catch(error => {
        console.error('❌ Error al verificar endpoint:', error);
           });
   }

   /**
    * 🔧 Método temporal para forzar la actualización de KPIs
    */
   forzarActualizacionKPIs(): void {
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
        totalSolicitudes: 36, // 10 + 9 + 8 + 9 = 36
        solicitudesAprobadas: 17, // 4 + 5 + 4 + 4 = 17
        solicitudesRechazadas: 3, // 2 + 0 + 0 + 1 = 3
        solicitudesEnProceso: 9, // 3 + 2 + 2 + 2 = 9
        solicitudesEnviadas: 7, // 1 + 2 + 2 + 2 = 7
        totalEstudiantes: 7, // Valor real del backend
        totalProgramas: 4 // Valor real del backend
      },
      estadisticasPorProceso: [
        {
          nombreProceso: 'paz-salvo',
          totalSolicitudes: 10,
          aprobadas: 4,
          rechazadas: 2,
          enProceso: 3,
          enviadas: 1,
          pendientes: 0,
          porcentajeAprobacion: 40.0,
          tendenciaMensual: [],
          distribucionPorPrograma: []
        },
        {
          nombreProceso: 'reingreso-estudiante',
          totalSolicitudes: 9,
          aprobadas: 5,
          rechazadas: 0,
          enProceso: 2,
          enviadas: 2,
          pendientes: 0,
          porcentajeAprobacion: 55.6,
          tendenciaMensual: [],
          distribucionPorPrograma: []
        },
        {
          nombreProceso: 'homologacion-asignaturas',
          totalSolicitudes: 8,
          aprobadas: 4,
          rechazadas: 0,
          enProceso: 2,
          enviadas: 2,
          pendientes: 0,
          porcentajeAprobacion: 50.0,
          tendenciaMensual: [],
          distribucionPorPrograma: []
        },
        {
          nombreProceso: 'cursos-de-verano',
          totalSolicitudes: 9,
          aprobadas: 4,
          rechazadas: 1,
          enProceso: 2,
          enviadas: 2,
          pendientes: 0,
          porcentajeAprobacion: 44.4,
          tendenciaMensual: [],
          distribucionPorPrograma: []
        }
      ],
      estadisticasPorPrograma: [],
      ultimaActualizacion: new Date().toISOString()
    };
  }

  /**
   * Genera los KPIs con datos del backend (resumenCompleto)
   */
  private generarKPIs(): void {
    // ✅ CORREGIDO: Leer valores de resumenCompleto.estadisticasGlobales
    const estadisticas = this.resumenCompleto?.estadisticasGlobales;
    
    this.kpis = [
      {
        titulo: 'Total Solicitudes',
        valor: estadisticas?.totalSolicitudes || 0,
        icono: 'description',
        color: 'primary',
        descripcion: 'Solicitudes en todos los procesos'
      },
      {
        titulo: 'Aprobadas',
        valor: estadisticas?.solicitudesAprobadas || 0,
        icono: 'check_circle',
        color: 'success',
        descripcion: 'Solicitudes aprobadas'
      },
      {
        titulo: 'Enviadas',
        valor: estadisticas?.solicitudesEnviadas || 0,
        icono: 'send',
        color: 'accent',
        descripcion: 'Solicitudes enviadas pendientes'
      },
      {
        titulo: 'En Proceso',
        valor: estadisticas?.solicitudesEnProceso || 0,
        icono: 'pending',
        color: 'warning',
        descripcion: 'Solicitudes en revisión'
      },
      {
        titulo: 'Rechazadas',
        valor: estadisticas?.solicitudesRechazadas || 0,
        icono: 'cancel',
        color: 'error',
        descripcion: 'Solicitudes rechazadas'
      },
      {
        titulo: 'Estudiantes',
        valor: this.totalEstudiantes || 0, // ✅ Usar el valor real si ya está disponible
        icono: 'people',
        color: 'info',
        descripcion: 'Total de estudiantes registrados'
      },
      {
        titulo: 'Programas',
        valor: estadisticas?.totalProgramas || 0,
        icono: 'school',
        color: 'purple',
        descripcion: 'Programas académicos'
      }
    ];
    
    this.loading = false;
  }

  /**
   * Crea los gráficos del dashboard con datos reales
   */
  private async crearCharts(): Promise<void> {
    if (!this.resumenCompleto) return;

    setTimeout(async () => {
      await this.crearChartProcesos();
      await this.crearChartTendencia();
      this.crearChartDistribucion();
    }, 100);
  }

  /**
   * Carga datos reales del backend para el gráfico de procesos
   * ✅ CORREGIDO: Usa el endpoint correcto /api/estadisticas/globales
   */
  private async cargarDatosRealesProcesos(): Promise<any> {
    try {
      // ✅ Usar el endpoint correcto que SÍ existe
      const data: any = await this.estadisticasService.getEstadisticasGlobales({}).toPromise();
      
      // Convertir el objeto porTipoProceso a la estructura esperada
      if (data && data.porTipoProceso) {
        const estadisticasPorProceso: any = {};
        
        Object.entries(data.porTipoProceso).forEach(([nombre, cantidad]) => {
          estadisticasPorProceso[nombre] = {
            totalSolicitudes: cantidad as number
            // ❌ ELIMINADO: prediccionDemanda (ya no disponible)
          };
        });
        return {
          estadisticasPorProceso: estadisticasPorProceso
        };
      } else {
        return null;
      }
      
    } catch (error) {
      console.error('❌ Error obteniendo datos reales de procesos:', error);
      return null;
    }
  }

  // ❌ ELIMINADO: obtenerPrediccionProceso() (ya no disponible en /api/estadisticas/globales)

  /**
   * Carga datos reales del backend para el gráfico de tendencia
   */
  private async cargarDatosRealesTendencia(): Promise<any> {
    try {
      const response = await fetch('http://localhost:5000/api/estadisticas/por-periodo');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error obteniendo datos reales de tendencia:', error);
      return null;
    }
  }

  /**
   * Crea el gráfico de distribución por procesos con datos reales
   */
  private async crearChartProcesos(): Promise<void> {
    const ctx = document.getElementById('chartProcesos') as HTMLCanvasElement;
    if (!ctx) {
      console.error('❌ Canvas chartProcesos no encontrado en el DOM');
      return;
    }

    this.destruirChart('chartProcesos');

    // Cargar datos reales del backend
    const datosReales = await this.cargarDatosRealesProcesos();
    
    if (!datosReales || !datosReales.estadisticasPorProceso) {
      this.crearChartProcesosFallback();
      return;
    }

    // ✅ CORREGIDO: Transformar el objeto a arrays
    const labels = Object.keys(datosReales.estadisticasPorProceso);
    const valores = Object.values(datosReales.estadisticasPorProceso).map((p: any) => p.totalSolicitudes);
    
    // ✅ Simplificar nombres (eliminar "Solicitud de " y "Solicitud ")
    const labelsSimplificados = labels.map(label => 
      label.replace("Solicitud de ", "").replace("Solicitud ", "")
    );
    
    // 🎨 Mapeo explícito de colores por proceso (cada uno único y distintivo)
    const coloresPorProceso: {[key: string]: string} = {
      'Cursos de Verano': '#2196F3',      // 🔵 Azul
      'Paz y Salvo': '#FF9800',           // 🟠 Naranja
      'Reingreso': '#4CAF50',             // 🟢 Verde
      'ECAES': '#F44336',                 // 🔴 Rojo
      'Homologación': '#9C27B0'           // 🟣 Morado
    };
    
    // 🔍 DEBUG: Mostrar procesos y labels
    // Asignar colores según el nombre del proceso
    const colores = labelsSimplificados.map(label => {
      // Buscar coincidencia exacta primero
      if (coloresPorProceso[label]) {
        return coloresPorProceso[label];
      }
      
      // Si no hay coincidencia exacta, buscar por inclusión
      for (const [proceso, color] of Object.entries(coloresPorProceso)) {
        if (label.includes(proceso)) {
          return color;
        }
      }
      
      // Color por defecto si no se encuentra
      return '#607D8B';
    });
    const data: ChartData<'doughnut'> = {
      labels: labelsSimplificados,
      datasets: [{
        label: 'Solicitudes',
        data: valores,
        backgroundColor: colores,
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
    } catch (error) {
      console.error('❌ Error al crear gráfico de procesos:', error);
    }
  }

  /**
   * Crea el gráfico de distribución por procesos con datos de fallback
   */
  private crearChartProcesosFallback(): void {
    const ctx = document.getElementById('chartProcesos') as HTMLCanvasElement;
    if (!ctx) {
      return;
    }

    if (!this.resumenCompleto || !this.resumenCompleto.estadisticasPorProceso.length) {
      return;
    }
    const data: ChartData<'doughnut'> = {
      labels: this.resumenCompleto.estadisticasPorProceso.map(p => this.formatearNombreProceso(p.nombreProceso)),
      datasets: [{
        label: 'Solicitudes',
        data: this.resumenCompleto.estadisticasPorProceso.map(p => p.totalSolicitudes),
        backgroundColor: [
          '#ff9800', // Naranja - Paz y Salvo
          '#8e24aa', // Púrpura - Reingreso
          '#4caf50', // Verde - Homologación
          '#2196f3'  // Azul - Cursos de Verano
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
    } catch (error) {
      console.error('❌ Error al crear gráfico de procesos:', error);
    }
  }

  /**
   * Crea el gráfico de tendencia con datos reales
   */
  private async crearChartTendencia(): Promise<void> {
    const ctx = document.getElementById('chartTendencia') as HTMLCanvasElement;
    if (!ctx) {
      return;
    }

    this.destruirChart('chartTendencia');

    // Cargar datos reales del backend
    const datosReales = await this.cargarDatosRealesTendencia();
    
    if (!datosReales || !datosReales.porMes) {
      this.crearChartTendenciaFallback();
      return;
    }
    // ✅ Verificar el mapeo de datos de tendencia
    // Mapear datos según la estructura del backend
    const datosLineas = {
      solicitudes: [
        { mes: 'Julio', valor: datosReales.porMes.Julio?.total || 0 },     // 11
        { mes: 'Agosto', valor: datosReales.porMes.Agosto?.total || 0 },   // 30
        { mes: 'Septiembre', valor: datosReales.porMes.Septiembre?.total || 0 } // 5
      ],
      aprobadas: [
        { mes: 'Julio', valor: datosReales.porMes.Julio?.aprobadas || 0 },     // 7
        { mes: 'Agosto', valor: datosReales.porMes.Agosto?.aprobadas || 0 },   // 14
        { mes: 'Septiembre', valor: datosReales.porMes.Septiembre?.aprobadas || 0 } // 0
      ]
    };
    const meses = datosLineas.solicitudes.map(d => d.mes);
    const solicitudesMensual = datosLineas.solicitudes.map(d => d.valor);
    const aprobadasMensual = datosLineas.aprobadas.map(d => d.valor);
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
    } catch (error) {
      console.error('❌ Error al crear gráfico de tendencia:', error);
    }
  }

  /**
   * Crea el gráfico de tendencia con datos de fallback
   */
  private crearChartTendenciaFallback(): void {
    const ctx = document.getElementById('chartTendencia') as HTMLCanvasElement;
    if (!ctx) {
      return;
    }

    this.destruirChart('chartTendencia');

    // Generar datos de tendencia basados en los datos reales del backend
    const totalSolicitudes = this.resumenCompleto?.estadisticasGlobales.totalSolicitudes || 46;
    const totalAprobadas = this.resumenCompleto?.estadisticasGlobales.solicitudesAprobadas || 21;
    
    // Crear tendencia mensual simulada basada en los datos reales
    const meses = ['Julio', 'Agosto', 'Septiembre'];
    const factorVariacion = 0.2; // 20% de variación
    
    const solicitudesMensual = meses.map((_, index) => {
      const base = totalSolicitudes / 3; // Distribución base para 3 meses
      const variacion = (Math.random() - 0.5) * factorVariacion * base;
      return Math.round(base + variacion);
    });
    
    const aprobadasMensual = meses.map((_, index) => {
      const base = totalAprobadas / 3; // Distribución base para 3 meses
      const variacion = (Math.random() - 0.5) * factorVariacion * base;
      return Math.round(base + variacion);
    });
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
            borderColor: '#00138C',
            borderWidth: 1,
            callbacks: {
              title: function(context) {
                return `Período: ${context[0].label}`;
              },
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.y}`;
              }
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Meses',
              color: '#00138C',
              font: {
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 19, 140, 0.1)'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Cantidad',
              color: '#00138C',
              font: {
                weight: 'bold'
              }
            },
            grid: {
              color: 'rgba(0, 19, 140, 0.1)'
            },
            beginAtZero: true
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
      return;
    }

    this.destruirChart('chartDistribucion');

    if (!this.resumenCompleto || !this.resumenCompleto.estadisticasPorPrograma.length) {
      return;
    }
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
    } catch (error) {
      console.error('❌ Error al crear gráfico de distribución:', error);
    }
  }

  /**
   * ✨ NUEVO: Maneja el cambio de período académico
   */
  onPeriodoChange(periodo: string): void {
    if (this.filtrosForm) {
      this.filtrosForm.patchValue({ periodoAcademico: periodo });
    }
  }

  /**
   * Aplica los filtros seleccionados y recarga los datos
   * ✅ ACTUALIZADO: Envía los filtros en el formato correcto al backend
   */
  aplicarFiltros(): void {
    if (this.filtrosForm && this.filtrosForm.valid) {
      const formValue = this.filtrosForm.value;
      
      // Validar que fechaFin no sea menor que fechaInicio
      if (formValue.fechaInicio && formValue.fechaFin) {
        const inicio = new Date(formValue.fechaInicio);
        const fin = new Date(formValue.fechaFin);
        if (fin < inicio) {
          this.mostrarError('La fecha de fin no puede ser anterior a la fecha de inicio');
          return;
        }
      }
      
      // Convertir filtros al formato correcto (formato yyyy-MM-dd para fechas)
      const filtros: FiltroEstadisticas = {};
      
      // Proceso: enviar solo si no es "Todos los procesos"
      if (formValue.proceso && formValue.proceso !== '' && formValue.proceso !== 'Todos los procesos') {
        filtros.proceso = formValue.proceso;
      }
      
      // Programa: enviar como número (idPrograma)
      if (formValue.programa && formValue.programa !== '' && formValue.programa !== 'Todos los programas') {
        filtros.programa = Number(formValue.programa);
      }
      
      // Fechas: convertir a formato yyyy-MM-dd
      if (formValue.fechaInicio) {
        const fecha = new Date(formValue.fechaInicio);
        filtros.fechaInicio = fecha.toISOString().split('T')[0];
      }
      
      if (formValue.fechaFin) {
        const fecha = new Date(formValue.fechaFin);
        filtros.fechaFin = fecha.toISOString().split('T')[0];
      }
      
      if (formValue.periodoAcademico) {
        filtros.periodoAcademico = formValue.periodoAcademico;
      }
      // Usar el método de carga de datos con filtros
      this.cargarDatos(filtros);
      
      this.mostrarExito('Filtros aplicados correctamente');
    }
  }

  /**
   * Limpia todos los filtros y recarga los datos completos
   * ✅ ACTUALIZADO: Resetea el formulario a valores vacíos
   */
  limpiarFiltros(): void {
    if (this.filtrosForm) {
      this.filtrosForm.reset({
        proceso: '',
        programa: '',
        fechaInicio: '',
        fechaFin: '',
        periodoAcademico: ''
      });
    }
    // Volver a cargar datos sin filtros
    this.cargarDatos();
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
   * Formatea el nombre del proceso para mostrarlo en la UI
   * ✅ ACTUALIZADO: Los nombres ya vienen en el formato correcto del backend
   */
  formatearNombreProceso(proceso: string): string {
    // Los nombres ahora vienen directamente del backend en el formato correcto
    // Si por alguna razón viene un nombre antiguo, lo mapeamos
    const nombresLegacy: { [key: string]: string } = {
      'paz-salvo': 'Paz y Salvo',
      'reingreso-estudiante': 'Reingreso',
      'homologacion-asignaturas': 'Homologación',
      'cursos-de-verano': 'Cursos de Verano',
      'cursos-intersemestrales': 'Cursos de Verano',
      'pruebas-ecaes': 'ECAES'
    };
    
    return nombresLegacy[proceso] || proceso;
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
    this.cargarDatos();
  }

  /**
   * Exporta el reporte de estadísticas como archivo de texto (ACTUALIZADO)
   */
  async exportarPDF(): Promise<void> {
    this.loading = true;
    this.mostrarExito('Descargando reporte PDF del Dashboard General...');

    try {
      // Usar el nuevo endpoint específico para Dashboard General
      this.estadisticasService.exportarReporteGeneral().subscribe({
        next: (blob: Blob) => {
          if (blob && blob.size > 0) {
            // Crear URL del blob
            const url = window.URL.createObjectURL(blob);
            
            // Crear enlace de descarga
            const link = document.createElement('a');
            link.href = url;
            link.download = `reporte_dashboard_general_${new Date().toISOString().split('T')[0]}.pdf`;
            
            // Simular clic para descargar
            document.body.appendChild(link);
            link.click();
            
            // Limpiar
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            this.loading = false;
            this.mostrarExito('Reporte PDF del Dashboard General descargado exitosamente');
          } else {
            this.loading = false;
            this.mostrarError('El archivo PDF está vacío o corrupto');
          }
        },
        error: (error) => {
          console.error('❌ [DEBUG] Error al exportar PDF del Dashboard General:', error);
          this.loading = false;
          this.mostrarError('Error al exportar el reporte PDF del Dashboard General');
        }
      });
    } catch (error) {
      console.error('❌ Error al exportar reporte:', error);
      this.loading = false;
      this.mostrarError('Error al descargar el reporte PDF del Dashboard General');
    }
  }

  /**
   * Exporta los datos del dashboard a Excel usando el endpoint del backend (ACTUALIZADO)
   */
  async exportarExcel(): Promise<void> {
    this.loading = true;
    this.mostrarExito('Descargando Excel del Dashboard General...');

    try {
      // Usar el nuevo endpoint específico para Dashboard General
      this.estadisticasService.exportarExcelGeneral().subscribe({
        next: (blob: Blob) => {
          if (blob && blob.size > 0) {
            // Crear URL del blob
            const url = window.URL.createObjectURL(blob);
            
            // Crear enlace de descarga
            const link = document.createElement('a');
            link.href = url;
            link.download = `reporte_dashboard_general_${new Date().toISOString().split('T')[0]}.xlsx`;
            
            // Simular clic para descargar
            document.body.appendChild(link);
            link.click();
            
            // Limpiar
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            this.loading = false;
            this.mostrarExito('Reporte Excel del Dashboard General descargado exitosamente');
          } else {
            this.loading = false;
            this.mostrarError('El archivo Excel está vacío o corrupto');
          }
        },
        error: (error) => {
          console.error('❌ [DEBUG] Error al exportar Excel del Dashboard General:', error);
          this.loading = false;
          this.mostrarError('Error al exportar el reporte Excel del Dashboard General');
        }
      });
    } catch (error) {
      console.error('❌ Error al exportar Excel:', error);
      this.loading = false;
      this.mostrarError('Error al descargar el reporte Excel del Dashboard General');
    }
  }
}
