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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, catchError, of, switchMap, takeUntil, tap } from 'rxjs';
import { CursosIntersemestralesService } from '@core/services/cursos-intersemestrales.service';
import { CursoOfertadoVerano, SolicitudCursoVerano } from '@core/models/cursos-intersemestrales.model';
import { AuthService } from '@core/services/auth.service';
import { UserRole } from '@core/enums/roles.enum';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import { EstadoColorPipe } from '@shared/pipes/estado.pipes';
import { NombreDocentePipe } from '@shared/pipes/nombre-docente.pipe';
import { SnackbarService } from '@core/services/snackbar.service';
import { DetallesPreinscripcionDialogComponent } from './detalles-preinscripcion-dialog.component';
import { RechazoPreinscripcionDialogComponent } from './rechazo-preinscripcion-dialog.component';
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
    MatDialogModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    CardContainerComponent,
    EstadoColorPipe,
    NombreDocentePipe
  ],
  templateUrl: './preinscribir-estudiantes.component.html',
  styleUrls: ['../filtro-curso-comun.css', './preinscribir-estudiantes.component.css']
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
    private snackbar: SnackbarService,
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
    
    // Usar getCursosPorEstado para obtener cursos en estado "Preinscripción"
    // Sin período para mostrar TODOS los cursos de preinscripción
    this.cursosService.getCursosPorEstado('Preinscripción').pipe(takeUntil(this.destroy$)).subscribe({
      next: (cursos) => {
        this.cursos = cursos;
        this.cargando = false;
      },
      error: () => {
        this.cursos = [];
        this.cargando = false;
        this.snackbar.error('Error al cargar los cursos disponibles');
      }
    });
  }

  cargarSolicitudesPorCurso(cursoId: number): void {
    this.cargando = true;
    
    // Curso actualizado (si falla, el de la lista) y después sus preinscripciones
    this.cursosService.getCursoPorId(cursoId).pipe(
      catchError(() => of(this.cursos.find(c => c.id_curso === cursoId) || null)),
      tap(curso => this.cursoSeleccionado = curso),
      switchMap(() => this.cursosService.getPreinscripcionesPorCurso(cursoId)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (solicitudes) => {
        const curso = this.cursoSeleccionado;
        if (curso) {
          solicitudes.forEach(solicitud => {
            if (!solicitud.objCursoOfertadoVerano) {
              solicitud.objCursoOfertadoVerano = curso;
            }
          });
        }
        this.solicitudes = solicitudes;
        this.solicitudesFiltradas = solicitudes;
        this.cargando = false;
      },
      error: () => {
        this.solicitudesFiltradas = [];
        this.cargando = false;
        this.snackbar.error('Error al cargar las preinscripciones del curso');
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

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result && result.observaciones !== undefined) {
        const idSolicitud = solicitud.id_solicitud || solicitud.id_preinscripcion;
        this.actualizarObservaciones(idSolicitud, result.observaciones);
      }
    });
  }

  actualizarObservaciones(idSolicitud: number | undefined, observaciones: string): void {
    
    if (!idSolicitud) {
      this.snackbar.error('Error: No se pudo identificar la preinscripción para guardar observaciones');
      return;
    }
    
    
    this.cursosService.actualizarObservacionesPreinscripcion(idSolicitud, observaciones).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        
        // Actualizar localmente usando el ID correcto
        const index = this.solicitudesFiltradas.findIndex(s => {
          const sId = s.id_solicitud || s.id_preinscripcion;
          return sId === idSolicitud;
        });
        if (index !== -1) {
          this.solicitudesFiltradas[index].observaciones = observaciones;
        }
        
        this.snackbar.exito('Observaciones guardadas exitosamente');
      },
      error: () => {
        this.snackbar.error('Error al guardar las observaciones');
      }
    });
  }

  aprobarSolicitud(solicitud: SolicitudCursoVerano): void {
    const idSolicitud = solicitud.id_solicitud || solicitud.id_preinscripcion;
    
    if (!idSolicitud) {
      this.snackbar.error('Error: No se pudo identificar la preinscripción');
      return;
    }
    
    
    this.cursosService.aprobarPreinscripcion(idSolicitud).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        
        // Actualizar estado localmente usando el ID correcto
        const index = this.solicitudesFiltradas.findIndex(s => {
          const sId = s.id_solicitud || s.id_preinscripcion;
          return sId === idSolicitud;
        });
        if (index !== -1) {
          this.solicitudesFiltradas[index].estado = 'Aprobado';
        }
        
        this.snackbar.exito(`Preinscripción de ${solicitud.objUsuario.nombre_completo} aprobada exitosamente. El estudiante puede proceder a inscripción.`);
      },
      error: (err) => {
        
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
        
        this.snackbar.error(`${errorMessage}`);
      }
    });
  }

  rechazarSolicitud(solicitud: SolicitudCursoVerano): void {
    this.abrirModalRechazo(solicitud);
  }

  abrirModalRechazo(solicitud: SolicitudCursoVerano): void {
    
    // Abrir diálogo de Angular Material
    const dialogRef = this.dialog.open(RechazoPreinscripcionDialogComponent, {
      width: '600px',
      data: { 
        solicitud: solicitud,
        curso: this.cursoSeleccionado || solicitud.objCursoOfertadoVerano
      },
      disableClose: true
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result && result.motivo) {
        this.procesarRechazo(solicitud, result.motivo);
      }
    });
  }

  procesarRechazo(solicitud: SolicitudCursoVerano, motivo: string): void {
    const idSolicitud = solicitud.id_solicitud || solicitud.id_preinscripcion;
    
    if (!idSolicitud) {
      this.snackbar.error('Error: No se pudo identificar la preinscripción para rechazar');
      return;
    }
    
    
    this.cursosService.rechazarPreinscripcion(idSolicitud, motivo).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        
        // Actualizar estado localmente usando el ID correcto
        const index = this.solicitudesFiltradas.findIndex(s => {
          const sId = s.id_solicitud || s.id_preinscripcion;
          return sId === idSolicitud;
        });
        if (index !== -1) {
          this.solicitudesFiltradas[index].estado = 'Rechazado';
        }
        
        const motivoRespuesta = (response && response.motivo ? response.motivo : motivo);
        this.snackbar.exito(`Preinscripción rechazada exitosamente. Motivo: ${motivoRespuesta}`);

        if (this.cursoSeleccionado?.id_curso) {
          this.cargarSolicitudesPorCurso(this.cursoSeleccionado.id_curso);
        }
      },
      error: (err) => {
        
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
        
        this.snackbar.error(`${errorMessage}`);
      }
    });
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
    
    // Se pueden aprobar preinscripciones en estado ENVIADA, Enviada, Enviado o Pendiente
    const estado = solicitud.estado?.toString().toUpperCase() || '';
    return estado === 'ENVIADA' || estado === 'ENVIADO' || estado === 'PENDIENTE';
  }

  /**
   * Verificar si se puede rechazar una preinscripción específica
   */
  puedeRechazar(solicitud: SolicitudCursoVerano): boolean {
    if (!this.puedeGestionarPreinscripciones()) {
      return false;
    }
    
    // Se pueden rechazar preinscripciones en estado ENVIADA, Enviada, Enviado o Pendiente
    const estado = solicitud.estado?.toString().toUpperCase() || '';
    return estado === 'ENVIADA' || estado === 'ENVIADO' || estado === 'PENDIENTE';
  }

  /**
   * Verificar si se puede ver los detalles de una preinscripción
   */
  puedeVerDetalles(_solicitud: SolicitudCursoVerano): boolean {
    // Todos los funcionarios pueden ver detalles
    return this.puedeGestionarPreinscripciones();
  }

}
