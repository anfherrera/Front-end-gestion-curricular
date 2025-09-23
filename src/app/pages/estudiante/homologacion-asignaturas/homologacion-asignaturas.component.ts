
//=====================================================================================
// import { Component, OnInit } from '@angular/core';
// //import { HomologacionService } from 'src/app/core/services/homologacion.service';
// import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';
// import { AuthService } from '../../../core/services/auth.service';
// import { f } from "../../../../../node_modules/@angular/material/icon-module.d-COXCrhrh";
// import { MatCard } from "@angular/material/card";
// import { MatCardTitle, MatCardContent } from "../../../../../node_modules/@angular/material/card/index";
// import { RequestStatusTableComponent } from "../../../shared/components/request-status/request-status.component";
// import { FileUploadComponent } from "../../../shared/components/file-upload-dialog/file-upload-dialog.component";
// import { Solicitud, Archivo } from '../../../core/models/procesos.model';
// @Component({
//   selector: 'app-homologacion-asignaturas',
//   templateUrl: './homologacion-asignaturas.component.html',
//   styleUrls: ['./homologacion-asignaturas.component.css'],
//   imports: [f, MatCard, MatCardTitle,
//      MatCardContent, RequestStatusTableComponent,
//      FileUploadComponent]
// })
// export class HomologacionAsignaturasComponent implements OnInit {

//   // Documentos requeridos (puedes cargarlos dinámicamente si vienen del back)
//   documentosRequeridos = [
//     { label: 'Historial Académico', obligatorio: true },
//     { label: 'Sílabos de asignaturas', obligatorio: true },
//     { label: 'Certificado de notas', obligatorio: false }
//   ];

//   archivosExclusivos: string[] = ['Resolución de traslado', 'Carta de homologación'];

//   // Archivos cargados en el file-upload
//   solicitudes: Solicitud[] = [];
//   archivosActuales: Archivo[] = [];
//   resetFileUpload = false;


//   // Lista de solicitudes enviadas


//   constructor(
//     private homologacionService: HomologacionAsignaturasService,
//     private authService: AuthService
//   ) {}

//   ngOnInit(): void {
//     this.cargarSolicitudes();
//   }

//   /** Verifica si se puede enviar la solicitud */
//   puedeEnviar(): boolean {
//     return this.archivosActuales.length > 0;
//   }

//   /** Maneja el cambio de archivos */
//   onArchivosChange(archivos: Archivo[]): void {
//     this.archivosActuales = archivos;
//   }

//   /** Enviar la solicitud de homologación */
//   onSolicitudEnviada(): void {
//     const usuario = this.authService.getUsuario();

//     if (!usuario) {
//       alert('⚠️ No se encontró información del usuario. Inicia sesión nuevamente.');
//       return;
//     }

//     const formData = new FormData();
//     formData.append('idUsuario', usuario.id_usuario);

//     this.archivosActuales.forEach(file => {
//       formData.append('archivos', file);
//     });

//     this.homologacionService.crearSolicitud(formData).subscribe({
//       next: (res) => {
//         alert('✅ Solicitud enviada correctamente');
//         this.resetFileUpload = true;
//         this.archivosActuales = [];
//         this.cargarSolicitudes();
//       },
//       error: (err) => {
//         console.error('❌ Error al crear solicitud:', err);
//         const msg = err?.error?.['objUsuario.password'] || 'Error al enviar la solicitud';
//         alert('⚠️ ' + msg);
//       }
//     });
//   }

//   /** Cargar solicitudes previas para mostrar en tabla */
//   cargarSolicitudes(): void {
//     this.homologacionService.listarSolicitudes().subscribe({
//       next: (res) => {
//         this.solicitudes = res;
//       },
//       error: (err) => {
//         console.error('❌ Error al cargar solicitudes:', err);
//       }
//     });
//   }
// }
//=====================================================================================
// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { MatCardModule } from '@angular/material/card';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { Archivo } from '../../../core/models/procesos.model';
// //import { FileUploadComponent } from '../file-upload-dialog/file-upload-dialog.component';
// //import { RequestStatusTableComponent } from '../request-status-table/request-status-table.component';
// import { RequestStatusTableComponent } from "../../../shared/components/request-status/request-status.component";
// import { FileUploadComponent } from "../../../shared/components/file-upload-dialog/file-upload-dialog.component";

// @Component({
//   selector: 'app-solicitud-homologacion',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MatCardModule,
//     MatButtonModule,
//     MatIconModule,
//     FileUploadComponent,
//     RequestStatusTableComponent
//   ],
// templateUrl: './homologacion-asignaturas.component.html',
// styleUrls: ['./homologacion-asignaturas.component.css']
// })
// export class HomologacionAsignaturasComponent {
//   documentosRequeridos = [
//     { label: 'Formulario de homologación', obligatorio: true },
//     { label: 'Certificado de notas', obligatorio: true },
//     { label: 'Programa académico de la materia', obligatorio: false }
//   ];

//   archivosExclusivos: string[] = ['Documento A', 'Documento B'];

//   archivosActuales: Archivo[] = [];  // ✅ importante: usar Archivo[] y no File[]
//   resetFileUpload = false;

//   solicitudes: any[] = []; // Aquí irán tus solicitudes

//   // Se dispara cuando cambia la lista de archivos en el hijo
//   onArchivosChange(archivos: Archivo[]) {
//     this.archivosActuales = archivos;
//     console.log('📂 Archivos seleccionados en el padre:', this.archivosActuales);
//   }

//   // Ejemplo de validación
//   puedeEnviar(): boolean {
//     return this.archivosActuales.length > 0;
//   }

//   // Cuando el usuario envía la solicitud
//   onSolicitudEnviada() {
//     console.log('🚀 Enviando solicitud con archivos:', this.archivosActuales);
//     this.solicitudes.push({
//       estado: 'Enviado',
//       comentarios: 'En revisión',
//       fecha: new Date().toLocaleDateString(),
//       archivos: this.archivosActuales
//     });

//     // Reseteamos el file upload
//     this.resetFileUpload = true;
//     setTimeout(() => this.resetFileUpload = false, 0);
//   }
//   //====



// }

//========================
// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { MatCardModule } from '@angular/material/card';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { HttpClient } from '@angular/common/http';

// import { Archivo } from '../../../core/models/procesos.model';
// import { RequestStatusTableComponent } from "../../../shared/components/request-status/request-status.component";
// import { FileUploadComponent } from "../../../shared/components/file-upload-dialog/file-upload-dialog.component";

// @Component({
//   selector: 'app-solicitud-homologacion',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MatCardModule,
//     MatButtonModule,
//     MatIconModule,
//     FileUploadComponent,
//     RequestStatusTableComponent
//   ],
//   templateUrl: './homologacion-asignaturas.component.html',
//   styleUrls: ['./homologacion-asignaturas.component.css']
// })
// export class HomologacionAsignaturasComponent implements OnInit {
//   documentosRequeridos = [
//     { label: 'Formulario de homologación', obligatorio: true },
//     { label: 'Certificado de notas', obligatorio: true },
//     { label: 'Programa académico de la materia', obligatorio: false }
//   ];

//   archivosExclusivos: string[] = ['Documento A', 'Documento B'];

//   archivosActuales: Archivo[] = [];
//   resetFileUpload = false;
//   solicitudes: any[] = [];

//   usuario: any = null; // datos del usuario logueado

//   constructor(private http: HttpClient) {}

//   ngOnInit(): void {
//     // 🔑 Recuperamos usuario del localStorage
//     const usuarioLS = localStorage.getItem('usuario');
//     if (usuarioLS) {
//       this.usuario = JSON.parse(usuarioLS);
//       console.log('👤 Usuario cargado desde localStorage:', this.usuario);
//     } else {
//       console.warn('⚠️ No se encontró usuario en localStorage');
//     }
//   }

//   // Se dispara cuando el FileUploadComponent notifica cambios
//   onArchivosChange(archivos: Archivo[]) {
//     this.archivosActuales = archivos;
//     //console.log('📂 Archivos seleccionados en el padre:', this.archivosActuales);
//   }

//   // Validación: permitir enviar si hay archivos
//   puedeEnviar(): boolean {
//     return this.archivosActuales.length > 0 && !!this.usuario;
//   }

//   // Lógica para enviar la solicitud
//   onSolicitudEnviada() {
//     if (!this.usuario) {
//       console.error('❌ No se puede enviar solicitud: usuario no encontrado.');
//       return;
//     }

//     console.log('🚀 Enviando solicitud con archivos:', this.archivosActuales);

//     const solicitud = {
//       usuarioId: this.usuario.id, // 🔑 dinámico
//       nombreUsuario: this.usuario.nombre,
//       correo: this.usuario.correo,
//       fecha: new Date(),
//       archivos: this.archivosActuales
//     };

//     this.http.post('/api/solicitudes/homologacion', solicitud).subscribe({
//       next: (resp) => {
//         console.log('✅ Solicitud creada en backend:', resp);

//         this.solicitudes.push({
//           estado: 'Enviado',
//           comentarios: 'En revisión',
//           fecha: new Date().toLocaleDateString(),
//           archivos: this.archivosActuales
//         });

//         // Resetear el file upload
//         this.resetFileUpload = true;
//         setTimeout(() => this.resetFileUpload = false, 0);
//       },
//       error: (err) => {
//         console.error('❌ Error al enviar solicitud', err);
//       }
//     });
//   }
// }
//===========================================================
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';

import { Archivo, SolicitudHomologacionDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
import { RequestStatusTableComponent } from "../../../shared/components/request-status/request-status.component";
import { FileUploadComponent } from "../../../shared/components/file-upload-dialog/file-upload-dialog.component";
import { ComentariosDialogComponent, ComentariosDialogData } from "../../../shared/components/comentarios-dialog/comentarios-dialog.component";

import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';
import { MatDialog } from '@angular/material/dialog';

import { Solicitud } from '../../../core/models/procesos.model';

@Component({
  selector: 'app-solicitud-homologacion',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    FileUploadComponent,
    RequestStatusTableComponent
  ],
  templateUrl: './homologacion-asignaturas.component.html',
  styleUrls: ['./homologacion-asignaturas.component.css']
})
export class HomologacionAsignaturasComponent implements OnInit {
  @ViewChild(FileUploadComponent) fileUploadComponent!: FileUploadComponent;

  documentosRequeridos = [
    { label: 'Formulario de homologación', obligatorio: true },
    { label: 'Certificado de notas', obligatorio: true },
    { label: 'Programa académico de la materia', obligatorio: false }
  ];

  archivosExclusivos: string[] = ['Documento A', 'Documento B'];

  archivosActuales: Archivo[] = [];
  resetFileUpload = false;
  solicitudes: Solicitud[] = [];
  solicitudesCompletas: SolicitudHomologacionDTORespuesta[] = [];

  usuario: any = null;

  constructor(
    private homologacionService: HomologacionAsignaturasService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Recuperamos usuario del localStorage
    const usuarioLS = localStorage.getItem('usuario');
    if (usuarioLS) {
      this.usuario = JSON.parse(usuarioLS);
      console.log('👤 Usuario cargado desde localStorage:', this.usuario);
    } else {
      console.warn('⚠️ No se encontró usuario en localStorage');
    }

    // Listar solicitudes existentes al cargar el componente
    this.listarSolicitudes();
    
    // Verificar funcionalidad de comentarios (para debugging)
    setTimeout(() => {
      this.verificarFuncionalidadComentarios();
    }, 2000);
  }

  onArchivosChange(archivos: Archivo[]) {
    this.archivosActuales = archivos;
  }

  puedeEnviar(): boolean {
    return this.archivosActuales.length > 0 && !!this.usuario;
  }

  /**
   * Muestra un mensaje bonito usando SnackBar
   */
  private mostrarMensaje(mensaje: string, tipo: 'success' | 'error' | 'warning' | 'info' = 'info') {
    const config = {
      duration: tipo === 'success' ? 4000 : 6000,
      horizontalPosition: 'center' as const,
      verticalPosition: 'top' as const,
      panelClass: [`snackbar-${tipo}`]
    };

    this.snackBar.open(mensaje, 'Cerrar', config);
  }

  onSolicitudEnviada() {
  if (!this.usuario) {
    console.error('❌ No se puede enviar solicitud: usuario no encontrado.');
    return;
  }

    if (!this.fileUploadComponent) {
      console.error('❌ No se puede acceder al componente de archivos.');
      return;
    }

    console.log('📤 Iniciando proceso de envío de solicitud...');

    // Paso 1: Subir archivos al backend
    this.fileUploadComponent.subirArchivosPendientes().subscribe({
      next: (archivosSubidos) => {
        console.log('✅ Archivos subidos correctamente:', archivosSubidos);

        // Paso 2: Crear la solicitud con los archivos ya subidos
  const solicitud = {
    nombre_solicitud: `Solicitud_homologacion_${this.usuario.nombre_completo}`,
    fecha_registro_solicitud: new Date().toISOString(),
    objUsuario: {
      id_usuario: this.usuario.id_usuario,
      nombre_completo: this.usuario.nombre_completo,
      codigo: this.usuario.codigo,
      correo: this.usuario.correo,
      objPrograma: this.usuario.objPrograma
    },
          archivos: archivosSubidos
  };

        console.log('📋 Creando solicitud con archivos:', solicitud);

  this.homologacionService.crearSolicitud(solicitud).subscribe({
    next: (resp) => {
      console.log('✅ Solicitud creada en backend:', resp);
      this.listarSolicitudes();

      // Resetear el file upload
      this.resetFileUpload = true;
      setTimeout(() => this.resetFileUpload = false, 0);

            this.mostrarMensaje('🎉 ¡Solicitud de homologación enviada correctamente!', 'success');
    },
    error: (err) => {
            console.error('❌ Error al crear solicitud:', err);
      if (err.status === 400) {
              this.mostrarMensaje('⚠️ Error de validación: revisa los datos de la solicitud', 'warning');
      }
      if (err.status === 401) {
              this.mostrarMensaje('⚠️ Sesión expirada. Por favor, inicia sesión de nuevo.', 'warning');
            }
          }
        });
      },
      error: (err) => {
        console.error('❌ Error al subir archivos:', err);
        this.mostrarMensaje('❌ Error al subir archivos. Por favor, inténtalo de nuevo.', 'error');
    }
  });
}




listarSolicitudes() {
  if (!this.usuario) {
    console.error("❌ Usuario no encontrado en localStorage.");
    return;
  }

  console.log('🔍 Usuario encontrado:', this.usuario);
  console.log('🔍 Rol:', this.usuario.rol.nombre);
  console.log('🔍 ID Usuario:', this.usuario.id_usuario);

  this.homologacionService.listarSolicitudesPorRol(this.usuario.rol.nombre.toUpperCase(), this.usuario.id_usuario).subscribe({
    next: (data) => {
      console.log('📡 Respuesta del backend (raw):', data);
      console.log('📡 Tipo de respuesta:', typeof data);
      console.log('📡 Es array:', Array.isArray(data));
      console.log('📡 Longitud:', data?.length);

      if (!data || !Array.isArray(data)) {
        console.warn('⚠️ La respuesta no es un array válido');
        this.solicitudes = [];
        this.solicitudesCompletas = [];
        return;
      }

      // Guardar las solicitudes completas para usar esSeleccionado y comentarios
      this.solicitudesCompletas = data;

      // Log para debugging - verificar estructura de datos
      console.log('🔍 Estructura de datos del backend:');
      if (data.length > 0) {
        console.log('📋 Primera solicitud completa:', data[0]);
        if (data[0].estadosSolicitud) {
          console.log('📋 Estados de la primera solicitud:', data[0].estadosSolicitud);
          data[0].estadosSolicitud.forEach((estado: any, index: number) => {
            console.log(`📋 Estado ${index}:`, estado);
          });
        }
      }

      this.solicitudes = data.map((sol: any) => {
        console.log('🔍 Procesando solicitud:', sol);

        const estados = sol.estado_actual || sol.estadosSolicitud || [];
        const ultimoEstado = estados.length > 0 ? estados[estados.length - 1] : null;

        const rutaArchivo = sol.documentos?.length > 0 ? sol.documentos[0].ruta : '';

        const solicitudTransformada = {
          id: sol.id_solicitud,
          nombre: sol.nombre_solicitud,
          fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
          estado: ultimoEstado?.estado_actual || 'Pendiente',
          rutaArchivo,
          comentarios: ultimoEstado?.comentarios || '',
          esSeleccionado: sol.esSeleccionado || false // Usar el campo esSeleccionado
        };

        console.log('✅ Solicitud transformada:', solicitudTransformada);
        return solicitudTransformada;
      });

      console.log('📋 Solicitudes cargadas (transformadas):', this.solicitudes);
      console.log('📋 Solicitudes completas:', this.solicitudesCompletas);
    },
    error: (err) => {
      console.error('❌ Error al listar solicitudes', err);
      console.error('❌ Status:', err.status);
      console.error('❌ Message:', err.message);
      console.error('❌ Error completo:', err);
    }
  });
}

/**
 * Verificar si una solicitud está rechazada
 */
esSolicitudRechazada(estado: string): boolean {
  return estado === 'RECHAZADA' || estado === 'Rechazada';
}

/**
 * Obtener la solicitud completa por ID
 */
obtenerSolicitudCompleta(idSolicitud: number): SolicitudHomologacionDTORespuesta | undefined {
  return this.solicitudesCompletas.find(sol => sol.id_solicitud === idSolicitud);
}

/**
 * Obtener el comentario de rechazo del último estado
 */
obtenerComentarioRechazo(solicitud: SolicitudHomologacionDTORespuesta): string | null {
  console.log('🔍 Obteniendo comentario de rechazo para solicitud:', solicitud.id_solicitud);
  console.log('📋 Estados de la solicitud:', solicitud.estadosSolicitud);
  
  if (!solicitud.estadosSolicitud || solicitud.estadosSolicitud.length === 0) {
    console.log('❌ No hay estados en la solicitud');
    return null;
  }

  // Buscar el último estado que sea RECHAZADA
  const estadosRechazados = solicitud.estadosSolicitud.filter(estado => 
    estado.estado_actual === 'RECHAZADA' || estado.estado_actual === 'Rechazada'
  );

  console.log('🔍 Estados rechazados encontrados:', estadosRechazados);

  if (estadosRechazados.length === 0) {
    console.log('❌ No se encontraron estados de rechazo');
    return null;
  }

  // Obtener el último estado de rechazo
  const ultimoEstadoRechazo = estadosRechazados[estadosRechazados.length - 1];
  
  console.log('📝 Último estado de rechazo:', ultimoEstadoRechazo);
  console.log('💬 Comentario encontrado:', ultimoEstadoRechazo.comentario);
  
  return ultimoEstadoRechazo.comentario || null;
}

/**
 * Ver comentarios de una solicitud rechazada
 */
verComentarios(solicitudId: number): void {
  const solicitudCompleta = this.obtenerSolicitudCompleta(solicitudId);
  
  if (!solicitudCompleta) {
    this.mostrarMensaje('No se encontró la información de la solicitud', 'error');
    return;
  }

  if (!solicitudCompleta.documentos || solicitudCompleta.documentos.length === 0) {
    this.mostrarMensaje('No hay documentos asociados a esta solicitud', 'warning');
    return;
  }

  // Obtener el comentario de rechazo del último estado
  const comentarioRechazo = this.obtenerComentarioRechazo(solicitudCompleta);

  console.log('📋 Datos que se envían al diálogo:');
  console.log('  - Título:', `Comentarios - ${solicitudCompleta.nombre_solicitud}`);
  console.log('  - Documentos:', solicitudCompleta.documentos);
  console.log('  - Comentario de rechazo:', comentarioRechazo);

  const dialogRef = this.dialog.open(ComentariosDialogComponent, {
    width: '700px',
    data: <ComentariosDialogData>{
      titulo: `Comentarios - ${solicitudCompleta.nombre_solicitud}`,
      documentos: solicitudCompleta.documentos,
      comentarioRechazo: comentarioRechazo
    }
  });

  dialogRef.afterClosed().subscribe(() => {
    console.log('Diálogo de comentarios cerrado');
  });
}

/**
 * Verificar si una solicitud tiene comentarios
 */
tieneComentarios(solicitudId: number): boolean {
  const solicitudCompleta = this.obtenerSolicitudCompleta(solicitudId);
  
  if (!solicitudCompleta || !solicitudCompleta.documentos) {
    return false;
  }

  return solicitudCompleta.documentos.some(doc => 
    doc.comentario && doc.comentario.trim().length > 0
  );
}

/**
 * Método de prueba para verificar el funcionamiento
 */
verificarFuncionalidadComentarios(): void {
  console.log('🔍 Verificando funcionalidad de comentarios...');
  console.log('📋 Solicitudes completas:', this.solicitudesCompletas);
  console.log('📋 Solicitudes transformadas:', this.solicitudes);
  
  // Buscar solicitudes rechazadas
  const solicitudesRechazadas = this.solicitudes.filter(sol => 
    this.esSolicitudRechazada(sol.estado)
  );
  
  console.log('❌ Solicitudes rechazadas encontradas:', solicitudesRechazadas);
  
  solicitudesRechazadas.forEach(sol => {
    const tieneComentarios = this.tieneComentarios(sol.id);
    console.log(`📝 Solicitud ${sol.id} (${sol.nombre}): ${tieneComentarios ? 'Tiene comentarios' : 'Sin comentarios'}`);
  });
}

/**
 * Obtener oficios de una solicitud
 */
obtenerOficios(solicitudId: number): void {
  console.log('📄 Obteniendo oficios para solicitud:', solicitudId);
  
  this.homologacionService.obtenerOficios(solicitudId).subscribe({
    next: (oficios) => {
      console.log('📄 Oficios obtenidos:', oficios);
      // Aquí puedes mostrar los oficios en la UI
      this.mostrarOficiosEnUI(oficios);
    },
    error: (err) => {
      console.error('❌ Error al obtener oficios:', err);
      this.mostrarMensaje('Error al cargar oficios', 'error');
    }
  });
}

/**
 * Descargar oficio
 */
descargarOficio(idOficio: number, nombreArchivo: string): void {
  console.log('📥 Descargando oficio:', idOficio);
  
  this.homologacionService.descargarOficio(idOficio).subscribe({
    next: (blob) => {
      console.log('✅ Oficio descargado exitosamente');
      
      // Crear URL temporal y descargar
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo || `oficio_${idOficio}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      this.mostrarMensaje('Oficio descargado exitosamente', 'success');
    },
    error: (err) => {
      console.error('❌ Error al descargar oficio:', err);
      this.mostrarMensaje('Error al descargar oficio', 'error');
    }
  });
}

/**
 * Verificar si una solicitud tiene oficios disponibles
 */
tieneOficios(solicitudId: number): boolean {
  // Esta lógica dependerá de cómo implementes la verificación
  // Por ahora, asumimos que las solicitudes aprobadas tienen oficios
  const solicitud = this.obtenerSolicitudCompleta(solicitudId);
  if (!solicitud) return false;
  
  const estado = this.obtenerEstadoActual(solicitud);
  return estado === 'APROBADA' || estado === 'APROBADA_COORDINADOR';
}

/**
 * Obtener el estado actual de una solicitud
 */
obtenerEstadoActual(solicitud: any): string {
  if (solicitud.estadosSolicitud && solicitud.estadosSolicitud.length > 0) {
    const ultimoEstado = solicitud.estadosSolicitud[solicitud.estadosSolicitud.length - 1];
    return ultimoEstado.estado_actual;
  }
  return 'Pendiente';
}

/**
 * Mostrar oficios en la UI (placeholder)
 */
private mostrarOficiosEnUI(oficios: any[]): void {
  // Aquí puedes implementar la lógica para mostrar los oficios
  // Por ejemplo, abrir un modal o actualizar una lista
  console.log('📄 Mostrando oficios en UI:', oficios);
}


// listarSolicitudes() {
//   if (!this.usuario) {
//     console.error("❌ Usuario no encontrado en localStorage.");
//     return;
//   }

//   const rol = this.usuario.rol?.nombre;
//   const idUsuario = rol === 'ESTUDIANTE' ? this.usuario.id_usuario : undefined;

//   this.homologacionService.listarSolicitudesPorRol(rol, idUsuario).subscribe({
//     next: (data) => {
//       this.solicitudes = data.map((sol: any) => {
//         const estados = sol.estadosSolicitud || [];
//         const ultimoEstado = estados.length > 0 ? estados[estados.length - 1] : null;

//         return {
//           id: sol.id_solicitud,
//           nombre: sol.nombre_solicitud,
//           fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
//           estado: ultimoEstado?.estado_actual || 'Pendiente',
//           rutaArchivo: sol.documentos?.[0]?.ruta_documento || '',
//           comentarios: ultimoEstado?.comentarios || ''
//         };
//       });

//       console.log('📋 Solicitudes cargadas (transformadas):', this.solicitudes);
//       //this.cdr.detectChanges(); // 👈 evita el error NG0100
//     },
//     error: (err) => {
//       console.error('❌ Error al listar solicitudes', err);
//     }
//   });
// }



}
