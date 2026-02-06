# Sistema de Gestión Curricular - Universidad del Cauca

Aplicación web para gestión de procesos académicos: Paz y Salvo, Cursos Intersemestrales y Módulo Estadístico.

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
| `npm run test:seguridad-accesibilidad` | Seguridad + accesibilidad |

Cobertura generada en `coverage/front-end-gestion-curricular/index.html`

## Documentación

- `docs/USABILIDAD-SUSTENTACION.md` - Pruebas de usabilidad y comandos
- `docs/SEGURIDAD-SUSTENTACION.md` - Pruebas de seguridad y comandos

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
