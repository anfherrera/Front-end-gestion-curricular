
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
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Archivo } from '../../../core/models/procesos.model';
import { RequestStatusTableComponent } from "../../../shared/components/request-status/request-status.component";
import { FileUploadComponent } from "../../../shared/components/file-upload-dialog/file-upload-dialog.component";

import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';

import { Solicitud } from '../../../core/models/procesos.model';

@Component({
  selector: 'app-solicitud-homologacion',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    FileUploadComponent,
    RequestStatusTableComponent
  ],
  templateUrl: './homologacion-asignaturas.component.html',
  styleUrls: ['./homologacion-asignaturas.component.css']
})
export class HomologacionAsignaturasComponent implements OnInit {
  documentosRequeridos = [
    { label: 'Formulario de homologación', obligatorio: true },
    { label: 'Certificado de notas', obligatorio: true },
    { label: 'Programa académico de la materia', obligatorio: false }
  ];

  archivosExclusivos: string[] = ['Documento A', 'Documento B'];

  archivosActuales: Archivo[] = [];
  resetFileUpload = false;
  solicitudes: Solicitud[] = [];

  usuario: any = null;

  constructor(private homologacionService: HomologacionAsignaturasService) {}

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
  }

  onArchivosChange(archivos: Archivo[]) {
    this.archivosActuales = archivos;
  }

  puedeEnviar(): boolean {
    return this.archivosActuales.length > 0 && !!this.usuario;
  }

  // onSolicitudEnviada() {
  //   if (!this.usuario) {
  //     console.error('❌ No se puede enviar solicitud: usuario no encontrado.');
  //     return;
  //   }

  //   const solicitud = {
  //     usuarioId: this.usuario.id,
  //     nombreUsuario: this.usuario.nombre,
  //     correo: this.usuario.correo,
  //     fecha: new Date(),
  //     archivos: this.archivosActuales
  //   };

  //   this.homologacionService.crearSolicitud(solicitud).subscribe({
  //     next: (resp) => {
  //       console.log('✅ Solicitud creada en backend:', resp);
  //       this.listarSolicitudes();

  //       // Resetear el file upload
  //       this.resetFileUpload = true;
  //       setTimeout(() => this.resetFileUpload = false, 0);
  //     },
  //     error: (err) => {
  //       console.error('❌ Error al enviar solicitud', err);
  //       if (err.status === 401) {
  //         alert('⚠️ Sesión expirada. Por favor, inicia sesión de nuevo.');
  //       }
  //     }
  //   });
  // }
  onSolicitudEnviada() {
  if (!this.usuario) {
    console.error('❌ No se puede enviar solicitud: usuario no encontrado.');
    return;
  }

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
    archivos: this.archivosActuales
  };

  this.homologacionService.crearSolicitud(solicitud).subscribe({
    next: (resp) => {
      console.log('✅ Solicitud creada en backend:', resp);
      this.listarSolicitudes();

      // Resetear el file upload
      this.resetFileUpload = true;
      setTimeout(() => this.resetFileUpload = false, 0);
    },
    error: (err) => {
      console.error('❌ Error al enviar solicitud', err);
      if (err.status === 400) {
        alert('⚠️ Error de validación: revisa los datos de la solicitud');
      }
      if (err.status === 401) {
        alert('⚠️ Sesión expirada. Por favor, inicia sesión de nuevo.');
      }
    }
  });
}


  // listarSolicitudes() {
  //   this.homologacionService.listarSolicitudes().subscribe({
  //     next: (data) => {
  //       this.solicitudes = data;
  //       console.log('📋 Solicitudes cargadas:', this.solicitudes);
  //     },
  //     error: (err) => {
  //       console.error('❌ Error al listar solicitudes', err);
  //     }
  //   });
  // }

  listarSolicitudes() {
  this.homologacionService.listarSolicitudes().subscribe({
    next: (data) => {
      this.solicitudes = data.map((sol: any) => {
        const estados = sol.estado_actual || sol.estadosSolicitud || [];
        const ultimoEstado = estados.length > 0 ? estados[estados.length - 1] : null;

        // Tomamos el primer documento como "rutaArchivo"
        const rutaArchivo = sol.documentos?.length > 0 ? sol.documentos[0].ruta : '';

        return {
          id: sol.id_solicitud,
          nombre: sol.nombre_solicitud,
          fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
          estado: ultimoEstado?.estado_actual || 'Pendiente',
          rutaArchivo,
          comentarios: ultimoEstado?.comentarios || ''
        };
      });

      console.log('📋 Solicitudes cargadas (transformadas):', this.solicitudes);
    },
    error: (err) => {
      console.error('❌ Error al listar solicitudes', err);
    }
  });
}

}
