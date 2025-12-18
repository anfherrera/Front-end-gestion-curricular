import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';
import { DocumentGeneratorService } from '../../../core/services/document-generator.service';
import { SolicitudHomologacionDTORespuesta } from '../../../core/models/procesos.model';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { DocumentGeneratorComponent, DocumentRequest, DocumentTemplate } from '../../../shared/components/document-generator/document-generator.component';
import { DocumentationViewerComponent } from '../../../shared/components/documentation-viewer/documentation-viewer.component';
import { ApprovedRequestsSectionComponent } from '../../../shared/components/approved-requests-section/approved-requests-section.component';
import { LoggerService } from '../../../core/services/logger.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

@Component({
  selector: 'app-homologacion-asignaturas',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    CardContainerComponent,
    RequestStatusTableComponent,
    DocumentGeneratorComponent,
    DocumentationViewerComponent,
    ApprovedRequestsSectionComponent
  ],
  templateUrl: './homologacion-asignaturas.component.html',
  styleUrls: ['./homologacion-asignaturas.component.css']
})
export class HomologacionAsignaturasComponent implements OnInit, OnDestroy {
  solicitudes: any[] = []; // Transformado para RequestStatusTableComponent
  solicitudesAprobadas: any[] = [];
  selectedSolicitud?: SolicitudHomologacionDTORespuesta;
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

  private destroy$ = new Subject<void>();

  constructor(
    public homologacionService: HomologacionAsignaturasService,
    private documentGeneratorService: DocumentGeneratorService,
    private snackBar: MatSnackBar,
    private logger: LoggerService,
    private errorHandler: ErrorHandlerService
  ) {
    // Inicializar plantilla para homologación
    this.template = {
      id: 'OFICIO_HOMOLOGACION',
      nombre: 'Oficio de Homologación',
      descripcion: 'Documento oficial que aprueba la homologación de asignaturas',
      camposRequeridos: ['numeroDocumento', 'fechaDocumento'],
      camposOpcionales: ['observaciones']
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

  /**
   * Cargar solicitudes pendientes para secretaría (solo las aprobadas por coordinador)
   */
  cargarSolicitudes(): void {
    this.homologacionService.getSecretariaRequests().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (sols) => {
        // Transformar datos para RequestStatusTableComponent
        this.solicitudes = sols.map(sol => ({
          id: sol.id_solicitud,
          nombre: sol.nombre_solicitud,
          fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
          estado: this.getEstadoActual(sol),
          rutaArchivo: '', // Para oficios
          comentarios: ''
        }));
        this.logger.debug('Solicitudes cargadas para secretaría:', this.solicitudes);
      },
      error: (err) => {
        this.logger.error('Error al cargar solicitudes:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al cargar solicitudes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Obtener el estado actual de la solicitud
   */
  getEstadoActual(solicitud: SolicitudHomologacionDTORespuesta): string {
    if (solicitud.estadosSolicitud && solicitud.estadosSolicitud.length > 0) {
      const ultimoEstado = solicitud.estadosSolicitud[solicitud.estadosSolicitud.length - 1];
      return ultimoEstado.estado_actual;
    }
    return 'Pendiente';
  }

  /**
   * Cargar solicitudes de reingreso aprobadas
   */
  cargarSolicitudesAprobadas(): void {
    this.cargandoSolicitudesAprobadas = true;

    this.homologacionService.getSecretariaApprovedRequests().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (solicitudes) => {
        this.solicitudesAprobadas = solicitudes.map((solicitud) => ({
          id: solicitud.id_solicitud,
          nombre: solicitud.nombre_solicitud,
          fecha: new Date(solicitud.fecha_registro_solicitud).toLocaleDateString(),
          estado: this.getEstadoActual(solicitud) || 'Aprobada',
          rutaArchivo: '',
          comentarios: solicitud.estadosSolicitud?.slice(-1)[0]?.comentario ?? ''
        }));

        this.cargandoSolicitudesAprobadas = false;
        this.logger.debug('Solicitudes de homologación aprobadas:', this.solicitudesAprobadas);
      },
      error: (err) => {
        this.logger.error('Error al cargar solicitudes aprobadas de homologación:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al cargar las solicitudes aprobadas', 'Cerrar', { duration: 3000 });
        this.cargandoSolicitudesAprobadas = false;
      }
    });
  }

  /**
   * Seleccionar solicitud (evento del RequestStatusTableComponent)
   */
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
    this.homologacionService.getSecretariaRequests().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (sols) => {
        this.selectedSolicitud = sols.find(sol => sol.id_solicitud === solicitudId);
        this.logger.debug('Solicitud seleccionada:', this.selectedSolicitud);
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
    this.snackBar.open('Sección de carga de PDF habilitada. Ahora puedes subir tu documento.', 'Cerrar', { duration: 3000 });
  }

  /**
   * Generar documento usando el componente genérico
   */
  onGenerarDocumento(request: DocumentRequest): void {
    if (!this.selectedSolicitud) return;

    this.loading = true;
    this.logger.log('Generando documento:', request);

    this.documentGeneratorService.generarDocumento(request).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob) => {
        this.logger.log('Documento generado exitosamente');

        // Generar nombre de archivo
        const nombreArchivo = `${request.tipoDocumento}_${this.selectedSolicitud!.objUsuario.nombre_completo}_${new Date().getFullYear()}.docx`;

        // Descargar archivo Word
        this.documentGeneratorService.descargarArchivo(blob, nombreArchivo);

        // Marcar que el documento fue generado (SIN cambiar el estado de la solicitud)
        this.documentoGenerado = true;

        this.snackBar.open('Documento Word generado y descargado. Ahora sube el PDF para enviar al estudiante.', 'Cerrar', { duration: 5000 });
        this.loading = false;
      },
      error: (err: any) => {
        this.logger.error('Error al generar documento:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al generar documento', 'Cerrar', { duration: 3000 });
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
    this.logger.debug('Generación de documento cancelada');
  }

  /**
   * Manejar selección de archivo PDF
   */
  onArchivoSeleccionado(event: any): void {
    const archivo = event.target.files[0];
    if (archivo && archivo.type === 'application/pdf') {
      this.archivoPDF = archivo;
      this.snackBar.open(`Archivo PDF seleccionado: ${archivo.name}`, 'Cerrar', { duration: 3000 });
    } else {
      this.snackBar.open('Por favor selecciona un archivo PDF válido', 'Cerrar', { duration: 3000 });
    }
  }

  /**
   * Subir archivo PDF al servidor
   */
  subirPDF(): void {
    if (!this.archivoPDF || !this.selectedSolicitud) {
      this.snackBar.open('Por favor selecciona un archivo PDF', 'Cerrar', { duration: 3000 });
      return;
    }

    this.subiendoPDF = true;
    this.logger.log('📤 Subiendo archivo PDF:', this.archivoPDF.name);

    // Usar el servicio para subir el PDF con idSolicitud
    this.homologacionService.subirArchivoPDF(this.archivoPDF, this.selectedSolicitud.id_solicitud).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.logger.log('Archivo PDF subido exitosamente:', response);
        this.snackBar.open('Archivo PDF subido exitosamente. Ahora puedes enviarlo al estudiante.', 'Cerrar', { duration: 3000 });
        this.subiendoPDF = false;
      },
      error: (err) => {
        this.logger.error('Error al subir archivo PDF:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al subir archivo PDF', 'Cerrar', { duration: 5000 });
        this.subiendoPDF = false;
      }
    });
  }

  /**
   * Enviar PDF al estudiante (cambia el estado a APROBADA)
   */
  enviarPDFAlEstudiante(): void {
    if (!this.selectedSolicitud) {
      this.snackBar.open('Por favor selecciona una solicitud', 'Cerrar', { duration: 3000 });
      return;
    }

    this.enviandoPDF = true;
    this.logger.log('Enviando PDF al estudiante:', this.selectedSolicitud.id_solicitud);

    // Actualizar estado de la solicitud a APROBADA cuando se envía el PDF
    this.homologacionService.approveDefinitively(this.selectedSolicitud.id_solicitud).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.logger.log('Estado de solicitud actualizado a APROBADA');
        this.logger.log('PDF enviado al estudiante exitosamente');
        this.snackBar.open('PDF enviado al estudiante y solicitud aprobada exitosamente', 'Cerrar', { duration: 3000 });
        this.enviandoPDF = false;

        // Limpiar el estado
        this.documentoGenerado = false;
        this.archivoPDF = null;
        this.selectedSolicitud = undefined;

        // Recargar solicitudes
        this.cargarSolicitudes();
      },
      error: (err: any) => {
            this.logger.error('Error al actualizar estado de solicitud:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al enviar al estudiante', 'Cerrar', { duration: 3000 });
        this.enviandoPDF = false;
      }
    });
  }

  /**
   * Enviar documento (unifica subir PDF y enviar al estudiante)
   */
  enviarDocumento(): void {
    if (!this.archivoPDF || !this.selectedSolicitud) {
      this.snackBar.open('Por favor selecciona un archivo PDF', 'Cerrar', { duration: 3000 });
      return;
    }

    // Paso 1: Subir PDF
    this.subiendoPDF = true;
    this.logger.log('Subiendo archivo PDF:', this.archivoPDF.name);

    // Usar el servicio para subir el PDF con idSolicitud
    this.homologacionService.subirArchivoPDF(this.archivoPDF, this.selectedSolicitud.id_solicitud).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.logger.log('Archivo PDF subido exitosamente:', response);
        this.subiendoPDF = false;

        this.enviandoPDF = true;
        this.logger.log('Enviando PDF al estudiante:', this.selectedSolicitud?.id_solicitud);

        if (!this.selectedSolicitud) {
          this.logger.error('selectedSolicitud es undefined');
          this.snackBar.open('Error: Solicitud no encontrada', 'Cerrar', { duration: 3000 });
          this.enviandoPDF = false;
          return;
        }

        // Actualizar estado de la solicitud a APROBADA cuando se envía el PDF
        this.homologacionService.approveDefinitively(this.selectedSolicitud.id_solicitud).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: () => {
            this.logger.log('Estado de solicitud actualizado a APROBADA');
            this.logger.log('PDF enviado al estudiante exitosamente');
            this.snackBar.open('Documento enviado al estudiante y solicitud aprobada exitosamente', 'Cerrar', { duration: 3000 });
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
            this.snackBar.open(mensaje || 'PDF subido pero error al enviar al estudiante', 'Cerrar', { duration: 3000 });
            this.enviandoPDF = false;
          }
        });
      },
      error: (err) => {
        this.logger.error('Error al subir archivo PDF:', err);
        const mensaje = this.errorHandler.extraerMensajeError(err);
        this.snackBar.open(mensaje || 'Error al subir archivo PDF', 'Cerrar', { duration: 5000 });
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
