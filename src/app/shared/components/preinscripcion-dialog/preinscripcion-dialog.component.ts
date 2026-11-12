import { Component, DestroyRef, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MATERIAL_IMPORTS } from '../material.imports';
import { CursosIntersemestralesService } from '../../../core/services/cursos-intersemestrales.service';
import { CursoOfertadoVerano, CreatePreinscripcionDTO, CondicionSolicitudVerano } from '../../../core/models/cursos-intersemestrales.model';
import { UsuarioSesion } from '../../../core/models/usuario-sesion.model';
import { AuthService } from '../../../core/services/auth.service';
import { snackbarConfig } from '../../../core/design-system/design-tokens';
import { CONDICIONES_POR_DEFECTO, nombreCondicion, nombreDocente } from '../../../core/utils/cursos-verano.utils';

export interface PreinscripcionDialogData {
  curso: CursoOfertadoVerano;
}

/** Mensajes según el código de error que envía el backend. */
const ERRORES_POR_CODIGO: Record<string, string> = {
  DUPLICATE_PREINSCRIPTION: 'Ya tienes una preinscripción activa para este curso.',
  COURSE_NOT_AVAILABLE: 'Este curso no está disponible para preinscripción.',
  NO_CUPOS_AVAILABLE: 'No hay cupos disponibles para este curso.'
};

@Component({
  selector: 'app-preinscripcion-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './preinscripcion-dialog.component.html',
  styleUrls: ['./preinscripcion-dialog.component.css']
})
export class PreinscripcionDialogComponent implements OnInit {
  preinscripcionForm!: FormGroup;
  loading = false;
  usuario: UsuarioSesion | null = null;
  condiciones: CondicionSolicitudVerano[] = [];

  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PreinscripcionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PreinscripcionDialogData,
    private cursosService: CursosIntersemestralesService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.preinscripcionForm = this.fb.group({
      nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
      codigo: ['', [Validators.required, Validators.minLength(5)]],
      condicion: ['', [Validators.required]]
    });

    this.usuario = this.authService.getUsuario();
    if (this.usuario) {
      this.preinscripcionForm.patchValue({
        nombreCompleto: this.usuario.nombre_completo,
        codigo: this.usuario.codigo || ''
      });
    }

    this.cursosService.getCondicionesSolicitud()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (condiciones) => this.condiciones = condiciones,
        error: () => this.condiciones = CONDICIONES_POR_DEFECTO
      });
  }

  onSubmitPreinscripcion(): void {
    if (!this.preinscripcionForm.valid || !this.usuario) {
      this.preinscripcionForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formData = this.preinscripcionForm.value;
    const nombre = (this.usuario.nombre_completo || formData.nombreCompleto || '').trim() || 'Usuario';
    const payload: CreatePreinscripcionDTO = {
      idUsuario: this.usuario.id_usuario,
      idCurso: this.data.curso.id_curso,
      nombreSolicitud: `Solicitud Preinscripción - ${nombre}`,
      condicion: formData.condicion
    };

    this.cursosService.crearPreinscripcion(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('¡Preinscripción enviada exitosamente!', 'Cerrar', snackbarConfig(['success-snackbar']));
          this.dialogRef.close(true);
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          const mensaje = ERRORES_POR_CODIGO[error.error?.codigo]
            ?? (error.status === 400 ? 'Datos inválidos. Verifica la información e inténtalo de nuevo.'
              : error.status === 500 ? 'Error del servidor. Inténtalo más tarde.'
              : 'Error al enviar la preinscripción. Inténtalo de nuevo.');
          this.snackBar.open(mensaje, 'Cerrar', snackbarConfig(['error-snackbar']));
        }
      });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getCondicionDisplayName(condicion: CondicionSolicitudVerano): string {
    return nombreCondicion(condicion);
  }

  obtenerNombreDocente(curso: CursoOfertadoVerano): string {
    return nombreDocente(curso);
  }
}
