
// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
// //import { HomologacionAsignaturasService } from '../../core/services/homologacion-asignaturas.service';
// //import { HomologacionAsignaturasService } from 'src/app/core/services/homologacion-asignaturas.service';
// import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';

// @Component({
//   selector: 'app-homologacion-asignaturas',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: './homologacion-asignaturas.component.html',
//   styleUrls: ['./homologacion-asignaturas.component.css']
// })
// export class HomologacionAsignaturasComponent implements OnInit {
//   solicitudForm!: FormGroup;
//   solicitudes: any[] = [];

//   constructor(
//     private fb: FormBuilder,
//     private homologacionService: HomologacionAsignaturasService
//   ) {}

//   ngOnInit(): void {
//     this.solicitudForm = this.fb.group({
//       id_usuario: [''],
//       nombre_completo: [''],
//       correo: [''],
//       codigo: ['']
//     });

//     this.obtenerSolicitudes();
//   }

//   // 🔹 Crea la solicitud dinámicamente con el usuario del formulario
//   crearSolicitud(): void {
//     const usuario = {
//       id_usuario: this.solicitudForm.value.id_usuario,
//       nombre_completo: this.solicitudForm.value.nombre_completo,
//       correo: this.solicitudForm.value.correo,
//       codigo: this.solicitudForm.value.codigo,
//       rol: { id_rol: 2, nombre_rol: 'Estudiante' },
//       estado_usuario: true,
//       objPrograma: {
//         id_programa: 1,
//         codigo: 'Sf1',
//         nombre_programa: 'Ingeniería de Sistemas'
//       }
//     };

//     this.homologacionService.crearSolicitudHomologacion(usuario).subscribe({
//       next: () => this.obtenerSolicitudes(),
//       error: err => console.error('Error al crear solicitud', err)
//     });
//   }

//   // 🔹 Obtiene todas las solicitudes
//   obtenerSolicitudes(): void {
//     this.homologacionService.listarSolicitudesHomologacion().subscribe({
//       next: data => this.solicitudes = data,
//       error: err => console.error('Error al listar solicitudes', err)
//     });
//   }
// // }

//=====================================================================================
// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ReactiveFormsModule } from '@angular/forms';
// import { MatTableModule } from '@angular/material/table';
// import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';
// import { AuthService } from '../../../core/services/auth.service';

// @Component({
//   selector: 'app-homologacion-asignaturas',
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, MatTableModule],
//   templateUrl: './homologacion-asignaturas.component.html',
//   styleUrls: ['./homologacion-asignaturas.component.css']
// })
// export class HomologacionAsignaturasComponent implements OnInit {
//   solicitudes: any[] = [];

//   constructor(
//     private homologacionService: HomologacionAsignaturasService,
//     private authService: AuthService
//   ) {}

//   ngOnInit(): void {
//     this.listarSolicitudes();
//   }

//   listarSolicitudes(): void {
//     this.homologacionService.listarSolicitudes().subscribe({
//       next: (data) => this.solicitudes = data,
//       error: (err) => console.error('Error al listar solicitudes', err)
//     });
//   }

//   crearSolicitud(): void {
//     const usuario = this.authService.getUsuario(); // 👈 viene del login

//     if (!usuario) {
//       console.error('No hay usuario en sesión');
//       return;
//     }

//     const nuevaSolicitud = {
//       nombre_solicitud: `Solicitud Homologación - ${usuario.nombre_completo}`,
//       fecha_registro_solicitud: new Date().toISOString(),
//       esSeleccionado: true,
//       estado_actual: {
//         id_estado: 1,
//         estado_actual: "Pendiente",
//         fecha_registro_estado: new Date().toISOString()
//       },
//       objUsuario: {
//         ...usuario,        // 👈 reutilizamos todo lo que devolvió el login
//         //password: undefined // 🚨 si backend no acepta null, puedes eliminar esta línea
//       },
//       documentos: []
//     };

//     this.homologacionService.crearSolicitud(nuevaSolicitud).subscribe({
//       next: (respuesta) => {
//         console.log('✅ Solicitud creada:', respuesta);
//         this.listarSolicitudes();
//       },
//       error: (err) => {
//         console.error('❌ Error al crear solicitud:', err);
//       }
//     });
//   }
// }
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
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';

import { Archivo } from '../../../core/models/procesos.model';
import { RequestStatusTableComponent } from "../../../shared/components/request-status/request-status.component";
import { FileUploadComponent } from "../../../shared/components/file-upload-dialog/file-upload-dialog.component";

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
  solicitudes: any[] = [];

  usuario: any = null; // datos del usuario logueado

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // 🔑 Recuperamos usuario del localStorage
    const usuarioLS = localStorage.getItem('usuario');
    if (usuarioLS) {
      this.usuario = JSON.parse(usuarioLS);
      console.log('👤 Usuario cargado desde localStorage:', this.usuario);
    } else {
      console.warn('⚠️ No se encontró usuario en localStorage');
    }
  }

  // Se dispara cuando el FileUploadComponent notifica cambios
  onArchivosChange(archivos: Archivo[]) {
    this.archivosActuales = archivos;
    //console.log('📂 Archivos seleccionados en el padre:', this.archivosActuales);
  }

  // Validación: permitir enviar si hay archivos
  puedeEnviar(): boolean {
    return this.archivosActuales.length > 0 && !!this.usuario;
  }

  // Lógica para enviar la solicitud
  onSolicitudEnviada() {
    if (!this.usuario) {
      console.error('❌ No se puede enviar solicitud: usuario no encontrado.');
      return;
    }

    console.log('🚀 Enviando solicitud con archivos:', this.archivosActuales);

    const solicitud = {
      usuarioId: this.usuario.id, // 🔑 dinámico
      nombreUsuario: this.usuario.nombre,
      correo: this.usuario.correo,
      fecha: new Date(),
      archivos: this.archivosActuales
    };

    this.http.post('/api/solicitudes/homologacion', solicitud).subscribe({
      next: (resp) => {
        console.log('✅ Solicitud creada en backend:', resp);

        this.solicitudes.push({
          estado: 'Enviado',
          comentarios: 'En revisión',
          fecha: new Date().toLocaleDateString(),
          archivos: this.archivosActuales
        });

        // Resetear el file upload
        this.resetFileUpload = true;
        setTimeout(() => this.resetFileUpload = false, 0);
      },
      error: (err) => {
        console.error('❌ Error al enviar solicitud', err);
      }
    });
  }
}

