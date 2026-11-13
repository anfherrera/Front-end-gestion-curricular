import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';
import { SolicitudHomologacionDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { DocumentationViewerComponent } from '../../../shared/components/documentation-viewer/documentation-viewer.component';
import { LoggerService } from '../../../core/services/logger.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { estadoActual } from '../../../core/utils/estado-solicitud.util';
import { TextoDialogComponent, datosRechazo } from '../../../shared/components/texto-dialog/texto-dialog.component';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-homologacion-asignaturas',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    CardContainerComponent,
    RequestStatusTableComponent,
    DocumentationViewerComponent
  ],
  templateUrl: './homologacion-asignaturas.component.html',
  styleUrls: ['./homologacion-asignaturas.component.css']
})
export class HomologacionAsignaturasComponent implements OnInit, OnDestroy {
  @ViewChild('requestStatusTable') requestStatusTable!: RequestStatusTableComponent;

  solicitudes: any[] = []; // Transformado para RequestStatusTableComponent
  selectedSolicitud: SolicitudHomologacionDTORespuesta | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    public homologacionService: HomologacionAsignaturasService,
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
    this.homologacionService.getPendingRequests().pipe(
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
    // Si se deseleccionó (null), limpiar la selección
    if (solicitudId === null) {
      this.selectedSolicitud = null;
      return;
    }

    // Buscar la solicitud original por ID
    this.homologacionService.getPendingRequests().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (sols) => {
        this.selectedSolicitud = sols.find(sol => sol.id_solicitud === solicitudId) || null;
      },
      error: (err) => {
        this.logger.error('Error al cargar solicitud seleccionada:', err);
      }
    });
  }

  get documentosDelEstudiante(): DocumentoHomologacion[] {
    return this.selectedSolicitud?.documentos ?? [];
  }

  seleccionarSolicitud(solicitud: SolicitudHomologacionDTORespuesta): void {
    this.selectedSolicitud = solicitud;
  }

  /**
   * Manejar cuando se agrega un comentario desde el DocumentationViewerComponent
   */
  onComentarioAgregado(event: {documento: any, comentario: string}): void {
    if (event.documento.id_documento) {
      this.homologacionService.agregarComentario(event.documento.id_documento, event.comentario).pipe(
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


  aprobarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    // Actualizar estado de la solicitud
    this.homologacionService.approveRequest(this.selectedSolicitud.id_solicitud).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        // Actualizar estado de los documentos
        const documentosActualizados = this.documentosDelEstudiante.map(doc => ({
          id_documento: doc.id_documento,
          esValido: true // Marcar como válido al aprobar
        }));

        this.homologacionService.actualizarEstadoDocumentos(this.selectedSolicitud!.id_solicitud, documentosActualizados).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.snackbar.exito('Solicitud aprobada y documentos actualizados');
            this.cargarSolicitudes();
            // Limpiar la selección para actualizar el card de documentación
            this.selectedSolicitud = null;
            this.requestStatusTable?.resetSelection();
          },
          error: () => {
            this.snackbar.advertencia('Solicitud aprobada, pero error al actualizar documentos');
            this.cargarSolicitudes();
            // Limpiar la selección para actualizar el card de documentación
            this.selectedSolicitud = null;
            this.requestStatusTable?.resetSelection();
          }
        });
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
        // Actualizar estado de la solicitud
        this.homologacionService.rejectRequest(this.selectedSolicitud!.id_solicitud, motivo).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            // Actualizar estado de los documentos
            const documentosActualizados = this.documentosDelEstudiante.map(doc => ({
              id_documento: doc.id_documento,
              esValido: false // Marcar como inválido al rechazar
            }));

            this.homologacionService.actualizarEstadoDocumentos(this.selectedSolicitud!.id_solicitud, documentosActualizados).pipe(
              takeUntil(this.destroy$)
            ).subscribe({
              next: () => {
                this.snackbar.exito('Solicitud rechazada y documentos actualizados');
                this.cargarSolicitudes();
                // Limpiar la selección para actualizar el card de documentación
                this.selectedSolicitud = null;
                this.requestStatusTable?.resetSelection();
              },
              error: () => {
                this.snackbar.advertencia('Solicitud rechazada, pero error al actualizar documentos');
                this.cargarSolicitudes();
                // Limpiar la selección para actualizar el card de documentación
                this.selectedSolicitud = null;
                this.requestStatusTable?.resetSelection();
              }
            });
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
}
