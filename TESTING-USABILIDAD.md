# 🧪 Guía de Pruebas de Usabilidad

## Sistema de Gestión Académica - FIET
**Propuesta 2**: Paz y Salvo, Cursos Intersemestrales y Módulo Estadístico

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Requisitos Previos](#requisitos-previos)
3. [Instalación](#instalación)
4. [Estructura de Pruebas](#estructura-de-pruebas)
5. [Ejecución de Pruebas](#ejecución-de-pruebas)
6. [Interpretación de Resultados](#interpretación-de-resultados)
7. [Métricas Evaluadas](#métricas-evaluadas)
8. [Troubleshooting](#troubleshooting)

---

## 📖 Descripción General

Este proyecto incluye un **conjunto completo de pruebas de usabilidad** que validan:

- ✅ **Visibilidad** de elementos de la interfaz
- ✅ **Accesibilidad** de formularios y controles
- ✅ **Validación** de campos y datos
- ✅ **Mensajes** de feedback (éxito, error, advertencia)
- ✅ **Navegación** entre pantallas
- ✅ **Rendimiento** y tiempos de respuesta
- ✅ **Interactividad** con el usuario

### Módulos Cubiertos

1. **GPA4 - Paz y Salvo Académico**
   - Subida de documentos
   - Envío de solicitudes
   - Seguimiento de estados
   - Descarga de oficios

2. **GCV5 - Cursos Intersemestrales**
   - Consulta de cursos disponibles
   - Solicitud de inscripción
   - Preinscripción
   - Seguimiento de solicitudes

3. **ME6 - Módulo Estadístico**
   - Dashboard general
   - Estadísticas de cursos de verano
   - Gráficos interactivos
   - Filtros y exportación

---

## 🔧 Requisitos Previos

### Software Necesario

- **Node.js**: v18 o superior
- **npm**: v9 o superior
- **Angular CLI**: v19 o superior
- **Google Chrome**: Última versión (para Cypress)

### Verificar Instalación

\`\`\`bash
node --version   # Debe mostrar v18+
npm --version    # Debe mostrar v9+
ng version       # Debe mostrar Angular CLI 19+
\`\`\`

---

## 📦 Instalación

### 1. Clonar el Repositorio

\`\`\`bash
git clone <url-del-repositorio>
cd Front-end-gestion-curricular
\`\`\`

### 2. Instalar Dependencias

\`\`\`bash
npm install
\`\`\`

Esto instalará automáticamente:
- Jasmine y Karma (pruebas unitarias)
- Cypress (pruebas E2E)
- Todas las dependencias de Angular

### 3. Verificar Configuración

\`\`\`bash
# Verificar que Cypress esté instalado
npx cypress --version

# Verificar que Karma esté configurado
ng test --help
\`\`\`

---

## 📁 Estructura de Pruebas

\`\`\`
proyecto/
│
├── src/app/
│   └── pages/
│       ├── estudiante/
│       │   ├── paz-salvo/
│       │   │   └── paz-salvo.component.spec.ts          [20 pruebas unitarias]
│       │   └── cursos-intersemestrales/
│       │       └── cursos-intersemestrales.component.spec.ts [20 pruebas unitarias]
│       └── coordinador/
│           └── modulo-estadistico/
│               └── modulo-estadistico.component.spec.ts [26 pruebas unitarias]
│
├── cypress/
│   ├── e2e/
│   │   ├── 01-login.cy.ts                               [12 pruebas E2E]
│   │   ├── 02-paz-salvo.cy.ts                          [15 pruebas E2E]
│   │   ├── 03-cursos-intersemestrales.cy.ts            [20 pruebas E2E]
│   │   └── 04-modulo-estadistico.cy.ts                 [25 pruebas E2E]
│   │
│   ├── support/
│   │   ├── commands.ts         # Comandos personalizados
│   │   └── e2e.ts              # Configuración y métricas
│   │
│   └── cypress.config.ts       # Configuración de Cypress
│
├── scripts/
│   └── generar-reporte-usabilidad.js  # Script de reporte
│
└── reporte-usabilidad.md       # Reporte generado (después de ejecutar)
\`\`\`

**Total**: 138 pruebas (66 unitarias + 72 E2E)

---

## 🚀 Ejecución de Pruebas

### Opción 1: Pruebas Unitarias (Jasmine/Karma)

#### Ejecutar todas las pruebas unitarias:

\`\`\`bash
npm run test:usabilidad
\`\`\`

**Qué hace**:
- Ejecuta todas las pruebas \`.spec.ts\`
- Genera reporte de cobertura
- Se ejecuta en modo headless (sin interfaz gráfica)
- Resultados en consola y carpeta \`coverage/\`

#### Ejecutar en modo desarrollo (watch):

\`\`\`bash
npm run test
\`\`\`

**Qué hace**:
- Ejecuta pruebas y se mantiene escuchando cambios
- Abre navegador con resultados en vivo
- Ideal para desarrollo y debugging

### Opción 2: Pruebas E2E (Cypress)

#### Ejecutar en modo headless (CI/CD):

\`\`\`bash
npm run test:e2e
\`\`\`

**Qué hace**:
- Ejecuta todas las pruebas \`.cy.ts\`
- Graba videos de cada suite
- Captura screenshots en fallos
- Resultados en \`cypress/videos/\` y \`cypress/screenshots/\`

#### Ejecutar en modo interactivo (desarrollo):

\`\`\`bash
npm run test:e2e:open
\`\`\`

**Qué hace**:
- Abre interfaz gráfica de Cypress
- Permite seleccionar pruebas específicas
- Ejecuta con recarga automática
- Depuración paso a paso

### Opción 3: Ejecutar Todo

\`\`\`bash
npm run test:all
\`\`\`

**Qué hace**:
- Ejecuta primero las pruebas unitarias
- Luego ejecuta las pruebas E2E
- Proceso completo de validación

### Opción 4: Generar Reporte

\`\`\`bash
npm run test:reporte
\`\`\`

**Qué hace**:
- Genera \`reporte-usabilidad.md\` en la raíz
- Consolida resultados de todas las pruebas
- Incluye métricas, casos exitosos y mejoras

---

## 📊 Interpretación de Resultados

### Pruebas Unitarias (Karma)

#### Salida de Consola:

\`\`\`
Chrome Headless 120.0.0.0 (Windows 10): Executed 66 of 66 SUCCESS (2.345 secs / 2.123 secs)
TOTAL: 66 SUCCESS

📊 REPORTE DE MÉTRICAS DE USABILIDAD - PAZ Y SALVO
════════════════════════════════════════════════════════════
✅ Elementos visibles verificados: 15
✏️  Elementos editables verificados: 4
🎯 Interacciones exitosas: 12
✓  Validaciones correctas: 18
⏱️  Tiempo promedio de respuesta: 125.45ms
⏱️  Tiempo máximo: 350.20ms
⏱️  Tiempo mínimo: 45.10ms
════════════════════════════════════════════════════════════
\`\`\`

#### Indicadores:

- ✅ **SUCCESS**: Prueba pasó correctamente
- ❌ **FAILED**: Prueba falló (revisar logs)
- ⚠️  **SKIPPED**: Prueba omitida (intencional)

### Pruebas E2E (Cypress)

#### Salida de Consola:

\`\`\`
  E2E-01: Flujo de Login y Autenticación
    ✓ E2E-L-001: Debe mostrar el formulario de login completo (1234ms)
    ✓ E2E-L-002: El logo de la universidad debe estar visible (456ms)
    ...

  15 passing (12s)

📊 MÉTRICAS - FLUJO DE LOGIN
══════════════════════════════════════════════════
✅ Elementos verificados: 8
🎯 Interacciones exitosas: 12
⏱️  Mediciones realizadas: 5
⏱️  Tiempo promedio: 1245.67ms
══════════════════════════════════════════════════
\`\`\`

#### Archivos Generados:

- **Videos**: \`cypress/videos/\` - Grabación de cada suite
- **Screenshots**: \`cypress/screenshots/\` - Capturas en fallos
- **Reports**: Consola con métricas detalladas

---

## 📈 Métricas Evaluadas

### 1. Visibilidad de Elementos

**Qué se mide**:
- ¿Los elementos clave son visibles?
- ¿Están dentro del viewport?
- ¿Se muestran sin necesidad de scroll?

**Umbrales**:
- ✅ Bueno: 90-100% de elementos visibles
- ⚠️ Aceptable: 70-89%
- ❌ Malo: < 70%

### 2. Tiempos de Respuesta

**Qué se mide**:
- Tiempo de carga inicial
- Tiempo de interacción (click → respuesta)
- Tiempo de navegación entre páginas

**Umbrales**:
- ✅ Excelente: < 1000ms
- ⚠️ Aceptable: 1000-3000ms
- ❌ Lento: > 3000ms

### 3. Validaciones de Formularios

**Qué se mide**:
- ¿Las validaciones funcionan en tiempo real?
- ¿Los mensajes de error son claros?
- ¿Los botones se habilitan/deshabilitan correctamente?

**Criterios**:
- ✅ Validación en blur y submit
- ✅ Mensajes descriptivos
- ✅ Estado visual del botón acorde a validez

### 4. Mensajes y Feedback

**Qué se mide**:
- Aparición de mensajes de éxito/error
- Duración apropiada de notificaciones
- Claridad del texto

**Criterios**:
- ✅ Mensajes aparecen en < 500ms
- ✅ Duración: 3-6 segundos
- ✅ Texto específico y accionable

### 5. Navegación

**Qué se mide**:
- Enlaces funcionan correctamente
- No hay errores 404
- La ruta actual se refleja en la URL

**Criterios**:
- ✅ 100% de enlaces funcionales
- ✅ Navegación fluida sin parpadeos
- ✅ Breadcrumbs o indicadores visuales

---

## 🐛 Troubleshooting

### Problema: "Cypress no está instalado"

**Solución**:
\`\`\`bash
npm install --save-dev cypress
npx cypress install
\`\`\`

### Problema: "Karma no encuentra Chrome"

**Solución**:
\`\`\`bash
# Instalar ChromeHeadless
npm install --save-dev karma-chrome-launcher

# O usar Firefox
npm install --save-dev karma-firefox-launcher
\`\`\`

Luego editar \`karma.conf.js\`:
\`\`\`javascript
browsers: ['ChromeHeadless'] // o 'Firefox'
\`\`\`

### Problema: "Timeout en pruebas E2E"

**Solución**:

Aumentar timeouts en \`cypress.config.ts\`:
\`\`\`typescript
defaultCommandTimeout: 15000, // 15 segundos
requestTimeout: 15000,
\`\`\`

### Problema: "Backend no responde en pruebas E2E"

**Solución**:

Las pruebas E2E usan **mocks** de las respuestas del backend. No necesitas el backend corriendo. Si aún así quieres probarlo con el backend real:

1. Inicia el backend: \`java -jar backend.jar\`
2. Comenta los \`cy.intercept()\` en los archivos \`.cy.ts\`
3. Ejecuta: \`npm run test:e2e\`

### Problema: "Errores de linting en archivos de prueba"

**Solución**:

Los archivos de prueba pueden tener configuraciones de linting más permisivas. Ignora warnings no críticos o ajusta \`.eslintrc.json\`:

\`\`\`json
{
  "overrides": [
    {
      "files": ["*.spec.ts", "*.cy.ts"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
}
\`\`\`

---

## 📚 Recursos Adicionales

### Documentación Oficial

- [Angular Testing](https://angular.io/guide/testing)
- [Jasmine Documentation](https://jasmine.github.io/)
- [Karma Configuration](https://karma-runner.github.io/latest/config/configuration-file.html)
- [Cypress Docs](https://docs.cypress.io/)

### Mejores Prácticas

- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Angular Testing Best Practices](https://angular.io/guide/testing#best-practices)
- [Web Accessibility (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)

### Videos y Tutoriales

- [Cypress Tutorial - freeCodeCamp](https://www.youtube.com/watch?v=u8vMu7viCm8)
- [Angular Testing - Academind](https://www.youtube.com/watch?v=BumgayeUC08)

---

## 🎯 Checklist de Ejecución

Antes de entregar tu trabajo de grado, asegúrate de:

- [ ] Ejecutar \`npm run test:usabilidad\` → 100% de pruebas unitarias pasan
- [ ] Ejecutar \`npm run test:e2e\` → 100% de pruebas E2E pasan
- [ ] Generar reporte: \`npm run test:reporte\`
- [ ] Revisar \`reporte-usabilidad.md\` y verificar métricas
- [ ] Documentar hallazgos y mejoras en la monografía
- [ ] Incluir screenshots de resultados de pruebas
- [ ] Archivar videos de Cypress en entrega final

---

## 👥 Contacto y Soporte

**Desarrollador**: Estudiante de Trabajo de Grado  
**Institución**: Universidad del Cauca - FIET  
**Programa**: Ingeniería Electrónica y Telecomunicaciones

Para dudas sobre las pruebas:
- Revisa la documentación en este archivo
- Consulta los comentarios en los archivos \`.spec.ts\` y \`.cy.ts\`
- Revisa los logs de consola durante la ejecución

---

**🎉 ¡Buena suerte con tus pruebas!**

