# Checklist: interfaz uniforme según GUIA-UI.md

Objetivo: que todas las vistas de todos los roles sigan [GUIA-UI.md](GUIA-UI.md). Este archivo dice qué está hecho y qué falta, para retomar en cualquier sesión.

## Cómo retomar en una sesión nueva

Primer mensaje sugerido:

> Continúa `CHECKLIST-UI.md` desde la primera casilla sin marcar. Lee antes `GUIA-UI.md` y `src/app/core/design-system/README.md`.

Reglas de trabajo:

- Una fase por commit, en español y local. **Preguntar antes de cada push** (PR #2, rama `revision-25-backend`).
- Marcar aquí cada casilla al terminarla, en el mismo commit.
- Si la sesión se va a cortar, hacer commit de lo que compile y anotar en "Notas de la última sesión" dónde se quedó.
- Medir con los comandos de cada fase antes y después, y actualizar los números.

Arranque del entorno:

- Backend: `cd ../Back-end-gestion-curricular/gestion_curricular && JAVA_HOME="C:/Program Files/Java/jdk-17" SPRING_DATASOURCE_USERNAME=root SPRING_DATASOURCE_PASSWORD=root ./mvnw -q spring-boot:run` (puerto 5000)
- Front: `npx ng serve` (puerto 4200). Usuarios de prueba con contraseña `password123`: admin@, juanp@ (funcionario), josefina@ (coordinador), maria@ (secretaría), dcisneros@ (estudiante).
- Si se borran o mueven hojas de estilo, **reiniciar `ng serve`**: con SSR puede seguir sirviendo las antiguas.

Verificación de cada commit:

- `npx tsc -p tsconfig.app.json --noEmit`
- `npm run lint` y `npm run lint:estilos`
- `npx prettier --check` de los archivos tocados
- `npx ng build`
- `npx ng test --watch=false` (785 pruebas)
- Capturas antes y después: `npm run capturas -- <carpeta>` (26 pantallas de 5 roles; `ALTO=3200` para páginas largas). Mirar las imágenes y comparar.

## Fase 1: acciones, etiquetas y botones (GUIA-UI.md, secciones 1 a 3)

- [x] Clases globales en `src/styles/componentes.css`: `.acciones-tabla`, `.accion-peligro`, `.etiqueta-categoria`, `.etiqueta-estado` y colores `.estado-*` (un solo sitio)
- [x] "Enviada" ya no sale en el color de error (`estados-solicitud-comun.css`); "PENDIENTE" ya no es color de error (`design-tokens.ts`)
- [x] Admin, Usuarios: roles en etiqueta neutra; estado con icono; acciones con botones de icono y `aria-label`
- [x] Admin, Roles, Docentes y Programas: acciones con botones de icono; eliminar en color de error
- [x] Las cuatro listas de admin comparten `src/app/pages/admin/admin-lista-comun.css` (se borraron sus 4 hojas)
- [x] Recargar y Buscar de las listas de admin como botón secundario (`mat-stroked-button color="primary"`)
- [x] Seguimiento de solicitudes (`request-status`): acciones sin el cuadrado relleno
- [x] Gestión de cursos: sin mayúsculas en "Crear Nuevo Curso", Exportar ya no es naranja, acciones con `.acciones-tabla`
- [x] Comprobado con capturas (2026-11-27): el buscador de Roles sale en su tarjeta y Recargar se ve bien (era caché del SSR)
- [x] Commit de lo anterior (`d97e7bd`)
- [x] (Terminado 2026-11-27: ya no queda ningún `accent`; los 3 `warn` que quedan son Rechazar, el destructivo de la guía; Cancelar, Cerrar, Volver, Limpiar y Exportar son `mat-stroked-button color="primary"`; "Ver todas las notificaciones" y "Nuevo" llevan `color="primary"`; se borraron las reglas `button[mat-button]` que pintaban Cancelar en naranja o gris; el botón del login usa `color="primary"` en vez de colores con `!important`. Solo queda sin color el botón de usuario del header, que tiene diseño propio.) Botones fuera de los tres tipos de la guía. Medición con `node <scratchpad>/botones.mjs src/app` (script de una sesión: recorre cada `<button>` y da tipo y color; volver a escribirlo si no está): 4 `mat-raised-button color="accent"`, 3 `color="warn"`, 1 `mat-stroked-button color="warn"`, 1 `mat-icon-button color="accent"`, 12 `mat-stroked-button` sin color, 18 `mat-button` sin color. Pasar cada uno a primario, secundario o terciario. Para Rechazar (acción que destruye) definir una sola variante en `material.css` y anotarla en GUIA-UI.md
  - `visualizar-solicitudes.component.html:32-33` (Actualizar en primario y Exportar Excel en accent)
  - `historial-completo.component.html:64` (Limpiar filtros en accent)
  - `notificaciones.component.html:15-16`, `document-generator.component.html:122`, `documentation-viewer.component.html:76` (accent)
  - `pruebas-ecaes/revision/pruebas-ecaes.component.html:53`, `revision-aprobacion.component.html:43`, `rechazo-preinscripcion-dialog.component.html:63` (warn)
  - `cursos-intersemestrales/estudiante/solicitudes/solicitudes.component.html:59` (Limpiar en stroked warn)
  - Botones con clases propias que redefinen el botón: `.btn-confirmar` (texto-dialog, confirmacion-inscripcion-dialog), `.btn-exportar-excel`
- [x] (Hecho 2026-11-27: los `mat-chip` de estado de historial y detalle ignoraban las clases `estado-*` y ahora son `.etiqueta-estado` con icono; resumen del historial como `.etiqueta-categoria`; tendencias de cursos de verano con los colores de `getTendenciaColor`; prioridad de recomendaciones en píldora, sin sombra y con escala crítica (error oscuro) > alta (primario) > media (info) > baja (neutro). Los chips de `estadisticas-por-proceso` son datos neutros y se quedan. Antes: estados de curso en `gestionar-cursos` y en el resumen de cursos de verano como `.etiqueta-estado` con icono, con `CursoEstadosService.getClaseEstado`, que acepta estados sin tilde; "Cerrado" ya no usa el color de error; filtros de `estado-filters` todos iguales; tipo de solicitud de `detalle-solicitud` como `.etiqueta-categoria`; estado del perfil como `.etiqueta-estado`. Falta: `historial-completo`, `estadisticas-por-proceso`, chips de tendencia de `cursos-verano-dashboard` y `recomendaciones-cursos-verano`.) Otras tablas con acciones de colores o `mat-chip` de categoría: `historial-completo` (marca azul junto a "Solicitud"; chips de resumen), `detalle-solicitud`, `estadisticas-por-proceso`, `cursos-verano-dashboard`, `gestionar-cursos` (chips con texto blanco, `.mat-chip … color: white`), `recomendaciones-cursos-verano`, `estado-filters`
- [x] (Hecho 2026-11-27: las tres usan `.etiqueta-estado` con `estadoClase`/`estadoIcono`; en visualizar-solicitudes se borraron ~240 líneas de `!important` y la condición pasó a `.etiqueta-categoria`, porque repitencia salía en naranja y traslado en verde; document-generator pintaba "Enviada" como error.) Quitar las copias locales de colores de estado y usar las globales: `visualizar-solicitudes.component.css:277-385`, `document-generator.component.css:61-73`, `inscripcion-modal.component.css:106-116 y 517`

## Fase 2: títulos de página (guía, pág. 48)

- [x] (Hecho 2026-11-27: `TituloPaginaStrategy` toma el `title` de cada ruta y el layout lo pinta con `app-titulo-pagina`; se quitaron los títulos propios de admin, notificaciones y cursos intersemestrales, y los paneles internos pasaron a `h2`. El título va también a la pestaña del navegador.) Hoy hay al menos tres estilos: tarjeta blanca con icono (admin), título con línea azul inferior (cursos intersemestrales) y páginas sin título (estudiante, funcionario). Elegir uno (la guía pide título H1 con una franja roja de 4px bajo la primera palabra), hacerlo componente compartido y usarlo en todas las páginas

## Fase 3: colores con transparencia (hecha: 37 usos en 17 archivos pasados a tokens con `color-mix`; el amarillo de advertencia pasó al color de error porque la guía no tiene amarillo)

- [x] 41 `rgba()` con colores no institucionales en 15 archivos (`rgba(0, 19, 140, …)` ×20, Bootstrap y Material). Pasar a tokens o `color-mix(in srgb, var(--token) X%, transparent)`. Los peores: `cursos-verano-dashboard.component.css` (9), `cursos-intersemestrales.component.css` del estudiante (5), `curso-dialog.component.css` (5). Además, `color: green` en `curso-list.component.css:66`
- [x] Ampliar `scripts/comprobar-estilos.mjs` para que rechace `rgb()`/`rgba()` con color (se permiten negro y blanco para sombras) y colores por nombre salvo `white`, `transparent` e `inherit`

## Fase 4: redondeos (guía, pág. 29)

**Hecha sin capturas** (servidores apagados): 308 declaraciones en `--radio-*` (6px→4, 10px→12, 20px→16, 24/30px→28, 999px→100) y la tarjeta `app-card-container` a 12px. Comprobar con capturas al arrancar.

Medición: `Get-ChildItem -Recurse src -Include *.css | Select-String "border-radius:\s*([^;]+);"` agrupado por valor. A 2026-11-26 hay 24 valores (8px ×112, 12px ×78, 50% ×23, 6px ×19, 4px ×18, 16px ×15, 20px ×8, 10px ×5…).

- [x] Tokens en `tokens.css`: `--radio-xs` 4px (campos, snackbars), `--radio-sm` 8px (tooltips), `--radio-md` 12px (tarjetas), `--radio-lg` 16px, `--radio-xl` 28px (diálogos), `--radio-pill` 100px (botones, chips), `--radio-circulo` 50% (avatares)
- [x] Pasar cada valor al token de su tipo de componente (no solo al más cercano). `app-card-container` pasa de 8px a 12px
- [x] Regla en `comprobar-estilos.mjs`

## Fase 5: tamaños de letra (guía, pág. 26)

Primer paso hecho, sin cambio visual: 159 `font-size` que ya valían 12, 14, 18, 22 o 32px (o su rem) usan ahora `--text-*`. Ojo: algunos `32px`/`2rem` eran iconos y quedaron con `--text-h1-size`; al crear `--tam-icono-*` hay que moverlos. Quedan por decidir (cambian el aspecto): 0.9rem ×49, 16px ×41, 13px ×41, 1rem ×37, 1.1rem ×31, 20px ×26, 1.2rem ×19, 0.95rem ×18, 24px ×17, 1.5rem ×16…

**Hecha (2026-11-27)**: 429 declaraciones convertidas con un script (en el scratchpad de la sesión, no en el repo) por tramos: texto <13,5px → body2, <15,5 → body, <17 → subtítulo, <20 → h3, <26 → h2, <36 → h1, resto → cifra; iconos (selector con `mat-icon`/`icon` o `width` igual al tamaño) <18 → xs, <22 → sm, <28 → md, <40 → lg, <56 → xl, resto → xxl, y su `width`/`height` con el mismo token. `base.css`: `body` a 14px (antes 16) y h1-h6 en la escala de la guía. Capturas comparadas: cambios pequeños (título del header de 28,8 a 32px, listas y textos sueltos de 16 a 14px).

- [x] 57 valores distintos; ninguno usa `--text-*`. Ir carpeta por carpeta (un commit por carpeta), comparando capturas. Los que más tienen: `cursos-verano-dashboard` (35), `inscripcion-modal` (33), `tendencias-comparativas` (26), `ver-solicitud` (25), `recomendaciones-cursos-verano` y `gestionar-cursos` (23)
- [x] Pasos intermedios con nombre si hacen falta (`--text-subtitulo-size`, `--text-cifra-size`); iconos grandes con escala aparte (`--tam-icono-*`)
- [x] Regla en `comprobar-estilos.mjs` (solo CSS; queda a mano el `18px` de la ventana de impresión de `documentation-viewer.component.ts`, que no tiene acceso a los tokens)

## Fase 6: trato de usted (guía, pág. 9)

Hecha: 136 frases en 48 archivos (plantillas, mensajes de `SnackbarService`, errores y specs). Pendiente menor: revisar a mano textos que no estaban en la lista y los mensajes que llegan del backend.

- [x] Cambiar el tuteo por usted en los textos visibles ("Debes subir" → "Debe subir", "tu solicitud" → "su solicitud", "Selecciona" → "Seleccione"). Empezar por `required-docs.component.html`, las pantallas del estudiante y los mensajes de `SnackbarService`. Medición: buscar `Debes|Puedes|Tienes|Asegúrate|Selecciona|Ingresa|Revisa|Intenta|\btu\b|\btus\b` en `*.html` y `*.ts` (sin specs); revisar a mano, porque hay falsos positivos
- [x] Actualizar las pruebas que comprueben esos textos

## Fase 7: `!important` (sin cambios visibles)

- [x] (Hecha 2026-11-27: de 469 a 160. Se quitaron 280 en los CSS de componentes y 14 globales, y se comprobó con un volcado de estilos computados de cada elemento visible: 40 pantallas de 4 roles, más diálogos y paneles abiertos por clic; el script está en el scratchpad de la sesión, no en el repo. Resultado: 0 diferencias, salvo cuatro casos en que el `!important` saltaba la guía y se corrigieron a propósito: "Publicar fechas" de ECAES vuelve a ser un botón primario normal; la cabecera de la tabla de `visualizar-solicitudes` usa el estilo común, porque sin el `!important` quedaba azul sobre azul; las etiquetas de estado de esa tabla ya no salen grises, porque las tapaba un `td *`; y `confirm-dialog` usa `color="primary"`/`"warn"` y Cancelar secundario. Se borraron reglas sin uso: `mat-chip` con `.estado-*` e `.insignia-plana`. Quedan, a propósito: `material.css` (54) y `notificaciones.css` (21), que pisan estilos de MDC; `animaciones.css` (movimiento reducido); `.accion-*` de `componentes.css`, que compiten con `mat-icon-button`; y 83 en reglas `:hover`/`:focus`/`:disabled`, que el volcado no comprueba. Sin datos para verificarlo, `estudiantes-curso-dialog` y `rechazo-preinscripcion-dialog` se cambiaron sin comprobar.) 832 en total. Los peores: `visualizar-solicitudes.component.css` (182), `revision/dashboard` (51), `material.css` (46), `gestionar-cursos` (42), `curso-dialog` (42), `cursos-verano-dashboard` (30). Quitarlos donde no hagan falta; los de `material.css` sobre MDC pueden quedarse

## Al terminar

- [x] Vaciar la sección "Pendiente" de GUIA-UI.md
- [x] Capturas finales de los 5 roles y comparación con las primeras (2026-11-27, frente a las del 2026-11-26): todas las páginas tienen el título H1 con la franja roja; roles y estados en etiquetas claras; acciones de tabla como iconos sin fondo; botones sin mayúsculas ni naranja fuera de lo destructivo; trato de usted. Sin roturas.
- [x] Preguntar si se sube al PR #2 (sí, 2026-11-27)
- [x] Revisión a mano con el backend arrancado (2026-11-27): 23 capturas de 4 roles sin errores de JS. Se abrieron con datos los diálogos de estudiantes de un curso y de rechazo de preinscripción: se ven bien. Hover de acciones y botones, y foco con Tab dentro del diálogo, correctos. Se encontró y corrigió que las tablas de preinscripción e inscripción de cursos intersemestrales tenían la cabecera vacía (texto azul de `material.css` sobre fondo azul local, como pasaba en `visualizar-solicitudes`) y estados en bloques de color sólido o texto plano; ahora usan la cabecera común y `.etiqueta-estado`. El `18px` de la ventana de impresión de `documentation-viewer` coincide con H3 y usa `design-tokens.ts`. En el front no queda tuteo (la búsqueda solo encuentra comentarios). En el backend quedan dos mensajes con tuteo, fuera de este repositorio: `GestionarCursoOfertadoVeranoCUAdapter.java:83` ("Puedes crear grupos…") y `UsuarioRestController.java:266` ("Intenta nuevamente…").

## Notas de la última sesión

- 2026-11-27 (cierre): revisión a mano hecha con el backend (ver la última casilla de "Al terminar"). Checklist cerrado; el PR #2 se fusiona a `main`.

- 2026-11-27 (noche): fase 7 hecha. Lo que falta está en "Al terminar". Pendiente menor: abrir a mano los diálogos de estudiantes de un curso y de rechazo de preinscripción cuando haya datos. El backend se cayó a mitad de la sesión porque alguien estaba cambiando `pom.xml` y `SeguridadConfig.java`; reiniciado, volvió a funcionar.

- 2026-11-27 (tarde): fase 5 hecha en 4 commits (base y layout, shared, pages, features). Hay 788 pruebas. Siguiente: fase 7 (`!important`). Ojo: en el árbol de trabajo hay cambios ajenos sin commit (inicio de sesión con Google: `login.component.*`, `auth.service.ts`, `api-endpoints.ts`, `environment*.ts`, `google-identity.service.ts`); no se incluyeron en los commits de la fase 5.

- 2026-11-27: capturas comprobadas con los servidores arrancados (redondeos y botones bien). Fase 1 terminada; también corregidos los últimos textos en tuteo. Siguiente: fase 2 (títulos de página) y fase 5 carpeta por carpeta. Para medir botones se reescribió el script de la fase 1 con la opción `--sin-color` (lista los `mat-button`/`mat-stroked-button` sin color).
- 2026-11-26 (tarde): hechas las fases 3, 4 y 6 y el primer paso de la 5, todo sin capturas porque los servidores estaban apagados. Lo primero en la próxima sesión: arrancar backend y front, sacar capturas de los 5 roles y revisar redondeos (fase 4) y botones (fase 1). Luego seguir la fase 5 carpeta por carpeta y la fase 2 (títulos de página).
