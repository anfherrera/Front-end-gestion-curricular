import { PrediccionesGlobales } from './predicciones.model';

// Resumen, KPIs, procesos, programas y estados del dashboard general (/api/estadisticas).

export interface EstadisticasGlobales {
  totalSolicitudes: number;
  solicitudesAprobadas: number;
  solicitudesRechazadas: number;
  solicitudesEnviadas: number; // Campo obligatorio del backend
  solicitudesEnProceso: number;
  totalEstudiantes: number;
  totalProgramas: number;
  predicciones?: PrediccionesGlobales;
}

export interface EstadisticasProceso {
  nombreProceso: string;
  totalSolicitudes: number;
  aprobadas: number;
  rechazadas: number;
  enProceso: number;
  enviadas?: number;
  pendientes: number;
  porcentajeAprobacion: number;
  tendenciaMensual: TendenciaData[];
  distribucionPorPrograma: DistribucionPrograma[];
}

export interface EstadisticasPrograma {
  idPrograma: number | null; // id real (catálogo de programas); null si no se pudo resolver
  nombrePrograma: string;
  totalSolicitudes: number;
  distribucionPorProceso: DistribucionProceso[];
  tendenciaAnual: TendenciaData[];
}

export interface ResumenCompleto {
  estadisticasGlobales: EstadisticasGlobales;
  estadisticasPorProceso: EstadisticasProceso[];
  estadisticasPorPrograma: EstadisticasPrograma[];
  ultimaActualizacion: string;
}

/**
 * Interfaz para la respuesta del endpoint /api/estadisticas/resumen-completo
 * Estructura exacta que devuelve el backend
 */
export interface ResumenCompletoAPI {
  estadisticasGlobales: {
    totalSolicitudes: number;
    totalAprobadas: number;
    totalRechazadas: number;
    totalEnProceso: number;
    porcentajeAprobacion: number;
    porTipoProceso: Record<string, number>;
    porPrograma: Record<string, number>;
    fechaConsulta: string;
  };
  porTipoProceso: Record<string, {
    tipoProceso: string;
    totalSolicitudes: number;
    totalAprobadas: number;
    totalRechazadas: number;
    totalEnProceso: number;
    porcentajeAprobacion: number;
    porEstado: Record<string, number>;
  }>;
  porEstado: Record<string, {
    estado: string;
    totalSolicitudes: number;
    totalAprobadas: number;
    totalRechazadas: number;
    totalEnProceso: number;
    porTipoProceso?: Record<string, number>;
    porPrograma?: Record<string, number>;
  }>;
  totalProgramas: number;
  fechaGeneracion: string;
  filtrosAplicados?: {
    periodoAcademico?: string;
    idPrograma?: number;
  };
}

export interface TendenciaData {
  periodo: string;
  valor: number;
  fecha: string;
}

export interface DistribucionPrograma {
  nombrePrograma: string;
  cantidad: number;
  porcentaje: number;
}

export interface DistribucionProceso {
  nombreProceso: string;
  cantidad: number;
  porcentaje: number;
}

export interface FiltroEstadisticas {
  proceso?: string;
  idPrograma?: number; // Cambiado de 'programa' a 'idPrograma' para coincidir con el backend
  periodoAcademico?: string; // Filtro por período académico (ej: "2025-1" o "Segundo Período 2025")
  fechaInicio?: string; // Filtro por fecha de inicio (formato: "yyyy-MM-dd")
  fechaFin?: string; // Filtro por fecha de fin (formato: "yyyy-MM-dd")
}

export interface KPIData {
  titulo: string;
  valor: number;
  cambioPorcentual?: number;
  icono: string;
  color: string;
  descripcion?: string;
}

/**
 * Interfaz para la respuesta del endpoint de total de estudiantes
 */
export interface TotalEstudiantesResponse {
  totalEstudiantes: number;
  fechaConsulta: string;
  descripcion: string;
}

/**
 * Interfaz para la respuesta del endpoint de estudiantes por programa
 */
export interface EstudiantesPorProgramaResponse {
  estudiantesPorPrograma: Record<string, number>;
  fechaConsulta: string;
  descripcion: string;
}

/**
 * Interfaz para la respuesta del endpoint de estadísticas por proceso
 */
export interface EstadisticasPorProcesoResponse {
  estadisticasPorProceso: Record<string, ProcesoDetallado>;
  resumenComparativo?: {
    procesoMasEficiente: string;
    procesoMasRapido: string;
    eficienciaMaxima: number;
    demandaMaxima: number;
    tiempoMinimo: number;
    totalProcesos: number;
  };
  fechaConsulta: string;
  descripcion: string;
}

/** Un proceso en /estadisticas/estadisticas-por-proceso. */
export interface ProcesoDetallado {
  proceso: string;
  descripcion?: string;
  totalSolicitudes: number;
  aprobadas: number;
  rechazadas: number;
  enProceso: number;
  enviadas: number;
  /** Porcentaje de aprobación. */
  eficiencia?: number;
  tiempoPromedio?: number;
  tiempoMinimo?: number;
  tiempoMaximo?: number;
  tendencia?: string;
  color?: string;
  icono?: string;
}

/**
 * Interfaz para datos de programa en el dashboard
 */
export interface ProgramaData {
  nombre: string;
  cantidad: number;
  porcentaje?: number;
}

/**
 * Interfaz para información de un estado específico
 */
export interface EstadoInfo {
  cantidad: number;
  porcentaje: number;
  descripcion: string;
  color: string;
  icono: string;
  procesos?: Record<string, number>;  // Distribución por proceso
  programas?: Record<string, number>; // Distribución por programa
}

/**
 * Interfaz para la respuesta del endpoint de estado de solicitudes
 * Ahora usa resumenPorEstado en lugar de estados
 */
export interface EstadoSolicitudesResponse {
  totalSolicitudes: number;
  resumenPorEstado?: Record<string, EstadoInfo>;  // Campo actualizado del backend
  estados?: Record<string, EstadoInfo>;           // Legacy: Mantener para compatibilidad
  tasaResolucion?: number;                               // Tasa de resolución en nivel raíz
  fechaConsulta: string;
  descripcion?: string;
  analisis?: {                    // Sección de análisis (legacy)
    solicitudesPendientes: number;
    solicitudesCompletadas: number;
    tasaResolucion: number;
    estadoMasComun: string;
  };
}
