import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ReingresoEstudianteService } from '../../../core/services/reingreso-estudiante.service';
import { DocumentGeneratorService } from '../../../core/services/document-generator.service';
import { SolicitudReingresoDTORespuesta, DocumentosDTORespuesta } from '../../../core/models/procesos.model';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { RechazoDialogComponent, RechazoDialogData } from '../../../shared/components/rechazo-dialog/rechazo-dialog.component';
import { ComentarioDialogComponent, ComentarioDialogData } from '../../../shared/components/comentario-dialog/comentario-dialog.component';
import { DocumentGeneratorComponent, DocumentRequest, DocumentTemplate } from '../../../shared/components/document-generator/document-generator.component';
import { DocumentationViewerComponent } from '../../../shared/components/documentation-viewer/documentation-viewer.component';
import { ApprovedRequestsSectionComponent } from '../../../shared/components/approved-requests-section/approved-requests-section.component';
import { EstadosSolicitud, ESTADOS_SOLICITUD_LABELS, ESTADOS_SOLICITUD_COLORS } from '../../../core/enums/estados-solicitud.enum';
import { LoggerService } from '../../../core/services/logger.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { snackbarConfig } from '../../../core/design-system/design-tokens';

@Component({
  selector: 'app-reingreso-estudiante',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCardModule,
    MatProgressBarModule,
    CardContainerComponent,
    RequestStatusTableComponent,
    DocumentGeneratorComponent,
    DocumentationViewerComponent,
    ApprovedRequestsSectionComponent
  ],
  templateUrl: './reingreso-estudiante.component.html',
  styleUrls: ['./reingreso-estudiante.component.css']
})
export class ReingresoEstudianteComponent implements OnInit, OnDestroy {
  @ViewChild('requestStatusTable') requestStatusTable!: RequestStatusTableComponent;

  solicitudes: any[] = []; // Transformado para RequestStatusTableComponent
  solicitudesAprobadas: any[] = [];
  selectedSolicitud?: SolicitudReingresoDTORespuesta;
  template!: DocumentTemplate;
  loading: boolean = false;
  cargandoSolicitudesAprobadas: boolean = false;

  // Nuevas propiedades para el flujo de PDF
  documentoGenerado: boolean = false;
  archivoPDF: File | null = null;
  subiendoPDF: boolean = false;
  enviandoPDF: boolean = false;

  // Nueva propiedad para controlar la habilitación del generador de documentos
  documentoHabilitado: boolean = false;

  // Enums para estados
  EstadosSolicitud = EstadosSolicitud;
  ESTADOS_SOLICITUD_LABELS = ESTADOS_SOLICITUD_LABELS;
  ESTADOS_SOLICITUD_COLORS = ESTADOS_SOLICITUD_COLORS;

  private destroy$ = new Subject<void>();

  constructor(
    public reingresoService: ReingresoEstudianteService,
    private documentGeneratorService: DocumentGeneratorService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private logger: LoggerService,
    private errorHandler: ErrorHandlerService
  ) {
    // Inicializar plantilla para reingreso
    this.template = {
      id: 'RESOLUCION_REINGRESO',
      nombre: 'Resolución de Reingreso',
      descripcion: 'Genera una resolución oficial para el proceso de reingreso del estudiante',
      camposRequeridos: [
        'nombreEstudiante',
        'codigoEstudiante',
        'programa',
        'fechaSolicitud',
        'motivoReingreso'
      ],
      camposOpcionales: [
        'observaciones'
      ]
    };
  }

  ngOnInit(): void {
    this.cargarSolicitudes();
    this.cargarSolicitudesAprobadas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarSolicitudes(): void {
    this.reingresoService.getSecretariaRequests().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
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
        // No seleccionar ninguna solicitud por defecto
      },
      error: (err) => {
        this.logger.error('Error al cargar solicitudes:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al cargar solicitudes', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  getEstadoActual(solicitud: SolicitudReingresoDTORespuesta): string {
    if (solicitud.estadosSolicitud && solicitud.estadosSolicitud.length > 0) {
      const ultimoEstado = solicitud.estadosSolicitud[solicitud.estadosSolicitud.length - 1];
      return ultimoEstado.estado_actual;
    }
    return 'Pendiente';
  }

  cargarSolicitudesAprobadas(): void {
    this.cargandoSolicitudesAprobadas = true;

    this.reingresoService.getSecretariaApprovedRequests().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (solicitudes) => {
        this.solicitudesAprobadas = solicitudes.map((solicitud) => ({
          id: solicitud.id_solicitud,
          nombre: solicitud.nombre_solicitud,
          fecha: new Date(solicitud.fecha_registro_solicitud).toLocaleDateString(),
          estado: this.getEstadoActual(solicitud),
          rutaArchivo: '',
          comentarios: solicitud.estadosSolicitud?.slice(-1)[0]?.comentario ?? ''
        }));

        this.cargandoSolicitudesAprobadas = false;
      },
      error: (err) => {
        this.logger.error('Error al cargar solicitudes de reingreso aprobadas:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al cargar las solicitudes aprobadas', 'Cerrar', snackbarConfig(['error-snackbar']));
        this.cargandoSolicitudesAprobadas = false;
      }
    });
  }

  onSolicitudSeleccionada(solicitudId: number | null): void {
    if (solicitudId === null) {
      this.selectedSolicitud = undefined;
      // Limpiar estado cuando se deselecciona
      this.limpiarEstado();
      return;
    }

    // Limpiar estado anterior antes de seleccionar nueva solicitud
    this.limpiarEstado();

    // Buscar la solicitud original por ID
    this.reingresoService.getSecretariaRequests().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (sols) => {
        this.selectedSolicitud = sols.find(sol => sol.id_solicitud === solicitudId);
        // Solicitud seleccionada
        // Estado limpiado para nueva solicitud
      },
      error: (err) => {
        this.logger.error('Error al cargar solicitud seleccionada:', err);
      }
    });
  }

  /**
   * Maneja el clic en "Tengo un documento"
   */
  onTengoDocumento(): void {
    this.documentoHabilitado = true;
    this.snackBar.open('Sección de carga de PDF habilitada. Ahora puedes subir tu documento.', 'Cerrar', snackbarConfig(['success-snackbar']));
  }

  /**
   * Generar documento usando el componente genérico
   */
  onGenerarDocumento(request: DocumentRequest): void {
    if (!this.selectedSolicitud) return;

    this.loading = true;
    // Generando documento

    this.documentGeneratorService.generarDocumento(request).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob) => {
        // Documento generado exitosamente

        // Generar nombre de archivo
        const nombreArchivo = `${request.tipoDocumento}_${this.selectedSolicitud!.objUsuario.nombre_completo}_${new Date().getFullYear()}.docx`;

        // Descargar archivo Word
        this.documentGeneratorService.descargarArchivo(blob, nombreArchivo);

        // Marcar que el documento fue generado (SIN cambiar el estado aún)
        this.documentoGenerado = true;

        this.snackBar.open('Documento Word generado y descargado. Ahora sube el PDF para enviar al estudiante.', 'Cerrar', snackbarConfig(['success-snackbar']));
        this.loading = false;

        // Documento generado, estado de solicitud NO cambiado aún
      },
      error: (err: any) => {
        this.logger.error('Error al generar documento:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al generar documento', 'Cerrar', snackbarConfig(['error-snackbar']));
        this.loading = false;
      }
    });
  }

  /**
   * Cancelar generación de documento
   */
  onCancelarGeneracion(): void {
    this.limpiarEstado();
    this.selectedSolicitud = undefined;
    // Generación de documento cancelada
  }

  /**
   * Manejar selección de archivo PDF
   */
  onArchivoSeleccionado(event: any): void {
    const archivo = event.target.files[0];
    if (archivo && archivo.type === 'application/pdf') {
      this.archivoPDF = archivo;
      this.snackBar.open(`Archivo PDF seleccionado: ${archivo.name}`, 'Cerrar', snackbarConfig());
    } else {
      this.snackBar.open('Por favor selecciona un archivo PDF válido', 'Cerrar', snackbarConfig(['warning-snackbar']));
    }
  }

  /**
   * Subir archivo PDF al servidor
   */
  subirPDF(): void {
    if (!this.archivoPDF || !this.selectedSolicitud) {
      this.snackBar.open('Por favor selecciona un archivo PDF', 'Cerrar', snackbarConfig(['warning-snackbar']));
      return;
    }

    this.subiendoPDF = true;
    this.logger.log('📤 Subiendo archivo PDF:', this.archivoPDF.name);
    this.logger.debug('🔍 selectedSolicitud:', this.selectedSolicitud);
    this.logger.debug('🔍 id_solicitud a enviar:', this.selectedSolicitud.id_solicitud);

    this.logger.debug('📝 Nombre original del archivo:', this.archivoPDF.name);

    // Usar el servicio para subir el PDF con idSolicitud (SIN modificar el nombre)
    this.reingresoService.subirArchivoPDF(this.archivoPDF, this.selectedSolicitud.id_solicitud).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.logger.log('Archivo PDF subido exitosamente:', response);
        this.snackBar.open('Archivo PDF subido exitosamente. Ahora puedes enviarlo al estudiante.', 'Cerrar', snackbarConfig(['success-snackbar']));
        this.subiendoPDF = false;
      },
      error: (err) => {
        this.logger.error('Error al subir archivo PDF:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al subir archivo PDF', 'Cerrar', snackbarConfig(['error-snackbar']));
        this.subiendoPDF = false;
      }
    });
  }

  /**
   * Enviar PDF al estudiante
   */
  enviarPDFAlEstudiante(): void {
    if (!this.archivoPDF || !this.selectedSolicitud) {
      this.snackBar.open('Por favor sube un archivo PDF primero', 'Cerrar', snackbarConfig(['warning-snackbar']));
      return;
    }

    this.enviandoPDF = true;
    this.logger.log('Enviando PDF al estudiante:', this.selectedSolicitud.id_solicitud);

    // Actualizar estado de la solicitud a APROBADA cuando se envía el PDF
    this.reingresoService.approveDefinitively(this.selectedSolicitud.id_solicitud).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.logger.log('Estado de solicitud actualizado a APROBADA');
        this.logger.log('PDF enviado al estudiante exitosamente');
        this.snackBar.open('PDF enviado al estudiante y solicitud aprobada exitosamente', 'Cerrar', snackbarConfig(['success-snackbar']));
        this.enviandoPDF = false;

        // Limpiar el estado
        this.documentoGenerado = false;
        this.archivoPDF = null;
        this.selectedSolicitud = undefined;

        // Recargar solicitudes para mostrar el cambio de estado
        this.cargarSolicitudes();
      },
      error: (err: any) => {
        this.logger.error('Error al actualizar estado de solicitud:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al enviar PDF al estudiante', 'Cerrar', snackbarConfig(['error-snackbar']));
        this.enviandoPDF = false;
      }
    });
  }

  /**
   * Enviar documento (unifica subir PDF y enviar al estudiante)
   */
  enviarDocumento(): void {
    if (!this.archivoPDF || !this.selectedSolicitud) {
      this.snackBar.open('Por favor selecciona un archivo PDF', 'Cerrar', snackbarConfig(['warning-snackbar']));
      return;
    }

    // Paso 1: Subir PDF
    this.subiendoPDF = true;
    this.logger.log('📤 Subiendo archivo PDF:', this.archivoPDF.name);
    this.logger.debug('🔍 selectedSolicitud:', this.selectedSolicitud);
    this.logger.debug('🔍 id_solicitud a enviar:', this.selectedSolicitud.id_solicitud);

    this.logger.debug('📝 Nombre original del archivo:', this.archivoPDF.name);

    // Usar el servicio para subir el PDF con idSolicitud (SIN modificar el nombre)
    this.reingresoService.subirArchivoPDF(this.archivoPDF, this.selectedSolicitud.id_solicitud).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.logger.log('Archivo PDF subido exitosamente:', response);
        this.subiendoPDF = false;

        // Paso 2: Enviar al estudiante (cambiar estado)
        this.enviandoPDF = true;
        this.logger.log('Enviando PDF al estudiante:', this.selectedSolicitud?.id_solicitud);

        if (!this.selectedSolicitud) {
          this.logger.error('selectedSolicitud es undefined');
          this.snackBar.open('Error: Solicitud no encontrada', 'Cerrar', snackbarConfig(['error-snackbar']));
          this.enviandoPDF = false;
          return;
        }

        // Actualizar estado de la solicitud a APROBADA cuando se envía el PDF
        this.reingresoService.approveDefinitively(this.selectedSolicitud.id_solicitud).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.logger.log('Estado de solicitud actualizado a APROBADA');
            this.logger.log('PDF enviado al estudiante exitosamente');
            this.snackBar.open('Documento enviado al estudiante y solicitud aprobada exitosamente', 'Cerrar', snackbarConfig(['success-snackbar']));
            this.enviandoPDF = false;

            // Limpiar el estado
            this.documentoGenerado = false;
            this.archivoPDF = null;
            this.selectedSolicitud = undefined;

            // Recargar solicitudes para mostrar el cambio de estado
            this.cargarSolicitudes();
          },
          error: (err: any) => {
            this.logger.error('Error al actualizar estado de solicitud:', err);
            const mensaje = this.errorHandler.extraerMensajeError(err);
            this.snackBar.open(mensaje || 'PDF subido pero error al enviar al estudiante', 'Cerrar', snackbarConfig(['error-snackbar']));
            this.enviandoPDF = false;
          }
        });
      },
      error: (err) => {
        this.logger.error('Error al subir archivo PDF:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al subir archivo PDF', 'Cerrar', snackbarConfig(['error-snackbar']));
        this.subiendoPDF = false;
      }
    });
  }

  /**
   * Verificar si se puede enviar el PDF
   */
  puedeEnviarPDF(): boolean {
    return this.documentoGenerado && this.archivoPDF !== null && !this.subiendoPDF && !this.enviandoPDF;
  }

  get documentosDelEstudiante(): DocumentosDTORespuesta[] {
    return this.selectedSolicitud?.documentos ?? [];
  }

  seleccionarSolicitud(solicitud: SolicitudReingresoDTORespuesta): void {
    this.selectedSolicitud = solicitud;
  }

  getEstadoColor(estado: string): string {
    return this.ESTADOS_SOLICITUD_COLORS[estado as EstadosSolicitud] || 'primary';
  }

  getEstadoLabel(estado: string): string {
    return this.ESTADOS_SOLICITUD_LABELS[estado as EstadosSolicitud] || estado;
  }

  verDocumento(documento: DocumentosDTORespuesta): void {
    // Mostrar mensaje de carga
    this.snackBar.open('Descargando documento...', 'Cerrar', snackbarConfig());

    // Intentar descargar por ID del documento (más confiable)
    if (documento.id_documento && this.reingresoService.descargarArchivoPorId) {
      this.logger.log('Intentando descargar por ID del documento:', documento.id_documento);
      this.reingresoService.descargarArchivoPorId(documento.id_documento).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (blob: Blob) => {
          this.logger.log('Documento descargado exitosamente por ID:', documento.id_documento);
          this.mostrarDocumentoEnVentana(blob, documento.nombre || 'documento.pdf');
        },
        error: (error: any) => {
          this.logger.warn('Error al descargar por ID, intentando por ruta...', error);
          // Intentar por ruta como fallback
          this.intentarDescargaPorRuta(documento);
        }
      });
      return;
    }

    // Intentar descargar por ruta del documento
    if (documento.ruta_documento && this.reingresoService.descargarArchivoPorRuta) {
      this.logger.log('Intentando descargar por ruta del documento:', documento.ruta_documento);
      this.reingresoService.descargarArchivoPorRuta(documento.ruta_documento).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (blob: Blob) => {
          this.logger.log('Documento descargado exitosamente por ruta:', documento.ruta_documento);
          this.mostrarDocumentoEnVentana(blob, documento.nombre || 'documento.pdf');
        },
        error: (error: any) => {
          this.logger.warn('Error al descargar por ruta, intentando por nombre...', error);
          // Intentar por nombre como último recurso
          this.intentarDescargaPorNombre(documento);
        }
      });
      return;
    }

    // Intentar descargar por nombre (fallback)
    this.intentarDescargaPorNombre(documento);
  }

  /**
   * Método helper para intentar descarga por ruta
   */
  private intentarDescargaPorRuta(documento: DocumentosDTORespuesta): void {
    if (!documento.ruta_documento || !this.reingresoService.descargarArchivoPorRuta) {
      this.intentarDescargaPorNombre(documento);
      return;
    }

    this.reingresoService.descargarArchivoPorRuta(documento.ruta_documento).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob: Blob) => {
        this.logger.log('Documento descargado exitosamente por ruta:', documento.ruta_documento);
        this.mostrarDocumentoEnVentana(blob, documento.nombre || 'documento.pdf');
      },
      error: (error: any) => {
        this.logger.error('Error al descargar por ruta:', error);
        this.intentarDescargaPorNombre(documento);
      }
    });
  }

  /**
   * Método helper para intentar descarga por nombre (último recurso)
   */
  private intentarDescargaPorNombre(documento: DocumentosDTORespuesta): void {
    if (!documento.nombre) {
      this.logger.error('No hay nombre de archivo disponible');
      this.snackBar.open('No hay información suficiente para descargar el documento', 'Cerrar', snackbarConfig(['error-snackbar']));
      return;
    }

    this.logger.log('Intentando descargar por nombre del archivo:', documento.nombre);
    this.reingresoService.descargarArchivo(documento.nombre).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob: Blob) => {
        this.logger.log('Documento descargado exitosamente por nombre:', documento.nombre);
        this.mostrarDocumentoEnVentana(blob, documento.nombre);
      },
      error: (error: any) => {
        this.logger.error('Error al descargar el documento:', error);

        let mensajeError = `Error al descargar el documento: ${documento.nombre}`;

        if (error.status === 404) {
          mensajeError = `Archivo no encontrado: ${documento.nombre}`;
        } else if (error.status === 401) {
          mensajeError = 'No autorizado para descargar el archivo';
        } else if (error.status === 500) {
          mensajeError = 'Error interno del servidor al descargar el archivo';
        }

        this.snackBar.open(mensajeError, 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  /**
   * Método helper para mostrar documento en ventana
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

    this.snackBar.open('Documento abierto correctamente', 'Cerrar', snackbarConfig(['success-snackbar']));
  }

  generarOficio(): void {
    if (!this.selectedSolicitud) return;

    const contenido = `Oficio de reingreso para ${this.selectedSolicitud.objUsuario.nombre_completo}`;

    this.reingresoService.generarOficio(this.selectedSolicitud.id_solicitud, contenido).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Oficio generado correctamente', 'Cerrar', snackbarConfig(['success-snackbar']));
        this.cargarSolicitudes();
      },
      error: (err) => {
        this.logger.error('Error al generar oficio:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al generar oficio', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  descargarOficio(idOficio: number, nombreArchivo: string): void {
    this.logger.log('📥 Descargando oficio:', idOficio);
    this.reingresoService.descargarOficio(idOficio).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = nombreArchivo || `oficio_reingreso_${this.selectedSolicitud?.objUsuario.codigo}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.snackBar.open('Oficio descargado correctamente', 'Cerrar', snackbarConfig(['success-snackbar']));
      },
      error: (err) => this.snackBar.open('Error al descargar oficio', 'Cerrar', snackbarConfig(['error-snackbar']))
    });
  }

  agregarComentario(documento: DocumentosDTORespuesta): void {
    const dialogRef = this.dialog.open(ComentarioDialogComponent, {
      width: '450px',
      data: <ComentarioDialogData>{
        titulo: 'Comentario sobre documento',
        descripcion: `Añadir comentario para el documento: ${documento.nombre}`,
        placeholder: 'Comentario sobre el documento',
        nombreDocumento: documento.nombre
      }
    });

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe((comentario: string) => {
      if (comentario !== undefined) {
        // Usar el método existente para actualizar documentos
        const documentosActualizados = [{
          id_documento: documento.id_documento,
          comentario: comentario
        }];

        this.reingresoService.actualizarEstadoDocumentos(this.selectedSolicitud!.id_solicitud, documentosActualizados).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.snackBar.open('Comentario actualizado correctamente', 'Cerrar', snackbarConfig(['success-snackbar']));
            this.cargarSolicitudes();
          },
          error: (err: any) => {
            this.snackBar.open('Error al añadir comentario', 'Cerrar', snackbarConfig(['error-snackbar']));
          }
        });
      }
    });
  }

  aprobarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    this.reingresoService.approveDefinitively(this.selectedSolicitud.id_solicitud).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Solicitud aprobada definitivamente', 'Cerrar', snackbarConfig(['success-snackbar']));
        this.cargarSolicitudes();
        this.selectedSolicitud = undefined;
        this.requestStatusTable?.resetSelection();
      },
      error: (err: any) => {
        this.logger.error('Error al aprobar solicitud:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al aprobar solicitud', 'Cerrar', snackbarConfig(['error-snackbar']));
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

    dialogRef.afterClosed().pipe(
      takeUntil(this.destroy$)
    ).subscribe((motivo: string) => {
      if (motivo) {
        this.reingresoService.rejectRequest(this.selectedSolicitud!.id_solicitud, motivo).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.snackBar.open('Solicitud rechazada', 'Cerrar', snackbarConfig(['success-snackbar']));
            this.cargarSolicitudes();
            this.selectedSolicitud = undefined;
            this.requestStatusTable?.resetSelection();
          },
          error: (err: any) => {
            this.logger.error('Error al rechazar solicitud:', err);
            const mensaje = this.errorHandler.extraerMensajeError(err);
            this.snackBar.open(mensaje || 'Error al rechazar solicitud', 'Cerrar', snackbarConfig(['error-snackbar']));
          }
        });
      }
    });
  }

  // Validar si se puede realizar una acción según el estado actual
  puedeAprobar(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = this.getEstadoActual(this.selectedSolicitud);
    this.logger.debug('🔍 Estado actual para aprobar (secretaria):', estado);
    return estado === EstadosSolicitud.APROBADA_COORDINADOR;
  }

  puedeRechazar(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = this.getEstadoActual(this.selectedSolicitud);
    this.logger.debug('🔍 Estado actual para rechazar (secretaria):', estado);
    return estado === EstadosSolicitud.APROBADA_COORDINADOR;
  }

  puedeGenerarOficio(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = this.getEstadoActual(this.selectedSolicitud);
    return estado === EstadosSolicitud.APROBADA_COORDINADOR;
  }

  puedeDescargarOficio(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = this.getEstadoActual(this.selectedSolicitud);
    return estado === EstadosSolicitud.APROBADA_COORDINADOR;
  }

  /**
   * Limpiar estado del componente
   */
  private limpiarEstado(): void {
    this.documentoGenerado = false;
    this.archivoPDF = null;
    this.subiendoPDF = false;
    this.enviandoPDF = false;
    this.documentoHabilitado = false;
    this.loading = false;
    this.logger.debug('🧹 Estado del componente limpiado');
  }
}
