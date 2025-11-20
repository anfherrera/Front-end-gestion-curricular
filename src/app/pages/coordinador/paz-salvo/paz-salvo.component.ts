// src/app/pages/coordinador/paz-salvo/paz-salvo.component.ts
import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';

import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { Solicitud, Archivo, SolicitudHomologacionDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
import { SolicitudStatusEnum } from '../../../core/enums/solicitud-status.enum';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { DocumentationViewerComponent } from '../../../shared/components/documentation-viewer/documentation-viewer.component';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
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
    MatTabsModule,
    RequestStatusTableComponent,
    DocumentationViewerComponent,
    CardContainerComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoCoordinadorComponent implements OnInit {
  @ViewChild('requestStatusTable') requestStatusTable!: RequestStatusTableComponent;

  solicitudes: Solicitud[] = []; // Pendientes
  solicitudesProcesadas: Solicitud[] = []; // Procesadas
  selectedSolicitud: SolicitudHomologacionDTORespuesta | undefined;

  constructor(
    public pazSalvoService: PazSalvoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudesPendientes();
    this.cargarSolicitudesProcesadas();
  }

  // 📌 Cargar solicitudes pendientes según el rol del usuario actual
  cargarSolicitudesPendientes(): void {
    // IGUAL QUE HOMOLOGACIÓN: Usar método directo getCoordinatorRequests()
    this.pazSalvoService.getCoordinatorRequests().subscribe({
      next: (data) => {

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

      },
      error: (err) => {
        console.error('Error al cargar solicitudes (coordinador):', err);
        this.snackBar.open('Error al cargar solicitudes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onSolicitudSeleccionada(solicitudId: number | null): void {
    if (solicitudId === null) {
      this.selectedSolicitud = undefined;
      return;
    }
    
    // IGUAL QUE HOMOLOGACIÓN: Usar método directo
    // Buscar la solicitud original por ID
    this.pazSalvoService.getCoordinatorRequests().subscribe({
      next: (sols) => {
        this.selectedSolicitud = sols.find(sol => sol.id_solicitud === solicitudId);
        
        // Cargar documentos usando el nuevo endpoint
        if (this.selectedSolicitud) {
          this.cargarDocumentos(this.selectedSolicitud.id_solicitud);
        }
      }
    });
  }

  /**
   * 🆕 Cargar documentos usando el nuevo endpoint para coordinadores
   */
  cargarDocumentos(idSolicitud: number): void {
    const endpoint = `/api/solicitudes-pazysalvo/obtenerDocumentos/coordinador/${idSolicitud}`;
    this.pazSalvoService.obtenerDocumentosCoordinador(idSolicitud).subscribe({
      next: (documentos: any[]) => {
        // Actualizar los documentos de la solicitud seleccionada
        if (this.selectedSolicitud) {
          this.selectedSolicitud.documentos = documentos.map(doc => ({
            id_documento: doc.id,
            nombre: doc.nombreArchivo || doc.nombre,
            ruta_documento: doc.ruta,
            fecha_documento: doc.fecha,
            esValido: doc.esValido,
            comentario: doc.comentario
          }));
          
          // Forzar detección de cambios para solucionar el error de Angular
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('[DEBUG] Error al cargar documentos (coordinador):', error);
        console.error('[DEBUG] Error completo:', JSON.stringify(error));
        
        if (this.selectedSolicitud) {
          this.selectedSolicitud.documentos = [];
          this.cdr.detectChanges();
        }
        
        this.snackBar.open('Error al cargar documentos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Cargar solicitudes procesadas (historial) - Estado APROBADA_COORDINADOR
   */
  cargarSolicitudesProcesadas(): void {
    this.pazSalvoService.getSolicitudesProcesadasCoordinador().subscribe({
      next: (sols) => {
        
        // Mapear a formato de solicitudes para la tabla
        this.solicitudesProcesadas = sols.map(solicitud => ({
          id: solicitud.id_solicitud,
          nombre: solicitud.nombre_solicitud,
          fecha: solicitud.fecha_registro_solicitud,
          estado: solicitud.estadosSolicitud?.[solicitud.estadosSolicitud.length - 1]?.estado_actual as SolicitudStatusEnum || SolicitudStatusEnum.ENVIADA,
          comentarios: solicitud.estadosSolicitud?.[solicitud.estadosSolicitud.length - 1]?.comentario || '',
          fechaProcesamiento: this.getFechaProcesamiento(solicitud),
          archivos: solicitud.documentos?.map((doc: DocumentoHomologacion) => ({
            id_documento: doc.id_documento,
            nombre: doc.nombre,
            ruta_documento: doc.ruta_documento,
            fecha: doc.fecha_documento,
            esValido: doc.esValido,
            comentario: doc.comentario
          })) || []
        }));
        
      },
      error: (err) => {
        console.error('Error al cargar solicitudes procesadas (coordinador):', err);
        this.snackBar.open('Error al cargar historial de solicitudes procesadas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Obtener fecha de procesamiento (último estado APROBADA_COORDINADOR)
   */
  getFechaProcesamiento(solicitud: SolicitudHomologacionDTORespuesta): string {
    if (solicitud.estadosSolicitud && solicitud.estadosSolicitud.length > 0) {
      const ultimoEstado = solicitud.estadosSolicitud[solicitud.estadosSolicitud.length - 1];
      if (ultimoEstado.fecha_registro_estado) {
        return new Date(ultimoEstado.fecha_registro_estado).toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
    return '';
  }

  // 📌 Obtener documentos de la solicitud seleccionada (igual que homologación)
  get documentosDelEstudiante(): DocumentoHomologacion[] {
    if (!this.selectedSolicitud?.documentos) {
      return [];
    }

    return this.selectedSolicitud.documentos;
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
          this.cargarSolicitudesPendientes();
        },
        error: (error) => {
          console.error('Error al añadir comentario:', error);
          this.snackBar.open('Error al añadir comentario', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }



  // 📌 Aprobar toda la solicitud
  // IGUAL QUE HOMOLOGACIÓN: Usar approveAsCoordinador() que envía 'APROBADA_COORDINADOR'
  aprobarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    this.pazSalvoService.approveAsCoordinador(this.selectedSolicitud.id_solicitud).subscribe({
      next: () => {
        this.snackBar.open('Solicitud aprobada definitivamente', 'Cerrar', { duration: 3000 });
        this.cargarSolicitudesPendientes();
        this.cargarSolicitudesProcesadas();
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
            this.cargarSolicitudesPendientes();
            this.cargarSolicitudesProcesadas();
            this.selectedSolicitud = undefined;
            this.requestStatusTable?.resetSelection();
          },
          error: () => this.snackBar.open('Error al rechazar solicitud', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }

}
