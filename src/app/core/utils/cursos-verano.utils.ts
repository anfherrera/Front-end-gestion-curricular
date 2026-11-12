import { CondicionSolicitudVerano, CursoOfertadoVerano } from '../models/cursos-intersemestrales.model';

/** Condiciones si el backend no responde. */
export const CONDICIONES_POR_DEFECTO: CondicionSolicitudVerano[] = [
  CondicionSolicitudVerano.Primera_Vez,
  CondicionSolicitudVerano.Habilitacion,
  CondicionSolicitudVerano.Repeticion
];

const NOMBRE_CONDICION: Record<string, string> = {
  [CondicionSolicitudVerano.Primera_Vez]: 'Primera Vez',
  [CondicionSolicitudVerano.Habilitacion]: 'Habilitación',
  [CondicionSolicitudVerano.Repeticion]: 'Repetición'
};

export function nombreCondicion(condicion: CondicionSolicitudVerano): string {
  return NOMBRE_CONDICION[condicion] ?? condicion;
}

/** Nombre del docente del curso para mostrar. */
export function nombreDocente(curso: Pick<CursoOfertadoVerano, 'objDocente'> | null | undefined): string {
  if (!curso?.objDocente) return 'Sin asignar';
  return curso.objDocente.nombre_docente || 'Sin nombre';
}

/** Estado del curso; "Borrador" si el backend no lo envía. */
export function estadoCurso(curso: Pick<CursoOfertadoVerano, 'estado'>): string {
  return curso.estado || 'Borrador';
}

/** Período "YYYY-P" del curso (el backend lo envía como `periodo`). */
export function periodoCurso(curso: Pick<CursoOfertadoVerano, 'periodo' | 'periodoAcademico'>): string | undefined {
  return curso.periodo || curso.periodoAcademico;
}
