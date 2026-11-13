# Checklist de calidad del front-end

Lista de lo que falta para que el proyecto tenga una arquitectura limpia, componentes reutilizados y nada de código muerto o repetido.
Marca cada punto con `[x]` cuando lo termines. Al terminar un bloque, corre `ng build` y `ng test --watch=false` antes de hacer commit.

Revisión del 2026-11-13 (commit `9b46f87`). Las cifras son de esa fecha; vuelve a medirlas cuando cierres un bloque.

---

## Fase 1 — Código muerto ✅ (terminada el 2026-11-13)

Verificado con `ng build` (sin errores), `ng test` (499/499) y `test:navegacion` (sin backend: todas las rutas abren, sin errores en consola).

### Archivos sin ningún uso
- [x] Borrar `ArchivoListComponent` (`shared/components/archivo-list/`)
- [x] Borrar `shared/directives/autofocus.directive.ts`
- [x] Borrar `core/utils/date.util.ts`
- [x] Borrar `core/models/curso.model.ts`
- [x] Borrar `core/models/user.model.ts`
- [x] Borrar `core/config/snackbar.config.ts` (solo volvía a exportar `design-tokens`)

### Funciones exportadas que nadie usa
- [x] `corregirEncoding`: se deja interna (la usa `corregirEncodingObjeto`)
- [x] `esErrorSinPermisos` borrada; `MENSAJE_SESION_INVALIDA` se deja interna
- [x] `getColorByTipoNotificacion` borrada; `enrichNotificacion` se deja interna
- [x] `calcularDuracionDias`, `esCursoActivo`, `getColorPeriodo`, `generarPeriodos` y `getEstadoCursoPorFechas` borradas; `parsearPeriodo` y `compararPeriodos` se dejan internas

### Configuración y dependencias
- [x] `environment.*.ts`: se quitan `debug`, `logLevel`, `httpTimeout`, `maxRetries` y `retryDelay`, que nadie leía. Quedan solo `production` y `apiUrl`
- [x] Se borra `environment.development.ts`, que repetía `environment.ts`, junto con su `fileReplacements` en `angular.json`
- [x] Se borra el script `start:proxy`, que apuntaba a un `proxy.conf.json` inexistente
- [x] Se desinstala `@types/chart.js`
- [x] Se desinstala `karma-edge-launcher` (`karma.conf.js` usa Edge a través de `karma-chrome-launcher`)
- [x] Se desinstala Bootstrap. Su reset mínimo pasa a [base.css](src/styles/base.css), igual que `.mt-4`. Los componentes que dependían de él sin saberlo reciben lo que les faltaba: `inscripcion-modal` (header, body y footer), `breadcrumb`, `.badge` y `.card-title`. El CSS global inicial baja de unos 250 KB a 19 KB
  - Cambio visible esperado: `.text-muted` en `ver-solicitud` y en el dashboard de cursos ahora usa su gris local (#999 o #9e9e9e), porque antes Bootstrap lo pisaba con `!important`. Además, `mat-progress-bar.progress-bar` en secretaría ya no recibe el fondo azul de Bootstrap
- [x] Versión `1.0.0` en `package.json`

### Funciones a medio hacer en la interfaz
- [x] Se elimina la página **Ajustes**: ningún valor que guardaba se leía en otra parte, y tres botones solo decían “próximamente”. Se quitan su ruta, la entrada del menú lateral, la opción del menú de usuario del header, la tarjeta del home y la miga de pan

### Pendiente detectado al cerrar la fase
- [ ] Aviso de build: `file-saver` no es ESM. Hay que reemplazarlo por [download.util.ts](src/app/core/utils/download.util.ts) en [document-generator.service.ts](src/app/core/services/document-generator.service.ts) y desinstalar `file-saver` y `@types/file-saver`
- [ ] Revisar a ojo el modal de inscripción a cursos y las páginas del estudiante (paz y salvo, homologación, reingreso) con datos reales

---

## Fase 2 — Código repetido (servicios, utilidades y componentes pequeños)

### Servicios duplicados
- [x] Hay dos `ErrorHandlerService`: queda solo [core/services/error-handler.service.ts](src/app/core/services/error-handler.service.ts). El de `shared/components/error-handler/` (264 líneas) se borra: su único uso real era `handleCargaError('cursos')` en `gestionar-cursos`, que pasa a `SnackbarService.warning()`
- [ ] Notificaciones (snackbar): 53 archivos inyectan `MatSnackBar` directamente y solo 2 usan [SnackbarService](src/app/core/services/snackbar.service.ts). Pasarlos todos a `SnackbarService` con métodos `exito()`, `error()` e `info()`
- [ ] `ApiService` lo usan solo `auth`, `login` y `manage-processes` (y tiene 20 `any`). Que todos los servicios lo usen o eliminarlo y usar `HttpClient` en todos

### Estados de solicitud
- [x] Un solo enum: [estados-solicitud.enum.ts](src/app/core/enums/estados-solicitud.enum.ts) (`EstadosSolicitud`) con los códigos del backend y `ESTADOS_SOLICITUD_LABELS`. Se borra `solicitud-status.enum.ts`, cuyos valores eran textos ("Aprobada") aunque los componentes le metían códigos con un cast. `Solicitud.estado` pasa a `string`
- [x] Helpers de estado en [estado-solicitud.util.ts](src/app/core/utils/estado-solicitud.util.ts) (`normalizarEstado`, `ultimoEstado`, `estadoActual`, `estadoLabel`, `estadoColor`, `estadoIcono`, `estadoClase`) y pipes en [estado.pipes.ts](src/app/shared/pipes/estado.pipes.ts) (`estadoLabel`, `estadoColor`, `estadoIcono`, `estadoClase`)
  - `getEstadoActual`: 7 copias + `estadoActual` de paz-salvo-filas → `estadoActual()`; la de estudiante/homologación no se usaba y se borra
  - `getEstadoColor`/`getEstadoLabel` y los mapas `ESTADOS_SOLICITUD_LABELS/COLORS` en reingreso (3) y homologación coordinador: ninguna plantilla los usaba, se borran
  - `getEstadoClass` (detalle, historial, visualizar-solicitudes) → pipe `estadoClase`; `getEstadoColor` de preinscribir y `getEstadoColor/Icon` de request-status → pipes
  - Los `getEstadoColor` de dashboard y gestionar-cursos son de estados de **curso** y ya delegan en `CursoEstadosService`; se dejan
  - Cambio visible esperado: la tabla de seguimiento, detalle-solicitud e historial muestran el texto ("Aprobada por Funcionario") en lugar del código (`APROBADA_FUNCIONARIO`); en preinscribir, ENVIADA y PENDIENTE usan los colores institucionales (#1D72D3 y #FF6D0A en lugar de #2196f3 y #ff9800)

### Fechas y textos
- [x] Fechas: [fecha.util.ts](src/app/core/utils/fecha.util.ts) tiene `formatearFecha(valor, formato, vacío)` (formatos `corta`, `corta-hora`, `media`, `media-hora`, `larga`, `larga-hora`) y `fechaRelativa`; [FechaPipe](src/app/shared/pipes/fecha.pipe.ts) la usa (`| fecha:'larga'`). Ya no queda ningún `toLocaleDateString` ni `formatearFecha` de componente
  - Las 14 filas de tabla que hacían `new Date(...).toLocaleDateString()` ahora pasan la fecha ISO: la tabla ya aplicaba `| fecha` encima, y con el navegador en español "13/11/2026" no se podía volver a leer
  - Corrección: "2025-01-15" se lee como día local (antes `new Date()` lo tomaba en UTC y en Colombia mostraba el 14)
  - Se borran copias muertas: `formatDate` de notificaciones.component, `formatearFechaCorta` de detalle-solicitud, `formatearFecha`/`formatearFechaCorta` de periodo.utils
- [x] `obtenerNombreDocente` (6 envoltorios de `nombreDocente`) → pipe [nombreDocente](src/app/shared/pipes/nombre-docente.pipe.ts); `normalizarNombre` (3) y `coincidenciaFuzzy` (2, con distintas palabras clave) → [texto.util.ts](src/app/core/utils/texto.util.ts); `obtenerPeriodoActualFallback` (3) era igual a `getPeriodoActual()` de periodo.utils, que es lo que se usa ahora

### Diálogos
- [x] `comentarios-dialog` (solo muestra comentarios) pasa a [ver-comentarios-dialog](src/app/shared/components/ver-comentarios-dialog/ver-comentarios-dialog.component.ts) (`VerComentariosDialogComponent`)
- [x] `prompt-dialog`, `rechazo-dialog` y `comentario-dialog` se unen en [TextoDialogComponent](src/app/shared/components/texto-dialog/texto-dialog.component.ts) (`titulo`, `descripcion`, `etiqueta`, `valorInicial`, `textoConfirmar`, `icono`, `nombreDocumento`, `historial`, `soloLectura`, `maxLength`). `datosRechazo()` arma el caso de rechazo, que 7 llamadas repetían igual. Se quitan 4 imports de `ComentarioDialogComponent` que no se usaban
  - Corrección: en inscribir-estudiantes, cancelar el rechazo mostraba "Debe ingresar un motivo…"; ahora no hace nada
  - Se dejan `MotivoRechazoDialogComponent` (ver-solicitud) y `RechazoPreinscripcionDialogComponent` (preinscribir): son de su página y muestran datos propios (estado con fecha; datos del estudiante y del curso)
- [x] [ConfirmDialogComponent](src/app/shared/components/confirm-dialog/confirm-dialog.component.ts) con `confirmar(dialog, datos): Observable<boolean>` reemplaza los 9 `confirm()` (admin: docentes, programas, procesos ×2, roles, usuarios ×2; gestionar-cursos; activity-monitor). Las acciones destructivas usan `peligro: true`
  - activity-monitor: con el aviso abierto el movimiento del ratón ya no reinicia la sesión, y si nadie responde en el minuto restante se cierra el diálogo y la sesión (con el `confirm()` bloqueante la sesión no caducaba mientras la alerta siguiera abierta). Spec nuevo con temporizadores simulados
  - Pendiente revisar a ojo: diálogo de confirmación en admin y gestionar-cursos, y diálogo de texto en rechazos y comentarios de documentos

### Selectores de período
- [x] Queda solo [periodo-filtro-selector](src/app/shared/components/periodo-filtro-selector/periodo-filtro-selector.component.ts). `periodo-selector` (solo lo usaba cursos-ofertados del estudiante) se borra; su diferencia pasa a la entrada `fuente="con-cursos"` (períodos con cursos registrados y, si falla, todos). `periodoInicial=""` permite arrancar en el período actual
  - Corrección: en cursos-ofertados el selector está dentro de `*ngIf="!cargando"` y volvía a "Período actual" después de cada carga; ahora conserva la elección
  - Se añade `/estudiante/cursos-intersemestrales/cursos-ofertados` a `test:navegacion`
  - Los `onPeriodoChange` de las páginas son el manejador de cada una (recargan sus datos); se unifican con la bandeja genérica de la Fase 3

---

## Fase 3 — Reutilizar vistas entre roles (el cambio más grande)

Paz y salvo ya sigue el patrón correcto: [paz-salvo-revision](src/app/pages/common/paz-salvo-revision/) es un solo componente para funcionario y coordinador (con `data: { rolRevision }` en la ruta) y comparte [paz-salvo-bandeja](src/app/pages/common/paz-salvo-revision/paz-salvo-bandeja.component.ts) con secretaría. Hay que llevar ese patrón a los demás procesos.

### Bandeja genérica
- [ ] Convertir `PazSalvoBandejaComponent` en un `SolicitudesBandejaComponent` genérico en `shared`, con pestañas Pendientes/Historial y filtro de período

### Revisión (funcionario / coordinador / secretaría)
- [ ] **Homologación**: [funcionario](src/app/pages/funcionario/homologacion-asignaturas/) y [coordinador](src/app/pages/coordinador/homologacion-asignaturas/) tienen el HTML casi igual (unas 14 líneas distintas) y unas 240 líneas de TS cada uno. Unirlos en `common/homologacion-revision` con `rolRevision`
- [ ] **Reingreso**: igual con [funcionario](src/app/pages/funcionario/reingreso-estudiante/) y [coordinador](src/app/pages/coordinador/reingreso-estudiante/) → `common/reingreso-revision`
- [ ] **Secretaría** (homologación 403 líneas, reingreso 745): usar la bandeja genérica y la misma lógica de aprobar y rechazar
- [ ] **ECAES funcionario** ([586 líneas](src/app/pages/funcionario/pruebas-ecaes/pruebas-ecaes.component.ts)): pasarla al mismo patrón
- [ ] La lógica de aprobar y rechazar está repetida: `aprobarSolicitudSeleccionada` (7 copias), `rechazarSolicitudSeleccionada` (7), `puedeAprobar` y `puedeRechazar` (5), `onSolicitudSeleccionada` (9), `cargarSolicitudes` (7). Llevarla a una clase base o a un servicio de página encima de [SolicitudesAprobacionService](src/app/core/services/base/solicitudes-aprobacion.service.ts)

### Vistas del estudiante (paz y salvo, homologación, reingreso, ECAES)
- [ ] Las cuatro páginas repiten `obtenerDocumentosFaltantes`, `onArchivosChange`, `puedeEnviar`, `onSolicitudEnviada`, `listarSolicitudes`, `descargarOficio` y `verComentarios`. Extraer un componente `SolicitudEstudianteComponent` (o una clase base) que reciba el proceso y su servicio
- [ ] Partir [estudiante/reingreso](src/app/pages/estudiante/reingreso-estudiante/reingreso-estudiante.component.ts) (865 líneas), [estudiante/homologación](src/app/pages/estudiante/homologacion-asignaturas/homologacion-asignaturas.component.ts) (742) y [estudiante/ecaes](src/app/pages/estudiante/pruebas-ecaes/pruebas-ecaes.component.ts) (713) después de extraerlo

### Rutas
- [ ] En [app.routes.ts](src/app/app.routes.ts), `modulo-estadistico`, `historial-completo` y `cursos-intersemestrales` se repiten en cada rol. Generar esas rutas desde una configuración por rol, o pasar cada rol a su archivo `*.routes.ts` como ya hacen `admin` y `estudiante`

---

## Fase 4 — Arquitectura y organización

- [ ] **Sin `HttpClient` en componentes**: hoy lo usan [detalle-solicitud](src/app/pages/common/detalle-solicitud/detalle-solicitud.component.ts), estudiante/homologación, estudiante/ecaes, estudiante/reingreso y funcionario/ecaes. Mover esas llamadas a sus servicios
- [ ] **`shared` solo para lo genérico**: `estadisticas-por-estado`, `estadisticas-por-proceso`, `estudiantes-por-programa`, `tendencias-comparativas`, `inscripcion-modal`, `preinscripcion-dialog`, `info-preregistro-dialog`, `estudiantes-curso-dialog` y `curso-list` solo se usan dentro de una funcionalidad. Moverlos a su carpeta (`modulo-estadistico/`, `cursos-intersemestrales/`)
- [ ] **Plantillas inline largas a archivo `.html`**: `estadisticas-por-estado` (594 líneas), `estadisticas-por-proceso` (519), `estado-filters` (447), `estudiantes-por-programa` (383), `comentarios-dialog` (369), `preinscribir-estudiantes` (969) e `inscribir-estudiantes` (842)
- [ ] **Partir archivos gigantes**:
  - [ ] [preinscribir-estudiantes.component.ts](src/app/pages/common/cursos-intersemestrales/preinscribir-estudiantes/preinscribir-estudiantes.component.ts) (969)
  - [ ] [inscribir-estudiantes.component.ts](src/app/pages/common/cursos-intersemestrales/inscribir-estudiantes/inscribir-estudiantes.component.ts) (842)
  - [ ] [document-generator.service.ts](src/app/core/services/document-generator.service.ts) (870): separar un generador por tipo de documento
  - [ ] [estadisticas.model.ts](src/app/core/models/estadisticas.model.ts) (565)
  - [ ] [cursos-verano-dashboard.component.css](src/app/pages/common/modulo-estadistico/cursos-verano/cursos-verano-dashboard.component.css) (1428): usar [dashboard-comun.css](src/app/pages/common/modulo-estadistico/dashboard-comun.css)
  - [ ] [inscripcion-modal.component.css](src/app/shared/components/inscripcion-modal/inscripcion-modal.component.css) (714) y [preinscribir-estudiantes.component.css](src/app/pages/common/cursos-intersemestrales/preinscribir-estudiantes/preinscribir-estudiantes.component.css) (685)
- [ ] **Alias de imports**: agregar `@core/*`, `@shared/*` y `@env/*` en `tsconfig.json` y reemplazar los `../../../`
- [ ] **Estructura por funcionalidad** (opcional, al final): pasar de `pages/<rol>/<proceso>` a `features/<proceso>/{estudiante,revision}`

---

## Fase 5 — Estilos

- [ ] Hay 1059 colores en hexadecimal escritos a mano en los `.css` de componentes, frente a 772 usos de `var(--…)`. Pasarlos a los tokens de [tokens.css](src/app/core/design-system/tokens.css)
- [ ] Mover los 18 `style="…"` de las plantillas a clases
- [ ] Buscar bloques CSS repetidos entre componentes (tablas, tarjetas, cabeceras) y llevarlos a [componentes.css](src/styles/componentes.css)

---

## Fase 6 — Angular moderno y tipado

- [ ] **Tipado**: hay 282 `any` (los que más tienen: `api.service` con 20, `secretaria/reingreso` con 13, `form-usuario` con 11, `manage-processes` con 8). Reemplazarlos por las interfaces de `core/models`
- [ ] **Suscripciones**: hay 430 `.subscribe(` y solo 195 `takeUntil`/`takeUntilDestroyed`. Revisar posibles fugas de memoria y usar `takeUntilDestroyed()`, el pipe `async` o `toSignal`
- [ ] **Inyección de dependencias**: hoy se mezclan `inject()` (21 archivos) y el constructor (25). Elegir uno (recomendado: `inject()`)
- [ ] **Control flow**: hay 505 `*ngIf`, `*ngFor` y `*ngSwitch`. Migrar a `@if`, `@for` y `@switch` con `ng generate @angular/core:control-flow`
- [ ] **`standalone: true`** sobra en Angular 19 porque ya es el valor por defecto; quitarlo de los 92 archivos
- [ ] **Entradas y salidas**: pasar `@Input` y `@Output` a `input()` y `output()`, y el estado local a `signal()` (hoy hay 0 signals)
- [ ] **OnPush**: solo 5 de 88 componentes lo usan. Activarlo empezando por los de `shared`

---

## Fase 7 — Herramientas y documentación

- [ ] Instalar ESLint (`ng add @angular-eslint/schematics`) con las reglas `no-explicit-any`, `no-unused-vars` y `prefer-inject`, y agregar el script `npm run lint`
- [ ] Prettier más `.prettierrc` (ya existe `.editorconfig`)
- [ ] CI en GitHub Actions: `lint`, `build` y `test --watch=false` en cada push o PR
- [ ] Cobertura mínima en `karma.conf.js` (por ejemplo 60 %)
- [ ] Opcional: Husky con lint-staged para correr lint antes de cada commit
- [ ] README: sección de arquitectura (core/shared/pages, el patrón de revisión por rol), variables de entorno y la lista de scripts de test
- [ ] Revisar que las pruebas que existen sigan pasando después de cada fase (hay 41 specs y 11 pruebas de Cypress)

---

## Orden sugerido

1. Fase 1 (una tarde, sin riesgo)
2. Fase 2 (deja listas las piezas que reutiliza la Fase 3)
3. Fase 7, solo ESLint y CI (así la limpieza no se pierde)
4. Fase 3 (la que más código elimina)
5. Fases 4, 5 y 6 por partes, una carpeta a la vez
