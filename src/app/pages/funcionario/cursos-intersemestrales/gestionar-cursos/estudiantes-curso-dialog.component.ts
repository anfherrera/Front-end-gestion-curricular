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
} from '../../../../core/services/cursos-intersemestrales.service';
import { snackbarConfig } from '../../../../core/design-system/design-tokens';

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
    if (!estado) return '#9e9e9e';
    
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('aprobada') || estadoLower.includes('validado')) {
      return '#249337'; // COLORS.success
    } else if (estadoLower.includes('enviada')) {
      return '#1D72D3'; // COLORS.tertiary
    } else if (estadoLower.includes('rechazada') || estadoLower.includes('rechazado')) {
      return '#FF6D0A'; // COLORS.error
    }
    return '#ff9800';
  }

  getTipoColor(tipo: string): string {
    return tipo === 'Inscrito' ? '#249337' : '#ff9800';
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}

