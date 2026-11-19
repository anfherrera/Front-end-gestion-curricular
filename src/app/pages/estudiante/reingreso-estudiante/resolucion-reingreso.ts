/** Lo que hace falta de un documento de la solicitud para reconocer la resolución. */
export interface DocumentoDeSolicitud {
  nombre: string;
  ruta_documento?: string;
  fecha_documento?: string;
}

const PATRON_RESOLUCION = /(resoluci[oó]n|oficio|respuesta)/i;

/**
 * La resolución que subió secretaría entre los documentos de la solicitud: el PDF más reciente
 * que no se llame como un documento requerido (con o sin extensión) y que mencione
 * resolución, oficio o respuesta en el nombre o la ruta, o que al menos sea un PDF.
 * Se prefiere al /descargarOficio del backend, que toma el primero y no el más reciente.
 */
export function documentoDeResolucion<D extends DocumentoDeSolicitud>(
  documentos: D[] | null | undefined,
  nombresRequeridos: string[]
): D | undefined {
  const requeridos = nombresRequeridos.map((nombre) => nombre.toLowerCase().trim());
  const esResolucion = (doc: D): boolean => {
    if (!doc.nombre) return false;
    const nombre = doc.nombre.toLowerCase();
    const sinExtension = nombre.replace(/\.[^/.]+$/, '').trim();
    if (requeridos.includes(nombre) || requeridos.includes(sinExtension)) return false;
    return (
      PATRON_RESOLUCION.test(doc.nombre) ||
      (!!doc.ruta_documento && PATRON_RESOLUCION.test(doc.ruta_documento)) ||
      nombre.endsWith('.pdf')
    );
  };
  return (documentos ?? [])
    .filter(esResolucion)
    .sort((a, b) => fechaEnMs(b.fecha_documento) - fechaEnMs(a.fecha_documento))[0];
}

/** Último tramo de una ruta (con / o \). */
export function nombreDesdeRuta(ruta: string | undefined): string {
  if (!ruta) return '';
  return ruta.split(/[\\/]/).pop() || ruta;
}

function fechaEnMs(fecha: string | undefined): number {
  const ms = fecha ? Date.parse(fecha) : NaN;
  return isNaN(ms) ? 0 : ms;
}
