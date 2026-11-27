import { ChangeDetectionStrategy, Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { HttpErrorResponse } from '@angular/common/http';

import { UsuariosService } from '@features/admin/services/usuarios.service';
import { RolesAdminService } from '@features/admin/services/roles-admin.service';
import { ProgramasService } from '@core/services/programas.service';
import { corregirEncodingObjeto } from '@core/utils/encoding.utils';
import { SnackbarService } from '@core/services/snackbar.service';
import { UsuarioDTOPeticion } from '@core/models/usuario.interface';
import { RolDTORespuesta } from '@core/models/rol.interface';
import { ProgramaDTORespuesta } from '@core/models/programa.interface';

@Component({
  selector: 'app-form-usuario',
  imports: [
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  templateUrl: './form-usuario.component.html',
  styleUrls: ['./form-usuario.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormUsuarioComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);
  private rolesService = inject(RolesAdminService);
  private programasService = inject(ProgramasService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private snackbar = inject(SnackbarService);

  usuarioForm: FormGroup;
  readonly isEditMode = signal(false);
  readonly usuarioId = signal<number | undefined>(undefined);
  readonly loading = signal(false);
  readonly roles = signal<RolDTORespuesta[]>([]);
  readonly programas = signal<ProgramaDTORespuesta[]>([]);

  constructor() {
    this.usuarioForm = this.fb.group({
      codigo: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      nombre_completo: ['', [Validators.required, Validators.minLength(3)]],
      correo: [
        '',
        [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@unicauca\.edu\.co$/)],
      ],
      password: ['', [Validators.required, Validators.minLength(6)]],
      estado_usuario: [1, Validators.required],
      id_rol: ['', Validators.required],
      id_programa: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.cargarRoles();
    this.cargarProgramas();

    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.usuarioId.set(+params['id']);
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
        this.roles.set(corregirEncodingObjeto(data));
      },
      error: () => {
        this.snackbar.error('Error al cargar roles');
      },
    });
  }

  cargarProgramas(): void {
    this.programasService.listarProgramas().subscribe({
      next: (data) => {
        this.programas.set(corregirEncodingObjeto(data));
      },
      error: () => {
        this.snackbar.error('Error al cargar programas');
      },
    });
  }

  cargarUsuario(): void {
    const usuarioId = this.usuarioId();
    if (!usuarioId) return;

    this.loading.set(true);
    this.usuariosService.buscarUsuarioPorId(usuarioId).subscribe({
      next: (data) => {
        // Corregir encoding de tildes y caracteres especiales
        const usuarioCorregido = corregirEncodingObjeto(data);

        // Llenar el formulario con TODOS los datos del usuario
        this.usuarioForm.patchValue({
          codigo: usuarioCorregido.codigo || '',
          nombre_completo: usuarioCorregido.nombre_completo || '',
          correo: usuarioCorregido.correo || '',
          // El backend manda un booleano y el select usa 1 y 0
          estado_usuario: usuarioCorregido.estado_usuario === false ? 0 : 1,
          id_rol: usuarioCorregido.rol?.id_rol || '',
          id_programa: usuarioCorregido.objPrograma?.id_programa || '',
        });

        // NO llenar el campo password para que quede vacío (indicando que no se cambiará)
        this.usuarioForm.get('password')?.setValue('');

        this.loading.set(false);

        // Mostrar mensaje informativo
        this.snackbar.exito('Usuario cargado correctamente. Modifique los campos que desee actualizar.');
      },
      error: () => {
        this.snackbar.error('Error al cargar usuario');
        this.router.navigate(['/admin/manage-users']);
        this.loading.set(false);
      },
    });
  }

  guardar(): void {
    if (this.usuarioForm.invalid) {
      this.usuarioForm.markAllAsTouched();
      this.snackbar.advertencia('Por favor complete todos los campos requeridos');
      return;
    }

    this.loading.set(true);
    const formValue = this.usuarioForm.value;

    const usuarioData: UsuarioDTOPeticion = {
      codigo: formValue.codigo,
      cedula: formValue.codigo, // Usar el mismo valor de codigo para cedula
      nombre_completo: formValue.nombre_completo,
      correo: formValue.correo,
      estado_usuario: formValue.estado_usuario === 1 || formValue.estado_usuario === true,
      id_rol: +formValue.id_rol, // Solo el ID (número)
      id_programa: +formValue.id_programa, // Solo el ID (número)
    };

    // Password solo si tiene contenido
    if (formValue.password && formValue.password.trim() !== '') {
      usuarioData.password = formValue.password;
    }

    // ID solo al actualizar
    const usuarioId = this.usuarioId();
    if (this.isEditMode() && usuarioId) {
      usuarioData.id_usuario = usuarioId;
    }

    // JSON enviado

    if (this.isEditMode() && usuarioId) {
      this.actualizarUsuario(usuarioData);
    } else {
      // Al crear, validar que la contraseña esté presente
      if (!formValue.password || formValue.password.trim() === '') {
        this.snackbar.advertencia('La contraseña es obligatoria al crear un usuario');
        this.loading.set(false);
        return;
      }
      this.crearUsuario(usuarioData);
    }
  }

  private crearUsuario(data: UsuarioDTOPeticion): void {
    this.usuariosService.crearUsuario(data).subscribe({
      next: () => {
        // Usuario creado
        this.snackbar.exito('Usuario creado exitosamente');
        this.router.navigate(['/admin/manage-users']);
      },
      error: (err: HttpErrorResponse) => {
        const mensaje = err.error?.message || err.error?.mensaje || err.message || 'Error desconocido';
        this.snackbar.error('Error: ' + mensaje);
        this.loading.set(false);
      },
    });
  }

  private actualizarUsuario(data: UsuarioDTOPeticion): void {
    this.usuariosService.actualizarUsuario(data).subscribe({
      next: () => {
        // Usuario actualizado
        this.snackbar.exito('Usuario actualizado exitosamente');
        this.router.navigate(['/admin/manage-users']);
      },
      error: (err: HttpErrorResponse) => {
        const mensaje = err.error?.message || err.error?.mensaje || err.message || 'Error desconocido';
        this.snackbar.error('Error: ' + mensaje);
        this.loading.set(false);
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/manage-users']);
  }
}
