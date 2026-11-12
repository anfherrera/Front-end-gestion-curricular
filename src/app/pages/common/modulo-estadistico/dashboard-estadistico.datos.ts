import {
  EstadisticasPorProcesoResponse,
  EstadisticasProceso,
  EstadisticasPrograma,
  EstadoSolicitudesResponse,
  EstudiantesPorProgramaResponse,
  FiltroEstadisticas,
  KPIData,
  ResumenCompleto,
  ResumenCompletoAPI
} from '../../../core/models/estadisticas.model';

/** Filtros tal como los aceptan los endpoints de estadísticas. */
export interface FiltrosBackend {
  periodoAcademico?: string;
  idPrograma?: number;
  proceso?: string;
}

/** Busca el id real de un programa por su nombre (null si no está en el catálogo). */
export type ResolverIdPrograma = (nombrePrograma: string) => number | null;

const TODOS_LOS_PROCESOS = 'Todos los procesos';

/** Quita los filtros vacíos o con el valor "todos". */
export function filtrosParaBackend(filtros: FiltroEstadisticas): FiltrosBackend {
  const resultado: FiltrosBackend = {};
  const periodo = filtros.periodoAcademico?.trim();
  if (periodo && periodo !== 'todos') {
    resultado.periodoAcademico = periodo;
  }
  if (filtros.idPrograma && filtros.idPrograma > 0) {
    resultado.idPrograma = filtros.idPrograma;
  }
  const proceso = filtros.proceso?.trim();
  if (proceso && proceso !== TODOS_LOS_PROCESOS) {
    resultado.proceso = proceso;
  }
  return resultado;
}

/** Valores del formulario de filtros. */
export interface ValoresFiltros {
  proceso?: string | null;
  idPrograma?: string | number | null;
  periodoAcademico?: string | null;
}

/**
 * Filtros del formulario. `periodoActual` indica que se eligió "Período actual"
 * (cadena vacía): quien llama debe resolverlo con el servicio de períodos.
 */
export function filtrosDelFormulario(valores: ValoresFiltros): { filtros: FiltroEstadisticas; periodoActual: boolean } {
  const filtros: FiltroEstadisticas = {};

  const proceso = valores.proceso?.trim();
  if (proceso && proceso !== TODOS_LOS_PROCESOS) {
    filtros.proceso = proceso;
  }

  const idPrograma = Number(valores.idPrograma);
  if (valores.idPrograma && !isNaN(idPrograma) && idPrograma > 0) {
    filtros.idPrograma = idPrograma;
  }

  if (valores.periodoAcademico === undefined || valores.periodoAcademico === null) {
    return { filtros, periodoActual: false };
  }
  const periodo = String(valores.periodoAcademico).trim();
  if (periodo === '') {
    return { filtros, periodoActual: true };
  }
  if (periodo !== 'todos' && periodo !== 'Todos los períodos') {
    filtros.periodoAcademico = periodo;
  }
  return { filtros, periodoActual: false };
}

/** Filtros para exportar: se envían tal como están en el formulario. */
export function filtrosParaExportar(valores: ValoresFiltros | undefined): FiltroEstadisticas {
  const filtros: FiltroEstadisticas = {};
  if (valores?.proceso && valores.proceso !== TODOS_LOS_PROCESOS) {
    filtros.proceso = valores.proceso;
  }
  if (valores?.idPrograma && valores.idPrograma !== 'Todos los programas') {
    filtros.idPrograma = Number(valores.idPrograma);
  }
  if (valores?.periodoAcademico) {
    filtros.periodoAcademico = valores.periodoAcademico;
  }
  return filtros;
}

function claveProceso(nombre: string): string {
  return nombre.toLowerCase().replace(/\s+/g, '-');
}

/** /estadisticas/resumen-completo al formato que usa el dashboard. */
export function resumenDesdeAPI(api: ResumenCompletoAPI, idPrograma: ResolverIdPrograma): ResumenCompleto {
  const porTipo = api.porTipoProceso || {};
  const estadisticasPorProceso: EstadisticasProceso[] = Object.keys(porTipo).map(nombre => {
    const proceso = porTipo[nombre];
    return {
      nombreProceso: claveProceso(nombre),
      totalSolicitudes: proceso.totalSolicitudes || 0,
      aprobadas: proceso.totalAprobadas || 0,
      rechazadas: proceso.totalRechazadas || 0,
      enProceso: proceso.totalEnProceso || 0,
      pendientes: 0,
      porcentajeAprobacion: proceso.porcentajeAprobacion || 0,
      tendenciaMensual: [],
      distribucionPorPrograma: []
    };
  });

  const globales = api.estadisticasGlobales;
  const porPrograma = globales?.porPrograma || {};
  const estadisticasPorPrograma: EstadisticasPrograma[] = Object.keys(porPrograma).map(nombrePrograma => ({
    idPrograma: idPrograma(nombrePrograma),
    nombrePrograma,
    totalSolicitudes: porPrograma[nombrePrograma] || 0,
    distribucionPorProceso: [],
    tendenciaAnual: []
  }));

  return {
    estadisticasGlobales: {
      totalSolicitudes: globales?.totalSolicitudes || 0,
      solicitudesAprobadas: globales?.totalAprobadas || 0,
      solicitudesRechazadas: globales?.totalRechazadas || 0,
      solicitudesEnviadas: 0,
      solicitudesEnProceso: globales?.totalEnProceso || 0,
      totalEstudiantes: 0,
      totalProgramas: api.totalProgramas || 0
    },
    estadisticasPorProceso,
    estadisticasPorPrograma,
    ultimaActualizacion: api.fechaGeneracion || new Date().toISOString()
  };
}

/**
 * Resumen armado con los endpoints individuales, cuando resumen-completo falla.
 * Los totales salen del estado de solicitudes o, si no está, de la suma por proceso.
 */
export function resumenDesdeEndpoints(
  estadoSolicitudes: EstadoSolicitudesResponse | null,
  porProceso: EstadisticasPorProcesoResponse | null,
  estudiantesPorPrograma: EstudiantesPorProgramaResponse | null,
  totalEstudiantes: number,
  idPrograma: ResolverIdPrograma
): ResumenCompleto {
  const procesos = porProceso?.estadisticasPorProceso || {};
  let totalSolicitudes = 0;
  let aprobadas = 0;
  let rechazadas = 0;
  let enviadas = 0;
  let enProceso = 0;

  const estados = estadoSolicitudes?.resumenPorEstado || estadoSolicitudes?.estados;
  if (estadoSolicitudes && estados) {
    aprobadas = estados['APROBADA']?.cantidad || 0;
    rechazadas = estados['RECHAZADA']?.cantidad || 0;
    enviadas = estados['ENVIADA']?.cantidad || 0;
    enProceso = estados['EN_PROCESO']?.cantidad || 0;
    // Si el backend no da el total, se suma por estado
    totalSolicitudes = estadoSolicitudes.totalSolicitudes || (aprobadas + rechazadas + enviadas + enProceso);
  } else {
    Object.values(procesos).forEach(proceso => {
      totalSolicitudes += proceso.totalSolicitudes || 0;
      aprobadas += proceso.aprobadas || 0;
      rechazadas += proceso.rechazadas || 0;
      enviadas += proceso.enviadas || 0;
      enProceso += proceso.enProceso || 0;
    });
  }

  const estadisticasPorProceso: EstadisticasProceso[] = Object.keys(procesos).map(nombre => {
    const proceso = procesos[nombre];
    return {
      nombreProceso: claveProceso(nombre),
      totalSolicitudes: proceso.totalSolicitudes || 0,
      aprobadas: proceso.aprobadas || 0,
      rechazadas: proceso.rechazadas || 0,
      enProceso: proceso.enProceso || 0,
      enviadas: proceso.enviadas || 0,
      pendientes: 0,
      porcentajeAprobacion: proceso.totalSolicitudes > 0 ? ((proceso.aprobadas || 0) / proceso.totalSolicitudes) * 100 : 0,
      tendenciaMensual: [],
      distribucionPorPrograma: []
    };
  });

  const programas = estudiantesPorPrograma?.estudiantesPorPrograma || {};
  const estadisticasPorPrograma: EstadisticasPrograma[] = Object.keys(programas).map(nombrePrograma => ({
    idPrograma: idPrograma(nombrePrograma),
    nombrePrograma,
    totalSolicitudes: 0, // Este endpoint no lo trae
    distribucionPorProceso: [],
    tendenciaAnual: []
  }));

  return {
    estadisticasGlobales: {
      totalSolicitudes,
      solicitudesAprobadas: aprobadas,
      solicitudesRechazadas: rechazadas,
      solicitudesEnviadas: enviadas,
      solicitudesEnProceso: enProceso,
      totalEstudiantes: totalEstudiantes || 0,
      totalProgramas: Object.keys(programas).length
    },
    estadisticasPorProceso,
    estadisticasPorPrograma,
    ultimaActualizacion: new Date().toISOString()
  };
}

export const TITULO_KPI_ESTUDIANTES = 'Estudiantes';

export function generarKPIs(resumen: ResumenCompleto | null, totalEstudiantes: number): KPIData[] {
  const e = resumen?.estadisticasGlobales;
  return [
    { titulo: 'Total Solicitudes', valor: e?.totalSolicitudes || 0, icono: 'description', color: 'primary', descripcion: 'Solicitudes en todos los procesos' },
    { titulo: 'Aprobadas', valor: e?.solicitudesAprobadas || 0, icono: 'check_circle', color: 'success', descripcion: 'Solicitudes aprobadas' },
    { titulo: 'Enviadas', valor: e?.solicitudesEnviadas || 0, icono: 'send', color: 'accent', descripcion: 'Solicitudes enviadas pendientes' },
    { titulo: 'En Proceso', valor: e?.solicitudesEnProceso || 0, icono: 'pending', color: 'warning', descripcion: 'Solicitudes en revisión' },
    { titulo: 'Rechazadas', valor: e?.solicitudesRechazadas || 0, icono: 'cancel', color: 'error', descripcion: 'Solicitudes rechazadas' },
    { titulo: TITULO_KPI_ESTUDIANTES, valor: totalEstudiantes || 0, icono: 'people', color: 'info', descripcion: 'Total de estudiantes registrados' },
    { titulo: 'Programas', valor: e?.totalProgramas || 0, icono: 'school', color: 'purple', descripcion: 'Programas académicos' }
  ];
}

/** Nombres antiguos de proceso (con guiones) a su nombre visible. */
const NOMBRES_PROCESO: Record<string, string> = {
  'paz-salvo': 'Paz y Salvo',
  'reingreso-estudiante': 'Reingreso',
  'homologacion-asignaturas': 'Homologación',
  'cursos-de-verano': 'Cursos de Verano',
  'cursos-intersemestrales': 'Cursos de Verano',
  'pruebas-ecaes': 'ECAES'
};

export function formatearNombreProceso(proceso: string): string {
  return NOMBRES_PROCESO[proceso] || proceso;
}
