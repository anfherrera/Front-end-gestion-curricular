import { EstadosSolicitud } from '../enums/estados-solicitud.enum';
import { COLORS } from '../design-system/design-tokens';
import {
  estadoActual, estadoClase, estadoColor, estadoIcono, estadoLabel, normalizarEstado, ultimoEstado
} from './estado-solicitud.util';

describe('estado-solicitud.util', () => {
  it('normaliza textos, tildes y guiones al código del backend', () => {
    expect(normalizarEstado('Aprobada')).toBe(EstadosSolicitud.APROBADA);
    expect(normalizarEstado('En revisión por Secretaría')).toBe(EstadosSolicitud.EN_REVISION_SECRETARIA);
    expect(normalizarEstado('en_revision_funcionario')).toBe(EstadosSolicitud.EN_REVISION_FUNCIONARIO);
    expect(normalizarEstado('Aprobada por Coordinador')).toBe(EstadosSolicitud.APROBADA_COORDINADOR);
    expect(normalizarEstado('pre-registrado')).toBe(EstadosSolicitud.PRE_REGISTRADO);
    expect(normalizarEstado('preregistrado')).toBe(EstadosSolicitud.PRE_REGISTRADO);
    expect(normalizarEstado(undefined)).toBe('');
  });

  it('toma el estado del último registro o "Pendiente"', () => {
    const sol = { estadosSolicitud: [{ estado_actual: 'ENVIADA' }, { estado_actual: 'APROBADA_FUNCIONARIO' }] };
    expect(estadoActual(sol)).toBe('APROBADA_FUNCIONARIO');
    expect(ultimoEstado(sol)?.estado_actual).toBe('APROBADA_FUNCIONARIO');
    expect(estadoActual({ estadosSolicitud: [] })).toBe('Pendiente');
    expect(estadoActual({})).toBe('Pendiente');
  });

  it('da el texto para mostrar y deja igual lo desconocido', () => {
    expect(estadoLabel('APROBADA_FUNCIONARIO')).toBe('Aprobada por Funcionario');
    expect(estadoLabel('Pendiente')).toBe('Pendiente');
  });

  it('da color e icono institucionales', () => {
    expect(estadoColor('Aprobada')).toBe(COLORS.success);
    expect(estadoColor('desconocido')).toBe(COLORS.neutralText);
    expect(estadoIcono('RECHAZADA')).toBe('cancel');
    expect(estadoIcono(null)).toBe('info');
  });

  it('agrupa estados equivalentes en la misma clase CSS', () => {
    expect(estadoClase('APROBADA_COORDINADOR')).toBe('estado-aprobada');
    expect(estadoClase('APROBADO')).toBe('estado-aprobada');
    expect(estadoClase('PAGO_VALIDADO')).toBe('estado-aprobada');
    expect(estadoClase('Rechazado')).toBe('estado-rechazada');
    expect(estadoClase('ENVIADA')).toBe('estado-enviada');
    expect(estadoClase('En revisión por Funcionario')).toBe('estado-proceso');
    expect(estadoClase('Pendiente')).toBe('estado-default');
  });
});
