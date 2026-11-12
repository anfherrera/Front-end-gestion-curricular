import { Component, DestroyRef, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CursosIntersemestralesService } from '../../../core/services/cursos-intersemestrales.service';
import { CreateInscripcionDTO, PreinscripcionSeguimiento } from '../../../core/models/cursos-intersemestrales.model';
import { UsuarioSesion } from '../../../core/models/usuario-sesion.model';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { MATERIAL_IMPORTS } from '../material.imports';
import { snackbarConfig } from '../../../core/design-system/design-tokens';
import { mensajeDeError } from '../../../core/utils/http-error.utils';

export interface InscripcionModalData {
  preinscripcion: Pick<PreinscripcionSeguimiento, 'cursoId' | 'curso' | 'estado' | 'estadoCurso'>;
}

const TAMANO_MAXIMO = 15 * 1024 * 1024; // 15 MB

/** Mensajes por código HTTP al crear la inscripción (400 usa el mensaje del backend). */
const ERRORES_INSCRIPCION: Record<number, string> = {
  0: 'Error de conexión: No se puede conectar al servidor. Verifica que el backend esté ejecutándose en el puerto 5000.',
  401: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
  403: 'No tienes permisos para realizar esta acción.',
  500: 'Error interno del servidor. Por favor, contacta al administrador.'
};

/**
 * Inscripción a un curso con preinscripción aprobada: crea la inscripción y
 * después sube el comprobante de pago.
 */
@Component({
  selector: 'app-inscripcion-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './inscripcion-modal.component.html',
  styleUrls: ['./inscripcion-modal.component.css']
})
export class InscripcionModalComponent implements OnInit {
  inscripcionForm!: FormGroup;
  archivoSeleccionado: File | null = null;
  cargando = false;
  usuario: UsuarioSesion | null = null;
  errorArchivo: string | null = null;

  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<InscripcionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InscripcionModalData,
    private cursosService: CursosIntersemestralesService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private notificacionesService: NotificacionesService
  ) {
    this.inscripcionForm = this.fb.group({
      nombreCompleto: ['', Validators.required],
      codigo: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario();
    this.inscripcionForm.patchValue({
      nombreCompleto: this.usuario?.nombre_completo || 'Usuario no identificado',
      codigo: this.usuario?.codigo || 'Sin código'
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.errorArchivo = null;
    if (!file) return;

    if (file.type !== 'application/pdf') {
      this.rechazarArchivo('Solo se permiten archivos PDF');
      return;
    }
    if (file.size > TAMANO_MAXIMO) {
      const mb = (file.size / (1024 * 1024)).toFixed(2);
      this.rechazarArchivo(`El archivo es muy grande (${mb} MB). El límite máximo es 15 MB.`);
      return;
    }
    this.archivoSeleccionado = file;
  }

  private rechazarArchivo(mensaje: string): void {
    this.errorArchivo = mensaje;
    this.snackBar.open(mensaje, 'Cerrar', snackbarConfig(['warning-snackbar']));
  }

  onSubmit(): void {
    if (this.inscripcionForm.invalid) {
      this.snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', snackbarConfig(['warning-snackbar']));
      return;
    }
    if (!this.archivoSeleccionado) {
      this.snackBar.open('Debes subir el comprobante de pago (PDF)', 'Cerrar', snackbarConfig(['warning-snackbar']));
      return;
    }
    if (!this.usuario) return;

    this.cargando = true;
    this.verificarPreinscripcionAprobada(this.usuario);
  }

  /** Solo se puede inscribir quien tiene la preinscripción de este curso aprobada por un funcionario. */
  private verificarPreinscripcionAprobada(usuario: UsuarioSesion): void {
    this.cursosService.getPreinscripcionesUsuario(usuario.id_usuario)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (todas) => {
          const delCurso = (todas || []).filter(p => p.cursoId === this.data.preinscripcion.cursoId);
          if (delCurso.some(p => p.estado === 'Aprobado')) {
            this.crearInscripcion(usuario);
            return;
          }
          this.cargando = false;
          this.snackBar.open(
            delCurso.length > 0
              ? 'Tu preinscripción aún no ha sido aprobada. Podrás inscribirte cuando un funcionario la apruebe.'
              : 'No tienes una preinscripción para este curso. Preinscríbete primero desde "Cursos para preinscripción".',
            'Cerrar',
            snackbarConfig(['warning-snackbar'])
          );
        },
        error: (error) => {
          this.cargando = false;
          this.snackBar.open(
            mensajeDeError(error, 'No se pudo verificar tu preinscripción. Por favor, inténtalo de nuevo.'),
            'Cerrar',
            snackbarConfig(['error-snackbar'])
          );
        }
      });
  }

  private crearInscripcion(usuario: UsuarioSesion): void {
    const nombreUsuario = (usuario.nombre_completo || '').trim() || 'Usuario';
    const payload: CreateInscripcionDTO = {
      idUsuario: usuario.id_usuario,
      idCurso: this.data.preinscripcion.cursoId,
      nombreSolicitud: `Solicitud Inscripción - ${nombreUsuario}`
    };

    this.cursosService.crearInscripcion(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (inscripcion) => this.subirComprobante(inscripcion.id_solicitud),
        error: (error: HttpErrorResponse) => {
          this.cargando = false;
          const mensaje = error.status === 400
            ? `Error del servidor: ${error.error?.message || error.error?.error || 'Datos inválidos'}`
            : ERRORES_INSCRIPCION[error.status] ?? 'Error al crear la inscripción. Por favor, inténtalo de nuevo.';
          this.snackBar.open(mensaje, 'Cerrar', snackbarConfig(['error-snackbar']));
        }
      });
  }

  /** La inscripción ya existe: aunque falle la subida, el modal se cierra con éxito. */
  private subirComprobante(inscripcionId: number): void {
    if (!this.archivoSeleccionado) return;

    this.cursosService.subirComprobantePago(this.archivoSeleccionado, inscripcionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.terminar(
          `Inscripción exitosa en ${this.data.preinscripcion.curso}. Comprobante de pago subido correctamente.`, 'success-snackbar'),
        error: () => this.terminar(
          'Inscripción creada exitosamente. Hubo un problema técnico al subir el comprobante de pago. Contacta al administrador para subirlo manualmente.',
          'warning-snackbar')
      });
  }

  private terminar(mensaje: string, clase: string): void {
    this.notificacionesService.actualizarNotificaciones();
    this.cargando = false;
    this.snackBar.open(mensaje, 'Cerrar', snackbarConfig([clase]));
    this.dialogRef.close(true);
  }

  onCancelar(): void {
    this.dialogRef.close(false);
  }

  getFileName(): string {
    return this.archivoSeleccionado ? this.archivoSeleccionado.name : 'Ningún archivo seleccionado';
  }

  get isFormValid(): boolean {
    return this.inscripcionForm.valid && this.archivoSeleccionado !== null;
  }
}
