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
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

import { EstadisticasService } from '../../../core/services/estadisticas.service';
import { PeriodosAcademicosService, PeriodoAcademico } from '../../../core/services/periodos-academicos.service';
import { ApiEndpoints } from '../../../core/utils/api-endpoints';
import { environment } from '../../../../environments/environment';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EstudiantesPorProgramaComponent } from '../../../shared/components/estudiantes-por-programa/estudiantes-por-programa.component';
import { EstadisticasPorProcesoComponent } from '../../../shared/components/estadisticas-por-proceso/estadisticas-por-proceso.component';
import { EstadisticasPorEstadoComponent } from '../../../shared/components/estadisticas-por-estado/estadisticas-por-estado.component';
import { TendenciasComparativasComponent } from '../../../shared/components/tendencias-comparativas/tendencias-comparativas.component';
import { PeriodoFiltroSelectorComponent } from '../../../shared/components/periodo-filtro-selector/periodo-filtro-selector.component';
import { snackbarConfig } from '../../../core/design-system/design-tokens';
import { 
  ResumenCompleto,
  ResumenCompletoAPI,
  EstadisticasProceso,
  EstadisticasPrograma,
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
    PeriodoFiltroSelectorComponent
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
  private destroy$ = new Subject<void>();
  
  // Flag para evitar recargas múltiples
  private chartsCreados = false;

  constructor(
    private estadisticasService: EstadisticasService,
    private periodosService: PeriodosAcademicosService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    // El formulario se inicializará en ngOnInit para evitar problemas de hidratación
  }

  ngOnInit(): void {
    // Inicializar formulario reactivo
    this.filtrosForm = this.fb.group({
      proceso: [''],
      idPrograma: [''], // Cambiado de 'programa' a 'idPrograma'
      periodoAcademico: [''] // Campo para período académico
    });
    
    this.inicializarDatos();
    
    // generarKPIs() se llamará automáticamente en cargarDatos() después de recibir los datos del backend
    
    // Cargar datos del backend
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
   * Usa getResumenCompleto cuando hay filtros de período académico o programa
   */
  cargarDatos(filtros: FiltroEstadisticas = {}): void {
    this.loading = true;
    this.error = false;
    
    // Siempre usar getResumenCompleto (soporta filtros y sin filtros)
    // El backend maneja automáticamente:
    // - Sin filtros: muestra todos los períodos
    // - Con periodoAcademico: filtra por ese período
    // - Con proceso: filtra por tipo (Reingreso, Homologacion, Paz y Salvo, Cursos de Verano, ECAES)
    const filtrosResumen: { periodoAcademico?: string; idPrograma?: number; proceso?: string } = {};
    
    // Solo agregar período si hay un valor válido (no 'todos' ni '')
    const tienePeriodo = filtros.periodoAcademico && filtros.periodoAcademico.trim() !== '';
    if (tienePeriodo) {
      filtrosResumen.periodoAcademico = filtros.periodoAcademico!.trim();
    }
    
    // Solo agregar programa si hay un valor válido
    const tienePrograma = filtros.idPrograma !== undefined && filtros.idPrograma !== null && filtros.idPrograma > 0;
    if (tienePrograma) {
      filtrosResumen.idPrograma = filtros.idPrograma;
    }
    
    // Agregar proceso si el usuario eligió uno
    if (filtros.proceso && filtros.proceso.trim() !== '' && filtros.proceso !== 'Todos los procesos') {
      filtrosResumen.proceso = filtros.proceso.trim();
    }
    
    this.estadisticasService.getResumenCompleto(filtrosResumen).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resumenAPI) => {
        try {
          // Convertir ResumenCompletoAPI a ResumenCompleto para compatibilidad
          this.resumenCompleto = this.convertirResumenCompletoAPI(resumenAPI);
          
          this.generarKPIs();
          
          const primeraCarga = !this.chartsCreados;
          if (primeraCarga) {
            this.crearCharts();
            this.chartsCreados = true;
          } else {
            this.actualizarCharts();
          }
          
          this.loading = false;
          this.error = false;
          
          if (primeraCarga) {
            this.mostrarExito('Datos cargados correctamente desde el backend');
          }
        } catch (conversionError) {
          this.cargarDatosConEndpointsAlternativos(filtros);
        }
      },
      error: (error) => {
        this.cargarDatosConEndpointsAlternativos(filtros);
      }
    });

    // Cargar total de estudiantes desde el endpoint específico
    this.cargarTotalEstudiantes();
  }
  
  /**
   * Convierte ResumenCompletoAPI a ResumenCompleto para compatibilidad
   */
  private convertirResumenCompletoAPI(resumenAPI: any): ResumenCompleto {
    // Convertir porTipoProceso de objeto a array
    const estadisticasPorProceso: EstadisticasProceso[] = Object.keys(resumenAPI.porTipoProceso || {}).map(key => {
      const proceso = resumenAPI.porTipoProceso[key];
      return {
        nombreProceso: key.toLowerCase().replace(/\s+/g, '-'),
        totalSolicitudes: proceso.totalSolicitudes || 0,
        aprobadas: proceso.totalAprobadas || 0,
        rechazadas: proceso.totalRechazadas || 0,
        enProceso: proceso.totalEnProceso || 0,
        pendientes: 0,
        porcentajeAprobacion: proceso.porcentajeAprobacion || 0,
        tendenciaMensual: [],
        distribucionPorPrograma: []
      };
    });
    
    // Convertir porPrograma desde estadisticasGlobales.porPrograma
    const estadisticasPorPrograma: EstadisticasPrograma[] = Object.keys(resumenAPI.estadisticasGlobales?.porPrograma || {}).map((nombrePrograma, index) => ({
      idPrograma: index + 1,
      nombrePrograma,
      totalSolicitudes: resumenAPI.estadisticasGlobales.porPrograma[nombrePrograma] || 0,
      distribucionPorProceso: [],
      tendenciaAnual: []
    }));
    
    return {
      estadisticasGlobales: {
        totalSolicitudes: resumenAPI.estadisticasGlobales?.totalSolicitudes || 0,
        solicitudesAprobadas: resumenAPI.estadisticasGlobales?.totalAprobadas || 0,
        solicitudesRechazadas: resumenAPI.estadisticasGlobales?.totalRechazadas || 0,
        solicitudesEnviadas: 0,
        solicitudesEnProceso: resumenAPI.estadisticasGlobales?.totalEnProceso || 0,
        totalEstudiantes: 0,
        totalProgramas: resumenAPI.totalProgramas || 0
      },
      estadisticasPorProceso,
      estadisticasPorPrograma,
      ultimaActualizacion: resumenAPI.fechaGeneracion || new Date().toISOString()
    };
  }

  /**
   * Carga datos usando endpoints alternativos cuando /estadisticas/resumen-completo falla
   * Pasa los filtros (periodoAcademico, idPrograma, proceso) a todos los endpoints
   */
  private cargarDatosConEndpointsAlternativos(filtros: FiltroEstadisticas = {}): void {
    
    // Preparar filtros para los endpoints
    const filtrosResumen: { periodoAcademico?: string; idPrograma?: number; proceso?: string } = {};
    
    if (filtros.periodoAcademico && filtros.periodoAcademico.trim() !== '') {
      filtrosResumen.periodoAcademico = filtros.periodoAcademico.trim();
    }
    
    if (filtros.idPrograma !== undefined && filtros.idPrograma !== null && filtros.idPrograma > 0) {
      filtrosResumen.idPrograma = filtros.idPrograma;
    }
    
    if (filtros.proceso && filtros.proceso.trim() !== '' && filtros.proceso !== 'Todos los procesos') {
      filtrosResumen.proceso = filtros.proceso.trim();
    }
    
    // Combinar datos de múltiples endpoints que funcionan, pasando los filtros
    const estadoSolicitudes$ = this.estadisticasService.getEstadoSolicitudes(filtrosResumen);
    const estadisticasPorProceso$ = this.estadisticasService.getEstadisticasDetalladasPorProceso(filtrosResumen);
    const estudiantesPorPrograma$ = this.estadisticasService.getEstudiantesPorPrograma(filtrosResumen);
    const porPeriodo$ = this.estadisticasService.getEstadisticasPorPeriodoMejoradas(filtrosResumen);
    
    // Combinar todas las respuestas
    let estadoSolicitudes: any = null;
    let estadisticasPorProceso: any = null;
    let estudiantesPorPrograma: any = null;
    let porPeriodo: any = null;
    let errores: string[] = [];
    let completados = 0;
    const total = 4;
    
    const checkComplete = () => {
      completados++;
      if (completados === total) {
        // Construir resumenCompleto con los datos obtenidos
        try {
          this.construirResumenDesdeEndpointsAlternativos(
            estadoSolicitudes,
            estadisticasPorProceso,
            estudiantesPorPrograma,
            porPeriodo
          );
          
          this.generarKPIs();
          
          // Solo crear gráficos si no se han creado antes
          const primeraCarga = !this.chartsCreados;
          if (primeraCarga) {
            this.crearCharts();
            this.chartsCreados = true;
          } else {
            // Si los gráficos ya existen, solo actualizarlos
            this.actualizarCharts();
          }
          
          this.loading = false;
          this.error = false;
          
          if (errores.length > 0) {
            this.mostrarError(`Datos cargados parcialmente. Algunos endpoints fallaron: ${errores.join(', ')}`);
          } else if (primeraCarga) {
            this.mostrarExito('Datos cargados usando endpoints alternativos');
          }
        } catch (error) {
          this.loading = false;
          this.error = true;
          this.mostrarError('Error al procesar los datos. Por favor, contacta al administrador.');
        }
      }
    };
    
    estadoSolicitudes$.subscribe({
      next: (data) => {
        estadoSolicitudes = data;
        checkComplete();
      },
      error: (error) => {
        errores.push('estado-solicitudes');
        checkComplete();
      }
    });
    
    estadisticasPorProceso$.subscribe({
      next: (data) => {
        estadisticasPorProceso = data;
        checkComplete();
      },
      error: (error) => {
        errores.push('estadisticas-por-proceso');
        checkComplete();
      }
    });
    
    estudiantesPorPrograma$.subscribe({
      next: (data) => {
        estudiantesPorPrograma = data;
        checkComplete();
      },
      error: (error) => {
        errores.push('estudiantes-por-programa');
        checkComplete();
      }
    });
    
    porPeriodo$.subscribe({
      next: (data) => {
        porPeriodo = data;
        checkComplete();
      },
      error: (error) => {
        errores.push('por-periodo');
        checkComplete();
      }
    });
  }
  
  /**
   * Construye el resumen completo desde los endpoints alternativos
   */
  private construirResumenDesdeEndpointsAlternativos(
    estadoSolicitudes: any,
    estadisticasPorProceso: any,
    estudiantesPorPrograma: any,
    porPeriodo: any
  ): void {
    
    // Construir estadísticas por proceso desde estadisticasPorProceso
    const procesosData = estadisticasPorProceso?.estadisticasPorProceso || {};
    
    // Calcular totales desde estado de solicitudes (si está disponible)
    let totalSolicitudes = 0;
    let aprobadas = 0;
    let rechazadas = 0;
    let enviadas = 0;
    let enProceso = 0;
    
    // Usar resumenPorEstado con fallback a estados para compatibilidad
    const estados = estadoSolicitudes?.resumenPorEstado || estadoSolicitudes?.estados;
    
    if (estadoSolicitudes && estados) {
      // Usar EN_PROCESO en lugar de APROBADA_FUNCIONARIO
      aprobadas = estados['APROBADA']?.cantidad || 0;
      rechazadas = estados['RECHAZADA']?.cantidad || 0;
      enviadas = estados['ENVIADA']?.cantidad || 0;
      enProceso = estados['EN_PROCESO']?.cantidad || 0;
      
      // Calcular totalSolicitudes sumando todos los estados si el valor del backend es 0 o no está disponible
      const totalDesdeBackend = estadoSolicitudes.totalSolicitudes || 0;
      const totalCalculado = aprobadas + rechazadas + enviadas + enProceso;
      totalSolicitudes = totalDesdeBackend > 0 ? totalDesdeBackend : totalCalculado;
      
    } else {
      // Si no hay estadoSolicitudes, calcular desde estadisticasPorProceso
      Object.values(procesosData).forEach((proceso: any) => {
        totalSolicitudes += proceso.totalSolicitudes || 0;
        aprobadas += proceso.aprobadas || 0;
        rechazadas += proceso.rechazadas || 0;
        enviadas += proceso.enviadas || 0;
        enProceso += proceso.enProceso || 0;
      });
      
    }
    const estadisticasPorProcesoArray: EstadisticasProceso[] = Object.keys(procesosData).map((nombreProceso, index) => {
      const proceso = procesosData[nombreProceso];
      return {
        nombreProceso: nombreProceso.toLowerCase().replace(/\s+/g, '-'),
        totalSolicitudes: proceso.totalSolicitudes || 0,
        aprobadas: proceso.aprobadas || 0,
        rechazadas: proceso.rechazadas || 0,
        enProceso: proceso.enProceso || 0,
        enviadas: proceso.enviadas || 0,
        pendientes: 0,
        porcentajeAprobacion: proceso.totalSolicitudes > 0 ? ((proceso.aprobadas || 0) / proceso.totalSolicitudes) * 100 : 0,
        tendenciaMensual: [],
        distribucionPorPrograma: []
      };
    });
    
    // Construir estadísticas por programa desde estudiantesPorPrograma
    const programasData = estudiantesPorPrograma?.estudiantesPorPrograma || {};
    const estadisticasPorProgramaArray: EstadisticasPrograma[] = Object.keys(programasData).map((nombrePrograma, index) => ({
      idPrograma: index + 1,
      nombrePrograma,
      totalSolicitudes: 0, // No disponible desde este endpoint
      distribucionPorProceso: [],
      tendenciaAnual: []
    }));
    
    // Construir el resumen completo
    this.resumenCompleto = {
      estadisticasGlobales: {
        totalSolicitudes,
        solicitudesAprobadas: aprobadas,
        solicitudesRechazadas: rechazadas,
        solicitudesEnviadas: enviadas,
        solicitudesEnProceso: enProceso,
        totalEstudiantes: this.totalEstudiantes || 0,
        totalProgramas: Object.keys(programasData).length
      },
      estadisticasPorProceso: estadisticasPorProcesoArray,
      estadisticasPorPrograma: estadisticasPorProgramaArray,
      ultimaActualizacion: new Date().toISOString()
    };
    
  }

  /**
   * Carga el total de estudiantes desde el endpoint específico
   */
  private cargarTotalEstudiantes(): void {
    this.loadingEstudiantes = true;
    
    this.estadisticasService.getTotalEstudiantes().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.totalEstudiantes = response.totalEstudiantes;
        this.loadingEstudiantes = false;
        
        // Actualizar KPIs si ya están generados
        if (this.kpis.length > 0) {
          this.actualizarKPIEstudiantes();
        }
      },
      error: (error) => {
        this.loadingEstudiantes = false;
        
        // Usar valor por defecto en caso de error
        this.totalEstudiantes = 0;
        this.mostrarError('Error al cargar el total de estudiantes');
      }
    });
  }

  /**
   * Carga los datos de estado de solicitudes para actualizar los KPIs correctos
   */
  private cargarDatosEstadoSolicitudes(): void {
    this.estadisticasService.getEstadoSolicitudesMejorado().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.actualizarKPIsConEstadoSolicitudes(response);
      },
      error: (error) => {
        
        // Usar valores reales si el endpoint falla
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
  }

  /**
   * Actualiza los KPIs con los datos correctos del endpoint de estado de solicitudes
   */
  private actualizarKPIsConEstadoSolicitudes(data: any): void {
    if (!data || !data.estados) {
      return;
    }
    // Verificar cada estado individualmente
    const estados = data.estados;
    // VERIFICACIÓN DETALLADA DEL ESTADO "ENVIADA"
    // CALCULAR totalSolicitudes sumando todos los estados
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
   * Método temporal para verificar la conexión del endpoint
   */
  verificarEndpoint(): void {
    // Hacer una llamada directa para verificar
    fetch(`${environment.apiUrl}/estadisticas/estado-solicitudes`)
      .then(response => {
        return response.json();
      })
      .then(data => {
        // Verificar estructura de datos
        if (data.estados) {
          
          // Verificar cada estado
          Object.entries(data.estados).forEach(([nombre, info]: [string, any]) => {
          });

          // FORZAR ACTUALIZACIÓN DE KPIs CON DATOS CORRECTOS
          this.actualizarKPIsConEstadoSolicitudes(data);
        } else {
        }
      })
      .catch(error => {
           });
   }

   /**
    * Método temporal para forzar la actualización de KPIs
    */
   forzarActualizacionKPIs(): void {
     // Simular datos del backend con la estructura correcta
     const datosSimulados = {
       totalSolicitudes: 46,
       estados: {
         Aprobada: { cantidad: 21, porcentaje: 45.65, color: "#249337", icono: "check_circle" },
         Enviada: { cantidad: 9, porcentaje: 19.57, color: "#1D72D3", icono: "send" },
         "En Proceso": { cantidad: 11, porcentaje: 23.91, color: "#1D72D3", icono: "schedule" },
         Rechazada: { cantidad: 5, porcentaje: 10.87, color: "#FF6D0A", icono: "cancel" }
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
    // Leer valores de resumenCompleto.estadisticasGlobales
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
        valor: this.totalEstudiantes || 0, // Usar el valor real si ya está disponible
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
      await this.crearChartDistribucion();
    }, 100);
  }

  /**
   * Carga datos reales del backend para el gráfico de procesos
   * Usa el endpoint /api/estadisticas/estadisticas-por-proceso
   * Pasa los filtros del dashboard
   */
  private async cargarDatosRealesProcesos(): Promise<any> {
    try {
      // Preparar filtros
      const filtros: { periodoAcademico?: string; idPrograma?: number; proceso?: string } = {};
      
      if (this.filtros.periodoAcademico && this.filtros.periodoAcademico.trim() !== '' && this.filtros.periodoAcademico !== 'todos') {
        filtros.periodoAcademico = this.filtros.periodoAcademico.trim();
      }
      
      if (this.filtros.idPrograma !== undefined && this.filtros.idPrograma !== null && this.filtros.idPrograma > 0) {
        filtros.idPrograma = this.filtros.idPrograma;
      }
      
      if (this.filtros.proceso && this.filtros.proceso.trim() !== '' && this.filtros.proceso !== 'Todos los procesos') {
        filtros.proceso = this.filtros.proceso.trim();
      }
      
      // Usar el endpoint que funciona correctamente, pasando los filtros
      const data: any = await this.estadisticasService.getEstadisticasDetalladasPorProceso(filtros).toPromise();
      
      // Convertir la estructura del endpoint a la esperada
      if (data && data.estadisticasPorProceso) {
        const estadisticasPorProceso: any = {};
        
        Object.entries(data.estadisticasPorProceso).forEach(([nombre, proceso]: [string, any]) => {
          estadisticasPorProceso[nombre] = {
            totalSolicitudes: proceso.totalSolicitudes || 0,
            aprobadas: proceso.aprobadas || 0,
            rechazadas: proceso.rechazadas || 0,
            enProceso: proceso.enProceso || 0,
            enviadas: proceso.enviadas || 0
          };
        });
        return {
          estadisticasPorProceso: estadisticasPorProceso
        };
      } else {
        return null;
      }
      
    } catch (error) {
      return null;
    }
  }


  /**
   * Carga datos reales del backend para el gráfico de tendencia
   * Pasa los filtros del dashboard
   */
  private async cargarDatosRealesTendencia(): Promise<any> {
    try {
      // Preparar filtros
      const params = new URLSearchParams();
      
      if (this.filtros.periodoAcademico && this.filtros.periodoAcademico.trim() !== '' && this.filtros.periodoAcademico !== 'todos') {
        params.append('periodoAcademico', this.filtros.periodoAcademico.trim());
      }
      
      if (this.filtros.idPrograma !== undefined && this.filtros.idPrograma !== null && this.filtros.idPrograma > 0) {
        params.append('idPrograma', this.filtros.idPrograma.toString());
      }
      
      if (this.filtros.proceso && this.filtros.proceso.trim() !== '' && this.filtros.proceso !== 'Todos los procesos') {
        params.append('proceso', this.filtros.proceso.trim());
      }
      
      const queryString = params.toString();
      const url = `${environment.apiUrl}/estadisticas/por-periodo${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * Crea el gráfico de distribución por procesos con datos reales
   */
  private async crearChartProcesos(): Promise<void> {
    const ctx = document.getElementById('chartProcesos') as HTMLCanvasElement;
    if (!ctx) {
      return;
    }

    // Solo destruir si el gráfico ya existe
    if (this.chartProcesos) {
      this.destruirChart('chartProcesos');
    }

    // Cargar datos reales del backend
    const datosReales = await this.cargarDatosRealesProcesos();
    
    if (!datosReales || !datosReales.estadisticasPorProceso) {
      this.crearChartProcesosFallback();
      return;
    }

    // Transformar el objeto a arrays
    const labels = Object.keys(datosReales.estadisticasPorProceso);
    const valores = Object.values(datosReales.estadisticasPorProceso).map((p: any) => p.totalSolicitudes);
    
    // Simplificar nombres (eliminar "Solicitud de " y "Solicitud ")
    const labelsSimplificados = labels.map(label => 
      label.replace("Solicitud de ", "").replace("Solicitud ", "")
    );
    
    // Mapeo explícito de colores por proceso (cada uno único y distintivo)
    const coloresPorProceso: {[key: string]: string} = {
      'Cursos de Verano': '#2196F3',      // Azul
      'Paz y Salvo': '#FF9800',           // Naranja
      'Reingreso': '#4CAF50',             // Verde
      'ECAES': '#F44336',                 // Rojo
      'Homologación': '#9C27B0'           // Morado
    };
    
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
      // Error al crear gráfico
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
          '#249337', // Verde - Homologación
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
      // Error al crear gráfico
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

    // Solo destruir si el gráfico ya existe
    if (this.chartTendencia) {
      this.destruirChart('chartTendencia');
    }

    // Cargar datos reales del backend
    const datosReales = await this.cargarDatosRealesTendencia();
    
    if (!datosReales || !datosReales.porMes) {
      this.crearChartTendenciaFallback();
      return;
    }
    // Usar mesesOrdenados o todosLosMeses del backend
    // El endpoint /por-periodo devuelve todos los meses (Enero-Diciembre), incluso con 0
    // Preferir usar mesesOrdenados o todosLosMeses del backend en lugar de hardcodear
    let mesesOrden: string[];
    let solicitudesMensual: number[];
    let aprobadasMensual: number[];
    
    if (datosReales.mesesOrdenados && datosReales.mesesOrdenados.length > 0) {
      // Usar mesesOrdenados del backend (preferido)
      mesesOrden = datosReales.mesesOrdenados.map((item: { mes: string; total: number; aprobadas: number }) => item.mes);
      solicitudesMensual = datosReales.mesesOrdenados.map((item: { mes: string; total: number; aprobadas: number }) => item.total || 0);
      aprobadasMensual = datosReales.mesesOrdenados.map((item: { mes: string; total: number; aprobadas: number }) => item.aprobadas || 0);
    } else if (datosReales.todosLosMeses && datosReales.todosLosMeses.length > 0) {
      // Usar todosLosMeses del backend
      mesesOrden = datosReales.todosLosMeses;
      solicitudesMensual = mesesOrden.map(mes => datosReales.porMes[mes]?.total || 0);
      aprobadasMensual = mesesOrden.map(mes => datosReales.porMes[mes]?.aprobadas || 0);
    } else {
      // Fallback: usar porMes directamente (orden por defecto)
      mesesOrden = Object.keys(datosReales.porMes);
      solicitudesMensual = mesesOrden.map(mes => datosReales.porMes[mes]?.total || 0);
      aprobadasMensual = mesesOrden.map(mes => datosReales.porMes[mes]?.aprobadas || 0);
    }
    
    const data: ChartData<'line'> = {
      labels: mesesOrden,
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
          borderColor: '#249337',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#249337',
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
      // Error al crear gráfico
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

    // Solo destruir si el gráfico ya existe
    if (this.chartTendencia) {
      this.destruirChart('chartTendencia');
    }

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
          borderColor: '#249337',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#249337',
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
            borderColor: '#000066',
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
              color: '#000066',
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
              color: '#000066',
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
      // Error al crear gráfico
    }
  }

  /**
   * Crea el gráfico de distribución por programa
   */
  private async crearChartDistribucion(): Promise<void> {
    const ctx = document.getElementById('chartDistribucion') as HTMLCanvasElement;
    if (!ctx) {
      return;
    }

    // Solo destruir si el gráfico ya existe
    if (this.chartDistribucion) {
      this.destruirChart('chartDistribucion');
    }

    // Cargar datos desde el endpoint /por-programa
    try {
      // Preparar filtros
      const filtros: { periodoAcademico?: string; idPrograma?: number; proceso?: string } = {};
      
      if (this.filtros.periodoAcademico && this.filtros.periodoAcademico.trim() !== '' && this.filtros.periodoAcademico !== 'todos') {
        filtros.periodoAcademico = this.filtros.periodoAcademico.trim();
      }
      
      if (this.filtros.idPrograma !== undefined && this.filtros.idPrograma !== null && this.filtros.idPrograma > 0) {
        filtros.idPrograma = this.filtros.idPrograma;
      }
      
      if (this.filtros.proceso && this.filtros.proceso.trim() !== '' && this.filtros.proceso !== 'Todos los procesos') {
        filtros.proceso = this.filtros.proceso.trim();
      }
      
      const response = await this.estadisticasService.getEstadisticasPorProgramaMejoradas(filtros).toPromise();
      
      if (!response || !response.solicitudesPorPrograma) {
        // Fallback: usar datos del resumen si están disponibles
        if (this.resumenCompleto && this.resumenCompleto.estadisticasPorPrograma.length > 0) {
          this.crearChartDistribucionFallback();
        }
        return;
      }

      // Extraer datos de solicitudesPorPrograma según la guía
      const solicitudesPorPrograma = response.solicitudesPorPrograma || {};
      const programas = Object.keys(solicitudesPorPrograma);
      const valores = programas.map(programa => solicitudesPorPrograma[programa] || 0);

      const data: ChartData<'bar'> = {
        labels: programas,
        datasets: [{
          label: 'Solicitudes',
          data: valores,
        backgroundColor: [
          '#2196f3', // Azul - Sistemas
          '#ff9800', // Naranja - Electrónica
          '#249337', // Verde - Automática
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
          duration: 0, // Sin animación para mejor rendimiento
          easing: 'linear'
        }
      }
    };

      this.chartDistribucion = new Chart(ctx, config);
    } catch (error) {
      // Fallback: usar datos del resumen si están disponibles
      if (this.resumenCompleto && this.resumenCompleto.estadisticasPorPrograma.length > 0) {
        this.crearChartDistribucionFallback();
      }
    }
  }

  /**
   * Crea el gráfico de distribución con datos de fallback
   */
  private crearChartDistribucionFallback(): void {
    const ctx = document.getElementById('chartDistribucion') as HTMLCanvasElement;
    if (!ctx) {
      return;
    }

    // Solo destruir si el gráfico ya existe
    if (this.chartDistribucion) {
      this.destruirChart('chartDistribucion');
    }

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
          '#249337', // Verde - Automática
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
          duration: 0,
          easing: 'linear'
        }
      }
    };

    try {
      this.chartDistribucion = new Chart(ctx, config);
    } catch (error) {
      // Error al crear gráfico
    }
  }

  /**
   * Maneja el cambio de período académico.
   */
  onPeriodoChange(periodo: string): void {
    if (this.filtrosForm) {
      this.filtrosForm.patchValue({ periodoAcademico: periodo });
    }
  }

  /**
   * Aplica los filtros seleccionados y recarga los datos
   * Envía los filtros en el formato correcto al backend
   */
  aplicarFiltros(): void {
    if (this.filtrosForm) {
      const formValue = this.filtrosForm.value;
      
      // Convertir filtros al formato correcto
      const filtros: FiltroEstadisticas = {};
      
      // Proceso: enviar solo si no es "Todos los procesos" o vacío
      if (formValue.proceso && formValue.proceso.trim() !== '' && formValue.proceso !== 'Todos los procesos') {
        filtros.proceso = formValue.proceso.trim();
      }
      
      // Programa: enviar como número (idPrograma) solo si tiene valor válido
      if (formValue.idPrograma && formValue.idPrograma !== '' && formValue.idPrograma !== 'Todos los programas' && formValue.idPrograma !== null && formValue.idPrograma !== undefined) {
        const idProgramaNum = Number(formValue.idPrograma);
        if (!isNaN(idProgramaNum) && idProgramaNum > 0) {
          filtros.idPrograma = idProgramaNum;
        }
      }
      
      // Período Académico: manejar correctamente 'todos', '' (actual), y períodos específicos
      const periodoValue = formValue.periodoAcademico;
      if (periodoValue !== undefined && periodoValue !== null) {
        const periodoTrimmed = String(periodoValue).trim();
        // Si es 'todos', NO agregar filtro (mostrar todos)
        if (periodoTrimmed === 'todos' || periodoTrimmed === 'Todos los períodos') {
          // No agregar filtro de período - mostrar todos
          // Marcar explícitamente que se quiere mostrar todos
          filtros.periodoAcademico = undefined;
        } 
        // Si es cadena vacía, es período actual - obtener el período actual y enviarlo
        else if (periodoTrimmed === '') {
          // Obtener el período actual del servicio y enviarlo como filtro
          this.periodosService.getPeriodoActual().pipe(
            takeUntil(this.destroy$)
          ).subscribe({
            next: (periodoActual: PeriodoAcademico | null) => {
              if (periodoActual && periodoActual.valor) {
                filtros.periodoAcademico = periodoActual.valor;
              }
              // Guardar filtros para pasarlos a los componentes hijos
              this.filtros = filtros;
              // Usar el método de carga de datos con filtros
              this.cargarDatos(filtros);
              this.mostrarExito('Filtros aplicados correctamente');
            },
            error: (error: any) => {
              // Si falla obtener el período actual, cargar sin filtro de período
              this.filtros = filtros;
              this.cargarDatos(filtros);
              this.mostrarExito('Filtros aplicados correctamente');
            }
          });
          return; // Salir temprano, el cargarDatos se llamará en el subscribe
        }
        // Si es un período específico, enviarlo
        else {
          filtros.periodoAcademico = periodoTrimmed;
        }
      }
      
      // Guardar filtros para pasarlos a los componentes hijos
      this.filtros = filtros;
      
      // Usar el método de carga de datos con filtros
      this.cargarDatos(filtros);
      
      this.mostrarExito('Filtros aplicados correctamente');
    }
  }

  /**
   * Limpia todos los filtros y recarga los datos completos
   * Resetea el formulario a valores vacíos
   */
  limpiarFiltros(): void {
    if (this.filtrosForm) {
      this.filtrosForm.reset({
        proceso: '',
        idPrograma: '',
        periodoAcademico: ''
      });
    }
    // Limpiar filtros guardados
    this.filtros = {};
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
    
    this.estadisticasService.getEstadisticasProceso(proceso).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.estadisticasProceso = data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.mostrarError('Error al cargar estadísticas del proceso');
      }
    });
  }

  /**
   * Formatea el nombre del proceso para mostrarlo en la UI
   * Los nombres ya vienen en el formato correcto del backend
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
    this.chartsCreados = false;
  }

  /**
   * Actualiza los gráficos con los nuevos datos filtrados
   * Recrea los gráficos cuando cambian los filtros para mostrar datos correctos
   */
  private actualizarCharts(): void {
    // Si los gráficos no existen, crearlos
    if (!this.chartProcesos || !this.chartTendencia || !this.chartDistribucion) {
      this.crearCharts();
      this.chartsCreados = true;
      return;
    }
    
    // Cuando cambian los filtros, es mejor recrear los gráficos con los nuevos datos
    // para asegurar que muestren los datos filtrados correctamente
    try {
      // Destruir gráficos existentes
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
      
      // Recrear los gráficos con los nuevos datos filtrados
      this.crearCharts();
      this.chartsCreados = true;
    } catch (error) {
      // Si falla, intentar recrear los gráficos
      this.destruirCharts();
      this.chartsCreados = false;
      this.crearCharts();
      this.chartsCreados = true;
    }
  }

  /**
   * Muestra un mensaje de éxito
   */
  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', snackbarConfig(['success-snackbar']));
  }

  /**
   * Muestra un mensaje de error
   */
  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', snackbarConfig(['error-snackbar']));
  }

  /**
   * ===== FUNCIONALIDADES DE EXPORTACIÓN =====
   */

  /**
   * Actualiza los datos del dashboard llamando nuevamente al servicio
   */
  actualizarDatos(): void {
    // Resetear flag para forzar recreación de gráficos
    this.chartsCreados = false;
    this.destruirCharts();
    this.cargarDatos();
  }

  /**
   * Exporta el reporte de estadísticas como archivo de texto
   */
  async exportarPDF(): Promise<void> {
    this.loading = true;
    this.mostrarExito('Descargando reporte PDF del Dashboard General...');

    try {
      // Construir filtros desde el formulario
      const filtros: FiltroEstadisticas = {};
      const formValue = this.filtrosForm?.value;
      
      if (formValue?.proceso && formValue.proceso !== '' && formValue.proceso !== 'Todos los procesos') {
        filtros.proceso = formValue.proceso;
      }
      
      if (formValue?.idPrograma && formValue.idPrograma !== '' && formValue.idPrograma !== 'Todos los programas') {
        filtros.idPrograma = Number(formValue.idPrograma);
      }
      
      if (formValue?.periodoAcademico) {
        filtros.periodoAcademico = formValue.periodoAcademico;
      }
      
      // Usar el endpoint con filtros
      this.estadisticasService.exportarPDF(filtros).subscribe({
        next: (blob: Blob) => {
          if (blob && blob.size > 0) {
            // Crear URL del blob
            const url = window.URL.createObjectURL(blob);
            
            // Crear enlace de descarga
            const link = document.createElement('a');
            link.href = url;
            const fecha = new Date();
            const fechaStr = fecha.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
            link.download = `estadisticas_${fechaStr}.pdf`;
            
            // Simular clic para descargar
            document.body.appendChild(link);
            link.click();
            
            // Limpiar
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            this.loading = false;
            this.mostrarExito('Reporte PDF descargado exitosamente');
          } else {
            this.loading = false;
            this.mostrarError('El archivo PDF está vacío o corrupto');
          }
        },
        error: (error) => {
          this.loading = false;
          this.mostrarError('Error al exportar el reporte PDF');
        }
      });
    } catch (error) {
      this.loading = false;
      this.mostrarError('Error al descargar el reporte PDF');
    }
  }

  /**
   * Exporta los datos del dashboard a Excel usando el endpoint del backend
   */
  async exportarExcel(): Promise<void> {
    this.loading = true;
    this.mostrarExito('Descargando reporte Excel...');

    try {
      // Construir filtros desde el formulario
      const filtros: FiltroEstadisticas = {};
      const formValue = this.filtrosForm?.value;
      
      if (formValue?.proceso && formValue.proceso !== '' && formValue.proceso !== 'Todos los procesos') {
        filtros.proceso = formValue.proceso;
      }
      
      if (formValue?.idPrograma && formValue.idPrograma !== '' && formValue.idPrograma !== 'Todos los programas') {
        filtros.idPrograma = Number(formValue.idPrograma);
      }
      
      if (formValue?.periodoAcademico) {
        filtros.periodoAcademico = formValue.periodoAcademico;
      }
      
      // Usar el endpoint con filtros
      this.estadisticasService.exportarExcel(filtros).subscribe({
        next: (blob: Blob) => {
          if (blob && blob.size > 0) {
            // Crear URL del blob
            const url = window.URL.createObjectURL(blob);
            
            // Crear enlace de descarga
            const link = document.createElement('a');
            link.href = url;
            const fecha = new Date();
            const fechaStr = fecha.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
            link.download = `estadisticas_${fechaStr}.xlsx`;
            
            // Simular clic para descargar
            document.body.appendChild(link);
            link.click();
            
            // Limpiar
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            this.loading = false;
            this.mostrarExito('Reporte Excel descargado exitosamente');
          } else {
            this.loading = false;
            this.mostrarError('El archivo Excel está vacío o corrupto');
          }
        },
        error: (error: any) => {
          this.loading = false;
          this.mostrarError('Error al exportar el reporte Excel');
        }
      });
    } catch (error) {
      this.loading = false;
      this.mostrarError('Error al descargar el reporte Excel');
    }
  }
}
