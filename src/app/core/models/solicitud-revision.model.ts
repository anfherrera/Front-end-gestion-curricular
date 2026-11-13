import { SolicitudHomologacionDTORespuesta, SolicitudReingresoDTORespuesta } from './procesos.model';

/** Roles que revisan solicitudes antes de secretaría. Llega en `data.rolRevision` de la ruta. */
export type RolRevision = 'funcionario' | 'coordinador';

/** Solicitudes del flujo funcionario → coordinador → secretaría (SolicitudesAprobacionService). */
export type SolicitudAprobable = SolicitudHomologacionDTORespuesta | SolicitudReingresoDTORespuesta;

/**
 * Lo mínimo que necesitan las bandejas de revisión de una solicitud del backend.
 * Lo cumplen las respuestas de paz y salvo, homologación y reingreso
 * (SolicitudHomologacionDTORespuesta, SolicitudReingresoDTORespuesta).
 */
export interface SolicitudRevisable {
  id_solicitud: number;
  nombre_solicitud: string;
  fecha_registro_solicitud: string | Date;
  estadosSolicitud?: EstadoRevisable[] | null;
  documentos?: DocumentoRevisable[] | null;
}

export interface EstadoRevisable {
  estado_actual: string;
  fecha_registro_estado?: string | Date;
  comentario?: string | null;
}

export interface DocumentoRevisable {
  id_documento: number;
  nombre: string;
  ruta_documento: string;
  fecha_documento: string | Date;
  esValido: boolean;
  comentario?: string | null;
}
