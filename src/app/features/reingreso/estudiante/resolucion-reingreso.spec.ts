import { documentoDeResolucion, nombreDesdeRuta } from './resolucion-reingreso';

describe('documentoDeResolucion', () => {
  const requeridos = [
    'PM-FO-4-FOR-17 Solicitud de Reingreso V2',
    'Certificado de notas',
    'Documento de identidad',
    'Carta de motivación',
  ];
  const doc = (nombre: string, fecha_documento?: string, ruta_documento?: string) => ({
    nombre,
    fecha_documento,
    ruta_documento,
  });

  it('no toma los documentos requeridos, con o sin extensión', () => {
    expect(
      documentoDeResolucion(
        [doc('PM-FO-4-FOR-17 Solicitud de Reingreso V2.pdf'), doc('certificado de notas')],
        requeridos
      )
    ).toBeUndefined();
  });

  it('elige el más reciente entre los que parecen resolución', () => {
    const elegido = documentoDeResolucion(
      [
        doc('Oficio de reingreso.pdf', '2026-11-02'),
        doc('Resolucion 7.pdf', '2026-11-10'),
        doc('respuesta.docx', '2026-11-05'),
      ],
      requeridos
    );
    expect(elegido?.nombre).toBe('Resolucion 7.pdf');
  });

  it('reconoce la resolución por la ruta y, si no, cualquier PDF que no sea requerido', () => {
    expect(documentoDeResolucion([doc('archivo.docx', undefined, 'oficios/archivo.docx')], requeridos)?.nombre).toBe(
      'archivo.docx'
    );
    expect(documentoDeResolucion([doc('cedula.pdf')], requeridos)?.nombre).toBe('cedula.pdf');
    expect(documentoDeResolucion([doc('foto.png')], requeridos)).toBeUndefined();
  });

  it('acepta una lista vacía o ausente', () => {
    expect(documentoDeResolucion(null, requeridos)).toBeUndefined();
    expect(documentoDeResolucion([], requeridos)).toBeUndefined();
  });
});

describe('nombreDesdeRuta', () => {
  it('devuelve el último tramo con / o \\', () => {
    expect(nombreDesdeRuta('a/b/oficio.pdf')).toBe('oficio.pdf');
    expect(nombreDesdeRuta('a\\b\\oficio.pdf')).toBe('oficio.pdf');
    expect(nombreDesdeRuta(undefined)).toBe('');
  });
});
