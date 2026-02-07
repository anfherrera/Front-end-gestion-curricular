import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { 
  CursosIntersemestralesService, 
  RespuestaEstudiantesCurso,
  EstudianteCurso 
} from '../../../core/services/cursos-intersemestrales.service';
import { COLORS, snackbarConfig } from '../../../core/design-system/design-tokens';

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
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './estudiantes-curso-dialog.component.html',
  styleUrls: ['./estudiantes-curso-dialog.component.css']
})
export class EstudiantesCursoDialogComponent implements OnInit {
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

  constructor(
    public dialogRef: MatDialogRef<EstudiantesCursoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { idCurso: number; nombreCurso: string },
    private cursosService: CursosIntersemestralesService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarEstudiantes();
  }

  cargarEstudiantes(): void {
    this.cargando = true;
    this.error = null;
    
    // El backend ahora maneja UTF-8 correctamente, los nombres con tildes se muestran correctamente
    this.cursosService.getEstudiantesDelCurso(this.data.idCurso).subscribe({
      next: (respuesta) => {
        this.datos = respuesta;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        
        if (err.status === 403) {
          this.error = 'No tienes permisos para ver esta información';
          this.snackBar.open('No tienes permisos para ver esta información', 'Cerrar', snackbarConfig(['error-snackbar']));
        } else if (err.status === 404) {
          this.error = 'Curso no encontrado';
          this.snackBar.open('Curso no encontrado', 'Cerrar', snackbarConfig(['error-snackbar']));
        } else {
          this.error = 'Error al cargar los estudiantes';
          this.snackBar.open('Error al cargar los estudiantes', 'Cerrar', snackbarConfig(['error-snackbar']));
        }
      }
    });
  }

  getEstadoColor(estado: string | null | undefined): string {
    if (!estado || estado === 'Sin inscripción') return COLORS.neutralText;
    const u = estado.toUpperCase();
    if (u.includes('APROBADA') || u.includes('VALIDADO')) return COLORS.success;
    if (u.includes('RECHAZAD')) return COLORS.error;
    if (u.includes('ENVIAD')) return COLORS.tertiary;
    if (u.includes('PENDIENTE')) return COLORS.error;
    return COLORS.primary;
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  // Exportar estudiantes a PDF
  exportarEstudiantesPDF(): void {
    if (!this.data.idCurso) {
      this.snackBar.open('Error: No se pudo identificar el curso', 'Cerrar', snackbarConfig(['error-snackbar']));
      return;
    }

    
    this.cursosService.exportarEstudiantesPDF(this.data.idCurso).subscribe({
      next: (result) => {
        // Crear enlace temporal para descargar el archivo
        const urlBlob = window.URL.createObjectURL(result.blob);
        const link = document.createElement('a');
        link.href = urlBlob;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(urlBlob);
        
        this.snackBar.open('PDF exportado correctamente', 'Cerrar', snackbarConfig(['success-snackbar']));
      },
      error: (err) => {
        let mensajeError = 'Error al exportar el PDF';
        
        if (err.status === 401) {
          mensajeError = 'Sesión expirada. Por favor, inicia sesión nuevamente';
        } else if (err.status === 403) {
          mensajeError = 'No tienes permisos para exportar estudiantes';
        } else if (err.status === 404) {
          mensajeError = 'Curso no encontrado';
        } else if (err.status === 500) {
          mensajeError = 'Error interno del servidor al generar el PDF';
        }
        
        this.snackBar.open(mensajeError, 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }
}

