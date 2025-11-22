import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
import { CursosIntersemestralesService, CursoOfertadoVerano, Inscripcion, EstudianteElegible, AceptarInscripcionResponse, RechazarInscripcionResponse, DebugInscripcionResponse } from '../../../../core/services/cursos-intersemestrales.service';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { UtfFixPipe } from '../../../../shared/pipes/utf-fix.pipe';

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
    CardContainerComponent,
    UtfFixPipe
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
  estadisticas: any = null;
  
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
    private dialog: MatDialog,
    private http: HttpClient
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
          this.cargarEstadisticas(cursoId);
        } else {
          this.estudiantesFiltrados = [];
          this.cursoSeleccionado = null;
          this.estadisticas = null;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarCursos(): void {
    this.cargando = true;
    // Cargando cursos para inscripción
    
    // Para funcionarios/coordinadores, usar el endpoint que obtiene todos los cursos
    this.cursosService.getTodosLosCursosParaFuncionarios().subscribe({
      next: (response) => {
        // Respuesta recibida del backend
        
        // El backend devuelve { value: [...], Count: n }
        let cursos = response;
        if (response && (response as any).value) {
          cursos = (response as any).value;
          // Cursos extraídos de response.value
        }
        
        // Cantidad de cursos
        
        if (cursos && cursos.length > 0) {
          // Filtrar solo cursos en estado "Inscripcion" (sin tilde, como viene del backend)
          this.cursos = cursos.filter((c: any) => c.estado === 'Inscripcion');
          // Cursos en estado "Inscripcion"
          
          // Si no hay cursos filtrados, mostrar todos los cursos disponibles
          if (this.cursos.length === 0) {
            // No hay cursos en estado "Inscripcion", mostrando todos los cursos
            this.cursos = cursos;
          }
        } else {
          // No hay cursos del backend
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
        console.error('Error cargando cursos:', err);
        console.error('Detalles del error:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          url: err.url
        });
        // Error al cargar cursos del backend
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
    // Cargando estudiantes elegibles para curso
    
    // Buscar el curso seleccionado
    this.cursoSeleccionado = this.cursos.find(c => c.id_curso === cursoId) || null;
    
    // Usar el nuevo endpoint que filtra automáticamente estudiantes con pago validado
    this.cursosService.getEstudiantesElegibles(cursoId).subscribe({
      next: (estudiantes) => {
        // Estudiantes elegibles recibidos del backend
        
        // Normalizar estado: usar estado_inscripcion o, si no viene, estado_actual
        const normalizados = estudiantes.map((e: any) => ({
          ...e,
          estado_inscripcion: e.estado_inscripcion || e.estado_actual || null
        }));
        
        this.estudiantesElegibles = normalizados;
        // Mostrar como elegibles únicamente los que no están rechazados
        this.estudiantesFiltrados = this.estudiantesElegibles.filter(e => e.estado_inscripcion !== 'Pago_Rechazado');
        // Estudiantes elegibles cargados para curso
        
        // Si no hay estudiantes elegibles, mostrar mensaje informativo
        if (this.estudiantesFiltrados.length === 0) {
          // No hay estudiantes elegibles - todos deben tener preinscripción aprobada y pago validado
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
        console.error('Error cargando estudiantes elegibles:', err);
        console.error('Detalles del error:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          url: err.url
        });
        // Mostrando lista vacía debido al error
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

  cargarEstadisticas(idCurso: number): void {
    // Cargando estadísticas para curso
    
    this.cursosService.obtenerEstadisticasCurso(idCurso).subscribe({
      next: (stats) => {
        // Estadísticas recibidas
        this.estadisticas = stats;
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
        this.estadisticas = null;
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
    // Verificar que id_solicitud existe (campo principal)
    if (!estudiante.id_solicitud) {
      console.error('❌ Error: No se encontró ID de solicitud para el estudiante');
      this.snackBar.open('Error: No se encontró ID de solicitud para el estudiante', 'Cerrar', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    console.log(`✅ Aceptando inscripción ${estudiante.id_solicitud} para estudiante ${estudiante.nombre_completo}`);
    
    // Abrir modal de confirmación personalizado
    this.abrirModalConfirmacionInscripcion(estudiante);
  }

  // 🆕 Método para abrir modal de confirmación personalizado
  private abrirModalConfirmacionInscripcion(estudiante: EstudianteElegible): void {
    const dialogRef = this.dialog.open(ConfirmacionInscripcionDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { estudiante: estudiante, curso: this.cursoSeleccionado },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirmar') {
        // Usar el método del servicio con el endpoint correcto
        this.aceptarInscripcion(estudiante);
      }
    });
  }

  // Método simple para aceptar inscripción usando el servicio
  aceptarInscripcion(estudiante: EstudianteElegible): void {
    const observaciones = "Inscripción aceptada por funcionario/coordinador";
    
    this.cursosService.aceptarInscripcion(estudiante.id_solicitud, observaciones).subscribe({
      next: (response) => {
        console.log('✅ Inscripción aceptada:', response);
        alert('Inscripción aceptada exitosamente');
        // Recargar la lista de estudiantes y estadísticas
        if (this.cursoSeleccionado) {
          this.cargarEstudiantesElegibles(this.cursoSeleccionado.id_curso);
          this.cargarEstadisticas(this.cursoSeleccionado.id_curso);
        }
      },
      error: (error) => {
        console.error('❌ Error aceptando inscripción:', error);
        this.manejarErrorInscripcion(error);
      }
    });
  }

  rechazarInscripcion(estudiante: EstudianteElegible): void {
    console.log(`❌ Rechazando inscripción ${estudiante.id_solicitud} para estudiante ${estudiante.nombre_completo}`);
    
    // Pedir motivo de rechazo
    const motivo = prompt('Ingrese el motivo del rechazo:');
    if (!motivo || motivo.trim() === '') {
      alert('Debe ingresar un motivo para rechazar la inscripción');
      return;
    }
    
    // Usar el servicio para rechazar inscripción
    this.cursosService.rechazarInscripcion(estudiante.id_solicitud, motivo).subscribe({
      next: (response) => {
        console.log('❌ Inscripción rechazada:', response);
        const motivoRespuesta = (response && response.motivo ? response.motivo : motivo);
        alert(`Inscripción rechazada exitosamente.\nMotivo: ${motivoRespuesta}`);
        
        // 🔄 REFRESCAR LA LISTA DESPUÉS DEL RECHAZO EXITOSO
        if (this.cursoSeleccionado) {
          console.log('🔄 Refrescando lista de estudiantes después del rechazo...');
          this.cargarEstudiantesElegibles(this.cursoSeleccionado.id_curso);
          this.cargarEstadisticas(this.cursoSeleccionado.id_curso);
        }
      },
      error: (error) => {
        console.error('❌ Error rechazando inscripción:', error);
        this.manejarErrorInscripcion(error);
      }
    });
  }

  // Método para manejar errores específicos del backend
  private manejarErrorInscripcion(error: any): void {
    console.error('🔍 Detalles del error:', error);
    
    let mensaje = 'Error al procesar la inscripción';
    
    if (error.error?.codigo) {
      switch (error.error.codigo) {
        case 'INSCRIPCION_DUPLICADA':
          mensaje = '⚠️ Ya existe una inscripción activa para este estudiante';
          break;
        case 'PREINSCRIPCION_NO_APROBADA':
          mensaje = '❌ No hay una preinscripción aprobada para este estudiante';
          break;
        case 'ESTADO_INVALIDO':
          mensaje = '❌ El estado actual de la inscripción no permite esta acción';
          break;
        case 'INSCRIPCION_NO_ENCONTRADA':
          mensaje = '❌ No se encontró la inscripción especificada';
          break;
        case 'DOCUMENTO_NO_VALIDADO':
          mensaje = '❌ El documento de pago no ha sido validado';
          break;
        default:
          mensaje = `❌ Error: ${error.error.codigo}`;
      }
    } else if (error.error?.error) {
      mensaje = `❌ Error: ${error.error.error}`;
    } else if (error.status === 404) {
      mensaje = '❌ No se encontró el recurso solicitado';
    } else if (error.status === 400) {
      mensaje = '❌ Error en la solicitud enviada';
    } else if (error.status === 500) {
      mensaje = '❌ Error interno del servidor. Contacte al administrador';
    }
    
    alert(mensaje);
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
    MatIconModule,
    UtfFixPipe
  ],
  template: `
    <!-- Dialog simplificado - Solo solicitud y comprobante -->
    <h2 mat-dialog-title>📋 Solicitud del Estudiante</h2>
    
    <div mat-dialog-content class="dialog-content">
      <!-- Información del estudiante -->
      <div class="form-section">
        <h3>👤 Información del Estudiante</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>Nombre Completo:</strong> {{ data.estudiante.nombre_completo | utfFix }}
          </div>
          <div class="info-item">
            <strong>Código:</strong> {{ data.estudiante.codigo }}
          </div>
          <div class="info-item">
            <strong>Tipo de Solicitud:</strong> {{ data.estudiante.tipo_solicitud }}
          </div>
          <div class="info-item">
            <strong>Condición:</strong> {{ data.estudiante.condicion_solicitud }}
          </div>
          <div class="info-item">
            <strong>Inscripción Formal:</strong> {{ data.estudiante.tiene_inscripcion_formal ? 'Sí' : 'No' }}
          </div>
        </div>
      </div>

      <!-- Información de la solicitud -->
      <div class="form-section">
        <h3>📝 Detalles de la Solicitud</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>ID Preinscripción:</strong> {{ data.estudiante.id_preinscripcion }}
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
          <div class="info-item">
            <strong>Motivo de Inclusión:</strong> {{ data.estudiante.motivo_inclusion }}
          </div>
        </div>
      </div>

      <!-- Estado de inscripción -->
      <div class="form-section">
        <h3>📋 Estado de Inscripción</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>Estado Actual:</strong> 
            <span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              {{ data.estudiante.tipo_solicitud }}
            </span>
          </div>
          <div class="info-item" *ngIf="data.estudiante.id_inscripcion">
            <strong>ID Inscripción:</strong> {{ data.estudiante.id_inscripcion }}
          </div>
          <div class="info-item" *ngIf="data.estudiante.fecha_inscripcion">
            <strong>Fecha Inscripción:</strong> 
            {{ data.estudiante.fecha_inscripcion | date:'dd/MM/yyyy HH:mm' }}
          </div>
        </div>
      </div>

      <!-- Comprobante de pago -->
      <div class="form-section">
        <h3>💰 Comprobante de Pago</h3>
        <div class="info-grid">
          <div class="info-item" *ngIf="data.estudiante.archivoPago; else sinComprobante">
            <div class="comprobante-info">
              <strong>Nombre del Archivo:</strong> {{ data.estudiante.archivoPago.nombre }}
              <br>
              <strong>ID Documento:</strong> {{ data.estudiante.archivoPago.id_documento || 'No disponible' }}
              <br>
              <strong>Fecha de Subida:</strong> 
              {{ data.estudiante.archivoPago.fecha ? (data.estudiante.archivoPago.fecha | date:'dd/MM/yyyy HH:mm') : 'No disponible' }}
              <br>
              <strong>URL del Archivo:</strong> 
              <span style="font-family: monospace; font-size: 11px; background: #f5f5f5; padding: 2px 4px; border-radius: 3px;">
                {{ data.estudiante.archivoPago.url || 'No disponible' }}
              </span>
              <br>
              <strong>Estado del Pago:</strong> 
              <span style="background: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                Pago Validado ✅
              </span>
              <br><br>
              
              <!-- Botones de acción para el comprobante -->
              <div class="comprobante-actions">
                <button mat-raised-button 
                        color="primary" 
                        (click)="descargarComprobante()"
                        *ngIf="data.estudiante.archivoPago?.url"
                        style="margin-right: 8px;">
                  <mat-icon>download</mat-icon>
                  Descargar Comprobante
                </button>
              </div>
            </div>
          </div>
          <ng-template #sinComprobante>
            <div class="info-item">
              <strong>Estado:</strong> 
              <span style="color: #f44336; font-weight: bold;">Sin comprobante de pago</span>
              <br>
              <small style="color: #666;">El estudiante no ha subido un comprobante de pago</small>
            </div>
          </ng-template>
        </div>
      </div>
    </div>

    <div mat-dialog-actions class="dialog-actions">
      <button mat-button (click)="dialogRef.close()">Cerrar</button>
      <button mat-raised-button 
              *ngIf="data.estudiante.estado_inscripcion !== 'Inscripcion_Completada'"
              color="primary" 
              (click)="confirmarInscripcion()">
        Confirmar Inscripción Oficial
      </button>
    </div>
  `,
  styles: [`
    .dialog-content {
      max-width: 800px;
      padding: 20px;
      max-height: 80vh;
      overflow-y: auto;
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
      gap: 4px;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-item strong {
      color: #333;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .comprobante-info {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 6px;
      border: 1px solid #e9ecef;
    }

    .comprobante-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .comprobante-actions button {
      flex: 1;
      min-width: 140px;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      border-top: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    ::ng-deep .mat-mdc-form-field {
      .mat-mdc-text-field-wrapper {
        background-color: white;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .dialog-content {
        max-width: 95vw;
        padding: 16px;
      }
      
      .comprobante-actions {
        flex-direction: column;
      }
      
      .comprobante-actions button {
        width: 100%;
        min-width: unset;
      }
    }
  `]
})
export class DetallesInscripcionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DetallesInscripcionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { estudiante: EstudianteElegible },
    private cursosService: CursosIntersemestralesService
  ) {}

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'Inscripcion_Completada':
        return '#28a745'; // Verde
      case 'Pago_Validado':
        return '#00138C'; // Azul
      case 'Sin inscripción formal':
        return '#ffc107'; // Amarillo
      case 'Rechazado':
        return '#dc3545'; // Rojo
      default:
        return '#6c757d'; // Gris
    }
  }

  async descargarComprobante(): Promise<void> {
    console.log('📥 Descargando comprobante para estudiante:', this.data.estudiante.nombre_completo);
    console.log('🔍 ID de solicitud:', this.data.estudiante.id_solicitud);
    console.log('🔍 ID de inscripción:', this.data.estudiante.id_inscripcion);
    console.log('📁 Archivo de pago:', this.data.estudiante.archivoPago);
    
    try {
      // Verificar si hay archivo de pago disponible en los datos del estudiante
      if (!this.data.estudiante.archivoPago || !this.data.estudiante.archivoPago.nombre) {
        console.error('❌ Error: No se encontró archivo de pago en los datos del estudiante');
        alert('No se encontró el archivo de comprobante');
        return;
      }
      
      const nombreArchivo = this.data.estudiante.archivoPago.nombre;
      console.log('📥 Descargando archivo:', nombreArchivo);
      
      // Usar el servicio de cursos intersemestrales para descargar
      console.log('🔗 Usando servicio de cursos intersemestrales para descargar');
      
      // Usar id_inscripcion si está disponible, sino usar id_solicitud
      const idParaDescarga = this.data.estudiante.id_inscripcion || this.data.estudiante.id_solicitud;
      
      if (!idParaDescarga) {
        console.error('❌ Error: No se encontró ID para descargar comprobante');
        alert('Error: No se encontró ID para descargar comprobante');
        return;
      }
      
      console.log('🔍 Usando ID para descarga:', idParaDescarga);
      
      // Usar el servicio de cursos intersemestrales
      this.cursosService.descargarComprobantePago(idParaDescarga).subscribe({
        next: (blob: Blob) => {
          console.log('📄 Descargando comprobante de pago usando servicio de cursos intersemestrales');
          console.log('📊 Tamaño del archivo:', blob.size, 'bytes');
          
          // Verificar que el blob no esté vacío
          if (blob && blob.size > 0) {
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = nombreArchivo;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
            
            console.log('✅ Archivo descargado exitosamente');
            alert('Comprobante descargado exitosamente');
          } else {
            console.error('❌ El archivo PDF está vacío o corrupto');
            alert('Error: El archivo PDF está vacío o corrupto');
          }
        },
        error: (error: any) => {
          console.error('❌ Error descargando comprobante:', error);
          alert('Error al descargar el comprobante de pago: ' + (error.error?.message || error.message || 'Error desconocido'));
        }
      });
      
      return; // Salir del método ya que usamos subscribe
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Error de conexión');
    }
  }

  confirmarInscripcion(): void {
    // Lógica para confirmar la inscripción
    this.dialogRef.close('inscrito');
  }
}

// Componente del modal de confirmación de inscripción
@Component({
  selector: 'app-confirmacion-inscripcion-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    UtfFixPipe
  ],
  template: `
    <div class="confirmacion-dialog">
      <div class="dialog-header">
        <mat-icon class="header-icon">school</mat-icon>
        <h2 mat-dialog-title>Confirmar Inscripción</h2>
      </div>
      
      <div mat-dialog-content class="dialog-content">
        <div class="estudiante-info">
          <div class="info-item">
            <mat-icon class="info-icon">person</mat-icon>
            <div class="info-text">
              <strong>Estudiante:</strong>
              <span>{{ data.estudiante.nombre_completo | utfFix }}</span>
            </div>
          </div>
          
          <div class="info-item">
            <mat-icon class="info-icon">badge</mat-icon>
            <div class="info-text">
              <strong>Código:</strong>
              <span>{{ data.estudiante.codigo }}</span>
            </div>
          </div>
          
          <div class="info-item">
            <mat-icon class="info-icon">book</mat-icon>
            <div class="info-text">
              <strong>Curso:</strong>
              <span>{{ data.curso.nombre | utfFix }}</span>
            </div>
          </div>
        </div>
        
        <div class="confirmacion-mensaje">
          <p>Al confirmar, el estudiante quedará oficialmente inscrito en el curso.</p>
        </div>
      </div>

      <div mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="dialogRef.close()" class="btn-cancelar">
          <mat-icon>close</mat-icon>
          Cancelar
        </button>
        <button mat-raised-button (click)="confirmar()" class="btn-confirmar">
          <mat-icon>check</mat-icon>
          Confirmar Inscripción
        </button>
      </div>
    </div>
  `,
  styles: [`
    .confirmacion-dialog {
      padding: 0;
      border-radius: 12px;
      overflow: hidden;
    }

    .dialog-header {
      background: linear-gradient(135deg, #00138C 0%, #0024CC 100%);
      color: white;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .dialog-header h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: white;
    }

    .dialog-content {
      padding: 24px;
      background: #f8f9fa;
    }

    .estudiante-info {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .info-item:last-child {
      margin-bottom: 0;
    }

    .info-icon {
      color: #00138C;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .info-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-text strong {
      color: #00138C;
      font-size: 14px;
      font-weight: 600;
    }

    .info-text span {
      color: #333;
      font-size: 16px;
    }

    .confirmacion-mensaje {
      background: #e3f2fd;
      border: 1px solid #2196f3;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }

    .confirmacion-mensaje p {
      margin: 0;
      color: #1976d2;
      font-size: 14px;
      font-weight: 500;
    }

    .dialog-actions {
      padding: 20px 24px;
      background: white;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn-cancelar {
      color: #666;
      border: 1px solid #ddd;
    }

    .btn-cancelar:hover {
      background: #f5f5f5;
    }

    .btn-confirmar {
      background: #00138C;
      color: white;
    }

    .btn-confirmar:hover {
      background: #0024CC;
    }

    .btn-cancelar mat-icon,
    .btn-confirmar mat-icon {
      margin-right: 8px;
    }

    @media (max-width: 480px) {
      .dialog-actions {
        flex-direction: column;
      }

      .btn-cancelar,
      .btn-confirmar {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ConfirmacionInscripcionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmacionInscripcionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { estudiante: EstudianteElegible, curso: any }
  ) {}

  confirmar(): void {
    this.dialogRef.close('confirmar');
  }
}