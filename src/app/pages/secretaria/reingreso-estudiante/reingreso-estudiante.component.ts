import { Component, OnInit, ViewChild, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ReingresoEstudianteService } from '@core/services/reingreso-estudiante.service';
import { DocumentGeneratorService } from '@core/services/document-generator.service';
import { SolicitudReingresoDTORespuesta, DocumentosDTORespuesta } from '@core/models/procesos.model';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import { RequestStatusTableComponent } from '@shared/components/request-status/request-status.component';
import { DocumentGeneratorComponent } from '@shared/components/document-generator/document-generator.component';
import { DocumentRequest, DocumentTemplate } from '@core/models/documento.model';
import { descargarBlob } from '@core/utils/download.util';
import { DocumentationViewerComponent } from '@shared/components/documentation-viewer/documentation-viewer.component';
import { ApprovedRequestsSectionComponent } from '@shared/components/approved-requests-section/approved-requests-section.component';
import { EstadosSolicitud } from '@core/enums/estados-solicitud.enum';
import { LoggerService } from '@core/services/logger.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { estadoActual } from '@core/utils/estado-solicitud.util';
import { TextoDialogComponent, datosRechazo } from '@shared/components/texto-dialog/texto-dialog.component';
import { TextoDialogData } from '@shared/components/texto-dialog/texto-dialog.component';
import { SnackbarService } from '@core/services/snackbar.service';

@Component({
  selector: 'app-reingreso-estudiante',
  imports: [
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
  styleUrls: ['../secretaria-comun.css', './reingreso-estudiante.component.css']
})
export class ReingresoEstudianteComponent implements OnInit {
  reingresoService = inject(ReingresoEstudianteService);
  private documentGeneratorService = inject(DocumentGeneratorService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private logger = inject(LoggerService);
  private errorHandler = inject(ErrorHandlerService);

  @ViewChild('requestStatusTable') requestStatusTable!: RequestStatusTableComponent;

  solicitudes: any[] = []; // Transformado para RequestStatusTableComponent
  solicitudesAprobadas: any[] = [];
  selectedSolicitud?: SolicitudReingresoDTORespuesta;
  template!: DocumentTemplate;
  loading = false;
  cargandoSolicitudesAprobadas = false;


  documentoGenerado = false;
  archivoPDF: File | null = null;
  subiendoPDF = false;
  enviandoPDF = false;


  documentoHabilitado = false;

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
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

  cargarSolicitudes(): void {
    this.reingresoService.getSecretariaRequests().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (sols) => {
        // Transformar datos para RequestStatusTableComponent
        this.solicitudes = sols.map(sol => ({
          id: sol.id_solicitud,
          nombre: sol.nombre_solicitud,
          fecha: sol.fecha_registro_solicitud, // ISO: la tabla la formatea con el pipe fecha
          estado: estadoActual(sol),
          rutaArchivo: '',
          comentarios: ''
        }));
        // No seleccionar ninguna solicitud por defecto
      },
      error: (err) => {
        this.logger.error('Error al cargar solicitudes:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackbar.error(mensaje || 'Error al cargar solicitudes');
      }
    });
  }

  cargarSolicitudesAprobadas(): void {
    this.cargandoSolicitudesAprobadas = true;

    this.reingresoService.getSecretariaApprovedRequests().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (solicitudes) => {
        this.solicitudesAprobadas = solicitudes.map((solicitud) => ({
          id: solicitud.id_solicitud,
          nombre: solicitud.nombre_solicitud,
          fecha: solicitud.fecha_registro_solicitud, // ISO: la tabla la formatea con el pipe fecha
          estado: estadoActual(solicitud),
          rutaArchivo: '',
          comentarios: solicitud.estadosSolicitud?.slice(-1)[0]?.comentario ?? ''
        }));

        this.cargandoSolicitudesAprobadas = false;
      },
      error: (err) => {
        this.logger.error('Error al cargar solicitudes de reingreso aprobadas:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackbar.error(mensaje || 'Error al cargar las solicitudes aprobadas');
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
      takeUntilDestroyed(this.destroyRef)
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
    this.snackbar.exito('Sección de carga de PDF habilitada. Ahora puedes subir tu documento.');
  }

  /**
   * Generar documento usando el componente genérico
   */
  onGenerarDocumento(request: DocumentRequest): void {
    if (!this.selectedSolicitud) return;

    this.loading = true;
    // Generando documento

    this.documentGeneratorService.generarDocumento(request).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (blob) => {
        // Documento generado exitosamente

        // Generar nombre de archivo
        const nombreArchivo = `${request.tipoDocumento}_${this.selectedSolicitud!.objUsuario.nombre_completo}_${new Date().getFullYear()}.docx`;

        // Descargar archivo Word
        descargarBlob(blob, nombreArchivo);

        // Marcar que el documento fue generado (SIN cambiar el estado aún)
        this.documentoGenerado = true;

        this.snackbar.exito('Documento Word generado y descargado. Ahora sube el PDF para enviar al estudiante.');
        this.loading = false;

        // Documento generado, estado de solicitud NO cambiado aún
      },
      error: (err: any) => {
        this.logger.error('Error al generar documento:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackbar.error(mensaje || 'Error al generar documento');
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
      this.snackbar.info(`Archivo PDF seleccionado: ${archivo.name}`);
    } else {
      this.snackbar.advertencia('Por favor selecciona un archivo PDF válido');
    }
  }

  /**
   * Subir archivo PDF al servidor
   */
  subirPDF(): void {
    if (!this.archivoPDF || !this.selectedSolicitud) {
      this.snackbar.advertencia('Por favor selecciona un archivo PDF');
      return;
    }

    this.subiendoPDF = true;
    this.logger.log(' Subiendo archivo PDF:', this.archivoPDF.name);
    this.logger.debug(' selectedSolicitud:', this.selectedSolicitud);
    this.logger.debug(' id_solicitud a enviar:', this.selectedSolicitud.id_solicitud);

    this.logger.debug('Nombre original del archivo:', this.archivoPDF.name);

    // Usar el servicio para subir el PDF con idSolicitud (SIN modificar el nombre)
    this.reingresoService.subirArchivoPDF(this.archivoPDF, this.selectedSolicitud.id_solicitud).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.logger.log('Archivo PDF subido exitosamente:', response);
        this.snackbar.exito('Archivo PDF subido exitosamente. Ahora puedes enviarlo al estudiante.');
        this.subiendoPDF = false;
      },
      error: (err) => {
        this.logger.error('Error al subir archivo PDF:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackbar.error(mensaje || 'Error al subir archivo PDF');
        this.subiendoPDF = false;
      }
    });
  }

  /**
   * Enviar PDF al estudiante
   */
  enviarPDFAlEstudiante(): void {
    if (!this.archivoPDF || !this.selectedSolicitud) {
      this.snackbar.advertencia('Por favor sube un archivo PDF primero');
      return;
    }

    this.enviandoPDF = true;
    this.logger.log('Enviando PDF al estudiante:', this.selectedSolicitud.id_solicitud);

    // Actualizar estado de la solicitud a APROBADA cuando se envía el PDF
    this.reingresoService.approveDefinitively(this.selectedSolicitud.id_solicitud).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.logger.log('Estado de solicitud actualizado a APROBADA');
        this.logger.log('PDF enviado al estudiante exitosamente');
        this.snackbar.exito('PDF enviado al estudiante y solicitud aprobada exitosamente');
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
        this.snackbar.error(mensaje || 'Error al enviar PDF al estudiante');
        this.enviandoPDF = false;
      }
    });
  }

  /**
   * Enviar documento (unifica subir PDF y enviar al estudiante)
   */
  enviarDocumento(): void {
    if (!this.archivoPDF || !this.selectedSolicitud) {
      this.snackbar.advertencia('Por favor selecciona un archivo PDF');
      return;
    }

    // Paso 1: Subir PDF
    this.subiendoPDF = true;
    this.logger.log(' Subiendo archivo PDF:', this.archivoPDF.name);
    this.logger.debug(' selectedSolicitud:', this.selectedSolicitud);
    this.logger.debug(' id_solicitud a enviar:', this.selectedSolicitud.id_solicitud);

    this.logger.debug('Nombre original del archivo:', this.archivoPDF.name);

    // Usar el servicio para subir el PDF con idSolicitud (SIN modificar el nombre)
    this.reingresoService.subirArchivoPDF(this.archivoPDF, this.selectedSolicitud.id_solicitud).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.logger.log('Archivo PDF subido exitosamente:', response);
        this.subiendoPDF = false;

        // Paso 2: Enviar al estudiante (cambiar estado)
        this.enviandoPDF = true;
        this.logger.log('Enviando PDF al estudiante:', this.selectedSolicitud?.id_solicitud);

        if (!this.selectedSolicitud) {
          this.logger.error('selectedSolicitud es undefined');
          this.snackbar.error('Error: Solicitud no encontrada');
          this.enviandoPDF = false;
          return;
        }

        // Actualizar estado de la solicitud a APROBADA cuando se envía el PDF
        this.reingresoService.approveDefinitively(this.selectedSolicitud.id_solicitud).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => {
            this.logger.log('Estado de solicitud actualizado a APROBADA');
            this.logger.log('PDF enviado al estudiante exitosamente');
            this.snackbar.exito('Documento enviado al estudiante y solicitud aprobada exitosamente');
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
            this.snackbar.error(mensaje || 'PDF subido pero error al enviar al estudiante');
            this.enviandoPDF = false;
          }
        });
      },
      error: (err) => {
        this.logger.error('Error al subir archivo PDF:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackbar.error(mensaje || 'Error al subir archivo PDF');
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

  verDocumento(documento: DocumentosDTORespuesta): void {
    // Mostrar mensaje de carga
    this.snackbar.info('Descargando documento...');

    // Intentar descargar por ID del documento (más confiable)
    if (documento.id_documento && this.reingresoService.descargarArchivoPorId) {
      this.logger.log('Intentando descargar por ID del documento:', documento.id_documento);
      this.reingresoService.descargarArchivoPorId(documento.id_documento).pipe(
        takeUntilDestroyed(this.destroyRef)
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
        takeUntilDestroyed(this.destroyRef)
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
      takeUntilDestroyed(this.destroyRef)
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
      this.snackbar.error('No hay información suficiente para descargar el documento');
      return;
    }

    this.logger.log('Intentando descargar por nombre del archivo:', documento.nombre);
    this.reingresoService.descargarArchivo(documento.nombre).pipe(
      takeUntilDestroyed(this.destroyRef)
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

        this.snackbar.error(mensajeError);
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

    this.snackbar.exito('Documento abierto correctamente');
  }

  generarOficio(): void {
    if (!this.selectedSolicitud) return;

    const contenido = `Oficio de reingreso para ${this.selectedSolicitud.objUsuario.nombre_completo}`;

    this.reingresoService.generarOficio(this.selectedSolicitud.id_solicitud, contenido).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.snackbar.exito('Oficio generado correctamente');
        this.cargarSolicitudes();
      },
      error: (err) => {
        this.logger.error('Error al generar oficio:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackbar.error(mensaje || 'Error al generar oficio');
      }
    });
  }

  descargarOficio(idOficio: number, nombreArchivo: string): void {
    this.logger.log('Descargando oficio:', idOficio);
    this.reingresoService.descargarOficio(idOficio).pipe(
      takeUntilDestroyed(this.destroyRef)
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

        this.snackbar.exito('Oficio descargado correctamente');
      },
      error: () => this.snackbar.error('Error al descargar oficio')
    });
  }

  agregarComentario(documento: DocumentosDTORespuesta): void {
    const dialogRef = this.dialog.open(TextoDialogComponent, {
      width: '450px',
      data: {
        titulo: 'Comentario sobre documento',
        descripcion: 'Añadir comentario para el documento:',
        etiqueta: 'Comentario sobre el documento',
        nombreDocumento: documento.nombre,
        textoConfirmar: 'Añadir comentario',
        icono: 'comment'
      } as TextoDialogData
    });

    dialogRef.afterClosed().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((comentario: string) => {
      if (comentario !== undefined) {
        this.reingresoService.agregarComentario(documento.id_documento, comentario).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => {
            this.snackbar.exito('Comentario actualizado correctamente');
            this.cargarSolicitudes();
          },
          error: () => {
            this.snackbar.error('Error al añadir comentario');
          }
        });
      }
    });
  }

  aprobarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    this.reingresoService.approveDefinitively(this.selectedSolicitud.id_solicitud).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.snackbar.exito('Solicitud aprobada definitivamente');
        this.cargarSolicitudes();
        this.selectedSolicitud = undefined;
        this.requestStatusTable?.resetSelection();
      },
      error: (err: any) => {
        this.logger.error('Error al aprobar solicitud:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackbar.error(mensaje || 'Error al aprobar solicitud');
      }
    });
  }

  rechazarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;

    const dialogRef = this.dialog.open(TextoDialogComponent, {
      width: '450px',
      data: datosRechazo()
    });

    dialogRef.afterClosed().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((motivo: string) => {
      if (motivo) {
        this.reingresoService.rejectRequest(this.selectedSolicitud!.id_solicitud, motivo).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => {
            this.snackbar.exito('Solicitud rechazada');
            this.cargarSolicitudes();
            this.selectedSolicitud = undefined;
            this.requestStatusTable?.resetSelection();
          },
          error: (err: any) => {
            this.logger.error('Error al rechazar solicitud:', err);
            const mensaje = this.errorHandler.extraerMensajeError(err);
            this.snackbar.error(mensaje || 'Error al rechazar solicitud');
          }
        });
      }
    });
  }

  // Validar si se puede realizar una acción según el estado actual
  puedeAprobar(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = estadoActual(this.selectedSolicitud);
    this.logger.debug('Estado actual para aprobar (secretaria):', estado);
    return estado === EstadosSolicitud.APROBADA_COORDINADOR;
  }

  puedeRechazar(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = estadoActual(this.selectedSolicitud);
    this.logger.debug('Estado actual para rechazar (secretaria):', estado);
    return estado === EstadosSolicitud.APROBADA_COORDINADOR;
  }

  puedeGenerarOficio(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = estadoActual(this.selectedSolicitud);
    return estado === EstadosSolicitud.APROBADA_COORDINADOR;
  }

  puedeDescargarOficio(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = estadoActual(this.selectedSolicitud);
    return estado === EstadosSolicitud.APROBADA_COORDINADOR;
  }


  private limpiarEstado(): void {
    this.documentoGenerado = false;
    this.archivoPDF = null;
    this.subiendoPDF = false;
    this.enviandoPDF = false;
    this.documentoHabilitado = false;
    this.loading = false;
    this.logger.debug(' Estado del componente limpiado');
  }
}
