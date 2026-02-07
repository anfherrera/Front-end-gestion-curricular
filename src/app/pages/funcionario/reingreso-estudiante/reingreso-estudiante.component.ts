import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ReingresoEstudianteService } from '../../../core/services/reingreso-estudiante.service';
import { SolicitudReingresoDTORespuesta, DocumentosDTORespuesta } from '../../../core/models/procesos.model';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { DocumentationViewerComponent } from '../../../shared/components/documentation-viewer/documentation-viewer.component';
import { RechazoDialogComponent, RechazoDialogData } from '../../../shared/components/rechazo-dialog/rechazo-dialog.component';
import { ComentarioDialogComponent, ComentarioDialogData } from '../../../shared/components/comentario-dialog/comentario-dialog.component';
import { EstadosSolicitud, ESTADOS_SOLICITUD_LABELS, ESTADOS_SOLICITUD_COLORS } from '../../../core/enums/estados-solicitud.enum';
import { PeriodoFiltroSelectorComponent } from '../../../shared/components/periodo-filtro-selector/periodo-filtro-selector.component';
import { LoggerService } from '../../../core/services/logger.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { snackbarConfig } from '../../../core/design-system/design-tokens';

@Component({
  selector: 'app-reingreso-estudiante',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatTabsModule,
    CardContainerComponent,
    RequestStatusTableComponent,
    DocumentationViewerComponent,
    PeriodoFiltroSelectorComponent
  ],
  templateUrl: './reingreso-estudiante.component.html',
  styleUrls: ['./reingreso-estudiante.component.css']
})
export class ReingresoEstudianteComponent implements OnInit, OnDestroy {
  @ViewChild('requestStatusTable') requestStatusTable!: RequestStatusTableComponent;

  solicitudes: any[] = []; // Transformado para RequestStatusTableComponent - Pendientes
  solicitudesProcesadas: any[] = []; // Transformado para RequestStatusTableComponent - Procesadas
  selectedSolicitud?: SolicitudReingresoDTORespuesta;
  periodoAcademicoFiltro: string | null = null; // Filtro de período académico para historial

  // Enums para estados
  EstadosSolicitud = EstadosSolicitud;
  ESTADOS_SOLICITUD_LABELS = ESTADOS_SOLICITUD_LABELS;
  ESTADOS_SOLICITUD_COLORS = ESTADOS_SOLICITUD_COLORS;

  private destroy$ = new Subject<void>();

  constructor(
    public reingresoService: ReingresoEstudianteService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private logger: LoggerService,
    private errorHandler: ErrorHandlerService
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.cargarSolicitudes();
    this.cargarSolicitudesProcesadas();
  }

  cargarSolicitudes(): void {
    this.reingresoService.getPendingRequests().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (sols) => {
        // Transformar datos para RequestStatusTableComponent
        this.solicitudes = sols.map(sol => ({
          id: sol.id_solicitud,
          nombre: sol.nombre_solicitud,
          fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
          estado: this.getEstadoActual(sol),
          rutaArchivo: '',
          comentarios: ''
        }));
        if (sols.length) this.selectedSolicitud = sols[0];
      },
      error: (err) => {
        this.logger.error('Error al cargar solicitudes:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al cargar solicitudes', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  getEstadoActual(solicitud: SolicitudReingresoDTORespuesta): string {
    if (solicitud.estadosSolicitud && solicitud.estadosSolicitud.length > 0) {
      const ultimoEstado = solicitud.estadosSolicitud[solicitud.estadosSolicitud.length - 1];
      return ultimoEstado.estado_actual;
    }
    return 'Pendiente';
  }

  onSolicitudSeleccionada(solicitudId: number | null): void {
    if (solicitudId === null) {
      this.selectedSolicitud = undefined;
      return;
    }
    // Buscar la solicitud original por ID
    this.reingresoService.getPendingRequests().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (sols) => {
        this.selectedSolicitud = sols.find(sol => sol.id_solicitud === solicitudId);
      },
      error: (err) => {
        this.logger.error('Error al cargar solicitud seleccionada:', err);
      }
    });
  }

  get documentosDelEstudiante(): DocumentosDTORespuesta[] {
    return this.selectedSolicitud?.documentos ?? [];
  }

  seleccionarSolicitud(solicitud: SolicitudReingresoDTORespuesta): void {
    this.selectedSolicitud = solicitud;
  }

  getEstadoColor(estado: string): string {
    return this.ESTADOS_SOLICITUD_COLORS[estado as EstadosSolicitud] || 'primary';
  }

  getEstadoLabel(estado: string): string {
    return this.ESTADOS_SOLICITUD_LABELS[estado as EstadosSolicitud] || estado;
  }

  /**
   * Manejar cuando se agrega un comentario desde el DocumentationViewerComponent
   */
  onComentarioAgregado(event: {documento: any, comentario: string}): void {
    if (event.documento.id_documento) {
      this.reingresoService.agregarComentario(event.documento.id_documento, event.comentario).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.snackBar.open('Comentario añadido correctamente', 'Cerrar', snackbarConfig(['success-snackbar']));
          // Recargar la solicitud para actualizar los comentarios
          this.cargarSolicitudes();
        },
        error: (error) => {
          this.logger.error('Error al añadir comentario:', error);
          const mensaje = this.errorHandler.extraerMensajeError(error);
          this.snackBar.open(mensaje || 'Error al añadir comentario', 'Cerrar', snackbarConfig(['error-snackbar']));
        }
      });
    }
  }


  // Métodos para aprobar y rechazar solicitudes
  aprobarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    this.reingresoService.approveRequest(this.selectedSolicitud.id_solicitud).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Solicitud aprobada', 'Cerrar', snackbarConfig(['success-snackbar']));
        this.cargarSolicitudes();
        this.selectedSolicitud = undefined;
        this.requestStatusTable?.resetSelection();
      },
      error: (err) => {
        this.logger.error('Error al aprobar solicitud:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al aprobar solicitud', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  rechazarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    const dialogRef = this.dialog.open(RechazoDialogComponent, {
      width: '450px',
      data: <RechazoDialogData>{
        titulo: 'Rechazar solicitud',
        descripcion: 'Indique el motivo de rechazo de toda la solicitud:',
        placeholder: 'Motivo de rechazo'
      }
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe((motivo: string) => {
      if (motivo) {
        this.reingresoService.rejectRequest(this.selectedSolicitud!.id_solicitud, motivo).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.snackBar.open('Solicitud rechazada', 'Cerrar', snackbarConfig(['success-snackbar']));
            this.cargarSolicitudes();
            this.selectedSolicitud = undefined;
            this.requestStatusTable?.resetSelection();
          },
          error: (err) => {
            this.logger.error('Error al rechazar solicitud:', err);
            const mensaje = this.errorHandler.extraerMensajeError(err);
            this.snackBar.open(mensaje || 'Error al rechazar solicitud', 'Cerrar', snackbarConfig(['error-snackbar']));
          }
        });
      }
    });
  }

  completarValidacion(): void {
    if (!this.selectedSolicitud) return;

    this.reingresoService.completeValidation(this.selectedSolicitud.id_solicitud).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Validación completada, enviando a coordinador', 'Cerrar', snackbarConfig(['success-snackbar']));
        this.cargarSolicitudes();
        this.selectedSolicitud = undefined;
        this.requestStatusTable?.resetSelection();
      },
      error: (err) => {
        this.logger.error('Error al completar validación:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al completar validación', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  // Validar si se puede realizar una acción según el estado actual
  puedeAprobar(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = this.getEstadoActual(this.selectedSolicitud);
    this.logger.debug('🔍 Estado actual para aprobar:', estado);
    // Para funcionario, puede aprobar cuando el estado es "Enviada" (como se mencionó en el contexto)
    return estado === 'Enviada' || estado === 'ENVIADA' || estado === 'Pendiente' || estado === 'PENDIENTE';
  }

  puedeRechazar(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = this.getEstadoActual(this.selectedSolicitud);
    this.logger.debug('🔍 Estado actual para rechazar:', estado);
    return estado === 'Enviada' || estado === 'ENVIADA' || estado === 'Pendiente' || estado === 'PENDIENTE';
  }

  puedeCompletarValidacion(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = this.getEstadoActual(this.selectedSolicitud);
    this.logger.debug('🔍 Estado actual para completar validación:', estado);
    return estado === 'Enviada' || estado === 'ENVIADA' || estado === 'Pendiente' || estado === 'PENDIENTE';
  }

  /**
   * Cargar solicitudes procesadas (historial) - Historial verdadero de todas las procesadas
   */
  cargarSolicitudesProcesadas(): void {
    this.reingresoService.getSolicitudesProcesadasFuncionario(this.periodoAcademicoFiltro || undefined).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (sols) => {
        // Transformar datos para RequestStatusTableComponent
        this.solicitudesProcesadas = sols.map(solicitud => ({
          id: solicitud.id_solicitud,
          nombre: solicitud.nombre_solicitud,
          fecha: new Date(solicitud.fecha_registro_solicitud).toLocaleDateString(),
          estado: this.getEstadoActual(solicitud),
          fechaProcesamiento: this.getFechaProcesamiento(solicitud),
          archivos: solicitud.documentos?.map((doc: any) => ({
            id_documento: doc.id_documento,
            nombre: doc.nombre,
            ruta_documento: doc.ruta_documento,
            fecha: doc.fecha_documento,
            esValido: doc.esValido,
            comentario: doc.comentario
          })) || [],
          comentarios: ''
        }));
      },
      error: (err) => {
        this.logger.error('Error al cargar solicitudes procesadas (funcionario):', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al cargar historial de solicitudes procesadas', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  /**
   * Manejar cambio de período académico en el filtro
   */
  onPeriodoChange(periodo: string): void {
    // Si es "todos", enviar null/undefined para que el backend muestre todas las solicitudes
    if (periodo === 'todos' || !periodo) {
      this.periodoAcademicoFiltro = null;
    } else {
      this.periodoAcademicoFiltro = periodo;
    }
    this.cargarSolicitudesProcesadas();
  }

  /**
   * Obtener fecha de procesamiento (último estado APROBADA_FUNCIONARIO)
   */
  getFechaProcesamiento(solicitud: SolicitudReingresoDTORespuesta): string {
    if (solicitud.estadosSolicitud && solicitud.estadosSolicitud.length > 0) {
      const ultimoEstado = solicitud.estadosSolicitud[solicitud.estadosSolicitud.length - 1];
      if (ultimoEstado.fecha_registro_estado) {
        return new Date(ultimoEstado.fecha_registro_estado).toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
    return '';
  }
}
