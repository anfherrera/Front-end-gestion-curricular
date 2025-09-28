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
import { CursosIntersemestralesService, CursoOfertadoVerano, Preinscripcion } from '../../../../core/services/cursos-intersemestrales.service';
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
  preinscripciones: Preinscripcion[] = [];
  preinscripcionesFiltradas: Preinscripcion[] = [];
  cargando = false;
  
  // Formularios
  filtroForm: FormGroup;
  observacionForm: FormGroup;
  
  // Estado
  cursoSeleccionado: CursoOfertadoVerano | null = null;
  preinscripcionSeleccionada: Preinscripcion | null = null;
  
  // Columnas de la tabla
  displayedColumns: string[] = [
    'estudiante', 
    'fecha_preinscripcion', 
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
          this.cargarPreinscripcionesPorCurso(cursoId);
        } else {
          this.preinscripcionesFiltradas = [];
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
        this.cursos = this.getCursosPrueba();
        this.cargando = false;
      }
    });
  }

  cargarPreinscripcionesPorCurso(cursoId: number): void {
    this.cargando = true;
    console.log(`🔄 Cargando preinscripciones para curso ID: ${cursoId}`);
    
    // Buscar el curso seleccionado
    this.cursoSeleccionado = this.cursos.find(c => c.id_curso === cursoId) || null;
    
    this.cursosService.getPreinscripcionesPorCurso(cursoId).subscribe({
      next: (preinscripciones) => {
        this.preinscripciones = preinscripciones;
        this.preinscripcionesFiltradas = preinscripciones;
        console.log('✅ Preinscripciones cargadas:', preinscripciones);
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando preinscripciones:', err);
        this.preinscripcionesFiltradas = this.getPreinscripcionesPrueba();
        this.cargando = false;
      }
    });
  }

  verDetalles(preinscripcion: Preinscripcion): void {
    this.preinscripcionSeleccionada = preinscripcion;
    this.observacionForm.patchValue({
      observaciones: preinscripcion.observaciones || ''
    });
    
    // Abrir dialog con detalles
    this.abrirDialogDetalles(preinscripcion);
  }

  abrirDialogDetalles(preinscripcion: Preinscripcion): void {
    const dialogRef = this.dialog.open(DetallesPreinscripcionDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        preinscripcion: preinscripcion,
        curso: this.cursoSeleccionado
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.observaciones !== undefined) {
        this.actualizarObservaciones(preinscripcion.id_preinscripcion, result.observaciones);
      }
    });
  }

  actualizarObservaciones(idPreinscripcion: number, observaciones: string): void {
    console.log(`🔄 Actualizando observaciones para preinscripción ${idPreinscripcion}`);
    
    this.cursosService.actualizarObservacionesPreinscripcion(idPreinscripcion, observaciones).subscribe({
      next: (response) => {
        console.log('✅ Observaciones actualizadas:', response);
        this.snackBar.open('Observaciones actualizadas exitosamente', 'Cerrar', { duration: 3000 });
        
        // Recargar preinscripciones
        if (this.cursoSeleccionado) {
          this.cargarPreinscripcionesPorCurso(this.cursoSeleccionado.id_curso);
        }
      },
      error: (err) => {
        console.error('❌ Error actualizando observaciones:', err);
        this.snackBar.open('Error al actualizar observaciones', 'Cerrar', { duration: 3000 });
      }
    });
  }

  getEstadoColor(estado: string): string {
    return '#00138C'; // Color azul consistente
  }

  // Datos de prueba
  private getCursosPrueba(): CursoOfertadoVerano[] {
    return [
      {
        id_curso: 1,
        nombre_curso: 'Álgebra Lineal',
        codigo_curso: 'ALG-201',
        descripcion: 'Fundamentos de álgebra lineal',
        fecha_inicio: new Date('2024-01-15'),
        fecha_fin: new Date('2024-03-15'),
        cupo_maximo: 30,
        cupo_estimado: 25,
        cupo_disponible: 20,
        espacio_asignado: 'Aula 301',
        estado: 'Preinscripcion',
        objMateria: { id_materia: 1, nombre_materia: 'Álgebra Lineal', codigo_materia: 'ALG', creditos: 4 },
        objDocente: { id_usuario: 1, nombre: 'María', apellido: 'García', email: 'maria@unicauca.edu.co', telefono: '3001234567', objRol: { id_rol: 2, nombre_rol: 'Docente' } }
      },
      {
        id_curso: 2,
        nombre_curso: 'Cálculo 1',
        codigo_curso: 'CAL-101',
        descripcion: 'Fundamentos de cálculo diferencial',
        fecha_inicio: new Date('2024-01-15'),
        fecha_fin: new Date('2024-03-15'),
        cupo_maximo: 35,
        cupo_estimado: 30,
        cupo_disponible: 25,
        espacio_asignado: 'Aula 205',
        estado: 'Preinscripcion',
        objMateria: { id_materia: 2, nombre_materia: 'Cálculo 1', codigo_materia: 'CAL', creditos: 4 },
        objDocente: { id_usuario: 2, nombre: 'Carlos', apellido: 'López', email: 'carlos@unicauca.edu.co', telefono: '3007654321', objRol: { id_rol: 2, nombre_rol: 'Docente' } }
      },
      {
        id_curso: 3,
        nombre_curso: 'Programación I',
        codigo_curso: 'PROG-201',
        descripcion: 'Fundamentos de programación',
        fecha_inicio: new Date('2024-01-15'),
        fecha_fin: new Date('2024-03-15'),
        cupo_maximo: 25,
        cupo_estimado: 20,
        cupo_disponible: 15,
        espacio_asignado: 'Lab 301',
        estado: 'Preinscripcion',
        objMateria: { id_materia: 3, nombre_materia: 'Programación I', codigo_materia: 'PROG', creditos: 4 },
        objDocente: { id_usuario: 3, nombre: 'Ana', apellido: 'Martínez', email: 'ana@unicauca.edu.co', telefono: '3009876543', objRol: { id_rol: 2, nombre_rol: 'Docente' } }
      }
    ];
  }

  private getPreinscripcionesPrueba(): Preinscripcion[] {
    return [
      {
        id_preinscripcion: 1,
        fecha_preinscripcion: new Date('2024-01-10'),
        estado: 'Pendiente',
        observaciones: '',
        objUsuario: { id_usuario: 4, nombre: 'Juan', apellido: 'Pérez', email: 'juan@unicauca.edu.co', telefono: '3001111111', objRol: { id_rol: 1, nombre_rol: 'Estudiante' } },
        objCurso: this.cursoSeleccionado!
      },
      {
        id_preinscripcion: 2,
        fecha_preinscripcion: new Date('2024-01-11'),
        estado: 'Pendiente',
        observaciones: '',
        objUsuario: { id_usuario: 5, nombre: 'María', apellido: 'González', email: 'maria.gonzalez@unicauca.edu.co', telefono: '3002222222', objRol: { id_rol: 1, nombre_rol: 'Estudiante' } },
        objCurso: this.cursoSeleccionado!
      },
      {
        id_preinscripcion: 3,
        fecha_preinscripcion: new Date('2024-01-12'),
        estado: 'Aprobado',
        observaciones: 'Estudiante con buen rendimiento académico',
        objUsuario: { id_usuario: 6, nombre: 'Pedro', apellido: 'Rodríguez', email: 'pedro@unicauca.edu.co', telefono: '3003333333', objRol: { id_rol: 1, nombre_rol: 'Estudiante' } },
        objCurso: this.cursoSeleccionado!
      }
    ];
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
    <h2 mat-dialog-title>Detalles de Preinscripción</h2>
    
    <div mat-dialog-content class="dialog-content">
      <!-- Información del estudiante -->
      <div class="info-section">
        <h3>👤 Información del Estudiante</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>Nombre:</strong> {{ data.preinscripcion.objUsuario.nombre }} {{ data.preinscripcion.objUsuario.apellido }}
          </div>
          <div class="info-item">
            <strong>Email:</strong> {{ data.preinscripcion.objUsuario.email }}
          </div>
          <div class="info-item">
            <strong>Teléfono:</strong> {{ data.preinscripcion.objUsuario.telefono }}
          </div>
        </div>
      </div>

      <!-- Información del curso -->
      <div class="info-section">
        <h3>📚 Información del Curso</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>Curso:</strong> {{ data.curso?.nombre_curso }}
          </div>
          <div class="info-item">
            <strong>Código:</strong> {{ data.curso?.codigo_curso }}
          </div>
          <div class="info-item">
            <strong>Docente:</strong> {{ data.curso?.objDocente?.nombre }} {{ data.curso?.objDocente?.apellido }}
          </div>
        </div>
      </div>

      <!-- Información de la preinscripción -->
      <div class="info-section">
        <h3>📋 Información de Preinscripción</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>Fecha:</strong> {{ data.preinscripcion.fecha_preinscripcion | date:'dd/MM/yyyy HH:mm' }}
          </div>
          <div class="info-item">
            <strong>Estado:</strong> 
            <mat-chip [style.background-color]="'#00138C'" [style.color]="'white'">
              {{ data.preinscripcion.estado }}
            </mat-chip>
          </div>
        </div>
      </div>

      <!-- Campo de observaciones -->
      <div class="info-section">
        <h3>📝 Observaciones</h3>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Observaciones del funcionario</mat-label>
          <textarea matInput 
                    formControlName="observaciones" 
                    rows="4" 
                    placeholder="Agrega observaciones sobre esta preinscripción...">
          </textarea>
        </mat-form-field>
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
      max-height: 60vh;
      overflow-y: auto;
      padding: 20px 0;
    }

    .info-section {
      margin-bottom: 24px;
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #00138C;
    }

    .info-section h3 {
      color: #00138C;
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 600;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-item strong {
      color: #333;
      min-width: 80px;
    }

    .full-width {
      width: 100%;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 0;
      border-top: 1px solid #e0e0e0;
    }

    .dialog-actions button {
      min-width: 120px;
    }

    ::ng-deep .mat-mdc-form-field {
      width: 100%;
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-form-field-outline {
      color: #e3f2fd;
    }

    ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-form-field-outline {
      color: #00138C;
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-form-field-label {
      color: #6c757d;
    }

    ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-form-field-label {
      color: #00138C;
    }
  `]
})
export class DetallesPreinscripcionDialogComponent {
  observacionesForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<DetallesPreinscripcionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { preinscripcion: Preinscripcion, curso: CursoOfertadoVerano | null },
    private fb: FormBuilder
  ) {
    this.observacionesForm = this.fb.group({
      observaciones: [data.preinscripcion.observaciones || '']
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
