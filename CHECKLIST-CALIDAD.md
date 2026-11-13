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
- [x] Aviso de build: `file-saver` no era ESM. [document-generator.service.ts](src/app/core/services/document-generator.service.ts) usa ahora `descargarBlob` de [download.util.ts](src/app/core/utils/download.util.ts) y se desinstalan `file-saver` y `@types/file-saver`. `ng build` ya no da avisos
- [ ] Revisar a ojo el modal de inscripción a cursos y las páginas del estudiante (paz y salvo, homologación, reingreso) con datos reales

---

## Fase 2 — Código repetido (servicios, utilidades y componentes pequeños) ✅ (terminada el 2026-11-13)

Cada bloque se verificó con `ng build`, `ng test` (530/530 al terminar; 499 al empezar) y `test:navegacion` sin backend.

### Servicios duplicados
- [x] Hay dos `ErrorHandlerService`: queda solo [core/services/error-handler.service.ts](src/app/core/services/error-handler.service.ts). El de `shared/components/error-handler/` (264 líneas) se borra: su único uso real era `handleCargaError('cursos')` en `gestionar-cursos`, que pasa a `SnackbarService.warning()`
- [x] Notificaciones: [SnackbarService](src/app/core/services/snackbar.service.ts) con `exito()`, `error()`, `advertencia()`, `info()` y `mostrar(msg, tipo, duración)` (tipo `destacado` para el aviso de cambio de período). Lo usan 51 archivos y `MatSnackBar` ya solo aparece dentro del servicio. Se borran `snackbarConfig()`, los `MatSnackBarModule` de los componentes y los `mostrarMensaje` de las páginas del estudiante
  - Cambio visible esperado: homologación y reingreso del estudiante mostraban los avisos centrados (4 o 6 s) y ahora salen arriba a la derecha (5 s) como el resto; el aviso de cambio de período pasa de abajo al centro a arriba a la derecha (sigue con fondo institucional y 8 s)
- [x] Se borra `ApiService` (20 `any`); todos los servicios usan `HttpClient` con tipos
  - `AuthService.login()` hace el POST a `/usuarios/login` y devuelve `LoginRespuesta` ([usuario-sesion.model.ts](src/app/core/models/usuario-sesion.model.ts)); `login.component` lo llama en lugar de `ApiService`
  - `manage-processes` y `form-proceso-dialog` usan el nuevo [ProcesosService](src/app/core/services/procesos.service.ts) con `ProcesoDTOPeticion`/`ProcesoDTORespuesta` ([proceso.interface.ts](src/app/core/models/proceso.interface.ts)), igual que `ProgramasService`. Así no entra `HttpClient` en los componentes (Fase 4)
  - Se borran de `ApiEndpoints` las constantes que solo usaba `ApiService` (`AUTH.REFRESH/LOGOUT/PROFILE`, `USUARIOS`, `PROCESOS`), que además apuntaban a rutas que el backend no tiene
  - Specs: `login` y `session-management` dejan de simular `ApiService`; se añaden `procesos.service.spec.ts` y una prueba del POST de `AuthService.login`

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

Paz y salvo ya sigue el patrón correcto: [paz-salvo-revision](src/app/pages/common/paz-salvo-revision/) es un solo componente para funcionario y coordinador (con `data: { rolRevision }` en la ruta) y comparte la bandeja con secretaría. Hay que llevar ese patrón a los demás procesos.

### Bandeja genérica
- [x] `PazSalvoBandejaComponent` pasa a [SolicitudesBandejaComponent](src/app/shared/components/solicitudes-bandeja/solicitudes-bandeja.component.ts) (`app-solicitudes-bandeja`), con pestañas Pendientes/Historial y filtro de período (`periodo-filtro-selector`; "todos" se emite como `null`)
  - Recibe las solicitudes tal como llegan del backend (cualquier tipo que cumpla [SolicitudRevisable](src/app/core/models/solicitud-revision.model.ts)), arma ella las filas con [aFilaSolicitud](src/app/core/utils/fila-solicitud.util.ts) y emite la solicitud elegida, no su id. Así las páginas ya no guardan `pendientesOriginales` para buscarla
  - `aFilaTabla`/`aFilaHistorial` de `paz-salvo-filas` se unen en `aFilaSolicitud`; `paz-salvo-filas` se queda solo con `aDocumentos`. Se quita `fechaProcesamiento` de las filas del historial, que la tabla nunca mostraba
  - La usan paz-salvo-revision (funcionario y coordinador) y secretaría/paz-salvo, sin cambios visibles. Specs nuevos de la bandeja y de `aFilaSolicitud` (537/537)

### Revisión (funcionario / coordinador / secretaría)
- [x] **Homologación**: funcionario y coordinador (unas 450 líneas de TS entre los dos) se unen en [homologacion-revision](src/app/pages/common/homologacion-revision/homologacion-revision.component.ts), con `data: { rolRevision }` en `app.routes.ts`. Las URLs no cambian
  - La lógica va en [RevisionAprobacionComponent](src/app/pages/common/revision-aprobacion/revision-aprobacion.component.ts) (`app-revision-aprobacion`), que sirve a cualquier proceso con `SolicitudesAprobacionService`: bandeja genérica, visor de documentos, aprobar y rechazar (`TextoDialogComponent` con `datosRechazo()`) y avisos con `SnackbarService`. Cada página solo le pasa un `ConfigRevisionAprobacion` (rol, servicio, proceso, nombre y si marca los documentos al decidir). Los tipos `RolRevision` y `SolicitudAprobable` van en [solicitud-revision.model.ts](src/app/core/models/solicitud-revision.model.ts)
  - Se mantiene lo de cada rol: el funcionario aprueba (`APROBADA_FUNCIONARIO`) y marca los documentos como válidos o no válidos; el coordinador aprueba definitivamente (`APROBADA_COORDINADOR`) sin tocarlos
  - Al elegir una solicitud ya no se vuelve a pedir la lista al backend (antes se hacía un GET por cada clic)
  - Specs: los 2 de funcionario y coordinador se cambian por `revision-aprobacion.component.spec.ts` (15 pruebas: bandejas por rol, quién puede decidir, aprobar, rechazar, cancelar, errores, período y comentarios) y `homologacion-revision.component.spec.ts` (3: rol de la ruta)
  - Cambios visibles esperados:
    - Las dos pantallas tienen ahora las pestañas **Pendientes de Procesar** e **Historial - Ya Procesadas** con filtro de período, como paz y salvo y reingreso del funcionario. El título de la tabla pasa a "Solicitudes Pendientes de Procesar" (antes "Solicitudes de Homologación Pendientes" o "Solicitudes de Homologación - Coordinador")
    - Al entrar ya no aparece abierta la documentación de la primera solicitud (antes se mostraba aunque su fila no estuviera marcada); hay que elegirla en la tabla
    - Después de añadir un comentario sigue elegida la misma solicitud, con el comentario al día (antes saltaba a la primera)
    - Funcionario: los botones se desactivan si la solicitud no está `ENVIADA`, igual que ya hacía el coordinador con `APROBADA_FUNCIONARIO`. En su bandeja no debería pasar
- [x] **Reingreso**: funcionario y coordinador (unas 500 líneas de TS entre los dos) se unen en [reingreso-revision](src/app/pages/common/reingreso-revision/reingreso-revision.component.ts) con `data: { rolRevision }`; solo configura `RevisionAprobacionComponent` (ningún rol marcaba documentos al decidir). Se borra la carpeta `pages/coordinador`, que quedó vacía
  - Se borra `completarValidacion`/`puedeCompletarValidacion` del funcionario: la plantilla no tenía botón para usarlos
  - Specs: los 2 "should create" se cambian por `reingreso-revision.component.spec.ts` (bandejas de cada rol). Total 550/550. En Cypress, E2E-HA-013 busca ahora el título "Solicitudes Pendientes de Procesar" (no se corrió: necesita el binario de Cypress)
  - Cambios visibles esperados:
    - Coordinador: gana las pestañas Pendientes/Historial con filtro de período (el funcionario ya las tenía). Título "Solicitudes Pendientes de Procesar" en lugar de "Solicitudes de Reingreso Pendientes de Revisión"
    - Las dos: ya no se abre sola la documentación de la primera solicitud, y tras comentar no salta a otra (igual que en homologación)
    - Funcionario: los errores del historial ya no muestran aviso; el servicio devuelve una lista vacía, igual que en paz y salvo
- [ ] **Secretaría** (homologación 403 líneas, reingreso 745): usar la bandeja genérica y la misma lógica de aprobar y rechazar
- [ ] **ECAES funcionario** ([586 líneas](src/app/pages/funcionario/pruebas-ecaes/pruebas-ecaes.component.ts)): pasarla al mismo patrón
- [ ] La lógica de aprobar y rechazar está repetida: `aprobarSolicitudSeleccionada` (7 copias), `rechazarSolicitudSeleccionada` (7), `puedeAprobar` y `puedeRechazar` (5), `onSolicitudSeleccionada` (9), `cargarSolicitudes` (7). Llevarla a una clase base o a un servicio de página encima de [SolicitudesAprobacionService](src/app/core/services/base/solicitudes-aprobacion.service.ts)
  - Avance (2026-11-13): homologación y reingreso de funcionario y coordinador ya usan `RevisionAprobacionComponent`. Quedan `aprobarSolicitudSeleccionada` y `rechazarSolicitudSeleccionada` en 3 archivos, `puedeAprobar`/`puedeRechazar` en 1, `onSolicitudSeleccionada` en 6 y `cargarSolicitudes` en 3 (secretaría, ECAES y paz-salvo-revision). Paz-salvo-revision podría pasar a `RevisionAprobacionComponent` si `PazSalvoService` se acerca a `SolicitudesAprobacionService` (le carga los documentos aparte al coordinador y muestra el motivo de rechazo)

### Vistas del estudiante (paz y salvo, homologación, reingreso, ECAES)
- [ ] Las cuatro páginas repiten `obtenerDocumentosFaltantes`, `onArchivosChange`, `puedeEnviar`, `onSolicitudEnviada`, `listarSolicitudes`, `descargarOficio` y `verComentarios`. Extraer un componente `SolicitudEstudianteComponent` (o una clase base) que reciba el proceso y su servicio
- [ ] Partir [estudiante/reingreso](src/app/pages/estudiante/reingreso-estudiante/reingreso-estudiante.component.ts) (865 líneas), [estudiante/homologación](src/app/pages/estudiante/homologacion-asignaturas/homologacion-asignaturas.component.ts) (742) y [estudiante/ecaes](src/app/pages/estudiante/pruebas-ecaes/pruebas-ecaes.component.ts) (713) después de extraerlo

### Rutas
- [ ] En [app.routes.ts](src/app/app.routes.ts), `modulo-estadistico`, `historial-completo` y `cursos-intersemestrales` se repiten en cada rol. Generar esas rutas desde una configuración por rol, o pasar cada rol a su archivo `*.routes.ts` como ya hacen `admin` y `estudiante`

---

## Fase 4 — Arquitectura y organización

- [x] **Sin `HttpClient` en componentes** (2026-11-13). Ya ningún componente lo inyecta
  - Estudiante, homologación y reingreso: la descarga del oficio usa `descargarOficioConNombre()` de [SolicitudesAprobacionService](src/app/core/services/base/solicitudes-aprobacion.service.ts) (respuesta entera, para leer `Content-Disposition` con `nombreDeContentDisposition`) y `descargarBlob`. Ya no arman la cabecera `Authorization` a mano: la pone `JwtInterceptor`. Se borra el `descargarBlob` privado de reingreso
  - Estudiante, ECAES: `PruebasEcaesService.listarTiposDocumento()` con el tipo `TipoDocumento` ([tipo-documento.model.ts](src/app/core/models/tipo-documento.model.ts)); se siguen mostrando solo CC y CE y, si no llega ninguno, los fijos
  - Funcionario, ECAES: `PeriodosAcademicosService.getValoresPeriodos()` (todos los períodos o, si no hay, los recientes). `getTodosLosPeriodos()` acepta ahora períodos como texto, igual que `getPeriodosRecientes()` (función `aPeriodos`)
  - detalle-solicitud ya usaba `ArchivosService`; ahora también `descargarBlob`
  - Specs: `periodos-academicos.service.spec.ts` (4 pruebas, nuevo), 2 de `listarTiposDocumento` en el servicio de ECAES y 2 de tipos de documento en la página del estudiante. Total 558/558 (50 specs)
  - Sin cambios visibles esperados
- [x] **`shared` solo para lo genérico** (2026-11-13). Se mueven con `git mv` a la carpeta de la página que los usa:
  - `estadisticas-por-estado`, `estadisticas-por-proceso`, `estudiantes-por-programa` y `tendencias-comparativas` → [modulo-estadistico/components/](src/app/pages/common/modulo-estadistico/components/)
  - `curso-list`, `preinscripcion-dialog` e `inscripcion-modal` → [estudiante/cursos-intersemestrales/components/](src/app/pages/estudiante/cursos-intersemestrales/components/)
  - `estudiantes-curso-dialog` → [gestionar-cursos/](src/app/pages/common/cursos-intersemestrales/gestionar-cursos/), junto a `curso-dialog`
  - `info-preregistro-dialog` → [estudiante/pruebas-ecaes/](src/app/pages/estudiante/pruebas-ecaes/)
  - Se quita `PreinscripcionDialogComponent` de los providers de `app.config.ts`: un componente standalone no se registra como provider y nadie lo inyectaba
  - Sin cambios visibles esperados
- [x] **Plantillas inline largas a archivo `.html`** (2026-11-13): `template` y `styles` pasan a `.html` y `.css` (con `templateUrl`/`styleUrl`) en `estadisticas-por-estado` (595 → 214 líneas de TS), `estadisticas-por-proceso` (520 → 166), `estudiantes-por-programa` (384 → 112), `estado-filters` (448 → 134), `ver-comentarios-dialog` (el antiguo `comentarios-dialog`, 370 → 73), `periodo-filtro-selector` (199 → 117) e `info-preregistro-dialog` (162 → 30). Quedan inline solo plantillas cortas (confirm-dialog, breadcrumb, loading-spinner, los diálogos de paz y salvo y ver-solicitud y las páginas finas de revisión)
  - Sin cambios visibles esperados
- [ ] **Partir archivos gigantes**:
  - [x] [preinscribir-estudiantes.component.ts](src/app/pages/common/cursos-intersemestrales/preinscribir-estudiantes/preinscribir-estudiantes.component.ts) (947 → 376): sus dos diálogos con plantilla inline pasan a su propio componente con `.html` y `.css`: [detalles-preinscripcion-dialog](src/app/pages/common/cursos-intersemestrales/preinscribir-estudiantes/detalles-preinscripcion-dialog.component.ts) y [rechazo-preinscripcion-dialog](src/app/pages/common/cursos-intersemestrales/preinscribir-estudiantes/rechazo-preinscripcion-dialog.component.ts)
  - [x] [inscribir-estudiantes.component.ts](src/app/pages/common/cursos-intersemestrales/inscribir-estudiantes/inscribir-estudiantes.component.ts) (802 → 331): igual con [detalles-inscripcion-dialog](src/app/pages/common/cursos-intersemestrales/inscribir-estudiantes/detalles-inscripcion-dialog.component.ts) y [confirmacion-inscripcion-dialog](src/app/pages/common/cursos-intersemestrales/inscribir-estudiantes/confirmacion-inscripcion-dialog.component.ts)
  - [x] [document-generator.service.ts](src/app/core/services/document-generator.service.ts) (856 → 51): no hacía falta separar generadores. Los tres oficios que se usan (`OFICIO_PAZ_SALVO`, `OFICIO_HOMOLOGACION`, `RESOLUCION_REINGRESO`) salían al backend antes de llegar al generador Word del front, así que unas 700 líneas con `docx` (`crearContenidoPazSalvo/Homologacion/Reingreso`, `guardarDocumentoEnBD`) nunca se ejecutaban. Se borran, igual que `getTemplates`, `getTemplatesPredefinidos` y `descargarArchivo` (las páginas usan `descargarBlob`), y se desinstala `docx`
    - Los tipos `DocumentTemplate`, `DocumentData` y `DocumentRequest` pasan del componente de `shared` a [documento.model.ts](src/app/core/models/documento.model.ts), con `DatosSolicitudDocumento` en lugar de `any`
    - La fecha del paz y salvo se arma con `fechaParaBackend()` (misma lógica de antes, sin pasar por UTC). Spec nuevo `document-generator.service.spec.ts` (3 pruebas; 561/561, 51 specs)
    - Sin cambios visibles esperados
  - [x] `estadisticas.model.ts` (560) pasa a [core/models/estadisticas/](src/app/core/models/estadisticas/): `generales` (213: resumen, KPIs, procesos, programas y estados), `mejoradas` (62: por programa y por período), `tendencias` (49), `cursos-verano` (163) y `predicciones` (36). Los imports se reescribieron por script. Se borran 3 interfaces que nadie usaba (`FiltrosDashboard`, `EstadisticasGlobalesAPI`, `RecomendacionFutura`)
  - [x] [cursos-verano-dashboard.component.css](src/app/pages/common/modulo-estadistico/cursos-verano/cursos-verano-dashboard.component.css) (1432 → 943). Ya cargaba `dashboard-comun.css`; comparado regla a regla con el dashboard general solo había 2 reglas idénticas, así que compartir más no ahorraba nada sin cambiar el aspecto. Lo que sí se hace: la pestaña **Recomendaciones** pasa a su componente [recomendaciones-cursos-verano](src/app/pages/common/modulo-estadistico/cursos-verano/recomendaciones-cursos-verano/recomendaciones-cursos-verano.component.ts) con su CSS (499 líneas), `input()`, `computed()` para ordenar por prioridad, `signal()` para las tarjetas abiertas, `OnPush` y `@if`/`@for`. Spec nuevo (3 pruebas; 564/564, 52 specs). Se borra `totalRecomendaciones`, que la plantilla no usaba
    - Cambio visible esperado: ninguno. El botón de expandir tiene ahora `aria-label` ("Ver más"/"Ver menos")
  - [x] [preinscribir-estudiantes.component.css](src/app/pages/common/cursos-intersemestrales/preinscribir-estudiantes/preinscribir-estudiantes.component.css) (685 → 556): se borran 23 selectores sin uso (los `.btn-rechazar` con `::ng-deep`, la tabla no tiene ese botón, y `.modal`/`.close` de un modal que ya es `rechazo-preinscripcion-dialog`)
  - [ ] [inscripcion-modal.component.css](src/app/pages/estudiante/cursos-intersemestrales/components/inscripcion-modal/inscripcion-modal.component.css) (724): todas sus clases se usan; achicarlo es parte de la Fase 5 (tokens y bloques repetidos)
- [x] **Alias de imports** (2026-11-13): `@core/*`, `@shared/*` y `@env/*` en `paths` de [tsconfig.json](tsconfig.json). Un script cambió 478 imports en 117 archivos: todo import que sale de su área hacia `core`, `shared` o `environments` usa el alias; dentro de una misma área siguen siendo relativos (`../models/…` desde `core/services`). Ya no queda ningún `../../../`
- [ ] **Estructura por funcionalidad** (opcional, al final): pasar de `pages/<rol>/<proceso>` a `features/<proceso>/{estudiante,revision}`

---

## Fase 5 — Estilos

- [x] **Colores a tokens** (2026-11-13): de 1156 hexadecimales en los `.css` de componentes quedan 245 (sin contar comentarios), y los `var(--…)` pasan de 778 a 1645. Por script y solo con valores idénticos, así que no cambia ningún color:
  - 92 coincidían con un token institucional (`--color-primario`, `--color-error`, `--primario-NN`, `--notif-*`…)
  - Para los demás colores que se repetían 8 veces o más se añaden a [tokens.css](src/app/core/design-system/tokens.css) **colores de apoyo** con el mismo valor: escala `--gris-25` a `--gris-900`, `--blanco`, `--primario-98`, `--azul-50/500/700`, `--indigo-50`, `--estado-exito/peligro/advertencia/info` y `--rojo-50/700/800` (775 usos)
  - Se quitan 40 valores de reserva redundantes (`var(--color-primario, #000066)` → `var(--color-primario)`): los tokens siempre están definidos
  - Pendiente de diseño, no de código: fundir colores casi iguales (hay tres rojos de error: `--estado-peligro`, `--rojo-700` y `--color-error`; y verdes `#4CAF50`/`--estado-exito`). Eso sí cambia el aspecto y conviene decidirlo con el Sistema de Diseño TIC
- [x] **`style="…"` a clases**: los 18 se quitan. Globales en [componentes.css](src/styles/componentes.css): `.accion-ver`, `.accion-aprobar` y `.accion-rechazar` (botones de icono de inscribir y preinscribir), `.insignia-plana` (estado y condición en visualizar-solicitudes) y `.spinner-en-boton` (historial). Locales: `.estado-etiqueta` (preinscribir), `.btn-exportar-excel` (visualizar-solicitudes) y `.boton-descargar` (detalles de inscripción)
  - Sin cambios visibles esperados (mismas propiedades; los colores ya eran `!important`)
- [x] **Bloques CSS repetidos**: llevarlos a `componentes.css` (global) les quitaba el atributo de encapsulación y bajaba su especificidad, lo que podía cambiar la cascada. En su lugar, las reglas idénticas en todo un grupo de páginas pasan a un CSS compartido que esas páginas cargan primero en `styleUrls` (igual que ya hacía `dashboard-comun.css`), sin cambiar la especificidad:
  - [secretaria-comun.css](src/app/pages/secretaria/secretaria-comun.css): 8 reglas de las tres páginas de secretaría (contenedor, instrucciones, selección y subida del PDF)
  - [solicitud-estudiante-comun.css](src/app/pages/estudiante/solicitud-estudiante-comun.css): 8 reglas de paz y salvo, homologación y reingreso del estudiante
  - [menu-cursos-comun.css](src/app/pages/common/cursos-intersemestrales/menu-cursos-comun.css): 10 reglas del menú de cursos intersemestrales (estudiante y funcionario/coordinador)
  - [filtro-curso-comun.css](src/app/pages/common/cursos-intersemestrales/filtro-curso-comun.css): 21 reglas de preinscribir e inscribir estudiantes
  - [estados-solicitud-comun.css](src/app/pages/common/estados-solicitud-comun.css): 8 reglas de colores de estado de detalle-solicitud e historial-completo
  - En total se quitan 775 líneas repetidas. Sin cambios visibles esperados

---

## Fase 6 — Angular moderno y tipado

- [ ] **Tipado**: hay 282 `any` (los que más tienen: `api.service` con 20, `secretaria/reingreso` con 13, `form-usuario` con 11, `manage-processes` con 8). Reemplazarlos por las interfaces de `core/models`
- [x] **Suscripciones** (2026-11-13): hay 244 `.subscribe(` fuera de los specs. Se revisaron todas las que no terminan solas (`$` de servicios, `valueChanges`, `router.events`, `route.params`, `interval`); las HTTP y `afterClosed()` terminan solas
  - Fugas reales corregidas: **configurar-periodo** se suscribía a `periodoActual$` (un `BehaviorSubject` de un servicio raíz) sin soltarlo, así que cada visita sumaba un suscriptor. Ahora se suscribe una vez en `ngOnInit` con `takeUntilDestroyed`, igual que `valueChanges`. **breadcrumb** escuchaba `router.events` sin cortar
  - Las 108 `takeUntil(this.destroy$)` de 18 componentes pasan por script a `takeUntilDestroyed(this.destroyRef)`, que ya usaban otras 50. Se borran los `Subject` `destroy$` y los `ngOnDestroy` que solo hacían `next()`/`complete()` (en los dashboards estadísticos se quedan para destruir los gráficos). Ya no queda ningún `takeUntil(`
  - `route.params` en form-docente, form-programa y form-usuario también con `takeUntilDestroyed`
  - Se dejan como están las `Subscription` manuales que hay que cortar antes de destruir (intervalo de login, sondeo de notificaciones) o que ya se sueltan bien (header, notifications-header y los 4 componentes del módulo estadístico)
  - Spec CI-011 de cursos-intersemestrales: ya no espía `destroy$`; comprueba que al destruir el componente nadie sigue escuchando `router.events`. 564/564 y `test:navegacion` sin backend correcto
  - Sin cambios visibles esperados
- [x] **Inyección de dependencias** (2026-11-13): todo usa `inject()`. Migración `ng generate @angular/core:inject` en 83 archivos (componentes, servicios, guards y un spec); `@angular-eslint/prefer-inject` pasa a `error`. Los avisos `prefer-inject` bajan de 282 a 0
  - Spec ajustado: SEC-035-A creaba `new AuthService(router, http, …)`; ahora lo crea con `TestBed.runInInjectionContext(() => new AuthService())`
  - Sin cambios visibles esperados
- [x] **Control flow** (2026-11-13, commit `35f9563`): los 505 `*ngIf`, `*ngFor` y `*ngSwitch` pasan a `@if`, `@for` y `@switch`; ya no queda ninguno. Se quita `CommonModule` de los componentes que ya no lo necesitaban (quedan 17 que usan sus pipes o `ngClass`)
  - El estrechamiento de tipos de `@if` dejó 7 avisos `NG8107` (`?.` innecesario) en paz-salvo, dashboard-estadistico, cursos-verano-dashboard y detalles-inscripcion-dialog; se corrigen y `ng build` vuelve a salir sin avisos. 564/564
  - Sin cambios visibles esperados
- [x] **`standalone: true`** se quita de los 89 archivos donde quedaba (84 componentes y 5 pipes), por script. Sin cambios visibles esperados
- [x] **Entradas y salidas** (2026-11-13): ya no queda ningún `@Input`, `@Output` ni `EventEmitter`. Migraciones `ng generate @angular/core:signal-input-migration` y `output-migration` en todo `src/app` (66 `input()`, 16 `output()`), revisadas a mano; las 12 entradas que la migración saltó (setters, `@if` que estrechaba el tipo, specs que escribían la entrada) se pasan a mano:
  - `SolicitudesBandejaComponent`: `pendientes`/`procesadas` como `input()` y las filas como `computed()`; `viewChild()` para la tabla
  - `FileUploadComponent`: `archivos` pasa a `model()` (sigue funcionando con `[archivos]` + `(archivosChange)` de las 4 páginas del estudiante). Ya no muta el array del padre: cada cambio crea uno nuevo y la subida usa `finalize` para apagar `cargando`
  - `approved-requests-section`: se borra la entrada `initiallyExpanded`, que nadie pasaba; `solicitudes` pasa de `any[]` a `Solicitud[]`
  - `card-container`, `loading-spinner`, `documentation-viewer` y `estado-filters`: el `@if` lee la signal con `as` o llamándola
  - `RevisionAprobacionComponent`: `config` como `input.required()`
  - Specs: bandeja, selector de período y revisión-aprobación usan `fixture.componentRef.setInput`
- [x] **Estado local a `signal()`** en `shared` (2026-11-13): 19 `signal()` y 7 `computed()` en 11 archivos. `periodo-filtro-selector`, `estado-filters`, `notifications-header`, `notificaciones-guia`, `request-status` y `approved-requests-section` guardan su estado en signals; `breadcrumb` arma las migas con `toSignal(router.events)` + `computed()`. `request-status` y `notifications-header` ya no usan `ChangeDetectorRef` (`markForCheck`/`detectChanges`). Las notificaciones leídas se marcan con `update()` en lugar de mutar el objeto. Quedan sin signals `texto-dialog` (usa `ngModel`) y `document-generator` (formulario reactivo)
  - Verificado: `ng build` sin avisos, 564/564, lint 0 errores y 204 avisos (`no-explicit-any`; eran 209), `test:navegacion` sin backend correcto
  - Pendiente: `/notificaciones-guia` es una ruta de `common.routes.ts` a la que no enlaza ningún menú. Decidir si se borra
  - Cambio visible esperado: en el visor de documentos, la columna **Comentarios** se calculaba una sola vez al crear el visor; ahora aparece o desaparece al elegir otra solicitud según tenga documentos con comentario
- [ ] **OnPush**: solo 5 de 88 componentes lo usan. Activarlo empezando por los de `shared`

---

## Fase 7 — Herramientas y documentación

- [x] ESLint con `ng add @angular-eslint/schematics` (angular-eslint 19.8.1, ESLint 9): [eslint.config.js](eslint.config.js) con los presets recomendados de TypeScript y Angular (también plantillas y accesibilidad), más `no-explicit-any` (aviso), `no-unused-vars` (error; se permite un `_` delante y los `catch` sin usar) y `@angular-eslint/prefer-inject` (aviso). Script `npm run lint` (`ng lint`)
  - Errores corregidos: 0 errores al cerrar (había 489, la mayoría de estilo y arreglados con `--fix`). A mano: 84 variables, imports y parámetros sin usar; 9 `if`/`else` vacíos (restos de `console.error` borrados en `periodos-academicos.service` y `cursos-verano-dashboard`); constructores y `ngOnInit` vacíos; el `@Output() toggle` del sidebar, que nadie escuchaba; un `eslint-disable` de una regla que no existe
  - Accesibilidad (plantillas): las 6 fechas de ECAES del funcionario tienen `label for`/`id`; los ítems de notificación (header y guía) se pueden enfocar y abrir con Enter (`tabindex="0"`, `role="button"`, `keydown.enter`)
  - **Avisos pendientes (2026-11-13, después de input()/output()): 204**, todos `no-explicit-any` (los `prefer-inject` ya son 0 y la regla está en `error`). Después de control flow eran 209
  - Antes, después de reducir `document-generator.service`: 493 = 282 `prefer-inject` (Fase 6, inyección) + 211 `no-explicit-any` (Fase 6, tipado). Después de quitar `HttpClient` de los componentes eran 501 (283 + 218); después de la Fase 3 de homologación y reingreso eran 509 (286 + 223) y al cerrar la Fase 7, 539 (306 + 233). Cuando bajen a 0, pasar las dos reglas a `error`
- [ ] Prettier más `.prettierrc` (ya existe `.editorconfig`)
- [x] CI en GitHub Actions: [.github/workflows/ci.yml](.github/workflows/ci.yml) corre en cada push y PR a `main` (Node 22): `npm ci` (sin bajar el binario de Cypress), `npm run lint`, `ng build` y `ng test --watch=false --browsers=ChromeHeadlessCI`
  - `karma.conf.js` tiene el launcher `ChromeHeadlessCI` (`--no-sandbox`, `--disable-gpu`, `--disable-dev-shm-usage`); en local se sigue usando `ChromeHeadless` con Edge y los dos funcionan
  - Primera ejecución en GitHub confirmada: el push de `fb82260` pasó en 1m52s (run 43480529339, 2026-11-13)
- [ ] Cobertura mínima en `karma.conf.js` (por ejemplo 60 %)
- [ ] Opcional: Husky con lint-staged para correr lint antes de cada commit
- [ ] README: sección de arquitectura (core/shared/pages, el patrón de revisión por rol), variables de entorno y la lista de scripts de test
- [ ] Revisar que las pruebas que existen sigan pasando después de cada fase (hay 49 specs con 550 pruebas y 11 pruebas de Cypress)

---

## Orden sugerido

1. Fase 1 (una tarde, sin riesgo)
2. Fase 2 (deja listas las piezas que reutiliza la Fase 3)
3. Fase 7, solo ESLint y CI (así la limpieza no se pierde)
4. Fase 3 (la que más código elimina)
5. Fases 4, 5 y 6 por partes, una carpeta a la vez
