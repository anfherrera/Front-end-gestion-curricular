import { aFecha, fechaRelativa, formatearFecha } from './fecha.util';
import { FechaPipe } from '@shared/pipes/fecha.pipe';

describe('fecha.util', () => {
  it('lee "aaaa-mm-dd" como día local (no se corre al día anterior)', () => {
    const fecha = aFecha('2025-01-15')!;
    expect(fecha.getFullYear()).toBe(2025);
    expect(fecha.getMonth()).toBe(0);
    expect(fecha.getDate()).toBe(15);
    expect(formatearFecha('2025-01-15')).toBe('15/01/2025');
  });

  it('da los formatos corto, medio y largo', () => {
    const fecha = new Date(2025, 0, 15, 14, 30);
    expect(formatearFecha(fecha, 'corta')).toBe('15/01/2025');
    expect(formatearFecha(fecha, 'corta-hora')).toBe('15/01/2025, 14:30');
    expect(formatearFecha(fecha, 'larga')).toBe('15 de enero de 2025');
    expect(formatearFecha(fecha, 'media')).toMatch(/^15 ene\.? 2025$/);
    expect(formatearFecha(fecha, 'larga-hora')).toContain('15 de enero de 2025');
  });

  it('devuelve el texto de vacío o el valor original si no es fecha', () => {
    expect(formatearFecha(null)).toBe('');
    expect(formatearFecha(undefined, 'corta', 'N/A')).toBe('N/A');
    expect(formatearFecha('sin fecha')).toBe('sin fecha');
  });

  it('expresa el tiempo transcurrido', () => {
    const ahora = new Date(2025, 0, 15, 12, 0);
    expect(fechaRelativa(new Date(2025, 0, 15, 11, 59, 30), ahora)).toBe('Ahora');
    expect(fechaRelativa(new Date(2025, 0, 15, 11, 55), ahora)).toBe('Hace 5 minutos');
    expect(fechaRelativa(new Date(2025, 0, 15, 11, 0), ahora)).toBe('Hace 1 hora');
    expect(fechaRelativa(new Date(2025, 0, 13, 12, 0), ahora)).toBe('Hace 2 días');
    expect(fechaRelativa(new Date(2025, 0, 1), ahora)).toMatch(/^1 ene\.? 2025$/);
  });

  it('el pipe fecha usa la misma función', () => {
    const pipe = new FechaPipe();
    expect(pipe.transform('2025-01-15')).toBe('15/01/2025');
    expect(pipe.transform('2025-01-15', 'larga')).toBe('15 de enero de 2025');
    expect(pipe.transform(null, 'corta', '-')).toBe('-');
  });
});
