import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';

import { SolicitudCursoVerano, EstadoSolicitudDetalle } from '@core/models/cursos-intersemestrales.model';

// Componente del dialog para ver detalles de preinscripción
@Component({
  selector: 'app-detalles-preinscripcion-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule
  ],
  templateUrl: './detalles-preinscripcion-dialog.component.html',
  styleUrl: './detalles-preinscripcion-dialog.component.css'
})
export class DetallesPreinscripcionDialogComponent {
  dialogRef = inject<MatDialogRef<DetallesPreinscripcionDialogComponent>>(MatDialogRef);
  data = inject<{
    solicitud: SolicitudCursoVerano;
}>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);

  observacionesForm: FormGroup;
  estadosOrdenados: EstadoSolicitudDetalle[] = [];

  constructor() {
    const data = this.data;

    this.observacionesForm = this.fb.group({
      observaciones: [data.solicitud.observaciones || '']
    });
    this.estadosOrdenados = this.obtenerEstadosOrdenados(data.solicitud.estadoSolicitud);
  }

  guardarObservaciones(): void {
    if (this.observacionesForm.valid) {
      this.dialogRef.close({
        observaciones: this.observacionesForm.value.observaciones
      });
    }
  }

  get tieneHistorial(): boolean {
    return this.estadosOrdenados.length > 0;
  }

  esRechazo(estado: string | undefined): boolean {
    const valor = (estado || '').toUpperCase();
    return valor.includes('RECHAZ');
  }

  private obtenerEstadosOrdenados(estados?: EstadoSolicitudDetalle[] | null): EstadoSolicitudDetalle[] {
    if (!estados || estados.length === 0) {
      return [];
    }

    return [...estados].sort((a, b) => {
      const fechaA = a.fecha ? new Date(a.fecha).getTime() : 0;
      const fechaB = b.fecha ? new Date(b.fecha).getTime() : 0;
      return fechaB - fechaA;
    });
  }
}
