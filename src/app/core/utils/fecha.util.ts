/**
 * Formato de fechas para mostrar. En plantillas usar el pipe `fecha`
 * (`{{ valor | fecha }}`, `{{ valor | fecha:'larga' }}`, `{{ valor | fecha:'corta-hora':'-' }}`).
 */

export type FormatoFecha =
  | 'corta'       // 15/01/2025
  | 'corta-hora'  // 15/01/2025, 14:30
  | 'media'       // 15 ene 2025
  | 'media-hora'  // 15 ene 2025, 14:30
  | 'larga'       // 15 de enero de 2025
  | 'larga-hora'; // 15 de enero de 2025, 14:30

const LOCALE = 'es-ES';
const HORA: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
const DIA_CORTO: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
const DIA_MEDIO: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
const DIA_LARGO: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

const OPCIONES: Record<FormatoFecha, Intl.DateTimeFormatOptions> = {
  'corta': DIA_CORTO,
  'corta-hora': { ...DIA_CORTO, ...HORA },
  'media': DIA_MEDIO,
  'media-hora': { ...DIA_MEDIO, ...HORA },
  'larga': DIA_LARGO,
  'larga-hora': { ...DIA_LARGO, ...HORA },
};

const SOLO_DIA = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Convierte el valor en Date. "2025-01-15" (sin hora) se toma como día local:
 * `new Date('2025-01-15')` lo lee en UTC y en Colombia mostraría el 14.
 */
export function aFecha(valor: string | Date | null | undefined): Date | null {
  if (!valor) return null;
  if (valor instanceof Date) return isNaN(valor.getTime()) ? null : valor;
  const soloDia = SOLO_DIA.exec(valor.trim());
  const fecha = soloDia
    ? new Date(Number(soloDia[1]), Number(soloDia[2]) - 1, Number(soloDia[3]))
    : new Date(valor);
  return isNaN(fecha.getTime()) ? null : fecha;
}

/**
 * Da formato a una fecha. Si el valor está vacío devuelve `vacio`; si no se puede
 * leer como fecha lo devuelve tal cual.
 */
export function formatearFecha(
  valor: string | Date | null | undefined,
  formato: FormatoFecha = 'corta',
  vacio = ''
): string {
  if (!valor) return vacio;
  const fecha = aFecha(valor);
  if (!fecha) return String(valor);
  return fecha.toLocaleString(LOCALE, OPCIONES[formato]);
}

/** "Ahora", "Hace 5 minutos", "Hace 2 días" y, a partir de una semana, la fecha media. */
export function fechaRelativa(valor: string | Date, ahora: Date = new Date()): string {
  const fecha = aFecha(valor);
  if (!fecha) return String(valor ?? '');
  const minutos = Math.floor((ahora.getTime() - fecha.getTime()) / 60000);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `Hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  if (dias < 7) return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
  return formatearFecha(fecha, 'media');
}
