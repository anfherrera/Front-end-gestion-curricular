# Sistema de Diseño TIC - Universidad del Cauca

Tokens y constantes basados en el documento **Sistema de Diseño UX-UI** de la División de Tecnologías de la Información y las Comunicaciones, Universidad del Cauca (2024).

Los colores y las fuentes coinciden con los del portal [unicauca.edu.co](https://www.unicauca.edu.co/) (variables globales del sitio, revisadas el 2026-11-25): primario `#000066`, secundario `#5056AC`, acento `#9D0311`, `#DB141C`, `#690007`, texto `#07184A`, `#E0E0FF`; Titillium Web y Open Sans.

Este archivo dice **qué** valores hay. Cuándo usar cada uno (color de estado frente a color de categoría, botones, acciones en tablas, redondeos, textos) está en [GUIA-UI.md](GUIA-UI.md).

## Estructura

```
design-system/
├── tokens.css        # Variables CSS: colores, neutros, tipografía, miga de pan
├── design-tokens.ts  # Constantes TS: COLORS, paleta de gráficos, color por proceso, iconos y colores por estado
└── README.md
```

`src/styles/material.css` pasa estos tokens a Angular Material (`--mat-sys-*`): botones, pestañas, casillas, campos y barras de progreso usan la paleta institucional y no el azul del tema prebuilt.

## Reglas

- **No escribir colores a mano** (`#2196f3`, `#666`…) en componentes: usar `var(--token)` en CSS y `COLORS` en TypeScript. Así un cambio de la guía se hace en un solo sitio.
- **No escribir nombres de fuente**: `var(--font-display)` para títulos, `var(--font-body)` para el resto.
- **Iconos**: Material Icons (Google Fonts, https://fonts.google.com/icons). No usar Font Awesome (`fas fa-*`).
- **Avisos**: siempre con `SnackbarService` (`exito`, `error`, `advertencia`, `info`): 5 segundos, arriba a la derecha.
- Los colores que mande el backend (por ejemplo en estadísticas) no se pintan: el front usa los de la guía.

## Colores

| Token CSS                         | `COLORS`       | Hex               | Uso                                                       |
| --------------------------------- | -------------- | ----------------- | --------------------------------------------------------- |
| `--color-primario`                | `primary`      | #000066           | Header, menú, botones, títulos                            |
| `--color-primario-light`          | `primaryLight` | #5056AC           | Hover, destacados (secundario en Material)                |
| `--color-primario-dark`           | `primaryDark`  | #07184A           | Tooltips                                                  |
| `--color-secundario`              | `secondary`    | #9D0311           | Acento institucional (rojo)                               |
| `--color-terciario`               | `tertiary`     | #1D72D3           | Información, enviado, enlaces                             |
| `--notif-exito-borde`             | `success`      | #249337           | Aprobado, éxito                                           |
| `--color-error`                   | `error`        | #FF6D0A           | Error y rechazado en fondos, bordes e iconos (no rojo)    |
| `--notif-error-titulo`            | `errorText`    | #8D3800           | Texto de error (el #FF6D0A no llega a 4,5:1 sobre blanco) |
| `--primario-90` / `--primario-98` | —              | #E0E0FF / #F8F9FF | Fondos destacados, cabeceras de tabla                     |

Notificaciones (`--notif-{exito,info,error,seguridad}-{fondo,borde,titulo,texto}`): fondo claro, borde y título del color del tipo y texto oscuro.

### Neutros

| Token          | Hex     | Uso                                          |
| -------------- | ------- | -------------------------------------------- |
| `--neutro-50`  | #F6F6F6 | Fondos suaves, filas, hover                  |
| `--neutro-100` | #F3F3F3 | Fondos de cabecera y secciones               |
| `--neutro-200` | #DEDBDB | Bordes y separadores                         |
| `--neutro-400` | #A3A3A3 | Bordes fuertes, deshabilitado                |
| `--neutro-600` | #757474 | Texto secundario (`COLORS.neutralSecondary`) |
| `--neutro-800` | #454444 | Texto (`COLORS.neutralText`)                 |

### Gráficos y procesos

- `PALETA_CATEGORIAS`: seis colores institucionales para series sin color propio (programas, materias…).
- `COLOR_POR_PROCESO`: el mismo color para cada proceso en gráficos, tarjetas y notificaciones. Cursos de verano usa el primario, Paz y Salvo el terciario, Reingreso el éxito, ECAES el naranja y Homologación el secundario.
- `conAlfa(hex, alfa)`: el color con transparencia, para rellenos.

## Tipografía

| Token            | Fuente        | Uso                                  |
| ---------------- | ------------- | ------------------------------------ |
| `--font-display` | Titillium Web | Títulos (h1–h6, títulos de Material) |
| `--font-body`    | Open Sans     | Texto, botones, etiquetas            |

Tamaños de la guía (pág. 26): `--text-h1-size` 32px, `--text-h2-size` 22px, `--text-h3-size` 18px, `--text-body-size` 14px, `--text-body2-size` 12px y `--text-button-size` 12px. Dos pasos propios: `--text-subtitulo-size` 16px (subtítulos dentro de una tarjeta) y `--text-cifra-size` 40px (cifras grandes de indicadores).

Iconos, con escala aparte (si el icono fija `width`/`height`, usar el mismo token): `--tam-icono-xs` 16px, `-sm` 20px, `-md` 24px, `-lg` 32px, `-xl` 48px y `-xxl` 64px.

`npm run lint:estilos` rechaza cualquier `font-size` que no sea uno de estos tokens o `inherit`.

## Uso

```css
.mi-tarjeta {
  color: var(--neutro-800);
  border: 1px solid var(--neutro-200);
  font-family: var(--font-body);
}
```

```ts
import { COLORS, COLORS_BY_STATE, ICONS_BY_STATE } from '@core/design-system/design-tokens';

const color = COLORS_BY_STATE[estado] ?? COLORS.primary;
const icono = ICONS_BY_STATE[estado] || 'help_outline';
```

En plantillas, los pipes `estadoColor`, `estadoIcono`, `estadoLabel` y `estadoClase` (`shared/pipes/estado.pipes.ts`) ya aplican estos mapas.
