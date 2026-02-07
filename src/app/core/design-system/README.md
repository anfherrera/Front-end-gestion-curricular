# Sistema de Diseño TIC - Universidad del Cauca

Tokens y constantes basados en el documento **Sistema de Diseño UX-UI** de la División de Tecnologías de la Información y las Comunicaciones, Universidad del Cauca (2024).

## Estructura

```
design-system/
├── tokens.css        # Variables CSS (colores, tipografía)
├── design-tokens.ts  # Constantes TS (hex, snackbar, iconos, estados)
└── README.md
```

## Uso

### CSS
Importar en `styles.css`:
```css
@import './app/core/design-system/tokens.css';
```

Usar variables:
```css
.my-element {
  color: var(--color-primario);
  background: var(--notif-exito-fondo);
}
```

### TypeScript
```ts
import { COLORS, SNACKBAR_CONFIG_TIC, snackbarConfig, ICONS_BY_STATE, COLORS_BY_STATE } from './core/design-system/design-tokens';

// Colores para estilos inline
element.style.color = COLORS.primary;

// Snackbar según TIC (5s, superior derecha)
this.snackBar.open(mensaje, 'Cerrar', SNACKBAR_CONFIG_TIC);

// Snackbar con panelClass (éxito, error, warning)
this.snackBar.open(mensaje, 'Cerrar', snackbarConfig(['success-snackbar']));

// Icono por estado (Material Icons)
const icon = ICONS_BY_STATE[estado] || 'help_outline';

// Color por estado
const color = COLORS_BY_STATE[estado] ?? COLORS.primary;
```

## Colores principales

| Token | Hex | Uso |
|-------|-----|-----|
| primary | #000066 | Header, botones, títulos |
| primaryLight | #5056AC | Hover, destacados |
| success | #249337 | Estados aprobado/éxito |
| error | #FF6D0A | Errores, rechazado (no rojo) |
| tertiary | #1D72D3 | Información, enviado |

## Iconografía

Usar **Material Icons** (Google Fonts): https://fonts.google.com/icons  
No usar Font Awesome (`fas fa-*`).

## Notificaciones

- Duración: 5 segundos
- Posición: superior derecha
