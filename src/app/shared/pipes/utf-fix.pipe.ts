import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'utfFix',
})
export class UtfFixPipe implements PipeTransform {
  /** Corrige el texto mal codificado; lo que no es texto (null, números…) pasa igual. */
  transform<T>(value: T): T {
    if (typeof value !== 'string') return value;
    return corregirTexto(value) as T;
  }
}

function corregirTexto(str: string): string {
  // Si detectamos caracteres típicos de mojibake, intentamos corregir
  if (str.includes('Ã') || str.includes('Â') || str.includes('�')) {
    try {
      // Convierte texto mal decodificado ISO-8859-1 -> UTF-8
      // Nota: escape/decodeURIComponent corrige muchos casos comunes de mojibake
      // Si falla, retornamos el original.
      return decodeURIComponent(escape(str));
    } catch {
      return str;
    }
  }
  return str;
}
