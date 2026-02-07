/**
 * Utilidades para el sistema de notificaciones
 */

import { Notificacion, TipoNotificacion, TipoSolicitud } from '../models/notificaciones.model';

/**
 * Formatea una fecha a texto relativo (ej: "Hace 5 minutos")
 */
export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
  if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  if (diffDays < 7) return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;

  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Obtiene el icono de Material Icons por tipo de notificación
 */
export function getIconByTipoNotificacion(tipoNotificacion: string): string {
  const iconos: { [key: string]: string } = {
    'NUEVA_SOLICITUD': 'add_circle',
    'CAMBIO_ESTADO': 'update',
    'APROBADA': 'check_circle',
    'RECHAZADA': 'cancel',
    'ENVIADA': 'send'
  };
  return iconos[tipoNotificacion] || 'notifications';
}

/**
 * Obtiene el icono de Material Icons por tipo de solicitud
 */
export function getIconByTipoSolicitud(tipoSolicitud: string): string {
  const iconos: { [key: string]: string } = {
    'CURSO_VERANO_PREINSCRIPCION': 'school',
    'CURSO_VERANO_INSCRIPCION': 'school',
    'ECAES': 'quiz',
    'REINGRESO': 'person_add',
    'HOMOLOGACION': 'swap_horiz',
    'PAZ_Y_SALVO': 'verified'
  };
  return iconos[tipoSolicitud] || 'notifications';
}

/**
 * Obtiene el color por tipo de solicitud
 */
export function getColorByTipoSolicitud(tipoSolicitud: string): string {
  // Colores institucionales - Sistema de Diseño TIC Universidad del Cauca
  const colores: { [key: string]: string } = {
    'CURSO_VERANO_PREINSCRIPCION': '#1D72D3',
    'CURSO_VERANO_INSCRIPCION': '#000066',
    'ECAES': '#FF6D0A',
    'REINGRESO': '#249337',
    'HOMOLOGACION': '#9D0311',
    'PAZ_Y_SALVO': '#1D72D3'
  };
  return colores[tipoSolicitud] || '#454444';
}

/**
 * Obtiene el color por tipo de notificación
 */
export function getColorByTipoNotificacion(tipoNotificacion: string): string {
  // Colores institucionales - Sistema de Diseño TIC Universidad del Cauca
  const colores: { [key: string]: string } = {
    'NUEVA_SOLICITUD': '#1D72D3',
    'CAMBIO_ESTADO': '#FF6D0A',
    'APROBADA': '#249337',
    'RECHAZADA': '#FF6D0A',
    'ENVIADA': '#1D72D3'
  };
  return colores[tipoNotificacion] || '#454444';
}

/**
 * Obtiene el nombre de categoría para mostrar
 */
export function getCategoriaDisplay(tipoSolicitud: string): string {
  const categorias: { [key: string]: string } = {
    'CURSO_VERANO_PREINSCRIPCION': 'Cursos Intersemestrales',
    'CURSO_VERANO_INSCRIPCION': 'Cursos Intersemestrales',
    'ECAES': 'Pruebas ECAES',
    'REINGRESO': 'Reingreso',
    'HOMOLOGACION': 'Homologación',
    'PAZ_Y_SALVO': 'Paz y Salvo'
  };
  return categorias[tipoSolicitud] || tipoSolicitud;
}

/**
 * Enriquece una notificación con campos calculados
 */
export function enrichNotificacion(notificacion: any): Notificacion {
  return {
    ...notificacion,
    tiempoTranscurrido: formatDate(notificacion.fechaCreacion),
    categoria: getCategoriaDisplay(notificacion.tipoSolicitud),
    icono: getIconByTipoSolicitud(notificacion.tipoSolicitud),
    color: getColorByTipoSolicitud(notificacion.tipoSolicitud)
  };
}

/**
 * Enriquece un array de notificaciones
 */
export function enrichNotificaciones(notificaciones: any[]): Notificacion[] {
  return notificaciones.map(enrichNotificacion);
}



