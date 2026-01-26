# PROMPT: Mejorar Sección de Documentación y Validación de Archivos en Homologación

## CONTEXTO

Se requiere mejorar la sección de documentación requerida y la validación de archivos en el proceso de **Homologación de Asignaturas** para que sea visualmente consistente con el proceso de **Paz y Salvo**, manteniendo la uniformidad del diseño del sistema.

---

## OBJETIVOS

1. **Uniformidad Visual**: Hacer que la sección de documentación de Homologación se vea similar a la de Paz y Salvo
2. **Componentes Reutilizables**: Usar componentes generales cuando sea posible
3. **Validación Informativa**: Agregar mensaje informativo en "Subir Archivos" que indique documentos faltantes, pero **sin bloquear el envío** (solo como guía)
4. **No Afectar Paz y Salvo**: Revisar el proceso de Paz y Salvo solo como referencia, **NO modificar** su funcionamiento

---

## REQUERIMIENTOS ESPECÍFICOS

### 1. Actualizar Lista de Documentos Requeridos

**Ubicación:** `src/app/pages/estudiante/homologacion-asignaturas/homologacion-asignaturas.component.ts`

**Cambios:**
- Actualizar el array `documentosRequeridos` con los siguientes documentos:

```typescript
documentosRequeridos = [
  { label: 'PM-FO-4-FOR-22 Solicitud homologación de materias', obligatorio: true },
  { label: 'Certificado de notas', obligatorio: true },
  { label: 'Programa académico de la materia', obligatorio: false }
];
```

**Nota:** El tercer documento es opcional (obligatorio: false).

---

### 2. Mejorar Visualización de Documentación Requerida

**Ubicación:** `src/app/pages/estudiante/homologacion-asignaturas/homologacion-asignaturas.component.html`

**Objetivo:** Hacer que la sección de documentación se vea similar a la de Paz y Salvo.

**Referencia:** Revisar `src/app/pages/estudiante/paz-salvo/paz-salvo.component.html` (líneas 1-11) y el componente `app-required-docs`.

**Cambios a realizar:**

1. **Asegurar que se use el componente `app-required-docs`** (ya está en uso, verificar que esté correctamente configurado)

2. **Verificar que el componente reciba los parámetros correctos:**
   - `[requiredFiles]="documentosRequeridos"` ✅
   - `[exclusiveFiles]="archivosExclusivos"` ✅ (si aplica)
   - `[archivos]="archivosActuales"` ✅
   - `[programaEstudiante]="usuario?.objPrograma?.nombre || ''"` ✅

3. **El componente `app-required-docs` ya tiene el texto introductorio:**
   - "Debes subir los siguientes documentos necesarios en formato PDF. Todos los formatos deben estar debidamente diligenciados y firmados:"
   - Este texto debe aparecer también en Homologación para mantener consistencia visual

**Nota:** El componente `required-docs` tiene lógica específica para Paz y Salvo (usando `[esPazYSalvo]="true"`). Para Homologación, NO se debe pasar este parámetro o debe ser `false`, para que no muestre las notas específicas de Paz y Salvo.

---

### 3. Agregar Mensaje Informativo de Documentos Faltantes

**Ubicación:** `src/app/pages/estudiante/homologacion-asignaturas/homologacion-asignaturas.component.html`

**Sección:** Dentro de la sección "Subir Archivos", antes del botón "Enviar Solicitud"

**Referencia:** Revisar `src/app/pages/estudiante/paz-salvo/paz-salvo.component.html` (líneas 89-101)

**Diferencia Importante:** 
- En Paz y Salvo, el mensaje aparece cuando `!puedeEnviar() && archivosActuales.length > 0` y **bloquea el envío**
- En Homologación, el mensaje debe aparecer cuando falten documentos pero **NO debe bloquear el envío** (solo informativo)

**Implementación:**

1. **Agregar método en el componente TypeScript** (`homologacion-asignaturas.component.ts`):

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
    'pmfo4for22': ['pmfo4for22', 'pm-fo-4-for-22', 'solicitud', 'homologacion', 'homologación'],
    'certificado': ['certificado', 'notas', 'calificaciones', 'notas academicas'],
    'programa': ['programa', 'academico', 'materia', 'asignatura', 'syllabus']
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

3. **Agregar estilos CSS** para el mensaje informativo (`homologacion-asignaturas.component.css`):

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

**Ubicación:** `src/app/pages/estudiante/homologacion-asignaturas/homologacion-asignaturas.component.ts`

**Verificar:** El método `puedeEnviar()` actual solo verifica:
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

## REFERENCIAS Y ARCHIVOS A REVISAR (NO MODIFICAR)

### Archivos de Paz y Salvo (solo para referencia visual):
- `src/app/pages/estudiante/paz-salvo/paz-salvo.component.html` (líneas 1-11, 89-101)
- `src/app/pages/estudiante/paz-salvo/paz-salvo.component.ts` (métodos `obtenerDocumentosFaltantes()`, `archivoSubido()`, `normalizarNombre()`)
- `src/app/pages/estudiante/paz-salvo/paz-salvo.component.css` (estilos `.validacion-mensaje`, `.documentos-faltantes`)

### Componente Reutilizable:
- `src/app/shared/components/required-docs/required-docs.component.ts`
- `src/app/shared/components/required-docs/required-docs.component.html`
- `src/app/shared/components/required-docs/required-docs.component.css`

**Nota:** El componente `required-docs` ya tiene la estructura visual correcta. Solo asegurarse de que se use correctamente en Homologación.

---

## ARCHIVOS A MODIFICAR

1. ✅ `src/app/pages/estudiante/homologacion-asignaturas/homologacion-asignaturas.component.ts`
   - Actualizar `documentosRequeridos`
   - Agregar métodos: `obtenerDocumentosFaltantes()`, `archivoSubido()`, `normalizarNombre()`, `coincidenciaFuzzy()`

2. ✅ `src/app/pages/estudiante/homologacion-asignaturas/homologacion-asignaturas.component.html`
   - Verificar uso correcto de `app-required-docs`
   - Agregar mensaje informativo de documentos faltantes

3. ✅ `src/app/pages/estudiante/homologacion-asignaturas/homologacion-asignaturas.component.css`
   - Agregar estilos para `.validacion-mensaje-informativo`, `.mensaje-guia`, `.documentos-faltantes`

---

## CONSIDERACIONES IMPORTANTES

1. **NO modificar Paz y Salvo**: Solo usar como referencia visual y de lógica, pero NO hacer cambios en ese proceso.

2. **Validación Flexible**: La detección de documentos debe ser flexible porque los usuarios pueden subir archivos con nombres ligeramente diferentes. Por eso se usa `coincidenciaFuzzy()`.

3. **Mensaje Informativo**: El mensaje es solo una guía visual. El estudiante puede enviar la solicitud incluso si faltan documentos detectados.

4. **Consistencia Visual**: El diseño debe ser similar a Paz y Salvo pero con colores diferentes (azul para info vs amarillo para warning) para indicar que es informativo.

5. **Componente Reutilizable**: Si es posible, usar el componente `app-required-docs` que ya existe, en lugar de crear uno nuevo.

---

## RESULTADO ESPERADO

Al finalizar, el formulario de Homologación debe:

- ✅ Mostrar la lista de documentos requeridos con el mismo estilo visual que Paz y Salvo
- ✅ Mostrar un mensaje informativo (azul) cuando falten documentos, pero sin bloquear el envío
- ✅ Permitir enviar la solicitud incluso si no se detectan todos los documentos
- ✅ Mantener consistencia visual con el resto del sistema
- ✅ NO afectar el funcionamiento de Paz y Salvo

---

## NOTAS ADICIONALES

- Los nombres de archivos pueden variar ligeramente (ej: "PM-FO-4-FOR-22.pdf" vs "pmfo4for22.pdf" vs "Solicitud Homologacion.pdf")
- La validación debe ser flexible y tolerante a variaciones en los nombres
- El mensaje debe ser claro: es una guía, no un bloqueo
- Si el componente `required-docs` necesita ajustes para Homologación, hacerlos de forma que NO afecten Paz y Salvo
