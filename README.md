# Sistema de Atención a Estudiantes de Pregrado - Universidad del Cauca

Aplicación web de la Facultad de Ingeniería Electrónica y Telecomunicaciones (FIET) para tramitar los procesos académicos de los estudiantes de pregrado: el estudiante envía su solicitud con los documentos y la sigue en línea, y funcionarios, coordinadores y secretaría la revisan hasta entregar el oficio o la resolución.

- Producción: https://front-end-gestion-curricular.vercel.app
- Backend: repositorio Back-end-gestion-curricular (Spring Boot y MySQL)

## Procesos

| Proceso                         | Qué hace                                                                                  | Roles                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Paz y salvo**                 | Solicitud del paz y salvo para la ceremonia de grado, con los formatos exigidos           | Estudiante, funcionario, coordinador, secretaría |
| **Reingreso**                   | Solicitud de reingreso al programa                                                        | Estudiante, funcionario, coordinador, secretaría |
| **Homologación de asignaturas** | Solicitud y validación de homologaciones                                                  | Estudiante, funcionario, coordinador, secretaría |
| **Pruebas ECAES (Saber Pro)**   | Preinscripción del estudiante y publicación de las fechas del examen                      | Estudiante, funcionario                          |
| **Cursos intersemestrales**     | Oferta de cursos de verano, solicitud de cursos nuevos, preinscripción e inscripción      | Estudiante, funcionario, coordinador             |
| **Módulo estadístico**          | Indicadores, gráficos y tendencias por proceso, programa y periodo; exporta a PDF y Excel | Funcionario, coordinador, decano                 |
| **Historial completo**          | Consulta de todas las solicitudes, con filtros                                            | Funcionario, coordinador, decano                 |
| **Administración**              | Usuarios, roles, docentes, programas y enlaces de los formatos institucionales            | Administrador                                    |

## Uso por rol

Se entra con el correo institucional y la contraseña. El menú lateral muestra solo las opciones del rol; la cabecera muestra el periodo académico actual, las notificaciones (campana) y el menú de usuario, con el perfil y la salida.

### Estudiante

1. Abra el proceso en el menú (Paz y salvo, Reingreso, Homologación, Pruebas ECAES o Cursos intersemestrales).
2. Lea la lista de documentos requeridos: los marcados con `*` son obligatorios. Suba cada documento en PDF y envíe la solicitud.
3. Siga el estado en la tabla de seguimiento de la misma página. Si la solicitud fue rechazada, el icono de comentario muestra el motivo.
4. Cuando la secretaría termina el trámite, descargue el oficio o la resolución desde la misma tabla.

En **Cursos intersemestrales** puede ver los cursos ofertados, pedir la apertura de un curso que no esté en la oferta, preinscribirse, inscribirse (con el comprobante de pago) y seguir sus solicitudes.

### Funcionario y coordinador

1. Abra el proceso. La bandeja muestra las solicitudes pendientes del periodo elegido y, aparte, las ya procesadas.
2. Seleccione una solicitud para ver los documentos adjuntos y sus comentarios.
3. Apruebe o rechace. Para rechazar hay que escribir el motivo, que le llega al estudiante.

El funcionario hace la primera revisión y el coordinador decide sobre las solicitudes que el funcionario aprobó. El funcionario además publica las fechas de las pruebas ECAES. En **Cursos intersemestrales** se crean y editan los cursos, se aprueban o rechazan preinscripciones e inscripciones y se ven las solicitudes de cursos nuevos.

El **Módulo estadístico** y el **Historial completo** sirven para consultar; el decano solo tiene estas dos opciones.

### Secretaría

1. Abra el proceso (Paz y salvo, Reingreso u Homologación). Las pendientes son las que ya aprobó el coordinador; seleccione una.
2. Revise la documentación adjunta y genere el oficio o la resolución desde la plantilla, o use un documento que ya tenga.
3. Suba el PDF firmado y pulse **Enviar al estudiante**. La solicitud queda `Aprobada`.

### Administrador

Desde el **Panel de administración** se gestionan usuarios (crear, editar, activar o desactivar y asignar rol), roles, docentes y programas. En **Formatos institucionales** se guardan los enlaces de descarga de los formatos que piden los procesos.

### Estados de una solicitud

`Enviada` → `Aprobada por funcionario` → `Aprobada por coordinador` → `Aprobada`. En cualquier revisión puede pasar a `Rechazada`, con el motivo. En ECAES, la solicitud aprobada queda como `Pre-registrado`.

## Desarrollo

### Requisitos

- Node.js 18.19 o superior (el CI usa Node 22)
- npm 9 o superior
- El backend en marcha en `http://localhost:5000`

### Instalación y ejecución

```bash
npm install
npm start          # ng serve en http://localhost:4200
```

La URL de la API está en `src/environments/environment.ts` (desarrollo, `http://localhost:5000/api`) y `environment.production.ts` (producción). El login es `POST /api/usuarios/login` con `{ correo, password }`; el token JWT se guarda en `localStorage` y lo añade el interceptor a cada petición.

### Tecnologías

Angular 19 (componentes standalone, señales y SSR), Angular Material, Chart.js, Jasmine y Karma, Cypress, ESLint con angular-eslint y Prettier.

### Estructura

```
src/app/
├── core/           Servicios HTTP, guards, interceptores (JWT, errores, límite de login), modelos, enums, utilidades
│   └── design-system/   Tokens del Sistema de Diseño TIC (colores, tipografía, tamaños, redondeos)
├── shared/         Componentes reutilizables (bandeja de solicitudes, diálogos, filtros de periodo, título de página…)
├── layout/         Header, menú lateral (opciones por rol en sidebar.config.ts) y footer
├── features/       Procesos académicos, cada uno con estudiante/ y revision/ (y revision/secretaria)
└── pages/
    ├── common/     Pantallas compartidas: revisión, módulo estadístico, historial, notificaciones, perfil
    ├── estudiante/ secretaria/ admin/   Rutas por rol y pantallas transversales
    └── login/ welcome/
src/styles/         Estilos globales: base, Angular Material, componentes comunes, avisos y animaciones
```

Funcionario y coordinador comparten `RevisionAprobacionComponent` (`pages/common/revision-aprobacion`); el rol sale del `data` de la ruta. Las rutas y sus guards están en `app.routes.ts` y en los `*.routes.ts` de cada rol o proceso. Fechas y números usan el formato colombiano (`LOCALE_ID` = `es-CO`).

### Interfaz

Las pantallas siguen el Sistema de Diseño UX-UI de la División TIC de la Universidad:

- [GUIA-UI.md](src/app/core/design-system/GUIA-UI.md): cuándo usar cada color, botón, etiqueta, título, redondeo y tamaño de letra, y el trato de usted en los textos.
- [src/app/core/design-system/README.md](src/app/core/design-system/README.md): los valores de los tokens.

El título de cada página sale del `title` de su ruta. `npm run lint:estilos` rechaza colores, fuentes, redondeos y tamaños de letra escritos a mano fuera de los tokens.

### Comandos

| Comando                      | Descripción                                                                                                                            |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `npm start`                  | Servidor de desarrollo                                                                                                                 |
| `npm run build`              | Build de producción en `dist/front-end-gestion-curricular/browser/`                                                                    |
| `npm test`                   | Pruebas unitarias (Jasmine y Karma)                                                                                                    |
| `npm run test:usabilidad`    | Pruebas unitarias con cobertura; fallan si baja de los mínimos de `karma.conf.js`                                                      |
| `npm run test:seguridad`     | Solo las pruebas de seguridad                                                                                                          |
| `npm run test:accesibilidad` | Solo las pruebas de accesibilidad                                                                                                      |
| `npm run test:e2e`           | E2E con Cypress (`test:e2e:open` con interfaz; `test:usabilidad:e2e` y `test:seguridad:e2e` por grupo)                                 |
| `npm run test:navegacion`    | Recorre las pantallas de los 6 roles en Edge o Chrome sin interfaz, con `ng serve` en marcha. Con `SIN_BACKEND=1` simula la sesión     |
| `npm run capturas -- <dir>`  | Capturas de las pantallas principales de cada rol, para comparar antes y después de un cambio visual (`ALTO=3200` para páginas largas) |
| `npm run test:reporte`       | Genera el reporte de usabilidad en `reporte-usabilidad.md`                                                                             |
| `npm run lint`               | ESLint                                                                                                                                 |
| `npm run lint:estilos`       | Comprueba que los estilos usen los tokens del Sistema de Diseño                                                                        |
| `npm run format:check`       | Comprueba el formato con Prettier (`npm run format` lo corrige)                                                                        |

Cobertura en `coverage/front-end-gestion-curricular/index.html`.

### Antes de subir cambios

```bash
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npm run lint && npm run lint:estilos && npm run format:check
npx ng build
npx ng test --watch=false
```

`npm install` instala el gancho de pre-commit (Husky): lint-staged pasa ESLint y `lint:estilos` por los archivos preparados de `src/`. El CI de GitHub (`.github/workflows/ci.yml`) corre lint, estilos, build y pruebas en cada push a `main` y en cada pull request contra `main`.

### Despliegue

Vercel construye con `npm run build` y publica `dist/front-end-gestion-curricular/browser` (`vercel.json`). En producción la API es la de `environment.production.ts`.

## Roles

| Rol             | Puede                                                                             |
| --------------- | --------------------------------------------------------------------------------- |
| **ESTUDIANTE**  | Enviar solicitudes, seguir su estado y descargar oficios                          |
| **FUNCIONARIO** | Primera revisión, fechas ECAES, cursos intersemestrales, estadísticas e historial |
| **COORDINADOR** | Aprobación final, cursos intersemestrales, estadísticas e historial               |
| **SECRETARIA**  | Generar y enviar oficios y resoluciones                                           |
| **DECANO**      | Consultar el módulo estadístico y el historial completo                           |
| **ADMIN**       | Usuarios, roles, docentes, programas y formatos institucionales                   |

---

Universidad del Cauca - Facultad de Ingeniería Electrónica y Telecomunicaciones
