import { registerLocaleData } from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';
import { coincidenPorPalabrasClave, normalizarNombreArchivo, tamanoEnMb } from './texto.util';
import { NombreDocentePipe } from '@shared/pipes/nombre-docente.pipe';

describe('texto.util', () => {
  beforeAll(() => registerLocaleData(localeEsCO));

  it('da el tamaño en MB con dos decimales y la coma de es-CO', () => {
    expect(tamanoEnMb(2465792, 'es-CO')).toBe('2,35');
    expect(tamanoEnMb(11 * 1024 * 1024, 'es-CO')).toBe('11,00');
    expect(tamanoEnMb(2465792, 'en-US')).toBe('2.35');
  });

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
    expect(
      pipe.transform({ objDocente: { nombre_docente: 'Ana Ruiz' } } as Parameters<NombreDocentePipe['transform']>[0])
    ).toBe('Ana Ruiz');
  });
});
