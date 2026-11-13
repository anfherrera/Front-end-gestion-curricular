import { Solicitud } from '../models/procesos.model';
import { SolicitudRevisable } from '../models/solicitud-revision.model';
import { EstadosSolicitud } from '../enums/estados-solicitud.enum';
import { ultimoEstado } from './estado-solicitud.util';

/** El backend manda las fechas como texto ISO aunque algunos modelos las tipen como Date. */
function aTexto(fecha: string | Date | null | undefined): string {
  if (fecha instanceof Date) return fecha.toISOString();
  return fecha ?? '';
}

/**
 * Fila para RequestStatusTableComponent a partir de la solicitud del backend.
 * La fecha queda en ISO: la tabla la formatea con el pipe `fecha`.
 */
export function aFilaSolicitud(sol: SolicitudRevisable): Solicitud {
  const ultimo = ultimoEstado(sol);
  return {
    id: sol.id_solicitud,
    nombre: sol.nombre_solicitud,
    fecha: aTexto(sol.fecha_registro_solicitud),
    estado: ultimo?.estado_actual || EstadosSolicitud.ENVIADA,
    comentarios: ultimo?.comentario || '',
    archivos: (sol.documentos ?? []).map(doc => ({
      id_documento: doc.id_documento,
      nombre: doc.nombre,
      ruta_documento: doc.ruta_documento,
      fecha: aTexto(doc.fecha_documento),
      esValido: doc.esValido,
      comentario: doc.comentario
    }))
  };
}
