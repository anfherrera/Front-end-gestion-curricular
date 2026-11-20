import {
  calcularDuracionSemanas,
  formatearPeriodo,
  getPeriodoActual,
  ordenarPeriodos,
  validarFechasCurso,
  validarPeriodo,
} from './periodo.utils';

describe('periodo.utils', () => {
  it('calcula la duración en semanas, con cadenas o fechas y sin importar el orden', () => {
    expect(calcularDuracionSemanas('2026-06-01', '2026-07-13')).toBe(6);
    expect(calcularDuracionSemanas(new Date(2026, 6, 13), new Date(2026, 5, 1))).toBe(6);
    expect(calcularDuracionSemanas('2026-06-01', '2026-06-04')).toBe(0);
  });

  it('valida el formato AAAA-N con semestre 1 o 2', () => {
    expect(validarPeriodo('2026-1')).toBeTrue();
    expect(validarPeriodo('2026-2')).toBeTrue();
    expect(validarPeriodo('2026-3')).toBeFalse();
    expect(validarPeriodo('26-1')).toBeFalse();
    expect(validarPeriodo('')).toBeFalse();
  });

  it('valida las fechas de un curso: orden, mínimo de 3 semanas y máximo de 12', () => {
    expect(validarFechasCurso('2026-07-01', '2026-07-01')).toBe(
      'La fecha de fin debe ser posterior a la fecha de inicio'
    );
    expect(validarFechasCurso('2026-07-10', '2026-07-01')).toBe(
      'La fecha de fin debe ser posterior a la fecha de inicio'
    );
    expect(validarFechasCurso('2026-07-01', '2026-07-10')).toBe('El curso debe durar al menos 3 semanas');
    expect(validarFechasCurso('2026-01-01', '2026-06-01')).toBe('El curso no puede durar más de 12 semanas');
    expect(validarFechasCurso('2026-06-01', '2026-07-13')).toBeNull();
    expect(validarFechasCurso(new Date(2026, 5, 1), new Date(2026, 6, 13))).toBeNull();
  });

  it('obtiene el período de una fecha: enero-junio es 1 y julio-diciembre es 2', () => {
    expect(getPeriodoActual(new Date(2026, 0, 15))).toBe('2026-1');
    expect(getPeriodoActual(new Date(2026, 5, 30))).toBe('2026-1');
    expect(getPeriodoActual(new Date(2026, 6, 1))).toBe('2026-2');
    expect(getPeriodoActual(new Date(2026, 11, 31))).toBe('2026-2');
    expect(getPeriodoActual()).toMatch(/^\d{4}-[12]$/);
  });

  it('ordena períodos de forma descendente por defecto y ascendente si se pide', () => {
    expect(ordenarPeriodos(['2025-2', '2026-1', '2025-1', '2026-2'])).toEqual(['2026-2', '2026-1', '2025-2', '2025-1']);
    expect(ordenarPeriodos(['2025-2', '2026-1', '2025-1', '2025-1'], 'asc')).toEqual([
      '2025-1',
      '2025-1',
      '2025-2',
      '2026-1',
    ]);
  });

  it('formatea el período para mostrarlo y deja igual lo que no reconoce', () => {
    expect(formatearPeriodo('2026-1')).toBe('2026 - Primer Semestre');
    expect(formatearPeriodo('2026-2')).toBe('2026 - Segundo Semestre');
    expect(formatearPeriodo('Todos')).toBe('Todos');
    expect(formatearPeriodo('')).toBe('');
  });
});
