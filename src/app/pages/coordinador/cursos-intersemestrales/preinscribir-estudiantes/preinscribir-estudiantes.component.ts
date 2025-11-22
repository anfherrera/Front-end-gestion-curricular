import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
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
import { CursosIntersemestralesService, CursoOfertadoVerano, Preinscripcion, SolicitudCursoVerano, EstadoSolicitudDetalle } from '../../../../core/services/cursos-intersemestrales.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../../core/enums/roles.enum';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';

@Component({
  selector: 'app-preinscribir-estudiantes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
    private authService: AuthService,
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
    // Cargando cursos para preinscripción
    
    this.cursosService.getCursosDisponibles().subscribe({
      next: (cursos) => {
        this.cursos = cursos;
        // Cursos cargados
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando cursos:', err);
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
    // Cargando información del curso
    
    // Cargar información actualizada del curso específico
    this.cursosService.getCursoPorId(cursoId).subscribe({
      next: (curso) => {
        this.cursoSeleccionado = curso;
        // Información del curso cargada
        
        // Ahora cargar las preinscripciones para este curso
        this.cursosService.getPreinscripcionesPorCurso(cursoId).subscribe({
          next: (solicitudes) => {
            this.solicitudes = solicitudes;
            this.solicitudesFiltradas = this.solicitudes;
            // Preinscripciones cargadas
            this.cargando = false;
          },
          error: (err) => {
            console.error('Error cargando preinscripciones:', err);
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
        console.error('Error cargando información del curso:', err);
        // Fallback: buscar el curso en la lista local
        this.cursoSeleccionado = this.cursos.find(c => c.id_curso === cursoId) || null;
        
        // Intentar cargar preinscripciones de todas formas
        this.cursosService.getPreinscripcionesPorCurso(cursoId).subscribe({
          next: (solicitudes) => {
            this.solicitudes = solicitudes;
            this.solicitudesFiltradas = this.solicitudes;
            // Preinscripciones cargadas (sin info del curso)
            this.cargando = false;
          },
          error: (err) => {
            console.error('Error cargando preinscripciones:', err);
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
    // Usar el campo correcto del ID
    const idSolicitud = (solicitud as any).id_solicitud || (solicitud as any).id_preinscripcion;
    // Abriendo modal de detalles para preinscripción
    
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
        // Usar el campo correcto del ID
        const idSolicitud = (solicitud as any).id_solicitud || (solicitud as any).id_preinscripcion;
        this.actualizarObservaciones(idSolicitud, result.observaciones);
      }
    });
  }

  actualizarObservaciones(idSolicitud: number, observaciones: string): void {
    // DEBUG - ID de solicitud para observaciones
    // DEBUG - Observaciones
    
    if (!idSolicitud) {
      console.error('ERROR: ID de solicitud es undefined para observaciones');
      this.snackBar.open('Error: No se pudo identificar la preinscripción para guardar observaciones', 'Cerrar', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    // Actualizando observaciones para preinscripción
    
    this.cursosService.actualizarObservacionesPreinscripcion(idSolicitud, observaciones).subscribe({
      next: (response) => {
        // Observaciones actualizadas
        
        // Actualizar localmente usando el ID correcto
        const index = this.solicitudesFiltradas.findIndex(s => {
          const sId = (s as any).id_solicitud || (s as any).id_preinscripcion;
          return sId === idSolicitud;
        });
        if (index !== -1) {
          this.solicitudesFiltradas[index].observaciones = observaciones;
        }
        
        this.snackBar.open('Observaciones guardadas exitosamente', 'Cerrar', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      },
      error: (err) => {
        console.error('Error actualizando observaciones:', err);
        this.snackBar.open('Error al guardar las observaciones', 'Cerrar', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  aprobarSolicitud(solicitud: SolicitudCursoVerano): void {
    // DEBUG - Objeto solicitud completo
    // DEBUG - Campos disponibles
    
    // Usar el campo correcto del ID (id_solicitud o id_preinscripcion)
    const idSolicitud = (solicitud as any).id_solicitud || (solicitud as any).id_preinscripcion;
    // DEBUG - ID encontrado
    // DEBUG - Tipo de ID
    
    if (!idSolicitud) {
      console.error('ERROR: No se encontró ID de la solicitud');
      this.snackBar.open('Error: No se pudo identificar la preinscripción', 'Cerrar', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    // Aprobando preinscripción
    
    this.cursosService.aprobarPreinscripcion(idSolicitud).subscribe({
      next: (response) => {
        // Preinscripción aprobada
        
        // Actualizar estado localmente usando el ID correcto
        const index = this.solicitudesFiltradas.findIndex(s => {
          const sId = (s as any).id_solicitud || (s as any).id_preinscripcion;
          return sId === idSolicitud;
        });
        if (index !== -1) {
          this.solicitudesFiltradas[index].estado = 'Aprobado';
        }
        
        this.snackBar.open(`Preinscripción de ${solicitud.objUsuario.nombre_completo} aprobada exitosamente. El estudiante puede proceder a inscripción.`, 'Cerrar', { 
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      },
      error: (err) => {
        console.error('Error aprobando preinscripción:', err);
        // DEBUG - Status
        console.error('🔍 DEBUG - Status Text:', err.statusText);
        console.error('🔍 DEBUG - Error Body:', err.error);
        console.error('🔍 DEBUG - Full Error:', JSON.stringify(err, null, 2));
        
        let errorMessage = 'Error al aprobar la preinscripción';
        
        if (err.status === 500) {
          errorMessage = 'Error interno del servidor. Verifique los logs del backend.';
        } else if (err.error && err.error.message) {
          errorMessage = err.error.message;
        } else if (err.error && typeof err.error === 'string') {
          errorMessage = err.error;
        } else if (err.status === 404) {
          errorMessage = 'Preinscripción no encontrada';
        } else if (err.status === 400) {
          errorMessage = 'Datos inválidos para aprobar la preinscripción';
        }
        
        this.snackBar.open(`❌ ${errorMessage}`, 'Cerrar', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  rechazarSolicitud(solicitud: SolicitudCursoVerano): void {
    // ✅ Usar el campo correcto del ID
    const idSolicitud = (solicitud as any).id_solicitud || (solicitud as any).id_preinscripcion;
    console.log(`❌ Abriendo modal de rechazo para preinscripción ${idSolicitud}`);
    
    // Abrir modal para solicitar motivo de rechazo
    this.abrirModalRechazo(solicitud);
  }

  abrirModalRechazo(solicitud: SolicitudCursoVerano): void {
    console.log('❌ Abriendo diálogo de rechazo para preinscripción:', solicitud);
    console.log('🔍 Curso seleccionado:', this.cursoSeleccionado);
    
    // Abrir diálogo de Angular Material
    const dialogRef = this.dialog.open(RechazoPreinscripcionDialogComponent, {
      width: '600px',
      data: { 
        solicitud: solicitud,
        curso: this.cursoSeleccionado || solicitud.objCursoOfertadoVerano
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.motivo) {
        this.procesarRechazo(solicitud, result.motivo);
      }
    });
  }

  cancelarRechazo(): void {
    // Ya no se necesita, el diálogo maneja su propio cierre
  }

  procesarRechazo(solicitud: SolicitudCursoVerano, motivo: string): void {
    const idSolicitud = (solicitud as any).id_solicitud || (solicitud as any).id_preinscripcion;
    
    if (!idSolicitud) {
      console.error('❌ ERROR: ID de solicitud es undefined o null para rechazo');
      this.snackBar.open('Error: No se pudo identificar la preinscripción para rechazar', 'Cerrar', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    console.log(`❌ Confirmando rechazo de preinscripción ${idSolicitud} con motivo:`, motivo);
    
    this.cursosService.rechazarPreinscripcion(idSolicitud, motivo).subscribe({
      next: (response) => {
        console.log('✅ Preinscripción rechazada:', response);
        
        // Actualizar estado localmente usando el ID correcto
        const index = this.solicitudesFiltradas.findIndex(s => {
          const sId = (s as any).id_solicitud || (s as any).id_preinscripcion;
          return sId === idSolicitud;
        });
        if (index !== -1) {
          this.solicitudesFiltradas[index].estado = 'Rechazado';
        }
        
        const motivoRespuesta = (response && response.motivo ? response.motivo : motivo);
        this.snackBar.open(`Preinscripción rechazada exitosamente. Motivo: ${motivoRespuesta}`, 'Cerrar', { 
          duration: 5000,
          panelClass: ['success-snackbar']
        });

        if (this.cursoSeleccionado?.id_curso) {
          this.cargarSolicitudesPorCurso(this.cursoSeleccionado.id_curso);
        }
      },
      error: (err) => {
        console.error('❌ Error rechazando preinscripción:', err);
        console.error('🔍 DEBUG - Status:', err.status);
        console.error('🔍 DEBUG - Status Text:', err.statusText);
        console.error('🔍 DEBUG - Error Body:', err.error);
        console.error('🔍 DEBUG - Full Error:', JSON.stringify(err, null, 2));
        
        let errorMessage = 'Error al rechazar la preinscripción';
        
        if (err.status === 500) {
          errorMessage = 'Error interno del servidor. Verifique los logs del backend.';
        } else if (err.error && err.error.message) {
          errorMessage = err.error.message;
        } else if (err.error && typeof err.error === 'string') {
          errorMessage = err.error;
        } else if (err.status === 404) {
          errorMessage = 'Preinscripción no encontrada';
        } else if (err.status === 400) {
          errorMessage = 'Datos inválidos para rechazar la preinscripción';
        }
        
        this.snackBar.open(`❌ ${errorMessage}`, 'Cerrar', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  getEstadoColor(estado: string): string {
    return '#00138C'; // Color azul consistente
  }

  // ===== VALIDACIONES DE PERMISOS =====

  /**
   * Verificar si el usuario puede gestionar preinscripciones (aprobar/rechazar)
   */
  puedeGestionarPreinscripciones(): boolean {
    const userRole = this.authService.getRole();
    return userRole === UserRole.FUNCIONARIO || userRole === UserRole.ADMIN || userRole === UserRole.COORDINADOR;
  }

  /**
   * Verificar si se puede aprobar una preinscripción específica
   */
  puedeAprobar(solicitud: SolicitudCursoVerano): boolean {
    if (!this.puedeGestionarPreinscripciones()) {
      return false;
    }
    
    // Se pueden aprobar preinscripciones en estado Pendiente, Enviado o Enviada
    return solicitud.estado === 'Pendiente' || solicitud.estado === 'Enviado' || solicitud.estado === 'Enviada';
  }

  /**
   * Verificar si se puede rechazar una preinscripción específica
   */
  puedeRechazar(solicitud: SolicitudCursoVerano): boolean {
    if (!this.puedeGestionarPreinscripciones()) {
      return false;
    }
    
    // Se pueden rechazar preinscripciones en estado Pendiente, Enviado o Enviada
    return solicitud.estado === 'Pendiente' || solicitud.estado === 'Enviado' || solicitud.estado === 'Enviada';
  }

  /**
   * Verificar si se puede ver los detalles de una preinscripción
   */
  puedeVerDetalles(solicitud: SolicitudCursoVerano): boolean {
    // Todos los funcionarios/coordinadores pueden ver detalles
    return this.puedeGestionarPreinscripciones();
  }

  // Obtener nombre del docente de forma segura
  obtenerNombreDocente(curso: CursoOfertadoVerano | null): string {
    if (!curso || !curso.objDocente) {
      return 'Sin asignar';
    }
    
    // Priorizar nombre_docente (estructura del backend)
    if ((curso.objDocente as any).nombre_docente) {
      return (curso.objDocente as any).nombre_docente;
    }
    
    // Fallback a nombre y apellido (estructura legacy)
    if (curso.objDocente.nombre && curso.objDocente.apellido) {
      return `${curso.objDocente.nombre} ${curso.objDocente.apellido}`;
    }
    
    if (curso.objDocente.nombre) {
      return curso.objDocente.nombre;
    }
    
    return 'Sin nombre';
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

      <!-- Historial de estados -->
      <div class="form-section historial" *ngIf="tieneHistorial">
        <h3>📜 Historial de estados</h3>
        <div class="timeline">
          <div 
            *ngFor="let estado of estadosOrdenados"
            class="timeline-item"
            [ngClass]="{ 'timeline-item--rechazo': esRechazo(estado.estado) }">
            <div class="timeline-dot"></div>
            <div class="timeline-line"></div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-estado">{{ estado.estado }}</span>
                <span *ngIf="estado.fecha" class="timeline-fecha">{{ estado.fecha }}</span>
              </div>
              <p *ngIf="estado.comentario" class="timeline-comentario">{{ estado.comentario }}</p>
            </div>
          </div>
        </div>
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

    .form-section.historial {
      border-left-color: #607d8b;
    }

    .form-section h3 {
      margin: 0 0 16px 0;
      color: #00138C;
      font-size: 16px;
      font-weight: 600;
    }

    .form-section.historial h3 {
      color: #37474f;
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

    .timeline {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 18px;
      padding-left: 12px;
    }

    .timeline-item {
      position: relative;
      display: flex;
      gap: 12px;
      padding-left: 12px;
    }

    .timeline-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #1e88e5;
      box-shadow: 0 0 0 4px rgba(30, 136, 229, 0.15);
      margin-top: 4px;
      flex-shrink: 0;
    }

    .timeline-item--rechazo .timeline-dot {
      background: #e53935;
      box-shadow: 0 0 0 4px rgba(229, 57, 53, 0.15);
    }

    .timeline-line {
      position: absolute;
      top: 16px;
      left: 17px;
      width: 2px;
      height: calc(100% + 18px);
      background: rgba(0, 0, 0, 0.1);
    }

    .timeline-item:last-child .timeline-line {
      display: none;
    }

    .timeline-content {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 12px;
      padding: 12px 16px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      flex: 1;
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .timeline-estado {
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #37474f;
    }

    .timeline-item--rechazo .timeline-estado {
      color: #c62828;
    }

    .timeline-fecha {
      font-size: 12px;
      color: #607d8b;
    }

    .timeline-comentario {
      margin: 0;
      font-size: 13px;
      color: #455a64;
      line-height: 1.6;
      white-space: pre-wrap;
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
  estadosOrdenados: EstadoSolicitudDetalle[] = [];

  constructor(
    public dialogRef: MatDialogRef<DetallesPreinscripcionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { solicitud: SolicitudCursoVerano },
    private fb: FormBuilder
  ) {
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

// Componente del modal para rechazar preinscripción
@Component({
  selector: 'app-rechazo-preinscripcion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="rechazo-dialog">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon class="title-icon">cancel</mat-icon>
        Rechazar Preinscripción
      </h2>
      
      <div mat-dialog-content class="dialog-content">
        <div class="info-section">
          <h3 class="section-title">
            <mat-icon class="section-icon">person</mat-icon>
            Información del Estudiante
          </h3>
          <div class="student-info">
            <div class="info-row">
              <span class="info-label">Nombre:</span>
              <span class="info-value">{{ data.solicitud.objUsuario.nombre_completo || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Código:</span>
              <span class="info-value">{{ data.solicitud.objUsuario.codigo || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Curso:</span>
              <span class="info-value">{{ getNombreCurso() }}</span>
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title warning">
            <mat-icon class="section-icon">warning</mat-icon>
            Motivo del Rechazo
          </h3>
          <p class="required-note">El motivo del rechazo es obligatorio para proceder.</p>
          <form [formGroup]="rechazoForm">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Ingrese el motivo del rechazo</mat-label>
              <textarea matInput 
                        formControlName="motivo"
                        placeholder="Ej: No cumple con los requisitos académicos, cupo lleno, documentación incompleta..."
                        rows="4"
                        required>
              </textarea>
              <mat-error *ngIf="rechazoForm.get('motivo')?.hasError('required')">
                El motivo del rechazo es obligatorio
              </mat-error>
              <mat-error *ngIf="rechazoForm.get('motivo')?.hasError('minlength')">
                El motivo debe tener al menos 10 caracteres
              </mat-error>
            </mat-form-field>
          </form>
        </div>
      </div>

      <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="dialogRef.close()" class="btn-cancel">
          <mat-icon>close</mat-icon>
          Cancelar
        </button>
        <button mat-raised-button 
                color="warn" 
                (click)="confirmarRechazo()"
                [disabled]="rechazoForm.invalid"
                class="btn-reject">
          <mat-icon>cancel</mat-icon>
          Confirmar Rechazo
        </button>
      </div>
    </div>
  `,
  styles: [`
    .rechazo-dialog {
      max-width: 600px;
    }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #00138C;
      font-weight: 600;
      padding: 20px 24px;
      border-bottom: 2px solid #00138C;
      margin: 0;
    }

    .title-icon {
      color: #f44336;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .dialog-content {
      padding: 24px;
    }

    .info-section {
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
      border-left: 4px solid #00138C;
      box-shadow: 0 2px 8px rgba(0, 19, 140, 0.1);
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      color: #00138C;
      font-size: 16px;
      font-weight: 600;
    }

    .section-title.warning {
      color: #f44336;
    }

    .section-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #00138C;
    }

    .section-title.warning .section-icon {
      color: #f44336;
    }

    .student-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      color: #00138C;
      min-width: 80px;
      font-size: 14px;
    }

    .info-value {
      color: #333;
      font-size: 14px;
      flex: 1;
    }

    .form-section {
      background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
      border-radius: 8px;
      padding: 20px;
      border-left: 4px solid #f44336;
      box-shadow: 0 2px 8px rgba(244, 67, 54, 0.1);
    }

    .required-note {
      color: #f44336;
      font-size: 13px;
      margin: 0 0 16px 0;
      font-weight: 500;
      padding: 8px 12px;
      background: rgba(244, 67, 54, 0.1);
      border-radius: 4px;
      border-left: 3px solid #f44336;
    }

    .full-width {
      width: 100%;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 24px;
      border-top: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    .btn-cancel {
      color: #666;
      border: 1px solid #ddd;
    }

    .btn-cancel:hover {
      background: #f5f5f5;
    }

    .btn-reject {
      background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
      color: white;
      border: none;
      box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
    }

    .btn-reject:hover:not(:disabled) {
      background: linear-gradient(135deg, #d32f2f 0%, #c62828 100%);
      box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
      transform: translateY(-1px);
    }

    .btn-reject:disabled {
      background: #ccc;
      color: #666;
      box-shadow: none;
    }

    ::ng-deep .mat-mdc-form-field {
      .mat-mdc-text-field-wrapper {
        background-color: white;
      }
      .mat-mdc-form-field-subscript-wrapper {
        margin-top: 4px;
      }
    }

    ::ng-deep .mat-mdc-dialog-container {
      padding: 0 !important;
    }

    ::ng-deep .mat-mdc-dialog-title {
      margin: 0 !important;
    }
  `]
})
export class RechazoPreinscripcionDialogComponent {
  rechazoForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<RechazoPreinscripcionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      solicitud: SolicitudCursoVerano,
      curso?: CursoOfertadoVerano | null
    },
    private fb: FormBuilder
  ) {
    this.rechazoForm = this.fb.group({
      motivo: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  getNombreCurso(): string {
    // Intentar obtener el nombre del curso de diferentes fuentes
    if (this.data.curso?.nombre_curso) {
      return this.data.curso.nombre_curso;
    }
    if (this.data.solicitud.objCursoOfertadoVerano?.nombre_curso) {
      return this.data.solicitud.objCursoOfertadoVerano.nombre_curso;
    }
    if ((this.data.solicitud as any).nombre_curso) {
      return (this.data.solicitud as any).nombre_curso;
    }
    return 'N/A';
  }

  confirmarRechazo(): void {
    if (this.rechazoForm.valid) {
      this.dialogRef.close({
        motivo: this.rechazoForm.value.motivo.trim()
      });
    }
  }
}

