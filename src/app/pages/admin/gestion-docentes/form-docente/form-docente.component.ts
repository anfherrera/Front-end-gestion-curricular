import { ChangeDetectionStrategy, Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

import { DocentesService } from '@core/services/docentes.service';
import { DocenteDTOPeticion } from '@core/models/docente.interface';
import { SnackbarService } from '@core/services/snackbar.service';

@Component({
  selector: 'app-form-docente',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  templateUrl: './form-docente.component.html',
  styleUrls: ['./form-docente.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormDocenteComponent implements OnInit {
  private fb = inject(FormBuilder);
  private docentesService = inject(DocentesService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private snackbar = inject(SnackbarService);

  docenteForm: FormGroup;
  readonly isEditMode = signal(false);
  docenteId?: number;
  readonly loading = signal(false);

  constructor() {
    this.docenteForm = this.fb.group({
      codigo_docente: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(12)]],
      nombre_docente: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    });
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params['id']) {
        this.isEditMode.set(true);
        this.docenteId = +params['id'];
        this.cargarDocente();
      }
    });
  }

  cargarDocente(): void {
    if (!this.docenteId) return;

    this.loading.set(true);
    this.docentesService.buscarDocentePorId(this.docenteId).subscribe({
      next: (data) => {
        this.docenteForm.patchValue({
          codigo_docente: data.codigo_docente,
          nombre_docente: data.nombre_docente,
        });
        this.loading.set(false);
      },
      error: () => {
        this.snackbar.error('Error al cargar los datos del docente');
        this.router.navigate(['/admin/docentes']);
        this.loading.set(false);
      },
    });
  }

  guardar(): void {
    if (this.docenteForm.invalid) {
      this.docenteForm.markAllAsTouched();
      this.snackbar.advertencia('Por favor completa todos los campos correctamente');
      return;
    }

    this.loading.set(true);

    const docenteData: DocenteDTOPeticion = {
      ...this.docenteForm.value,
    };

    if (this.isEditMode() && this.docenteId) {
      docenteData.id_docente = this.docenteId;
      this.actualizarDocente(docenteData);
    } else {
      this.crearDocente(docenteData);
    }
  }

  crearDocente(data: DocenteDTOPeticion): void {
    this.docentesService.crearDocente(data).subscribe({
      next: () => {
        this.snackbar.exito('Docente creado exitosamente');
        this.router.navigate(['/admin/docentes']);
      },
      error: (err) => {
        const mensaje = err.error?.mensaje || 'Error al crear el docente';
        this.snackbar.error(mensaje);
        this.loading.set(false);
      },
    });
  }

  actualizarDocente(data: DocenteDTOPeticion): void {
    this.docentesService.actualizarDocente(data).subscribe({
      next: () => {
        this.snackbar.exito('Docente actualizado exitosamente');
        this.router.navigate(['/admin/docentes']);
      },
      error: (err) => {
        const mensaje = err.error?.mensaje || 'Error al actualizar el docente';
        this.snackbar.error(mensaje);
        this.loading.set(false);
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/docentes']);
  }

  // Getters para acceder a los controles del formulario fácilmente
  get codigoDocente() {
    return this.docenteForm.get('codigo_docente');
  }

  get nombreDocente() {
    return this.docenteForm.get('nombre_docente');
  }
}
