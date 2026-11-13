import { DocumentoHomologacion, Solicitud, SolicitudHomologacionDTORespuesta } from '../../../core/models/procesos.model';
import { EstadosSolicitud } from '../../../core/enums/estados-solicitud.enum';
import { DocumentoPazSalvoRespuesta } from '../../../core/services/paz-salvo.service';
import { ultimoEstado } from '../../../core/utils/estado-solicitud.util';
import { formatearFecha } from '../../../core/utils/fecha.util';

/** Funciones compartidas por las bandejas de paz y salvo (funcionario, coordinador y secretaría). */

/** Fila para RequestStatusTableComponent. La fecha va en ISO: el pipe `fecha` la formatea. */
export function aFilaTabla(sol: SolicitudHomologacionDTORespuesta): Solicitud {
  const ultimo = ultimoEstado(sol);
  return {
    id: sol.id_solicitud,
    nombre: sol.nombre_solicitud,
    fecha: sol.fecha_registro_solicitud,
    estado: ultimo?.estado_actual || EstadosSolicitud.ENVIADA,
    comentarios: ultimo?.comentario || '',
    archivos: sol.documentos?.map((doc: DocumentoHomologacion) => ({
      id_documento: doc.id_documento,
      nombre: doc.nombre,
      ruta_documento: doc.ruta_documento,
      fecha: doc.fecha_documento,
      esValido: doc.esValido,
      comentario: doc.comentario
    })) || []
  } as Solicitud;
}

/** Fila del historial: igual que la de pendientes, con la fecha en que se procesó. */
export function aFilaHistorial(sol: SolicitudHomologacionDTORespuesta): Solicitud {
  const fechaProcesamiento = formatearFecha(ultimoEstado(sol)?.fecha_registro_estado, 'corta-hora');
  return { ...aFilaTabla(sol), fechaProcesamiento } as Solicitud;
}

/** Documentos tal como los devuelven los endpoints obtenerOficios / obtenerDocumentos. */
export function aDocumentos(documentos: DocumentoPazSalvoRespuesta[]): DocumentoHomologacion[] {
  return documentos.map(doc => ({
    id_documento: doc.id,
    nombre: doc.nombreArchivo || doc.nombre,
    ruta_documento: doc.ruta ?? '',
    fecha_documento: doc.fecha ?? '',
    esValido: doc.esValido ?? false,
    comentario: doc.comentario
  }));
}
