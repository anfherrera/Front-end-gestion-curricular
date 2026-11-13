import { aFilaSolicitud } from './fila-solicitud.util';
import { SolicitudRevisable } from '../models/solicitud-revision.model';

describe('aFilaSolicitud', () => {
  const base: SolicitudRevisable = {
    id_solicitud: 7,
    nombre_solicitud: 'Solicitud Homologación - Ana',
    fecha_registro_solicitud: '2026-03-01T10:00:00',
    estadosSolicitud: [
      { estado_actual: 'ENVIADA', fecha_registro_estado: '2026-03-01T10:00:00' },
      { estado_actual: 'APROBADA_FUNCIONARIO', fecha_registro_estado: '2026-03-02T09:00:00', comentario: 'Todo en orden' }
    ],
    documentos: [
      { id_documento: 3, nombre: 'notas.pdf', ruta_documento: '/d/notas.pdf', fecha_documento: '2026-03-01', esValido: true }
    ]
  };

  it('usa el último estado y su comentario', () => {
    const fila = aFilaSolicitud(base);
    expect(fila.id).toBe(7);
    expect(fila.estado).toBe('APROBADA_FUNCIONARIO');
    expect(fila.comentarios).toBe('Todo en orden');
    expect(fila.fecha).toBe('2026-03-01T10:00:00');
  });

  it('sin historial queda ENVIADA y sin documentos deja la lista vacía', () => {
    const fila = aFilaSolicitud({ ...base, estadosSolicitud: [], documentos: null });
    expect(fila.estado).toBe('ENVIADA');
    expect(fila.comentarios).toBe('');
    expect(fila.archivos).toEqual([]);
  });

  it('pasa los documentos a archivos y las fechas Date a texto ISO', () => {
    const fecha = new Date(Date.UTC(2026, 2, 1));
    const fila = aFilaSolicitud({
      ...base,
      fecha_registro_solicitud: fecha,
      documentos: [{ ...base.documentos![0], fecha_documento: fecha }]
    });
    expect(fila.fecha).toBe('2026-03-01T00:00:00.000Z');
    expect(fila.archivos).toEqual([{
      id_documento: 3, nombre: 'notas.pdf', ruta_documento: '/d/notas.pdf',
      fecha: '2026-03-01T00:00:00.000Z', esValido: true, comentario: undefined
    }]);
  });
});
