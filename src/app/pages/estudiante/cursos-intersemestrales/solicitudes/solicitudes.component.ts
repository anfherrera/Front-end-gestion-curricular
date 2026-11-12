import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { MATERIAL_IMPORTS } from '../../../../shared/components/material.imports';
import { CursosIntersemestralesService } from '../../../../core/services/cursos-intersemestrales.service';
import { Materia, CondicionSolicitudVerano, CreateSolicitudCursoNuevoDTO } from '../../../../core/models/cursos-intersemestrales.model';
import { UsuarioSesion } from '../../../../core/models/usuario-sesion.model';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificacionesService } from '../../../../core/services/notificaciones.service';
import { snackbarConfig } from '../../../../core/design-system/design-tokens';
import { CONDICIONES_POR_DEFECTO, nombreCondicion } from '../../../../core/utils/cursos-verano.utils';

const ERRORES_ENVIO: Record<number, string> = {
  400: 'Datos inválidos. Verifica la información e inténtalo de nuevo.',
  401: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
  403: 'No tienes permisos para realizar esta acción.',
  500: 'Error del servidor. Por favor, verifica los datos e inténtalo de nuevo.'
};

/** Solicitud de apertura de un curso intersemestral nuevo. */
@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, CardContainerComponent, ReactiveFormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.css']
})
export class SolicitudesComponent implements OnInit {
  solicitudForm!: FormGroup;
  loading = false;
  solicitudEnviada = false;

  materiasDisponibles: Materia[] = [];
  condiciones: CondicionSolicitudVerano[] = [];
  usuario: UsuarioSesion | null = null;

  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private cursosService: CursosIntersemestralesService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private notificacionesService: NotificacionesService
  ) {}

  ngOnInit(): void {
    this.solicitudForm = this.fb.group({
      nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
      codigo: ['', [Validators.required, Validators.minLength(5)]],
      curso: ['', [Validators.required]],
      condicion: ['', [Validators.required]]
    });
    this.loadUserData();

    this.cursosService.getMateriasDisponibles()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (materias) => this.materiasDisponibles = materias,
        error: () => this.snackBar.open('Error al cargar las materias disponibles', 'Cerrar', snackbarConfig(['error-snackbar']))
      });

    this.cursosService.getCondicionesSolicitud()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (condiciones) => this.condiciones = condiciones,
        error: () => this.condiciones = CONDICIONES_POR_DEFECTO
      });
  }

  private loadUserData(): void {
    this.usuario = this.authService.getUsuario();
    if (this.usuario) {
      this.solicitudForm.patchValue({
        nombreCompleto: this.usuario.nombre_completo,
        codigo: this.usuario.codigo || ''
      });
    }
  }

  onSubmitSolicitud(): void {
    const usuario = this.usuario;
    if (!this.solicitudForm.valid || !usuario) {
      this.solicitudForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formData = this.solicitudForm.value;
    const payload: CreateSolicitudCursoNuevoDTO = {
      nombreCompleto: formData.nombreCompleto,
      codigo: formData.codigo,
      curso: formData.curso,
      condicion: formData.condicion,
      idUsuario: usuario.id_usuario
    };

    this.cursosService.crearSolicitudCursoNuevo(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading = false;
          this.solicitudEnviada = true;
          this.solicitudForm.reset();
          this.loadUserData();
          this.notificacionesService.actualizarNotificaciones();
          this.snackBar.open('¡Solicitud enviada exitosamente!', 'Cerrar', snackbarConfig(['success-snackbar']));
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          const mensaje = ERRORES_ENVIO[error.status] ?? 'Error al enviar la solicitud. Inténtalo de nuevo.';
          this.snackBar.open(mensaje, 'Cerrar', snackbarConfig(['error-snackbar']));
        }
      });
  }

  onClearForm(): void {
    this.solicitudForm.reset();
    this.solicitudEnviada = false;
    this.loadUserData();
    this.snackBar.open('Formulario limpiado', 'Cerrar', snackbarConfig());
  }

  getCondicionDisplayName(condicion: CondicionSolicitudVerano): string {
    return nombreCondicion(condicion);
  }
}
