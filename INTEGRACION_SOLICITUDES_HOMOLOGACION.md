# Integración de Solicitudes de Homologación - Corrección

## Descripción

Se ha corregido la integración del endpoint de homologación para que funcione correctamente con el componente de seguimiento de solicitudes existente. El endpoint `/api/solicitudes-homologacion/listarSolicitud-Homologacion/porRol` ahora filtra correctamente las solicitudes por usuario logueado.

## Cambios Realizados

### 1. Modelos de Datos (`src/app/core/models/procesos.model.ts`)

Se agregaron las interfaces necesarias para mapear la respuesta del backend (mantenidas para futuras funcionalidades):

```typescript
export interface EstadoSolicitud {
  id_estado: number;
  estado_actual: string;
  fecha_registro_estado: string;
  objSolicitud?: any;
}

export interface Rol {
  id_rol: number;
  nombre: string;
}

export interface Programa {
  id_programa: number;
  codigo: string;
  nombre_programa: string;
}

export interface UsuarioHomologacion {
  id_usuario: number;
  nombre_completo: string;
  rol: Rol;
  codigo: string;
  correo: string;
  estado_usuario: boolean;
  objPrograma: Programa;
}

export interface DocumentoHomologacion {
  id_documento: number;
  nombre: string;
  ruta_documento: string;
  fecha_documento: string;
  esValido: boolean;
  comentario?: string | null;
  tipoDocumentoSolicitudPazYSalvo?: any;
}

export interface SolicitudHomologacionDTORespuesta {
  id_solicitud: number;
  nombre_solicitud: string;
  fecha_registro_solicitud: string;
  esSeleccionado?: boolean | null;
  estadosSolicitud: EstadoSolicitud[];
  objUsuario: UsuarioHomologacion;
  documentos: DocumentoHomologacion[];
}
```

### 2. Servicio de Homologación (`src/app/core/services/homologacion-asignaturas.service.ts`)

Se corrigió el método `listarSolicitudesPorRol()` para incluir headers de autenticación:

```typescript
listarSolicitudesPorRol(rol: string, idUsuario?: number): Observable<Solicitud[]> {
  let params: any = { rol: rol };
  if (idUsuario) {
    params.idUsuario = idUsuario;
  }

  return this.http.get<Solicitud[]>(`${this.apiUrl}/listarSolicitud-Homologacion/porRol`, {
    params: params,
    headers: this.getAuthHeaders()
  });
}
```

### 3. Componente de Homologación (`src/app/pages/estudiante/homologacion-asignaturas/homologacion-asignaturas.component.ts`)

Se corrigió el método `listarSolicitudes()` para usar el endpoint correcto:

```typescript
listarSolicitudes() {
  if (!this.usuario) {
    console.error("❌ Usuario no encontrado en localStorage.");
    return;
  }

  this.homologacionService.listarSolicitudesPorRol(this.usuario.rol.nombre, this.usuario.id_usuario).subscribe({
    // ... resto del código
  });
}
```

### 4. Componente File Upload Dialog

Se restauró el componente a su funcionalidad original (solo subida de archivos), removiendo la funcionalidad de mostrar solicitudes existentes que no era necesaria.

## Cómo Funciona

### Flujo de Datos

1. **Usuario Logueado**: El sistema obtiene la información del usuario desde `localStorage`
2. **Filtrado por Usuario**: El endpoint recibe el rol y el ID del usuario para filtrar solo sus solicitudes
3. **Componente de Seguimiento**: Las solicitudes se muestran en el componente `app-request-status-table` existente
4. **Información Mostrada**: 
   - Nombre de la solicitud
   - Fecha de registro
   - Estado actual
   - Oficio/Resolución (si está disponible)

### Componente de Seguimiento

El componente `app-request-status-table` muestra las solicitudes en una tabla con:
- **Columna Solicitud**: Nombre de la solicitud
- **Columna Fecha**: Fecha de registro formateada
- **Columna Estado**: Estado actual con ícono y color
- **Columna Oficio/Resolución**: Botón para descargar oficio si está disponible

## Estructura de la Respuesta del Backend

El endpoint debe retornar un array con la siguiente estructura:

```json
[
  {
    "id_solicitud": 1,
    "nombre_solicitud": "Solicitud_homologacion_Pepa González",
    "fecha_registro_solicitud": "2025-09-19T23:20:48.000+00:00",
    "esSeleccionado": null,
    "estadosSolicitud": [
      {
        "id_estado": 1,
        "estado_actual": "Enviada",
        "fecha_registro_estado": "2025-09-19T23:20:50.000+00:00",
        "objSolicitud": null
      }
    ],
    "objUsuario": {
      "id_usuario": 1,
      "nombre_completo": "Pepa González",
      "rol": {
        "id_rol": 2,
        "nombre": "Estudiante"
      },
      "codigo": "104612345660",
      "correo": "Pepa.gonzalez@unicauca.edu.co",
      "estado_usuario": true,
      "objPrograma": {
        "id_programa": 1,
        "codigo": "1046",
        "nombre_programa": "Ingenieria Sistemas"
      }
    },
    "documentos": [
      {
        "id_documento": 1,
        "nombre": "CEOSeptiembre - copia.pdf",
        "ruta_documento": "CEOSeptiembre - copia.pdf",
        "fecha_documento": "2025-09-19T23:20:46.000+00:00",
        "esValido": true,
        "comentario": null,
        "tipoDocumentoSolicitudPazYSalvo": null
      }
    ]
  }
]
```

## Características de la UI

### Estados de Solicitud Soportados:
- **Enviada**: Color azul
- **Pendiente**: Color naranja
- **Aprobada**: Color verde
- **Rechazada**: Color rojo
- **En Revisión**: Color morado

### Información Mostrada en la Tabla:
1. **Nombre de la Solicitud**: Identificador de la solicitud
2. **Fecha**: Fecha de registro formateada
3. **Estado**: Estado actual con ícono y color distintivo
4. **Oficio/Resolución**: Botón para descargar documento oficial (si está disponible)

### Estados de la Interfaz:
- **Sin Solicitudes**: Mensaje "No se ha enviado ninguna solicitud aún"
- **Con Solicitudes**: Tabla con las solicitudes del usuario logueado

## Dependencias

El componente de seguimiento requiere los siguientes módulos de Angular Material:
- `MatTableModule`
- `MatIconModule`
- `MatTooltipModule`
- `MatButtonModule`

## Consideraciones Técnicas

1. **Autenticación**: El servicio usa el token de autenticación del localStorage
2. **Usuario**: Se obtiene automáticamente del localStorage
3. **Rol**: Se usa el rol del usuario para filtrar las solicitudes
4. **Filtrado por Usuario**: Solo se muestran las solicitudes del usuario logueado
5. **Responsive**: La tabla se adapta a dispositivos móviles

## Ejemplo de Implementación Completa

```typescript
// En el componente de homologación
export class HomologacionAsignaturasComponent implements OnInit {
  archivosActuales: Archivo[] = [];
  resetFileUpload = false;
  solicitudes: Solicitud[] = [];
  usuario: any = null;

  ngOnInit(): void {
    // Recuperar usuario del localStorage
    const usuarioLS = localStorage.getItem('usuario');
    if (usuarioLS) {
      this.usuario = JSON.parse(usuarioLS);
    }
    
    // Cargar solicitudes del usuario
    this.listarSolicitudes();
  }

  listarSolicitudes() {
    if (!this.usuario) return;
    
    this.homologacionService.listarSolicitudesPorRol(
      this.usuario.rol.nombre, 
      this.usuario.id_usuario
    ).subscribe({
      next: (data) => {
        this.solicitudes = data.map((sol: any) => ({
          id: sol.id_solicitud,
          nombre: sol.nombre_solicitud,
          fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
          estado: sol.estadosSolicitud?.[0]?.estado_actual || 'Pendiente',
          rutaArchivo: sol.documentos?.[0]?.ruta || '',
          comentarios: sol.estadosSolicitud?.[0]?.comentarios || ''
        }));
      }
    });
  }
}
```

```html
<!-- En el template del componente -->
<!-- Sección de subida de archivos -->
<app-file-upload
  [archivos]="archivosActuales"
  (archivosChange)="onArchivosChange($event)"
  [reset]="resetFileUpload">
</app-file-upload>

<!-- Sección de seguimiento de solicitudes -->
<app-request-status-table
  *ngIf="solicitudes.length > 0"
  [solicitudes]="solicitudes">
</app-request-status-table>
```

Esta implementación corrige el filtrado por usuario y utiliza el componente de seguimiento existente para mostrar las solicitudes de manera organizada y funcional.
