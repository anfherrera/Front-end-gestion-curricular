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
        this.cursos = this.getCursosPrueba();
        this.cargando = false;
      }
    });
  }

  cargarSolicitudesPorCurso(cursoId: number): void {
    this.cargando = true;
    console.log(`🔄 Cargando solicitudes para curso ID: ${cursoId}`);
    
    // Buscar el curso seleccionado
    this.cursoSeleccionado = this.cursos.find(c => c.id_curso === cursoId) || null;
    
    this.cursosService.getTodasLasSolicitudes().subscribe({
      next: (solicitudes) => {
        // Filtrar solicitudes por curso
        this.solicitudes = solicitudes.filter(s => s.objCursoOfertadoVerano.id_curso === cursoId);
        this.solicitudesFiltradas = this.solicitudes;
        console.log('✅ Solicitudes cargadas:', this.solicitudes);
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando solicitudes:', err);
        this.solicitudesFiltradas = this.getSolicitudesPrueba();
        this.cargando = false;
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
    console.log(`🔄 Actualizando observaciones para solicitud ${idSolicitud}`);
    
    // Por ahora solo actualizamos localmente hasta que el backend implemente el endpoint
    const index = this.solicitudesFiltradas.findIndex(s => s.id_solicitud === idSolicitud);
    if (index !== -1) {
      this.solicitudesFiltradas[index].observaciones = observaciones;
    }
    
    this.snackBar.open('Observaciones guardadas exitosamente', 'Cerrar', { duration: 3000 });
  }

  aprobarSolicitud(solicitud: SolicitudCursoVerano): void {
    console.log(`✅ Aprobando solicitud ${solicitud.id_solicitud}`);
    
    this.cursosService.aprobarSolicitud(solicitud.id_solicitud).subscribe({
      next: (response) => {
        console.log('✅ Solicitud aprobada:', response);
        
        // Actualizar estado localmente
        const index = this.solicitudesFiltradas.findIndex(s => s.id_solicitud === solicitud.id_solicitud);
        if (index !== -1) {
          this.solicitudesFiltradas[index].estado = 'Aprobado';
        }
        
        this.snackBar.open(`Solicitud de ${solicitud.objUsuario.nombre_completo} aprobada. El estudiante puede proceder a inscripción.`, 'Cerrar', { 
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      },
      error: (err) => {
        console.error('❌ Error aprobando solicitud:', err);
        this.snackBar.open('Error al aprobar la solicitud', 'Cerrar', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  rechazarSolicitud(solicitud: SolicitudCursoVerano): void {
    console.log(`❌ Rechazando solicitud ${solicitud.id_solicitud}`);
    
    this.cursosService.rechazarSolicitud(solicitud.id_solicitud).subscribe({
      next: (response) => {
        console.log('✅ Solicitud rechazada:', response);
        
        // Actualizar estado localmente
        const index = this.solicitudesFiltradas.findIndex(s => s.id_solicitud === solicitud.id_solicitud);
        if (index !== -1) {
          this.solicitudesFiltradas[index].estado = 'Rechazado';
        }
        
        this.snackBar.open(`Solicitud de ${solicitud.objUsuario.nombre_completo} rechazada.`, 'Cerrar', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      },
      error: (err) => {
        console.error('❌ Error rechazando solicitud:', err);
        this.snackBar.open('Error al rechazar la solicitud', 'Cerrar', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
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

  private getSolicitudesPrueba(): SolicitudCursoVerano[] {
    return [
      {
        id_solicitud: 1,
        nombre_solicitud: 'Solicitud de Curso Nuevo',
        fecha_solicitud: new Date('2024-01-10'),
        estado: 'Pendiente',
        observaciones: '',
        condicion: 'Primera_Vez',
        objUsuario: { id_usuario: 4, nombre_completo: 'Pepa González', rol: { id_rol: 1, nombre: 'Estudiante' }, codigo: '104612345660', correo: 'pepa.gonzalez@unicauca.edu.co', estado_usuario: true, objPrograma: { id_programa: 1, nombre_programa: 'Ingeniería Informática' } },
        objCursoOfertadoVerano: this.cursoSeleccionado!,
        tipoSolicitud: 'PREINSCRIPCION'
      },
      {
        id_solicitud: 2,
        nombre_solicitud: 'Solicitud de Curso Nuevo',
        fecha_solicitud: new Date('2024-01-11'),
        estado: 'Pendiente',
        observaciones: '',
        condicion: 'Habilitación',
        objUsuario: { id_usuario: 5, nombre_completo: 'María González', rol: { id_rol: 1, nombre: 'Estudiante' }, codigo: '104612345661', correo: 'maria.gonzalez@unicauca.edu.co', estado_usuario: true, objPrograma: { id_programa: 1, nombre_programa: 'Ingeniería Informática' } },
        objCursoOfertadoVerano: this.cursoSeleccionado!,
        tipoSolicitud: 'PREINSCRIPCION'
      },
      {
        id_solicitud: 3,
        nombre_solicitud: 'Solicitud de Curso Nuevo',
        fecha_solicitud: new Date('2024-01-12'),
        estado: 'Aprobado',
        observaciones: 'Estudiante con buen rendimiento académico',
        condicion: 'Repeteción',
        objUsuario: { id_usuario: 6, nombre_completo: 'Pedro Rodríguez', rol: { id_rol: 1, nombre: 'Estudiante' }, codigo: '104612345662', correo: 'pedro@unicauca.edu.co', estado_usuario: true, objPrograma: { id_programa: 1, nombre_programa: 'Ingeniería Informática' } },
        objCursoOfertadoVerano: this.cursoSeleccionado!,
        tipoSolicitud: 'PREINSCRIPCION'
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

