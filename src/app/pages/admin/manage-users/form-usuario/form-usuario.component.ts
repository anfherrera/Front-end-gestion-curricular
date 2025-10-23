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

import { UsuariosService } from '../../services/usuarios.service';
import { RolesAdminService } from '../../services/roles-admin.service';
import { ProgramasService } from '../../services/programas.service';
import { UsuarioDTOPeticion } from '../../models/usuario.interface';

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
      codigo: ['', [Validators.required, Validators.minLength(3)]],
      nombre_completo: ['', [Validators.required]],
      correo: ['', [Validators.required, Validators.email]],
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
        this.roles = data;
      },
      error: (err: any) => {
        console.error('Error al cargar roles:', err);
        this.snackBar.open('Error al cargar roles', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cargarProgramas(): void {
    this.programasService.listarProgramas().subscribe({
      next: (data) => {
        this.programas = data;
      },
      error: (err: any) => {
        console.error('Error al cargar programas:', err);
        this.snackBar.open('Error al cargar programas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  cargarUsuario(): void {
    if (!this.usuarioId) return;
    
    this.loading = true;
    this.usuariosService.buscarUsuarioPorId(this.usuarioId).subscribe({
      next: (data: any) => {
        console.log('Usuario cargado:', data);
        
        // Llenar el formulario con TODOS los datos del usuario
        this.usuarioForm.patchValue({
          codigo: data.codigo || '',
          nombre_completo: data.nombre_completo || '',
          correo: data.correo || '',
          estado_usuario: data.estado_usuario !== undefined ? data.estado_usuario : 1,
          id_rol: data.objRol?.id_rol || data.rol?.id_rol || '',
          id_programa: data.objPrograma?.id_programa || data.programa?.id_programa || ''
        });
        
        // NO llenar el campo password para que quede vacío (indicando que no se cambiará)
        this.usuarioForm.get('password')?.setValue('');
        
        this.loading = false;
        
        // Mostrar mensaje informativo
        this.snackBar.open('Usuario cargado correctamente. Modifique los campos que desee actualizar.', 'Cerrar', { duration: 4000 });
      },
      error: (err: any) => {
        console.error('Error al cargar usuario:', err);
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
    
    const usuarioData: UsuarioDTOPeticion = {
      codigo: formValue.codigo,
      nombre_completo: formValue.nombre_completo,
      correo: formValue.correo,
      estado_usuario: formValue.estado_usuario,
      objRol: { id_rol: +formValue.id_rol },
      objPrograma: { id_programa: +formValue.id_programa }
    };

    // Solo agregar password si se proporcionó
    if (formValue.password && formValue.password.trim() !== '') {
      usuarioData.password = formValue.password;
    }

    if (this.isEditMode && this.usuarioId) {
      usuarioData.id_usuario = this.usuarioId;
      this.actualizarUsuario(usuarioData);
    } else {
      // Al crear, la contraseña es obligatoria
      if (!formValue.password) {
        this.snackBar.open('La contraseña es obligatoria al crear un usuario', 'Cerrar', { duration: 3000 });
        this.loading = false;
        return;
      }
      this.crearUsuario(usuarioData);
    }
  }

  crearUsuario(data: UsuarioDTOPeticion): void {
    this.usuariosService.crearUsuario(data).subscribe({
      next: () => {
        this.snackBar.open('Usuario creado exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin/manage-users']);
      },
      error: (err: any) => {
        console.error('Error al crear usuario:', err);
        const mensaje = err.error?.mensaje || 'Error al crear usuario';
        this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  actualizarUsuario(data: UsuarioDTOPeticion): void {
    this.usuariosService.actualizarUsuario(data).subscribe({
      next: () => {
        this.snackBar.open('Usuario actualizado exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin/manage-users']);
      },
      error: (err: any) => {
        console.error('Error al actualizar usuario:', err);
        const mensaje = err.error?.mensaje || 'Error al actualizar usuario';
        this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/manage-users']);
  }
}

