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
import { CursosIntersemestralesService, CursoOfertadoVerano, Inscripcion, EstudianteElegible } from '../../../../core/services/cursos-intersemestrales.service';
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
  estudiantesElegibles: EstudianteElegible[] = [];
  estudiantesFiltrados: EstudianteElegible[] = [];
  cargando = false;
  
  // Formularios
  filtroForm: FormGroup;
  
  // Estado
  cursoSeleccionado: CursoOfertadoVerano | null = null;
  
  // Columnas de la tabla
  displayedColumns: string[] = [
    'estudiante', 
    'fecha_inscripcion', 
    'estado_inscripcion', 
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
          this.cargarEstudiantesElegibles(cursoId);
        } else {
          this.estudiantesFiltrados = [];
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
    console.log('🔄 Cargando cursos para inscripción (funcionarios)...');
    console.log('🔍 Usuario actual:', this.cursosService);
    
    // Para funcionarios, usar el endpoint que obtiene todos los cursos
    this.cursosService.getTodosLosCursosParaFuncionarios().subscribe({
      next: (response) => {
        console.log('✅ Respuesta recibida del backend:', response);
        console.log('🔍 Tipo de respuesta:', typeof response);
        
        // El backend devuelve { value: [...], Count: n }
        let cursos = response;
        if (response && (response as any).value) {
          cursos = (response as any).value;
          console.log('🔍 Cursos extraídos de response.value:', cursos);
        }
        
        console.log('🔍 Cantidad de cursos:', cursos?.length);
        
        if (cursos && cursos.length > 0) {
          // Filtrar solo cursos en estado "Inscripcion" (sin tilde, como viene del backend)
          this.cursos = cursos.filter((c: any) => c.estado === 'Inscripcion');
          console.log('✅ Cursos en estado "Inscripcion":', this.cursos);
          console.log('🔍 Cantidad de cursos filtrados:', this.cursos.length);
          
          // Si no hay cursos filtrados, mostrar todos los cursos disponibles
          if (this.cursos.length === 0) {
            console.log('⚠️ No hay cursos en estado "Inscripcion", mostrando todos los cursos');
            this.cursos = cursos;
          }
        } else {
          console.log('⚠️ No hay cursos del backend');
          this.cursos = [];
          
          // Mostrar mensaje informativo al usuario
          this.snackBar.open(
            'No hay cursos disponibles en este momento. Contacte al administrador.', 
            'Cerrar', 
            { 
              duration: 5000,
              panelClass: ['warning-snackbar']
            }
          );
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando cursos:', err);
        console.error('❌ Detalles del error:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          url: err.url
        });
        console.log('🔄 Error al cargar cursos del backend');
        this.cursos = [];
        
        // Mostrar mensaje de error al usuario
        this.snackBar.open(
          'Error al cargar los cursos. Verifique su conexión o contacte al administrador.', 
          'Cerrar', 
          { 
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
        this.cargando = false;
      }
    });
  }

  cargarEstudiantesElegibles(cursoId: number): void {
    this.cargando = true;
    console.log(`🔄 Cargando estudiantes elegibles para curso ID: ${cursoId}`);
    
    // Buscar el curso seleccionado
    this.cursoSeleccionado = this.cursos.find(c => c.id_curso === cursoId) || null;
    console.log('📍 Curso seleccionado:', this.cursoSeleccionado);
    
    // 🆕 Usar el nuevo endpoint que filtra automáticamente estudiantes con pago validado
    this.cursosService.getEstudiantesElegibles(cursoId).subscribe({
      next: (estudiantes) => {
        console.log('✅ Estudiantes elegibles recibidos del backend:', estudiantes);
        console.log('🔍 Estructura de primer estudiante:', estudiantes[0]);
        if (estudiantes[0]) {
          console.log('🔍 Campos disponibles en estudiante:', Object.keys(estudiantes[0]));
          console.log('🔍 Usuario:', estudiantes[0].objUsuario);
          console.log('🔍 Estado inscripción:', estudiantes[0].estado_inscripcion);
          console.log('🔍 Archivo pago:', estudiantes[0].archivoPago);
        }
        
        this.estudiantesElegibles = estudiantes;
        this.estudiantesFiltrados = this.estudiantesElegibles;
        console.log('✅ Estudiantes elegibles cargados para curso', cursoId, ':', this.estudiantesElegibles);
        
        // Si no hay estudiantes elegibles, mostrar mensaje informativo
        if (this.estudiantesElegibles.length === 0) {
          console.log('⚠️ No hay estudiantes elegibles - todos deben tener preinscripción aprobada y pago validado');
          this.estudiantesFiltrados = [];
          
          // Mostrar mensaje informativo al usuario
          this.snackBar.open(
            'No hay estudiantes elegibles para este curso. Todos los estudiantes deben tener preinscripción aprobada y pago validado.', 
            'Cerrar', 
            { 
              duration: 5000,
              panelClass: ['info-snackbar']
            }
          );
        }
        
        this.cargando = false;
      },
      error: (err) => {
        console.error('❌ Error cargando estudiantes elegibles:', err);
        console.error('❌ Detalles del error:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          url: err.url
        });
        console.log('🔄 Mostrando lista vacía debido al error');
        this.estudiantesFiltrados = [];
        this.cargando = false;
        
        // Mostrar mensaje de error al usuario
        this.snackBar.open('Error al cargar los estudiantes elegibles', 'Cerrar', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  verDetalles(estudiante: EstudianteElegible): void {
    // Abrir dialog con detalles
    this.abrirDialogDetalles(estudiante);
  }

  abrirDialogDetalles(estudiante: EstudianteElegible): void {
    const dialogRef = this.dialog.open(DetallesInscripcionDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        estudiante: estudiante
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'inscrito') {
        // Recargar estudiantes elegibles si se completó la inscripción
        if (this.cursoSeleccionado) {
          this.cargarEstudiantesElegibles(this.cursoSeleccionado.id_curso);
        }
      }
    });
  }

  confirmarInscripcion(estudiante: EstudianteElegible): void {
    console.log(`✅ Confirmando inscripción ${estudiante.id_inscripcion} para estudiante ${estudiante.objUsuario.nombre_completo}`);
    
    // Confirmar con el usuario
    const confirmacion = confirm(
      `¿Confirmar la inscripción de ${estudiante.objUsuario.nombre_completo} en el curso ${estudiante.objCurso.nombre_curso}?\n\nEl estudiante ya tiene el comprobante de pago validado.`
    );
    
    if (!confirmacion) return;
    
    // Llamar al servicio para confirmar la inscripción
    this.cursosService.confirmarInscripcion(estudiante.id_inscripcion).subscribe({
      next: (response) => {
        console.log('✅ Inscripción confirmada:', response);
        
        // Actualizar estado localmente
        const index = this.estudiantesFiltrados.findIndex(e => e.id_inscripcion === estudiante.id_inscripcion);
        if (index !== -1) {
          this.estudiantesFiltrados[index].estado_inscripcion = 'Inscrito';
        }
        
        this.snackBar.open(
          `✅ Inscripción confirmada para ${estudiante.objUsuario.nombre_completo}. El estudiante ya está oficialmente inscrito en el curso.`, 
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

  rechazarInscripcion(estudiante: EstudianteElegible): void {
    console.log(`❌ Rechazando inscripción ${estudiante.id_inscripcion} para estudiante ${estudiante.objUsuario.nombre_completo}`);
    
    // Confirmar el rechazo
    const confirmacion = confirm(
      `¿Está seguro de rechazar la inscripción de ${estudiante.objUsuario.nombre_completo} en el curso ${estudiante.objCurso.nombre_curso}?`
    );
    
    if (!confirmacion) return;
    
    // Llamar al servicio para rechazar la inscripción
    this.cursosService.rechazarInscripcion(estudiante.id_inscripcion).subscribe({
      next: (response) => {
        console.log('✅ Inscripción rechazada:', response);
        
        // Actualizar estado localmente
        const index = this.estudiantesFiltrados.findIndex(e => e.id_inscripcion === estudiante.id_inscripcion);
        if (index !== -1) {
          this.estudiantesFiltrados[index].estado_inscripcion = 'Rechazado';
        }
        
        this.snackBar.open(
          `❌ Inscripción rechazada para ${estudiante.objUsuario.nombre_completo}`, 
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
            <strong>Nombre Completo:</strong> {{ data.estudiante.objUsuario.nombre_completo }}
          </div>
          <div class="info-item">
            <strong>Código:</strong> {{ data.estudiante.objUsuario.codigo_estudiante || 'N/A' }}
          </div>
          <div class="info-item">
            <strong>Email:</strong> {{ data.estudiante.objUsuario.correo }}
          </div>
        </div>
      </div>

      <!-- Información de inscripción -->
      <div class="form-section">
        <h3>📋 Información de Inscripción</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>Fecha Inscripción:</strong> {{ data.estudiante.fecha_inscripcion | date:'dd/MM/yyyy HH:mm' }}
          </div>
          <div class="info-item">
            <strong>Estado Inscripción:</strong> 
            <span style="background: #00138C; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              {{ data.estudiante.estado_inscripcion }}
            </span>
          </div>
          <div class="info-item">
            <strong>Fecha Preinscripción:</strong> {{ data.estudiante.fecha_preinscripcion | date:'dd/MM/yyyy HH:mm' }}
          </div>
          <div class="info-item">
            <strong>Estado Preinscripción:</strong> 
            <span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              {{ data.estudiante.estado_preinscripcion }}
            </span>
          </div>
        </div>
      </div>

      <!-- Comprobante de pago -->
      <div class="form-section">
        <h3>💰 Comprobante de Pago</h3>
        <div class="info-grid">
          <div class="info-item" *ngIf="data.estudiante.archivoPago; else sinComprobante">
            <strong>Archivo:</strong> {{ data.estudiante.archivoPago.nombre }}
            <br>
            <strong>Fecha de subida:</strong> {{ data.estudiante.archivoPago.fecha }}
            <br>
            <strong>Estado:</strong> 
            <span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              Pago Validado ✅
            </span>
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
              *ngIf="data.estudiante.archivoPago && data.estudiante.estado_inscripcion === 'Pago_Validado'"
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
    @Inject(MAT_DIALOG_DATA) public data: { estudiante: EstudianteElegible }
  ) {}

  descargarComprobante(): void {
    if (this.data.estudiante.archivoPago) {
      // Crear un enlace temporal para descargar el archivo
      const link = document.createElement('a');
      link.href = this.data.estudiante.archivoPago.url;
      link.download = this.data.estudiante.archivoPago.nombre;
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
