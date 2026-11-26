# Guía de interfaz

Cómo se construyen las pantallas de este proyecto. Resume las decisiones que tomamos a partir del **Sistema de Diseño UX-UI de la División TIC** de la Universidad del Cauca (2024). Ese documento es confidencial: aquí no se copia, solo se citan sus páginas para quien tenga acceso.

Los valores concretos (colores, fuentes y tamaños) están en [src/app/core/design-system/README.md](src/app/core/design-system/README.md). Este archivo explica **cuándo usar cada uno**.

## 1. El color comunica significado

Antes de poner un color, decida a cuál de estos dos grupos pertenece lo que va a pintar:

| Grupo                                  | Colores                                                                                       | Para qué                                                            |
| -------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| **Identidad** (la marca)               | primario `--color-primario`, `--color-primario-light`; secundario `--color-secundario` (rojo) | Header, menú, títulos, botones, cabeceras de tarjeta                |
| **Estado** (qué pasó o qué va a pasar) | éxito `--notif-exito-borde`, error `--color-error`, info `--color-terciario`                  | Aprobado/rechazado, activo/inactivo, avisos, acciones que destruyen |

Reglas:

- **Verde y naranja solo significan estado.** Verde = correcto, aprobado o activo. Naranja = error, rechazado o acción que destruye. Si se usan para otra cosa (un rol, una categoría), el usuario los lee como un estado que no existe.
- **El rojo no es color de error.** Es el color institucional (guía, pág. 14). Un elemento rojo se lee como "importante de la Universidad", no como "fallo".
- **Una categoría no es un estado.** Roles, programas o tipos de documento no llevan colores de estado. Se muestran neutros o con el tono claro del primario (`--primario-90` de fondo, `--color-primario` de texto). Si hace falta distinguirlos a simple vista, use un **icono**, no un color.
- **El color nunca va solo.** Todo lo que se distinga por color también lleva texto o icono (accesibilidad, Resolución 1519 de 2020 de MinTIC).
- **Contraste**: texto de 4,5:1 como mínimo. Por eso el texto de error usa `--notif-error-titulo` y no el naranja puro.

## 2. Etiquetas (chips o insignias)

- Forma: píldora (`border-radius: 100px`).
- **Estado** (Activo, Rechazada, Enviada…): fondo claro del color del estado y texto oscuro del mismo color, como las notificaciones. Usar los pipes `estadoColor` / `estadoIcono` / `estadoLabel` / `estadoClase`.
- **Categoría** (rol, programa…): todas iguales y neutras. Fondo `--primario-90`, texto `--color-primario`. Opcional: icono a la izquierda.
- Las etiquetas no son botones: sin sombra, sin hover y sin animación.

## 3. Botones

Tipos (guía, págs. 30-31). Los estilos ya están en [src/styles/material.css](src/styles/material.css), así que basta con usar el botón de Material correcto:

| Tipo        | Material                             | Cuándo                                                                                        |
| ----------- | ------------------------------------ | --------------------------------------------------------------------------------------------- |
| Primario    | `mat-raised-button color="primary"`  | La acción principal de la pantalla (una por zona)                                             |
| Secundario  | `mat-stroked-button color="primary"` | Alternativas: Cancelar, Recargar, Volver                                                      |
| Terciario   | `mat-button color="primary"`         | Acciones de poco peso, enlaces                                                                |
| Destructivo | `mat-raised-button color="warn"`     | Rechazar o eliminar como acción principal de un diálogo (naranja oscuro de error, nunca rojo) |

- Forma: píldora (guía, pág. 29). No cambiar el `border-radius` de un botón en el CSS del componente.
- Texto: un verbo que diga lo que pasa ("Enviar solicitud", "Guardar cambios"), no "Aceptar" ni "Click aquí".

### Acciones en filas de tabla

- Usar `mat-icon-button` (icono sin fondo), no `mat-mini-fab` de colores. Tres círculos de colores por fila hacen que la tabla compita con su propio contenido.
- Icono en `--color-primario`. Solo la acción que destruye (eliminar) usa el color de error (`--notif-error-titulo`, por contraste).
- Cada botón lleva `matTooltip` **y** `aria-label` con la acción concreta ("Editar usuario", "Desactivar usuario"). No "Click para…".
- El icono dice lo que **va a pasar**, no el estado actual: usuario activo → `block` "Desactivar"; inactivo → `check_circle` "Activar".
- Eliminar o desactivar pide confirmación con `ConfirmDialogComponent` (`shared/components/confirm-dialog`).
- Orden fijo: editar, cambiar estado, eliminar (lo destructivo al final).

## 4. Tarjetas y secciones

- Toda sección de página va en `<app-card-container title="…" icon="…">`: cabecera azul con icono y título. No crear `mat-card` con un título propio.
- Un icono por sección, de Material Icons (https://fonts.google.com/icons).

## 5. Redondeos

Guía, pág. 29. Usar solo estos valores:

| Valor | Dónde                                                      |
| ----- | ---------------------------------------------------------- |
| 0     | Header, menú lateral, pestañas, listas, barras de progreso |
| 4px   | Campos de texto, selects, snackbars                        |
| 8px   | Tooltips                                                   |
| 12px  | Tarjetas, barra de búsqueda                                |
| 28px  | Diálogos                                                   |
| 100px | Botones, chips e insignias                                 |

## 6. Tipografía

- Títulos con `var(--font-display)` (Titillium Web) y el resto con `var(--font-body)` (Open Sans).
- Tamaños con los tokens `--text-*` (guía, pág. 26). Mínimo 12px.

## 7. Textos

- **Trato de usted** (guía, pág. 9): "Suba los documentos", "Su solicitud fue enviada". No "Debes subir…".
- Frases cortas, sin tecnicismos.
- Cuando algo falla, diga qué hacer: "No se pudo enviar la solicitud. Revise su conexión e intente de nuevo."

## 8. Avisos

- Siempre con `SnackbarService` (`exito`, `error`, `advertencia`, `info`). Duran 5 segundos, aparecen arriba a la derecha, se cierran con la X y no se apilan (guía, pág. 34).
- Las ventanas emergentes (diálogos) solo para confirmar acciones importantes.

## Pendiente

Puntos en los que el código todavía no cumple esta guía:

- [ ] Gestión de usuarios: roles con colores de estado y acciones como círculos de colores (secciones 1-3).
- [ ] Trato de usted: varias pantallas del estudiante dicen "Debes subir…".
- [ ] `app-card-container` usa un redondeo de 8px y la guía pide 12px para tarjetas.
- [ ] Unificar redondeos, tamaños de letra, colores con transparencia y `!important` (ver `PROMPT_SIGUIENTE_SESION.md`, parte A).
