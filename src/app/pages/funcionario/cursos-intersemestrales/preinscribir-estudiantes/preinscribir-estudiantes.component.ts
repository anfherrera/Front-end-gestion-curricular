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
import { CursosIntersemestralesService, CursoOfertadoVerano, Preinscripcion, SolicitudCursoVerano } from '../../../../core/services/cursos-intersemestrales.service';
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
  
  // Variables para el modal de rechazo
  motivoRechazo: string = '';
  motivoRechazoError: string = '';
  solicitudParaRechazo: SolicitudCursoVerano | null = null;
  
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
            console.log('🔍 DEBUG - Primera solicitud completa:', this.solicitudes[0]);
            if (this.solicitudes[0]) {
              console.log('🔍 DEBUG - Campos disponibles:', Object.keys(this.solicitudes[0]));
              console.log('🔍 DEBUG - ID de primera solicitud:', this.solicitudes[0].id_solicitud);
            }
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
            console.log('🔍 DEBUG - Primera solicitud completa (fallback):', this.solicitudes[0]);
            if (this.solicitudes[0]) {
              console.log('🔍 DEBUG - Campos disponibles (fallback):', Object.keys(this.solicitudes[0]));
              console.log('🔍 DEBUG - ID de primera solicitud (fallback):', this.solicitudes[0].id_solicitud);
            }
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
    // ✅ Usar el campo correcto del ID
    const idSolicitud = (solicitud as any).id_solicitud || (solicitud as any).id_preinscripcion;
    console.log(`👁️ Abriendo modal de detalles para preinscripción ${idSolicitud}`);
    
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
        // ✅ Usar el campo correcto del ID
        const idSolicitud = (solicitud as any).id_solicitud || (solicitud as any).id_preinscripcion;
        this.actualizarObservaciones(idSolicitud, result.observaciones);
      }
    });
  }

  actualizarObservaciones(idSolicitud: number, observaciones: string): void {
    console.log('🔍 DEBUG - ID de solicitud para observaciones:', idSolicitud);
    console.log('🔍 DEBUG - Observaciones:', observaciones);
    
    if (!idSolicitud) {
      console.error('❌ ERROR: ID de solicitud es undefined para observaciones');
      this.snackBar.open('Error: No se pudo identificar la preinscripción para guardar observaciones', 'Cerrar', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    console.log(`🔄 Actualizando observaciones para preinscripción ${idSolicitud}`);
    
    this.cursosService.actualizarObservacionesPreinscripcion(idSolicitud, observaciones).subscribe({
      next: (response) => {
        console.log('✅ Observaciones actualizadas:', response);
        
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
        console.error('❌ Error actualizando observaciones:', err);
        this.snackBar.open('Error al guardar las observaciones', 'Cerrar', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  aprobarSolicitud(solicitud: SolicitudCursoVerano): void {
    console.log('🔍 DEBUG - Objeto solicitud completo:', solicitud);
    console.log('🔍 DEBUG - Campos disponibles:', Object.keys(solicitud));
    
    // ✅ Usar el campo correcto del ID (id_solicitud o id_preinscripcion)
    const idSolicitud = (solicitud as any).id_solicitud || (solicitud as any).id_preinscripcion;
    console.log('🔍 DEBUG - ID encontrado:', idSolicitud);
    console.log('🔍 DEBUG - Tipo de ID:', typeof idSolicitud);
    
    if (!idSolicitud) {
      console.error('❌ ERROR: No se encontró ID de la solicitud');
      this.snackBar.open('Error: No se pudo identificar la preinscripción', 'Cerrar', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    console.log(`✅ Aprobando preinscripción ${idSolicitud}`);
    
    this.cursosService.aprobarPreinscripcion(idSolicitud).subscribe({
      next: (response) => {
        console.log('✅ Preinscripción aprobada:', response);
        
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
        console.error('❌ Error aprobando preinscripción:', err);
        console.error('🔍 DEBUG - Status:', err.status);
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
    this.solicitudParaRechazo = solicitud;
    this.motivoRechazo = '';
    this.motivoRechazoError = '';
    
    // Mostrar modal Bootstrap
    const modal = document.getElementById('modalRechazo');
    if (modal) {
      (modal as any).style.display = 'block';
      modal.classList.add('show');
      modal.setAttribute('aria-modal', 'true');
    }
  }

  cancelarRechazo(): void {
    this.solicitudParaRechazo = null;
    this.motivoRechazo = '';
    this.motivoRechazoError = '';
    
    // Ocultar modal Bootstrap
    const modal = document.getElementById('modalRechazo');
    if (modal) {
      (modal as any).style.display = 'none';
      modal.classList.remove('show');
      modal.removeAttribute('aria-modal');
    }
  }

  confirmarRechazo(): void {
    // Validar motivo
    if (!this.motivoRechazo || !this.motivoRechazo.trim()) {
      this.motivoRechazoError = 'El motivo del rechazo es obligatorio';
      return;
    }

    if (!this.solicitudParaRechazo) {
      this.snackBar.open('Error: No se encontró la solicitud para rechazar', 'Cerrar', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    const idSolicitud = (this.solicitudParaRechazo as any).id_solicitud || (this.solicitudParaRechazo as any).id_preinscripcion;
    const motivo = this.motivoRechazo.trim();
    console.log('🔍 DEBUG - ID de solicitud para rechazo:', idSolicitud);
    console.log('🔍 DEBUG - Tipo de ID:', typeof idSolicitud);
    console.log('🔍 DEBUG - Motivo:', motivo);
    
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
        
        this.snackBar.open(`Preinscripción rechazada exitosamente. Motivo: ${motivo}`, 'Cerrar', { 
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        
        this.cancelarRechazo();
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
    // Todos los funcionarios pueden ver detalles
    return this.puedeGestionarPreinscripciones();
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
      <h2 mat-dialog-title>
        <mat-icon style="color: #f44336;">cancel</mat-icon>
        Rechazar Preinscripción
      </h2>
      
      <div mat-dialog-content class="dialog-content">
        <div class="info-section">
          <h3>📝 Información del Estudiante</h3>
          <div class="student-info">
            <p><strong>Nombre:</strong> {{ data.solicitud.objUsuario.nombre_completo }}</p>
            <p><strong>Código:</strong> {{ data.solicitud.objUsuario.codigo || 'N/A' }}</p>
            <p><strong>Curso:</strong> {{ data.solicitud.objCursoOfertadoVerano.nombre_curso || 'N/A' }}</p>
          </div>
        </div>

        <div class="form-section">
          <h3>⚠️ Motivo del Rechazo</h3>
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
      max-width: 500px;
    }

    .dialog-content {
      padding: 20px;
    }

    .info-section {
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
      border-left: 4px solid #17a2b8;
    }

    .info-section h3 {
      margin: 0 0 12px 0;
      color: #00138C;
      font-size: 16px;
      font-weight: 600;
    }

    .student-info p {
      margin: 4px 0;
      color: #333;
    }

    .form-section {
      background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
      border-radius: 8px;
      padding: 16px;
      border-left: 4px solid #f44336;
    }

    .form-section h3 {
      margin: 0 0 8px 0;
      color: #f44336;
      font-size: 16px;
      font-weight: 600;
    }

    .required-note {
      color: #f44336;
      font-size: 14px;
      margin: 0 0 16px 0;
      font-weight: 500;
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

    .btn-cancel {
      color: #666;
    }

    .btn-reject {
      background-color: #f44336;
      color: white;
    }

    .btn-reject:disabled {
      background-color: #ccc;
      color: #666;
    }

    ::ng-deep .mat-mdc-form-field {
      .mat-mdc-text-field-wrapper {
        background-color: white;
      }
    }
  `]
})
export class RechazoPreinscripcionDialogComponent {
  rechazoForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<RechazoPreinscripcionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { solicitud: SolicitudCursoVerano },
    private fb: FormBuilder
  ) {
    this.rechazoForm = this.fb.group({
      motivo: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  confirmarRechazo(): void {
    if (this.rechazoForm.valid) {
      this.dialogRef.close({
        motivo: this.rechazoForm.value.motivo.trim()
      });
    }
  }
}

