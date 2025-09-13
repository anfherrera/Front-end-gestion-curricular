
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
// }
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-homologacion-asignaturas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule],
  templateUrl: './homologacion-asignaturas.component.html',
  styleUrls: ['./homologacion-asignaturas.component.css']
})
export class HomologacionAsignaturasComponent implements OnInit {
  solicitudes: any[] = [];

  constructor(
    private homologacionService: HomologacionAsignaturasService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.listarSolicitudes();
  }

  listarSolicitudes(): void {
    this.homologacionService.listarSolicitudes().subscribe({
      next: (data) => this.solicitudes = data,
      error: (err) => console.error('Error al listar solicitudes', err)
    });
  }

  crearSolicitud(): void {
    const usuario = this.authService.getUsuario(); // 👈 viene del login

    if (!usuario) {
      console.error('No hay usuario en sesión');
      return;
    }

    const nuevaSolicitud = {
      nombre_solicitud: `Solicitud Homologación - ${usuario.nombre_completo}`,
      fecha_registro_solicitud: new Date().toISOString(),
      esSeleccionado: true,
      estado_actual: {
        id_estado: 1,
        estado_actual: "Pendiente",
        fecha_registro_estado: new Date().toISOString()
      },
      objUsuario: {
        ...usuario,        // 👈 reutilizamos todo lo que devolvió el login
        //password: undefined // 🚨 si backend no acepta null, puedes eliminar esta línea
      },
      documentos: []
    };

    this.homologacionService.crearSolicitud(nuevaSolicitud).subscribe({
      next: (respuesta) => {
        console.log('✅ Solicitud creada:', respuesta);
        this.listarSolicitudes();
      },
      error: (err) => {
        console.error('❌ Error al crear solicitud:', err);
      }
    });
  }
}
