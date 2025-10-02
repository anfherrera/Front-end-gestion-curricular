import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';
import { SolicitudHomologacionDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { DocumentationViewerComponent } from '../../../shared/components/documentation-viewer/documentation-viewer.component';
import { RechazoDialogComponent, RechazoDialogData } from '../../../shared/components/rechazo-dialog/rechazo-dialog.component';
import { ComentarioDialogComponent, ComentarioDialogData } from '../../../shared/components/comentario-dialog/comentario-dialog.component';

@Component({
  selector: 'app-homologacion-asignaturas',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
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
export class HomologacionAsignaturasComponent implements OnInit {
  @ViewChild('requestStatusTable') requestStatusTable!: RequestStatusTableComponent;

  solicitudes: any[] = []; // Transformado para RequestStatusTableComponent
  selectedSolicitud: SolicitudHomologacionDTORespuesta | null = null;

  constructor(
    public homologacionService: HomologacionAsignaturasService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.homologacionService.getPendingRequests().subscribe({
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
      error: (err) => this.snackBar.open('Error al cargar solicitudes', 'Cerrar', { duration: 3000 })
    });
  }

  getEstadoActual(solicitud: SolicitudHomologacionDTORespuesta): string {
    if (solicitud.estadosSolicitud && solicitud.estadosSolicitud.length > 0) {
      const ultimoEstado = solicitud.estadosSolicitud[solicitud.estadosSolicitud.length - 1];
      return ultimoEstado.estado_actual;
    }
    return 'Pendiente';
  }

  onSolicitudSeleccionada(solicitudId: number | null): void {
    // Si se deseleccionó (null), limpiar la selección
    if (solicitudId === null) {
      this.selectedSolicitud = null;
      return;
    }

    // Buscar la solicitud original por ID
    this.homologacionService.getPendingRequests().subscribe({
      next: (sols) => {
        this.selectedSolicitud = sols.find(sol => sol.id_solicitud === solicitudId) || null;
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
      this.homologacionService.agregarComentario(event.documento.id_documento, event.comentario).subscribe({
        next: () => {
          this.snackBar.open('Comentario añadido correctamente', 'Cerrar', { duration: 3000 });
          // Recargar la solicitud para actualizar los comentarios
          this.cargarSolicitudes();
        },
        error: (error) => {
          console.error('Error al añadir comentario:', error);
          this.snackBar.open('Error al añadir comentario', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }


  aprobarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    // Actualizar estado de la solicitud
    this.homologacionService.approveRequest(this.selectedSolicitud.id_solicitud).subscribe({
      next: () => {
        // Actualizar estado de los documentos
        const documentosActualizados = this.documentosDelEstudiante.map(doc => ({
          id_documento: doc.id_documento,
          esValido: true // Marcar como válido al aprobar
        }));

        this.homologacionService.actualizarEstadoDocumentos(this.selectedSolicitud!.id_solicitud, documentosActualizados).subscribe({
          next: () => {
            this.snackBar.open('Solicitud aprobada y documentos actualizados ✅', 'Cerrar', { duration: 3000 });
            this.cargarSolicitudes();
            // Limpiar la selección para actualizar el card de documentación
            this.selectedSolicitud = null;
            this.requestStatusTable?.resetSelection();
          },
          error: (err) => {
            this.snackBar.open('Solicitud aprobada, pero error al actualizar documentos', 'Cerrar', { duration: 3000 });
            this.cargarSolicitudes();
            // Limpiar la selección para actualizar el card de documentación
            this.selectedSolicitud = null;
            this.requestStatusTable?.resetSelection();
          }
        });
      },
      error: (err) => this.snackBar.open('Error al aprobar solicitud', 'Cerrar', { duration: 3000 })
    });
  }

  terminarValidacionSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    this.homologacionService.completeValidation(this.selectedSolicitud.id_solicitud).subscribe({
      next: () => {
        this.snackBar.open('Validación completada', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
        // Limpiar la selección para actualizar el card de documentación
        this.selectedSolicitud = null;
        this.requestStatusTable?.resetSelection();
      },
      error: (err) => this.snackBar.open('Error al terminar validación', 'Cerrar', { duration: 3000 })
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

    dialogRef.afterClosed().subscribe((motivo: string) => {
      if (motivo) {
        // Actualizar estado de la solicitud
        this.homologacionService.rejectRequest(this.selectedSolicitud!.id_solicitud, motivo).subscribe({
          next: () => {
            // Actualizar estado de los documentos
            const documentosActualizados = this.documentosDelEstudiante.map(doc => ({
              id_documento: doc.id_documento,
              esValido: false // Marcar como inválido al rechazar
            }));

            this.homologacionService.actualizarEstadoDocumentos(this.selectedSolicitud!.id_solicitud, documentosActualizados).subscribe({
              next: () => {
                this.snackBar.open('Solicitud rechazada y documentos actualizados', 'Cerrar', { duration: 3000 });
                this.cargarSolicitudes();
                // Limpiar la selección para actualizar el card de documentación
                this.selectedSolicitud = null;
                this.requestStatusTable?.resetSelection();
              },
              error: (err) => {
                this.snackBar.open('Solicitud rechazada, pero error al actualizar documentos', 'Cerrar', { duration: 3000 });
                this.cargarSolicitudes();
                // Limpiar la selección para actualizar el card de documentación
                this.selectedSolicitud = null;
                this.requestStatusTable?.resetSelection();
              }
            });
          },
          error: (err) => this.snackBar.open('Error al rechazar solicitud', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }
}
