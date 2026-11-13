import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { EstadosSolicitud } from '../../../core/enums/estados-solicitud.enum';
import { LoggerService } from '../../../core/services/logger.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { estadoActual } from '../../../core/utils/estado-solicitud.util';
import { TextoDialogComponent, datosRechazo } from '../../../shared/components/texto-dialog/texto-dialog.component';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-reingreso-estudiante',
  standalone: true,
  imports: [
    CommonModule,
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

  private destroy$ = new Subject<void>();

  constructor(
    public reingresoService: ReingresoEstudianteService,
    private snackbar: SnackbarService,
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
          fecha: sol.fecha_registro_solicitud, // ISO: la tabla la formatea con el pipe fecha
          estado: estadoActual(sol),
          rutaArchivo: '',
          comentarios: ''
        }));
        if (sols.length) this.selectedSolicitud = sols[0];
      },
      error: (err) => {
        this.logger.error('Error al cargar solicitudes:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackbar.error(mensaje || 'Error al cargar solicitudes');
      }
    });
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

  /**
   * Manejar cuando se agrega un comentario desde el DocumentationViewerComponent
   */
  onComentarioAgregado(event: {documento: any, comentario: string}): void {
    if (event.documento.id_documento) {
      this.reingresoService.agregarComentario(event.documento.id_documento, event.comentario).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.snackbar.exito('Comentario añadido correctamente');
          // Recargar la solicitud para actualizar los comentarios
          this.cargarSolicitudes();
        },
        error: (error) => {
          this.logger.error('Error al añadir comentario:', error);
          const mensaje = this.errorHandler.extraerMensajeError(error);
          this.snackbar.error(mensaje || 'Error al añadir comentario');
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
        this.snackbar.exito('Solicitud aprobada definitivamente');
        this.cargarSolicitudes();
        this.selectedSolicitud = undefined;
        this.requestStatusTable?.resetSelection();
      },
      error: (err) => {
        this.logger.error('Error al aprobar solicitud:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackbar.error(mensaje || 'Error al aprobar solicitud');
      }
    });
  }

  rechazarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    const dialogRef = this.dialog.open(TextoDialogComponent, {
      width: '450px',
      data: datosRechazo()
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe((motivo: string) => {
      if (motivo) {
        this.reingresoService.rejectRequest(this.selectedSolicitud!.id_solicitud, motivo).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.snackbar.exito('Solicitud rechazada');
            this.cargarSolicitudes();
            this.selectedSolicitud = undefined;
            this.requestStatusTable?.resetSelection();
          },
          error: (err) => {
            this.logger.error('Error al rechazar solicitud:', err);
            const mensaje = this.errorHandler.extraerMensajeError(err);
            this.snackbar.error(mensaje || 'Error al rechazar solicitud');
          }
        });
      }
    });
  }

  // Validar si se puede realizar una acción según el estado actual
  puedeAprobar(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = estadoActual(this.selectedSolicitud);
    return estado === EstadosSolicitud.APROBADA_FUNCIONARIO;
  }

  puedeRechazar(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = estadoActual(this.selectedSolicitud);
    return estado === EstadosSolicitud.APROBADA_FUNCIONARIO;
  }

  puedeAprobarComoCoordinador(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = estadoActual(this.selectedSolicitud);
    return estado === EstadosSolicitud.APROBADA_FUNCIONARIO;
  }

  puedeAprobarDefinitivamente(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = estadoActual(this.selectedSolicitud);
    return estado === EstadosSolicitud.APROBADA_COORDINADOR;
  }
}
