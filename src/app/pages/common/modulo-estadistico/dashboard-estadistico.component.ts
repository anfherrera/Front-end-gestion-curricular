import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  OnInit,
  OnDestroy,
  inject,
  DestroyRef,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Chart, registerables } from 'chart.js';
import type { ChartConfiguration } from 'chart.js';
import { Observable, catchError, firstValueFrom, forkJoin, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { EstadisticasService } from '@core/services/estadisticas.service';
import { PeriodosAcademicosService } from '@core/services/periodos-academicos.service';
import { esErrorDeAcceso, mensajeErrorDeAcceso } from '@core/utils/http-error.utils';
import { descargarBlob } from '@core/utils/download.util';
import { LoadingSpinnerComponent } from '@shared/components/loading-spinner/loading-spinner.component';
import { EstudiantesPorProgramaComponent } from './components/estudiantes-por-programa/estudiantes-por-programa.component';
import { EstadisticasPorProcesoComponent } from './components/estadisticas-por-proceso/estadisticas-por-proceso.component';
import { EstadisticasPorEstadoComponent } from './components/estadisticas-por-estado/estadisticas-por-estado.component';
import { TendenciasComparativasComponent } from './components/tendencias-comparativas/tendencias-comparativas.component';
import { PeriodoFiltroSelectorComponent } from '@shared/components/periodo-filtro-selector/periodo-filtro-selector.component';
import { FiltroEstadisticas, KPIData, ResumenCompleto } from '@core/models/estadisticas/generales.model';
import {
  TITULO_KPI_ESTUDIANTES,
  filtrosDelFormulario,
  filtrosParaBackend,
  filtrosParaExportar,
  formatearNombreProceso,
  generarKPIs,
  resumenDesdeAPI,
  resumenDesdeEndpoints,
} from './dashboard-estadistico.datos';
import {
  graficoProcesos,
  graficoProcesosDesdeResumen,
  graficoProgramas,
  graficoTendencia,
} from './dashboard-estadistico.graficos';
import { SnackbarService } from '@core/services/snackbar.service';

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
    MatFormFieldModule,
    MatInputModule,
    LoadingSpinnerComponent,
    EstudiantesPorProgramaComponent,
    EstadisticasPorProcesoComponent,
    EstadisticasPorEstadoComponent,
    TendenciasComparativasComponent,
    PeriodoFiltroSelectorComponent,
  ],
  templateUrl: './dashboard-estadistico.component.html',
  styleUrls: ['./dashboard-comun.css', './dashboard-estadistico.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardEstadisticoComponent implements OnInit, OnDestroy {
  private estadisticasService = inject(EstadisticasService);
  private periodosService = inject(PeriodosAcademicosService);
  private snackbar = inject(SnackbarService);
  private fb = inject(FormBuilder);
  private locale = inject(LOCALE_ID);

  readonly loading = signal(false);
  /** Exportando un reporte: solo deshabilita los botones. No usa `loading`, que quitaría los <canvas> de los gráficos. */
  readonly exportando = signal(false);
  readonly error = signal(false);
  readonly errorMensaje = signal<string | null>(null);

  readonly resumenCompleto = signal<ResumenCompleto | null>(null);
  totalEstudiantes = 0;
  readonly loadingEstudiantes = signal(false);

  /** Filtros aplicados; también los reciben los componentes hijos. */
  readonly filtros = signal<FiltroEstadisticas>({});
  filtrosForm: FormGroup | null = null;
  procesosDisponibles: string[] = [];
  readonly programasDisponibles = signal<{ id: number; nombre: string }[]>([]);

  readonly kpis = signal<KPIData[]>([]);

  chartProcesos: Chart | null = null;
  chartTendencia: Chart | null = null;
  chartDistribucion: Chart | null = null;
  readonly tendenciaSinDatos = signal(false);

  private readonly destroyRef = inject(DestroyRef);
  /** Tras la primera carga los gráficos se recrean en vez de crearse. */
  private chartsCreados = false;
  /** Catálogo nombre de programa -> id_programa real. */
  private idsProgramaPorNombre = new Map<string, number>();

  ngOnInit(): void {
    // El formulario se crea aquí y no en el constructor para evitar problemas de hidratación
    this.filtrosForm = this.fb.group({
      proceso: [''],
      idPrograma: [''],
      periodoAcademico: [''],
    });

    this.procesosDisponibles = this.estadisticasService.getProcesosDisponibles();
    this.estadisticasService
      .getProgramasDisponibles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((programas) => this.programasDisponibles.set(programas));

    this.cargarDatos();
  }

  ngOnDestroy(): void {
    this.destruirCharts();
  }

  // ===== Carga de datos =====

  cargarDatos(filtros: FiltroEstadisticas = {}): void {
    this.loading.set(true);
    this.error.set(false);
    this.errorMensaje.set(null);

    // Primero el catálogo de programas (en caché tras la primera vez) para resolver ids reales
    this.estadisticasService
      .getIdsProgramaPorNombre()
      .pipe(
        switchMap((ids) => {
          this.idsProgramaPorNombre = ids;
          return this.estadisticasService.getResumenCompleto(filtrosParaBackend(filtros));
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (resumenAPI) => {
          try {
            this.mostrarResumen(
              resumenDesdeAPI(resumenAPI, this.idPrograma),
              'Datos cargados correctamente desde el backend'
            );
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
        },
      });

    this.cargarTotalEstudiantes();
  }

  private idPrograma = (nombrePrograma: string): number | null =>
    this.idsProgramaPorNombre.get(EstadisticasService.normalizarNombrePrograma(nombrePrograma)) ?? null;

  /** KPIs y gráficos con el resumen nuevo; el mensaje de éxito solo en la primera carga. */
  private mostrarResumen(resumen: ResumenCompleto, mensajePrimeraCarga: string | null): void {
    this.resumenCompleto.set(resumen);
    this.kpis.set(generarKPIs(resumen, this.totalEstudiantes));

    const primeraCarga = !this.chartsCreados;
    if (!primeraCarga) {
      this.destruirCharts();
    }
    this.crearCharts();
    this.chartsCreados = true;

    this.loading.set(false);
    this.error.set(false);
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
      peticion$.pipe(
        catchError((error) => {
          errores.push({ endpoint, error });
          return of(null);
        })
      );

    forkJoin({
      ids: this.estadisticasService.getIdsProgramaPorNombre(),
      estadoSolicitudes: tolerante(this.estadisticasService.getEstadoSolicitudes(filtrosBackend), 'estado-solicitudes'),
      porProceso: tolerante(
        this.estadisticasService.getEstadisticasDetalladasPorProceso(filtrosBackend),
        'estadisticas-por-proceso'
      ),
      estudiantesPorPrograma: tolerante(
        this.estadisticasService.getEstudiantesPorPrograma(filtrosBackend),
        'estudiantes-por-programa'
      ),
      porPeriodo: tolerante(this.estadisticasService.getEstadisticasPorPeriodoMejoradas(filtrosBackend), 'por-periodo'),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ ids, estadoSolicitudes, porProceso, estudiantesPorPrograma }) => {
        const errorDeAcceso = errores.map((e) => e.error).find(esErrorDeAcceso);
        if (errorDeAcceso) {
          this.manejarErrorDeAcceso(errorDeAcceso);
          return;
        }
        if (errores.length === 4) {
          this.loading.set(false);
          this.error.set(true);
          this.mostrarError('No se pudieron cargar las estadísticas. Por favor, inténtelo de nuevo.');
          return;
        }

        this.idsProgramaPorNombre = ids;
        try {
          const resumen = resumenDesdeEndpoints(
            estadoSolicitudes,
            porProceso,
            estudiantesPorPrograma,
            this.totalEstudiantes,
            this.idPrograma
          );
          this.mostrarResumen(resumen, errores.length > 0 ? null : 'Datos cargados usando endpoints alternativos');
          if (errores.length > 0) {
            this.mostrarError(
              `Datos cargados parcialmente. Algunos endpoints fallaron: ${errores.map((e) => e.endpoint).join(', ')}`
            );
          }
        } catch {
          this.loading.set(false);
          this.error.set(true);
          this.mostrarError('Error al procesar los datos. Por favor, contacte al administrador.');
        }
      });
  }

  private cargarTotalEstudiantes(): void {
    this.loadingEstudiantes.set(true);
    this.estadisticasService
      .getTotalEstudiantes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.totalEstudiantes = response.totalEstudiantes;
          this.loadingEstudiantes.set(false);
          const total = this.totalEstudiantes;
          this.kpis.update((kpis) =>
            kpis.map((k) => (k.titulo === TITULO_KPI_ESTUDIANTES ? { ...k, valor: total } : k))
          );
        },
        error: (error: HttpErrorResponse) => {
          this.loadingEstudiantes.set(false);
          this.totalEstudiantes = 0;
          // Si es 401/403, el mensaje ya lo muestra cargarDatos()
          if (!esErrorDeAcceso(error)) {
            this.mostrarError('Error al cargar el total de estudiantes');
          }
        },
      });
  }

  /** 401/403: no mostrar el dashboard en ceros, sino un mensaje claro. */
  private manejarErrorDeAcceso(error: HttpErrorResponse): void {
    this.loading.set(false);
    this.error.set(true);
    const mensaje = mensajeErrorDeAcceso(error);
    this.errorMensaje.set(mensaje);
    this.mostrarError(mensaje);
  }

  // ===== Gráficos =====

  private crearCharts(): void {
    if (!this.resumenCompleto()) return;
    requestAnimationFrame(async () => {
      await this.crearChartProcesos();
      await this.crearChartTendencia();
      await this.crearChartDistribucion();
    });
  }

  /** Por proceso con el endpoint detallado; si falla, con el resumen. */
  private async crearChartProcesos(): Promise<void> {
    const datos = await this.consultar(
      this.estadisticasService.getEstadisticasDetalladasPorProceso(filtrosParaBackend(this.filtros()))
    );
    if (datos?.estadisticasPorProceso) {
      this.dibujar('chartProcesos', graficoProcesos(datos.estadisticasPorProceso, this.locale));
      return;
    }
    const procesos = this.resumenCompleto()?.estadisticasPorProceso ?? [];
    if (procesos.length) {
      this.dibujar(
        'chartProcesos',
        graficoProcesosDesdeResumen(
          procesos.map((p) => formatearNombreProceso(p.nombreProceso)),
          procesos.map((p) => p.totalSolicitudes),
          this.locale
        )
      );
    }
  }

  /** Sin datos mensuales no se dibuja nada inventado: la vista muestra un aviso. */
  private async crearChartTendencia(): Promise<void> {
    const datos = await this.consultar(
      this.estadisticasService.getEstadisticasPorPeriodoMejoradas(filtrosParaBackend(this.filtros()))
    );
    this.tendenciaSinDatos.set(!datos?.porMes);
    if (datos?.porMes) {
      this.dibujar('chartTendencia', graficoTendencia(datos));
    }
  }

  /** Por programa con /por-programa; si falla, con el resumen. */
  private async crearChartDistribucion(): Promise<void> {
    const datos = await this.consultar(
      this.estadisticasService.getEstadisticasPorProgramaMejoradas(filtrosParaBackend(this.filtros()))
    );
    if (datos?.solicitudesPorPrograma) {
      const porPrograma = datos.solicitudesPorPrograma;
      const programas = Object.keys(porPrograma);
      this.dibujar(
        'chartDistribucion',
        graficoProgramas(
          programas,
          programas.map((p) => porPrograma[p] || 0),
          this.locale
        )
      );
      return;
    }
    const programas = this.resumenCompleto()?.estadisticasPorPrograma ?? [];
    if (programas.length) {
      this.dibujar(
        'chartDistribucion',
        graficoProgramas(
          programas.map((p) => p.nombrePrograma),
          programas.map((p) => p.totalSolicitudes),
          this.locale
        )
      );
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
      this.filtros.set(filtros);
      this.cargarDatos(filtros);
      this.mostrarExito('Filtros aplicados correctamente');
    };

    if (!periodoActual) {
      aplicar();
      return;
    }
    this.periodosService
      .getPeriodoActual()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (periodo) => {
          if (periodo?.valor) {
            filtros.periodoAcademico = periodo.valor;
          }
          aplicar();
        },
        // Sin período actual, se carga sin filtro de período
        error: () => aplicar(),
      });
  }

  limpiarFiltros(): void {
    this.filtrosForm?.reset({ proceso: '', idPrograma: '', periodoAcademico: '' });
    this.filtros.set({});
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
    this.exportar(
      this.estadisticasService.exportarExcel(filtrosParaExportar(this.filtrosForm?.value)),
      'xlsx',
      'Excel'
    );
  }

  private exportar(peticion$: Observable<Blob>, extension: string, formato: string): void {
    this.exportando.set(true);
    this.mostrarExito(`Descargando reporte ${formato}...`);
    peticion$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob) => {
        this.exportando.set(false);
        if (!blob || blob.size === 0) {
          this.mostrarError(`El archivo ${formato} está vacío o corrupto`);
          return;
        }
        descargarBlob(blob, `reporte_dashboard_general_${new Date().toISOString().split('T')[0]}.${extension}`);
        this.mostrarExito(`Reporte ${formato} del Dashboard General descargado exitosamente`);
      },
      error: (error: HttpErrorResponse) => {
        this.exportando.set(false);
        this.mostrarError(
          esErrorDeAcceso(error) ? mensajeErrorDeAcceso(error) : `Error al exportar el reporte ${formato}`
        );
      },
    });
  }

  // ===== Plantilla =====

  private mostrarExito(mensaje: string): void {
    this.snackbar.exito(mensaje);
  }

  private mostrarError(mensaje: string): void {
    this.snackbar.error(mensaje);
  }
}
