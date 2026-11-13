import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

import { ProgramasService } from '@core/services/programas.service';
import { ProgramaDTOPeticion } from '@core/models/programa.interface';
import { SnackbarService } from '@core/services/snackbar.service';

@Component({
  selector: 'app-form-programa',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule
],
  templateUrl: './form-programa.component.html',
  styleUrls: ['./form-programa.component.css']
})
export class FormProgramaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private programasService = inject(ProgramasService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private snackbar = inject(SnackbarService);

  programaForm: FormGroup;
  isEditMode = false;
  programaId?: number;
  loading = false;

  constructor() {
    this.programaForm = this.fb.group({
      codigo: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(10)
      ]],
      nombre_programa: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(150)
      ]]
    });
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.programaId = +params['id'];
        this.cargarPrograma();
      }
    });
  }

  cargarPrograma(): void {
    if (!this.programaId) return;

    this.loading = true;
    this.programasService.buscarProgramaPorId(this.programaId).subscribe({
      next: (data) => {
        this.programaForm.patchValue({
          codigo: data.codigo,
          nombre_programa: data.nombre_programa
        });
        this.loading = false;
      },
      error: () => {
        this.snackbar.error('Error al cargar los datos del programa');
        this.router.navigate(['/admin/programas']);
        this.loading = false;
      }
    });
  }

  guardar(): void {
    if (this.programaForm.invalid) {
      this.programaForm.markAllAsTouched();
      this.snackbar.advertencia('Por favor completa todos los campos correctamente');
      return;
    }

    this.loading = true;
    
    const programaData: ProgramaDTOPeticion = {
      ...this.programaForm.value
    };

    if (this.isEditMode && this.programaId) {
      programaData.id_programa = this.programaId;
      this.actualizarPrograma(programaData);
    } else {
      this.crearPrograma(programaData);
    }
  }

  crearPrograma(data: ProgramaDTOPeticion): void {
    this.programasService.crearPrograma(data).subscribe({
      next: () => {
        this.snackbar.exito('Programa creado exitosamente');
        this.router.navigate(['/admin/programas']);
      },
      error: (err) => {
        const mensaje = err.error?.mensaje || 'Error al crear el programa';
        this.snackbar.error(mensaje);
        this.loading = false;
      }
    });
  }

  actualizarPrograma(data: ProgramaDTOPeticion): void {
    this.programasService.actualizarPrograma(data).subscribe({
      next: () => {
        this.snackbar.exito('Programa actualizado exitosamente');
        this.router.navigate(['/admin/programas']);
      },
      error: (err) => {
        const mensaje = err.error?.mensaje || 'Error al actualizar el programa';
        this.snackbar.error(mensaje);
        this.loading = false;
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/admin/programas']);
  }

  // Getters para acceder a los controles del formulario fácilmente
  get codigo() {
    return this.programaForm.get('codigo');
  }

  get nombrePrograma() {
    return this.programaForm.get('nombre_programa');
  }
}

