// Estadísticas por programa y por período (endpoints "mejorados").

/**
 * Interfaz para estadísticas por programa mejoradas
 */
export interface ProgramaEstadisticasMejoradas {
  totalSolicitudes: number;
  estudiantes: number;
  porcentaje: number;
  eficiencia: number;             // Tasa de aprobación
  tiempoPromedio: number;         // Días de procesamiento
  procesos: Record<string, number>;  // Distribución por proceso
  color: string;                  // Color específico
  icono: string;                  // Icono específico
}

export interface EstadisticasPorProgramaMejoradasResponse {
  porPrograma: Record<string, ProgramaEstadisticasMejoradas>;
  solicitudesPorPrograma?: Record<string, number>;  // Mapa directo de programa -> cantidad
  estudiantesPorPrograma?: Record<string, number>;  // Mapa directo de programa -> cantidad
  analisis: {                     // Sección de análisis
    programaMasActivo: string;
    programaMasEficiente: string;
    eficienciaMaxima: number;
    totalProgramas: number;
  };
  fechaConsulta: string;
  descripcion: string;
}

/**
 * Interfaz para estadísticas por período mejoradas
 */
export interface PeriodoEstadisticasMejoradas {
  mes?: string;
  total: number;
  aprobadas?: number;
  rechazadas?: number;
  enviadas?: number;
  descripcion?: string;
  /** Los meses sin solicitudes no traen porcentaje, tiempo ni procesos. */
  porcentaje?: number;
  eficiencia: number;             // Tasa de aprobación
  tiempoPromedio?: number;        // Días de procesamiento
  procesos?: Record<string, number>;  // Distribución por proceso
  color: string;
  icono: string;
}

export interface EstadisticasPorPeriodoMejoradasResponse {
  porMes: Record<string, PeriodoEstadisticasMejoradas>;
  mesesOrdenados?: PeriodoEstadisticasMejoradas[];  // Todos los meses, en orden
  todosLosMeses?: string[];  // Array con nombres de todos los meses (Enero a Diciembre)
  tendencias: {                   // Sección de tendencias
    tendenciaGeneral: string;
    crecimientoPromedio: number;
    mesMasActivo: string;
    promedioMensual: number;
  };
  fechaConsulta: string;
  descripcion: string;
}
