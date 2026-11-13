import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { CursoOfertadoVerano, SolicitudCursoVerano } from '@core/models/cursos-intersemestrales.model';

// Componente del modal para rechazar preinscripción
@Component({
  selector: 'app-rechazo-preinscripcion-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './rechazo-preinscripcion-dialog.component.html',
  styleUrl: './rechazo-preinscripcion-dialog.component.css'
})
export class RechazoPreinscripcionDialogComponent {
  dialogRef = inject<MatDialogRef<RechazoPreinscripcionDialogComponent>>(MatDialogRef);
  data = inject<{
    solicitud: SolicitudCursoVerano;
    curso?: CursoOfertadoVerano | null;
}>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  rechazoForm: FormGroup;

  constructor() {
    this.rechazoForm = this.fb.group({
      motivo: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  getNombreCurso(): string {
    return this.data.curso?.nombre_curso
      || this.data.solicitud.objCursoOfertadoVerano?.nombre_curso
      || this.data.solicitud.objCurso?.nombre_curso
      || 'N/A';
  }

  confirmarRechazo(): void {
    if (this.rechazoForm.valid) {
      this.dialogRef.close({
        motivo: this.rechazoForm.value.motivo.trim()
      });
    }
  }
}
