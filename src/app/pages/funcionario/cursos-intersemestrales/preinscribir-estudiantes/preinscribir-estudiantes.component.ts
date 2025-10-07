import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { Inject } from '@angular/core';
import { CursosIntersemestralesService, CursoOfertadoVerano, Preinscripcion, SolicitudCursoVerano } from '../../../../core/services/cursos-intersemestrales.service';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';

@Component({
  selector: 'app-preinscribir-estudiantes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSelectModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    CardContainerComponent
  ],
  templateUrl: './preinscribir-estudiantes.component.html',
  styleUrls: ['./preinscribir-estudiantes.component.css']
})
export class PreinscribirEstudiantesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Datos
  cursos: CursoOfertadoVerano[] = [];
  solicitudes: SolicitudCursoVerano[] = [];
  solicitudesFiltradas: SolicitudCursoVerano[] = [];
  cargando = false;
  
  // Formularios
  filtroForm: FormGroup;
  observacionForm: FormGroup;
  
  // Estado
  cursoSeleccionado: CursoOfertadoVerano | null = null;
  solicitudSeleccionada: SolicitudCursoVerano | null = null;
  
  // Columnas de la tabla
  displayedColumns: string[] = [
    'estudiante', 
    'fecha_solicitud', 
    'estado', 
    'observaciones', 
    'acciones'
  ];

  constructor(
    private cursosService: CursosIntersemestralesService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.filtroForm = this.fb.group({
      curso: ['', Validators.required]
    });
    
    this.observacionForm = this.fb.group({
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    this.cargarCursos();
    
    // Suscribirse a cambios en el filtro de curso
    this.filtroForm.get('curso')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(cursoId => {
        if (cursoId) {
          this.cargarSolicitudesPorCurso(cursoId);
        } else {
          this.solicitudesFiltradas = [];
          this.cursoSeleccionado = null;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarCursos(): void {
    this.cargando = true;
    console.log('🔄 Cargando cursos para preinscripción...');
    
    this.cursosService.getCursosDisponibles().subscribe({
      next: (cursos) => {
        this.cursos = cursos;
        console.log('✅ Cursos cargados:', cursos);
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando cursos:', err);
        this.cursos = [];
        this.cargando = false;
        this.snackBar.open('Error al cargar los cursos disponibles', 'Cerrar', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  cargarSolicitudesPorCurso(cursoId: number): void {
    this.cargando = true;
    console.log(`🔄 Cargando información del curso ID: ${cursoId}`);
    
    // Cargar información actualizada del curso específico
    this.cursosService.getCursoPorId(cursoId).subscribe({
      next: (curso) => {
        this.cursoSeleccionado = curso;
        console.log('✅ Información del curso cargada:', curso);
        
        // Ahora cargar las preinscripciones para este curso
        this.cursosService.getPreinscripcionesPorCurso(cursoId).subscribe({
          next: (solicitudes) => {
            this.solicitudes = solicitudes;
            this.solicitudesFiltradas = this.solicitudes;
            console.log('✅ Preinscripciones cargadas:', this.solicitudes);
            this.cargando = false;
          },
          error: (err) => {
            console.error('❌ Error cargando preinscripciones:', err);
            this.solicitudesFiltradas = [];
            this.cargando = false;
            this.snackBar.open('Error al cargar las preinscripciones del curso', 'Cerrar', { 
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      },
      error: (err) => {
        console.error('❌ Error cargando información del curso:', err);
        // Fallback: buscar el curso en la lista local
        this.cursoSeleccionado = this.cursos.find(c => c.id_curso === cursoId) || null;
        
        // Intentar cargar preinscripciones de todas formas
        this.cursosService.getPreinscripcionesPorCurso(cursoId).subscribe({
          next: (solicitudes) => {
            this.solicitudes = solicitudes;
            this.solicitudesFiltradas = this.solicitudes;
            console.log('✅ Preinscripciones cargadas (sin info del curso):', this.solicitudes);
            this.cargando = false;
          },
          error: (err) => {
            console.error('❌ Error cargando preinscripciones:', err);
            this.solicitudesFiltradas = [];
            this.cargando = false;
            this.snackBar.open('Error al cargar las preinscripciones del curso', 'Cerrar', { 
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  verDetalles(solicitud: SolicitudCursoVerano): void {
    this.solicitudSeleccionada = solicitud;
    this.observacionForm.patchValue({
      observaciones: solicitud.observaciones || ''
    });
    
    // Abrir dialog con detalles
    this.abrirDialogDetalles(solicitud);
  }

  abrirDialogDetalles(solicitud: SolicitudCursoVerano): void {
    const dialogRef = this.dialog.open(DetallesPreinscripcionDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        solicitud: solicitud
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.observaciones !== undefined) {
        this.actualizarObservaciones(solicitud.id_solicitud, result.observaciones);
      }
    });
  }

  actualizarObservaciones(idSolicitud: number, observaciones: string): void {
    console.log(`🔄 Actualizando observaciones para preinscripción ${idSolicitud}`);
    
    this.cursosService.actualizarObservacionesPreinscripcion(idSolicitud, observaciones).subscribe({
      next: (response) => {
        console.log('✅ Observaciones actualizadas:', response);
        
        // Actualizar localmente
        const index = this.solicitudesFiltradas.findIndex(s => s.id_solicitud === idSolicitud);
        if (index !== -1) {
          this.solicitudesFiltradas[index].observaciones = observaciones;
        }
        
        this.snackBar.open('Observaciones guardadas exitosamente', 'Cerrar', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (err) => {
        console.error('❌ Error actualizando observaciones:', err);
        this.snackBar.open('Error al guardar las observaciones', 'Cerrar', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  aprobarSolicitud(solicitud: SolicitudCursoVerano): void {
    console.log(`✅ Aprobando preinscripción ${solicitud.id_solicitud}`);
    
    this.cursosService.aprobarPreinscripcion(solicitud.id_solicitud).subscribe({
      next: (response) => {
        console.log('✅ Preinscripción aprobada:', response);
        
        // Actualizar estado localmente
        const index = this.solicitudesFiltradas.findIndex(s => s.id_solicitud === solicitud.id_solicitud);
        if (index !== -1) {
          this.solicitudesFiltradas[index].estado = 'Aprobado';
        }
        
        this.snackBar.open(`Preinscripción de ${solicitud.objUsuario.nombre_completo} aprobada. El estudiante puede proceder a inscripción.`, 'Cerrar', { 
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      },
      error: (err) => {
        console.error('❌ Error aprobando preinscripción:', err);
        this.snackBar.open('Error al aprobar la preinscripción', 'Cerrar', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  rechazarSolicitud(solicitud: SolicitudCursoVerano): void {
    console.log(`❌ Rechazando preinscripción ${solicitud.id_solicitud}`);
    
    this.cursosService.rechazarPreinscripcion(solicitud.id_solicitud).subscribe({
      next: (response) => {
        console.log('✅ Preinscripción rechazada:', response);
        
        // Actualizar estado localmente
        const index = this.solicitudesFiltradas.findIndex(s => s.id_solicitud === solicitud.id_solicitud);
        if (index !== -1) {
          this.solicitudesFiltradas[index].estado = 'Rechazado';
        }
        
        this.snackBar.open(`Preinscripción de ${solicitud.objUsuario.nombre_completo} rechazada.`, 'Cerrar', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      },
      error: (err) => {
        console.error('❌ Error rechazando preinscripción:', err);
        this.snackBar.open('Error al rechazar la preinscripción', 'Cerrar', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getEstadoColor(estado: string): string {
    return '#00138C'; // Color azul consistente
  }

}

// Componente del dialog para ver detalles de preinscripción
@Component({
  selector: 'app-detalles-preinscripcion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule
  ],
  template: `
    <!-- Dialog actualizado - versión simplificada -->
    <h2 mat-dialog-title>Detalles de Solicitud de Curso</h2>
    
    <div mat-dialog-content class="dialog-content">
      <!-- Información que llenó el estudiante -->
      <div class="form-section">
        <h3>📝 Información de la Solicitud</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>Nombre Completo:</strong> {{ data.solicitud.objUsuario.nombre_completo }}
          </div>
          <div class="info-item">
            <strong>Código:</strong> {{ data.solicitud.objUsuario.codigo || 'N/A' }}
          </div>
          <div class="info-item">
            <strong>Condición:</strong> {{ data.solicitud.condicion || 'N/A' }}
          </div>
        </div>
      </div>

      <!-- Observaciones del funcionario -->
      <div class="form-section">
        <h3>📝 Observaciones del Funcionario</h3>
        <form [formGroup]="observacionesForm">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Agrega observaciones sobre esta preinscripción</mat-label>
            <textarea matInput 
                      formControlName="observaciones"
                      placeholder="Ej: Estudiante con buen rendimiento académico, cumple requisitos..."
                      rows="4">
            </textarea>
          </mat-form-field>
        </form>
      </div>
    </div>

    <div mat-dialog-actions class="dialog-actions">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-raised-button 
              color="primary" 
              (click)="guardarObservaciones()"
              [disabled]="observacionesForm.invalid">
        Guardar Observaciones
      </button>
    </div>
  `,
  styles: [`
    .dialog-content {
      max-width: 600px;
      padding: 20px;
    }

    .curso-info {
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      border-left: 4px solid #00138C;
    }

    .form-section {
      margin-bottom: 24px;
      padding: 16px;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-radius: 8px;
      border-left: 4px solid #00138C;
    }

    .form-section h3 {
      margin: 0 0 16px 0;
      color: #00138C;
      font-size: 16px;
      font-weight: 600;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-item strong {
      color: #333;
      min-width: 120px;
    }

    .full-width {
      width: 100%;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid #e0e0e0;
    }

    ::ng-deep .mat-mdc-form-field {
      .mat-mdc-text-field-wrapper {
        background-color: white;
      }
    }
  `]
})
export class DetallesPreinscripcionDialogComponent {
  observacionesForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<DetallesPreinscripcionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { solicitud: SolicitudCursoVerano },
    private fb: FormBuilder
  ) {
    this.observacionesForm = this.fb.group({
      observaciones: [data.solicitud.observaciones || '']
    });
  }

  guardarObservaciones(): void {
    if (this.observacionesForm.valid) {
      this.dialogRef.close({
        observaciones: this.observacionesForm.value.observaciones
      });
    }
  }
}

