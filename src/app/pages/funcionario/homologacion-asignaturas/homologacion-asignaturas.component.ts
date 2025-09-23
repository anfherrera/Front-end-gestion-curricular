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
    RequestStatusTableComponent
  ],
  templateUrl: './homologacion-asignaturas.component.html',
  styleUrls: ['./homologacion-asignaturas.component.css']
})
export class HomologacionAsignaturasComponent implements OnInit {
  @ViewChild('requestStatusTable') requestStatusTable!: RequestStatusTableComponent;
  
  solicitudes: any[] = []; // Transformado para RequestStatusTableComponent
  selectedSolicitud: SolicitudHomologacionDTORespuesta | null = null;

  constructor(
    private homologacionService: HomologacionAsignaturasService,
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

  verDocumento(documento: DocumentoHomologacion): void {
    if (!documento.nombre) {
      this.snackBar.open(`No hay nombre de archivo disponible para el documento`, 'Cerrar', { duration: 3000 });
      return;
    }

    // Mostrar mensaje de carga
    this.snackBar.open('Descargando documento...', 'Cerrar', { duration: 2000 });

    this.homologacionService.descargarArchivo(documento.nombre).subscribe({
      next: (blob: Blob) => {
        // Crear URL única del blob para evitar cache
        const url = window.URL.createObjectURL(blob);
        
        // Crear un iframe temporal para mostrar el PDF
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.border = 'none';
        
        // Crear ventana emergente
        const newWindow = window.open('', '_blank', 'width=800,height=700,scrollbars=yes,resizable=yes');
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>${documento.nombre}</title>
                <style>
                  body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                  .header { margin-bottom: 20px; }
                  .filename { font-size: 18px; font-weight: bold; color: #333; }
                </style>
              </head>
              <body>
                <div class="header">
                  <div class="filename">${documento.nombre}</div>
                </div>
              </body>
            </html>
          `);
          newWindow.document.body.appendChild(iframe);
        }
        
        // Limpiar la URL después de un tiempo
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 5000);

        this.snackBar.open('Documento abierto correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error al descargar el documento:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.message);
        console.error('URL:', error.url);
        
        let mensajeError = `Error al descargar el documento: ${documento.nombre}`;
        
        if (error.status === 404) {
          mensajeError = `Archivo no encontrado: ${documento.nombre}`;
        } else if (error.status === 401) {
          mensajeError = 'No autorizado para descargar el archivo';
        } else if (error.status === 500) {
          mensajeError = 'Error interno del servidor al descargar el archivo';
        }
        
        this.snackBar.open(mensajeError, 'Cerrar', { duration: 5000 });
      }
    });
  }

  agregarComentario(documento: DocumentoHomologacion): void {
    const dialogRef = this.dialog.open(ComentarioDialogComponent, {
      width: '500px',
      data: <ComentarioDialogData>{
        titulo: 'Añadir Comentario',
        descripcion: 'Ingrese un comentario para este documento:',
        placeholder: 'Escriba su comentario aquí...',
        nombreDocumento: documento.nombre
      }
    });

    dialogRef.afterClosed().subscribe((comentario: string) => {
      if (comentario && documento.id_documento) {
        this.homologacionService.agregarComentario(documento.id_documento, comentario).subscribe({
          next: () => {
            this.snackBar.open('Comentario añadido correctamente', 'Cerrar', { duration: 3000 });
          },
          error: (error) => {
            console.error('Error al añadir comentario:', error);
            this.snackBar.open('Error al añadir comentario', 'Cerrar', { duration: 3000 });
          }
        });
      }
    });
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
