// src/app/pages/coordinador/paz-salvo/paz-salvo.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { Solicitud, Archivo, SolicitudHomologacionDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
import { SolicitudStatusEnum } from '../../../core/enums/solicitud-status.enum';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { ComentarioDialogComponent, ComentarioDialogData } from '../../../shared/components/comentario-dialog/comentario-dialog.component';
import { RechazoDialogComponent, RechazoDialogData } from '../../../shared/components/rechazo-dialog/rechazo-dialog.component';

@Component({
  selector: 'app-paz-salvo-coordinador',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
    RequestStatusTableComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoCoordinadorComponent implements OnInit {
  @ViewChild('requestStatusTable') requestStatusTable!: RequestStatusTableComponent;
  
  solicitudes: Solicitud[] = [];
  selectedSolicitud: SolicitudHomologacionDTORespuesta | undefined;

  constructor(
    private pazSalvoService: PazSalvoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  // 📌 Cargar solicitudes pendientes según el rol del usuario actual
  cargarSolicitudes(): void {
    this.pazSalvoService.getCoordinatorRequests().subscribe({
      next: (data) => {
        console.log('📡 Solicitudes recibidas del backend (coordinador):', data);
        
        // Mapear a formato de solicitudes para la tabla
        this.solicitudes = data.map(solicitud => ({
          id: solicitud.id_solicitud,
          nombre: solicitud.nombre_solicitud,
          fecha: solicitud.fecha_registro_solicitud,
          estado: solicitud.estadosSolicitud?.[solicitud.estadosSolicitud.length - 1]?.estado_actual as SolicitudStatusEnum || SolicitudStatusEnum.ENVIADA,
          comentarios: solicitud.estadosSolicitud?.[solicitud.estadosSolicitud.length - 1]?.comentario || '',
          archivos: solicitud.documentos?.map((doc: DocumentoHomologacion) => ({
            id_documento: doc.id_documento,
            nombre: doc.nombre,
            ruta_documento: doc.ruta_documento,
            fecha: doc.fecha_documento,
            esValido: doc.esValido,
            comentario: doc.comentario
          })) || []
        }));
        
        console.log('✅ Solicitudes mapeadas (coordinador):', this.solicitudes);
      },
      error: (err) => {
        console.error('❌ Error al cargar solicitudes (coordinador):', err);
        this.snackBar.open('Error al cargar solicitudes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onSolicitudSeleccionada(solicitudId: number | null): void {
    if (solicitudId === null) {
      this.selectedSolicitud = undefined;
      return;
    }
    // Buscar la solicitud original por ID
    this.pazSalvoService.getCoordinatorRequests().subscribe({
      next: (sols) => {
        this.selectedSolicitud = sols.find(sol => sol.id_solicitud === solicitudId);
        console.log('📋 Solicitud seleccionada (coordinador):', this.selectedSolicitud);
      }
    });
  }

  // 📌 Obtener documentos de la solicitud seleccionada (igual que homologación)
  get documentosDelEstudiante(): DocumentoHomologacion[] {
    return this.selectedSolicitud?.documentos ?? [];
  }

  // 📌 Ver documento en nueva pestaña (igual que homologación)
  verDocumento(documento: DocumentoHomologacion): void {
    if (!documento.nombre) {
      this.snackBar.open(`No hay nombre de archivo disponible para el documento`, 'Cerrar', { duration: 3000 });
      return;
    }

    // Mostrar mensaje de carga
    this.snackBar.open('Descargando documento...', 'Cerrar', { duration: 2000 });

    this.pazSalvoService.descargarArchivo(documento.nombre).subscribe({
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


  // 📌 Aprobar toda la solicitud
  aprobarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    this.pazSalvoService.approveDefinitively(this.selectedSolicitud.id_solicitud).subscribe({
      next: () => {
        this.snackBar.open('Paz y Salvo aprobado definitivamente ✅', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
        this.selectedSolicitud = undefined;
        this.requestStatusTable?.resetSelection();
      },
      error: () => this.snackBar.open('Error al aprobar solicitud', 'Cerrar', { duration: 3000 })
    });
  }

  // 📌 Rechazar toda la solicitud
  rechazarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    const dialogRef = this.dialog.open(RechazoDialogComponent, {
      width: '450px',
      data: <RechazoDialogData>{
        titulo: 'Rechazar Paz y Salvo',
        descripcion: 'Indique el motivo de rechazo del paz y salvo:',
        placeholder: 'Motivo de rechazo'
      }
    });

    dialogRef.afterClosed().subscribe((motivo: string) => {
      if (motivo) {
        this.pazSalvoService.rejectRequest(this.selectedSolicitud!.id_solicitud, motivo).subscribe({
          next: () => {
            this.snackBar.open('Paz y Salvo rechazado', 'Cerrar', { duration: 3000 });
            this.cargarSolicitudes();
            this.selectedSolicitud = undefined;
            this.requestStatusTable?.resetSelection();
          },
          error: () => this.snackBar.open('Error al rechazar solicitud', 'Cerrar', { duration: 3000 })
        });
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
        this.pazSalvoService.agregarComentario(documento.id_documento, comentario).subscribe({
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
}
