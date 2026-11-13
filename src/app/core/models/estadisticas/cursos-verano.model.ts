// Estadísticas, predicciones y recomendaciones de cursos de verano.

export interface MateriaPrediccion {
  nombre: string;
  demandaActual: number;
  demandaEstimada: number;
  tendencia: "CRECIENTE" | "DECRECIENTE" | "ESTABLE";
  variacion: number;
  porcentajeVariacion: number;
  // Backend ya no envía: pendiente, rSquared, modeloUtilizado
}

export interface ProgramaPrediccion {
  nombre: string;
  demandaActual: number;
  demandaEstimada: number;
  tendencia: "CRECIENTE" | "DECRECIENTE" | "ESTABLE";
  variacion: number;
  porcentajeVariacion: number;
  // Backend ya no envía: pendiente, rSquared, modeloUtilizado
}

export interface PrediccionesTemporales {
  mesPico: string;
  demandaActualMesPico: number;
  demandaEstimadaMesPico: number;
  mesesRecomendados: string[];
}

export interface PrediccionesCursosVerano {
  demandaEstimadaProximoPeriodo: number;
  materiasConTendenciaCreciente: MateriaPrediccion[];
  materiasConTendenciaDecreciente: MateriaPrediccion[];
  materiasEstables: MateriaPrediccion[];
  programasConTendenciaCreciente: ProgramaPrediccion[];
  todasLasPrediccionesPorPrograma: ProgramaPrediccion[]; // Lista completa de todos los programas
  programasConTendenciaDecreciente: ProgramaPrediccion[];
  prediccionesTemporales: PrediccionesTemporales;
  // recomendacionesFuturas ahora está en el nivel superior como 'recomendaciones'
  confiabilidad: "ALTA" | "MEDIA" | "BAJA";
  fechaPrediccion: string;
  // metodologia eliminado (campo técnico innecesario)
  // Nuevos campos para la pestaña de Recomendaciones
  estadisticasRecomendaciones?: EstadisticasRecomendaciones;
  alertasCriticas?: AlertaCritica[];
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
  EN_PROCESO: number;  // Estado combinado (reemplaza APROBADA_FUNCIONARIO + APROBADA_COORDINADOR)
  RECHAZADA: number;
  // Legacy: Mantener para compatibilidad con versiones anteriores
  APROBADA_FUNCIONARIO?: number;
  APROBADA_COORDINADOR?: number;
}

/**
 * Interfaz para estados estructurados con información completa.
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

export type PrioridadRecomendacion = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA';

export interface Recomendacion {
  id: string;
  tipo: string;
  categoria?: string;
  titulo: string;
  descripcion: string;
  prioridad: PrioridadRecomendacion;
  acciones: string[];
  justificacion?: string;
  materia?: string;
  demandaActual?: number;
  demandaProyectada?: number;
  crecimiento?: number;
  porcentajeCrecimiento?: number;
  impacto?: {
    estudiantesAtendidos: number;
    estudiantesBeneficiados: number;
    tasaCoberturaObjetivo: string;
  };
  recursos?: {
    docentes: number;
    aulas: number;
    laboratorios?: number;
    gruposActuales?: number;
    gruposRecomendados: number;
    capacidadPorGrupo: number;
  };
}

/** Alerta en predicciones.alertasCriticas. */
export interface AlertaCritica {
  id: string;
  tipo: string;
  categoria?: string;
  titulo: string;
  descripcion: string;
  prioridad: PrioridadRecomendacion;
  acciones: string[];
  materia?: string;
  crecimientoProyectado?: string;
}

export interface EstadisticasRecomendaciones {
  totalRecomendaciones: number;
  prioridadAlta: number;
  prioridadMedia: number;
  prioridadBaja: number;
  alertasCriticas: number;
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
  estadosSolicitudesEstructurados?: EstadosSolicitudesEstructurados;  // Mapa estructurado con porcentajes
  recomendaciones: Recomendacion[];
  predicciones: PrediccionesCursosVerano;
  todosLosMeses?: string[];  // Array con todos los meses (Enero-Diciembre)
}
