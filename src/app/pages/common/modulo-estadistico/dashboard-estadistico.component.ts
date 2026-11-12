import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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
import type { ChartConfiguration } from 'chart.js';
import { Observable, Subject, catchError, firstValueFrom, forkJoin, of } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

import { EstadisticasService } from '../../../core/services/estadisticas.service';
import { PeriodosAcademicosService } from '../../../core/services/periodos-academicos.service';
import { esErrorDeAcceso, mensajeErrorDeAcceso } from '../../../core/utils/http-error.utils';
import { descargarBlob } from '../../../core/utils/download.util';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EstudiantesPorProgramaComponent } from '../../../shared/components/estudiantes-por-programa/estudiantes-por-programa.component';
import { EstadisticasPorProcesoComponent } from '../../../shared/components/estadisticas-por-proceso/estadisticas-por-proceso.component';
import { EstadisticasPorEstadoComponent } from '../../../shared/components/estadisticas-por-estado/estadisticas-por-estado.component';
import { TendenciasComparativasComponent } from '../../../shared/components/tendencias-comparativas/tendencias-comparativas.component';
import { PeriodoFiltroSelectorComponent } from '../../../shared/components/periodo-filtro-selector/periodo-filtro-selector.component';
import { snackbarConfig } from '../../../core/design-system/design-tokens';
import { FiltroEstadisticas, KPIData, ResumenCompleto } from '../../../core/models/estadisticas.model';
import {
  TITULO_KPI_ESTUDIANTES,
  filtrosDelFormulario,
  filtrosParaBackend,
  filtrosParaExportar,
  formatearNombreProceso,
  generarKPIs,
  resumenDesdeAPI,
  resumenDesdeEndpoints
} from './dashboard-estadistico.datos';
import { graficoProcesos, graficoProcesosDesdeResumen, graficoProgramas, graficoTendencia } from './dashboard-estadistico.graficos';

Chart.register(...registerables);

type NombreGrafico = 'chartProcesos' | 'chartTendencia' | 'chartDistribucion';

/**
 * Dashboard general del módulo estadístico: KPIs, gráficos y componentes de detalle.
 * Usa /estadisticas/resumen-completo y, si falla, arma el resumen con los endpoints individuales.
 * Las transformaciones de datos están en dashboard-estadistico.datos.ts y los gráficos en
 * dashboard-estadistico.graficos.ts.
 */
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
  styleUrls: ['./dashboard-comun.css', './dashboard-estadistico.component.css']
})
export class DashboardEstadisticoComponent implements OnInit, OnDestroy {
  loading = false;
  error = false;
  errorMensaje: string | null = null;

  resumenCompleto: ResumenCompleto | null = null;
  totalEstudiantes = 0;
  loadingEstudiantes = false;

  /** Filtros aplicados; también los reciben los componentes hijos. */
  filtros: FiltroEstadisticas = {};
  filtrosForm: FormGroup | null = null;
  procesosDisponibles: string[] = [];
  programasDisponibles: { id: number; nombre: string }[] = [];

  kpis: KPIData[] = [];

  chartProcesos: Chart | null = null;
  chartTendencia: Chart | null = null;
  chartDistribucion: Chart | null = null;
  tendenciaSinDatos = false;

  private destroy$ = new Subject<void>();
  /** Tras la primera carga los gráficos se recrean en vez de crearse. */
  private chartsCreados = false;
  /** Catálogo nombre de programa -> id_programa real. */
  private idsProgramaPorNombre = new Map<string, number>();

  constructor(
    private estadisticasService: EstadisticasService,
    private periodosService: PeriodosAcademicosService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // El formulario se crea aquí y no en el constructor para evitar problemas de hidratación
    this.filtrosForm = this.fb.group({
      proceso: [''],
      idPrograma: [''],
      periodoAcademico: ['']
    });

    this.procesosDisponibles = this.estadisticasService.getProcesosDisponibles();
    this.estadisticasService.getProgramasDisponibles()
      .pipe(takeUntil(this.destroy$))
      .subscribe(programas => this.programasDisponibles = programas);

    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destruirCharts();
  }

  // ===== Carga de datos =====

  cargarDatos(filtros: FiltroEstadisticas = {}): void {
    this.loading = true;
    this.error = false;
    this.errorMensaje = null;

    // Primero el catálogo de programas (en caché tras la primera vez) para resolver ids reales
    this.estadisticasService.getIdsProgramaPorNombre().pipe(
      switchMap(ids => {
        this.idsProgramaPorNombre = ids;
        return this.estadisticasService.getResumenCompleto(filtrosParaBackend(filtros));
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (resumenAPI) => {
        try {
          this.mostrarResumen(resumenDesdeAPI(resumenAPI, this.idPrograma), 'Datos cargados correctamente desde el backend');
        } catch {
          this.cargarDatosConEndpointsAlternativos(filtros);
        }
      },
      error: (error: HttpErrorResponse) => {
        // 401/403: los endpoints alternativos fallarían igual
        if (esErrorDeAcceso(error)) {
          this.manejarErrorDeAcceso(error);
          return;
        }
        this.cargarDatosConEndpointsAlternativos(filtros);
      }
    });

    this.cargarTotalEstudiantes();
  }

  private idPrograma = (nombrePrograma: string): number | null =>
    this.idsProgramaPorNombre.get(EstadisticasService.normalizarNombrePrograma(nombrePrograma)) ?? null;

  /** KPIs y gráficos con el resumen nuevo; el mensaje de éxito solo en la primera carga. */
  private mostrarResumen(resumen: ResumenCompleto, mensajePrimeraCarga: string | null): void {
    this.resumenCompleto = resumen;
    this.kpis = generarKPIs(resumen, this.totalEstudiantes);

    const primeraCarga = !this.chartsCreados;
    if (!primeraCarga) {
      this.destruirCharts();
    }
    this.crearCharts();
    this.chartsCreados = true;

    this.loading = false;
    this.error = false;
    if (primeraCarga && mensajePrimeraCarga) {
      this.mostrarExito(mensajePrimeraCarga);
    }
  }

  /**
   * Cuando resumen-completo falla: cada endpoint se pide por separado y un fallo
   * individual no cancela los demás.
   */
  private cargarDatosConEndpointsAlternativos(filtros: FiltroEstadisticas): void {
    const filtrosBackend = filtrosParaBackend(filtros);
    const errores: { endpoint: string; error: unknown }[] = [];
    const tolerante = <T>(peticion$: Observable<T>, endpoint: string): Observable<T | null> =>
      peticion$.pipe(catchError(error => {
        errores.push({ endpoint, error });
        return of(null);
      }));

    forkJoin({
      ids: this.estadisticasService.getIdsProgramaPorNombre(),
      estadoSolicitudes: tolerante(this.estadisticasService.getEstadoSolicitudes(filtrosBackend), 'estado-solicitudes'),
      porProceso: tolerante(this.estadisticasService.getEstadisticasDetalladasPorProceso(filtrosBackend), 'estadisticas-por-proceso'),
      estudiantesPorPrograma: tolerante(this.estadisticasService.getEstudiantesPorPrograma(filtrosBackend), 'estudiantes-por-programa'),
      porPeriodo: tolerante(this.estadisticasService.getEstadisticasPorPeriodoMejoradas(filtrosBackend), 'por-periodo')
    }).pipe(takeUntil(this.destroy$)).subscribe(({ ids, estadoSolicitudes, porProceso, estudiantesPorPrograma }) => {
      const errorDeAcceso = errores.map(e => e.error).find(esErrorDeAcceso);
      if (errorDeAcceso) {
        this.manejarErrorDeAcceso(errorDeAcceso);
        return;
      }
      if (errores.length === 4) {
        this.loading = false;
        this.error = true;
        this.mostrarError('No se pudieron cargar las estadísticas. Por favor, inténtalo de nuevo.');
        return;
      }

      this.idsProgramaPorNombre = ids;
      try {
        const resumen = resumenDesdeEndpoints(estadoSolicitudes, porProceso, estudiantesPorPrograma, this.totalEstudiantes, this.idPrograma);
        this.mostrarResumen(resumen, errores.length > 0 ? null : 'Datos cargados usando endpoints alternativos');
        if (errores.length > 0) {
          this.mostrarError(`Datos cargados parcialmente. Algunos endpoints fallaron: ${errores.map(e => e.endpoint).join(', ')}`);
        }
      } catch {
        this.loading = false;
        this.error = true;
        this.mostrarError('Error al procesar los datos. Por favor, contacta al administrador.');
      }
    });
  }

  private cargarTotalEstudiantes(): void {
    this.loadingEstudiantes = true;
    this.estadisticasService.getTotalEstudiantes().pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        this.totalEstudiantes = response.totalEstudiantes;
        this.loadingEstudiantes = false;
        const kpi = this.kpis.find(k => k.titulo === TITULO_KPI_ESTUDIANTES);
        if (kpi) {
          kpi.valor = this.totalEstudiantes;
        }
      },
      error: (error: HttpErrorResponse) => {
        this.loadingEstudiantes = false;
        this.totalEstudiantes = 0;
        // Si es 401/403, el mensaje ya lo muestra cargarDatos()
        if (!esErrorDeAcceso(error)) {
          this.mostrarError('Error al cargar el total de estudiantes');
        }
      }
    });
  }

  /** 401/403: no mostrar el dashboard en ceros, sino un mensaje claro. */
  private manejarErrorDeAcceso(error: HttpErrorResponse): void {
    this.loading = false;
    this.error = true;
    this.errorMensaje = mensajeErrorDeAcceso(error);
    this.mostrarError(this.errorMensaje);
  }

  // ===== Gráficos =====

  private crearCharts(): void {
    if (!this.resumenCompleto) return;
    requestAnimationFrame(async () => {
      await this.crearChartProcesos();
      await this.crearChartTendencia();
      await this.crearChartDistribucion();
    });
  }

  /** Por proceso con el endpoint detallado; si falla, con el resumen. */
  private async crearChartProcesos(): Promise<void> {
    const datos = await this.consultar(this.estadisticasService.getEstadisticasDetalladasPorProceso(filtrosParaBackend(this.filtros)));
    if (datos?.estadisticasPorProceso) {
      this.dibujar('chartProcesos', graficoProcesos(datos.estadisticasPorProceso));
      return;
    }
    const procesos = this.resumenCompleto?.estadisticasPorProceso ?? [];
    if (procesos.length) {
      this.dibujar('chartProcesos', graficoProcesosDesdeResumen(
        procesos.map(p => formatearNombreProceso(p.nombreProceso)),
        procesos.map(p => p.totalSolicitudes)
      ));
    }
  }

  /** Sin datos mensuales no se dibuja nada inventado: la vista muestra un aviso. */
  private async crearChartTendencia(): Promise<void> {
    const datos = await this.consultar(this.estadisticasService.getEstadisticasPorPeriodoMejoradas(filtrosParaBackend(this.filtros)));
    this.tendenciaSinDatos = !datos?.porMes;
    if (datos?.porMes) {
      this.dibujar('chartTendencia', graficoTendencia(datos));
    }
  }

  /** Por programa con /por-programa; si falla, con el resumen. */
  private async crearChartDistribucion(): Promise<void> {
    const datos = await this.consultar(this.estadisticasService.getEstadisticasPorProgramaMejoradas(filtrosParaBackend(this.filtros)));
    if (datos?.solicitudesPorPrograma) {
      const porPrograma = datos.solicitudesPorPrograma;
      const programas = Object.keys(porPrograma);
      this.dibujar('chartDistribucion', graficoProgramas(programas, programas.map(p => porPrograma[p] || 0)));
      return;
    }
    const programas = this.resumenCompleto?.estadisticasPorPrograma ?? [];
    if (programas.length) {
      this.dibujar('chartDistribucion', graficoProgramas(programas.map(p => p.nombrePrograma), programas.map(p => p.totalSolicitudes)));
    }
  }

  /** La respuesta, o null si falla. */
  private consultar<T>(peticion$: Observable<T>): Promise<T | null> {
    return firstValueFrom(peticion$.pipe(catchError(() => of(null))));
  }

  /** Dibuja en el canvas con ese id, reemplazando el gráfico anterior. */
  private dibujar(nombre: NombreGrafico, config: ChartConfiguration): void {
    const canvas = document.getElementById(nombre) as HTMLCanvasElement | null;
    if (!canvas) return;
    this.destruirChart(nombre);
    try {
      this[nombre] = new Chart(canvas, config);
    } catch {
      // Canvas no disponible (p. ej. la vista se destruyó mientras cargaba)
    }
  }

  private destruirChart(nombre: NombreGrafico): void {
    this[nombre]?.destroy();
    this[nombre] = null;
  }

  private destruirCharts(): void {
    this.destruirChart('chartProcesos');
    this.destruirChart('chartTendencia');
    this.destruirChart('chartDistribucion');
  }

  // ===== Filtros =====

  onPeriodoChange(periodo: string): void {
    this.filtrosForm?.patchValue({ periodoAcademico: periodo });
  }

  /** "Período actual" se resuelve con el servicio de períodos antes de cargar. */
  aplicarFiltros(): void {
    if (!this.filtrosForm) return;
    const { filtros, periodoActual } = filtrosDelFormulario(this.filtrosForm.value);

    const aplicar = () => {
      this.filtros = filtros;
      this.cargarDatos(filtros);
      this.mostrarExito('Filtros aplicados correctamente');
    };

    if (!periodoActual) {
      aplicar();
      return;
    }
    this.periodosService.getPeriodoActual().pipe(takeUntil(this.destroy$)).subscribe({
      next: (periodo) => {
        if (periodo?.valor) {
          filtros.periodoAcademico = periodo.valor;
        }
        aplicar();
      },
      // Sin período actual, se carga sin filtro de período
      error: () => aplicar()
    });
  }

  limpiarFiltros(): void {
    this.filtrosForm?.reset({ proceso: '', idPrograma: '', periodoAcademico: '' });
    this.filtros = {};
    this.cargarDatos();
    this.mostrarExito('Filtros limpiados correctamente');
  }

  formatearNombreProceso(proceso: string): string {
    return formatearNombreProceso(proceso);
  }

  /** Recarga todo y recrea los gráficos. */
  actualizarDatos(): void {
    this.chartsCreados = false;
    this.destruirCharts();
    this.cargarDatos();
  }

  // ===== Exportación =====

  exportarPDF(): void {
    this.exportar(this.estadisticasService.exportarPDF(filtrosParaExportar(this.filtrosForm?.value)), 'pdf', 'PDF');
  }

  exportarExcel(): void {
    this.exportar(this.estadisticasService.exportarExcel(filtrosParaExportar(this.filtrosForm?.value)), 'xlsx', 'Excel');
  }

  private exportar(peticion$: Observable<Blob>, extension: string, formato: string): void {
    this.loading = true;
    this.mostrarExito(`Descargando reporte ${formato}...`);
    peticion$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => {
        this.loading = false;
        if (!blob || blob.size === 0) {
          this.mostrarError(`El archivo ${formato} está vacío o corrupto`);
          return;
        }
        descargarBlob(blob, `reporte_dashboard_general_${new Date().toISOString().split('T')[0]}.${extension}`);
        this.mostrarExito(`Reporte ${formato} del Dashboard General descargado exitosamente`);
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.mostrarError(esErrorDeAcceso(error) ? mensajeErrorDeAcceso(error) : `Error al exportar el reporte ${formato}`);
      }
    });
  }

  // ===== Plantilla =====

  trackByIndex(index: number): number {
    return index;
  }

  trackByProgramaId(index: number, programa: { id: number }): number {
    return programa.id || index;
  }

  trackByKpiTitulo(index: number, kpi: KPIData): string {
    return kpi.titulo || index.toString();
  }

  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', snackbarConfig(['success-snackbar']));
  }

  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', snackbarConfig(['error-snackbar']));
  }
}
