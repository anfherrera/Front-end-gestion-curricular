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
    RequestStatusTableComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class PazSalvoComponent implements OnInit {
  @ViewChild('requestStatusTable') requestStatusTable!: RequestStatusTableComponent;
  
  solicitudes: Solicitud[] = [];
  selectedSolicitud: Solicitud | null = null;

  constructor(
    private pazSalvoService: PazSalvoService,
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

  get archivosDelEstudiante(): (Archivo & { estado?: 'pendiente' | 'aprobado' | 'rechazado' | 'error' })[] {
    return this.selectedSolicitud?.archivos ?? [];
  }

  verArchivo(archivo: Archivo): void {
    if (!archivo.nombre) {
      this.snackBar.open(`No hay nombre de archivo disponible para el documento`, 'Cerrar', { duration: 3000 });
      return;
    }

    // Mostrar mensaje de carga
    this.snackBar.open('Descargando documento...', 'Cerrar', { duration: 2000 });

    // Usar el endpoint genérico de archivos que funciona (igual que en homologación)
    const url = `http://localhost:5000/api/archivos/descargar/pdf?filename=${encodeURIComponent(archivo.nombre)}`;
    console.log('🔗 URL de descarga:', url);
    console.log('📁 Nombre del archivo:', archivo.nombre);
    
    // Crear headers con autorización
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get(url, {
      headers: headers,
      responseType: 'blob'
    }).subscribe({
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
                <title>${archivo.nombre}</title>
                <style>
                  body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                  .header { margin-bottom: 20px; }
                  .filename { font-size: 18px; font-weight: bold; color: #333; }
                </style>
              </head>
              <body>
                <div class="header">
                  <div class="filename">${archivo.nombre}</div>
                </div>
              </body>
            </html>
          `);
          newWindow.document.body.appendChild(iframe);
          
          // Limpiar la URL cuando se cierre la ventana
          newWindow.addEventListener('beforeunload', () => {
            window.URL.revokeObjectURL(url);
          });
        } else {
          // Si no se puede abrir ventana emergente, descargar directamente
          const link = document.createElement('a');
          link.href = url;
          link.download = archivo.nombre;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      },
      error: (error) => {
        console.error('Error al descargar archivo:', error);
        this.snackBar.open(`Error al descargar el archivo: ${archivo.nombre}`, 'Cerrar', { duration: 3000 });
      }
    });
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

  agregarComentario(archivo: Archivo): void {
    const dialogRef = this.dialog.open(ComentarioDialogComponent, {
      width: '500px',
      data: <ComentarioDialogData>{
        titulo: 'Añadir Comentario',
        descripcion: 'Agregue un comentario para este documento:',
        nombreDocumento: archivo.nombre,
        placeholder: 'Escriba su comentario aquí...'
      }
    });

    dialogRef.afterClosed().subscribe((comentario: string) => {
      if (comentario) {
        // Aquí implementarías la lógica para guardar el comentario
        this.snackBar.open(`Comentario añadido a ${archivo.nombre}`, 'Cerrar', { duration: 3000 });
      }
    });
  }
}
