/**
 * Utilidades para corregir problemas de codificación UTF-8
 */

/**
 * Corrige caracteres mal codificados (Latin-1 interpretado como UTF-8)
 * Ejemplos:
 * - "Ã©" → "é"
 * - "Ã­" → "í"
 * - "Ã³" → "ó"
 * - "Ãº" → "ú"
 * - "Ã±" → "ñ"
 * - "Ã¡" → "á"
 */
export function corregirEncoding(texto: string): string {
  if (!texto) return texto;
  
  try {
    // Mapeo de caracteres mal codificados comunes
    const mapeoCaracteres: { [key: string]: string } = {
      '\u00C3\u00A9': '\u00E9', // é
      '\u00C3\u00AD': '\u00ED', // í
      '\u00C3\u00B3': '\u00F3', // ó
      '\u00C3\u00BA': '\u00FA', // ú
      '\u00C3\u00B1': '\u00F1', // ñ
      '\u00C3\u00A1': '\u00E1', // á
      '\u00C3\u0089': '\u00C9', // É
      '\u00C3\u008D': '\u00CD', // Í
      '\u00C3\u0093': '\u00D3', // Ó
      '\u00C3\u009A': '\u00DA', // Ú
      '\u00C3\u0091': '\u00D1', // Ñ
      '\u00C3\u0081': '\u00C1', // Á
      '\u00C3\u00BC': '\u00FC', // ü
      '\u00C3\u00B6': '\u00F6', // ö
      '\u00C3\u009C': '\u00DC', // Ü
      '\u00C3\u0096': '\u00D6', // Ö
      '\u00C3\u00A4': '\u00E4', // ä
      '\u00C3\u0084': '\u00C4'  // Ä
    };

    let textoCorregido = texto;
    
    // Reemplazar cada caracter mal codificado
    for (const [mal, bien] of Object.entries(mapeoCaracteres)) {
      textoCorregido = textoCorregido.replace(new RegExp(mal, 'g'), bien);
    }
    
    return textoCorregido;
  } catch (error) {
    return texto;
  }
}

/**
 * Corrige el encoding de un objeto completo recursivamente
 */
export function corregirEncodingObjeto(obj: any): any {
  if (!obj) return obj;
  
  if (typeof obj === 'string') {
    return corregirEncoding(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => corregirEncodingObjeto(item));
  }
  
  if (typeof obj === 'object') {
    const objetoCorregido: any = {};
    for (const [key, value] of Object.entries(obj)) {
      objetoCorregido[key] = corregirEncodingObjeto(value);
    }
    return objetoCorregido;
  }
  
  return obj;
}
