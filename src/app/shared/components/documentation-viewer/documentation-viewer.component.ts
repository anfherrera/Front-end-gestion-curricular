import { Component, DestroyRef, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { DocumentosDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
import { FechaPipe } from '../../pipes/fecha.pipe';
import { TextoDialogComponent, TextoDialogData } from '../texto-dialog/texto-dialog.component';
import { SnackbarService } from '../../../core/services/snackbar.service';

type Documento = DocumentosDTORespuesta | DocumentoHomologacion;

/** Lo que el visor usa del servicio de cada proceso para descargar documentos y leer comentarios. */
export interface ServicioDocumentos {
  descargarArchivo?(nombreArchivo: string): Observable<Blob>;
  descargarArchivoPorId?(idDocumento: number): Observable<Blob>;
  descargarArchivoPorRuta?(rutaDocumento: string): Observable<Blob>;
  buscarDocumentoPorId?(idDocumento: number): Observable<{ comentario?: string | null }>;
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
    MatDialogModule,
    FechaPipe
  ],
  templateUrl: './documentation-viewer.component.html',
  styleUrls: ['./documentation-viewer.component.css']
})
export class DocumentationViewerComponent implements OnInit {
  @Input() documentos: Documento[] = [];
  @Input() solicitudId?: number;
  @Input() proceso: 'homologacion' | 'reingreso' | 'paz-salvo' | 'ecaes' = 'homologacion';
  @Input() servicio?: ServicioDocumentos;
  @Input() puedeAgregarComentarios: boolean = false; // Controla si se muestra el botón de agregar comentarios

  @Output() verComentarios = new EventEmitter<DocumentosDTORespuesta>();
  @Output() comentarioAgregado = new EventEmitter<{ documento: Documento; comentario: string }>();

  private destroyRef = inject(DestroyRef);

  displayedColumns: string[] = ['nombre', 'fecha', 'acciones'];

  constructor(
    private snackbar: SnackbarService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Inicializando componente
    
    // Agregar columna de comentarios si hay documentos con comentarios
    if (this.documentos.some(doc => !!(doc.comentario && doc.comentario.trim().length > 0))) {
      this.displayedColumns = ['nombre', 'fecha', 'comentarios', 'acciones'];
      // Columna de comentarios agregada
    } else {
      // Sin comentarios, columnas estándar
    }
    
    // Columnas a mostrar
  }

  /**
   * Ver documento usando endpoint genérico
   * Ahora intenta usar ID del documento primero, luego ruta, y finalmente nombre como fallback
   */
  verDocumento(documento: Documento): void {
    // verDocumento() llamado
    
    // Mostrar mensaje de carga
    this.snackbar.info('Descargando documento...');

    if (!this.servicio) {
      this.snackbar.error('Error: Servicio no disponible');
      return;
    }

    // PRIORIDAD 1: Intentar descargar por ID del documento (más confiable)
    const docHomologacion = documento as DocumentoHomologacion;
    if (docHomologacion.id_documento && this.servicio.descargarArchivoPorId) {
      // Intentando descargar por ID del documento
      this.servicio.descargarArchivoPorId(docHomologacion.id_documento).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (blob: Blob) => {
          // Documento descargado exitosamente por ID
          this.mostrarDocumentoEnVentana(blob, documento.nombre || 'documento.pdf');
        },
        error: () => {
          // Intentar por ruta como fallback
          this.intentarDescargaPorRuta(documento);
        }
      });
      return;
    }

    // PRIORIDAD 2: Intentar descargar por ruta del documento
    if (docHomologacion.ruta_documento && this.servicio.descargarArchivoPorRuta) {
      // Intentando descargar por ruta del documento
      this.servicio.descargarArchivoPorRuta(docHomologacion.ruta_documento).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (blob: Blob) => {
          // Documento descargado exitosamente por ruta
          this.mostrarDocumentoEnVentana(blob, documento.nombre || 'documento.pdf');
        },
        error: () => {
          // Intentar por nombre como último recurso
          this.intentarDescargaPorNombre(documento);
        }
      });
      return;
    }

    // PRIORIDAD 3: Intentar descargar por nombre (fallback)
    this.intentarDescargaPorNombre(documento);
  }

  /**
   * Método helper para intentar descarga por ruta.
   */
  private intentarDescargaPorRuta(documento: Documento): void {
    const docHomologacion = documento as DocumentoHomologacion;
    if (!docHomologacion.ruta_documento || !this.servicio?.descargarArchivoPorRuta) {
      this.intentarDescargaPorNombre(documento);
      return;
    }

    this.servicio.descargarArchivoPorRuta(docHomologacion.ruta_documento).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob: Blob) => {
        // Documento descargado exitosamente por ruta
        this.mostrarDocumentoEnVentana(blob, documento.nombre || 'documento.pdf');
      },
      error: () => {
        this.intentarDescargaPorNombre(documento);
      }
    });
  }

  /**
   * Método helper para intentar descarga por nombre (último recurso).
   */
  private intentarDescargaPorNombre(documento: Documento): void {
    if (!documento.nombre) {
      this.snackbar.error('No hay información suficiente para descargar el documento');
      return;
    }

    if (!this.servicio?.descargarArchivo) {
      this.snackbar.error('Error: Método de descarga no disponible');
      return;
    }

    // Intentando descargar por nombre del archivo
    this.servicio.descargarArchivo(documento.nombre).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob: Blob) => {
        // Documento descargado exitosamente por nombre
        this.mostrarDocumentoEnVentana(blob, documento.nombre);
      },
      error: (error: HttpErrorResponse) => {
        const errorMessage = error.status === 404 
          ? 'El archivo no se encontró en el servidor. Verifique que el documento existe.'
          : (error.error?.message || error.message || 'Error desconocido');
        this.snackbar.error('Error al descargar documento: ' + errorMessage);
      }
    });
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

    this.snackbar.exito('Documento abierto correctamente');
  }

  /**
   * Ver comentarios del documento
   */
  verComentariosDocumento(documento: Documento): void {
    // verComentariosDocumento() llamado
    
    if (!documento.comentario || documento.comentario.trim().length === 0) {
      // Documento sin comentarios
      this.snackbar.info('Este documento no tiene comentarios');
      return;
    }

    // Mostrando comentarios
    
    // Mostrar comentarios en un diálogo
    const comentario = documento.comentario.trim();

    this.dialog.open(TextoDialogComponent, {
      width: '520px',
      data: <TextoDialogData>{
        titulo: 'Comentario registrado',
        descripcion: 'Este es el comentario asociado al documento seleccionado.',
        etiqueta: 'Comentario',
        nombreDocumento: documento.nombre,
        valorInicial: comentario,
        soloLectura: true,
        icono: 'comment'
      }
    });
  }

  /**
   * Verificar si el documento tiene comentarios
   */
  tieneComentarios(documento: Documento): boolean {
    return !!(documento.comentario && documento.comentario.trim().length > 0);
  }

  /**
   * Obtener el número de comentarios
   */
  getNumeroComentarios(documento: Documento): number {
    return (documento.comentario && documento.comentario.trim().length > 0) ? 1 : 0;
  }

  /**
   * Agregar comentario usando endpoint genérico.
   * Carga el documento actual (GET buscarPorId) para mostrar comentarios previos; al guardar envía solo el texto nuevo.
   */
  agregarComentario(documento: Documento): void {
    if (!documento.id_documento) {
      this.snackbar.error('No hay ID de documento disponible');
      return;
    }

    const abrirDialogConHistorial = (comentarioActual: string) => {
      const dialogRef = this.dialog.open(TextoDialogComponent, {
        width: '520px',
        data: <TextoDialogData>{
          titulo: 'Agregar comentario',
          descripcion: 'Escribe las observaciones para el documento seleccionado. Los comentarios anteriores se muestran arriba.',
          etiqueta: 'Comentario',
          nombreDocumento: documento.nombre,
          historial: comentarioActual || undefined,
          textoConfirmar: 'Guardar comentario',
          icono: 'add_comment',
          maxLength: 500
        }
      });

      dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((comentarioNuevo: string | undefined) => {
        if (comentarioNuevo === undefined) return;
        if (!comentarioNuevo.trim()) {
          this.snackbar.advertencia('El comentario no puede estar vacío');
          return;
        }
        // Solo emitir: el componente padre hace la llamada PUT (una sola vez). Si el viewer también llamara aquí, se duplicaría el comentario en backend.
        this.comentarioAgregado.emit({ documento, comentario: comentarioNuevo.trim() });
      });
    };

    // Obtener documento actualizado para mostrar comentarios existentes (el backend concatena; solo enviamos lo nuevo)
    if (this.servicio?.buscarDocumentoPorId) {
      this.snackbar.info('Cargando comentarios...');
      this.servicio.buscarDocumentoPorId(documento.id_documento).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (doc) => abrirDialogConHistorial(doc.comentario ?? ''),
        error: () => abrirDialogConHistorial(documento.comentario ?? '')
      });
    } else {
      abrirDialogConHistorial(documento.comentario ?? '');
    }
  }

}
