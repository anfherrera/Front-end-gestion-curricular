import { corregirEncodingObjeto } from './encoding.utils';

describe('encoding.utils', () => {
  it('corrige textos UTF-8 leídos como Latin-1', () => {
    expect(corregirEncodingObjeto('IngenierÃ­a ElectrÃ³nica')).toBe('Ingeniería Electrónica');
    expect(corregirEncodingObjeto('EspaÃ±a, MarÃ­a, Ã\u0081lvaro')).toBe('España, María, Álvaro');
    expect(corregirEncodingObjeto('Sin cambios')).toBe('Sin cambios');
  });

  it('recorre objetos y arreglos anidados y deja igual lo que no es texto', () => {
    const entrada = {
      id: 3,
      activo: true,
      nombre: 'JosÃ©',
      roles: [{ nombre: 'SecretarÃ­a' }, 'Funcionario'],
      programa: null,
      vacio: '',
    };
    expect(corregirEncodingObjeto(entrada)).toEqual({
      id: 3,
      activo: true,
      nombre: 'José',
      roles: [{ nombre: 'Secretaría' }, 'Funcionario'],
      programa: null,
      vacio: '',
    });
  });

  it('devuelve tal cual los valores vacíos', () => {
    expect(corregirEncodingObjeto(null)).toBeNull();
    expect(corregirEncodingObjeto(undefined)).toBeUndefined();
    expect(corregirEncodingObjeto(0)).toBe(0);
  });
});
