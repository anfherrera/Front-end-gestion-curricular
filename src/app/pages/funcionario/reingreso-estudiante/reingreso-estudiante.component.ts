import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';

import { ReingresoEstudianteService } from '../../../core/services/reingreso-estudiante.service';
import { SolicitudReingresoDTORespuesta, DocumentosDTORespuesta } from '../../../core/models/procesos.model';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { DocumentationViewerComponent } from '../../../shared/components/documentation-viewer/documentation-viewer.component';
import { RechazoDialogComponent, RechazoDialogData } from '../../../shared/components/rechazo-dialog/rechazo-dialog.component';
import { ComentarioDialogComponent, ComentarioDialogData } from '../../../shared/components/comentario-dialog/comentario-dialog.component';
import { EstadosSolicitud, ESTADOS_SOLICITUD_LABELS, ESTADOS_SOLICITUD_COLORS } from '../../../core/enums/estados-solicitud.enum';

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
export class ReingresoEstudianteComponent implements OnInit {
  @ViewChild('requestStatusTable') requestStatusTable!: RequestStatusTableComponent;

  solicitudes: any[] = []; // Transformado para RequestStatusTableComponent
  selectedSolicitud?: SolicitudReingresoDTORespuesta;

  // Enums para estados
  EstadosSolicitud = EstadosSolicitud;
  ESTADOS_SOLICITUD_LABELS = ESTADOS_SOLICITUD_LABELS;
  ESTADOS_SOLICITUD_COLORS = ESTADOS_SOLICITUD_COLORS;

  constructor(
    public reingresoService: ReingresoEstudianteService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.reingresoService.getPendingRequests().subscribe({
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
    this.reingresoService.getPendingRequests().subscribe({
      next: (sols) => {
        this.selectedSolicitud = sols.find(sol => sol.id_solicitud === solicitudId);
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
      this.reingresoService.agregarComentario(event.documento.id_documento, event.comentario).subscribe({
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


  // Métodos para aprobar y rechazar solicitudes
  aprobarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    this.reingresoService.approveRequest(this.selectedSolicitud.id_solicitud).subscribe({
      next: () => {
        this.snackBar.open('Solicitud aprobada ✅', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
        this.selectedSolicitud = undefined;
        this.requestStatusTable?.resetSelection();
      },
      error: (err) => this.snackBar.open('Error al aprobar solicitud', 'Cerrar', { duration: 3000 })
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
        this.reingresoService.rejectRequest(this.selectedSolicitud!.id_solicitud, motivo).subscribe({
          next: () => {
            this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 3000 });
            this.cargarSolicitudes();
            this.selectedSolicitud = undefined;
            this.requestStatusTable?.resetSelection();
          },
          error: (err) => this.snackBar.open('Error al rechazar solicitud', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }

  completarValidacion(): void {
    if (!this.selectedSolicitud) return;

    this.reingresoService.completeValidation(this.selectedSolicitud.id_solicitud).subscribe({
      next: () => {
        this.snackBar.open('Validación completada, enviando a coordinador ✅', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
        this.selectedSolicitud = undefined;
        this.requestStatusTable?.resetSelection();
      },
      error: (err) => this.snackBar.open('Error al completar validación', 'Cerrar', { duration: 3000 })
    });
  }

  // Validar si se puede realizar una acción según el estado actual
  puedeAprobar(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = this.getEstadoActual(this.selectedSolicitud);
    console.log('🔍 Estado actual para aprobar:', estado);
    // Para funcionario, puede aprobar cuando el estado es "Enviada" (como se mencionó en el contexto)
    return estado === 'Enviada' || estado === 'ENVIADA' || estado === 'Pendiente' || estado === 'PENDIENTE';
  }

  puedeRechazar(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = this.getEstadoActual(this.selectedSolicitud);
    console.log('🔍 Estado actual para rechazar:', estado);
    return estado === 'Enviada' || estado === 'ENVIADA' || estado === 'Pendiente' || estado === 'PENDIENTE';
  }

  puedeCompletarValidacion(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = this.getEstadoActual(this.selectedSolicitud);
    console.log('🔍 Estado actual para completar validación:', estado);
    return estado === 'Enviada' || estado === 'ENVIADA' || estado === 'Pendiente' || estado === 'PENDIENTE';
  }
}
