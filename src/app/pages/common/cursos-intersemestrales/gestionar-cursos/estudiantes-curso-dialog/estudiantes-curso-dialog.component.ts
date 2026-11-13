import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CursosIntersemestralesService } from '@core/services/cursos-intersemestrales.service';
import { RespuestaEstudiantesCurso } from '@core/models/cursos-intersemestrales.model';
import { descargarBlob } from '@core/utils/download.util';
import { SnackbarService } from '@core/services/snackbar.service';

const ERRORES_CARGA: Record<number, string> = {
  403: 'No tienes permisos para ver esta información',
  404: 'Curso no encontrado'
};

const ERRORES_EXPORTAR: Record<number, string> = {
  401: 'Sesión expirada. Por favor, inicia sesión nuevamente',
  403: 'No tienes permisos para exportar estudiantes',
  404: 'Curso no encontrado',
  500: 'Error interno del servidor al generar el PDF'
};

/** Preinscritos e inscritos de un curso, con exportación a PDF. */
@Component({
  selector: 'app-estudiantes-curso-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './estudiantes-curso-dialog.component.html',
  styleUrls: ['./estudiantes-curso-dialog.component.css']
})
export class EstudiantesCursoDialogComponent implements OnInit {
  dialogRef = inject<MatDialogRef<EstudiantesCursoDialogComponent>>(MatDialogRef);
  data = inject<{
    idCurso: number;
    nombreCurso: string;
}>(MAT_DIALOG_DATA);
  private cursosService = inject(CursosIntersemestralesService);
  private snackbar = inject(SnackbarService);

  datos: RespuestaEstudiantesCurso | null = null;
  cargando = true;
  error: string | null = null;

  displayedColumns: string[] = [
    'numero',
    'nombre_completo',
    'codigo',
    'programa',
    'tipo',
    'estado_preinscripcion',
    'estado_inscripcion',
    'correo'
  ];

  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.cargarEstudiantes();
  }

  cargarEstudiantes(): void {
    this.cargando = true;
    this.error = null;

    this.cursosService.getEstudiantesDelCurso(this.data.idCurso)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (respuesta) => {
          this.datos = respuesta;
          this.cargando = false;
        },
        error: (err: HttpErrorResponse) => {
          this.cargando = false;
          this.error = ERRORES_CARGA[err.status] ?? 'Error al cargar los estudiantes';
          this.snackbar.error(this.error);
        }
      });
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  exportarEstudiantesPDF(): void {
    if (!this.data.idCurso) {
      this.snackbar.error('Error: No se pudo identificar el curso');
      return;
    }

    this.cursosService.exportarEstudiantesPDF(this.data.idCurso)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (archivo) => {
          descargarBlob(archivo.blob, archivo.filename);
          this.snackbar.exito('PDF exportado correctamente');
        },
        error: (err: HttpErrorResponse) => {
          this.snackbar.error(ERRORES_EXPORTAR[err.status] ?? 'Error al exportar el PDF');
        }
      });
  }
}
