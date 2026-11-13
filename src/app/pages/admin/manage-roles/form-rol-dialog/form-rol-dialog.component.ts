import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { RolesAdminService } from '@core/services/roles-admin.service';
import { RolDTOPeticion, RolDTORespuesta } from '@core/models/rol.interface';
import { SnackbarService } from '@core/services/snackbar.service';

export interface FormRolDialogData {
  rol: RolDTORespuesta | null;
  isEditMode: boolean;
}

@Component({
  selector: 'app-form-rol-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './form-rol-dialog.component.html',
  styleUrls: ['./form-rol-dialog.component.css']
})
export class FormRolDialogComponent implements OnInit {
  rolForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private rolesService: RolesAdminService,
    private snackbar: SnackbarService,
    public dialogRef: MatDialogRef<FormRolDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FormRolDialogData
  ) {
    this.rolForm = this.fb.group({
      nombre: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(50)
      ]]
    });
  }

  ngOnInit(): void {
    if (this.data.isEditMode && this.data.rol) {
      this.rolForm.patchValue({
        nombre: this.data.rol.nombre
      });
    }
  }

  guardar(): void {
    if (this.rolForm.invalid) {
      this.rolForm.markAllAsTouched();
      this.snackbar.advertencia('Por favor completa todos los campos correctamente');
      return;
    }

    this.loading = true;
    
    const rolData: RolDTOPeticion = {
      nombre: this.rolForm.value.nombre
    };

    if (this.data.isEditMode && this.data.rol) {
      rolData.id_rol = this.data.rol.id_rol;
      this.actualizarRol(rolData);
    } else {
      this.crearRol(rolData);
    }
  }

  crearRol(data: RolDTOPeticion): void {
    this.rolesService.crearRol(data).subscribe({
      next: () => {
        this.snackbar.exito('Rol creado exitosamente');
        this.dialogRef.close(true);
      },
      error: (err) => {
        const mensaje = err.error?.mensaje || 'Error al crear el rol';
        this.snackbar.error(mensaje);
        this.loading = false;
      }
    });
  }

  actualizarRol(data: RolDTOPeticion): void {
    this.rolesService.actualizarRol(data).subscribe({
      next: () => {
        this.snackbar.exito('Rol actualizado exitosamente');
        this.dialogRef.close(true);
      },
      error: (err) => {
        const mensaje = err.error?.mensaje || 'Error al actualizar el rol';
        this.snackbar.error(mensaje);
        this.loading = false;
      }
    });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  get nombre() {
    return this.rolForm.get('nombre');
  }
}

