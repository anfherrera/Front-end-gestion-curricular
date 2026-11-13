import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';
import { CursoOfertadoVerano, EstudianteElegible } from '@core/models/cursos-intersemestrales.model';
import { UtfFixPipe } from '@shared/pipes/utf-fix.pipe';

// Componente del modal de confirmación de inscripción
@Component({
  selector: 'app-confirmacion-inscripcion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    UtfFixPipe
  ],
  templateUrl: './confirmacion-inscripcion-dialog.component.html',
  styleUrl: './confirmacion-inscripcion-dialog.component.css'
})
export class ConfirmacionInscripcionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmacionInscripcionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { estudiante: EstudianteElegible, curso: CursoOfertadoVerano | null }
  ) {}

  confirmar(): void {
    this.dialogRef.close('confirmar');
  }
}
