import { CursoEstadosService } from './curso-estados.service';

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

  it('da el icono de cada estado, con uno por defecto si no lo conoce', () => {
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
});
