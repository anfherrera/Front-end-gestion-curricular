import { coincidenPorPalabrasClave, normalizarNombreArchivo } from './texto.util';
import { NombreDocentePipe } from '../../shared/pipes/nombre-docente.pipe';

describe('texto.util', () => {
  it('normaliza nombres de archivo para compararlos', () => {
    expect(normalizarNombreArchivo('Certificado de Notas.PDF')).toBe('certificadodenotas');
    expect(normalizarNombreArchivo('Cédula_ciudadanía (1).jpg')).toBe('cedulaciudadania1');
  });

  it('reconoce archivos por palabras clave del documento', () => {
    const claves = { certificado: ['certificado', 'notas'] };
    expect(coincidenPorPalabrasClave('certificadonotas2025', 'certificado', claves)).toBeTrue();
    expect(coincidenPorPalabrasClave('cartamotivacion', 'certificado', claves)).toBeFalse();
    expect(coincidenPorPalabrasClave('foto', 'cedula', claves)).toBeFalse();
  });

  it('el pipe nombreDocente cubre curso sin docente', () => {
    const pipe = new NombreDocentePipe();
    expect(pipe.transform(null)).toBe('Sin asignar');
    expect(pipe.transform({ objDocente: { nombre_docente: 'Ana Ruiz' } } as any)).toBe('Ana Ruiz');
  });
});
