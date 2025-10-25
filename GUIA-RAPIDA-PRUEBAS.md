# ⚡ Guía Rápida de Ejecución de Pruebas

> **Para la documentación completa**, ver: `DOCUMENTACION-COMPLETA-PRUEBAS.md`

---

## 🚀 Comandos Principales

### 1. Todas las Pruebas + Cobertura
```bash
npm run test:usabilidad
start coverage\front-end-gestion-curricular\index.html
```
- **Resultado**: 505 pruebas, reporte HTML con cobertura

---

### 2. Solo Seguridad (128 pruebas)
```bash
npm run test:seguridad
```
- JWT, Guards, Validación de inputs, Sesiones
- **Tiempo**: ~30 segundos

---

### 3. Solo Accesibilidad (90 pruebas)
```bash
# Unitarias (55 pruebas)
npm run test:accesibilidad

# E2E Interactivo (35 pruebas)
npm run test:accesibilidad:e2e:open
```
- WCAG 2.1 Level AA, Navegación por teclado, Formularios

---

### 4. Seguridad + Accesibilidad (218 pruebas)
```bash
npm run test:seguridad-accesibilidad
```
- **Tiempo**: ~2 minutos

---

### 5. E2E Completas (Interactivo)
```bash
npm run test:e2e:open
```
- Abre Cypress en modo visual
- Click en cualquier archivo `.cy.ts` para ver la prueba

---

## 📊 Ver Cobertura

```bash
# 1. Ejecutar pruebas
npm run test:usabilidad

# 2. Abrir reporte
start coverage\front-end-gestion-curricular\index.html
```

### Qué buscar:
- ✅ `app/core/guards`: **100%** (Seguridad)
- ✅ `app/core/interceptors`: **96%** (JWT)
- ✅ `app/core/enums`: **100%**

---

## 🎓 Para Capturas de Tesis

### Captura 1: Terminal con todas las pruebas
```bash
npm run test:usabilidad
```
**Mostrar**: "505 TOTAL, X SUCCESS"

### Captura 2: Cobertura de módulos críticos
```bash
start coverage\front-end-gestion-curricular\index.html
```
**Mostrar**: Guards 100%, Interceptors 96%

### Captura 3: Pruebas de seguridad
```bash
npm run test:seguridad
```
**Mostrar**: "128 SUCCESS"

### Captura 4: Cypress interactivo
```bash
npm run test:e2e:open
```
**Mostrar**: Ejecución visual de login o paz y salvo

---

## ⏱️ Tiempos de Ejecución

| Comando | Pruebas | Tiempo |
|---------|---------|--------|
| `test:seguridad` | 128 | ~30s |
| `test:accesibilidad` | 55 | ~20s |
| `test:usabilidad` | 505 | ~2min |
| `test:e2e` (headless) | 20 | ~1min |

---

## 🆘 Solución de Problemas

### Error: "Cannot start Chrome"
```bash
# Instalar Chrome si no lo tienes
```

### Error: "port 4200 already in use"
```bash
# Detener servidor anterior
Ctrl + C
```

### Ver solo tests que fallaron
```bash
npm run test:usabilidad -- --include='**/*[nombre-test]*'
```

---

## 📞 Comandos Útiles

```bash
# Ver todos los comandos disponibles
npm run

# Limpiar caché
npm run clean

# Reinstalar dependencias
npm install
```

---

**Documentación completa**: `DOCUMENTACION-COMPLETA-PRUEBAS.md`
