export interface EstadisticasGlobales {
  totalSolicitudes: number;
  solicitudesAprobadas: number;
  solicitudesRechazadas: number;
  solicitudesEnviadas: number; // ✅ Campo obligatorio del backend
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
  periodoAcademico?: string; // ✨ NUEVO: Filtro por período académico (ej: "2025-1")
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
  totalEnviadas: number; // ✅ Campo del backend
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
  predicciones?: PrediccionesGlobales;
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
 * Interfaz para información de un estado específico
 */
export interface EstadoInfo {
  cantidad: number;
  porcentaje: number;
  descripcion: string;
  color: string;
  icono: string;
  procesos?: { [proceso: string]: number };  // Distribución por proceso
  programas?: { [programa: string]: number }; // Distribución por programa
}

/**
 * Interfaz para la respuesta del endpoint de estado de solicitudes
 */
export interface EstadoSolicitudesResponse {
  totalSolicitudes: number;
  estados: { [estado: string]: EstadoInfo };
  fechaConsulta: string;
  descripcion: string;
  analisis?: {                    // NUEVO: Sección de análisis
    solicitudesPendientes: number;
    solicitudesCompletadas: number;
    tasaResolucion: number;
    estadoMasComun: string;
  };
}

// ===== INTERFACES PARA ENDPOINTS MEJORADOS =====

/**
 * Interfaz para estadísticas por programa mejoradas
 */
export interface ProgramaEstadisticasMejoradas {
  totalSolicitudes: number;
  estudiantes: number;
  porcentaje: number;
  eficiencia: number;             // Tasa de aprobación
  tiempoPromedio: number;         // Días de procesamiento
  procesos: { [proceso: string]: number };  // Distribución por proceso
  color: string;                  // Color específico
  icono: string;                  // Icono específico
}

export interface EstadisticasPorProgramaMejoradasResponse {
  porPrograma: { [programa: string]: ProgramaEstadisticasMejoradas };
  analisis: {                     // NUEVO: Sección de análisis
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
  solicitudes: number;
  estudiantes: number;
  porcentaje: number;
  eficiencia: number;             // NUEVO: Tasa de aprobación
  tiempoPromedio: number;         // NUEVO: Días de procesamiento
  procesos: { [proceso: string]: number };  // NUEVO: Distribución por proceso
  color: string;                  // NUEVO: Color específico
  icono: string;                  // NUEVO: Icono específico
}

export interface EstadisticasPorPeriodoMejoradasResponse {
  porMes: { [mes: string]: PeriodoEstadisticasMejoradas };
  tendencias: {                   // NUEVO: Sección de tendencias
    tendenciaGeneral: string;
    crecimientoPromedio: number;
    mesMasActivo: string;
    promedioMensual: number;
  };
  fechaConsulta: string;
  descripcion: string;
}

// ===== INTERFACES PARA TENDENCIAS Y COMPARATIVAS =====

export interface CrecimientoTemporal {
  tendenciaSolicitudes: string;
  crecimientoSolicitudes: number;
  tendenciaEstudiantes: string;
  crecimientoEstudiantes: number;
  mesesAnalizados: number;
}

export interface ComparativaProcesos {
  procesoMasDemandado: string;
  procesoMasEficiente: string | null;
  eficienciaMasAlta: number;
  demandaMasAlta: number;
  solicitudesPorProceso: { [proceso: string]: number };
  aprobadasPorProceso: { [proceso: string]: number };
}

export interface ComparativaProgramas {
  programaMasActivo: string;
  programaConMasEstudiantes: string;
  maxSolicitudes: number;
  maxEstudiantes: number;
  solicitudesPorPrograma: { [programa: string]: number };
  estudiantesPorPrograma: { [programa: string]: number };
}

export interface ResumenEstrategico {
  totalSolicitudes: number;
  totalEstudiantes: number;
  totalProgramas: number;
  periodoAnalizado: string;
  recomendacionEstrategica: string;
}

export interface TendenciasComparativasResponse {
  fechaConsulta: string;
  descripcion: string;
  crecimientoTemporal: CrecimientoTemporal;
  comparativaProcesos: ComparativaProcesos;
  comparativaProgramas: ComparativaProgramas;
  resumenEstrategico: ResumenEstrategico;
}

/**
 * Interfaz consolidada para todas las estadísticas
 */
export interface EstadisticasCompletas {
  totalEstudiantes: number;
  estudiantesPorPrograma: { [programa: string]: number };
  estadisticasPorProceso: { [proceso: string]: any };
  estadoSolicitudes: { [estado: string]: EstadoInfo };
  fechaConsulta: string;
  loading: boolean;
  error?: string;
}

// ===== MODELOS PARA CURSOS DE VERANO =====

export interface MateriaPrediccion {
  nombre: string;
  demandaActual: number;
  demandaEstimada: number;
  tendencia: "CRECIENTE" | "DECRECIENTE" | "ESTABLE";
  variacion: number;
  porcentajeVariacion: number;
  // ❌ ELIMINADOS (backend ya no los envía): pendiente, rSquared, modeloUtilizado
}

export interface ProgramaPrediccion {
  nombre: string;
  demandaActual: number;
  demandaEstimada: number;
  tendencia: "CRECIENTE" | "DECRECIENTE" | "ESTABLE";
  variacion: number;
  porcentajeVariacion: number;
  // ❌ ELIMINADOS (backend ya no los envía): pendiente, rSquared, modeloUtilizado
}

export interface PrediccionesTemporales {
  mesPico: string;
  demandaActualMesPico: number;
  demandaEstimadaMesPico: number;
  mesesRecomendados: string[];
}

export interface RecomendacionFutura {
  tipo: string;
  titulo: string;
  descripcion: string;
  prioridad: "ALTA" | "MEDIA" | "BAJA";
  accion: string;
}

export interface PrediccionesCursosVerano {
  demandaEstimadaProximoPeriodo: number;
  materiasConTendenciaCreciente: MateriaPrediccion[];
  materiasConTendenciaDecreciente: MateriaPrediccion[];
  materiasEstables: MateriaPrediccion[];
  programasConTendenciaCreciente: ProgramaPrediccion[];
  programasConTendenciaDecreciente: ProgramaPrediccion[];
  prediccionesTemporales: PrediccionesTemporales;
  // ❌ ELIMINADO: recomendacionesFuturas (ahora está en el nivel superior como 'recomendaciones')
  confiabilidad: "ALTA" | "MEDIA" | "BAJA";
  fechaPrediccion: string;
  // ❌ ELIMINADO: metodologia (campo técnico innecesario)
  // Nuevos campos para la pestaña de Recomendaciones
  estadisticasRecomendaciones?: {
    totalRecomendaciones: number;
    prioridadAlta: number;
    prioridadMedia: number;
    prioridadBaja: number;
    alertasCriticas: number;
  };
  alertasCriticas?: any[];
}

export interface TopMateria {
  nombre: string;
  solicitudes: number;
  porcentaje: number;
}

export interface AnalisisPrograma {
  nombre: string;
  solicitudes: number;
  porcentaje: number;
}

export interface TendenciaTemporal {
  mes: string;
  solicitudes: number;
  porcentaje: number;
}

export interface EstadosSolicitudes {
  Aprobada: number;
  Enviada: number;
  "En Proceso": number;
  Rechazada: number;
}

export interface Recomendacion {
  tipo: string;
  titulo: string;
  descripcion: string;
  prioridad: "ALTA" | "MEDIA" | "BAJA";
  acciones: string[]; // Array de acciones recomendadas
}

export interface ResumenCursosVerano {
  totalSolicitudes: number;
  materiasUnicas: number;
  programasParticipantes: number;
  tasaAprobacion: number;
}

export interface CursosVeranoResponse {
  fechaConsulta: string;
  descripcion: string;
  resumen: ResumenCursosVerano;
  topMaterias: TopMateria[];
  analisisPorPrograma: AnalisisPrograma[];
  tendenciasTemporales: TendenciaTemporal[];
  estadosSolicitudes: EstadosSolicitudes;
  recomendaciones: Recomendacion[];
  predicciones: PrediccionesCursosVerano;
}

// ===== INTERFACES PARA PREDICCIONES GLOBALES (DASHBOARD GENERAL) =====

export interface PrediccionItem {
  nombre: string;
  tipo: 'PROCESO' | 'PROGRAMA';
  demandaActual: number;
  demandaEstimada: number;
  variacion: number;
  porcentajeVariacion: number;
  tendencia: 'CRECIENTE' | 'DECRECIENTE' | 'ESTABLE';
  // ❌ ELIMINADOS (backend ya no los envía): pendiente, rSquared, modeloUtilizado
}

export interface PrediccionesGlobales {
  // Predicción Global
  demandaTotalActual: number;
  demandaTotalEstimada: number;
  variacionTotal: number;
  porcentajeVariacionTotal: number;
  
  // Predicciones por Proceso
  procesosConTendenciaCreciente: PrediccionItem[];
  procesosConTendenciaDecreciente: PrediccionItem[];
  procesosEstables: PrediccionItem[];
  
  // Predicciones por Programa
  programasConTendenciaCreciente: PrediccionItem[];
  programasConTendenciaDecreciente: PrediccionItem[];
  programasEstables: PrediccionItem[];
  
  // Metadata
  // ❌ ELIMINADO: metodologia (campo técnico innecesario)
  confiabilidad: 'ALTA' | 'MEDIA' | 'BAJA';
  fechaPrediccion: string;
  umbralTendencia: number;
}