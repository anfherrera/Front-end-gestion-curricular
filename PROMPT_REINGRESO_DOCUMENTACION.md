# PROMPT: Mejorar Sección de Documentación y Validación de Archivos en Reingreso de Estudiante

## CONTEXTO

Se requiere mejorar la sección de documentación requerida y la validación de archivos en el proceso de **Reingreso de Estudiante** para que sea visualmente consistente con los procesos de **Paz y Salvo** y **Homologación**, manteniendo la uniformidad del diseño del sistema.

---

## OBJETIVOS

1. **Uniformidad Visual**: Mantener la sección de documentación con el mismo estilo visual que Paz y Salvo y Homologación
2. **Componentes Reutilizables**: Usar componentes generales cuando sea posible
3. **Validación Informativa**: Agregar mensaje informativo en "Subir Archivos" que indique documentos faltantes, pero **sin bloquear el envío** (solo como guía)
4. **No Afectar Otros Procesos**: Revisar los procesos de Paz y Salvo y Homologación solo como referencia, **NO modificar** su funcionamiento

---

## REQUERIMIENTOS ESPECÍFICOS

### 1. Verificar Lista de Documentos Requeridos

**Ubicación:** `src/app/pages/estudiante/reingreso-estudiante/reingreso-estudiante.component.ts`

**Estado Actual:** La lista ya está actualizada correctamente:
```typescript
documentosRequeridos = [
  { label: 'PM-FO-4-FOR-17 Solicitud de Reingreso V2', obligatorio: true },
  { label: 'Certificado de notas', obligatorio: true },
  { label: 'Documento de identidad', obligatorio: true },
  { label: 'Carta de motivación', obligatorio: false }
];
```

**Acción:** Verificar que la lista esté correcta. No requiere cambios.

---

### 2. Verificar Visualización de Documentación Requerida

**Ubicación:** `src/app/pages/estudiante/reingreso-estudiante/reingreso-estudiante.component.html`

**Estado Actual:** El componente `app-required-docs` ya está en uso.

**Verificar que el componente reciba los parámetros correctos:**
- `[requiredFiles]="documentosRequeridos"` ✅
- `[archivos]="archivosActuales"` ✅
- `[programaEstudiante]="usuario?.objPrograma?.nombre || ''"` ✅

**Nota:** El componente `required-docs` tiene lógica específica para Paz y Salvo (usando `[esPazYSalvo]="true"`). Para Reingreso, NO se debe pasar este parámetro o debe ser `false`, para que no muestre las notas específicas de Paz y Salvo.

**Acción:** Verificar que el componente esté correctamente configurado. No requiere cambios si ya está bien configurado.

---

### 3. Agregar Mensaje Informativo de Documentos Faltantes

**Ubicación:** `src/app/pages/estudiante/reingreso-estudiante/reingreso-estudiante.component.html`

**Sección:** Dentro de la sección "Subir Archivos", antes del botón "Enviar Solicitud"

**Referencia:** Revisar `src/app/pages/estudiante/homologacion-asignaturas/homologacion-asignaturas.component.html` (líneas 56-75) para ver la implementación similar.

**Diferencia Importante:** 
- En Paz y Salvo, el mensaje aparece cuando `!puedeEnviar() && archivosActuales.length > 0` y **bloquea el envío**
- En Reingreso (similar a Homologación), el mensaje debe aparecer cuando falten documentos pero **NO debe bloquear el envío** (solo informativo)

**Implementación:**

1. **Agregar método en el componente TypeScript** (`reingreso-estudiante.component.ts`):

```typescript
/**
 * Obtener lista de documentos faltantes (solo informativo, no bloquea envío)
 * @returns Array con nombres de documentos que no se han subido
 */
obtenerDocumentosFaltantes(): string[] {
  const faltantes: string[] = [];
  
  // Obtener documentos obligatorios
  const documentosObligatorios = this.documentosRequeridos.filter(doc => doc.obligatorio);
  
  // Verificar cada documento obligatorio
  documentosObligatorios.forEach(doc => {
    if (!this.archivoSubido(doc.label)) {
      faltantes.push(doc.label);
    }
  });
  
  return faltantes;
}

/**
 * Verificar si un archivo ha sido subido basándose en el nombre del documento
 * @param nombreDocumento Nombre del documento requerido
 * @returns true si el archivo fue subido, false en caso contrario
 */
private archivoSubido(nombreDocumento: string): boolean {
  const nombreNormalizado = this.normalizarNombre(nombreDocumento);
  return this.archivosActuales.some(archivo => {
    const nombreArchivo = this.normalizarNombre(archivo.nombre);
    // Buscar coincidencias parciales (por si el nombre del archivo es ligeramente diferente)
    return nombreArchivo.includes(nombreNormalizado) || 
           nombreNormalizado.includes(nombreArchivo) ||
           this.coincidenciaFuzzy(nombreArchivo, nombreNormalizado);
  });
}

/**
 * Normalizar nombre de archivo para comparación
 * @param nombre Nombre a normalizar
 * @returns Nombre normalizado (sin acentos, minúsculas, sin espacios ni caracteres especiales)
 */
private normalizarNombre(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/\.[^/.]+$/, '') // Eliminar extensión
    .replace(/[^a-z0-9]/g, ''); // Eliminar caracteres especiales y espacios
}

/**
 * Verificar coincidencia aproximada entre nombres (fuzzy matching)
 * Útil para detectar archivos con nombres ligeramente diferentes
 * @param nombre1 Primer nombre
 * @param nombre2 Segundo nombre
 * @returns true si hay coincidencia aproximada
 */
private coincidenciaFuzzy(nombre1: string, nombre2: string): boolean {
  // Palabras clave comunes para cada tipo de documento
  const palabrasClave: { [key: string]: string[] } = {
    'pmfo4for17': ['pmfo4for17', 'pm-fo-4-for-17', 'solicitud', 'reingreso', 'reingreso v2'],
    'certificado': ['certificado', 'notas', 'calificaciones', 'notas academicas'],
    'documento': ['documento', 'identidad', 'cedula', 'cédula', 'tarjeta', 'identidad'],
    'carta': ['carta', 'motivacion', 'motivación', 'motivo']
  };
  
  // Buscar palabras clave en ambos nombres
  for (const [clave, palabras] of Object.entries(palabrasClave)) {
    if (nombre1.includes(clave) || nombre2.includes(clave)) {
      return palabras.some(palabra => 
        nombre1.includes(palabra) && nombre2.includes(palabra)
      );
    }
  }
  
  return false;
}
```

**Nota:** Estos métodos son similares a los implementados en Homologación, pero adaptados para los documentos específicos de Reingreso.

2. **Agregar el mensaje en el HTML** (dentro de la sección "Subir Archivos"):

```html
<div class="enviar-solicitud mt-4">
  <!-- Mensaje informativo de documentos faltantes (NO bloquea el envío) -->
  <div *ngIf="obtenerDocumentosFaltantes().length > 0 && archivosActuales.length > 0" 
       class="validacion-mensaje-informativo">
    <mat-icon color="primary">info</mat-icon>
    <span>
      <strong>Documentos sugeridos (no obligatorios):</strong>
      <p class="mensaje-guia">
        Los siguientes documentos aún no se han detectado en los archivos subidos. 
        Puedes enviar la solicitud de todas formas, pero asegúrate de haber subido todos los documentos requeridos.
        <strong>Nota:</strong> Si los archivos tienen nombres ligeramente diferentes, el sistema puede no detectarlos automáticamente.
      </p>
      <ul class="documentos-faltantes">
        <li *ngFor="let doc of obtenerDocumentosFaltantes()">{{ doc }}</li>
      </ul>
    </span>
  </div>
  
  <button mat-raised-button color="primary"
          class="btn-enviar"
          [disabled]="!puedeEnviar()"
          (click)="onSolicitudEnviada()">
    Enviar Solicitud
  </button>
</div>
```

3. **Agregar estilos CSS** para el mensaje informativo (`reingreso-estudiante.component.css`):

**Nota:** Primero verificar si el archivo CSS existe y si tiene estilos similares. Si no existe, crearlo. Si existe, agregar los estilos al final.

```css
/* Mensaje informativo de documentos faltantes (solo guía, no bloquea) */
.validacion-mensaje-informativo {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  margin-bottom: 16px;
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
  border-radius: 8px;
  color: #1565c0;
}

.validacion-mensaje-informativo mat-icon {
  margin-top: 2px;
  color: #2196f3;
}

.validacion-mensaje-informativo strong {
  display: block;
  margin-bottom: 8px;
  color: #1565c0;
}

.mensaje-guia {
  margin: 8px 0;
  font-size: 13px;
  line-height: 1.5;
}

.mensaje-guia strong {
  display: inline;
  font-weight: 600;
}

.documentos-faltantes {
  margin: 8px 0 0 0;
  padding-left: 20px;
  list-style-type: disc;
}

.documentos-faltantes li {
  margin-bottom: 4px;
  font-size: 13px;
}
```

**Características del mensaje:**
- Color azul (info) en lugar de amarillo (warning) para indicar que es informativo, no un error
- Icono `info` en lugar de `warning`
- Texto claro indicando que es solo una guía
- NO afecta la capacidad de enviar la solicitud (el botón no se deshabilita por esto)

---

### 4. Asegurar que `puedeEnviar()` NO se vea afectado

**Ubicación:** `src/app/pages/estudiante/reingreso-estudiante/reingreso-estudiante.component.ts`

**Estado Actual:** El método `puedeEnviar()` actual solo verifica:
- Que haya usuario
- Que haya al menos un archivo subido

**IMPORTANTE:** NO debe validar que todos los documentos requeridos estén presentes. El método debe mantenerse simple:

```typescript
puedeEnviar(): boolean {
  return this.archivosActuales.length > 0 && !!this.usuario;
}
```

**NO agregar validaciones adicionales** que bloqueen el envío basándose en los nombres de los documentos.

---

### 5. Limpiar Código Obsoleto (Opcional)

**Ubicación:** `src/app/pages/estudiante/reingreso-estudiante/reingreso-estudiante.component.ts`

**Verificar:** Si existe la línea:
```typescript
private readonly nombresDocumentosRequeridos = this.documentosRequeridos.map(doc => doc.label.toLowerCase().trim());
```

**Acción:** Si esta línea no se está usando en ningún lugar del código, puede eliminarse ya que los nuevos métodos (`normalizarNombre()`, `archivoSubido()`, etc.) manejan la normalización de nombres de forma más robusta.

---

## REFERENCIAS Y ARCHIVOS A REVISAR (NO MODIFICAR)

### Archivos de Homologación (solo para referencia):
- `src/app/pages/estudiante/homologacion-asignaturas/homologacion-asignaturas.component.ts` (métodos `obtenerDocumentosFaltantes()`, `archivoSubido()`, `normalizarNombre()`, `coincidenciaFuzzy()`)
- `src/app/pages/estudiante/homologacion-asignaturas/homologacion-asignaturas.component.html` (líneas 56-75, mensaje informativo)
- `src/app/pages/estudiante/homologacion-asignaturas/homologacion-asignaturas.component.css` (estilos `.validacion-mensaje-informativo`, `.mensaje-guia`, `.documentos-faltantes`)

### Archivos de Paz y Salvo (solo para referencia visual):
- `src/app/pages/estudiante/paz-salvo/paz-salvo.component.html` (líneas 1-11, estructura de documentación)
- `src/app/pages/estudiante/paz-salvo/paz-salvo.component.css` (estilos generales)

### Componente Reutilizable:
- `src/app/shared/components/required-docs/required-docs.component.ts`
- `src/app/shared/components/required-docs/required-docs.component.html`
- `src/app/shared/components/required-docs/required-docs.component.css`

**Nota:** El componente `required-docs` ya tiene la estructura visual correcta. Solo asegurarse de que se use correctamente en Reingreso.

---

## ARCHIVOS A MODIFICAR

1. ✅ `src/app/pages/estudiante/reingreso-estudiante/reingreso-estudiante.component.ts`
   - Agregar métodos: `obtenerDocumentosFaltantes()`, `archivoSubido()`, `normalizarNombre()`, `coincidenciaFuzzy()`
   - (Opcional) Eliminar línea obsoleta `nombresDocumentosRequeridos` si no se usa

2. ✅ `src/app/pages/estudiante/reingreso-estudiante/reingreso-estudiante.component.html`
   - Verificar uso correcto de `app-required-docs`
   - Agregar mensaje informativo de documentos faltantes

3. ✅ `src/app/pages/estudiante/reingreso-estudiante/reingreso-estudiante.component.css`
   - Agregar estilos para `.validacion-mensaje-informativo`, `.mensaje-guia`, `.documentos-faltantes`
   - Si el archivo no existe, crearlo con los estilos necesarios

---

## CONSIDERACIONES IMPORTANTES

1. **NO modificar otros procesos**: Solo usar Homologación y Paz y Salvo como referencia visual y de lógica, pero NO hacer cambios en esos procesos.

2. **Validación Flexible**: La detección de documentos debe ser flexible porque los usuarios pueden subir archivos con nombres ligeramente diferentes. Por eso se usa `coincidenciaFuzzy()`.

3. **Mensaje Informativo**: El mensaje es solo una guía visual. El estudiante puede enviar la solicitud incluso si faltan documentos detectados.

4. **Consistencia Visual**: El diseño debe ser similar a Homologación y Paz y Salvo pero con colores diferentes (azul para info vs amarillo para warning) para indicar que es informativo.

5. **Componente Reutilizable**: El componente `app-required-docs` ya está en uso. Solo asegurarse de que esté correctamente configurado.

6. **Palabras Clave Específicas**: Las palabras clave en `coincidenciaFuzzy()` deben ser específicas para los documentos de Reingreso:
   - PM-FO-4-FOR-17: 'pmfo4for17', 'pm-fo-4-for-17', 'solicitud', 'reingreso', 'reingreso v2'
   - Certificado de notas: 'certificado', 'notas', 'calificaciones', 'notas academicas'
   - Documento de identidad: 'documento', 'identidad', 'cedula', 'cédula', 'tarjeta', 'identidad'
   - Carta de motivación: 'carta', 'motivacion', 'motivación', 'motivo'

---

## RESULTADO ESPERADO

Al finalizar, el formulario de Reingreso debe:

- ✅ Mostrar la lista de documentos requeridos con el mismo estilo visual que Paz y Salvo y Homologación
- ✅ Mostrar un mensaje informativo (azul) cuando falten documentos, pero sin bloquear el envío
- ✅ Permitir enviar la solicitud incluso si no se detectan todos los documentos
- ✅ Mantener consistencia visual con el resto del sistema
- ✅ NO afectar el funcionamiento de Paz y Salvo ni Homologación

---

## NOTAS ADICIONALES

- Los nombres de archivos pueden variar ligeramente (ej: "PM-FO-4-FOR-17.pdf" vs "pmfo4for17.pdf" vs "Solicitud Reingreso.pdf")
- La validación debe ser flexible y tolerante a variaciones en los nombres
- El mensaje debe ser claro: es una guía, no un bloqueo
- Si el componente `required-docs` necesita ajustes para Reingreso, hacerlos de forma que NO afecten Paz y Salvo ni Homologación
- La implementación debe ser similar a Homologación para mantener consistencia en el código
