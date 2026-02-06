import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
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
import { LoggerService } from '../../../core/services/logger.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

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
    CardContainerComponent,
    RequestStatusTableComponent,
    DocumentationViewerComponent
  ],
  templateUrl: './reingreso-estudiante.component.html',
  styleUrls: ['./reingreso-estudiante.component.css']
})
export class ReingresoEstudianteComponent implements OnInit, OnDestroy {
  @ViewChild('requestStatusTable') requestStatusTable!: RequestStatusTableComponent;

  solicitudes: any[] = []; // Transformado para RequestStatusTableComponent
  selectedSolicitud?: SolicitudReingresoDTORespuesta;

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
  }

  cargarSolicitudes(): void {
    this.reingresoService.getCoordinadorRequests().pipe(
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
        this.snackBar.open(mensaje || 'Error al cargar solicitudes', 'Cerrar', { duration: 3000 });
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
    this.reingresoService.getCoordinadorRequests().pipe(
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
          this.snackBar.open('Comentario añadido correctamente', 'Cerrar', { duration: 3000 });
          // Recargar la solicitud para actualizar los comentarios
          this.cargarSolicitudes();
        },
        error: (error) => {
          this.logger.error('Error al añadir comentario:', error);
          const mensaje = this.errorHandler.extraerMensajeError(error);
          this.snackBar.open(mensaje || 'Error al añadir comentario', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }


  // Métodos para aprobar y rechazar solicitudes
  aprobarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    this.reingresoService.approveAsCoordinador(this.selectedSolicitud.id_solicitud).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Solicitud aprobada definitivamente', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
        this.selectedSolicitud = undefined;
        this.requestStatusTable?.resetSelection();
      },
      error: (err) => {
        this.logger.error('Error al aprobar solicitud:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al aprobar solicitud', 'Cerrar', { duration: 3000 });
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
        this.reingresoService.rejectAsCoordinador(this.selectedSolicitud!.id_solicitud, motivo).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 3000 });
            this.cargarSolicitudes();
            this.selectedSolicitud = undefined;
            this.requestStatusTable?.resetSelection();
          },
          error: (err) => {
            this.logger.error('Error al rechazar solicitud:', err);
            const mensaje = this.errorHandler.extraerMensajeError(err);
            this.snackBar.open(mensaje || 'Error al rechazar solicitud', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
  }

  // Validar si se puede realizar una acción según el estado actual
  puedeAprobar(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = this.getEstadoActual(this.selectedSolicitud);
    return estado === EstadosSolicitud.APROBADA_FUNCIONARIO;
  }

  puedeRechazar(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = this.getEstadoActual(this.selectedSolicitud);
    return estado === EstadosSolicitud.APROBADA_FUNCIONARIO;
  }

  puedeAprobarComoCoordinador(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = this.getEstadoActual(this.selectedSolicitud);
    return estado === EstadosSolicitud.APROBADA_FUNCIONARIO;
  }

  puedeAprobarDefinitivamente(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = this.getEstadoActual(this.selectedSolicitud);
    return estado === EstadosSolicitud.APROBADA_COORDINADOR;
  }
}
