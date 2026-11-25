export enum TipoSolicitud {
  ECAES = 'ECAES',
  REINGRESO = 'REINGRESO',
  HOMOLOGACION = 'HOMOLOGACION',
  PAZ_Y_SALVO = 'PAZ_Y_SALVO',
  CURSO_VERANO_PREINSCRIPCION = 'CURSO_VERANO_PREINSCRIPCION',
  CURSO_VERANO_INSCRIPCION = 'CURSO_VERANO_INSCRIPCION',
}

export interface NotificacionDTORespuesta {
  id_notificacion: number;
  tipoSolicitud: string;
  tipoNotificacion: string;
  titulo: string;
  mensaje: string;
  fechaCreacion: Date | string;
  leida: boolean;
  esUrgente: boolean;
  accion?: string;
  urlAccion?: string;

  // Información del usuario
  idUsuario: number;
  nombreUsuario: string;
  emailUsuario: string;

  // Información de la solicitud relacionada
  idSolicitud?: number;
  nombreSolicitud?: string;

  // Información del curso relacionado
  idCurso?: number;
  nombreCurso?: string;
  nombreMateria?: string;
}

/**
 * Interfaz extendida para uso en componentes (con campos calculados)
 */
export interface Notificacion extends NotificacionDTORespuesta {
  // Campos calculados en el frontend
  tiempoTranscurrido?: string;
  categoria?: string;
  icono?: string;
  color?: string;
}
