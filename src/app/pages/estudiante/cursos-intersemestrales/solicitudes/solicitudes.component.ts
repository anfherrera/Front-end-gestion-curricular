import { Component, DestroyRef, OnInit, inject } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import { MATERIAL_IMPORTS } from '@shared/components/material.imports';
import { CursosIntersemestralesService } from '@core/services/cursos-intersemestrales.service';
import { Materia, CondicionSolicitudVerano, CreateSolicitudCursoNuevoDTO } from '@core/models/cursos-intersemestrales.model';
import { UsuarioSesion } from '@core/models/usuario-sesion.model';
import { AuthService } from '@core/services/auth.service';
import { NotificacionesService } from '@core/services/notificaciones.service';
import { CONDICIONES_POR_DEFECTO, nombreCondicion } from '@core/utils/cursos-verano.utils';
import { SnackbarService } from '@core/services/snackbar.service';

const ERRORES_ENVIO: Record<number, string> = {
  400: 'Datos inválidos. Verifica la información e inténtalo de nuevo.',
  401: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
  403: 'No tienes permisos para realizar esta acción.',
  500: 'Error del servidor. Por favor, verifica los datos e inténtalo de nuevo.'
};

/** Solicitud de apertura de un curso intersemestral nuevo. */
@Component({
  selector: 'app-solicitudes',
  imports: [CardContainerComponent, ReactiveFormsModule, ...MATERIAL_IMPORTS],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.css']
})
export class SolicitudesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private cursosService = inject(CursosIntersemestralesService);
  private authService = inject(AuthService);
  private snackbar = inject(SnackbarService);
  private notificacionesService = inject(NotificacionesService);

  solicitudForm!: FormGroup;
  loading = false;
  solicitudEnviada = false;

  materiasDisponibles: Materia[] = [];
  condiciones: CondicionSolicitudVerano[] = [];
  usuario: UsuarioSesion | null = null;

  private destroyRef = inject(DestroyRef);

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
        error: () => this.snackbar.error('Error al cargar las materias disponibles')
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
          this.snackbar.exito('¡Solicitud enviada exitosamente!');
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          const mensaje = ERRORES_ENVIO[error.status] ?? 'Error al enviar la solicitud. Inténtalo de nuevo.';
          this.snackbar.error(mensaje);
        }
      });
  }

  onClearForm(): void {
    this.solicitudForm.reset();
    this.solicitudEnviada = false;
    this.loadUserData();
    this.snackbar.info('Formulario limpiado');
  }

  getCondicionDisplayName(condicion: CondicionSolicitudVerano): string {
    return nombreCondicion(condicion);
  }
}
