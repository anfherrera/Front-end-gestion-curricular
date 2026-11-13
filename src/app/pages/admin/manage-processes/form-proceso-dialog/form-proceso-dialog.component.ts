import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HttpErrorResponse } from '@angular/common/http';
import { ProcesosService } from '@core/services/procesos.service';
import { ProcesoDTOPeticion, ProcesoDTORespuesta } from '@core/models/proceso.interface';
import { SnackbarService } from '@core/services/snackbar.service';

export interface FormProcesoDialogData {
  proceso: ProcesoDTORespuesta | null;
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
    private procesosService: ProcesosService,
    private snackbar: SnackbarService,
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
      this.snackbar.advertencia('Por favor completa todos los campos correctamente');
      return;
    }

    this.loading = true;
    
    const procesoData: ProcesoDTOPeticion = {
      ...this.procesoForm.value
    };

    if (this.data.isEditMode && this.data.proceso) {
      procesoData.id_proceso = this.data.proceso.id_proceso;
      this.actualizarProceso(procesoData);
    } else {
      this.crearProceso(procesoData);
    }
  }

  crearProceso(data: ProcesoDTOPeticion): void {
    this.procesosService.crearProceso(data).subscribe({
      next: () => {
        this.snackbar.exito('Proceso creado exitosamente');
        this.dialogRef.close(true);
      },
      error: (err: HttpErrorResponse) => {
        const mensaje = err.error?.mensaje || 'Error al crear el proceso';
        this.snackbar.error(mensaje);
        this.loading = false;
      }
    });
  }

  actualizarProceso(data: ProcesoDTOPeticion): void {
    this.procesosService.actualizarProceso(data).subscribe({
      next: () => {
        this.snackbar.exito('Proceso actualizado exitosamente');
        this.dialogRef.close(true);
      },
      error: (err: HttpErrorResponse) => {
        const mensaje = err.error?.mensaje || 'Error al actualizar el proceso';
        this.snackbar.error(mensaje);
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

