import { ChangeDetectionStrategy, Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import {
  HistorialSolicitudesService,
  HistorialResponse,
  HistorialSolicitud,
  FiltrosHistorial,
  categoriaPorNombre,
} from '@core/services/historial-solicitudes.service';
import { PeriodoFiltroSelectorComponent } from '@shared/components/periodo-filtro-selector/periodo-filtro-selector.component';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import { UtfFixPipe } from '@shared/pipes/utf-fix.pipe';
import { LoggerService } from '@core/services/logger.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { EstadoClasePipe, EstadoLabelPipe } from '@shared/pipes/estado.pipes';
import { FechaPipe } from '@shared/pipes/fecha.pipe';
import { SnackbarService } from '@core/services/snackbar.service';

@Component({
  selector: 'app-historial-completo',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    PeriodoFiltroSelectorComponent,
    CardContainerComponent,
    UtfFixPipe,
    EstadoClasePipe,
    EstadoLabelPipe,
    FechaPipe,
  ],
  templateUrl: './historial-completo.component.html',
  styleUrls: ['../estados-solicitud-comun.css', './historial-completo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialCompletoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private historialService = inject(HistorialSolicitudesService);
  private snackbar = inject(SnackbarService);
  private logger = inject(LoggerService);
  private errorHandler = inject(ErrorHandlerService);

  filtrosForm: FormGroup;
  readonly historial = signal<HistorialResponse | null>(null);
  readonly loading = signal(false);
  readonly exportandoPDF = signal(false);
  displayedColumns: string[] = [
    'id_solicitud',
    'nombre_solicitud',
    'categoria',
    'tipo_solicitud',
    'usuario',
    'periodo_academico',
    'estado_actual',
    'fecha_registro',
    'acciones',
  ];

  tiposSolicitud: { codigo: string; display: string }[] = [];
  estadosDisponibles: string[] = [];

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.filtrosForm = this.fb.group({
      periodoAcademico: [''],
      tipoSolicitud: [''],
      estadoActual: [''],
    });

    this.tiposSolicitud = this.historialService.getTiposSolicitud();
    this.estadosDisponibles = this.historialService.getEstadosDisponibles();
  }

  ngOnInit(): void {
    this.cargarHistorial();

    // Suscribirse a cambios en los filtros con debounce
    this.filtrosForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.cargarHistorial();
      });
  }

  cargarHistorial(): void {
    this.loading.set(true);
    const filtros: FiltrosHistorial = {};

    const formValue = this.filtrosForm.value;
    if (formValue.periodoAcademico) {
      filtros.periodoAcademico = formValue.periodoAcademico;
    }
    if (formValue.tipoSolicitud) {
      filtros.tipoSolicitud = formValue.tipoSolicitud;
    }
    if (formValue.estadoActual) {
      filtros.estadoActual = formValue.estadoActual;
    }

    this.historialService
      .obtenerHistorialCompleto(filtros)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.historial.set(response);
          this.loading.set(false);
        },
        error: (error) => {
          this.logger.error('Error al cargar el historial de solicitudes:', error);
          const mensaje = this.errorHandler.extraerMensajeError(error);
          this.snackbar.error(mensaje || 'Error al cargar el historial de solicitudes');
          this.loading.set(false);
        },
      });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      periodoAcademico: '',
      tipoSolicitud: '',
      estadoActual: '',
    });
  }

  onPeriodoChange(periodo: string): void {
    this.filtrosForm.patchValue({ periodoAcademico: periodo || '' });
  }

  /**
   * Detecta el tipo de solicitud desde el nombre (la misma regla que el detalle)
   */
  detectarTipoSolicitud(nombreSolicitud: string): string {
    return categoriaPorNombre(nombreSolicitud);
  }

  /**
   * Obtiene el estado actual desde el array de estados
   */
  obtenerEstadoActual(solicitud: HistorialSolicitud): string {
    if (solicitud.estado_actual) {
      return solicitud.estado_actual;
    }
    if (solicitud.estadosSolicitud && solicitud.estadosSolicitud.length > 0) {
      const ultimoEstado = solicitud.estadosSolicitud[solicitud.estadosSolicitud.length - 1];
      return ultimoEstado.estado_actual || 'N/A';
    }
    return 'N/A';
  }

  /**
   * Exporta el historial actual a PDF
   * Usa los mismos filtros que están aplicados en la tabla del historial
   * para garantizar que el PDF contenga exactamente las mismas solicitudes que se muestran.
   * Si no hay filtros, el PDF incluirá todas las solicitudes del sistema.
   */
  exportarPDF(): void {
    this.exportandoPDF.set(true);

    // Construir filtros desde el formulario (los mismos que se usan para cargar el historial)
    // Esto garantiza que el PDF contenga las mismas solicitudes que se muestran en la tabla
    const filtros: FiltrosHistorial = {};
    const formValue = this.filtrosForm.value;

    // Solo agregar filtros que tengan valor (cadenas vacías no se envían)
    // Si no se envían filtros, el backend incluirá todas las solicitudes
    if (formValue.periodoAcademico) {
      filtros.periodoAcademico = formValue.periodoAcademico;
    }
    if (formValue.tipoSolicitud) {
      filtros.tipoSolicitud = formValue.tipoSolicitud;
    }
    if (formValue.estadoActual) {
      filtros.estadoActual = formValue.estadoActual;
    }

    this.historialService
      .exportarHistorialPDF(filtros)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          try {
            const { blob, filename } = response;

            // Crear URL del blob
            const url = window.URL.createObjectURL(blob);

            // Crear elemento <a> para descargar
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;

            // Simular click para descargar
            document.body.appendChild(link);
            link.click();

            // Limpiar
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            this.snackbar.exito('PDF exportado exitosamente');
          } catch (error) {
            this.logger.error('Error al procesar el archivo PDF:', error);
            this.snackbar.error('Error al procesar el archivo PDF');
          } finally {
            this.exportandoPDF.set(false);
          }
        },
        error: (err) => {
          this.exportandoPDF.set(false);
          this.logger.error('Error al exportar PDF:', err);

          let mensaje = 'Error al exportar PDF';
          if (err.status === 401) {
            mensaje = 'No autorizado. Por favor, inicie sesión nuevamente';
          } else if (err.status === 403) {
            mensaje = 'No tiene permisos para exportar el historial';
          } else if (err.status === 500) {
            mensaje = 'Error del servidor al generar el PDF';
          } else if (err.status === 0) {
            mensaje = 'Error de conexión. Verifique su conexión a internet';
          } else {
            const mensajeError = this.errorHandler.extraerMensajeError(err);
            if (mensajeError && mensajeError !== 'Ocurrió un error inesperado') {
              mensaje = mensajeError;
            }
          }

          this.snackbar.error(mensaje);
        },
      });
  }

  /**
   * trackBy de la tabla de Material (se pasa como [trackBy] en <table mat-table>)
   * @param index Índice del elemento
   * @param solicitud Solicitud del historial
   * @returns ID único de la solicitud
   */
  trackBySolicitudId(index: number, solicitud: HistorialSolicitud): number {
    return solicitud.id_solicitud || index;
  }
}
