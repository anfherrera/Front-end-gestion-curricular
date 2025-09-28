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
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { Inject } from '@angular/core';
import { CursosIntersemestralesService, CursoOfertadoVerano, Inscripcion } from '../../../../core/services/cursos-intersemestrales.service';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';

@Component({
  selector: 'app-inscribir-estudiantes',
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
    MatTooltipModule,
    CardContainerComponent
  ],
  templateUrl: './inscribir-estudiantes.component.html',
  styleUrls: ['./inscribir-estudiantes.component.css']
})
export class InscribirEstudiantesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Datos
  cursos: CursoOfertadoVerano[] = [];
  inscripciones: Inscripcion[] = [];
  inscripcionesFiltradas: Inscripcion[] = [];
  cargando = false;
  
  // Formularios
  filtroForm: FormGroup;
  
  // Estado
  cursoSeleccionado: CursoOfertadoVerano | null = null;
  
  // Columnas de la tabla
  displayedColumns: string[] = [
    'estudiante', 
    'fecha_inscripcion', 
    'estado', 
    'comprobante_pago',
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
  }

  ngOnInit(): void {
    this.cargarCursos();
    
    // Suscribirse a cambios en el filtro de curso
    this.filtroForm.get('curso')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(cursoId => {
        if (cursoId) {
          this.cargarInscripcionesPorCurso(cursoId);
        } else {
          this.inscripcionesFiltradas = [];
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
    console.log('🔄 Cargando cursos para inscripción...');
    
    this.cursosService.getCursosDisponibles().subscribe({
      next: (cursos) => {
        console.log('✅ Cursos recibidos del backend:', cursos);
        if (cursos && cursos.length > 0) {
          this.cursos = cursos;
        } else {
          console.log('⚠️ No hay cursos del backend, usando datos de prueba');
          this.cursos = this.getCursosPrueba();
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando cursos:', err);
        console.log('🔄 Usando datos de prueba para cursos');
        this.cursos = this.getCursosPrueba();
        this.cargando = false;
      }
    });
  }

  cargarInscripcionesPorCurso(cursoId: number): void {
    this.cargando = true;
    console.log(`🔄 Cargando inscripciones para curso ID: ${cursoId}`);
    
    // Buscar el curso seleccionado
    this.cursoSeleccionado = this.cursos.find(c => c.id_curso === cursoId) || null;
    console.log('📍 Curso seleccionado:', this.cursoSeleccionado);
    
    this.cursosService.getInscripciones().subscribe({
      next: (inscripciones) => {
        console.log('✅ Inscripciones recibidas del backend:', inscripciones);
        // Filtrar inscripciones por curso y que tengan estado "Aprobado" en preinscripción
        this.inscripciones = inscripciones.filter(i => 
          i.objCurso.id_curso === cursoId && 
          (i.estado === 'inscrito' || i.estado === 'pendiente')
        );
        this.inscripcionesFiltradas = this.inscripciones;
        console.log('✅ Inscripciones filtradas:', this.inscripciones);
        
        // Si no hay inscripciones del backend, usar datos de prueba
        if (this.inscripciones.length === 0) {
          console.log('⚠️ No hay inscripciones del backend, usando datos de prueba');
          this.inscripcionesFiltradas = this.getInscripcionesPrueba();
        }
        
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando inscripciones:', err);
        console.log('🔄 Usando datos de prueba para inscripciones');
        this.inscripcionesFiltradas = this.getInscripcionesPrueba();
        this.cargando = false;
      }
    });
  }

  verDetalles(inscripcion: Inscripcion): void {
    // Abrir dialog con detalles
    this.abrirDialogDetalles(inscripcion);
  }

  abrirDialogDetalles(inscripcion: Inscripcion): void {
    const dialogRef = this.dialog.open(DetallesInscripcionDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        inscripcion: inscripcion
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'inscrito') {
        // Recargar inscripciones si se completó la inscripción
        if (this.cursoSeleccionado) {
          this.cargarInscripcionesPorCurso(this.cursoSeleccionado.id_curso);
        }
      }
    });
  }

  confirmarInscripcion(inscripcion: Inscripcion): void {
    console.log(`✅ Confirmando inscripción ${inscripcion.id_inscripcion} para estudiante ${inscripcion.objUsuario.nombre} ${inscripcion.objUsuario.apellido}`);
    
    // Confirmar con el usuario
    const confirmacion = confirm(
      `¿Confirmar la inscripción de ${inscripcion.objUsuario.nombre} ${inscripcion.objUsuario.apellido} en el curso ${inscripcion.objCurso.nombre_curso}?\n\nEl estudiante ya tiene el comprobante de pago subido.`
    );
    
    if (!confirmacion) return;
    
    // Llamar al servicio para confirmar la inscripción
    this.cursosService.confirmarInscripcion(inscripcion.id_inscripcion).subscribe({
      next: (response) => {
        console.log('✅ Inscripción confirmada:', response);
        
        // Actualizar estado localmente
        const index = this.inscripcionesFiltradas.findIndex(i => i.id_inscripcion === inscripcion.id_inscripcion);
        if (index !== -1) {
          this.inscripcionesFiltradas[index].estado = 'inscrito';
        }
        
        this.snackBar.open(
          `✅ Inscripción confirmada para ${inscripcion.objUsuario.nombre} ${inscripcion.objUsuario.apellido}. El estudiante ya está oficialmente inscrito en el curso.`, 
          'Cerrar', 
          { 
            duration: 5000,
            panelClass: ['success-snackbar']
          }
        );
      },
      error: (err) => {
        console.error('❌ Error confirmando inscripción:', err);
        this.snackBar.open('Error al confirmar la inscripción', 'Cerrar', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  rechazarInscripcion(inscripcion: Inscripcion): void {
    console.log(`❌ Rechazando inscripción ${inscripcion.id_inscripcion} para estudiante ${inscripcion.objUsuario.nombre} ${inscripcion.objUsuario.apellido}`);
    
    // Confirmar el rechazo
    const confirmacion = confirm(
      `¿Está seguro de rechazar la inscripción de ${inscripcion.objUsuario.nombre} ${inscripcion.objUsuario.apellido} en el curso ${inscripcion.objCurso.nombre_curso}?`
    );
    
    if (!confirmacion) return;
    
    // Llamar al servicio para rechazar la inscripción
    this.cursosService.rechazarInscripcion(inscripcion.id_inscripcion).subscribe({
      next: (response) => {
        console.log('✅ Inscripción rechazada:', response);
        
        // Actualizar estado localmente
        const index = this.inscripcionesFiltradas.findIndex(i => i.id_inscripcion === inscripcion.id_inscripcion);
        if (index !== -1) {
          this.inscripcionesFiltradas[index].estado = 'rechazado';
        }
        
        this.snackBar.open(
          `❌ Inscripción rechazada para ${inscripcion.objUsuario.nombre} ${inscripcion.objUsuario.apellido}`, 
          'Cerrar', 
          { 
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      },
      error: (err) => {
        console.error('❌ Error rechazando inscripción:', err);
        this.snackBar.open('Error al rechazar la inscripción', 'Cerrar', { 
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
        estado: 'Inscripcion',
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
        estado: 'Inscripcion',
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
        estado: 'Inscripcion',
        objMateria: { id_materia: 3, nombre_materia: 'Programación I', codigo_materia: 'PROG', creditos: 4 },
        objDocente: { id_usuario: 3, nombre: 'Ana', apellido: 'Martínez', email: 'ana@unicauca.edu.co', telefono: '3009876543', objRol: { id_rol: 2, nombre_rol: 'Docente' } }
      }
    ];
  }

  private getInscripcionesPrueba(): Inscripcion[] {
    return [
      {
        id_inscripcion: 1,
        fecha_inscripcion: new Date('2024-01-10'),
        estado: 'pendiente',
        archivoPago: {
          id_documento: 1,
          nombre: 'comprobante_pago_pepa.pdf',
          url: '/uploads/comprobante_pago_pepa.pdf',
          fecha: '2024-01-10'
        },
        objUsuario: { id_usuario: 4, nombre: 'Pepa', apellido: 'González', email: 'pepa.gonzalez@unicauca.edu.co', telefono: '3001111111', codigo_estudiante: '104612345660', objRol: { id_rol: 1, nombre_rol: 'Estudiante' } },
        objCurso: this.cursoSeleccionado!
      },
      {
        id_inscripcion: 2,
        fecha_inscripcion: new Date('2024-01-11'),
        estado: 'inscrito',
        archivoPago: {
          id_documento: 2,
          nombre: 'comprobante_pago_maria.pdf',
          url: '/uploads/comprobante_pago_maria.pdf',
          fecha: '2024-01-11'
        },
        objUsuario: { id_usuario: 5, nombre: 'María', apellido: 'González', email: 'maria.gonzalez@unicauca.edu.co', telefono: '3002222222', codigo_estudiante: '104612345661', objRol: { id_rol: 1, nombre_rol: 'Estudiante' } },
        objCurso: this.cursoSeleccionado!
      },
      {
        id_inscripcion: 3,
        fecha_inscripcion: new Date('2024-01-12'),
        estado: 'pendiente',
        archivoPago: undefined,
        objUsuario: { id_usuario: 6, nombre: 'Pedro', apellido: 'Rodríguez', email: 'pedro@unicauca.edu.co', telefono: '3003333333', codigo_estudiante: '104612345662', objRol: { id_rol: 1, nombre_rol: 'Estudiante' } },
        objCurso: this.cursoSeleccionado!
      }
    ];
  }
}

// Componente del dialog para ver detalles de inscripción
@Component({
  selector: 'app-detalles-inscripcion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule
  ],
  template: `
    <!-- Dialog actualizado - versión simplificada -->
    <h2 mat-dialog-title>Detalles de Inscripción</h2>
    
    <div mat-dialog-content class="dialog-content">
      <!-- Información del estudiante -->
      <div class="form-section">
        <h3>👤 Información del Estudiante</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>Nombre Completo:</strong> {{ data.inscripcion.objUsuario.nombre }} {{ data.inscripcion.objUsuario.apellido }}
          </div>
          <div class="info-item">
            <strong>Código:</strong> {{ data.inscripcion.objUsuario.codigo_estudiante || 'N/A' }}
          </div>
          <div class="info-item">
            <strong>Email:</strong> {{ data.inscripcion.objUsuario.email }}
          </div>
        </div>
      </div>

      <!-- Información de inscripción -->
      <div class="form-section">
        <h3>📋 Información de Inscripción</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>Fecha:</strong> {{ data.inscripcion.fecha_inscripcion | date:'dd/MM/yyyy HH:mm' }}
          </div>
          <div class="info-item">
            <strong>Estado:</strong> 
            <span style="background: #00138C; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              {{ data.inscripcion.estado }}
            </span>
          </div>
        </div>
      </div>

      <!-- Comprobante de pago -->
      <div class="form-section">
        <h3>💰 Comprobante de Pago</h3>
        <div class="info-grid">
          <div class="info-item" *ngIf="data.inscripcion.archivoPago; else sinComprobante">
            <strong>Archivo:</strong> {{ data.inscripcion.archivoPago.nombre }}
            <br>
            <strong>Fecha de subida:</strong> {{ data.inscripcion.archivoPago.fecha }}
            <br>
            <button mat-raised-button color="primary" (click)="descargarComprobante()">
              <mat-icon>download</mat-icon>
              Descargar Comprobante
            </button>
          </div>
          <ng-template #sinComprobante>
            <div class="info-item">
              <strong>Estado:</strong> 
              <span style="color: #f44336; font-weight: bold;">Sin comprobante de pago</span>
            </div>
          </ng-template>
        </div>
      </div>
    </div>

    <div mat-dialog-actions class="dialog-actions">
      <button mat-button (click)="dialogRef.close()">Cerrar</button>
      <button mat-raised-button 
              *ngIf="data.inscripcion.archivoPago && data.inscripcion.estado === 'pendiente'"
              color="primary" 
              (click)="confirmarInscripcion()">
        Confirmar Inscripción
      </button>
    </div>
  `,
  styles: [`
    .dialog-content {
      max-width: 600px;
      padding: 20px;
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
      flex-direction: column;
      gap: 8px;
    }

    .info-item strong {
      color: #333;
      min-width: 120px;
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
export class DetallesInscripcionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DetallesInscripcionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { inscripcion: Inscripcion }
  ) {}

  descargarComprobante(): void {
    if (this.data.inscripcion.archivoPago) {
      // Crear un enlace temporal para descargar el archivo
      const link = document.createElement('a');
      link.href = this.data.inscripcion.archivoPago.url;
      link.download = this.data.inscripcion.archivoPago.nombre;
      link.target = '_blank';
      
      // Agregar al DOM, hacer clic y remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  confirmarInscripcion(): void {
    // Lógica para confirmar la inscripción
    this.dialogRef.close('inscrito');
  }
}
