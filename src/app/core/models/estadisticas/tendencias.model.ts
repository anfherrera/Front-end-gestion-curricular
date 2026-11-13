// Tendencias y comparativas entre procesos y programas.

export interface CrecimientoTemporal {
  tendenciaSolicitudes?: string;  // Legacy: Mantener para compatibilidad
  tendenciaEstudiantes?: string;  // Legacy: Mantener para compatibilidad
  tendencia?: string;              // Campo unificado según guía actualizada
  crecimientoSolicitudes: number;
  crecimientoEstudiantes: number;
  mesesAnalizados: number;
  solicitudesPorMes?: Record<string, number>;  // Solicitudes por mes
  estudiantesPorMes?: Record<string, number>;  // Estudiantes por mes
  totalSolicitudes?: number;                       // Total de solicitudes
  totalEstudiantes?: number;                       // Total de estudiantes
}

export interface ComparativaProcesos {
  procesoMasDemandado: string;
  procesoMasEficiente: string | null;
  eficienciaMasAlta: number;
  demandaMasAlta: number;
  solicitudesPorProceso: Record<string, number>;
  aprobadasPorProceso: Record<string, number>;
}

export interface ComparativaProgramas {
  programaMasActivo: string;
  programaConMasEstudiantes: string;
  maxSolicitudes: number;
  maxEstudiantes: number;
  solicitudesPorPrograma: Record<string, number>;
  estudiantesPorPrograma: Record<string, number>;
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
