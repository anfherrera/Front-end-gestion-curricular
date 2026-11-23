# Sistema de Atención a Estudiantes de Pregrado - Universidad del Cauca

Aplicación web para la atención y gestión de procesos académicos de estudiantes de pregrado.

## Procesos que se realizan

- **Paz y Salvo** – Solicitud y aprobación de documentos académicos (estudiante, funcionario, coordinador, secretaria).
- **Cursos intersemestrales** – Oferta de cursos de verano, preinscripción, inscripción y seguimiento de solicitudes.
- **Módulo estadístico** – Dashboard y análisis de datos (coordinador, funcionario).
- **Reingreso de estudiante** – Solicitud y flujo de aprobación de reingreso (estudiante, funcionario, coordinador, secretaria).
- **Homologación de asignaturas** – Solicitud y validación de homologaciones (estudiante, funcionario, coordinador, secretaria).
- **Pruebas ECAES** – Gestión de solicitudes y documentación de pruebas ECAES (estudiante, funcionario).
- **Historial de solicitudes** – Consulta del historial completo de solicitudes por proceso.
- **Administración** – Usuarios, roles, docentes, programas, periodos académicos y configuración de procesos.

## Requisitos

- Node.js 18+
- npm 9+
- Angular CLI 19+

## Instalación y ejecución

```bash
npm install
ng serve
```

Abrir `http://localhost:4200/`

## Estructura del proyecto

```
src/app/
├── core/           Servicios HTTP, guards, interceptores (JWT, errores, límite de login), modelos, enums y utilidades
├── shared/         Componentes reutilizables (solicitudes-bandeja, confirm-dialog, periodo-filtro-selector…)
├── layout/         Header, sidebar (menú por rol en sidebar.config.ts) y footer
├── features/       Procesos académicos, con vistas de estudiante y revisión
└── pages/
    ├── common/     Rutas de gestión y pantallas compartidas (módulo estadístico, perfil…)
    ├── estudiante/ secretaria/ admin/   Rutas por rol y pantallas transversales
    └── login/ welcome/
src/styles/         Tokens de color y tipografía, y clases comunes (componentes.css)
```

### Revisión por rol

Los cinco procesos académicos se organizan en `features/<proceso>/estudiante` y `features/<proceso>/revision`. Las pantallas de secretaría de paz y salvo, reingreso y homologación están en `revision/secretaria`. Funcionario y coordinador comparten `RevisionAprobacionComponent` en `pages/common/revision-aprobacion`. Las rutas y sus guards se declaran en `app.routes.ts` y en los archivos `*.routes.ts` de cada rol o proceso.

La app usa el formato colombiano (`LOCALE_ID` = `es-CO` en `app.config.ts`) para fechas y números.

## Pruebas

| Comando | Descripción |
|---------|-------------|
| `npm test` | Pruebas unitarias (Jasmine/Karma) |
| `npm run test:usabilidad` | Pruebas con cobertura |
| `npm run test:seguridad` | Solo pruebas de seguridad |
| `npm run test:accesibilidad` | Solo pruebas de accesibilidad |
| `npm run test:e2e` | E2E con Cypress (headless) |
| `npm run test:e2e:open` | E2E con interfaz gráfica |
| `npm run test:usabilidad:e2e` | E2E de usabilidad |
| `npm run test:seguridad:e2e` | E2E de seguridad |
| `npm run test:seguridad-accesibilidad` | Seguridad + accesibilidad |
| `npm run test:reporte` | Genera reporte de usabilidad en `reporte-usabilidad.md` |
| `npm run test:navegacion` | Recorre las pantallas de los 6 roles en el navegador (Edge/Chrome headless) con `ng serve` en marcha. Con `SIN_BACKEND=1` simula la sesión (prueba rutas y guards, no datos). Variables: `APP_URL`, `PASS`, `NAVEGADOR` |
| `npm run lint` | ESLint (angular-eslint) |

Cobertura: `coverage/front-end-gestion-curricular/index.html`. Con `--code-coverage` la ejecución falla si la cobertura baja de los mínimos de `karma.conf.js` (`coverageReporter.check`).

Antes de subir cambios: `npx tsc -p tsconfig.app.json --noEmit`, `npx tsc -p tsconfig.spec.json --noEmit`, `npm run lint`, `npx ng build` y `npx ng test --watch=false`.

`npm install` configura el gancho de pre-commit con Husky. Al hacer commit, lint-staged ejecuta ESLint sobre los archivos TypeScript y HTML de `src/` preparados en Git.

## Configuración

La API usa por defecto `http://localhost:5000/api`. Si el backend corre en otra URL, editar `src/environments/environment.ts` (desarrollo) y `environment.production.ts` (producción).

El backend (repositorio Back-end-gestion-curricular, Spring Boot con MySQL) escucha en el puerto 5000. Iniciar sesión: `POST /api/usuarios/login` con `{ correo, password }`; el token JWT se guarda en `localStorage` y lo añade el interceptor JWT.

## Roles

- **ADMIN** - Usuarios y configuración
- **ESTUDIANTE** - Solicitudes y consultas
- **COORDINADOR** - Aprobación y estadísticas
- **FUNCIONARIO** - Gestión de procesos
- **SECRETARIA** - Validación de documentos
- **DECANO** - Módulo estadístico e historial completo (solo consulta)

## Build de producción

```bash
ng build --configuration production
```

Salida en `dist/front-end-gestion-curricular/browser/`

---

Universidad del Cauca - Facultad de Ingeniería Electrónica y Telecomunicaciones
