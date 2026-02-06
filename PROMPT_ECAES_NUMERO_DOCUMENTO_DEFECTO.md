# PROMPT: Establecer Valor por Defecto en Campo "Número de Documento" - Solicitudes ECAES

## CONTEXTO

En la sección de creación de solicitudes ECAES (como estudiante), específicamente en la sección de "Documentación Adjunta", existe un campo de texto para el "Número de Documento". Actualmente, este campo está vacío y requiere que el usuario ingrese manualmente su número de documento.

Se requiere que este campo tenga un **valor por defecto** que sea automáticamente el valor del atributo `cedula` del usuario logueado, mejorando así la experiencia del usuario al evitar que tenga que escribir manualmente su número de documento.

---

## OBJETIVO

Establecer el valor por defecto del campo "Número de Documento" con el valor del atributo `cedula` del usuario logueado, cargándolo automáticamente cuando el componente se inicializa.

---

## REQUERIMIENTOS ESPECÍFICOS

### 1. Actualizar el FormBuilder en el Constructor

**Ubicación:** `src/app/pages/estudiante/pruebas-ecaes/pruebas-ecaes.component.ts`

**Estado Actual:**
El campo `numero_documento` se inicializa con un string vacío:
```typescript
numero_documento: ['', [Validators.required, Validators.minLength(6)]]
```

**Cambio Requerido:**

El valor por defecto debe establecerse después de que el usuario se cargue desde localStorage. Sin embargo, como el usuario se carga en `ngOnInit()` y el formulario se crea en el constructor, hay dos opciones:

**Opción 1 (Recomendada):** Establecer el valor en `ngOnInit()` después de cargar el usuario:

```typescript
ngOnInit(): void {
  // Recuperamos usuario del localStorage
  const usuarioLS = localStorage.getItem('usuario');
  if (usuarioLS) {
    this.usuario = JSON.parse(usuarioLS);
    this.logger.log('👤 Usuario cargado desde localStorage:', this.usuario);
    
    // Establecer valor por defecto del número de documento
    const cedulaUsuario = this.usuario.cedula || this.usuario.codigo || '';
    if (cedulaUsuario) {
      this.solicitudForm.patchValue({
        numero_documento: cedulaUsuario
      });
      this.logger.log('📝 Número de documento establecido por defecto:', cedulaUsuario);
    }
  } else {
    this.logger.warn('⚠️ No se encontró usuario en localStorage');
  }

  this.cargarTiposDocumento();
  this.cargarFechasEcaes();
  this.listarSolicitudes();
}
```

**Opción 2 (Alternativa):** Si se prefiere establecerlo en el constructor, se puede intentar obtener el usuario directamente:

```typescript
constructor(...) {
  // Intentar obtener usuario del localStorage en el constructor
  const usuarioLS = localStorage.getItem('usuario');
  let cedulaPorDefecto = '';
  
  if (usuarioLS) {
    try {
      const usuario = JSON.parse(usuarioLS);
      cedulaPorDefecto = usuario.cedula || usuario.codigo || '';
    } catch (e) {
      this.logger.warn('⚠️ Error al parsear usuario en constructor:', e);
    }
  }
  
  this.solicitudForm = this.fb.group({
    tipoDocumento: ['CC', [Validators.required, this.tipoDocumentoValido()]],
    numero_documento: [cedulaPorDefecto, [Validators.required, Validators.minLength(6)]],
    fecha_expedicion: ['', Validators.required],
    fecha_nacimiento: ['', Validators.required]
  });
}
```

**Recomendación:** Usar la **Opción 1** porque:
- Es más clara y fácil de mantener
- El usuario ya se carga en `ngOnInit()` de todas formas
- Permite mejor manejo de errores y logging
- Es más consistente con el resto del código

---

### 2. Manejo de Valores Alternativos

**Consideración Importante:**

El atributo `cedula` puede no estar siempre disponible en el objeto usuario. En otros componentes del sistema se usa el siguiente patrón como fallback:

```typescript
const cedulaUsuario = this.usuario.cedula || this.usuario.codigo || '';
```

**Lógica de Fallback:**
1. Primero intentar usar `this.usuario.cedula`
2. Si no existe, usar `this.usuario.codigo` como alternativa
3. Si ninguno existe, dejar el campo vacío (string vacío)

**Justificación:**
- Algunos usuarios pueden tener `cedula` como atributo
- Otros pueden tener solo `codigo` (código de estudiante)
- Es mejor tener un valor por defecto que ninguno, incluso si es el código

---

### 3. Validación del Campo

**Ubicación:** `src/app/pages/estudiante/pruebas-ecaes/pruebas-ecaes.component.ts`

**Estado Actual:**
El campo tiene las siguientes validaciones:
```typescript
numero_documento: ['', [Validators.required, Validators.minLength(6)]]
```

**Acción:** No requiere cambios. Las validaciones existentes seguirán funcionando correctamente:
- `Validators.required`: Asegura que el campo no esté vacío
- `Validators.minLength(6)`: Asegura que tenga al menos 6 caracteres

Si el valor por defecto (cedula o codigo) tiene menos de 6 caracteres, el usuario verá el error de validación y podrá corregirlo manualmente.

---

### 4. Experiencia de Usuario

**Comportamiento Esperado:**

1. **Al cargar la página:**
   - El campo "Número de Documento" debe aparecer prellenado con el valor de `cedula` (o `codigo` como fallback) del usuario logueado
   - El usuario puede editar este valor si es necesario
   - El campo debe seguir siendo editable (no readonly)

2. **Si el usuario no está logueado:**
   - El campo debe quedar vacío
   - Las validaciones existentes seguirán funcionando

3. **Si el valor por defecto no cumple las validaciones:**
   - El campo mostrará el error de validación correspondiente
   - El usuario podrá corregir el valor manualmente

---

## ARCHIVOS A MODIFICAR

1. ✅ `src/app/pages/estudiante/pruebas-ecaes/pruebas-ecaes.component.ts`
   - Actualizar método `ngOnInit()` para establecer el valor por defecto del campo `numero_documento`
   - Usar `this.solicitudForm.patchValue()` para actualizar el valor del campo

---

## IMPLEMENTACIÓN RECOMENDADA

**Código completo para `ngOnInit()`:**

```typescript
ngOnInit(): void {
  // Recuperamos usuario del localStorage
  const usuarioLS = localStorage.getItem('usuario');
  if (usuarioLS) {
    this.usuario = JSON.parse(usuarioLS);
    this.logger.log('👤 Usuario cargado desde localStorage:', this.usuario);
    
    // Establecer valor por defecto del número de documento
    // Usar cedula si existe, sino usar codigo como fallback
    const cedulaUsuario = this.usuario.cedula || this.usuario.codigo || '';
    if (cedulaUsuario) {
      this.solicitudForm.patchValue({
        numero_documento: cedulaUsuario
      });
      this.logger.log('📝 Número de documento establecido por defecto:', cedulaUsuario);
    } else {
      this.logger.warn('⚠️ No se encontró cédula ni código en el usuario');
    }
  } else {
    this.logger.warn('⚠️ No se encontró usuario en localStorage');
  }

  this.cargarTiposDocumento();
  this.cargarFechasEcaes();
  this.listarSolicitudes();
}
```

---

## CONSIDERACIONES IMPORTANTES

1. **Orden de Ejecución**: El valor debe establecerse **después** de cargar el usuario desde localStorage, pero **antes** de cargar otros datos, para que el usuario vea el valor prellenado inmediatamente.

2. **Editable**: El campo debe seguir siendo editable. El usuario debe poder modificar el valor si es necesario (por ejemplo, si necesita ingresar un número de documento diferente).

3. **Validaciones**: Las validaciones existentes (`required` y `minLength(6)`) deben seguir funcionando. Si el valor por defecto no cumple las validaciones, se mostrará el error correspondiente.

4. **Fallback**: Usar el patrón `this.usuario.cedula || this.usuario.codigo || ''` para manejar casos donde `cedula` no esté disponible.

5. **Logging**: Mantener los logs existentes y agregar un log cuando se establece el valor por defecto, para facilitar el debugging.

6. **No Modificar el HTML**: El campo en el HTML no requiere cambios, ya que el valor se establece programáticamente en el FormControl.

---

## RESULTADO ESPERADO

Al finalizar, el campo "Número de Documento" debe:

- ✅ Aparecer prellenado con el valor de `cedula` (o `codigo` como fallback) del usuario logueado al cargar la página
- ✅ Seguir siendo editable (el usuario puede modificar el valor si es necesario)
- ✅ Mantener todas las validaciones existentes
- ✅ Funcionar correctamente incluso si el usuario no está logueado (campo vacío)
- ✅ Mostrar errores de validación si el valor por defecto no cumple los requisitos

---

## NOTAS ADICIONALES

- **Atributo del Usuario**: El atributo puede ser `cedula` o `codigo`. Se recomienda usar `cedula` como primera opción y `codigo` como fallback.
- **Método patchValue()**: Se usa `patchValue()` en lugar de `setValue()` porque solo se actualiza un campo del formulario, no todos.
- **Timing**: El valor se establece en `ngOnInit()` después de cargar el usuario, asegurando que el usuario esté disponible antes de intentar acceder a sus propiedades.
- **Experiencia de Usuario**: Este cambio mejora significativamente la experiencia del usuario al evitar que tenga que escribir manualmente su número de documento, que generalmente es un dato que ya conoce el sistema.

---

## REFERENCIAS

- **Campo del Formulario:** `numero_documento` (FormControl)
- **Atributo del Usuario:** `cedula` (con fallback a `codigo`)
- **Método a usar:** `this.solicitudForm.patchValue()`
- **Ubicación del cambio:** Método `ngOnInit()` en `pruebas-ecaes.component.ts`
