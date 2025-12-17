/**
 * Utilidades para trabajar con períodos académicos y fechas de cursos intersemestrales
 */

/**
 * Formatea una fecha ISO a formato legible en español
 * @param fechaISO Fecha en formato ISO (ej: "2025-01-15")
 * @returns Fecha formateada (ej: "15 de enero de 2025")
 */
export function formatearFecha(fechaISO: string | Date): string {
  if (!fechaISO) return 'Fecha no disponible';
  
  try {
    const fecha = typeof fechaISO === 'string' ? new Date(fechaISO) : fechaISO;
    return fecha.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'Fecha inválida';
  }
}

/**
 * Formatea una fecha ISO a formato corto (dd/mm/yyyy)
 * @param fechaISO Fecha en formato ISO (ej: "2025-01-15")
 * @returns Fecha formateada (ej: "15/01/2025")
 */
export function formatearFechaCorta(fechaISO: string | Date): string {
  if (!fechaISO) return 'N/A';
  
  try {
    const fecha = typeof fechaISO === 'string' ? new Date(fechaISO) : fechaISO;
    return fecha.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Calcula la duración en semanas entre dos fechas
 * @param fechaInicio Fecha de inicio
 * @param fechaFin Fecha de fin
 * @returns Número de semanas (redondeado)
 */
export function calcularDuracionSemanas(fechaInicio: string | Date, fechaFin: string | Date): number {
  try {
    const inicio = typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio;
    const fin = typeof fechaFin === 'string' ? new Date(fechaFin) : fechaFin;
    
    const dias = Math.abs((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    return Math.round(dias / 7);
  } catch (error) {
    return 0;
  }
}

/**
 * Calcula la duración en días entre dos fechas
 * @param fechaInicio Fecha de inicio
 * @param fechaFin Fecha de fin
 * @returns Número de días
 */
export function calcularDuracionDias(fechaInicio: string | Date, fechaFin: string | Date): number {
  try {
    const inicio = typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio;
    const fin = typeof fechaFin === 'string' ? new Date(fechaFin) : fechaFin;
    
    return Math.abs(Math.round((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)));
  } catch (error) {
    return 0;
  }
}

/**
 * Verifica si un curso está activo en una fecha específica
 * @param fechaInicio Fecha de inicio del curso
 * @param fechaFin Fecha de fin del curso
 * @param fechaReferencia Fecha de referencia (por defecto hoy)
 * @returns true si el curso está activo
 */
export function esCursoActivo(fechaInicio: string | Date, fechaFin: string | Date, fechaReferencia?: Date): boolean {
  try {
    const inicio = typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio;
    const fin = typeof fechaFin === 'string' ? new Date(fechaFin) : fechaFin;
    const referencia = fechaReferencia || new Date();
    
    return referencia >= inicio && referencia <= fin;
  } catch (error) {
    return false;
  }
}

/**
 * Obtiene el color asociado a un período académico
 * @param periodo Período académico (ej: "2025-1")
 * @returns Color hexadecimal
 */
export function getColorPeriodo(periodo: string): string {
  if (!periodo) return '#9e9e9e'; // Gris por defecto
  
  const partes = periodo.split('-');
  if (partes.length !== 2) return '#9e9e9e';
  
  const numero = partes[1];
  // Período 1 (primer semestre) = Azul, Período 2 (segundo semestre) = Azul oscuro
  return numero === '1' ? '#3498db' : '#2980b9';
}

/**
 * Valida un período académico
 * @param periodo Período en formato "YYYY-N" (ej: "2025-1")
 * @returns true si el formato es válido
 */
export function validarPeriodo(periodo: string): boolean {
  if (!periodo) return false;
  
  const regex = /^\d{4}-[12]$/;
  return regex.test(periodo);
}

/**
 * Valida las fechas de un curso
 * @param fechaInicio Fecha de inicio
 * @param fechaFin Fecha de fin
 * @returns Mensaje de error o null si es válido
 */
export function validarFechasCurso(fechaInicio: string | Date, fechaFin: string | Date): string | null {
  try {
    const inicio = typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio;
    const fin = typeof fechaFin === 'string' ? new Date(fechaFin) : fechaFin;
    
    // Validar que la fecha de fin sea posterior a la de inicio
    if (fin <= inicio) {
      return 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    
    // Calcular duración en semanas
    const semanas = calcularDuracionSemanas(inicio, fin);
    
    // Validar duración mínima (3 semanas)
    if (semanas < 3) {
      return 'El curso debe durar al menos 3 semanas';
    }
    
    // Validar duración máxima (12 semanas)
    if (semanas > 12) {
      return 'El curso no puede durar más de 12 semanas';
    }
    
    return null; // Válido
  } catch (error) {
    return 'Error al validar las fechas';
  }
}

/**
 * Genera un array de períodos académicos entre dos años
 * @param añoInicio Año de inicio (ej: 2020)
 * @param añoFin Año de fin (ej: 2030)
 * @returns Array de períodos en formato "YYYY-N"
 */
export function generarPeriodos(añoInicio: number, añoFin: number): string[] {
  const periodos: string[] = [];
  
  for (let año = añoInicio; año <= añoFin; año++) {
    periodos.push(`${año}-1`);
    periodos.push(`${año}-2`);
  }
  
  return periodos;
}

/**
 * Obtiene el período actual basado en la fecha
 * @param fecha Fecha de referencia (por defecto hoy)
 * @returns Período académico (ej: "2025-1")
 */
export function getPeriodoActual(fecha?: Date): string {
  const referencia = fecha || new Date();
  const año = referencia.getFullYear();
  const mes = referencia.getMonth() + 1; // 0-11 -> 1-12
  
  // Primer semestre: Enero a Junio (1-6)
  // Segundo semestre: Julio a Diciembre (7-12)
  const semestre = mes <= 6 ? 1 : 2;
  
  return `${año}-${semestre}`;
}

/**
 * Parsea un período académico a un objeto
 * @param periodo Período en formato "YYYY-N"
 * @returns Objeto con año y número de período
 */
export function parsearPeriodo(periodo: string): { año: number; numero: number } | null {
  if (!validarPeriodo(periodo)) return null;
  
  const partes = periodo.split('-');
  return {
    año: parseInt(partes[0], 10),
    numero: parseInt(partes[1], 10)
  };
}

/**
 * Compara dos períodos académicos
 * @param periodo1 Primer período
 * @param periodo2 Segundo período
 * @returns -1 si periodo1 < periodo2, 0 si son iguales, 1 si periodo1 > periodo2
 */
export function compararPeriodos(periodo1: string, periodo2: string): number {
  const p1 = parsearPeriodo(periodo1);
  const p2 = parsearPeriodo(periodo2);
  
  if (!p1 || !p2) return 0;
  
  if (p1.año !== p2.año) {
    return p1.año < p2.año ? -1 : 1;
  }
  
  if (p1.numero !== p2.numero) {
    return p1.numero < p2.numero ? -1 : 1;
  }
  
  return 0;
}

/**
 * Ordena un array de períodos académicos
 * @param periodos Array de períodos
 * @param orden 'asc' para ascendente (más antiguo primero), 'desc' para descendente (más reciente primero)
 * @returns Array ordenado
 */
export function ordenarPeriodos(periodos: string[], orden: 'asc' | 'desc' = 'desc'): string[] {
  return periodos.sort((a, b) => {
    const comparacion = compararPeriodos(a, b);
    return orden === 'asc' ? comparacion : -comparacion;
  });
}

/**
 * Formatea un período académico para visualización
 * @param periodo Período en formato "YYYY-N"
 * @returns Texto formateado (ej: "2025-1" -> "2025 - Primer Semestre")
 */
export function formatearPeriodo(periodo: string): string {
  const parsed = parsearPeriodo(periodo);
  if (!parsed) return periodo;
  
  const nombreSemestre = parsed.numero === 1 ? 'Primer Semestre' : 'Segundo Semestre';
  return `${parsed.año} - ${nombreSemestre}`;
}

/**
 * Obtiene el estado visual de un curso basado en sus fechas
 * @param fechaInicio Fecha de inicio
 * @param fechaFin Fecha de fin
 * @returns Estado: 'proximo', 'activo', 'finalizado'
 */
export function getEstadoCursoPorFechas(fechaInicio: string | Date, fechaFin: string | Date): 'proximo' | 'activo' | 'finalizado' {
  try {
    const inicio = typeof fechaInicio === 'string' ? new Date(fechaInicio) : fechaInicio;
    const fin = typeof fechaFin === 'string' ? new Date(fechaFin) : fechaFin;
    const hoy = new Date();
    
    if (hoy < inicio) return 'proximo';
    if (hoy >= inicio && hoy <= fin) return 'activo';
    return 'finalizado';
  } catch (error) {
    return 'proximo';
  }
}



