# Pruebas Jasmine (unitarias) y Cypress (E2E) – Guía y sustento

## 1. Qué son y para qué sirven

| Tipo | Herramienta | Qué prueba | Cuándo se ejecuta |
|------|-------------|------------|-------------------|
| **Unitarias** | Jasmine + Karma | Lógica de componentes y servicios en aislamiento (mocks de dependencias). | `ng test` |
| **E2E** | Cypress | Flujo completo en el navegador: login, rutas, formularios, APIs (con intercept). | `npm run test:e2e` |

**No se “conectan” entre sí**: son dos capas distintas. Las unitarias aseguran que cada pieza (servicio, componente) se comporta bien; las E2E aseguran que el sistema completo funciona para el usuario.

---

## 2. Cómo se relacionan en este proyecto

- **Jasmine (unitarias)**  
  - Servicios: `pruebas-ecaes.service.spec.ts`, `homologacion-asignaturas.service.spec.ts`, `reingreso-estudiante.service.spec.ts`, `paz-salvo.service.spec.ts`, etc.  
  - Componentes: por ejemplo `pruebas-ecaes.component.spec.ts`, `reingreso-estudiante.component.spec.ts`, componentes de homologación (coordinador, funcionario, secretaria), `paz-salvo.component.spec.ts`.  
  - Verifican: creación del servicio/componente, llamadas HTTP (método, URL, body), transformación de datos, validación de formularios, mensajes al usuario (snackbar), etc.

- **Cypress (E2E)**  
  - Especificaciones en `cypress/e2e/`: `05-reingreso-estudiante.cy.ts`, `06-homologacion-asignaturas.cy.ts`, `07-pruebas-ecaes.cy.ts`, más login, paz y salvo, cursos, módulo estadístico.  
  - Verifican: navegación por rol, visualización de secciones, envío de solicitudes (con intercept de API), mensajes de éxito/error, listados, etc.

Para **sustentar** tu trabajo puedes decir:  
*“Las pruebas unitarias (Jasmine) validan la lógica de los servicios y componentes de Reingreso, Homologación y ECAES sin depender del backend. Las pruebas E2E (Cypress) validan los flujos completos que ve el usuario en el navegador, con APIs mockeadas.”*

---

## 3. Cómo ejecutar las pruebas

### Pruebas unitarias (Jasmine / Karma)

```bash
# Todas las pruebas unitarias (abre navegador y deja en modo watch)
npm run test

# Una sola ejecución con cobertura (sin watch)
npm run test:usabilidad

# Solo pruebas de seguridad
npm run test:seguridad

# Solo pruebas de accesibilidad (Jasmine)
npm run test:accesibilidad
```

Para ejecutar solo los specs de **tus** módulos (Reingreso, Homologación, ECAES):

```bash
# Solo ECAES (servicio + componente estudiante)
ng test --include='**/pruebas-ecaes/**/*.spec.ts' --watch=false

# Solo Homologación (servicio + componentes por rol)
ng test --include='**/homologacion*/**/*.spec.ts' --watch=false

# Solo Reingreso (servicio + componentes por rol)
ng test --include='**/reingreso*/**/*.spec.ts' --watch=false

# Los tres módulos (Propuesta 1)
ng test --include='**/pruebas-ecaes/**/*.spec.ts' --include='**/homologacion*/**/*.spec.ts' --include='**/reingreso*/**/*.spec.ts' --watch=false
```

(En Windows PowerShell puede ser necesario ajustar las comillas según el shell.)

### Pruebas E2E (Cypress)

```bash
# Ejecutar todas las E2E en modo headless
npm run test:e2e

# Abrir Cypress (modo interactivo)
npm run test:e2e:open
```

Para ejecutar solo los E2E de tus flujos:

```bash
# Solo Reingreso, Homologación y ECAES
npx cypress run --spec "cypress/e2e/05-reingreso-estudiante.cy.ts,cypress/e2e/06-homologacion-asignaturas.cy.ts,cypress/e2e/07-pruebas-ecaes.cy.ts"
```

**Requisito:** la app debe estar levantada (por ejemplo `ng serve`) en la URL configurada en Cypress (por defecto `http://localhost:4200`).

---

## 4. Resumen para memoria o informe

Puedes redactar algo así:

- **Pruebas unitarias (Jasmine):**  
  Se implementaron pruebas unitarias para los servicios y componentes de los módulos Reingreso de Estudiante, Homologación de Asignaturas y Pruebas ECAES. Las pruebas mockean las dependencias (servicios HTTP, diálogos, snackbar) y comprueban la creación de componentes, las llamadas a los endpoints correctos, la transformación de datos y el comportamiento ante validaciones y errores. Se ejecutan con `ng test` (Karma + Jasmine).

- **Pruebas E2E (Cypress):**  
  Las pruebas end-to-end cubren los flujos de Reingreso, Homologación y ECAES por rol (estudiante, funcionario, coordinador, secretaría donde aplica). Se usa interceptación de APIs para no depender del backend y se verifican la navegación, la visualización de secciones, el envío de solicitudes y los mensajes al usuario. Se ejecutan con `npm run test:e2e` (Cypress).

- **Relación:**  
  Las pruebas unitarias y las E2E son complementarias: las primeras dan confianza en la lógica de cada pieza; las segundas dan confianza en que el sistema integrado se comporta correctamente desde la perspectiva del usuario.

---

## 5. Estructura de archivos de prueba (referencia)

```
src/app/
├── core/services/
│   ├── pruebas-ecaes.service.spec.ts       # ECAES – servicio
│   ├── homologacion-asignaturas.service.spec.ts
│   ├── reingreso-estudiante.service.spec.ts
│   └── paz-salvo.service.spec.ts           # (compañero)
├── pages/
│   ├── estudiante/
│   │   ├── pruebas-ecaes/pruebas-ecaes.component.spec.ts
│   │   └── reingreso-estudiante/reingreso-estudiante.component.spec.ts
│   ├── coordinador/homologacion-asignaturas/homologacion-asignaturas.component.spec.ts
│   ├── funcionario/homologacion-asignaturas/homologacion-asignaturas.component.spec.ts
│   └── secretaria/homologacion-asignaturas/homologacion-asignaturas.component.spec.ts

cypress/e2e/
├── 05-reingreso-estudiante.cy.ts
├── 06-homologacion-asignaturas.cy.ts
└── 07-pruebas-ecaes.cy.ts
```

Este documento sirve como guía de ejecución y como base para explicar o sustentar las pruebas en documento de trabajo de grado o informe.
