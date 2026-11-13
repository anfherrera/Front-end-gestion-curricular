import { Component, OnInit, OnDestroy, inject } from '@angular/core';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';

import { EstadisticasService } from '@core/services/estadisticas.service';
import { esErrorDeAcceso, mensajeErrorDeAcceso } from '@core/utils/http-error.utils';
import { PeriodoFiltroSelectorComponent } from '@shared/components/periodo-filtro-selector/periodo-filtro-selector.component';
import { descargarBlob } from '@core/utils/download.util';
import { AlertaCritica, AnalisisPrograma, CursosVeranoResponse, EstadisticasRecomendaciones, Recomendacion, TendenciaTemporal, TopMateria } from '@core/models/estadisticas/cursos-verano.model';
import { SnackbarService } from '@core/services/snackbar.service';
import { RecomendacionesCursosVeranoComponent } from './recomendaciones-cursos-verano/recomendaciones-cursos-verano.component';

interface FiltrosCursosVerano { periodoAcademico?: string; idPrograma?: number }

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-cursos-verano-dashboard',
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
    MatCheckboxModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    PeriodoFiltroSelectorComponent,
    RecomendacionesCursosVeranoComponent
  ],
  templateUrl: './cursos-verano-dashboard.component.html',
  styleUrls: ['../dashboard-comun.css', './cursos-verano-dashboard.component.css']
})
export class CursosVeranoDashboardComponent implements OnInit, OnDestroy {
  private estadisticasService = inject(EstadisticasService);
  private snackbar = inject(SnackbarService);
  private fb = inject(FormBuilder);

  // ===== PROPIEDADES DE DATOS =====
  data: CursosVeranoResponse | null = null;
  loading = true;
  error: string | null = null;
  ultimaActualizacion: Date = new Date();

  // ===== FILTROS =====
  filtrosForm: FormGroup | null = null;
  programasDisponibles: { id: number; nombre: string }[] = [];
  filtrosAplicados: FiltrosCursosVerano = {};

  // Datos del backend para las gráficas
  tendenciasTemporalesData: TendenciaTemporal[] = [];
  topMateriasData: TopMateria[] = [];
  analisisProgramaData: AnalisisPrograma[] = [];

  activeTab = 'analisis-actual';

  // Predicciones y recomendaciones
  recomendaciones: Recomendacion[] = [];
  alertasCriticas: AlertaCritica[] = [];
  estadisticasRecomendaciones: Partial<EstadisticasRecomendaciones> = {};

  // ===== GRÁFICOS =====
  chartMaterias: Chart | null = null;
  chartProgramas: Chart | null = null;
  chartTendencias: Chart | null = null;

  // ===== SUBSCRIPCIONES =====
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Inicializar formulario de filtros
    this.filtrosForm = this.fb.group({
      periodoAcademico: [''],
      idPrograma: ['']
    });
    
    // Cargar programas disponibles
    this.estadisticasService.getProgramasDisponibles()
      .pipe(takeUntil(this.destroy$))
      .subscribe(programas => this.programasDisponibles = programas);
    
    // Cargar primero las tendencias temporales de forma optimizada para una carga más rápida
    this.cargarTendenciasTemporalesOptimizadas();
    
    // Luego cargar todos los datos completos en segundo plano
    setTimeout(() => {
      this.cargarDatos();
    }, 100);
    
    // El usuario puede refrescar con el botón "Actualizar datos"
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destruirGraficos();
  }

  // ===== MÉTODOS DE CARGA DE DATOS =====

  /**
   * Obtiene los filtros actuales del formulario
   */
  obtenerFiltrosActuales(): FiltrosCursosVerano {
    if (!this.filtrosForm) {
      return {};
    }

    const formValue = this.filtrosForm.value;
    const filtros: FiltrosCursosVerano = {};
    
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
    this.estadisticasService.getCursosVeranoTendenciasTemporales(filtros).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        // Asignar solo los datos de tendencias temporales
        this.tendenciasTemporalesData = response.tendenciasTemporales || [];
        
        // Actualizar la gráfica inmediatamente
        if (this.tendenciasTemporalesData.length > 0) {
          this.crearGraficaTendencias();
        }
      },
      error: (error) => {
        // 401/403: cargarDatos() ya muestra el mensaje; no reintentar
        if (esErrorDeAcceso(error)) {
          return;
        }
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
        this.data = response;
        this.tendenciasTemporalesData = response.tendenciasTemporales || [];
        this.topMateriasData = response.topMaterias || [];
        this.analisisProgramaData = response.analisisPorPrograma || [];

        this.recomendaciones = response.recomendaciones || [];
        if (response.predicciones) {
          this.alertasCriticas = response.predicciones.alertasCriticas || [];
          this.estadisticasRecomendaciones = response.predicciones.estadisticasRecomendaciones || {};
        }
        this.ultimaActualizacion = new Date(); // Actualizar timestamp
        this.loading = false;
        
        // Cargar gráficas después de un pequeño delay
        setTimeout(() => {
          this.cargarGraficasAsync();
        }, 200);
      },
      error: (error) => {
        this.error = esErrorDeAcceso(error)
          ? mensajeErrorDeAcceso(error)
          : 'Error al cargar datos del backend. Verifique que el servidor esté ejecutándose.';
        this.loading = false;
      }
    });
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
    }
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

  // ===== MÉTODOS AUXILIARES =====

  destruirGraficos(): void {
    this.chartMaterias?.destroy();
    this.chartProgramas?.destroy();
    this.chartTendencias?.destroy();
    this.chartMaterias = this.chartProgramas = this.chartTendencias = null;
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

  /**
   * TrackBy function para programas
   */
  trackByProgramaId(index: number, programa: { id: number }): number {
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
  generarNombreArchivo(extension: 'pdf' | 'xlsx', filtros: FiltrosCursosVerano): string {
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
    this.exportar(this.estadisticasService.exportarReporteCursosVerano(filtros), this.generarNombreArchivo('pdf', filtros), 'PDF');
  }

  exportarExcel(): void {
    const filtros = this.obtenerFiltrosActuales();
    this.exportar(this.estadisticasService.exportarExcelCursosVerano(filtros), this.generarNombreArchivo('xlsx', filtros), 'Excel');
  }

  private exportar(peticion$: Observable<Blob>, nombreArchivo: string, formato: string): void {
    peticion$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => {
        if (blob && blob.size > 0) {
          descargarBlob(blob, nombreArchivo);
          this.snackbar.exito(`Reporte ${formato} descargado exitosamente`);
        } else {
          this.snackbar.error(`El archivo ${formato} está vacío o corrupto`);
        }
      },
      error: (error: HttpErrorResponse) => {
        const mensaje = esErrorDeAcceso(error) ? mensajeErrorDeAcceso(error) : `Error al exportar el reporte ${formato}`;
        this.snackbar.error(mensaje);
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

}
