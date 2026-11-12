import { DocumentoHomologacion, Solicitud, SolicitudHomologacionDTORespuesta } from '../../../core/models/procesos.model';
import { SolicitudStatusEnum } from '../../../core/enums/solicitud-status.enum';
import { DocumentoPazSalvoRespuesta } from '../../../core/services/paz-salvo.service';

/** Funciones compartidas por las bandejas de paz y salvo (funcionario, coordinador y secretaría). */

/** Estado del último registro de la solicitud. */
export function estadoActual(sol: SolicitudHomologacionDTORespuesta): string {
  const estados = sol.estadosSolicitud;
  return estados && estados.length > 0 ? estados[estados.length - 1].estado_actual : 'Pendiente';
}

/** Fecha del último estado (cuando se procesó), en formato local. */
export function fechaProcesamiento(sol: SolicitudHomologacionDTORespuesta): string {
  const estados = sol.estadosSolicitud;
  const ultimo = estados && estados.length > 0 ? estados[estados.length - 1] : null;
  if (!ultimo?.fecha_registro_estado) return '';
  return new Date(ultimo.fecha_registro_estado).toLocaleString('es-ES', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

/** Fila para RequestStatusTableComponent. La fecha va en ISO: el pipe `fecha` la formatea. */
export function aFilaTabla(sol: SolicitudHomologacionDTORespuesta): Solicitud {
  const ultimoEstado = sol.estadosSolicitud?.[sol.estadosSolicitud.length - 1];
  return {
    id: sol.id_solicitud,
    nombre: sol.nombre_solicitud,
    fecha: sol.fecha_registro_solicitud,
    estado: (ultimoEstado?.estado_actual as SolicitudStatusEnum) || SolicitudStatusEnum.ENVIADA,
    comentarios: ultimoEstado?.comentario || '',
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
  return { ...aFilaTabla(sol), fechaProcesamiento: fechaProcesamiento(sol) } as Solicitud;
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
