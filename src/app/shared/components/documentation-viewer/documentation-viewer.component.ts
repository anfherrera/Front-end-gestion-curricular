import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DocumentosDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
import { ComentariosDialogComponent } from '../comentarios-dialog/comentarios-dialog.component';
import { ComentarioDialogComponent, ComentarioDialogData } from '../comentario-dialog/comentario-dialog.component';

// Interfaz genérica para documentos
interface DocumentoGenerico {
  id_documento: number;
  nombre: string;
  ruta_documento: string;
  fecha_documento?: Date | string;
  fechaSubida?: Date | string;
  esValido: boolean;
  comentario?: string;
}

@Component({
  selector: 'app-documentation-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    ComentariosDialogComponent,
    ComentarioDialogComponent
  ],
  templateUrl: './documentation-viewer.component.html',
  styleUrls: ['./documentation-viewer.component.css']
})
export class DocumentationViewerComponent implements OnInit {
  @Input() documentos: (DocumentosDTORespuesta | DocumentoHomologacion)[] = [];
  @Input() solicitudId?: number;
  @Input() proceso: 'homologacion' | 'reingreso' | 'paz-salvo' | 'ecaes' = 'homologacion';
  @Input() servicio: any; // Servicio específico para descargar archivos
  @Input() puedeAgregarComentarios: boolean = false; // Controla si se muestra el botón de agregar comentarios

  @Output() verComentarios = new EventEmitter<DocumentosDTORespuesta>();
  @Output() comentarioAgregado = new EventEmitter<{documento: any, comentario: string}>();

  displayedColumns: string[] = ['nombre', 'fecha', 'acciones'];

  constructor(
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Agregar columna de comentarios si hay documentos con comentarios
    if (this.documentos.some(doc => !!(doc.comentario && doc.comentario.trim().length > 0))) {
      this.displayedColumns = ['nombre', 'fecha', 'comentarios', 'acciones'];
    }
  }

  /**
   * Ver documento en nueva ventana
   */
  verDocumento(documento: DocumentosDTORespuesta | DocumentoHomologacion): void {
    if (!documento.nombre) {
      this.snackBar.open('No hay nombre de archivo disponible para el documento', 'Cerrar', { duration: 3000 });
      return;
    }

    // Mostrar mensaje de carga
    this.snackBar.open('Descargando documento...', 'Cerrar', { duration: 2000 });

    this.servicio.descargarArchivo(documento.nombre).subscribe({
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
      error: (error: any) => {
        console.error('Error al descargar documento:', error);
        this.snackBar.open('Error al abrir el documento', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Ver comentarios del documento
   */
  verComentariosDocumento(documento: DocumentosDTORespuesta | DocumentoHomologacion): void {
    if (!documento.comentario || documento.comentario.trim().length === 0) {
      this.snackBar.open('Este documento no tiene comentarios', 'Cerrar', { duration: 3000 });
      return;
    }

    // Abrir diálogo de comentarios
    const dialogRef = this.dialog.open(ComentariosDialogComponent, {
      width: '600px',
      data: {
        titulo: `Comentarios - ${documento.nombre}`,
        documentos: [documento],
        comentarioRechazo: null
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Diálogo de comentarios cerrado');
    });
  }

  /**
   * Verificar si el documento tiene comentarios
   */
  tieneComentarios(documento: DocumentosDTORespuesta | DocumentoHomologacion): boolean {
    return !!(documento.comentario && documento.comentario.trim().length > 0);
  }

  /**
   * Obtener el número de comentarios
   */
  getNumeroComentarios(documento: DocumentosDTORespuesta | DocumentoHomologacion): number {
    return (documento.comentario && documento.comentario.trim().length > 0) ? 1 : 0;
  }

  /**
   * Formatear fecha para mostrar
   */
  formatearFecha(fecha: string | Date | undefined): string {
    if (!fecha) return '';

    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return fechaObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Agregar comentario a un documento
   */
  agregarComentario(documento: DocumentosDTORespuesta | DocumentoHomologacion): void {
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
        // Emitir evento para que el componente padre maneje la lógica
        this.comentarioAgregado.emit({
          documento: documento,
          comentario: comentario
        });
      }
    });
  }
}
