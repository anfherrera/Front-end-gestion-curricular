# PROMPT: Agregar Información de la Solicitud en Sección "Documentación Adjunta" - Vista Funcionario ECAES

## CONTEXTO

En la vista de funcionario de ECAES, específicamente en la sección "Pre-Registros Pendientes", cuando se selecciona una solicitud, se despliega la sección "Documentación Adjunta" que actualmente solo muestra la lista de documentos.

Se requiere agregar una sección de **información de la solicitud** justo antes de listar los documentos, mostrando información específica almacenada en la solicitud ECAES: `fecha_expedicion`, `fecha_nacimiento`, `numero_documento`, y `tipoDocumento`.

---

## OBJETIVO

Agregar una sección de información de la solicitud en la sección "Documentación Adjunta" que muestre los datos específicos de la solicitud ECAES seleccionada, antes de mostrar la lista de documentos.

---

## REQUERIMIENTOS ESPECÍFICOS

### 1. Información a Mostrar

**Campos a mostrar (obtenidos de `selectedSolicitud`):**
- `tipoDocumento` - Tipo de documento (CC o CE)
- `numero_documento` - Número de documento
- `fecha_expedicion` - Fecha de expedición del documento
- `fecha_nacimiento` - Fecha de nacimiento

**Ubicación de los datos:**
- Estos campos están disponibles en `selectedSolicitud` que es de tipo `SolicitudEcaesResponse`
- La solicitud se obtiene cuando el usuario selecciona una solicitud en "Pre-Registros Pendientes"
- El método `onSolicitudSeleccionada()` carga la solicitud completa en `selectedSolicitud`

---

### 2. Ubicación en el HTML

**Ubicación:** `src/app/pages/funcionario/pruebas-ecaes/pruebas-ecaes.component.html`

**Sección:** Dentro de la sección "Documentación Adjunta" (líneas 149-164), **antes** del componente `app-documentation-viewer`.

**Referencia Visual:** Revisar `src/app/pages/common/detalle-solicitud/detalle-solicitud.component.html` (líneas 31-76) para ver cómo se muestra información similar en formato de card con grid.

---

### 3. Implementación en HTML

**Agregar la siguiente sección antes de `<app-documentation-viewer>`:**

```html
<!-- 📌 Tercera Sección: Documentación Adjunta -->
<app-card-container
  *ngIf="selectedSolicitud"
  title="Documentación Adjunta"
  icon="description">

  <!-- Información de la Solicitud ECAES -->
  <mat-card class="info-card" style="margin-bottom: 24px;">
    <mat-card-header>
      <mat-card-title>
        <mat-icon>info</mat-icon>
        Información de la Solicitud
      </mat-card-title>
    </mat-card-header>
    <mat-card-content>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Tipo de Documento:</span>
          <span class="info-value">{{ obtenerTipoDocumentoLabel(selectedSolicitud.tipoDocumento) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Número de Documento:</span>
          <span class="info-value">{{ selectedSolicitud.numero_documento || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Fecha de Expedición:</span>
          <span class="info-value">{{ formatearFechaCorta(selectedSolicitud.fecha_expedicion) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Fecha de Nacimiento:</span>
          <span class="info-value">{{ formatearFechaCorta(selectedSolicitud.fecha_nacimiento) }}</span>
        </div>
      </div>
    </mat-card-content>
  </mat-card>

  <app-documentation-viewer
    [documentos]="selectedSolicitud.documentos || []"
    [solicitudId]="selectedSolicitud.id_solicitud"
    [proceso]="'ecaes'"
    [servicio]="pruebasEcaesService"
    [puedeAgregarComentarios]="true"
    (comentarioAgregado)="onComentarioAgregado($event)">
  </app-documentation-viewer>

</app-card-container>
```

**Nota:** El `mat-card` debe estar dentro del `app-card-container`, antes del `app-documentation-viewer`.

---

### 4. Métodos Requeridos en TypeScript

**Ubicación:** `src/app/pages/funcionario/pruebas-ecaes/pruebas-ecaes.component.ts`

**Agregar los siguientes métodos:**

```typescript
/**
 * Formatear fecha en formato corto (DD/MM/YYYY)
 * @param fecha Fecha en formato string o Date
 * @returns Fecha formateada o '-' si no hay fecha
 */
formatearFechaCorta(fecha: string | Date | null | undefined): string {
  if (!fecha) return '-';
  
  try {
    const date = new Date(fecha);
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    this.logger.warn('Error al formatear fecha:', fecha, error);
    return '-';
  }
}

/**
 * Obtener el label descriptivo del tipo de documento
 * @param tipoDocumento Código del tipo de documento (CC, CE, etc.)
 * @returns Label descriptivo del tipo de documento
 */
obtenerTipoDocumentoLabel(tipoDocumento: string | null | undefined): string {
  if (!tipoDocumento) return '-';
  
  const tipos: { [key: string]: string } = {
    'CC': 'Cédula de Ciudadanía',
    'CE': 'Cédula de Extranjería',
    'TI': 'Tarjeta de Identidad',
    'PA': 'Pasaporte',
    'RC': 'Registro Civil'
  };
  
  return tipos[tipoDocumento.toUpperCase()] || tipoDocumento;
}
```

---

### 5. Imports Requeridos

**Ubicación:** `src/app/pages/funcionario/pruebas-ecaes/pruebas-ecaes.component.ts`

**Verificar que estén importados:**
- `MatCardModule` - Para usar `mat-card`
- `MatIconModule` - Para usar `mat-icon` (ya está importado)

**Si `MatCardModule` no está importado, agregarlo:**

```typescript
import { MatCardModule } from '@angular/material/card';

// En el decorador @Component, agregar a imports:
imports: [
  // ... otros imports existentes
  MatCardModule,
  // ... resto de imports
]
```

---

### 6. Estilos CSS

**Ubicación:** `src/app/pages/funcionario/pruebas-ecaes/pruebas-ecaes.component.css`

**Agregar los siguientes estilos** (similar a los del componente `detalle-solicitud`):

```css
/* Información de la solicitud */
.info-card {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  margin-bottom: 24px;
}

.info-card mat-card-header {
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 8px 8px 0 0;
}

.info-card mat-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.info-card mat-card-title mat-icon {
  color: #00138C;
}

.info-card mat-card-content {
  padding: 24px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-weight: 600;
  color: #666;
  font-size: 0.9rem;
}

.info-value {
  color: #333;
  font-size: 1rem;
}

/* Responsive para info-grid */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## ARCHIVOS A MODIFICAR

1. ✅ `src/app/pages/funcionario/pruebas-ecaes/pruebas-ecaes.component.html`
   - Agregar sección de información de la solicitud antes del `app-documentation-viewer`

2. ✅ `src/app/pages/funcionario/pruebas-ecaes/pruebas-ecaes.component.ts`
   - Agregar método `formatearFechaCorta()`
   - Agregar método `obtenerTipoDocumentoLabel()`
   - Verificar/agregar import de `MatCardModule`

3. ✅ `src/app/pages/funcionario/pruebas-ecaes/pruebas-ecaes.component.css`
   - Agregar estilos para `.info-card`, `.info-grid`, `.info-item`, `.info-label`, `.info-value`

---

## CONSIDERACIONES IMPORTANTES

1. **Datos Disponibles**: La información está disponible en `selectedSolicitud` que se carga cuando el usuario selecciona una solicitud en "Pre-Registros Pendientes".

2. **Formato de Fechas**: Las fechas vienen del backend en formato string (probablemente ISO o YYYY-MM-DD). El método `formatearFechaCorta()` las convierte al formato DD/MM/YYYY para mostrar.

3. **Tipo de Documento**: El campo `tipoDocumento` viene como código (CC, CE, etc.). El método `obtenerTipoDocumentoLabel()` convierte el código a un label descriptivo.

4. **Manejo de Valores Nulos**: Los métodos deben manejar valores nulos o undefined, mostrando '-' en lugar de errores.

5. **Consistencia Visual**: El diseño debe ser consistente con otras secciones de información del sistema (como en `detalle-solicitud`).

6. **Responsive**: El grid debe adaptarse a pantallas pequeñas, mostrando una columna en dispositivos móviles.

7. **Ubicación**: La información debe aparecer **dentro** del mismo `app-card-container` de "Documentación Adjunta", pero **antes** del componente `app-documentation-viewer`.

---

## RESULTADO ESPERADO

Al seleccionar una solicitud en "Pre-Registros Pendientes", la sección "Documentación Adjunta" debe:

- ✅ Mostrar una card con el título "Información de la Solicitud" con icono `info`
- ✅ Mostrar un grid con 4 campos:
  - Tipo de Documento: "Cédula de Ciudadanía" o "Cédula de Extranjería" (según el código)
  - Número de Documento: El número de documento de la solicitud
  - Fecha de Expedición: Fecha formateada (DD/MM/YYYY)
  - Fecha de Nacimiento: Fecha formateada (DD/MM/YYYY)
- ✅ Mostrar la lista de documentos debajo de la información
- ✅ Mantener consistencia visual con el resto del sistema
- ✅ Ser responsive (adaptarse a pantallas pequeñas)

---

## NOTAS ADICIONALES

- **Estructura de Datos**: Los datos están en `selectedSolicitud.tipoDocumento`, `selectedSolicitud.numero_documento`, `selectedSolicitud.fecha_expedicion`, y `selectedSolicitud.fecha_nacimiento`.

- **Formato de Fechas**: Las fechas pueden venir en diferentes formatos del backend. El método `formatearFechaCorta()` debe manejar esto correctamente.

- **Tipo de Documento**: Aunque el backend solo acepta CC y CE, el método `obtenerTipoDocumentoLabel()` incluye otros tipos por si acaso hay datos antiguos o diferentes.

- **Card dentro de Card**: El `mat-card` con la información está dentro del `app-card-container`. Esto es correcto y mantiene la estructura visual consistente.

- **Referencia**: Revisar `src/app/pages/common/detalle-solicitud/detalle-solicitud.component.html` y `.css` para ver ejemplos similares de cómo mostrar información en formato de grid.

---

## REFERENCIAS

- **Componente:** `PruebasEcaesFuncionarioComponent`
- **Variable:** `selectedSolicitud` (tipo `SolicitudEcaesResponse`)
- **Campos a mostrar:** `tipoDocumento`, `numero_documento`, `fecha_expedicion`, `fecha_nacimiento`
- **Referencia Visual:** `src/app/pages/common/detalle-solicitud/detalle-solicitud.component.html` (líneas 31-76)
- **Estilos de Referencia:** `src/app/pages/common/detalle-solicitud/detalle-solicitud.component.css` (clases `.info-card`, `.info-grid`, `.info-item`)
