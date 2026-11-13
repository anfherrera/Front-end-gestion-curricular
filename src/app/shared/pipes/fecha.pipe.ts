import { Pipe, PipeTransform } from '@angular/core';
import { FormatoFecha, formatearFecha } from '@core/utils/fecha.util';

/**
 * `{{ valor | fecha }}` → 15/01/2025
 * `{{ valor | fecha:'larga' }}` → 15 de enero de 2025
 * `{{ valor | fecha:'corta':'N/A' }}` → "N/A" si no hay fecha
 * Formatos en core/utils/fecha.util.ts.
 */
@Pipe({
  name: 'fecha',
})
export class FechaPipe implements PipeTransform {
  transform(valor: string | Date | null | undefined, formato: FormatoFecha = 'corta', vacio = ''): string {
    return formatearFecha(valor, formato, vacio);
  }
}
