# Análisis de pruebas E2E (Propuesta 2) y guía para pruebas de Propuesta 1 (Reingreso, Homologación, ECAES)

## 1. Estructura del front y de las pruebas actuales

### 1.1 Organización del proyecto
- **Propuesta 2 (compañero):** Paz y Salvo, Cursos Intersemestrales (verano), Módulo Estadístico.
- **Propuesta 1 (tuya):** Reingreso de Estudiante, Homologación de Asignaturas, Pruebas ECAES.

Las pruebas E2E están en `cypress/e2e/`:
- `01-login.cy.ts` – Login y autenticación (compartido).
- `02-paz-salvo.cy.ts` – Flujo estudiante: Paz y Salvo.
- `03-cursos-intersemestrales.cy.ts` – Cursos de verano (navegación, solicitudes, preinscripción, seguimiento).
- `04-modulo-estadistico.cy.ts` – Módulo estadístico (tabs, dashboards, filtros, rendimiento).

Soporte:
- `cypress/support/e2e.ts` – Comandos de métricas: `iniciarMedicion`, `finalizarMedicion`, `registrarElementoVisible`, `registrarInteraccionExitosa`, `obtenerMetricas`, y manejo de excepciones.
- `cypress/support/commands.ts` – Comandos: `login`, `verificarCampoFormulario`, `verificarEstadoBoton`, `verificarMensaje`, `navegarYVerificar`, `subirArchivo`, `esperarCargaCompleta`.

Configuración: `cypress.config.ts` – `baseUrl: http://localhost:4200`, timeouts 10000, `specPattern: cypress/e2e/**/*.cy.{js,jsx,ts,tsx}`.

---

## 2. Cómo está haciendo las pruebas tu compañero (patrones)

### 2.1 Patrón general por módulo
1. **Mock de usuario y sesión**  
   Antes de visitar la ruta protegida, se inyecta en `localStorage`: `token`, `usuario` (objeto con `id_usuario`, `nombre_completo`, `correo`, `codigo`, `rol`, `objPrograma`), `tokenExp`, y a veces `userRole`. Se usa `onBeforeLoad` en `cy.visit()` o `cy.window().then(win => { win.localStorage.setItem(...) })` antes del `visit`.

2. **Rutas**  
   Se visita la URL exacta del rol:
   - Estudiante: `/estudiante/paz-salvo`, `/estudiante/cursos-intersemestrales`, etc.
   - Coordinador: `/coordinador/modulo-estadistico`.

3. **Interceptación de APIs**  
   Con `cy.intercept('GET'|'POST', '**/api/...', { statusCode, body })` se mockean:
   - Listados (solicitudes, cursos, estadísticas).
   - Creación de solicitudes (POST 201).
   - Subida de archivos (POST 200).
   Así las pruebas no dependen del backend real.

4. **Bloques describe/it**  
   - Un `describe` por “módulo” o “flujo” (ej. “Flujo Completo de Paz y Salvo”).
   - Varios `describe` internos por categoría: “Visualización de Interfaz”, “Proceso de Subida de Archivos”, “Envío de Solicitud”, “Visualización de Solicitudes”, “Descarga de Oficios”, “Medición de Tiempos de Respuesta”.
   - IDs de caso: `E2E-PS-001`, `E2E-CI-001`, `E2E-ME-001`, etc.

5. **Métricas de usabilidad**  
   En cada it relevante:
   - `cy.iniciarMedicion()` antes de la acción.
   - `cy.finalizarMedicion('Nombre de la acción')` después.
   - `cy.registrarElementoVisible('selector o nombre')` para elementos clave.
   - `cy.registrarInteraccionExitosa()` al final del it.
   - En `after()` del describe principal: `cy.obtenerMetricas()` y `cy.task('log', ...)` para resumir.

6. **beforeEach**  
   - `cy.clearLocalStorage()` y `cy.clearCookies()` (en e2e.ts ya hay parte de esto; en algunos specs se repite).
   - Configuración de intercepts que apliquen a todo el describe (ej. listar solicitudes vacías por defecto).

7. **Visibilidad y comportamiento**  
   - Comprobar que existan componentes: `cy.get('app-required-docs').should('be.visible')`, `cy.get('app-file-upload').should('exist')`, `cy.get('app-request-status-table, .sin-solicitudes').should('exist')`.
   - Botón “Enviar Solicitud” deshabilitado al inicio: `cy.contains('button', 'Enviar Solicitud').should('be.disabled')`.
   - Subida de archivo: `cy.get('input[type="file"]').first().selectFile({ contents: Cypress.Buffer.from('...'), fileName: 'x.pdf', mimeType: 'application/pdf' }, { force: true })`.
   - Mensajes de éxito/error: `cy.get('.mat-mdc-snack-bar-container, .mat-snack-bar-container', { timeout: 5000 }).should('be.visible')` y comprobar texto (éxito, error).

8. **Envío exitoso**  
   - Intercept POST de subida de documento y POST de crear solicitud.
   - Llenar formulario (archivo + campos requeridos, p. ej. fecha).
   - Click en “Enviar Solicitud”.
   - `cy.wait('@crearSolicitud')`.
   - Verificar snackbar de éxito.

9. **Listados con datos mock**  
   - Intercept GET que devuelve un array de solicitudes/cursos.
   - Visitar la página.
   - `cy.wait('@aliasListado')`.
   - Comprobar que aparece algún texto de la respuesta (nombre de solicitud, estado, etc.).

10. **Rendimiento**  
    - `win.performance.mark('inicio-carga')` antes de la acción, `win.performance.mark('fin-carga')` después, `win.performance.measure(...)` y comprobar que la duración sea menor que un umbral (ej. 3000 ms).

---

## 3. Rutas y APIs de tu propuesta (Propuesta 1)

Usa estas rutas y prefijos de API para los intercept y las visitas.

### 3.1 Rutas (app.routes.ts)
- Estudiante:
  - Reingreso: `/estudiante/reingreso-estudiante`
  - Homologación: `/estudiante/homologacion-asignaturas`
  - ECAES: `/estudiante/pruebas-ecaes`
- Funcionario:
  - Reingreso: `/funcionario/reingreso-estudiante`
  - Homologación: `/funcionario/homologacion-asignaturas`
  - ECAES: `/funcionario/pruebas-ecaes`
- Coordinador: `/coordinador/reingreso-estudiante`, `/coordinador/homologacion-asignaturas`
- Secretaría: `/secretaria/reingreso-estudiante`, `/secretaria/homologacion-asignaturas`

Base URL de la API (según environment): normalmente `**/api` o la que use tu `environment.apiUrl` (en Cypress suele usarse `**/api` en los intercept).

### 3.2 Endpoints sugeridos para mock (servicios)
- **Reingreso**
  - Listar por rol: `GET **/solicitudes-reingreso/listarSolicitud-Reingreso/**` o `**/listarSolicitudes-Reingreso**` (según lo que use el cliente).
  - Crear: `POST **/solicitudes-reingreso/crearSolicitud-Reingreso`
  - Subida de archivos: mismo patrón que Paz y Salvo (servicio de archivos genérico o específico de reingreso; revisar `ReingresoEstudianteService`).
- **Homologación**
  - Listar por rol: `GET **/solicitudes-homologacion/listarSolicitud-Homologacion/porRol**`
  - Crear: `POST **/solicitudes-homologacion/crearSolicitud-Homologacion`
  - Subida: según `HomologacionAsignaturasService` (archivos genéricos o específicos).
- **ECAES**
  - Listar solicitudes funcionario: `GET **/solicitudes-ecaes/listarSolicitud-ecaes/porRol**` (o equivalente).
  - Crear solicitud: `POST **/solicitudes-ecaes/crearSolicitud-Ecaes`
  - Fechas: `GET **/solicitudes-ecaes/listarFechasEcaes**` o endpoints de fechas que use el módulo.

(En los specs conviene usar patrones amplios como `**/solicitudes-reingreso/**` y luego afinar si hace falta.)

---

## 4. Prompt para que implementes las pruebas (Propuesta 1)

Puedes usar este texto como instrucción para ti mismo o para quien implemente los tests.

---

**Objetivo**  
Añadir pruebas E2E con Cypress para los módulos de la **Propuesta 1**: Reingreso de Estudiante, Homologación de Asignaturas y Pruebas ECAES, siguiendo la misma estructura y convenciones que las pruebas existentes de Paz y Salvo (02), Cursos Intersemestrales (03) y Módulo Estadístico (04).

**Requisitos**

1. **Archivos nuevos** (en `cypress/e2e/`):
   - `05-reingreso-estudiante.cy.ts` – Flujo estudiante (y opcionalmente funcionario/coordinador si aplica).
   - `06-homologacion-asignaturas.cy.ts` – Flujo estudiante (y opcionalmente otros roles).
   - `07-pruebas-ecaes.cy.ts` – Flujo estudiante (crear solicitud ECAES) y, si aplica, funcionario (publicar fechas, pre-registros pendientes, documentación adjunta).

2. **Estructura de cada spec** (igual que en 02, 03, 04):
   - Un `describe` principal: p. ej. `E2E-05: Flujo Completo de Reingreso de Estudiante`.
   - Mock de usuario en `beforeEach` o en una función helper (como `visitarReingreso()`): inyectar en `localStorage`: `token`, `usuario` (con `id_usuario`, `nombre_completo`, `correo`, `codigo`, `rol: { nombre: 'ESTUDIANTE' }`, `objPrograma`), `tokenExp`, y opcionalmente `userRole`.
   - Usar `cy.intercept` para todos los GET/POST que use la página (listar solicitudes, crear solicitud, subir archivos) con respuestas mock (statusCode 200/201 y body coherente con la interfaz del servicio).
   - Sub-describes por tipo de prueba:
     - Visualización de interfaz (documentación requerida, subida de archivos, tabla de seguimiento, botón Enviar deshabilitado al inicio).
     - Proceso de subida de archivos (selección PDF, habilitar botón cuando haya archivos y formulario válido).
     - Envío de solicitud (flujo completo con intercepts, click en Enviar, esperar al alias del POST, verificar snackbar de éxito; un caso de error 500 y verificar mensaje de error).
     - Visualización de solicitudes (mock de lista con una o varias solicitudes, comprobar que se muestran nombres/estados; opcional: comentarios en rechazadas).
     - Descarga de oficios (si aplica: mock de solicitud aprobada con documento, intercept de descarga, verificar que no falle).
     - Medición de tiempos (carga inicial, tiempo de envío) usando `iniciarMedicion` / `finalizarMedicion` o `performance.mark`/`measure`.
   - En cada `it`, usar `cy.registrarInteraccionExitosa()` y, donde aplique, `cy.registrarElementoVisible(...)` y mediciones.
   - Al final del describe principal, un `after()` que llame a `cy.obtenerMetricas()` y registre con `cy.task('log', ...)` un resumen (elementos verificados, interacciones, mediciones, tiempo promedio si hay).

3. **Reingreso (05)**  
   - Ruta estudiante: `/estudiante/reingreso-estudiante`.
   - Comprobar: `app-required-docs`, `app-file-upload`, tabla o “sin solicitudes”, botón “Enviar Solicitud”.
   - Documentos requeridos (según tu lista): PM-FO-4-FOR-17, Certificado de notas, Documento de identidad, Carta de motivación (opcional).
   - Intercept: GET listar por rol (por ejemplo `**/solicitudes-reingreso/**porRol*` o el que use el cliente), POST crear solicitud, POST subida de archivos.
   - Flujo de envío: seleccionar al menos un PDF, click Enviar, esperar POST, verificar snackbar de éxito.

4. **Homologación (06)**  
   - Ruta estudiante: `/estudiante/homologacion-asignaturas`.
   - Comprobar: `app-required-docs`, formulario “Información de la Solicitud” (programa origen/destino), `app-file-upload`, tabla de seguimiento, botón “Enviar Solicitud”.
   - Documentos: PM-FO-4-FOR-22, Certificado de notas, Programa académico de la materia (opcional).
   - Intercept: GET listar por rol (`**/solicitudes-homologacion/**porRol*` o equivalente), POST crear homologación, subida de archivos.
   - Flujo de envío: rellenar opcionalmente programa origen/destino, seleccionar PDF(s), Enviar, verificar éxito.

5. **ECAES (07)**  
   - Estudiante: `/estudiante/pruebas-ecaes`. Comprobar: formulario de solicitud (tipo documento CC/CE, número de documento, fechas), subida de archivos o documentación adjunta, listado de solicitudes si existe.
   - Intercept: GET fechas ECAES, GET listar solicitudes, POST crear solicitud ECAES.
   - Funcionario (opcional): `/funcionario/pruebas-ecaes`. Comprobar: publicación de fechas (período académico, fechas), Pre-Registros Pendientes, Documentación Adjunta al seleccionar una solicitud, botones Marcar como Pre-registrada / Rechazar.
   - Casos: envío exitoso estudiante; visualización de lista; funcionario: cargar fechas, listar pre-registros (mock), seleccionar solicitud y ver documentación.

6. **Nomenclatura y consistencia**  
   - IDs de casos: `E2E-RE-001`, `E2E-RE-002` (Reingreso); `E2E-HA-001`, … (Homologación); `E2E-EC-001`, … (ECAES).
   - Misma convención de nombres que en 02–04 (describe/it en español, IDs al inicio del it).
   - No modificar el comportamiento de las pruebas existentes de login, paz y salvo, cursos intersemestrales ni módulo estadístico.

7. **Datos de prueba**  
   - Usuario mock con rol ESTUDIANTE (y FUNCIONARIO/COORDINADOR si pruebas esos roles).
   - Solicitudes mock con estructura similar a `SolicitudReingresoDTORespuesta` / `SolicitudHomologacionDTORespuesta` / `SolicitudEcaesResponse` (id_solicitud, nombre_solicitud, fecha_registro_solicitud, estadosSolicitud, documentos, etc.) para los intercept de listados.

8. **Ejecución**  
   - Con la app en marcha (`ng serve` o similar en `http://localhost:4200`), ejecutar: `npx cypress run --spec "cypress/e2e/05-reingreso-estudiante.cy.ts"` (y análogo para 06 y 07), o abrir Cypress y lanzar los specs desde la UI.
   - Verificar que no aparezcan errores NG0100 ni fallos de red no mockeados; que los mensajes de éxito/error se comprueben correctamente.

---

## 5. Contexto o información que podrías necesitar

- **URL base del backend en Cypress**  
  En `cypress.config.ts` suele definirse `env.apiUrl`. Los intercept suelen usar `**/api/**` para no acoplarse al host. Si tus servicios usan `environment.apiUrl`, asegúrate de que los patrones de `cy.intercept` cubran esa base (por ejemplo `**/solicitudes-reingreso/**`).

- **Formularios específicos**  
  - Reingreso: no tiene fecha obligatoria como Paz y Salvo; el botón se habilita con archivos y usuario (y posiblemente otros campos según tu implementación).
  - Homologación: tiene `programa_origen` y `programa_destino` (opcionales, max 200 caracteres); el botón se habilita con archivos y usuario.
  - ECAES: tipo documento (CC/CE), número de documento (por defecto cédula/código del usuario), fecha expedición, fecha nacimiento; puede haber más campos obligatorios según el backend.

- **Selectores**  
  Si algún componente no usa `app-required-docs` o `app-file-upload`, ajusta los selectores (por ejemplo por clase o por texto “Documentación requerida”, “Subir Archivos”, “Enviar Solicitud”) para que las pruebas sigan siendo estables.

- **Mensajes de éxito**  
  Los textos exactos (“Solicitud de reingreso enviada correctamente”, “Solicitud de homologación enviada correctamente”, etc.) deben coincidir con los que muestra tu app (MatSnackBar o similar) para que las aserciones no fallen.

Si quieres, en un siguiente paso puedo proponerte el esqueleto concreto de uno de los tres archivos (por ejemplo `05-reingreso-estudiante.cy.ts`) con describes e its ya nombrados y los intercept básicos, para que solo rellenes los detalles de tu UI.
