import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';

import { UsuariosService } from '../../../../core/services/usuarios.service';
import { RolesAdminService } from '../../../../core/services/roles-admin.service';
import { ProgramasService } from '../../../../core/services/programas.service';
import { UsuarioDTOPeticion } from '../../../../core/models/usuario.interface';
import { corregirEncodingObjeto } from '../../../../core/utils/encoding.utils';

@Component({
  selector: 'app-form-usuario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule
  ],
  templateUrl: './form-usuario.component.html',
  styleUrls: ['./form-usuario.component.css']
})
export class FormUsuarioComponent implements OnInit {
  usuarioForm: FormGroup;
  isEditMode = false;
  usuarioId?: number;
  loading = false;
  roles: any[] = [];
  programas: any[] = [];

  constructor(
    private fb: FormBuilder,
    private usuariosService: UsuariosService,
    private rolesService: RolesAdminService,
    private programasService: ProgramasService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.usuarioForm = this.fb.group({
      codigo: ['', [
        Validators.required, 
        Validators.minLength(3),
        Validators.maxLength(50)
      ]],
      nombre_completo: ['', [
        Validators.required,
        Validators.minLength(3)
      ]],
      correo: ['', [
        Validators.required, 
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@unicauca\.edu\.co$/)
      ]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      estado_usuario: [1, Validators.required],
      id_rol: ['', Validators.required],
      id_programa: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarRoles();
    this.cargarProgramas();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.usuarioId = +params['id'];
        // En edición, password es opcional
        this.usuarioForm.get('password')?.clearValidators();
        this.usuarioForm.get('password')?.updateValueAndValidity();
        this.cargarUsuario();
      }
    });
  }

  cargarRoles(): void {
    this.rolesService.listarRoles().subscribe({
      next: (data) => {
        this.roles = corregirEncodingObjeto(data);
      },
      error: (err: any) => {
        this.snackBar.open('Error al cargar roles', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cargarProgramas(): void {
    this.programasService.listarProgramas().subscribe({
      next: (data) => {
        this.programas = corregirEncodingObjeto(data);
      },
      error: (err: any) => {
        this.snackBar.open('Error al cargar programas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cargarUsuario(): void {
    if (!this.usuarioId) return;
    
    this.loading = true;
    this.usuariosService.buscarUsuarioPorId(this.usuarioId).subscribe({
      next: (data: any) => {
        // Corregir encoding de tildes y caracteres especiales
        const usuarioCorregido = corregirEncodingObjeto(data);
        
        // Llenar el formulario con TODOS los datos del usuario
        this.usuarioForm.patchValue({
          codigo: usuarioCorregido.codigo || '',
          nombre_completo: usuarioCorregido.nombre_completo || '',
          correo: usuarioCorregido.correo || '',
          estado_usuario: usuarioCorregido.estado_usuario !== undefined ? usuarioCorregido.estado_usuario : 1,
          id_rol: usuarioCorregido.objRol?.id_rol || usuarioCorregido.rol?.id_rol || '',
          id_programa: usuarioCorregido.objPrograma?.id_programa || usuarioCorregido.programa?.id_programa || ''
        });
        
        // NO llenar el campo password para que quede vacío (indicando que no se cambiará)
        this.usuarioForm.get('password')?.setValue('');
        
        this.loading = false;
        
        // Mostrar mensaje informativo
        this.snackBar.open('Usuario cargado correctamente. Modifique los campos que desee actualizar.', 'Cerrar', { duration: 4000 });
      },
      error: (err: any) => {
        this.snackBar.open('Error al cargar usuario', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin/manage-users']);
        this.loading = false;
      }
    });
  }

  guardar(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', { duration: 3000 });
      return;
    }

    this.loading = true;
    const formValue = this.usuarioForm.value;
    
    // FORMATO SIMPLE - SOLO IDs (backend actualizado)
    const usuarioData: any = {
      codigo: formValue.codigo,
      cedula: formValue.codigo,  // Usar el mismo valor de codigo para cedula
      nombre_completo: formValue.nombre_completo,
      correo: formValue.correo,
      estado_usuario: formValue.estado_usuario === 1 || formValue.estado_usuario === true,
      id_rol: +formValue.id_rol,           // Solo el ID (número)
      id_programa: +formValue.id_programa  // Solo el ID (número)
    };

    // Password solo si tiene contenido
    if (formValue.password && formValue.password.trim() !== '') {
      usuarioData.password = formValue.password;
    }

    // ID solo al actualizar
    if (this.isEditMode && this.usuarioId) {
      usuarioData.id_usuario = this.usuarioId;
    }

    // JSON enviado

    if (this.isEditMode && this.usuarioId) {
      this.actualizarUsuario(usuarioData);
    } else {
      // Al crear, validar que la contraseña esté presente
      if (!formValue.password || formValue.password.trim() === '') {
        this.snackBar.open('La contraseña es obligatoria al crear un usuario', 'Cerrar', { duration: 3000 });
        this.loading = false;
        return;
      }
      this.crearUsuario(usuarioData);
    }
  }

  private crearUsuario(data: any): void {
    this.usuariosService.crearUsuario(data).subscribe({
      next: (response) => {
        // Usuario creado
        this.snackBar.open('Usuario creado exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin/manage-users']);
      },
      error: (err: any) => {
        const mensaje = err.error?.message || err.error?.mensaje || err.message || 'Error desconocido';
        this.snackBar.open('Error: ' + mensaje, 'Cerrar', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  private actualizarUsuario(data: any): void {
    this.usuariosService.actualizarUsuario(data).subscribe({
      next: (response) => {
        // Usuario actualizado
        this.snackBar.open('Usuario actualizado exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin/manage-users']);
      },
      error: (err: any) => {
        const mensaje = err.error?.message || err.error?.mensaje || err.message || 'Error desconocido';
        this.snackBar.open('Error: ' + mensaje, 'Cerrar', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/manage-users']);
  }
}

