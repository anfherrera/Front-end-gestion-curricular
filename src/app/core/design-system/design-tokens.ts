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
  /** Texto secundario (--neutro-600). */
  neutralSecondary: '#757474',
  /** Texto de error legible sobre blanco (--notif-error-titulo); #FF6D0A queda para fondos, bordes e iconos. */
  errorText: '#8D3800',
  white: '#FFFFFF',
  breadcrumb: '#A7A6B0',
} as const;

/**
 * Fuentes para HTML que no hereda los estilos de la app (ventanas emergentes).
 * En CSS usar var(--font-body) y var(--font-display).
 */
export const FONTS = {
  body: "'Open Sans', sans-serif",
  display: "'Titillium Web', sans-serif",
  /** Hoja de Google Fonts con las dos fuentes, la misma que carga index.html. */
  hojaGoogleFonts:
    'https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700&family=Open+Sans:wght@300;400;500;600;700&display=swap',
} as const;

/** Paleta para series de gráficos (categorías sin un color propio), solo con colores institucionales. */
export const PALETA_CATEGORIAS: readonly string[] = [
  COLORS.primary,
  COLORS.tertiary,
  COLORS.success,
  COLORS.error,
  COLORS.secondary,
  COLORS.primaryLight,
];

/** Color de cada proceso, el mismo en gráficos, tarjetas y notificaciones. */
export const COLOR_POR_PROCESO = {
  cursosVerano: COLORS.primary,
  pazSalvo: COLORS.tertiary,
  reingreso: COLORS.success,
  ecaes: COLORS.error,
  homologacion: COLORS.secondary,
} as const;

/** Un color hex de la paleta con transparencia, para rellenos de gráficos. */
export function conAlfa(hex: string, alfa: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alfa})`;
}

/** Configuración de snackbar según TIC: 5s, superior derecha. Se usa a través de SnackbarService. */
export const SNACKBAR_CONFIG_TIC: MatSnackBarConfig = {
  duration: 5000,
  horizontalPosition: 'end',
  verticalPosition: 'top',
};

/** Mapeo de estados a iconos Material Icons (no Font Awesome) */
export const ICONS_BY_STATE: Record<string, string> = {
  APROBADA: 'check_circle',
  APROBADA_FUNCIONARIO: 'check_circle',
  APROBADA_COORDINADOR: 'check_circle',
  APROBADO: 'check_circle',
  PAGO_VALIDADO: 'check_circle',
  RECHAZADA: 'cancel',
  RECHAZADO: 'cancel',
  PAGO_RECHAZADO: 'cancel',
  ENVIADA: 'send',
  ENVIADO: 'send',
  EN_REVISION: 'hourglass_top',
  EN_REVISION_SECRETARIA: 'hourglass_top',
  EN_REVISION_FUNCIONARIO: 'hourglass_top',
  EN_REVISION_COORDINADOR: 'hourglass_top',
  PRE_REGISTRADO: 'info',
  'PRE-REGISTRADO': 'info',
  PREREGISTRADO: 'info',
  PENDIENTE: 'schedule',
  EN_PROCESO: 'schedule',
  INFO: 'info',
  WARNING: 'warning',
};

/** Mapeo de estados a colores institucionales */
export const COLORS_BY_STATE: Record<string, string> = {
  APROBADA: COLORS.success,
  APROBADA_FUNCIONARIO: COLORS.success,
  APROBADA_COORDINADOR: COLORS.success,
  APROBADO: COLORS.success, // preinscripciones de cursos de verano
  PAGO_VALIDADO: COLORS.success,
  RECHAZADA: COLORS.error,
  RECHAZADO: COLORS.error,
  PAGO_RECHAZADO: COLORS.error,
  ENVIADA: COLORS.tertiary,
  ENVIADO: COLORS.tertiary,
  EN_REVISION: COLORS.primary,
  EN_REVISION_SECRETARIA: COLORS.primary,
  EN_REVISION_FUNCIONARIO: COLORS.primary,
  EN_REVISION_COORDINADOR: COLORS.primary,
  PRE_REGISTRADO: COLORS.tertiary,
  'PRE-REGISTRADO': COLORS.tertiary,
  PREREGISTRADO: COLORS.tertiary,
  PENDIENTE: COLORS.primary, // en espera, como EN_REVISION: no es un error
  EN_PROCESO: COLORS.tertiary,
};
