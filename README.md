# 🎓 Sistema de Gestión Curricular - Universidad del Cauca

Sistema web para gestión de procesos académicos administrativos.

## 📋 Módulos Principales

1. **Paz y Salvo** - Solicitud y aprobación de documentos académicos
2. **Cursos Intersemestrales** - Gestión de cursos de verano
3. **Módulo Estadístico** - Dashboard y análisis de datos

---

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js 18+
- npm 9+
- Angular CLI 19+

### Instalación
```bash
npm install
```

### Servidor de Desarrollo
```bash
ng serve
```
Navegar a `http://localhost:4200/`

---

## 🧪 Pruebas (505 pruebas totales)

### Ejecutar Todas las Pruebas + Cobertura
```bash
npm run test:usabilidad
start coverage\front-end-gestion-curricular\index.html
```

### Solo Seguridad (128 pruebas)
```bash
npm run test:seguridad
```

### Solo Accesibilidad (90 pruebas)
```bash
npm run test:accesibilidad
npm run test:accesibilidad:e2e:open
```

### E2E Interactivo
```bash
npm run test:e2e:open
```

**📚 Documentación completa**: Ver `DOCUMENTACION-COMPLETA-PRUEBAS.md`

---

## 📊 Resumen de Pruebas

| Tipo | Cantidad | Cobertura |
|------|----------|-----------|
| Unitarias | 175 | Servicios y componentes core |
| Integración | 8 | Interacción entre módulos |
| Funcionales (E2E) | 20 | Flujos completos de usuario |
| Aceptación (BDD) | 21 | Historias de usuario |
| Usabilidad | 63 | Experiencia de usuario |
| 🔒 **Seguridad** | **128** | **OWASP Top 10** |
| ♿ **Accesibilidad** | **90** | **WCAG 2.1 AA** |
| **TOTAL** | **505** | ✅ **100% éxito** |

---

## 🔒 Seguridad

- ✅ JWT con validación de expiración
- ✅ Guards basados en roles (5 roles)
- ✅ Prevención de XSS y SQL Injection
- ✅ Manejo seguro de sesiones
- ✅ Logout automático por inactividad (30 min)

**Estándar**: OWASP Top 10

---

## ♿ Accesibilidad

- ✅ WCAG 2.1 Level AA
- ✅ Navegación por teclado completa
- ✅ ARIA attributes en formularios
- ✅ Contraste de colores 4.5:1
- ✅ Responsive (móvil, tablet, desktop)

**Herramientas**: axe-core, Cypress

---

## 🏗️ Arquitectura

```
src/
├── app/
│   ├── core/           # Servicios, guards, interceptors
│   ├── pages/          # Módulos de páginas
│   │   ├── admin/
│   │   ├── coordinador/
│   │   ├── estudiante/
│   │   ├── funcionario/
│   │   └── secretaria/
│   ├── shared/         # Componentes reutilizables
│   └── layout/         # Header, sidebar, footer
├── assets/
└── environments/
```

---

## 🛠️ Tecnologías

### Frontend
- **Angular 16+** - Framework principal
- **Angular Material** - UI components
- **RxJS** - Programación reactiva
- **TypeScript** - Tipado estático

### Testing
- **Jasmine + Karma** - Pruebas unitarias
- **Cypress** - Pruebas E2E
- **axe-core** - Accesibilidad
- **Istanbul** - Cobertura de código

### Seguridad
- **JWT** - Autenticación
- **Guards** - Control de acceso
- **DomSanitizer** - Prevención XSS

---

## 📦 Scripts Disponibles

### Desarrollo
```bash
npm start                # Servidor de desarrollo
npm run build           # Build de producción
npm run watch           # Build en modo watch
```

### Pruebas
```bash
npm test                                    # Todas las pruebas
npm run test:usabilidad                     # Con cobertura
npm run test:seguridad                      # Solo seguridad
npm run test:accesibilidad                  # Solo accesibilidad
npm run test:e2e                            # E2E headless
npm run test:e2e:open                       # E2E interactivo
npm run test:seguridad-accesibilidad        # Seguridad + Accesibilidad
```

---

## 📚 Documentación

| Archivo | Descripción |
|---------|-------------|
| `DOCUMENTACION-COMPLETA-PRUEBAS.md` | 📖 Documentación técnica completa |
| `GUIA-RAPIDA-PRUEBAS.md` | ⚡ Guía rápida de comandos |
| `reporte-usabilidad.md` | 📊 Reporte final de pruebas |

---

## 👥 Roles del Sistema

1. **ADMIN** - Gestión de usuarios y configuración
2. **ESTUDIANTE** - Solicitudes y consultas
3. **COORDINADOR** - Aprobación y estadísticas
4. **FUNCIONARIO** - Gestión de procesos
5. **SECRETARIA** - Validación de documentos

---

## 🎯 Cobertura de Código

### Módulos Críticos (100%)
- `app/core/guards` - **100%**
- `app/core/interceptors` - **96.15%**
- `app/core/enums` - **100%**

### Servicios Principales (75-90%)
- `paz-salvo.service` - 85%
- `cursos-intersemestrales.service` - 80%
- `estadisticas.service` - 90%
- `auth.service` - 75%

**Ver reporte completo**: `coverage/front-end-gestion-curricular/index.html`

---

## 🚀 Despliegue

### Build de Producción
```bash
ng build --configuration production
```

Los artefactos se generan en `dist/front-end-gestion-curricular/browser/`

### Variables de Entorno
- `src/environments/environment.ts` - Desarrollo
- `src/environments/environment.production.ts` - Producción

---

## 📞 Soporte

Para más información sobre Angular CLI:
- [Angular CLI Reference](https://angular.dev/tools/cli)
- [Angular Documentation](https://angular.dev/)

---

## ✅ Estado del Proyecto

- [x] 505 pruebas implementadas
- [x] Seguridad (OWASP Top 10)
- [x] Accesibilidad (WCAG 2.1 AA)
- [x] Cobertura de código > 90% en módulos críticos
- [x] Documentación completa
- [x] CI/CD ready

**Estado**: ✅ **COMPLETO Y VALIDADO**

---

**Universidad del Cauca** - Facultad de Ingeniería Electrónica y Telecomunicaciones  
**Proyecto de Grado** - Octubre 2025
