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
 * Interfaz para filtros dinámicos del dashboard
 */
export interface FiltrosDashboard {
  proceso?: string;
  idPrograma?: number; // Cambiado de 'programa' a 'idPrograma' para coincidir con el backend
  periodoAcademico?: string; // Agregado período académico
  estado?: string;
  fechaInicio?: string; // Filtro por fecha de inicio (formato: "yyyy-MM-dd")
  fechaFin?: string; // Filtro por fecha de fin (formato: "yyyy-MM-dd")
}

/**
 * Interfaz para la respuesta del API de estadísticas globales
 */
export interface EstadisticasGlobalesAPI {
  fechaConsulta: string;
  totalSolicitudes: number;
  totalAprobadas: number;
  totalEnviadas: number; // Campo del backend
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
 * ACTUALIZADO: Ahora usa resumenPorEstado en lugar de estados
 */
export interface EstadoSolicitudesResponse {
  totalSolicitudes: number;
  resumenPorEstado?: { [estado: string]: EstadoInfo };  // NUEVO: Campo actualizado del backend
  estados?: { [estado: string]: EstadoInfo };           // Legacy: Mantener para compatibilidad
  tasaResolucion?: number;                               // NUEVO: Tasa de resolución en nivel raíz
  analisisComparativo?: any;                             // NUEVO: Análisis comparativo
  fechaConsulta: string;
  descripcion?: string;
  analisis?: {                    // NUEVO: Sección de análisis (legacy)
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
  solicitudesPorPrograma?: { [programa: string]: number };  // Mapa directo de programa -> cantidad
  estudiantesPorPrograma?: { [programa: string]: number };  // Mapa directo de programa -> cantidad
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
  mesesOrdenados?: Array<{ mes: string; total: number; aprobadas: number; [key: string]: any }>;  // Array ordenado de todos los meses
  todosLosMeses?: string[];  // Array con nombres de todos los meses (Enero a Diciembre)
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
  tendenciaSolicitudes?: string;  // Legacy: Mantener para compatibilidad
  tendenciaEstudiantes?: string;  // Legacy: Mantener para compatibilidad
  tendencia?: string;              // NUEVO: Campo unificado según guía actualizada
  crecimientoSolicitudes: number;
  crecimientoEstudiantes: number;
  mesesAnalizados: number;
  solicitudesPorMes?: { [mes: string]: number };  // NUEVO: Solicitudes por mes
  estudiantesPorMes?: { [mes: string]: number };  // NUEVO: Estudiantes por mes
  totalSolicitudes?: number;                       // NUEVO: Total de solicitudes
  totalEstudiantes?: number;                       // NUEVO: Total de estudiantes
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
  // ELIMINADOS (backend ya no los envía): pendiente, rSquared, modeloUtilizado
}

export interface ProgramaPrediccion {
  nombre: string;
  demandaActual: number;
  demandaEstimada: number;
  tendencia: "CRECIENTE" | "DECRECIENTE" | "ESTABLE";
  variacion: number;
  porcentajeVariacion: number;
  // ELIMINADOS (backend ya no los envía): pendiente, rSquared, modeloUtilizado
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
  todasLasPrediccionesPorPrograma: ProgramaPrediccion[]; // NUEVO: Lista completa de todos los programas
  programasConTendenciaDecreciente: ProgramaPrediccion[];
  prediccionesTemporales: PrediccionesTemporales;
  // ELIMINADO: recomendacionesFuturas (ahora está en el nivel superior como 'recomendaciones')
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
  APROBADA: number;
  ENVIADA: number;
  EN_PROCESO: number;  // NUEVO: Estado combinado (reemplaza APROBADA_FUNCIONARIO + APROBADA_COORDINADOR)
  RECHAZADA: number;
  // Legacy: Mantener para compatibilidad con versiones anteriores
  APROBADA_FUNCIONARIO?: number;
  APROBADA_COORDINADOR?: number;
}

/**
 * NUEVO: Interfaz para estados estructurados con información completa
 */
export interface EstadoSolicitudEstructurado {
  estado: string;
  cantidad: number;
  porcentaje: number;
}

export interface EstadosSolicitudesEstructurados {
  APROBADA: EstadoSolicitudEstructurado;
  ENVIADA: EstadoSolicitudEstructurado;
  EN_PROCESO: EstadoSolicitudEstructurado;
  RECHAZADA: EstadoSolicitudEstructurado;
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
  estadosSolicitudes: EstadosSolicitudes;  // Mapa simple: { APROBADA: 0, ENVIADA: 9, ... }
  estadosSolicitudesEstructurados?: EstadosSolicitudesEstructurados;  // NUEVO: Mapa estructurado con porcentajes
  recomendaciones: Recomendacion[];
  predicciones: PrediccionesCursosVerano;
  todosLosMeses?: string[];  // NUEVO: Array con todos los meses (Enero-Diciembre)
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
  // ELIMINADOS (backend ya no los envía): pendiente, rSquared, modeloUtilizado
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