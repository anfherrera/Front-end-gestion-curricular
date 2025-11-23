/**
 * Modelos de datos para el sistema de notificaciones
 */

export enum TipoSolicitud {
  ECAES = 'ECAES',
  REINGRESO = 'REINGRESO',
  HOMOLOGACION = 'HOMOLOGACION',
  PAZ_Y_SALVO = 'PAZ_Y_SALVO',
  CURSO_VERANO_PREINSCRIPCION = 'CURSO_VERANO_PREINSCRIPCION',
  CURSO_VERANO_INSCRIPCION = 'CURSO_VERANO_INSCRIPCION'
}

export enum TipoNotificacion {
  NUEVA_SOLICITUD = 'NUEVA_SOLICITUD',
  CAMBIO_ESTADO = 'CAMBIO_ESTADO',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  ENVIADA = 'ENVIADA'
}

/**
 * DTO para crear una notificación manualmente
 */
export interface NotificacionDTOPeticion {
  id_notificacion?: number;
  tipoSolicitud: TipoSolicitud | string;
  tipoNotificacion: TipoNotificacion | string;
  titulo: string;
  mensaje: string;
  fechaCreacion?: Date | string;
  leida?: boolean;
  esUrgente?: boolean;
  accion?: string;
  urlAccion?: string;
  idUsuario: number;
  idSolicitud?: number;
  idCurso?: number;
}

/**
 * DTO de respuesta del servidor
 */
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

/**
 * Respuesta del endpoint de notificaciones del header (compatible con código existente)
 */
export interface NotificacionesResponse {
  totalNoLeidas: number;
  cursosVeranoNoLeidas: number;
  notificaciones: Notificacion[];
  categorias: {
    CURSO_VERANO: number;
    ECAES: number;
    REINGRESO: number;
    HOMOLOGACION: number;
    PAZ_SALVO: number;
  };
}



