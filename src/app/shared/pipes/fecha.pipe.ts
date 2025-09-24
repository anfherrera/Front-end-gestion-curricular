import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fecha',
  standalone: true
})
export class FechaPipe implements PipeTransform {

  transform(value: string | Date): string {
    if (!value) return '';
    
    let date: Date;
    
    if (typeof value === 'string') {
      // Si es string, intentar parsearlo
      date = new Date(value);
    } else {
      date = value;
    }
    
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) {
      return value.toString();
    }
    
    // Formatear como DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }
}
