import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { merge } from 'rxjs';
import { CursosIntersemestralesService } from '@core/services/cursos-intersemestrales.service';
import {
  CreateCursoDTO, CursoOfertadoVerano, Docente, Materia, Salon, UpdateCursoDTO
} from '@core/models/cursos-intersemestrales.model';
import { formatearPeriodo, validarFechasCurso, calcularDuracionSemanas, ordenarPeriodos, validarPeriodo } from '@core/utils/periodo.utils';
import { NombreDocentePipe } from '@shared/pipes/nombre-docente.pipe';
import { SnackbarService } from '@core/services/snackbar.service';

export interface CursoDialogData {
  form: FormGroup;
  editando: boolean;
  titulo: string;
  cursoEditando?: CursoOfertadoVerano;
  materias?: Materia[];
  docentes?: Docente[];
  /** Edición: solo cupo, salón y estado. */
  soloEdicion?: boolean;
}

const GRUPOS = ['A', 'B', 'C', 'D'];

/** Crear un curso o editar sus campos editables. El formulario lo crea gestionar-cursos. */
@Component({
  selector: 'app-curso-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    NombreDocentePipe
  ],
  templateUrl: './curso-dialog.component.html',
  styleUrls: ['./curso-dialog.component.css']
})
export class CursoDialogComponent implements OnInit {
  dialogRef = inject<MatDialogRef<CursoDialogComponent>>(MatDialogRef);
  data = inject<CursoDialogData>(MAT_DIALOG_DATA);
  private cursosService = inject(CursosIntersemestralesService);
  private snackbar = inject(SnackbarService);

  periodos: string[] = [];
  errorFechas: string | null = null;
  duracionSemanas = 0;
  mostrarDuracion = false;

  salones: Salon[] = [];
  cargandoSalones = false;

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.cargarPeriodos();
    this.cargarSalones();

    // El formulario es del componente padre: la suscripción se corta al cerrar el diálogo
    if (!this.data.soloEdicion) {
      const form = this.data.form;
      merge(form.get('fecha_inicio')!.valueChanges, form.get('fecha_fin')!.valueChanges)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.onFechaChange());
    }
  }

  cargarSalones(): void {
    this.cargandoSalones = true;
    this.cursosService.getSalones()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (salones) => {
          this.salones = salones;
          this.cargandoSalones = false;

          // En edición, preseleccionar el salón actual del curso
          const curso = this.data.cursoEditando;
          const idSalon = curso?.id_salon || curso?.salonInfo?.id_salon;
          if (this.data.soloEdicion && idSalon) {
            this.data.form.patchValue({ id_salon: idSalon });
          }
        },
        error: () => {
          this.snackbar.error('Error al cargar la lista de salones');
          this.cargandoSalones = false;
        }
      });
  }

  /** Períodos de los últimos años en orden cronológico; al crear se preselecciona el primero. */
  private cargarPeriodos(): void {
    this.cursosService.getPeriodosRecientes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(periodos => {
        this.periodos = ordenarPeriodos(periodos, 'asc');
        if (this.periodos.length > 0 && !this.data.editando) {
          this.data.form.patchValue({ periodoAcademico: this.periodos[0] });
        }
      });
  }

  formatearPeriodo(periodo: string): string {
    return formatearPeriodo(periodo);
  }

  onFechaChange(): void {
    const fechaInicio = this.data.form.get('fecha_inicio')?.value;
    const fechaFin = this.data.form.get('fecha_fin')?.value;

    if (!fechaInicio || !fechaFin) {
      this.errorFechas = null;
      this.mostrarDuracion = false;
      return;
    }

    this.errorFechas = validarFechasCurso(fechaInicio, fechaFin);
    this.mostrarDuracion = !this.errorFechas;
    if (this.mostrarDuracion) {
      this.duracionSemanas = calcularDuracionSemanas(fechaInicio, fechaFin);
    }
  }

  guardarCurso(): void {
    if (!this.data.form.valid) {
      this.snackbar.advertencia('Por favor completa todos los campos requeridos');
      return;
    }

    if (this.data.editando && this.data.cursoEditando) {
      this.actualizar(this.data.cursoEditando.id_curso);
    } else {
      this.crear();
    }
  }

  private actualizar(idCurso: number): void {
    const formData = this.data.form.value;
    const cambios: UpdateCursoDTO = {
      cupo_estimado: formData.cupo_estimado,
      estado: formData.estado
    };
    // id_salon es lo recomendado; espacio_asignado solo para cursos antiguos sin salón
    if (formData.id_salon) {
      cambios.id_salon = Number(formData.id_salon);
    } else if (formData.espacio_asignado) {
      cambios.espacio_asignado = formData.espacio_asignado;
    }

    this.cursosService.actualizarCurso(idCurso, cambios)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackbar.exito('Curso actualizado exitosamente');
          this.dialogRef.close('guardado');
        },
        error: (err: HttpErrorResponse) => {
          const mensaje = err.error?.message
            || (typeof err.error === 'string' ? err.error : '')
            || (err.status === 400 ? 'Datos inválidos enviados al servidor' : 'Error al actualizar el curso');
          this.snackbar.error(mensaje);
          // Se cierra igual para que la lista se recargue
          this.dialogRef.close('guardado');
        }
      });
  }

  private crear(): void {
    const formValue = this.data.form.value;
    const periodoAcademico = formValue.periodoAcademico || '';
    if (!validarPeriodo(periodoAcademico)) {
      this.snackbar.error('El período académico seleccionado no tiene un formato válido. Por favor, selecciona un período del listado.');
      return;
    }

    const grupo = String(formValue.grupo || 'A').toUpperCase().trim();
    const nuevo: CreateCursoDTO = {
      id_materia: Number(formValue.id_materia),
      id_docente: Number(formValue.id_docente),
      cupo_estimado: Number(formValue.cupo_estimado),
      fecha_inicio: formValue.fecha_inicio ? new Date(formValue.fecha_inicio).toISOString() : '',
      fecha_fin: formValue.fecha_fin ? new Date(formValue.fecha_fin).toISOString() : '',
      periodoAcademico,
      grupo: GRUPOS.includes(grupo) ? grupo : 'A'
    };
    if (formValue.id_salon) {
      nuevo.id_salon = Number(formValue.id_salon);
    } else if (formValue.espacio_asignado) {
      nuevo.espacio_asignado = formValue.espacio_asignado;
    }
    if (formValue.estado) {
      nuevo.estado = formValue.estado;
    }

    this.cursosService.crearCurso(nuevo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackbar.exito('Curso creado exitosamente');
          this.dialogRef.close('guardado');
        },
        // El diálogo sigue abierto para que el usuario corrija
        error: (err: HttpErrorResponse) => {
          this.snackbar.error(this.mensajeErrorCreacion(err));
        }
      });
  }

  private mensajeErrorCreacion(err: HttpErrorResponse): string {
    if (err.status !== 400) return 'Error al crear el curso';
    const cuerpo = err.error;
    if (!cuerpo) return 'Datos inválidos enviados al servidor. Verifica que todos los campos sean correctos.';
    if (typeof cuerpo === 'string') return cuerpo;

    const mensaje: string | undefined = cuerpo.message;
    if (cuerpo.codigo === 'CURSO_DUPLICADO' || mensaje?.includes('duplicado')) {
      return (mensaje || 'Ya existe un curso con la misma materia, docente, período académico y grupo.')
        + '\n\nPuedes crear grupos diferentes (A, B, C, D) para la misma materia y docente.';
    }
    if (mensaje?.includes('período académico')) {
      this.cargarPeriodos();
      return Array.isArray(cuerpo.periodosValidos)
        ? `${mensaje}\n\nPeríodos válidos: ${cuerpo.periodosValidos.join(', ')}`
        : mensaje;
    }
    return mensaje || cuerpo.error || 'Error al crear el curso';
  }

  limpiarFormulario(): void {
    this.data.form.reset({
      estado: 'Abierto',
      cupo_estimado: 25,
      grupo: 'A'
    });
  }

  cerrarDialog(): void {
    this.dialogRef.close();
  }
}
