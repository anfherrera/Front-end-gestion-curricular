import { Component, OnInit, OnDestroy, inject } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { CursosIntersemestralesService } from '@core/services/cursos-intersemestrales.service';
import { CursoOfertadoVerano, EstudianteElegible } from '@core/models/cursos-intersemestrales.model';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import { UtfFixPipe } from '@shared/pipes/utf-fix.pipe';
import { LoggerService } from '@core/services/logger.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { AuthService } from '@core/services/auth.service';
import { UserRole } from '@core/enums/roles.enum';
import { NombreDocentePipe } from '@shared/pipes/nombre-docente.pipe';
import { TextoDialogComponent, TextoDialogData, datosRechazo } from '@shared/components/texto-dialog/texto-dialog.component';
import { SnackbarService } from '@core/services/snackbar.service';
import { DetallesInscripcionDialogComponent } from './detalles-inscripcion-dialog.component';
import { ConfirmacionInscripcionDialogComponent } from './confirmacion-inscripcion-dialog.component';
@Component({
  selector: 'app-inscribir-estudiantes',
  imports: [
    ReactiveFormsModule,
    MatSelectModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    CardContainerComponent,
    UtfFixPipe,
    NombreDocentePipe
],
  templateUrl: './inscribir-estudiantes.component.html',
  styleUrls: ['../filtro-curso-comun.css', './inscribir-estudiantes.component.css']
})
export class InscribirEstudiantesComponent implements OnInit, OnDestroy {
  private cursosService = inject(CursosIntersemestralesService);
  private fb = inject(FormBuilder);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private logger = inject(LoggerService);
  private errorHandler = inject(ErrorHandlerService);
  private authService = inject(AuthService);

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

  constructor() {
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
    this.logger.debug('Cargando cursos para inscripción');
    
    // Usar getCursosPorEstado para obtener cursos en estado "Inscripción"
    // Sin período para mostrar TODOS los cursos de inscripción
    this.cursosService.getCursosPorEstado('Inscripción')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (cursos) => {
        this.cursos = cursos;
        this.logger.debug('Cursos cargados:', cursos);
        
        if (!this.cursos || this.cursos.length === 0) {
          // Mostrar mensaje informativo al usuario
          this.snackbar.advertencia('No hay cursos disponibles para inscripción en este momento.');
        }
        this.cargando = false;
      },
      error: (err) => {
        this.logger.error('Error al cargar cursos del backend', err);
        this.cursos = [];
        
        const mensajeError = this.errorHandler.extraerMensajeError(err);
        // Mostrar mensaje de error al usuario
        this.snackbar.error(mensajeError || 'Error al cargar los cursos. Verifique su conexión o contacte al administrador.');
        this.cargando = false;
      }
    });
  }

  cargarEstudiantesElegibles(cursoId: number): void {
    this.cargando = true;
    this.logger.debug('Cargando estudiantes elegibles para curso:', cursoId);
    this.cursoSeleccionado = this.cursos.find(c => c.id_curso === cursoId) || null;
    
    this.cursosService.getEstudiantesElegibles(cursoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (estudiantes) => {
        this.logger.debug('Estudiantes elegibles recibidos del backend:', estudiantes);
        
        // Normalizar estado: usar estado_inscripcion o, si no viene, estado_actual
        const normalizados = estudiantes.map(e => ({
          ...e,
          estado_inscripcion: e.estado_inscripcion || e.estado_actual || null
        }));
        
        this.estudiantesElegibles = normalizados;
        // Mostrar como elegibles únicamente los que no están rechazados
        this.estudiantesFiltrados = this.estudiantesElegibles.filter(e => e.estado_inscripcion !== 'Pago_Rechazado');
        this.logger.debug('Estudiantes elegibles cargados para curso:', this.estudiantesFiltrados.length);
        
        if (this.estudiantesFiltrados.length === 0) {
          this.estudiantesFiltrados = [];
          
          // Mostrar mensaje informativo al usuario
          this.snackbar.info('No hay estudiantes elegibles para este curso. Todos los estudiantes deben tener preinscripción aprobada y pago validado.');
        }
        
        this.cargando = false;
      },
      error: (err) => {
        this.logger.error('Error al cargar estudiantes elegibles', err);
        this.estudiantesFiltrados = [];
        this.cargando = false;
        
        const mensajeError = this.errorHandler.extraerMensajeError(err);
        // Mostrar mensaje de error al usuario
        this.snackbar.error(mensajeError || 'Error al cargar los estudiantes elegibles');
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

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
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
      this.snackbar.error('Error: No se encontró ID de solicitud para el estudiante');
      return;
    }
    
    
    // Abrir modal de confirmación personalizado
    this.abrirModalConfirmacionInscripcion(estudiante);
  }

  private abrirModalConfirmacionInscripcion(estudiante: EstudianteElegible): void {
    const dialogRef = this.dialog.open(ConfirmacionInscripcionDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: { estudiante: estudiante, curso: this.cursoSeleccionado },
      disableClose: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
      if (result === 'confirmar') {
        // Usar el método del servicio con el endpoint correcto
        this.aceptarInscripcion(estudiante);
      }
    });
  }

  // Método simple para aceptar inscripción usando el servicio
  aceptarInscripcion(estudiante: EstudianteElegible): void {
    const rol = this.authService.getRole() === UserRole.COORDINADOR ? 'coordinador' : 'funcionario';
    const observaciones = `Inscripción aceptada por ${rol}`;
    
    this.cursosService.aceptarInscripcion(estudiante.id_solicitud, observaciones)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (response) => {
        this.logger.debug('Inscripción aceptada exitosamente', response);
        this.snackbar.exito('Inscripción aceptada exitosamente');
        // Recargar la lista de estudiantes
        if (this.cursoSeleccionado) {
          this.cargarEstudiantesElegibles(this.cursoSeleccionado.id_curso);
        }
      },
      error: (error) => {
        this.manejarErrorInscripcion(error);
      }
    });
  }

  rechazarInscripcion(estudiante: EstudianteElegible): void {
    // Abrir diálogo para pedir motivo de rechazo
    const dialogRef = this.dialog.open<TextoDialogComponent, TextoDialogData, string>(TextoDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: datosRechazo('Rechazar Inscripción', 'Ingrese el motivo del rechazo:')
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(motivo => {
        if (!motivo) return; // cancelado: el diálogo no deja confirmar sin motivo
        
        // Usar el servicio para rechazar inscripción
        this.cursosService.rechazarInscripcion(estudiante.id_solicitud, motivo)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
          next: (response) => {
            const motivoRespuesta = (response && response.motivo ? response.motivo : motivo);
            this.logger.debug('Inscripción rechazada exitosamente', response);
            this.snackbar.exito(`Inscripción rechazada exitosamente. Motivo: ${motivoRespuesta}`);
            
            if (this.cursoSeleccionado) {
              this.cargarEstudiantesElegibles(this.cursoSeleccionado.id_curso);
            }
          },
          error: (error) => {
            this.manejarErrorInscripcion(error);
          }
        });
      });
  }

  // Método para manejar errores específicos del backend
  private manejarErrorInscripcion(error: HttpErrorResponse): void {
    this.logger.error('Error al procesar inscripción', error);
    
    let mensaje = 'Error al procesar la inscripción';
    
    if (error.error?.codigo) {
      switch (error.error.codigo) {
        case 'INSCRIPCION_DUPLICADA':
          mensaje = 'Ya existe una inscripción activa para este estudiante';
          break;
        case 'PREINSCRIPCION_NO_APROBADA':
          mensaje = 'No hay una preinscripción aprobada para este estudiante';
          break;
        case 'ESTADO_INVALIDO':
          mensaje = 'El estado actual de la inscripción no permite esta acción';
          break;
        case 'INSCRIPCION_NO_ENCONTRADA':
          mensaje = 'No se encontró la inscripción especificada';
          break;
        case 'DOCUMENTO_NO_VALIDADO':
          mensaje = 'El documento de pago no ha sido validado';
          break;
        default:
          mensaje = this.errorHandler.extraerMensajeError(error) || `Error: ${error.error.codigo}`;
      }
    } else {
      mensaje = this.errorHandler.extraerMensajeError(error) || mensaje;
    }
    
    this.snackbar.error(mensaje);
  }

}
