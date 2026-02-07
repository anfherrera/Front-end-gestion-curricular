/**
 * Sistema de Diseño TIC - Universidad del Cauca
 * Tokens TypeScript para estilos inline y lógica
 * Documento: Sistema de Diseño UX-UI, División TIC, 2024
 */

import { MatSnackBarConfig } from '@angular/material/snack-bar';

/** Colores institucionales (hex) para uso en estilos inline/TypeScript */
export const COLORS = {
  primary: '#000066',
  primaryLight: '#5056AC',
  primaryDark: '#07184A',
  secondary: '#9D0311',
  secondaryLight: '#DB141C',
  secondaryDark: '#690007',
  error: '#FF6D0A',
  tertiary: '#1D72D3',
  success: '#249337',
  neutralText: '#454444',
  breadcrumb: '#A7A6B0',
} as const;

/** Configuración de snackbar según TIC: 5s, superior derecha */
export const SNACKBAR_CONFIG_TIC: MatSnackBarConfig = {
  duration: 5000,
  horizontalPosition: 'end',
  verticalPosition: 'top',
};

/** Snackbar con panelClass - merge con SNACKBAR_CONFIG_TIC */
export function snackbarConfig(panelClass?: string[]): MatSnackBarConfig {
  return panelClass ? { ...SNACKBAR_CONFIG_TIC, panelClass } : SNACKBAR_CONFIG_TIC;
}

/** Mapeo de estados a iconos Material Icons (no Font Awesome) */
export const ICONS_BY_STATE: Record<string, string> = {
  APROBADA: 'check_circle',
  APROBADA_FUNCIONARIO: 'check_circle',
  PAGO_VALIDADO: 'check_circle',
  RECHAZADA: 'cancel',
  RECHAZADO: 'cancel',
  PAGO_RECHAZADO: 'cancel',
  ENVIADA: 'send',
  ENVIADO: 'send',
  PENDIENTE: 'schedule',
  EN_PROCESO: 'schedule',
  INFO: 'info',
  WARNING: 'warning',
};

/** Mapeo de estados a colores institucionales */
export const COLORS_BY_STATE: Record<string, string> = {
  APROBADA: COLORS.success,
  APROBADA_FUNCIONARIO: COLORS.success,
  PAGO_VALIDADO: COLORS.success,
  RECHAZADA: COLORS.error,
  RECHAZADO: COLORS.error,
  PAGO_RECHAZADO: COLORS.error,
  ENVIADA: COLORS.tertiary,
  ENVIADO: COLORS.tertiary,
  PENDIENTE: COLORS.error,
  EN_PROCESO: COLORS.tertiary,
};

/** Nombre del sistema para header */
export const SYSTEM_NAME = 'Sistema de Gestión Curricular';
