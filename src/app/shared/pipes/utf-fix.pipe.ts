import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'utfFix',
  standalone: true
})
export class UtfFixPipe implements PipeTransform {
  transform(value: any): any {
    if (value == null) return value;
    if (typeof value !== 'string') return value;

    const str = value as string;
    // Si detectamos caracteres típicos de mojibake, intentamos corregir
    if (str.includes('Ã') || str.includes('Â') || str.includes('�')) {
      try {
        // Convierte texto mal decodificado ISO-8859-1 -> UTF-8
        // Nota: escape/decodeURIComponent corrige muchos casos comunes de mojibake
        // Si falla, retornamos el original.
        // eslint-disable-next-line deprecation/deprecation
        return decodeURIComponent(escape(str));
      } catch {
        return str;
      }
    }
    return str;
  }
}


