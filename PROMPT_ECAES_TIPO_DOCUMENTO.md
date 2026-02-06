# PROMPT: Actualizar Desplegable de Tipo de Documento en Solicitudes ECAES

## CONTEXTO

En la sección de creación de solicitudes ECAES (como estudiante), específicamente en la sección de "Documentación Adjunta", existe un desplegable para seleccionar el tipo de documento. Actualmente, este desplegable tiene valores que **no coinciden con los valores aceptados por el backend**, lo que genera errores al enviar la solicitud.

---

## PROBLEMA ACTUAL

**Ubicación:** `src/app/pages/estudiante/pruebas-ecaes/pruebas-ecaes.component.ts`

El componente tiene un método `cargarTiposDocumentoFallback()` que se ejecuta cuando el backend no está disponible o cuando falla la carga de tipos de documento. Este método contiene valores hardcodeados que incluyen opciones que el backend no acepta.

**Valores actuales en el fallback (incorrectos):**
- `CC` - Cédula de Ciudadanía ✅ (aceptado por backend)
- `TI` - Tarjeta de Identidad ❌ (NO aceptado por backend)
- `CE` - Cédula de Extranjería ✅ (aceptado por backend)
- `PA` - Pasaporte ❌ (NO aceptado por backend)
- (Posiblemente más valores)

**Valores que el backend acepta (según enum/entidad):**
- `CC` - Cédula de Ciudadanía
- `CE` - Cédula de Extranjería

**Solo estos dos valores son válidos.**

---

## OBJETIVO

Actualizar el desplegable de tipo de documento para que **solo muestre los valores que el backend acepta** (`CC` y `CE`), evitando así errores al enviar solicitudes.

---

## REQUERIMIENTOS ESPECÍFICOS

### 1. Actualizar Método Fallback

**Ubicación:** `src/app/pages/estudiante/pruebas-ecaes/pruebas-ecaes.component.ts`

**Método a modificar:** `cargarTiposDocumentoFallback()`

**Cambio requerido:**

Actualizar el array `tiposDocumento` en el método fallback para que solo contenga los dos valores aceptados por el backend:

```typescript
/**
 * Fallback con tipos de documento hardcodeados si el backend no está disponible
 */
private cargarTiposDocumentoFallback(): void {
  this.tiposDocumento = [
    { value: 'CC', label: 'Cédula de Ciudadanía' },
    { value: 'CE', label: 'Cédula de Extranjería' }
  ];
  this.logger.warn('⚠️ Usando tipos de documento fallback (solo CC y CE)');
}
```

**Eliminar:**
- `TI` - Tarjeta de Identidad
- `PA` - Pasaporte
- Cualquier otro valor que no sea `CC` o `CE`

---

### 2. Verificar Endpoint del Backend

**Ubicación:** `src/app/pages/estudiante/pruebas-ecaes/pruebas-ecaes.component.ts`

**Método a verificar:** `cargarTiposDocumento()`

**Acción:** Verificar que el endpoint `/tipos-documento/todos` del backend esté devolviendo solo los valores `CC` y `CE`. Si el backend está devolviendo más valores, esto también causará problemas.

**Recomendación:** Agregar un filtro para asegurar que solo se usen los valores válidos, incluso si el backend devuelve más:

```typescript
/**
 * Carga los tipos de documento disponibles desde el backend
 */
cargarTiposDocumento(): void {
  this.http.get<any>(`${environment.apiUrl}/tipos-documento/todos`).pipe(
    takeUntil(this.destroy$)
  ).subscribe({
    next: (response) => {
      if (response.success && response.data) {
        // Filtrar solo los valores aceptados por el backend (CC y CE)
        const valoresValidos = ['CC', 'CE'];
        this.tiposDocumento = response.data
          .filter((tipo: any) => valoresValidos.includes(tipo.codigo))
          .map((tipo: any) => ({
            value: tipo.codigo,
            label: tipo.descripcion
          }));
        
        // Si después del filtro no hay valores, usar fallback
        if (this.tiposDocumento.length === 0) {
          this.logger.warn('⚠️ El backend no devolvió valores válidos (CC o CE), usando fallback');
          this.cargarTiposDocumentoFallback();
        } else {
          this.logger.log('📄 Tipos de documento cargados desde backend (filtrados):', this.tiposDocumento);
        }
      } else {
        this.cargarTiposDocumentoFallback();
      }
    },
    error: (error) => {
      this.logger.error('❌ Error al cargar tipos de documento:', error);
      this.cargarTiposDocumentoFallback();
    }
  });
}
```

---

### 3. Verificar Valor por Defecto del Formulario

**Ubicación:** `src/app/pages/estudiante/pruebas-ecaes/pruebas-ecaes.component.ts`

**En el constructor, verificar:**

El formulario ya tiene un valor por defecto:
```typescript
tipoDocumento: ['CC', Validators.required]
```

**Acción:** Verificar que este valor por defecto (`'CC'`) sea correcto y esté dentro de los valores válidos. Si es necesario, mantenerlo como está ya que `CC` es uno de los valores aceptados.

---

### 4. Validación Adicional (Opcional pero Recomendada)

**Ubicación:** `src/app/pages/estudiante/pruebas-ecaes/pruebas-ecaes.component.ts`

**Agregar validador personalizado** para asegurar que solo se acepten valores `CC` o `CE`:

```typescript
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Agregar este método en la clase
/**
 * Validador personalizado para tipo de documento
 * Solo acepta CC (Cédula de Ciudadanía) o CE (Cédula de Extranjería)
 */
private tipoDocumentoValido(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    const valoresValidos = ['CC', 'CE'];
    
    if (!valor) {
      return null; // El validador required ya maneja esto
    }
    
    if (!valoresValidos.includes(valor)) {
      return { tipoDocumentoInvalido: true };
    }
    
    return null;
  };
}
```

**Actualizar el FormBuilder en el constructor:**

```typescript
this.solicitudForm = this.fb.group({
  tipoDocumento: ['CC', [Validators.required, this.tipoDocumentoValido()]],
  numero_documento: ['', [Validators.required, Validators.minLength(6)]],
  fecha_expedicion: ['', Validators.required],
  fecha_nacimiento: ['', Validators.required]
});
```

**Agregar mensaje de error en el HTML:**

```html
<mat-form-field appearance="outline" class="form-field">
  <mat-label>Tipo de Documento</mat-label>
  <mat-select formControlName="tipoDocumento">
    <mat-option *ngFor="let tipo of tiposDocumento" [value]="tipo.value">
      {{ tipo.label }}
    </mat-option>
  </mat-select>
  <mat-error *ngIf="esCampoInvalido('tipoDocumento')">
    {{ obtenerMensajeError('tipoDocumento') }}
  </mat-error>
  <mat-error *ngIf="solicitudForm.get('tipoDocumento')?.hasError('tipoDocumentoInvalido')">
    Solo se aceptan Cédula de Ciudadanía (CC) o Cédula de Extranjería (CE)
  </mat-error>
</mat-form-field>
```

---

## ARCHIVOS A MODIFICAR

1. ✅ `src/app/pages/estudiante/pruebas-ecaes/pruebas-ecaes.component.ts`
   - Actualizar método `cargarTiposDocumentoFallback()` para solo incluir CC y CE
   - (Opcional) Actualizar método `cargarTiposDocumento()` para filtrar valores del backend
   - (Opcional) Agregar validador personalizado `tipoDocumentoValido()`
   - Actualizar FormBuilder para incluir el validador personalizado

2. ✅ `src/app/pages/estudiante/pruebas-ecaes/pruebas-ecaes.component.html`
   - (Opcional) Agregar mensaje de error para el validador personalizado

---

## CONSIDERACIONES IMPORTANTES

1. **Compatibilidad con Backend**: Asegurar que los valores enviados al backend sean exactamente `"CC"` o `"CE"` (en mayúsculas, como strings).

2. **Experiencia de Usuario**: Si el backend devuelve más valores de los esperados, el filtro asegurará que solo se muestren los válidos, evitando confusión.

3. **Fallback Robusto**: El método fallback debe ser una red de seguridad que siempre funcione, incluso si el backend no está disponible.

4. **Validación en Múltiples Capas**: 
   - Filtro en la carga de datos (backend/fallback)
   - Validador en el formulario (opcional pero recomendado)
   - Esto asegura que nunca se envíe un valor inválido

5. **Logging**: Mantener los logs existentes para facilitar el debugging si hay problemas.

---

## RESULTADO ESPERADO

Al finalizar, el desplegable de tipo de documento debe:

- ✅ Mostrar solo dos opciones: "Cédula de Ciudadanía (CC)" y "Cédula de Extranjería (CE)"
- ✅ No generar errores al enviar la solicitud al backend
- ✅ Funcionar correctamente tanto si el backend está disponible como si no (fallback)
- ✅ Validar que solo se seleccionen valores válidos (si se implementa el validador personalizado)
- ✅ Mantener el valor por defecto como "CC" (Cédula de Ciudadanía)

---

## NOTAS ADICIONALES

- **Valores del Backend**: El backend solo acepta `"CC"` y `"CE"` como strings en mayúsculas.
- **Orden de las Opciones**: Se recomienda mantener el orden: primero CC (Cédula de Ciudadanía) y luego CE (Cédula de Extranjería), ya que CC es el más común.
- **Testing**: Después de implementar, probar:
  1. Cargar la página con backend disponible (debe mostrar solo CC y CE)
  2. Cargar la página sin backend (fallback debe mostrar solo CC y CE)
  3. Intentar enviar una solicitud con CC (debe funcionar)
  4. Intentar enviar una solicitud con CE (debe funcionar)
  5. Si se implementa el validador, intentar manipular el valor del formulario para verificar que rechace valores inválidos

---

## REFERENCIAS

- **Endpoint del Backend:** `${environment.apiUrl}/tipos-documento/todos`
- **Valores Aceptados:** `CC` (Cédula de Ciudadanía) y `CE` (Cédula de Extranjería)
- **Campo en el Formulario:** `tipoDocumento` (FormControl)
- **Valor por Defecto:** `'CC'`
