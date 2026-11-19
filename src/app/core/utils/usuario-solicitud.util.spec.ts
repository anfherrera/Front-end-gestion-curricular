import { usuarioParaSolicitud } from './usuario-solicitud.util';

describe('usuarioParaSolicitud', () => {
  it('arma el objUsuario plano que espera el backend', () => {
    expect(
      usuarioParaSolicitud({
        id_usuario: 7,
        nombre_completo: 'Ana Pérez',
        codigo: '104612345',
        cedula: '1061000000',
        correo: 'ana@unicauca.edu.co',
        estado_usuario: true,
        rol: { id_rol: 2, nombre: 'Estudiante' },
        objPrograma: { id_programa: 3, nombre_programa: 'Ingenieria Automatica Industrial' },
      })
    ).toEqual({
      id_usuario: 7,
      nombre_completo: 'Ana Pérez',
      codigo: '104612345',
      cedula: '1061000000',
      correo: 'ana@unicauca.edu.co',
      estado_usuario: true,
      id_rol: 2,
      id_programa: 3,
    });
  });

  it('usa el código como cédula y valores mínimos si faltan datos', () => {
    const datos = usuarioParaSolicitud({ id_usuario: 1, nombre_completo: 'Sin datos', codigo: 'EST01' });
    expect(datos.cedula).toBe('EST01');
    expect(datos.correo).toBe('');
    expect(datos.estado_usuario).toBeTrue();
    expect(datos.id_rol).toBe(1);
    expect(datos.id_programa).toBe(1);
  });
});
