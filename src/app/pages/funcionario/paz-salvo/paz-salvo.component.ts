import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { Solicitud, Archivo, SolicitudHomologacionDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
import { SolicitudStatusEnum } from '../../../core/enums/solicitud-status.enum';
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
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    RequestStatusTableComponent,
    DocumentationViewerComponent,
    CardContainerComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoComponent implements OnInit {
  @ViewChild('requestStatusTable') requestStatusTable!: RequestStatusTableComponent;

  solicitudes: Solicitud[] = [];
  selectedSolicitud: Solicitud | null = null;

  constructor(
    public pazSalvoService: PazSalvoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.pazSalvoService.getPendingRequests().subscribe({
      next: (data) => {
        console.log('📡 Solicitudes recibidas del backend:', data);

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

        console.log('✅ Solicitudes mapeadas:', this.solicitudes);
      },
      error: (err) => {
        console.error('❌ Error al cargar solicitudes:', err);
        this.snackBar.open('Error al cargar solicitudes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onSolicitudSeleccionada(solicitudId: number | null): void {
    if (solicitudId === null) {
      this.selectedSolicitud = null;
      return;
    }
    this.selectedSolicitud = this.solicitudes.find(s => s.id === solicitudId) || null;
    console.log('📋 Solicitud seleccionada:', this.selectedSolicitud);
  }

  get archivosDelEstudiante(): any[] {
    if (!this.selectedSolicitud?.archivos) return [];

    // Convertir Archivo[] a formato compatible con DocumentationViewerComponent
    return this.selectedSolicitud.archivos.map(archivo => ({
      ...archivo,
      fecha_documento: archivo.fecha, // Mapear fecha a fecha_documento
      id_documento: archivo.id_documento || 0
    }));
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
    if (!this.selectedSolicitud) return;

    // Solo aprobar la solicitud (sin actualizar documentos para evitar error 500)
    this.pazSalvoService.approveRequest(this.selectedSolicitud.id).subscribe({
      next: () => {
        this.snackBar.open('Solicitud aprobada exitosamente ✅', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
        this.selectedSolicitud = null;
        this.requestStatusTable?.resetSelection();
      },
      error: (err) => {
        console.error('Error al aprobar solicitud:', err);
        this.snackBar.open('Error al aprobar solicitud', 'Cerrar', { duration: 3000 });
      }
    });
  }

  terminarValidacionSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    this.pazSalvoService.completeValidation(this.selectedSolicitud.id).subscribe({
      next: () => {
        this.snackBar.open('Solicitud enviada a revisión del coordinador ✅', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudes();
        this.selectedSolicitud = null;
        this.requestStatusTable?.resetSelection();
      },
      error: (err) => {
        console.error('Error al enviar a revisión:', err);
        this.snackBar.open('Error al enviar solicitud a revisión', 'Cerrar', { duration: 3000 });
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
        this.pazSalvoService.rejectRequest(this.selectedSolicitud!.id, motivo).subscribe({
          next: () => {
            this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 3000 });
            this.cargarSolicitudes();
            this.selectedSolicitud = null;
            this.requestStatusTable?.resetSelection();
          },
          error: (err) => this.snackBar.open('Error al rechazar solicitud', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }

}
