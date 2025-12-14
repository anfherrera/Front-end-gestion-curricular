
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
//       alert('No se encontró información del usuario. Inicia sesión nuevamente.');
//       return;
//     }

//     const formData = new FormData();
//     formData.append('idUsuario', usuario.id_usuario);

//     this.archivosActuales.forEach(file => {
//       formData.append('archivos', file);
//     });

//     this.homologacionService.crearSolicitud(formData).subscribe({
//       next: (res) => {
//         alert('Solicitud enviada correctamente');
//         this.resetFileUpload = true;
//         this.archivosActuales = [];
//         this.cargarSolicitudes();
//       },
//       error: (err) => {
//         console.error('Error al crear solicitud:', err);
//         const msg = err?.error?.['objUsuario.password'] || 'Error al enviar la solicitud';
//         alert(msg);
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
//         console.error('Error al cargar solicitudes:', err);
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

//   archivosActuales: Archivo[] = [];  // importante: usar Archivo[] y no File[]
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
//     // Recuperamos usuario del localStorage
//     const usuarioLS = localStorage.getItem('usuario');
//     if (usuarioLS) {
//       this.usuario = JSON.parse(usuarioLS);
//       console.log('👤 Usuario cargado desde localStorage:', this.usuario);
//     } else {
//       console.warn('No se encontró usuario en localStorage');
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
//       console.error('No se puede enviar solicitud: usuario no encontrado.');
//       return;
//     }

//     console.log('🚀 Enviando solicitud con archivos:', this.archivosActuales);

//     const solicitud = {
//       usuarioId: this.usuario.id, // dinámico
//       nombreUsuario: this.usuario.nombre,
//       correo: this.usuario.correo,
//       fecha: new Date(),
//       archivos: this.archivosActuales
//     };

//     this.http.post('/api/solicitudes/homologacion', solicitud).subscribe({
//       next: (resp) => {
//         console.log('Solicitud creada en backend:', resp);

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
//         console.error('Error al enviar solicitud', err);
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
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

import { Archivo, SolicitudHomologacionDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
import { RequestStatusTableComponent } from "../../../shared/components/request-status/request-status.component";
import { FileUploadComponent } from "../../../shared/components/file-upload-dialog/file-upload-dialog.component";
import { RequiredDocsComponent } from "../../../shared/components/required-docs/required-docs.component";
import { ComentariosDialogComponent, ComentariosDialogData } from "../../../shared/components/comentarios-dialog/comentarios-dialog.component";
import { PeriodoActualDisplayComponent } from "../../../shared/components/periodo-actual-display/periodo-actual-display.component";

import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';
import { MatDialog } from '@angular/material/dialog';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { AuthService } from '../../../core/services/auth.service';

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
    RequiredDocsComponent,
    RequestStatusTableComponent,
    PeriodoActualDisplayComponent
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
    private dialog: MatDialog,
    private http: HttpClient,
    private notificacionesService: NotificacionesService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Recuperamos usuario del localStorage
    const usuarioLS = localStorage.getItem('usuario');
    if (usuarioLS) {
      this.usuario = JSON.parse(usuarioLS);
      // Usuario cargado desde localStorage
    } else {
      console.warn('No se encontró usuario en localStorage');
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
    console.error('No se puede enviar solicitud: usuario no encontrado.');
    return;
  }

    if (!this.fileUploadComponent) {
      console.error('No se puede acceder al componente de archivos.');
      return;
    }

    // Iniciando proceso de envío de solicitud

    // Paso 1: Subir archivos al backend
    this.fileUploadComponent.subirArchivosPendientes().subscribe({
      next: (archivosSubidos) => {
        // Archivos subidos correctamente

        // Paso 2: Crear la solicitud con los archivos ya subidos
  const solicitud = {
    nombre_solicitud: `Solicitud_homologacion_${this.usuario.nombre_completo}`,
    fecha_registro_solicitud: new Date().toISOString(),
    objUsuario: {
      id_usuario: this.usuario.id_usuario,
      nombre_completo: this.usuario.nombre_completo,
      codigo: this.usuario.codigo,
      correo: this.usuario.correo || this.usuario.email_usuario,
      // FIX: Agregar id_rol e id_programa como campos requeridos por el backend
      id_rol: this.usuario.id_rol || this.usuario.objRol?.id_rol || 1, // 1 = ESTUDIANTE por defecto
      id_programa: this.usuario.id_programa || this.usuario.objPrograma?.id_programa || 1,
      objPrograma: this.usuario.objPrograma || {
        id_programa: this.usuario.id_programa || this.usuario.objPrograma?.id_programa || 1,
        nombre_programa: this.usuario.objPrograma?.nombre_programa || "Ingeniería de Sistemas"
      }
    },
          archivos: archivosSubidos
  };

        // Creando solicitud con archivos

  this.homologacionService.crearSolicitud(solicitud).subscribe({
    next: (resp) => {
      // Solicitud creada en backend
      this.listarSolicitudes();

      // Actualizar notificaciones después de crear la solicitud
      const usuario = this.authService.getUsuario();
      if (usuario?.id_usuario) {
        this.notificacionesService.actualizarNotificaciones(usuario.id_usuario);
      }

      // Resetear el file upload
      this.resetFileUpload = true;
      setTimeout(() => this.resetFileUpload = false, 0);

            this.mostrarMensaje('¡Solicitud de homologación enviada correctamente!', 'success');
    },
    error: (err) => {
            console.error('Error al crear solicitud:', err);
      if (err.status === 400) {
              this.mostrarMensaje('Error de validación: revisa los datos de la solicitud', 'warning');
      }
      if (err.status === 401) {
              this.mostrarMensaje('Sesión expirada. Por favor, inicia sesión de nuevo.', 'warning');
            }
          }
        });
      },
      error: (err) => {
        console.error('Error al subir archivos:', err);
        this.mostrarMensaje('Error al subir archivos. Por favor, inténtalo de nuevo.', 'error');
        
        // Resetear el estado de carga del componente de subida
        if (this.fileUploadComponent) {
          this.fileUploadComponent.resetearEstadoCarga();
        }
    }
  });
}




listarSolicitudes() {
  if (!this.usuario) {
    console.error("Usuario no encontrado en localStorage.");
    return;
  }

  // Usuario encontrado
  // Rol
  // ID Usuario

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
 * Descargar oficio
 */
descargarOficio(idOficio: number, nombreArchivo: string): void {
  console.log('📥 Descargando oficio:', idOficio);
  
  // Primero intentar obtener los oficios disponibles para esta solicitud
  this.obtenerOficiosYDescargar(idOficio, nombreArchivo);
}

/**
 * Obtener oficios y descargar
 */
private obtenerOficiosYDescargar(idSolicitud: number, nombreArchivo: string): void {
  this.homologacionService.obtenerOficios(idSolicitud).subscribe({
    next: (oficios) => {
      console.log('📄 Oficios obtenidos:', oficios);
      
      if (!oficios || oficios.length === 0) {
        this.mostrarMensaje('No hay oficios disponibles para esta solicitud', 'warning');
        return;
      }
      
      // Tomar el primer oficio disponible
      const oficio = oficios[0];
      const nombreArchivoOficio = oficio.nombre || oficio.nombreArchivo || `oficio_${idSolicitud}.pdf`;
      
      // Intentar descargar usando el endpoint de archivos
      this.descargarArchivoPorNombre(nombreArchivoOficio, nombreArchivo, idSolicitud);
    },
    error: (err) => {
      console.error('❌ Error al obtener oficios:', err);
      
      // Si no se pueden obtener oficios, intentar con nombres comunes
      this.intentarDescargaConNombresComunes(idSolicitud, nombreArchivo);
    }
  });
}

/**
 * Descargar archivo por nombre usando el endpoint de archivos
 */
private descargarArchivoPorNombre(nombreArchivo: string, nombreDescarga: string, idSolicitud?: number): void {
  console.log('📁 Descargando archivo por nombre:', nombreArchivo);
  
  // Usar el endpoint de solicitudes de homologación que acabamos de crear
  const url = `${environment.apiUrl}/solicitudes-homologacion/descargarOficio/${idSolicitud || 1}`;
  
  // Crear headers con autorización
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });
  
  this.http.get(url, {
    headers: headers,
    responseType: 'blob',
    observe: 'response'
  }).subscribe({
    next: (response) => {
      console.log('✅ Archivo descargado exitosamente');
      
      // Obtener el nombre del archivo desde los headers de la respuesta
      const contentDisposition = response.headers.get('Content-Disposition');
      let nombreArchivoDescarga = nombreDescarga || nombreArchivo;
      
      console.log('🔍 Content-Disposition header:', contentDisposition);
      
      if (contentDisposition) {
        // Intentar diferentes patrones para extraer el nombre del archivo
        let matches = contentDisposition.match(/filename="(.+)"/);
        if (!matches) {
          matches = contentDisposition.match(/filename=([^;]+)/);
        }
        if (!matches) {
          matches = contentDisposition.match(/filename\*=UTF-8''(.+)/);
        }
        
        if (matches && matches[1]) {
          nombreArchivoDescarga = decodeURIComponent(matches[1]);
          console.log('📁 Nombre del archivo desde headers:', nombreArchivoDescarga);
        } else {
          console.log('⚠️ No se pudo extraer el nombre del archivo del header Content-Disposition');
        }
      } else {
        console.log('⚠️ No se encontró el header Content-Disposition');
        // Usar el nombre del archivo que viene del método obtenerOficios
        nombreArchivoDescarga = nombreArchivo;
        console.log('📁 Usando nombre del archivo del método obtenerOficios:', nombreArchivoDescarga);
      }
      
      // Crear URL temporal y descargar
      const blob = response.body!;
      
      // Logging para diagnosticar el problema
      console.log('📊 Tipo de contenido:', response.headers.get('Content-Type'));
      console.log('📊 Tamaño del blob:', blob.size);
      console.log('📊 Tipo del blob:', blob.type);
      console.log('📊 Nombre de descarga:', nombreArchivoDescarga);
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivoDescarga;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      this.mostrarMensaje('Oficio descargado exitosamente', 'success');
    },
    error: (err) => {
      console.error('❌ Error al descargar archivo:', err);
      this.mostrarMensaje('Error al descargar archivo: ' + (err.error?.message || err.message || 'Error desconocido'), 'error');
    }
  });
}

/**
 * Intentar descarga con nombres comunes
 */
private intentarDescargaConNombresComunes(idSolicitud: number, nombreArchivo: string): void {
  console.log('🔄 Intentando descarga con nombres comunes...');
  
  // Obtener información del usuario para generar nombres
  const usuario = this.usuario;
  const codigoUsuario = usuario?.codigo || usuario?.codigo_estudiante || 'SIN_CODIGO';
  const año = new Date().getFullYear();
  
  // Nombres comunes a probar
  const nombresComunes = [
    `OFICIO_HOMOLOGACION_${codigoUsuario}_${año} (1).pdf`,
    `OFICIO_HOMOLOGACION_${codigoUsuario}_${año}.pdf`,
    `oficio_homologacion_${codigoUsuario}_${año}.pdf`,
    `homologacion_${codigoUsuario}_${año}.pdf`,
    `oficio_${idSolicitud}.pdf`,
    `homologacion_${idSolicitud}.pdf`
  ];
  
  this.probarNombresSecuencial(nombresComunes, 0, nombreArchivo, idSolicitud);
}

/**
 * Probar nombres de archivo secuencialmente
 */
private probarNombresSecuencial(nombres: string[], index: number, nombreDescarga: string, idSolicitud: number): void {
  if (index >= nombres.length) {
    this.mostrarMensaje('No se encontró el archivo con los nombres probados', 'warning');
    return;
  }
  
  const nombre = nombres[index];
  console.log(`🧪 Probando nombre ${index + 1}/${nombres.length}: "${nombre}"`);
  
  this.descargarArchivoPorNombre(nombre, nombreDescarga, idSolicitud);
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
 * Mostrar oficios en la UI
 */
private mostrarOficiosEnUI(oficios: any[]): void {
  console.log('📄 Mostrando oficios en UI:', oficios);
  
  if (!oficios || oficios.length === 0) {
    this.mostrarMensaje('No hay oficios disponibles', 'info');
    return;
  }
  
  this.mostrarMensaje(`Se encontraron ${oficios.length} oficio(s) disponible(s)`, 'success');
}

}
