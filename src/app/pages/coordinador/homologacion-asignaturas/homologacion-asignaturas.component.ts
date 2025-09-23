import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';
import { SolicitudHomologacionDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
import { RechazoDialogComponent, RechazoDialogData } from '../../../shared/components/rechazo-dialog/rechazo-dialog.component';
import { ComentarioDialogComponent, ComentarioDialogData } from '../../../shared/components/comentario-dialog/comentario-dialog.component';
import { EstadosSolicitud, ESTADOS_SOLICITUD_LABELS, ESTADOS_SOLICITUD_COLORS } from '../../../core/enums/estados-solicitud.enum';

@Component({
  selector: 'app-homologacion-asignaturas',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule
  ],
  templateUrl: './homologacion-asignaturas.component.html',
  styleUrls: ['./homologacion-asignaturas.component.css']
})
export class HomologacionAsignaturasComponent implements OnInit {
  solicitudes: SolicitudHomologacionDTORespuesta[] = [];
  selectedSolicitud?: SolicitudHomologacionDTORespuesta;

  displayedColumns: string[] = ['nombre_solicitud', 'solicitante', 'fecha', 'estado', 'accion'];

  // Enums para estados
  EstadosSolicitud = EstadosSolicitud;
  ESTADOS_SOLICITUD_LABELS = ESTADOS_SOLICITUD_LABELS;
  ESTADOS_SOLICITUD_COLORS = ESTADOS_SOLICITUD_COLORS;

  constructor(
    private homologacionService: HomologacionAsignaturasService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.homologacionService.getCoordinadorRequests().subscribe({
      next: (sols) => {
        this.solicitudes = sols;
        if (sols.length) this.selectedSolicitud = sols[0];
      },
      error: (err) => this.snackBar.open('Error al cargar solicitudes', 'Cerrar', { duration: 3000 })
    });
  }

  get documentosDelEstudiante(): DocumentoHomologacion[] {
    return this.selectedSolicitud?.documentos ?? [];
  }

  seleccionarSolicitud(solicitud: SolicitudHomologacionDTORespuesta): void {
    this.selectedSolicitud = solicitud;
  }

  getEstadoActual(solicitud: SolicitudHomologacionDTORespuesta): string {
    if (solicitud.estadosSolicitud && solicitud.estadosSolicitud.length > 0) {
      const ultimoEstado = solicitud.estadosSolicitud[solicitud.estadosSolicitud.length - 1];
      return ultimoEstado.estado_actual;
    }
    return 'ENVIADA';
  }

  getEstadoColor(estado: string): string {
    return this.ESTADOS_SOLICITUD_COLORS[estado as EstadosSolicitud] || 'primary';
  }

  getEstadoLabel(estado: string): string {
    return this.ESTADOS_SOLICITUD_LABELS[estado as EstadosSolicitud] || estado;
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

  // Métodos específicos para coordinador
  aprobarComoCoordinador(): void {
    if (!this.selectedSolicitud) return;

    this.homologacionService.approveAsCoordinador(this.selectedSolicitud.id_solicitud).subscribe({
      next: () => {
        this.snackBar.open('Solicitud aprobada como coordinador ✅', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
      },
      error: (err) => this.snackBar.open('Error al aprobar solicitud', 'Cerrar', { duration: 3000 })
    });
  }

  aprobarDefinitivamente(): void {
    if (!this.selectedSolicitud) return;

    this.homologacionService.approveDefinitively(this.selectedSolicitud.id_solicitud).subscribe({
      next: () => {
        this.snackBar.open('Solicitud aprobada definitivamente ✅', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
      },
      error: (err) => this.snackBar.open('Error al aprobar solicitud', 'Cerrar', { duration: 3000 })
    });
  }

  rechazarComoCoordinador(): void {
    if (!this.selectedSolicitud) return;

    const dialogRef = this.dialog.open(RechazoDialogComponent, {
      width: '450px',
      data: <RechazoDialogData>{
        titulo: 'Rechazar solicitud',
        descripcion: 'Indique el motivo de rechazo de la solicitud:',
        placeholder: 'Motivo de rechazo'
      }
    });

    dialogRef.afterClosed().subscribe((motivo: string) => {
      if (motivo) {
        this.homologacionService.rejectAsCoordinador(this.selectedSolicitud!.id_solicitud, motivo).subscribe({
          next: () => {
            this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 3000 });
            this.cargarSolicitudes();
          },
          error: (err) => this.snackBar.open('Error al rechazar solicitud', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }

  // Validar si se puede realizar una acción según el estado actual
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

  puedeRechazar(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = this.getEstadoActual(this.selectedSolicitud);
    return estado === EstadosSolicitud.APROBADA_FUNCIONARIO || estado === EstadosSolicitud.ENVIADA;
  }
}
