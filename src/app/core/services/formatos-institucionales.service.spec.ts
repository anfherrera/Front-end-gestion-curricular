import { FORMATO_IDS, FormatoInstitucional, FormatosInstitucionalesService } from './formatos-institucionales.service';

describe('FormatosInstitucionalesService', () => {
  const clave = 'formatos_institucionales';

  beforeEach(() => localStorage.removeItem(clave));
  afterEach(() => localStorage.removeItem(clave));

  it('sin nada guardado usa los formatos por defecto', () => {
    const service = new FormatosInstitucionalesService();
    expect(service.getAll().map((f) => f.id)).toEqual(['reingreso', 'homologacion']);
    expect(service.getReingreso().nombre).toBe('PM-FO-4-FOR-17 Solicitud de Reingreso V2');
    expect(service.getHomologacion().nombre).toBe('PM-FO-4-FOR-22-Solicitud-Homologacion-de-Asignaturas-V1');
    expect(service.getFormato(FORMATO_IDS.REINGRESO)?.procesoLabel).toBe('Reingreso Estudiante');
  });

  it('actualiza nombre y url recortados, los guarda y otra instancia los lee', () => {
    const service = new FormatosInstitucionalesService();
    service.actualizar(FORMATO_IDS.HOMOLOGACION, { nombre: '  Formato nuevo ', url: ' https://ejemplo.edu.co/f ' });
    expect(service.getHomologacion()).toEqual({ nombre: 'Formato nuevo', url: 'https://ejemplo.edu.co/f' });

    // Solo la url: el nombre se conserva.
    service.actualizar(FORMATO_IDS.HOMOLOGACION, { url: 'https://ejemplo.edu.co/g' });
    const otra = new FormatosInstitucionalesService();
    expect(otra.getHomologacion()).toEqual({ nombre: 'Formato nuevo', url: 'https://ejemplo.edu.co/g' });
    // El otro formato sigue con su valor por defecto.
    expect(otra.getReingreso().nombre).toBe('PM-FO-4-FOR-17 Solicitud de Reingreso V2');
  });

  it('completa con los valores por defecto los formatos que falten en lo guardado', () => {
    const guardado: FormatoInstitucional[] = [
      { id: FORMATO_IDS.REINGRESO, nombre: 'Reingreso local', url: 'https://x', procesoLabel: 'Reingreso Estudiante' },
    ];
    localStorage.setItem(clave, JSON.stringify(guardado));
    const service = new FormatosInstitucionalesService();
    expect(service.getReingreso()).toEqual({ nombre: 'Reingreso local', url: 'https://x' });
    expect(service.getAll()[1].nombre).toBe('PM-FO-4-FOR-22-Solicitud-Homologacion-de-Asignaturas-V1');
  });

  it('si lo guardado no es JSON válido vuelve a los valores por defecto', () => {
    localStorage.setItem(clave, '{roto');
    const service = new FormatosInstitucionalesService();
    expect(service.getAll().length).toBe(2);
    expect(service.getReingreso().url).toBe('https://share.google/YWwAuZFs7tytr6sNu');
  });

  it('ignora ids desconocidos', () => {
    const service = new FormatosInstitucionalesService();
    service.actualizar('otro' as never, { nombre: 'x' });
    expect(service.getFormato('otro' as never)).toBeNull();
    expect(localStorage.getItem(clave)).toBeNull();
  });
});
