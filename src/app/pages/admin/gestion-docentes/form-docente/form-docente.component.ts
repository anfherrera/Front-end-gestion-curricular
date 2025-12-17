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

import { DocentesService } from '../../../../core/services/docentes.service';
import { DocenteDTOPeticion } from '../../../../core/models/docente.interface';

@Component({
  selector: 'app-form-docente',
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
  templateUrl: './form-docente.component.html',
  styleUrls: ['./form-docente.component.css']
})
export class FormDocenteComponent implements OnInit {
  docenteForm: FormGroup;
  isEditMode = false;
  docenteId?: number;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private docentesService: DocentesService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.docenteForm = this.fb.group({
      codigo_docente: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(12)
      ]],
      nombre_docente: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.docenteId = +params['id'];
        this.cargarDocente();
      }
    });
  }

  cargarDocente(): void {
    if (!this.docenteId) return;

    this.loading = true;
    this.docentesService.buscarDocentePorId(this.docenteId).subscribe({
      next: (data) => {
        this.docenteForm.patchValue({
          codigo_docente: data.codigo_docente,
          nombre_docente: data.nombre_docente
        });
        this.loading = false;
      },
      error: (err) => {
        this.snackBar.open('Error al cargar los datos del docente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin/docentes']);
        this.loading = false;
      }
    });
  }

  guardar(): void {
    if (this.docenteForm.invalid) {
      this.docenteForm.markAllAsTouched();
      this.snackBar.open('Por favor completa todos los campos correctamente', 'Cerrar', { duration: 3000 });
      return;
    }

    this.loading = true;
    
    const docenteData: DocenteDTOPeticion = {
      ...this.docenteForm.value
    };

    if (this.isEditMode && this.docenteId) {
      docenteData.id_docente = this.docenteId;
      this.actualizarDocente(docenteData);
    } else {
      this.crearDocente(docenteData);
    }
  }

  crearDocente(data: DocenteDTOPeticion): void {
    this.docentesService.crearDocente(data).subscribe({
      next: () => {
        this.snackBar.open('Docente creado exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin/docentes']);
      },
      error: (err) => {
        const mensaje = err.error?.mensaje || 'Error al crear el docente';
        this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  actualizarDocente(data: DocenteDTOPeticion): void {
    this.docentesService.actualizarDocente(data).subscribe({
      next: () => {
        this.snackBar.open('Docente actualizado exitosamente', 'Cerrar', { duration: 3000 });
        this.router.navigate(['/admin/docentes']);
      },
      error: (err) => {
        const mensaje = err.error?.mensaje || 'Error al actualizar el docente';
        this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
        this.loading = false;
      }
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

