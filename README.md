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
├── core/           Servicios, guards, interceptors
├── pages/          Módulos por rol (admin, coordinador, estudiante, funcionario, secretaria)
├── shared/         Componentes reutilizables
└── layout/         Header, sidebar, footer
```

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

Cobertura: `coverage/front-end-gestion-curricular/index.html`

## Configuración

La API usa por defecto `http://localhost:5000/api`. Si el backend corre en otra URL, editar `src/environments/environment.ts` (desarrollo) y `environment.production.ts` (producción).

Para usar proxy hacia el backend: `npm run start:proxy` (requiere `proxy.conf.json`).

## Roles

- **ADMIN** - Usuarios y configuración
- **ESTUDIANTE** - Solicitudes y consultas
- **COORDINADOR** - Aprobación y estadísticas
- **FUNCIONARIO** - Gestión de procesos
- **SECRETARIA** - Validación de documentos

## Build de producción

```bash
ng build --configuration production
```

Salida en `dist/front-end-gestion-curricular/browser/`

---

Universidad del Cauca - Facultad de Ingeniería Electrónica y Telecomunicaciones
