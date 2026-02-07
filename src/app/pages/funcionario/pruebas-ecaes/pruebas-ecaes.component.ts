import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { PruebasEcaesService, FechaEcaes, SolicitudEcaesResponse } from '../../../core/services/pruebas-ecaes.service';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { DocumentationViewerComponent } from '../../../shared/components/documentation-viewer/documentation-viewer.component';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { LoggerService } from '../../../core/services/logger.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { snackbarConfig } from '../../../core/design-system/design-tokens';

@Component({
  selector: 'app-pruebas-ecaes-funcionario',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatTableModule,
    MatExpansionModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    CardContainerComponent,
    RequestStatusTableComponent,
    DocumentationViewerComponent
  ],
  templateUrl: './pruebas-ecaes.component.html',
  styleUrl: './pruebas-ecaes.component.css'
})
export class PruebasEcaesFuncionarioComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Formulario para publicar fechas
  fechasForm: FormGroup;
  publicandoFechas: boolean = false;
  esModoEdicion: boolean = false;
  idFechaEcaesActual: number | null = null;
  periodoAnterior: string = '';
  cargandoFechas: boolean = false;

  // Datos para las secciones
  solicitudesPendientes: any[] = [];
  selectedSolicitud: SolicitudEcaesResponse | null = null;

  // Opciones para el desplegable de períodos académicos
  periodosAcademicos: string[] = [];
  periodoAcademicoSeleccionado: string = '';

  // Ya no necesitamos la configuración de tabla, ahora usamos grid

  constructor(
    public pruebasEcaesService: PruebasEcaesService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
    private http: HttpClient,
    private logger: LoggerService,
    private errorHandler: ErrorHandlerService
  ) {
    this.fechasForm = this.fb.group({
      periodoAcademico: ['', Validators.required],
      inscripcion_est_by_facultad: ['', Validators.required],
      registro_recaudo_ordinario: ['', Validators.required],
      registro_recaudo_extraordinario: ['', Validators.required],
      citacion: ['', Validators.required],
      aplicacion: ['', Validators.required],
      resultados_individuales: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
    
    // Suscribirse a cambios en el período académico para detectar fechas existentes
    this.fechasForm.get('periodoAcademico')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(periodo => {
      // Solo buscar si el período realmente cambió y no estamos cargando fechas
      if (periodo && periodo !== this.periodoAnterior && !this.cargandoFechas) {
        this.periodoAnterior = periodo;
        this.buscarFechasExistentes(periodo);
      } else if (!periodo) {
        this.periodoAnterior = '';
        this.limpiarFormularioFechas();
      }
    });
  }

  cargarDatos(): void {
    // Cargar períodos académicos disponibles
    this.cargarPeriodosAcademicos();
    // Cargar solicitudes pendientes
    this.cargarSolicitudesPendientes();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga los períodos académicos disponibles desde el backend
   */
  private cargarPeriodosAcademicos(): void {
    // Cargar todos los períodos académicos disponibles
    this.http.get<any>(`${environment.apiUrl}/periodos-academicos/todos`).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success && response.data && response.data.length > 0) {
          this.periodosAcademicos = response.data;
          this.logger.log('Períodos académicos cargados:', this.periodosAcademicos);
        } else {
          // Si no hay datos, cargar períodos recientes
          this.cargarPeriodosRecientes();
        }
      },
      error: (error) => {
        this.logger.error('Error al cargar períodos académicos:', error);
        // Fallback: cargar períodos recientes
        this.cargarPeriodosRecientes();
      }
    });
  }

  /**
   * Carga los períodos académicos recientes como fallback
   */
  private cargarPeriodosRecientes(): void {
    this.http.get<any>(`${environment.apiUrl}/periodos-academicos/recientes`).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.periodosAcademicos = response.data;
          this.logger.log('Períodos recientes cargados:', this.periodosAcademicos);
        } else {
          // Fallback final: períodos hardcodeados
          this.cargarPeriodosFallback();
        }
      },
      error: (error) => {
        this.logger.error('Error al cargar períodos recientes:', error);
        // Fallback final: períodos hardcodeados
        this.cargarPeriodosFallback();
      }
    });
  }

  /**
   * Fallback con períodos hardcodeados si el backend no está disponible
   */
  private cargarPeriodosFallback(): void {
    const añoActual = new Date().getFullYear();
    // Generar períodos desde 2020 hasta 2030 como fallback
    this.periodosAcademicos = [];
    for (let año = 2020; año <= 2030; año++) {
      this.periodosAcademicos.push(`${año}-1`, `${año}-2`);
    }
    this.logger.log('Períodos fallback cargados (2020-2030):', this.periodosAcademicos);
    this.snackBar.open('Usando períodos predeterminados (2020-2030). Verifique la conexión con el backend.', 'Cerrar', snackbarConfig(['warning-snackbar']));
  }

  cargarSolicitudesPendientes(): void {
    this.pruebasEcaesService.listarSolicitudesFuncionario().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (solicitudes) => {
        // Transformar datos para RequestStatusTableComponent
        this.solicitudesPendientes = solicitudes.map(sol => ({
          id: sol.id_solicitud,
          nombre: sol.nombre_solicitud,
          fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
          estado: this.getEstadoActual(sol),
          rutaArchivo: '',
          comentarios: ''
        }));
        this.logger.log('Solicitudes ECAES cargadas:', this.solicitudesPendientes);
      },
      error: (error) => {
        this.logger.error('Error al cargar solicitudes ECAES:', error);
        const mensaje = this.errorHandler.extraerMensajeError(error);
        this.snackBar.open(mensaje || 'Error al cargar solicitudes ECAES', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  getEstadoActual(solicitud: SolicitudEcaesResponse): string {
    if (solicitud.estadosSolicitud && solicitud.estadosSolicitud.length > 0) {
      const ultimoEstado = solicitud.estadosSolicitud[solicitud.estadosSolicitud.length - 1];
      return ultimoEstado.estado_actual;
    }
    return 'Pendiente';
  }

  /**
   * Formatear fecha en formato corto (DD/MM/YYYY)
   */
  formatearFechaCorta(fecha: string | Date | null | undefined): string {
    if (!fecha) return '-';

    try {
      const date = new Date(fecha);
      if (isNaN(date.getTime())) {
        return '-';
      }

      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (error) {
      this.logger.warn('Error al formatear fecha:', fecha, error);
      return '-';
    }
  }

  /**
   * Obtener el label descriptivo del tipo de documento
   */
  obtenerTipoDocumentoLabel(tipoDocumento: string | null | undefined): string {
    if (!tipoDocumento) return '-';

    const tipos: { [key: string]: string } = {
      CC: 'Cédula de Ciudadanía',
      CE: 'Cédula de Extranjería',
      TI: 'Tarjeta de Identidad',
      PA: 'Pasaporte',
      RC: 'Registro Civil'
    };

    return tipos[tipoDocumento.toUpperCase()] || tipoDocumento;
  }

  /**
   * Buscar fechas existentes cuando se selecciona un período
   */
  buscarFechasExistentes(periodoAcademico: string): void {
    this.cargandoFechas = true;
    this.pruebasEcaesService.buscarFechasPorPeriodo(periodoAcademico).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (fechas) => {
        this.logger.log('Fechas encontradas para período:', periodoAcademico, fechas);
        // Cargar fechas en el formulario
        this.cargarFechasEnFormulario(fechas);
        this.esModoEdicion = true;
        this.idFechaEcaesActual = fechas.idFechaEcaes;
        this.cargandoFechas = false;
        this.snackBar.open('Fechas existentes cargadas. Puede editarlas.', 'Cerrar', snackbarConfig(['success-snackbar']));
      },
      error: (error) => {
        this.cargandoFechas = false;
        if (error.status === 404) {
          this.logger.log('No hay fechas existentes para el período:', periodoAcademico);
          // No hay fechas, modo creación
          this.esModoEdicion = false;
          this.idFechaEcaesActual = null;
          // Limpiar solo las fechas, mantener el período
          this.limpiarSoloFechas();
        } else {
          this.logger.error('Error al buscar fechas:', error);
          const mensaje = this.errorHandler.extraerMensajeError(error);
          this.snackBar.open(mensaje || 'Error al buscar fechas existentes', 'Cerrar', snackbarConfig(['error-snackbar']));
        }
      }
    });
  }

  /**
   * Cargar fechas en el formulario
   */
  cargarFechasEnFormulario(fechas: FechaEcaes): void {
    // Convertir strings de fecha (YYYY-MM-DD) a objetos Date
    // Usar una forma que funcione mejor con Angular Material DatePicker
    const convertirFecha = (fechaStr: string | null): Date | null => {
      if (!fechaStr) return null;
      // Parsear la fecha manualmente para evitar problemas de timezone
      const partes = fechaStr.split('-');
      if (partes.length === 3) {
        const año = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1; // Los meses en JS son 0-indexed
        const dia = parseInt(partes[2], 10);
        return new Date(año, mes, dia);
      }
      return new Date(fechaStr);
    };

    // Usar setTimeout para asegurar que el patchValue no interfiera con otros eventos
    setTimeout(() => {
      this.fechasForm.patchValue({
        inscripcion_est_by_facultad: convertirFecha(fechas.inscripcion_est_by_facultad),
        registro_recaudo_ordinario: convertirFecha(fechas.registro_recaudo_ordinario),
        registro_recaudo_extraordinario: convertirFecha(fechas.registro_recaudo_extraordinario),
        citacion: convertirFecha(fechas.citacion),
        aplicacion: convertirFecha(fechas.aplicacion),
        resultados_individuales: convertirFecha(fechas.resultados_individuales)
      }, { emitEvent: false }); // No emitir eventos para evitar loops
    }, 100);
  }

  /**
   * Limpiar solo los campos de fechas, manteniendo el período
   */
  limpiarSoloFechas(): void {
    const periodoAcademico = this.fechasForm.get('periodoAcademico')?.value;
    this.fechasForm.patchValue({
      inscripcion_est_by_facultad: null,
      registro_recaudo_ordinario: null,
      registro_recaudo_extraordinario: null,
      citacion: null,
      aplicacion: null,
      resultados_individuales: null
    }, { emitEvent: false }); // No emitir eventos
    if (periodoAcademico) {
      this.fechasForm.get('periodoAcademico')?.setValue(periodoAcademico, { emitEvent: false });
    }
  }

  /**
   * Formatear fecha a YYYY-MM-DD para evitar problemas de timezone
   */
  private formatearFechaParaBackend(fecha: Date): string {
    if (!fecha) return '';
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  publicarFechas(): void {
    if (this.fechasForm.invalid) {
      this.snackBar.open('Por favor complete todos los campos requeridos', 'Cerrar', snackbarConfig(['warning-snackbar']));
      return;
    }

    this.publicandoFechas = true;
    const formValue = this.fechasForm.value;

    // Preparar datos: convertir fechas a formato YYYY-MM-DD (sin timezone)
    const fechasData: any = {
      periodoAcademico: formValue.periodoAcademico,
      inscripcion_est_by_facultad: this.formatearFechaParaBackend(formValue.inscripcion_est_by_facultad),
      registro_recaudo_ordinario: this.formatearFechaParaBackend(formValue.registro_recaudo_ordinario),
      registro_recaudo_extraordinario: this.formatearFechaParaBackend(formValue.registro_recaudo_extraordinario),
      citacion: this.formatearFechaParaBackend(formValue.citacion),
      aplicacion: this.formatearFechaParaBackend(formValue.aplicacion),
      resultados_individuales: this.formatearFechaParaBackend(formValue.resultados_individuales)
    };

    // Si estamos en modo edición, incluir el ID
    if (this.esModoEdicion && this.idFechaEcaesActual) {
      fechasData.idFechaEcaes = this.idFechaEcaesActual;
    }

    this.logger.log((this.esModoEdicion ? 'Actualizando' : 'Publicando') + ' fechas ECAES:', fechasData);

    const operacion = this.esModoEdicion 
      ? this.pruebasEcaesService.actualizarFechasEcaes(fechasData)
      : this.pruebasEcaesService.publicarFechasEcaes(fechasData);

    operacion.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.logger.log('Fechas ' + (this.esModoEdicion ? 'actualizadas' : 'publicadas') + ' exitosamente:', response);
        this.snackBar.open(
          `Fechas ${this.esModoEdicion ? 'actualizadas' : 'publicadas'} exitosamente`, 
          'Cerrar', 
          snackbarConfig(['success-snackbar'])
        );
        
        // Mantener el modo de edición si se actualizó
        if (this.esModoEdicion && response.idFechaEcaes) {
          this.idFechaEcaesActual = response.idFechaEcaes;
        } else {
          // Si se creó, cambiar a modo edición con el nuevo ID
          if (response.idFechaEcaes) {
            this.esModoEdicion = true;
            this.idFechaEcaesActual = response.idFechaEcaes;
          }
        }
        
        this.publicandoFechas = false;
        
        // Limpiar solo los campos de fechas, manteniendo el período académico
        this.limpiarSoloFechas();
      },
      error: (error) => {
        this.logger.error('Error al ' + (this.esModoEdicion ? 'actualizar' : 'publicar') + ' fechas:', error);
        const mensaje = this.errorHandler.extraerMensajeError(error);
        this.snackBar.open(
          mensaje || `Error al ${this.esModoEdicion ? 'actualizar' : 'publicar'} las fechas`, 
          'Cerrar', 
          snackbarConfig(['error-snackbar'])
        );
        this.publicandoFechas = false;
      }
    });
  }

  limpiarFormularioFechas(): void {
    this.fechasForm.reset({ emitEvent: false });
    this.publicandoFechas = false;
    this.esModoEdicion = false;
    this.idFechaEcaesActual = null;
    this.periodoAnterior = '';
  }

  esCampoInvalido(campo: string): boolean {
    const control = this.fechasForm.get(campo);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  obtenerMensajeError(campo: string): string {
    const control = this.fechasForm.get(campo);
    if (control?.errors) {
      if (control.errors['required']) return 'Este campo es requerido';
    }
    return '';
  }

  // ================================
  // Métodos para manejo de solicitudes
  // ================================

  /**
   * Muestra los comentarios de una solicitud
   * Los comentarios se muestran automáticamente en el DocumentationViewerComponent
   * @param solicitudId ID de la solicitud
   */
  verComentarios(solicitudId: number): void {
    this.logger.log('Ver comentarios para solicitud:', solicitudId);
    // Los comentarios se muestran automáticamente en el DocumentationViewerComponent
    // cuando se selecciona una solicitud
  }

  onSolicitudSeleccionada(solicitudId: number | null): void {
    // Si se deseleccionó (null), limpiar la selección
    if (solicitudId === null) {
      this.selectedSolicitud = null;
      return;
    }

    // Buscar la solicitud original por ID
    this.pruebasEcaesService.listarSolicitudesFuncionario().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (solicitudes) => {
        this.selectedSolicitud = solicitudes.find(sol => sol.id_solicitud === solicitudId) || null;
        this.logger.log('Solicitud ECAES seleccionada:', this.selectedSolicitud);
      },
      error: (error) => {
        this.logger.error('Error al cargar solicitud seleccionada:', error);
        const mensaje = this.errorHandler.extraerMensajeError(error);
        this.snackBar.open(mensaje || 'Error al cargar solicitud seleccionada', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  /**
   * Descarga el oficio de una solicitud ECAES
   * @param id ID de la solicitud
   * @param nombreArchivo Nombre del archivo a descargar
   */
  descargarOficio(id: number, nombreArchivo: string): void {
    this.logger.log('Descargar oficio:', id, nombreArchivo);
    // La descarga se maneja automáticamente por el RequestStatusTableComponent
    // cuando se emite el evento descargarOficio
  }

  /**
   * Manejar cuando se agrega un comentario desde el DocumentationViewerComponent
   */
  onComentarioAgregado(event: {documento: any, comentario: string}): void {
    if (event.documento.id_documento) {
      this.pruebasEcaesService.agregarComentario(event.documento.id_documento, event.comentario).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.snackBar.open('Comentario añadido correctamente', 'Cerrar', snackbarConfig(['success-snackbar']));
          // Recargar la solicitud para actualizar los comentarios
          this.cargarSolicitudesPendientes();
          // Recargar la solicitud seleccionada para obtener los comentarios actualizados
          if (this.selectedSolicitud) {
            this.onSolicitudSeleccionada(this.selectedSolicitud.id_solicitud);
          }
        },
        error: (error) => {
          this.logger.error('Error al añadir comentario:', error);
          const mensaje = this.errorHandler.extraerMensajeError(error);
          this.snackBar.open(mensaje || 'Error al añadir comentario', 'Cerrar', snackbarConfig(['error-snackbar']));
        }
      });
    } else {
      this.logger.error('No se pudo obtener el ID del documento para agregar comentario');
      this.snackBar.open('Error: No se pudo identificar el documento', 'Cerrar', snackbarConfig(['error-snackbar']));
    }
  }

  // ================================
  // Métodos para aprobar y rechazar solicitudes
  // ================================

  aprobarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) {
      this.snackBar.open('No hay solicitud seleccionada', 'Cerrar', snackbarConfig(['warning-snackbar']));
      return;
    }

    this.logger.log('Aprobando solicitud ECAES:', this.selectedSolicitud.id_solicitud);

    // Usar el método específico approveRequest
    this.pruebasEcaesService.approveRequest(this.selectedSolicitud.id_solicitud).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.logger.log('Solicitud ECAES aprobada exitosamente:', response);
        this.snackBar.open('Solicitud marcada como Pre-registrada exitosamente', 'Cerrar', snackbarConfig(['success-snackbar']));

        // Recargar solicitudes después de la aprobación
        this.cargarSolicitudesPendientes();

        // Limpiar selección
        this.selectedSolicitud = null;
      },
      error: (error) => {
        this.logger.error('Error al aprobar solicitud ECAES:', error);
        const mensaje = this.errorHandler.extraerMensajeError(error);
        this.snackBar.open(mensaje || 'Error al aprobar solicitud', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  rechazarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) {
      this.snackBar.open('No hay solicitud seleccionada', 'Cerrar', snackbarConfig(['warning-snackbar']));
      return;
    }

    this.logger.log('Rechazando solicitud ECAES:', this.selectedSolicitud.id_solicitud);

    // Usar el método específico rejectRequest
    this.pruebasEcaesService.rejectRequest(this.selectedSolicitud.id_solicitud, 'Solicitud rechazada por el funcionario').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.logger.log('Solicitud ECAES rechazada exitosamente:', response);
        this.snackBar.open('Solicitud rechazada exitosamente', 'Cerrar', snackbarConfig(['success-snackbar']));

        // Recargar solicitudes después del rechazo
        this.cargarSolicitudesPendientes();

        // Limpiar selección
        this.selectedSolicitud = null;
      },
      error: (error) => {
        this.logger.error('Error al rechazar solicitud ECAES:', error);
        const mensaje = this.errorHandler.extraerMensajeError(error);
        this.snackBar.open(mensaje || 'Error al rechazar solicitud', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }
}
