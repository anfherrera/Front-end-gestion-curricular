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
import { MatCheckboxModule } from '@angular/material/checkbox';
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
    MatSnackBarModule,
    MatCheckboxModule
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
    // Cargar primero las tendencias temporales de forma optimizada para una carga más rápida
    this.cargarTendenciasTemporalesOptimizadas();
    
    // Luego cargar todos los datos completos en segundo plano
    setTimeout(() => {
      this.cargarDatos();
    }, 100);
    
    // Actualizar cada 30 segundos
    this.intervalId = setInterval(() => {
      this.cargarDatos();
    }, 30000);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.destruirGraficos();
    
    // Limpiar el intervalo de actualización automática
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // ===== MÉTODOS DE CARGA DE DATOS =====

  /**
   * Carga solo las tendencias temporales de forma optimizada (MÁS RÁPIDO)
   */
  cargarTendenciasTemporalesOptimizadas(): void {
    console.log('📈 [OPTIMIZADO] Cargando tendencias temporales de forma optimizada...');
    
    this.estadisticasService.getCursosVeranoTendenciasTemporales().subscribe({
      next: (response) => {
        console.log('✅ [OPTIMIZADO] Tendencias temporales recibidas:', response);
        console.log('📊 [OPTIMIZADO] Datos:', response.tendenciasTemporales);
        
        // Asignar solo los datos de tendencias temporales
        this.tendenciasTemporalesData = response.tendenciasTemporales || [];
        
        // Actualizar la gráfica inmediatamente
        if (this.tendenciasTemporalesData.length > 0) {
          this.crearGraficaTendencias();
        }
        
        console.log('✅ [OPTIMIZADO] Tendencias temporales cargadas y gráfica actualizada');
      },
      error: (error) => {
        console.error('❌ [OPTIMIZADO] Error al cargar tendencias temporales:', error);
        // Fallback: cargar datos completos
        this.cargarDatos();
      }
    });
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = null;

    console.log('🔄 [DEBUG] Iniciando carga de datos...');
    console.log('🔄 [DEBUG] Pestaña activa actual:', this.activeTab);
    console.log('🏖️ [DEBUG] Llamando al endpoint...');
    console.log('🏖️ [DEBUG] URL del endpoint:', 'http://localhost:5000/api/estadisticas/cursos-verano');
    
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
        
        // Asignar datos reales del backend
        this.data = response;
        this.tendenciasTemporalesData = response.tendenciasTemporales || [];
        this.topMateriasData = response.topMaterias || [];
        this.analisisProgramaData = response.analisisPorPrograma || [];
        this.prediccionesData = response.predicciones || {};
        
        // ✅ ACTUALIZADO: Recomendaciones ahora están en el nivel superior
        this.recomendaciones = response.recomendaciones || [];
        if (response.predicciones) {
          this.alertasCriticas = response.predicciones.alertasCriticas || [];
          this.estadisticasRecomendaciones = response.predicciones.estadisticasRecomendaciones || {};
          this.totalRecomendaciones = this.estadisticasRecomendaciones.totalRecomendaciones || this.recomendaciones.length;
        }
        
        // Ordenar recomendaciones por prioridad
        this.ordenarPorPrioridad();
        
        console.log('✅ [DEBUG] Pestaña activa después de recibir datos:', this.activeTab);
        console.log('✅ [DEBUG] Datos mapeados:', {
          tendenciasTemporalesData: this.tendenciasTemporalesData,
          topMateriasData: this.topMateriasData,
          analisisProgramaData: this.analisisProgramaData
        });
        
        this.ultimaActualizacion = new Date(); // Actualizar timestamp
        this.loading = false;
        
        // Cargar gráficas después de un pequeño delay
        setTimeout(() => {
          this.cargarGraficasAsync();
        }, 200);
      },
      error: (error) => {
        console.error('❌ [DEBUG] Error al conectar con el backend:', error);
        console.error('❌ [DEBUG] URL del endpoint:', 'http://localhost:5000/api/estadisticas/cursos-verano');
        this.error = 'Error al cargar datos del backend. Verifique que el servidor esté ejecutándose.';
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
        APROBADA: 4,
        ENVIADA: 2,
        APROBADA_FUNCIONARIO: 2,
        APROBADA_COORDINADOR: 0,
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
        programasConTendenciaDecreciente: [],
        prediccionesTemporales: {
          mesPico: 'Marzo',
          demandaActualMesPico: 4,
          demandaEstimadaMesPico: 6,
          mesesRecomendados: ['Marzo', 'Abril', 'Mayo']
        },
        // ❌ ELIMINADO: recomendacionesFuturas (ahora está en nivel superior como 'recomendaciones')
        confiabilidad: 'ALTA',
        fechaPrediccion: new Date().toISOString()
        // ❌ ELIMINADO: metodologia (campo técnico innecesario)
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

  refrescarDatos(): void {
    console.log('🔄 Refrescando datos de cursos de verano...');
    this.cargarDatos();
  }

  // Método para cambiar de pestaña
  cambiarTab(tab: string): void {
    this.activeTab = tab;
    console.log('🔄 [DEBUG] Cambiando a pestaña:', tab);
    
    // Solo cargar gráficas si NO es recomendaciones
    if (tab !== 'recomendaciones') {
      setTimeout(() => {
        this.cargarGraficasAsync();
      }, 100);
    } else {
      console.log('ℹ️ Pestaña de recomendaciones, no se cargan gráficos');
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
    console.log('🔍 [DEBUG] Verificando conexión con el backend...');
    console.log('🔍 [DEBUG] URL del endpoint:', 'http://localhost:5000/api/estadisticas/cursos-verano');
    
    // Hacer una llamada directa para verificar la conexión
    fetch('http://localhost:5000/api/estadisticas/cursos-verano')
      .then(response => {
        console.log('🔍 [DEBUG] Respuesta del servidor:', response.status, response.statusText);
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      })
      .then(data => {
        console.log('✅ [DEBUG] Datos recibidos del backend:', data);
        console.log('✅ [DEBUG] Estructura de datos:', {
          topMaterias: data.topMaterias,
          analisisPorPrograma: data.analisisPorPrograma,
          tendenciasTemporales: data.tendenciasTemporales,
          predicciones: data.predicciones
        });
      })
      .catch(error => {
        console.error('❌ [DEBUG] Error de conexión:', error);
        console.error('❌ [DEBUG] Verifique que el servidor backend esté ejecutándose en http://localhost:5000');
      });
  }

  /**
   * Prueba la diferencia de velocidad entre carga completa y optimizada
   */
  probarVelocidadCarga(): void {
    console.log('⚡ [PRUEBA DE VELOCIDAD] Iniciando comparación de velocidad...');
    
    // Prueba 1: Carga completa
    console.time('🔄 Carga Completa');
    const inicioCompleta = performance.now();
    
    this.estadisticasService.getCursosVeranoEstadisticas().subscribe({
      next: (response) => {
        const finCompleta = performance.now();
        const tiempoCompleta = finCompleta - inicioCompleta;
        console.timeEnd('🔄 Carga Completa');
        console.log(`🔄 [PRUEBA] Carga completa: ${tiempoCompleta.toFixed(2)}ms`);
        
        // Prueba 2: Carga optimizada
        console.time('⚡ Carga Optimizada');
        const inicioOptimizada = performance.now();
        
        this.estadisticasService.getCursosVeranoTendenciasTemporales().subscribe({
          next: (responseOpt) => {
            const finOptimizada = performance.now();
            const tiempoOptimizada = finOptimizada - inicioOptimizada;
            console.timeEnd('⚡ Carga Optimizada');
            console.log(`⚡ [PRUEBA] Carga optimizada: ${tiempoOptimizada.toFixed(2)}ms`);
            
            // Comparación
            const mejora = ((tiempoCompleta - tiempoOptimizada) / tiempoCompleta) * 100;
            console.log(`🚀 [RESULTADO] Mejora de velocidad: ${mejora.toFixed(1)}% más rápido`);
            
            this.snackBar.open(
              `⚡ Carga optimizada ${mejora.toFixed(1)}% más rápida (${tiempoOptimizada.toFixed(0)}ms vs ${tiempoCompleta.toFixed(0)}ms)`, 
              'Cerrar', 
              { duration: 5000, panelClass: ['success-snackbar'] }
            );
          },
          error: (error) => {
            console.error('❌ Error en carga optimizada:', error);
          }
        });
      },
      error: (error) => {
        console.error('❌ Error en carga completa:', error);
      }
    });
  }

  // ===== MÉTODOS PARA ACTUALIZAR GRÁFICAS CON DATOS REALES =====

  // Método para cargar gráficas de forma asíncrona
  cargarGraficasAsync(): void {
    console.log('📊 Cargando gráficas de forma asíncrona...');
    console.log('📊 Pestaña activa:', this.activeTab);
    
    // Cargar gráficas después de que los datos estén listos
    setTimeout(() => {
      this.inicializarGraficas();
    }, 100); // Pequeño delay para asegurar que el DOM esté listo
  }

  inicializarGraficas(): void {
    console.log('📊 Inicializando gráficas...');
    console.log('📊 Pestaña activa:', this.activeTab);
    
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
      console.log('ℹ️ Pestaña de recomendaciones, saltando creación de gráficos');
    }
  }

  actualizarGraficas(): void {
    console.log('📊 Actualizando gráficas con datos del backend...');
    
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
    console.log('📈 Actualizando gráfica de tendencias temporales con datos:', this.tendenciasTemporalesData);
    
    // Mapear datos del backend a la estructura de la gráfica
    const labels = this.tendenciasTemporalesData.map(t => t.mes);
    const data = this.tendenciasTemporalesData.map(t => t.solicitudes);
    
    console.log('📈 Labels:', labels);
    console.log('📈 Data:', data);
    
    // Si existe la gráfica, actualizarla
    if (this.chartTendencias) {
      this.chartTendencias.data.labels = labels;
      this.chartTendencias.data.datasets[0].data = data;
      this.chartTendencias.update();
    }
  }

  actualizarGraficaTopMaterias(): void {
    console.log('🍩 Actualizando gráfica de top materias con datos:', this.topMateriasData);
    
    const labels = this.topMateriasData.map(m => m.nombre);
    const data = this.topMateriasData.map(m => m.solicitudes);
    
    console.log('🍩 Labels:', labels);
    console.log('🍩 Data:', data);
    
    // Si existe la gráfica, actualizarla
    if (this.chartMaterias) {
      this.chartMaterias.data.labels = labels;
      this.chartMaterias.data.datasets[0].data = data;
      this.chartMaterias.update();
    }
  }

  actualizarGraficaAnalisisPrograma(): void {
    console.log('📊 Actualizando gráfica de análisis por programa con datos:', this.analisisProgramaData);
    
    const labels = this.analisisProgramaData.map(p => p.nombre);
    const data = this.analisisProgramaData.map(p => p.solicitudes);
    
    console.log('📊 Labels:', labels);
    console.log('📊 Data:', data);
    
    // Si existe la gráfica, actualizarla
    if (this.chartProgramas) {
      this.chartProgramas.data.labels = labels;
      this.chartProgramas.data.datasets[0].data = data;
      this.chartProgramas.update();
    }
  }

  // ===== MÉTODOS PARA CREAR GRÁFICAS =====

  crearGraficaTendencias(): void {
    console.log('📈 Creando gráfica de tendencias temporales...');
    
    const ctx = document.getElementById('tendenciasChart') as HTMLCanvasElement;
    if (!ctx) {
      console.log('❌ No se encontró el canvas tendenciasChart');
      return;
    }
    
    // Destruir gráfica anterior si existe
    if (this.chartTendencias) {
      this.chartTendencias.destroy();
    }
    
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
    
    console.log('✅ Gráfica de tendencias creada exitosamente');
  }

  crearGraficaTopMaterias(): void {
    console.log('🍩 Creando gráfica de top materias...');
    
    const ctx = document.getElementById('materiasChart') as HTMLCanvasElement;
    if (!ctx) {
      console.log('❌ No se encontró el canvas materiasChart');
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
    
    console.log('✅ Gráfica de materias creada exitosamente');
  }

  crearGraficaAnalisisPrograma(): void {
    console.log('📊 Creando gráfica de análisis por programa...');
    
    const ctx = document.getElementById('programasChart') as HTMLCanvasElement;
    if (!ctx) {
      console.log('❌ No se encontró el canvas programasChart');
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
    
    console.log('✅ Gráfica de programas creada exitosamente');
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
    console.log('🔄 Toggle expandir:', id, 'Expandida:', this.expandidas.has(id));
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

  // ===== MÉTODOS DE EXPORTACIÓN =====

  exportarPDF(): void {
    console.log('📄 [DEBUG] Iniciando exportación a PDF de Cursos de Verano...');
    
    this.estadisticasService.exportarReporteCursosVerano().subscribe({
      next: (blob: Blob) => {
        console.log('✅ [DEBUG] PDF recibido del backend:', blob);
        console.log('📊 [DEBUG] Tipo de archivo:', blob.type);
        console.log('📊 [DEBUG] Tamaño del archivo:', blob.size, 'bytes');
        
        // ✅ Verificar que sea un blob válido
        if (blob && blob.size > 0) {
          console.log('✅ [DEBUG] Blob válido para PDF');
          
          // Crear URL del blob
          const url = window.URL.createObjectURL(blob);
          
          // Crear enlace de descarga
          const link = document.createElement('a');
          link.href = url;
          link.download = `reporte_cursos_verano_${new Date().toISOString().split('T')[0]}.pdf`;
          
          // Simular clic para descargar
          document.body.appendChild(link);
          link.click();
          
          // Limpiar
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          this.snackBar.open('✅ Reporte PDF descargado exitosamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        } else {
          console.error('❌ [DEBUG] El archivo PDF está vacío o corrupto');
          this.snackBar.open('❌ El archivo PDF está vacío o corrupto', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('❌ [DEBUG] Error al exportar PDF:', error);
        
        this.snackBar.open('❌ Error al exportar el reporte PDF', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  exportarExcel(): void {
    console.log('📊 [DEBUG] Iniciando exportación a Excel de Cursos de Verano...');
    
    this.estadisticasService.exportarExcelCursosVerano().subscribe({
      next: (blob: Blob) => {
        console.log('✅ [DEBUG] Excel recibido del backend:', blob);
        console.log('📊 [DEBUG] Tipo de archivo:', blob.type);
        console.log('📊 [DEBUG] Tamaño del archivo:', blob.size, 'bytes');
        
        // ✅ Verificar que sea un blob válido
        if (blob && blob.size > 0) {
          console.log('✅ [DEBUG] Blob válido para Excel');
          
          // Crear URL del blob
          const url = window.URL.createObjectURL(blob);
          
          // Crear enlace de descarga
          const link = document.createElement('a');
          link.href = url;
          link.download = `reporte_cursos_verano_${new Date().toISOString().split('T')[0]}.xlsx`;
          
          // Simular clic para descargar
          document.body.appendChild(link);
          link.click();
          
          // Limpiar
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          this.snackBar.open('✅ Reporte Excel descargado exitosamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        } else {
          console.error('❌ [DEBUG] El archivo Excel está vacío o corrupto');
          this.snackBar.open('❌ El archivo Excel está vacío o corrupto', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        console.error('❌ [DEBUG] Error al exportar Excel:', error);
        
        this.snackBar.open('❌ Error al exportar el reporte Excel', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
