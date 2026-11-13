/**
 * Utilidades para el sistema de notificaciones
 */

import { Notificacion } from '../models/notificaciones.model';
import { fechaRelativa } from './fecha.util';

/**
 * Obtiene el icono de Material Icons por tipo de notificación
 */
export function getIconByTipoNotificacion(tipoNotificacion: string): string {
  const iconos: Record<string, string> = {
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
  const iconos: Record<string, string> = {
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
  const colores: Record<string, string> = {
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
 * Obtiene el nombre de categoría para mostrar
 */
export function getCategoriaDisplay(tipoSolicitud: string): string {
  const categorias: Record<string, string> = {
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
function enrichNotificacion(notificacion: any): Notificacion {
  return {
    ...notificacion,
    tiempoTranscurrido: fechaRelativa(notificacion.fechaCreacion),
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

