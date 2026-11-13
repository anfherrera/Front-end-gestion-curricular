/**
 * Nombre de archivo listo para comparar: minúsculas, sin tildes, sin extensión
 * y sin espacios ni signos. "Certificado de Notas.PDF" → "certificadodenotas".
 */
export function normalizarNombreArchivo(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Coincidencia aproximada entre dos nombres ya normalizados. `palabrasClave` agrupa,
 * por tipo de documento, las palabras que lo identifican: si alguno de los nombres
 * contiene la clave del grupo, coinciden cuando ambos comparten una de sus palabras.
 */
export function coincidenPorPalabrasClave(
  nombre1: string,
  nombre2: string,
  palabrasClave: Record<string, string[]>
): boolean {
  for (const [clave, palabras] of Object.entries(palabrasClave)) {
    if (nombre1.includes(clave) || nombre2.includes(clave)) {
      return palabras.some(palabra => nombre1.includes(palabra) && nombre2.includes(palabra));
    }
  }
  return false;
}
