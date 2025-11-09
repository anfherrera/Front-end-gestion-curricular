import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DocumentosDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
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
    console.log('🔍 DocumentationViewerComponent ngOnInit() - Inicializando componente');
    console.log('📊 Documentos recibidos:', this.documentos);
    console.log('⚙️ Proceso:', this.proceso);
    console.log('🔧 Servicio disponible:', !!this.servicio);
    console.log('📝 Puede agregar comentarios:', this.puedeAgregarComentarios);
    
    // Agregar columna de comentarios si hay documentos con comentarios
    if (this.documentos.some(doc => !!(doc.comentario && doc.comentario.trim().length > 0))) {
      this.displayedColumns = ['nombre', 'fecha', 'comentarios', 'acciones'];
      console.log('✅ Columna de comentarios agregada');
    } else {
      console.log('ℹ️ Sin comentarios, columnas estándar');
    }
    
    console.log('📋 Columnas a mostrar:', this.displayedColumns);
    
    // 🔧 PRUEBA: Verificar que los métodos estén disponibles
    console.log('🔧 PRUEBA - verDocumento disponible:', typeof this.verDocumento);
    console.log('🔧 PRUEBA - agregarComentario disponible:', typeof this.agregarComentario);
    console.log('🔧 PRUEBA - verComentariosDocumento disponible:', typeof this.verComentariosDocumento);
  }

  /**
   * ✅ CORREGIDO: Ver documento usando endpoint genérico (igual que homologación)
   */
  verDocumento(documento: DocumentosDTORespuesta | DocumentoHomologacion): void {
    console.log('🔍 verDocumento() llamado con:', documento);
    console.log('🔍 verDocumento() - Evento de clic detectado correctamente');
    
    if (!documento.nombre) {
      console.error('❌ No hay nombre de archivo disponible');
      this.snackBar.open('No hay nombre de archivo disponible para el documento', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('📁 Descargando documento usando endpoint específico de Paz y Salvo:', documento.nombre);
    
    // Mostrar mensaje de carga
    this.snackBar.open('Descargando documento...', 'Cerrar', { duration: 2000 });

    // ✅ CORREGIDO: Usar el servicio con endpoint específico de Paz y Salvo
    if (this.servicio && this.servicio.descargarArchivo) {
      this.servicio.descargarArchivo(documento.nombre).subscribe({
        next: (blob: Blob) => {
          console.log('✅ Documento descargado exitosamente:', documento.nombre);
          this.mostrarDocumentoEnVentana(blob, documento.nombre);
        },
        error: (error: any) => {
          console.error('❌ Error al descargar documento:', error);
          this.snackBar.open('Error al descargar documento: ' + (error.error?.message || error.message || 'Error desconocido'), 'Cerrar', { duration: 5000 });
        }
      });
    } else {
      console.error('❌ Servicio no disponible o método descargarArchivo no existe');
      this.snackBar.open('Error: Servicio no disponible', 'Cerrar', { duration: 3000 });
    }
  }


  /**
   * Mostrar documento en nueva ventana (método común)
   */
  private mostrarDocumentoEnVentana(blob: Blob, nombreDocumento: string): void {
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
            <title>${nombreDocumento}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              .header { margin-bottom: 20px; }
              .filename { font-size: 18px; font-weight: bold; color: #333; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="filename">${nombreDocumento}</div>
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
  }

  /**
   * Ver comentarios del documento
   */
  verComentariosDocumento(documento: DocumentosDTORespuesta | DocumentoHomologacion): void {
    console.log('🔍 verComentariosDocumento() llamado con:', documento);
    
    if (!documento.comentario || documento.comentario.trim().length === 0) {
      console.log('❌ Documento sin comentarios');
      this.snackBar.open('Este documento no tiene comentarios', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('💬 Mostrando comentarios:', documento.comentario);
    
    // ✅ CORREGIDO: Mostrar comentarios en un diálogo
    const comentario = documento.comentario.trim();

    this.dialog.open(ComentarioDialogComponent, {
      width: '520px',
      data: <ComentarioDialogData>{
        titulo: 'Comentario registrado',
        descripcion: 'Este es el comentario asociado al documento seleccionado.',
        placeholder: '',
        nombreDocumento: documento.nombre,
        comentarioInicial: comentario,
        soloLectura: true
      }
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
   * ✅ CORREGIDO: Agregar comentario usando endpoint genérico (igual que homologación)
   */
  agregarComentario(documento: DocumentosDTORespuesta | DocumentoHomologacion): void {
    console.log('🔍 agregarComentario() llamado con:', documento);
    console.log('🔍 agregarComentario() - Evento de clic detectado correctamente');
    
    if (!documento.id_documento) {
      console.error('❌ No hay ID de documento disponible');
      this.snackBar.open('No hay ID de documento disponible', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('📝 ID del documento:', documento.id_documento);
    
    const dialogRef = this.dialog.open(ComentarioDialogComponent, {
      width: '520px',
      data: <ComentarioDialogData>{
        titulo: 'Agregar comentario',
        descripcion: 'Escribe las observaciones para el documento seleccionado.',
        placeholder: 'Describe tu comentario',
        nombreDocumento: documento.nombre,
        textoConfirmacion: 'Guardar comentario'
      }
    });

    dialogRef.afterClosed().subscribe((comentario: string | undefined) => {
      if (comentario === undefined) {
        console.log('❌ Usuario canceló el comentario');
        return;
      }

      if (!comentario.trim()) {
        this.snackBar.open('El comentario no puede estar vacío', 'Cerrar', { duration: 3000 });
        return;
      }

      console.log('💬 Comentario a agregar usando endpoint genérico:', comentario.trim());

      // Mostrar mensaje de carga
      this.snackBar.open('Agregando comentario...', 'Cerrar', { duration: 2000 });

      // ✅ CORREGIDO: Usar el servicio con endpoint genérico
      if (this.servicio && this.servicio.agregarComentario) {
        this.servicio.agregarComentario(documento.id_documento, comentario.trim()).subscribe({
          next: (result: any) => {
            console.log('✅ Comentario agregado exitosamente:', result);
            this.snackBar.open('Comentario agregado exitosamente', 'Cerrar', { duration: 3000 });
            // Emitir evento para que el componente padre actualice la vista
            this.comentarioAgregado.emit({
              documento: documento,
              comentario: comentario.trim()
            });
          },
          error: (error: any) => {
            console.error('❌ Error al agregar comentario:', error);
            this.snackBar.open('Error al agregar comentario: ' + (error.error?.message || error.message || 'Error desconocido'), 'Cerrar', { duration: 5000 });
          }
        });
      } else {
        console.error('❌ Servicio no disponible o método agregarComentario no existe');
        this.snackBar.open('Error: Servicio no disponible', 'Cerrar', { duration: 3000 });
      }
    });
  }

}
