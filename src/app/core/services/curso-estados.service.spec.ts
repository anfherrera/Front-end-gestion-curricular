import { CursoEstadosService } from './curso-estados.service';
import { COLORS } from '../design-system/design-tokens';

describe('CursoEstadosService', () => {
  const service = new CursoEstadosService();

  it('lista los seis estados del curso y los busca por valor', () => {
    expect(service.getEstadosDisponibles().map((e) => e.value)).toEqual([
      'Borrador',
      'Abierto',
      'Publicado',
      'Preinscripción',
      'Inscripción',
      'Cerrado',
    ]);
    expect(service.getEstadoPorValor('Cerrado')?.icon).toBe('lock');
    expect(service.getEstadoPorValor('Inexistente')).toBeUndefined();
  });

  it('da el color y el icono de cada estado, con valores por defecto si no lo conoce', () => {
    expect(service.getColorEstado('Preinscripción')).toBe(COLORS.success);
    expect(service.getColorEstado('Cerrado')).toBe(COLORS.neutralSecondary);
    expect(service.getColorEstado('Otro')).toBe(COLORS.neutralSecondary);
    expect(service.getIconoEstado('Inscripción')).toBe('person_add');
    expect(service.getIconoEstado('Otro')).toBe('help_outline');
  });

  it('da la clase de etiqueta de cada estado; ninguno usa el color de error', () => {
    expect(service.getClaseEstado('Borrador')).toBe('estado-default');
    expect(service.getClaseEstado('Abierto')).toBe('estado-proceso');
    expect(service.getClaseEstado('Publicado')).toBe('estado-enviada');
    expect(service.getClaseEstado('Preinscripción')).toBe('estado-aprobada');
    expect(service.getClaseEstado('Inscripción')).toBe('estado-aprobada');
    expect(service.getClaseEstado('Cerrado')).toBe('estado-default');
    expect(service.getClaseEstado(undefined)).toBe('estado-default');
    // El backend manda algunos estados sin tilde
    expect(service.getClaseEstado('Preinscripcion')).toBe('estado-aprobada');
    expect(service.getIconoEstado('Inscripcion')).toBe('person_add');
  });

  it('valida las transiciones de estado', () => {
    expect(service.validarTransicionEstado('Sin_Estado', 'Borrador')).toBeTrue();
    expect(service.validarTransicionEstado('Publicado', 'Preinscripción')).toBeTrue();
    expect(service.validarTransicionEstado('Preinscripción', 'Publicado')).toBeTrue();
    expect(service.validarTransicionEstado('Borrador', 'Cerrado')).toBeFalse();
    expect(service.validarTransicionEstado('Cerrado', 'Borrador')).toBeFalse();
    expect(service.validarTransicionEstado('Otro', 'Borrador')).toBeFalse();
    expect(service.getEstadosPermitidos('Inscripción')).toEqual(['Cerrado', 'Preinscripción']);
    expect(service.getEstadosPermitidos('Otro')).toEqual([]);
  });

  it('comprueba los permisos por estado y rol', () => {
    expect(service.tienePermiso('Borrador', 'FUNCIONARIO', 'eliminar')).toBeTrue();
    expect(service.tienePermiso('Abierto', 'FUNCIONARIO', 'eliminar')).toBeFalse();
    expect(service.tienePermiso('Preinscripción', 'ESTUDIANTE', 'preinscribirse')).toBeTrue();
    expect(service.tienePermiso('Borrador', 'ESTUDIANTE', 'ver')).toBeFalse();
    expect(service.tienePermiso('Otro', 'FUNCIONARIO', 'ver')).toBeFalse();
    expect(service.tienePermiso('Cerrado', 'ADMIN', 'ver')).toBeFalse();
    expect(service.getPermisos('Cerrado', 'COORDINADOR')).toEqual(['ver', 'consultar']);
    expect(service.getPermisos('Otro', 'COORDINADOR')).toEqual([]);
  });

  it('arma los mensajes de error de transición y de permiso', () => {
    expect(service.getMensajeErrorTransicion('Cerrado', 'Abierto')).toBe(
      'El curso está en estado "Cerrado" y no se puede cambiar su estado'
    );
    expect(service.getMensajeErrorTransicion('Abierto', 'Cerrado')).toBe(
      'Desde "Abierto" solo se puede cambiar a: Publicado, Borrador'
    );
    expect(service.getMensajeErrorPermiso('Borrador', 'ESTUDIANTE', 'ver')).toBe(
      'El rol ESTUDIANTE no tiene permisos para realizar operaciones en el estado: Borrador'
    );
    expect(service.getMensajeErrorPermiso('Abierto', 'FUNCIONARIO', 'eliminar')).toBe(
      'El rol FUNCIONARIO no puede realizar la operación "eliminar" en el estado Abierto'
    );
  });
});
