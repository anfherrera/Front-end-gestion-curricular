import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ApiService } from '../../../../core/services/api.service';

export interface FormProcesoDialogData {
  proceso: any | null;
  isEditMode: boolean;
}

@Component({
  selector: 'app-form-proceso-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule
  ],
  templateUrl: './form-proceso-dialog.component.html',
  styleUrl: './form-proceso-dialog.component.css'
})
export class FormProcesoDialogComponent implements OnInit {
  procesoForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<FormProcesoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FormProcesoDialogData
  ) {
    this.procesoForm = this.fb.group({
      nombre_proceso: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      descripcion: ['', [
        Validators.maxLength(500)
      ]],
      estado_proceso: [true]
    });
  }

  ngOnInit(): void {
    if (this.data.isEditMode && this.data.proceso) {
      this.procesoForm.patchValue({
        nombre_proceso: this.data.proceso.nombre_proceso,
        descripcion: this.data.proceso.descripcion || '',
        estado_proceso: this.data.proceso.estado_proceso
      });
    }
  }

  guardar(): void {
    if (this.procesoForm.invalid) {
      this.procesoForm.markAllAsTouched();
      this.snackBar.open('Por favor completa todos los campos correctamente', 'Cerrar', { duration: 3000 });
      return;
    }

    this.loading = true;
    
    const procesoData = {
      ...this.procesoForm.value
    };

    if (this.data.isEditMode && this.data.proceso) {
      procesoData.id_proceso = this.data.proceso.id_proceso;
      this.actualizarProceso(procesoData);
    } else {
      this.crearProceso(procesoData);
    }
  }

  crearProceso(data: any): void {
    this.apiService.post('procesos/crearProceso', data).subscribe({
      next: () => {
        this.snackBar.open('Proceso creado exitosamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        console.error('Error al crear:', err);
        const mensaje = err.error?.mensaje || 'Error al crear el proceso';
        this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  actualizarProceso(data: any): void {
    this.apiService.put('procesos/actualizarProceso', data).subscribe({
      next: () => {
        this.snackBar.open('Proceso actualizado exitosamente', 'Cerrar', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        console.error('Error al actualizar:', err);
        const mensaje = err.error?.mensaje || 'Error al actualizar el proceso';
        this.snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
        this.loading = false;
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  get nombreProceso() {
    return this.procesoForm.get('nombre_proceso');
  }

  get descripcion() {
    return this.procesoForm.get('descripcion');
  }
}

