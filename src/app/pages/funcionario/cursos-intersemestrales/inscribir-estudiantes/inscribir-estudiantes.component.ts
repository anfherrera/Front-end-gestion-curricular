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
          console.log('🔍 Nombre completo:', estudiantes[0].nombre_completo);
          console.log('🔍 Código:', estudiantes[0].codigo);
          console.log('🔍 Tipo solicitud:', estudiantes[0].tipo_solicitud);
          console.log('🔍 Tiene inscripción formal:', estudiantes[0].tiene_inscripcion_formal);
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

  cargarEstadisticas(idCurso: number): void {
    console.log(`📊 Cargando estadísticas para curso ID: ${idCurso}`);
    
    this.cursosService.obtenerEstadisticasCurso(idCurso).subscribe({
      next: (stats) => {
        console.log('📊 Estadísticas recibidas:', stats);
        this.estadisticas = stats;
      },
      error: (error) => {
        console.error('❌ Error cargando estadísticas:', error);
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
    
    // Confirmar con el usuario
    const confirmacion = confirm(
      `¿Aceptar la inscripción de ${estudiante.nombre_completo} (${estudiante.codigo})?\n\nEl estudiante ya completó todos los requisitos.`
    );
    
    if (!confirmacion) return;
    
    // Usar el método del servicio con el endpoint correcto
    this.aceptarInscripcion(estudiante);
  }

  // Método simple para aceptar inscripción usando el servicio
  aceptarInscripcion(estudiante: EstudianteElegible): void {
    const observaciones = "Inscripción aceptada por funcionario";
    
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

  private intentarAceptarInscripcion(estudiante: EstudianteElegible): void {
    console.log(`🔄 Intentando aceptar inscripción para estudiante: ${estudiante.nombre_completo}`);
    console.log('🔍 Datos disponibles:', {
      id_solicitud: estudiante.id_solicitud,
      id_preinscripcion: estudiante.id_preinscripcion,
      nombre: estudiante.nombre_completo,
      codigo: estudiante.codigo
    });

    // Método 1: Intentar con id_preinscripcion si existe
    if (estudiante.id_preinscripcion) {
      console.log('🔄 Método 1: Usando id_preinscripcion');
      this.aceptarConIdPreinscripcion(estudiante);
      return;
    }

    // Método 2: Intentar con id_solicitud
    if (estudiante.id_solicitud) {
      console.log('🔄 Método 2: Usando id_solicitud');
      this.aceptarConIdSolicitud(estudiante);
      return;
    }

    // Si no hay ningún ID disponible
    console.error('❌ No se encontró ID de preinscripción ni de solicitud');
    this.snackBar.open('Error: No se encontró ID válido para procesar la inscripción', 'Cerrar', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private aceptarConIdPreinscripcion(estudiante: EstudianteElegible): void {
    // Verificar que id_preinscripcion existe antes de usarlo
    if (!estudiante.id_preinscripcion) {
      console.error('❌ Error: id_preinscripcion es undefined');
      this.procesarError({ status: 400, error: { message: 'ID de preinscripción no disponible' } });
      return;
    }
    
    console.log(`🔄 Aceptando con ID preinscripción: ${estudiante.id_preinscripcion}`);
    
    this.cursosService.aceptarInscripcion(estudiante.id_preinscripcion, 'Inscripción aceptada por funcionario').subscribe({
      next: (response: any) => {
        console.log('✅ Inscripción aceptada con id_preinscripcion:', response);
        this.procesarRespuestaExitosa(estudiante, response);
      },
      error: (err: any) => {
        console.error('❌ Error con id_preinscripcion, intentando con id_solicitud:', err);
        // Si falla con id_preinscripcion, intentar con id_solicitud
        if (estudiante.id_solicitud) {
          this.aceptarConIdSolicitud(estudiante);
        } else {
          this.procesarError(err);
        }
      }
    });
  }

  private aceptarConIdSolicitud(estudiante: EstudianteElegible): void {
    console.log(`🔄 Aceptando con ID solicitud: ${estudiante.id_solicitud}`);
    
    // Probar diferentes endpoints posibles
    const endpoints = [
      `http://localhost:5000/api/cursos-intersemestrales/cursos-verano/inscripciones/${estudiante.id_solicitud}/aceptar`,
      `http://localhost:5000/api/cursos-intersemestrales/inscripciones/${estudiante.id_solicitud}/aceptar`,
      `http://localhost:5000/api/cursos-intersemestrales/cursos-verano/inscripciones/${estudiante.id_solicitud}/completar`
    ];

    this.probarEndpoints(endpoints, estudiante, 0);
  }

  private probarEndpoints(endpoints: string[], estudiante: EstudianteElegible, index: number): void {
    if (index >= endpoints.length) {
      console.error('❌ Todos los endpoints fallaron');
      this.snackBar.open('Error: No se pudo procesar la inscripción con ningún endpoint disponible', 'Cerrar', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    const endpoint = endpoints[index];
    const body = { observaciones: 'Inscripción aceptada por funcionario' };
    
    console.log(`🔄 Probando endpoint ${index + 1}/${endpoints.length}:`, endpoint);
    
    this.http.put<any>(endpoint, body).subscribe({
      next: (response: any) => {
        console.log(`✅ Éxito con endpoint ${index + 1}:`, response);
        this.procesarRespuestaExitosa(estudiante, response);
      },
      error: (err) => {
        console.error(`❌ Error con endpoint ${index + 1}:`, err.status, err.statusText);
        // Intentar con el siguiente endpoint
        this.probarEndpoints(endpoints, estudiante, index + 1);
      }
    });
  }

  private procesarRespuestaExitosa(estudiante: EstudianteElegible, response: any): void {
    // Actualizar estado localmente
    const index = this.estudiantesFiltrados.findIndex(e => e.id_solicitud === estudiante.id_solicitud);
    if (index !== -1) {
      this.estudiantesFiltrados[index].estado_inscripcion = 'Inscripcion_Completada';
    }
    
    this.snackBar.open(
      `✅ Inscripción aceptada exitosamente\nEstudiante: ${estudiante.nombre_completo}\nCurso: ${this.cursoSeleccionado?.nombre_curso || 'Curso seleccionado'}`, 
      'Cerrar', 
      { 
        duration: 5000,
        panelClass: ['success-snackbar']
      }
    );
    
    // Recargar la lista para obtener datos actualizados
    if (this.cursoSeleccionado) {
      this.cargarEstudiantesElegibles(this.cursoSeleccionado.id_curso);
    }
  }

  private procesarError(err: any): void {
    console.error('❌ Error final al aceptar inscripción:', err);
    
    let mensajeError = 'Error al aceptar la inscripción';
    if (err.status === 404) {
      mensajeError = 'No se encontró la solicitud especificada';
    } else if (err.status === 400) {
      mensajeError = `Error en la solicitud: ${err.error?.message || 'La inscripción no puede ser aceptada en su estado actual'}`;
    } else if (err.status === 500) {
      mensajeError = `Error interno del servidor: ${err.error?.message || 'Contacte al administrador'}`;
    }
    
    this.snackBar.open(mensajeError, 'Cerrar', { 
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private procesarAceptacionConIdSolicitud(estudiante: EstudianteElegible): void {
    // Usar el endpoint correcto para aceptar inscripción
    console.log(`🔄 Aceptando inscripción con ID solicitud: ${estudiante.id_solicitud}`);
    console.log('🔍 Datos del estudiante:', {
      id_solicitud: estudiante.id_solicitud,
      id_preinscripcion: estudiante.id_preinscripcion,
      nombre: estudiante.nombre_completo,
      codigo: estudiante.codigo
    });
    
    // Intentar con el endpoint correcto del backend
    const endpoint = `http://localhost:5000/api/cursos-intersemestrales/cursos-verano/inscripciones/${estudiante.id_solicitud}/aceptar`;
    const body = {
      observaciones: 'Inscripción aceptada por funcionario'
    };
    
    console.log('🔍 Endpoint:', endpoint);
    console.log('🔍 Body:', body);
    
    this.http.put<any>(endpoint, body).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta del servidor:', response);
        
        // Actualizar estado localmente
        const index = this.estudiantesFiltrados.findIndex(e => e.id_solicitud === estudiante.id_solicitud);
        if (index !== -1) {
          this.estudiantesFiltrados[index].estado_inscripcion = 'Inscripcion_Completada';
        }
        
        this.snackBar.open(
          `✅ Inscripción aceptada exitosamente\nEstudiante: ${estudiante.nombre_completo}\nCurso: ${this.cursoSeleccionado?.nombre_curso || 'Curso seleccionado'}`, 
          'Cerrar', 
          { 
            duration: 5000,
            panelClass: ['success-snackbar']
          }
        );
        
        // Recargar la lista para obtener datos actualizados
        if (this.cursoSeleccionado) {
          this.cargarEstudiantesElegibles(this.cursoSeleccionado.id_curso);
        }
      },
      error: (err) => {
        console.error('❌ Error aceptando inscripción:', err);
        console.error('❌ Detalles del error:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          url: err.url,
          error: err.error
        });
        
        let mensajeError = 'Error al aceptar la inscripción';
        if (err.status === 404) {
          mensajeError = 'No se encontró la solicitud especificada';
        } else if (err.status === 400) {
          mensajeError = `Error en la solicitud: ${err.error?.message || 'La inscripción no puede ser aceptada en su estado actual'}`;
        } else if (err.status === 500) {
          mensajeError = `Error interno del servidor: ${err.error?.message || 'Contacte al administrador'}`;
        }
        
        this.snackBar.open(mensajeError, 'Cerrar', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
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
        alert('Inscripción rechazada exitosamente');
        // Recargar la lista de estudiantes y estadísticas
        if (this.cursoSeleccionado) {
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

  private procesarRechazo(estudiante: EstudianteElegible, motivoRechazo: string): void {
    // Verificar que id_preinscripcion existe
    if (!estudiante.id_preinscripcion) {
      console.error('❌ Error: No se encontró ID de preinscripción para el estudiante');
      this.snackBar.open('Error: No se encontró ID de preinscripción para el estudiante', 'Cerrar', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    console.log(`🔄 Procesando rechazo con motivo: ${motivoRechazo}`);
    
    // Llamar al servicio para rechazar la inscripción
    this.cursosService.rechazarInscripcion(estudiante.id_solicitud, motivoRechazo).subscribe({
      next: (response: RechazarInscripcionResponse) => {
        console.log('✅ Inscripción rechazada:', response);
        
        if (response.success) {
          // Actualizar estado localmente
          const index = this.estudiantesFiltrados.findIndex(e => e.id_preinscripcion === estudiante.id_preinscripcion);
          if (index !== -1) {
            this.estudiantesFiltrados[index].estado_inscripcion = 'Rechazado';
          }
          
          this.snackBar.open(
            `❌ ${response.message}\nEstudiante: ${estudiante.objUsuario?.nombre_completo || estudiante.nombre_completo}\nMotivo: ${motivoRechazo}`, 
            'Cerrar', 
            { 
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
          
          // Recargar la lista para obtener datos actualizados
          if (this.cursoSeleccionado) {
            this.cargarEstudiantesElegibles(this.cursoSeleccionado.id_curso);
          }
        } else {
          this.snackBar.open('Error: La respuesta del servidor indica fallo', 'Cerrar', { 
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (err) => {
        console.error('❌ Error rechazando inscripción:', err);
        console.error('❌ Detalles del error:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          url: err.url
        });
        
        let mensajeError = 'Error al rechazar la inscripción';
        if (err.status === 404) {
          mensajeError = 'No se encontró la preinscripción especificada';
        } else if (err.status === 400) {
          mensajeError = 'La inscripción no puede ser rechazada en su estado actual';
        } else if (err.status === 500) {
          mensajeError = 'Error interno del servidor. Contacte al administrador';
        }
        
        this.snackBar.open(mensajeError, 'Cerrar', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
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
    <!-- Dialog simplificado - Solo solicitud y comprobante -->
    <h2 mat-dialog-title>📋 Solicitud del Estudiante</h2>
    
    <div mat-dialog-content class="dialog-content">
      <!-- Información del estudiante -->
      <div class="form-section">
        <h3>👤 Información del Estudiante</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>Nombre Completo:</strong> {{ data.estudiante.nombre_completo }}
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
                
                <button mat-raised-button 
                        color="accent" 
                        (click)="verComprobante()"
                        *ngIf="data.estudiante.archivoPago?.url"
                        style="margin-right: 8px;">
                  <mat-icon>visibility</mat-icon>
                  Ver Comprobante
                </button>
                
                <button mat-stroked-button 
                        (click)="copiarURL()"
                        *ngIf="data.estudiante.archivoPago?.url">
                  <mat-icon>content_copy</mat-icon>
                  Copiar URL
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
        Aceptar Inscripción
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

  descargarComprobante(): void {
    console.log('📥 Descargando comprobante para estudiante:', this.data.estudiante.nombre_completo);
    console.log('🔍 ID de solicitud:', this.data.estudiante.id_solicitud);
    
    if (!this.data.estudiante.id_solicitud) {
      console.error('❌ Error: No se encontró ID de solicitud para descargar comprobante');
      alert('Error: No se encontró ID de solicitud para descargar comprobante');
      return;
    }
    
    // Usar el servicio para descargar comprobante
    this.cursosService.descargarComprobantePago(this.data.estudiante.id_solicitud).subscribe({
      next: (blob: Blob) => {
        console.log('📄 Descargando comprobante de pago');
        
        // Crear enlace de descarga
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `comprobante_pago_${this.data.estudiante.nombre_completo}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Descarga completada exitosamente');
        alert('Comprobante descargado exitosamente');
      },
      error: (error: any) => {
        console.error('❌ Error descargando comprobante:', error);
        alert('Error al descargar el comprobante de pago');
      }
    });
  }

  verComprobante(): void {
    if (this.data.estudiante.archivoPago && this.data.estudiante.archivoPago.url) {
      console.log('👁️ Abriendo comprobante en nueva ventana:', this.data.estudiante.archivoPago.url);
      
      // Verificar si la URL es relativa y construir la URL completa
      let urlCompleta = this.data.estudiante.archivoPago.url;
      if (urlCompleta.startsWith('/uploads/')) {
        // Si es una ruta relativa, construir la URL completa del backend
        urlCompleta = `http://localhost:5000${urlCompleta}`;
      }
      
      console.log('🔗 URL completa para visualización:', urlCompleta);
      
      // Abrir el archivo en una nueva ventana/pestaña
      window.open(urlCompleta, '_blank');
    } else {
      console.warn('No hay URL disponible para ver el archivo');
      alert('No hay archivo disponible para visualizar');
    }
  }

  copiarURL(): void {
    if (this.data.estudiante.archivoPago && this.data.estudiante.archivoPago.url) {
      // Verificar si la URL es relativa y construir la URL completa
      let urlCompleta = this.data.estudiante.archivoPago.url;
      if (urlCompleta.startsWith('/uploads/')) {
        // Si es una ruta relativa, construir la URL completa del backend
        urlCompleta = `http://localhost:5000${urlCompleta}`;
      }
      
      console.log('📋 Copiando URL al portapapeles:', urlCompleta);
      
      // Copiar URL al portapapeles
      navigator.clipboard.writeText(urlCompleta).then(() => {
        console.log('✅ URL copiada exitosamente');
        alert('URL copiada al portapapeles');
      }).catch(err => {
        console.error('❌ Error copiando URL:', err);
        
        // Fallback para navegadores que no soportan clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = urlCompleta;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('URL copiada al portapapeles (método alternativo)');
      });
    } else {
      console.warn('No hay URL disponible para copiar');
      alert('No hay URL disponible para copiar');
    }
  }

  confirmarInscripcion(): void {
    // Lógica para confirmar la inscripción
    this.dialogRef.close('inscrito');
  }
}

// Componente del dialog para pedir motivo de rechazo
@Component({
  selector: 'app-motivo-rechazo-dialog',
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
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    
    <div mat-dialog-content class="dialog-content">
      <p class="mensaje">{{ data.mensaje }}</p>
      
      <form [formGroup]="motivoForm">
        <mat-form-field appearance="outline" class="motivo-field">
          <mat-label>Motivo del rechazo *</mat-label>
          <textarea matInput 
                    formControlName="motivo"
                    placeholder="Explique el motivo del rechazo..."
                    rows="4"
                    maxlength="500"></textarea>
          <mat-hint align="end">{{ motivoForm.get('motivo')?.value?.length || 0 }}/500</mat-hint>
          <mat-error *ngIf="motivoForm.get('motivo')?.hasError('required')">
            El motivo es requerido
          </mat-error>
          <mat-error *ngIf="motivoForm.get('motivo')?.hasError('minlength')">
            El motivo debe tener al menos 10 caracteres
          </mat-error>
        </mat-form-field>
      </form>
    </div>

    <div mat-dialog-actions class="dialog-actions">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-raised-button 
              color="warn" 
              [disabled]="!motivoForm.valid"
              (click)="confirmarRechazo()">
        <mat-icon>cancel</mat-icon>
        Rechazar Inscripción
      </button>
    </div>
  `,
  styles: [`
    .dialog-content {
      padding: 20px;
      min-width: 400px;
    }

    .mensaje {
      margin-bottom: 20px;
      color: #333;
      font-size: 14px;
      line-height: 1.5;
    }

    .motivo-field {
      width: 100%;
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
  `]
})
export class MotivoRechazoDialogComponent {
  motivoForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<MotivoRechazoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      estudiante: EstudianteElegible;
      titulo: string;
      mensaje: string;
    },
    private fb: FormBuilder
  ) {
    this.motivoForm = this.fb.group({
      motivo: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  confirmarRechazo(): void {
    if (this.motivoForm.valid) {
      const motivo = this.motivoForm.get('motivo')?.value;
      this.dialogRef.close({ motivo: motivo });
    }
  }
}
