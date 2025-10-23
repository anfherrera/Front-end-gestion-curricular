import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

import { ProgramasService } from '../../services/programas.service';
import { ProgramaDTOPeticion } from '../../models/programa.interface';

@Component({
  selector: 'app-form-programa',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  templateUrl: './form-programa.component.html',
  styleUrls: ['./form-programa.component.css']
})
export class FormProgramaComponent implements OnInit {
  programaForm: FormGroup;
  isEditMode = false;
  programaId?: number;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private programasService: ProgramasService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
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
    this.route.params.subscribe(params => {
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
      error: (err) => {
        console.error('Error al cargar programa:', err);
        this.snackBar.open('Error al cargar los datos del programa', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin/programas']);
        this.loading = false;
      }
    });
  }

  guardar(): void {
    if (this.programaForm.invalid) {
      this.programaForm.markAllAsTouched();
      this.snackBar.open('Por favor completa todos los campos correctamente', 'Cerrar', { duration: 3000 });
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
        this.snackBar.open('Programa creado exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin/programas']);
      },
      error: (err) => {
        console.error('Error al crear:', err);
        const mensaje = err.error?.mensaje || 'Error al crear el programa';
        this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  actualizarPrograma(data: ProgramaDTOPeticion): void {
    this.programasService.actualizarPrograma(data).subscribe({
      next: () => {
        this.snackBar.open('Programa actualizado exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin/programas']);
      },
      error: (err) => {
        console.error('Error al actualizar:', err);
        const mensaje = err.error?.mensaje || 'Error al actualizar el programa';
        this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
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

