import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { SolicitudHomologacionDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
import { RechazoDialogComponent, RechazoDialogData } from '../../../shared/components/rechazo-dialog/rechazo-dialog.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { DocumentationViewerComponent } from '../../../shared/components/documentation-viewer/documentation-viewer.component';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { ComentarioDialogComponent, ComentarioDialogData } from '../../../shared/components/comentario-dialog/comentario-dialog.component';

@Component({
  selector: 'app-paz-salvo',
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
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoComponent implements OnInit {
  @ViewChild('requestStatusTable') requestStatusTable!: RequestStatusTableComponent;

  solicitudes: any[] = []; // Transformado para RequestStatusTableComponent
  selectedSolicitud: SolicitudHomologacionDTORespuesta | null = null;

  constructor(
    public pazSalvoService: PazSalvoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.pazSalvoService.getPendingRequests().subscribe({
      next: (sols) => {
        // Transformar datos para RequestStatusTableComponent (igual que homologación)
        this.solicitudes = sols.map(sol => ({
          id: sol.id_solicitud,
          nombre: sol.nombre_solicitud,
          fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
          estado: this.getEstadoActual(sol),
          rutaArchivo: '',
          comentarios: ''
        }));
        // ✅ CORREGIDO: No seleccionar automáticamente la primera solicitud
        // Los documentos solo se mostrarán cuando el usuario seleccione manualmente
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

    // Buscar la solicitud original por ID (igual que homologación)
    this.pazSalvoService.getPendingRequests().subscribe({
      next: (sols) => {
        this.selectedSolicitud = sols.find(sol => sol.id_solicitud === solicitudId) || null;
      }
    });
  }


  get documentosDelEstudiante(): DocumentoHomologacion[] {
    return this.selectedSolicitud?.documentos ?? [];
  }

  /**
   * Manejar cuando se agrega un comentario desde el DocumentationViewerComponent
   */
  onComentarioAgregado(event: {documento: any, comentario: string}): void {
    if (event.documento.id_documento) {
      this.pazSalvoService.agregarComentario(event.documento.id_documento, event.comentario).subscribe({
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
    console.log('🚀 Iniciando aprobación de solicitud de Paz y Salvo');
    console.log('👤 Solicitud seleccionada:', this.selectedSolicitud);
    
    if (!this.selectedSolicitud) {
      console.log('❌ No hay solicitud seleccionada');
      return;
    }

    console.log('🔢 ID de solicitud a aprobar:', this.selectedSolicitud.id_solicitud);

    // Actualizar estado de la solicitud (igual que homologación)
    this.pazSalvoService.approveRequest(this.selectedSolicitud.id_solicitud).subscribe({
      next: () => {
        console.log('✅ Solicitud aprobada exitosamente');
        // Actualizar estado de los documentos
        const documentosActualizados = this.documentosDelEstudiante.map(doc => ({
          id_documento: doc.id_documento,
          esValido: true // Marcar como válido al aprobar
        }));

        // Intentar actualizar documentos, pero no bloquear si falla
        this.pazSalvoService.actualizarEstadoDocumentos(this.selectedSolicitud!.id_solicitud, documentosActualizados).subscribe({
          next: () => {
            console.log('✅ Documentos actualizados exitosamente');
            this.snackBar.open('Solicitud aprobada y documentos actualizados ✅', 'Cerrar', { duration: 3000 });
            this.cargarSolicitudes();
            // Limpiar la selección para actualizar el card de documentación
            this.selectedSolicitud = null;
            this.requestStatusTable?.resetSelection();
          },
          error: (err) => {
            console.error('❌ Error al actualizar documentos (no crítico):', err);
            // Mostrar mensaje informativo pero no de error
            this.snackBar.open('Solicitud aprobada ✅ (Documentos se actualizarán automáticamente)', 'Cerrar', { duration: 3000 });
            this.cargarSolicitudes();
            // Limpiar la selección para actualizar el card de documentación
            this.selectedSolicitud = null;
            this.requestStatusTable?.resetSelection();
          }
        });
      },
      error: (err) => {
        console.error('❌ Error al aprobar solicitud:', err);
        console.log('📊 Detalles del error:', err);
        
        // Intentar leer el contenido del error si es un Blob
        if (err.error instanceof Blob) {
          console.log('📄 Error es un Blob, leyendo contenido...');
          err.error.text().then((text: string) => {
            console.log('📄 Contenido del error (Blob):', text);
            try {
              const errorData = JSON.parse(text);
              console.log('📄 Error parseado:', errorData);
              this.snackBar.open('Error del servidor: ' + (errorData.message || errorData.error || 'Error desconocido'), 'Cerrar', { duration: 5000 });
            } catch (e) {
              console.log('📄 Error no es JSON válido:', text);
              this.snackBar.open('Error del servidor: ' + text, 'Cerrar', { duration: 5000 });
            }
          });
        } else {
          this.snackBar.open('Error al aprobar solicitud: ' + (err.error?.message || err.message || 'Error desconocido'), 'Cerrar', { duration: 5000 });
        }
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

    dialogRef.afterClosed().subscribe((motivo: string) => {
      if (motivo) {
        // Actualizar estado de la solicitud (igual que homologación)
        this.pazSalvoService.rejectRequest(this.selectedSolicitud!.id_solicitud, motivo).subscribe({
          next: () => {
            // Actualizar estado de los documentos
            const documentosActualizados = this.documentosDelEstudiante.map(doc => ({
              id_documento: doc.id_documento,
              esValido: false // Marcar como inválido al rechazar
            }));

            this.pazSalvoService.actualizarEstadoDocumentos(this.selectedSolicitud!.id_solicitud, documentosActualizados).subscribe({
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
