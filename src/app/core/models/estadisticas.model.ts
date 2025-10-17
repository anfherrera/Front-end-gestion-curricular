export interface EstadisticasGlobales {
  totalSolicitudes: number;
  solicitudesAprobadas: number;
  solicitudesRechazadas: number;
  solicitudesEnProceso: number;
  totalEstudiantes: number;
  totalProgramas: number;
}

export interface EstadisticasProceso {
  nombreProceso: string;
  totalSolicitudes: number;
  aprobadas: number;
  rechazadas: number;
  enProceso: number;
  pendientes: number;
  porcentajeAprobacion: number;
  tendenciaMensual: TendenciaData[];
  distribucionPorPrograma: DistribucionPrograma[];
}

export interface EstadisticasPrograma {
  idPrograma: number;
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
  programa?: number;
  fechaInicio?: string;
  fechaFin?: string;
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
 * Interfaz para filtros dinámicos del dashboard
 */
export interface FiltrosDashboard {
  proceso?: string;
  programa?: number;
  fechaInicio?: Date;
  fechaFin?: Date;
  estado?: string;
}

/**
 * Interfaz para la respuesta del API de estadísticas globales
 */
export interface EstadisticasGlobalesAPI {
  fechaConsulta: string;
  totalSolicitudes: number;
  totalAprobadas: number;
  totalEnProceso: number;
  totalRechazadas: number;
  porcentajeAprobacion: number;
  porEstado: {
    [key: string]: number;
  };
  porTipoProceso: {
    [key: string]: number;
  };
  porPrograma: {
    [key: string]: number;
  };
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
  estudiantesPorPrograma: { [programa: string]: number };
  fechaConsulta: string;
  descripcion: string;
}

/**
 * Interfaz para la respuesta del endpoint de estadísticas por proceso
 */
export interface EstadisticasPorProcesoResponse {
  estadisticasPorProceso: { [proceso: string]: any };
  fechaConsulta: string;
  descripcion: string;
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
 * Interfaz consolidada para todas las estadísticas
 */
export interface EstadisticasCompletas {
  totalEstudiantes: number;
  estudiantesPorPrograma: { [programa: string]: number };
  estadisticasPorProceso: { [proceso: string]: any };
  fechaConsulta: string;
  loading: boolean;
  error?: string;
}