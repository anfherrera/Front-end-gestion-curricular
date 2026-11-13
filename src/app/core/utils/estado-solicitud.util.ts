import { ESTADOS_SOLICITUD_LABELS, EstadosSolicitud } from '../enums/estados-solicitud.enum';
import { COLORS, COLORS_BY_STATE, ICONS_BY_STATE } from '../design-system/design-tokens';

/** Lo mínimo que necesitan las funciones de abajo: el historial de estados de la solicitud. */
interface ConHistorialDeEstados<E extends { estado_actual: string } = { estado_actual: string }> {
  estadosSolicitud?: E[] | null;
}

/** Estado que se devuelve cuando la solicitud no tiene historial. */
export const ESTADO_SIN_HISTORIAL = 'Pendiente';

export type CategoriaEstado = 'aprobada' | 'rechazada' | 'enviada' | 'proceso' | 'default';

/**
 * Lleva cualquier forma de escribir un estado al código del backend:
 * "Aprobada" → APROBADA, "En revisión por Secretaría" → EN_REVISION_SECRETARIA,
 * "pre-registrado" → PRE_REGISTRADO. Si no es un estado conocido devuelve el texto
 * en mayúsculas y con guiones bajos (sirve para buscar en los mapas de diseño).
 */
export function normalizarEstado(estado: string | null | undefined): string {
  if (!estado) return '';
  const codigo = estado
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .trim().toUpperCase()
    .replace(/[\s-]+/g, '_')
    .replace('_POR_', '_');
  return codigo === 'PREREGISTRADO' ? EstadosSolicitud.PRE_REGISTRADO : codigo;
}

/** Último registro del historial de estados, o null si no hay. */
export function ultimoEstado<E extends { estado_actual: string }>(sol: ConHistorialDeEstados<E>): E | null {
  const estados = sol.estadosSolicitud;
  return estados && estados.length > 0 ? estados[estados.length - 1] : null;
}

/** Estado actual de la solicitud (el del último registro), o "Pendiente" si no tiene historial. */
export function estadoActual(sol: ConHistorialDeEstados): string {
  return ultimoEstado(sol)?.estado_actual ?? ESTADO_SIN_HISTORIAL;
}

/** Texto para mostrar: "APROBADA_FUNCIONARIO" → "Aprobada por Funcionario". */
export function estadoLabel(estado: string | null | undefined): string {
  if (!estado) return '';
  return ESTADOS_SOLICITUD_LABELS[normalizarEstado(estado) as EstadosSolicitud] ?? estado;
}

/** Color institucional (hex) del estado. */
export function estadoColor(estado: string | null | undefined): string {
  return COLORS_BY_STATE[normalizarEstado(estado)] ?? COLORS.neutralText;
}

/** Icono de Material del estado. */
export function estadoIcono(estado: string | null | undefined): string {
  return ICONS_BY_STATE[normalizarEstado(estado)] ?? 'info';
}

/** Agrupa estados equivalentes (APROBADA, APROBADO, PAGO_VALIDADO…) para estilos. */
export function categoriaEstado(estado: string | null | undefined): CategoriaEstado {
  const codigo = normalizarEstado(estado);
  if (codigo.startsWith('APROBAD') || codigo === 'PAGO_VALIDADO') return 'aprobada';
  if (codigo.startsWith('RECHAZAD') || codigo === 'PAGO_RECHAZADO') return 'rechazada';
  if (codigo === 'ENVIADA' || codigo === 'ENVIADO') return 'enviada';
  if (codigo.startsWith('EN_REVISION') || codigo === 'EN_PROCESO') return 'proceso';
  return 'default';
}

/** Clase CSS del estado: estado-aprobada, estado-rechazada, estado-enviada, estado-proceso o estado-default. */
export function estadoClase(estado: string | null | undefined): string {
  return `estado-${categoriaEstado(estado)}`;
}
