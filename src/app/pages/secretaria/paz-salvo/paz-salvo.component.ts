import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';

import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { DocumentGeneratorService } from '../../../core/services/document-generator.service';
import { SolicitudHomologacionDTORespuesta } from '../../../core/models/procesos.model';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { DocumentGeneratorComponent, DocumentRequest, DocumentTemplate } from '../../../shared/components/document-generator/document-generator.component';
import { PeriodoFiltroSelectorComponent } from '../../../shared/components/periodo-filtro-selector/periodo-filtro-selector.component';

@Component({
  selector: 'app-secretaria-paz-salvo',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTabsModule,
    CardContainerComponent,
    RequestStatusTableComponent,
    DocumentGeneratorComponent,
    PeriodoFiltroSelectorComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class SecretariaPazSalvoComponent implements OnInit {
  solicitudes: any[] = []; // Transformado para RequestStatusTableComponent - Pendientes
  solicitudesProcesadas: any[] = []; // Transformado para RequestStatusTableComponent - Procesadas
  selectedSolicitud?: SolicitudHomologacionDTORespuesta;
  periodoAcademicoFiltro: string | null = null; // Filtro de período académico para historial
  template!: DocumentTemplate;
  loading: boolean = false;

  // Nuevas propiedades para el flujo de PDF
  documentoGenerado: boolean = false;
  archivoPDF: File | null = null;
  subiendoPDF: boolean = false;
  enviandoPDF: boolean = false;

  // Nueva propiedad para controlar la habilitación del generador de documentos
  documentoHabilitado: boolean = false;

  constructor(
    public pazSalvoService: PazSalvoService,
    private documentGeneratorService: DocumentGeneratorService,
    private snackbar: SnackbarService,
    private cdr: ChangeDetectorRef
  ) {
    // Inicializar plantilla para paz y salvo
    this.template = {
      id: 'OFICIO_PAZ_SALVO',
      nombre: 'Oficio de Paz y Salvo',
      descripcion: 'Documento oficial que aprueba el paz y salvo del estudiante',
      camposRequeridos: ['numeroDocumento', 'fechaDocumento'],
      camposOpcionales: []
    };
  }

  ngOnInit(): void {
    this.cargarSolicitudesPendientes();
    this.cargarSolicitudesProcesadas();
  }

  /**
   * Cargar solicitudes pendientes para secretaría (estado APROBADA_COORDINADOR)
   */
  cargarSolicitudesPendientes(): void {
    this.pazSalvoService.getSecretariaRequests().subscribe({
      next: (sols) => {
        // El backend YA filtra por estado, así que mostramos TODAS las que llegan
        const solicitudesFiltradas = sols;

        // Transformar datos para RequestStatusTableComponent
        this.solicitudes = solicitudesFiltradas.map(sol => ({
          id: sol.id_solicitud,
          nombre: sol.nombre_solicitud,
          fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
          estado: this.getEstadoActual(sol),
          rutaArchivo: '', // Para oficios
          comentarios: ''
        }));
      },
      error: (err) => {
        this.snackbar.error('Error al cargar solicitudes');
      }
    });
  }

  /**
   * Cargar solicitudes procesadas (historial) - Historial verdadero de todas las procesadas
   */
  cargarSolicitudesProcesadas(): void {
    this.pazSalvoService.getSolicitudesProcesadasSecretaria(this.periodoAcademicoFiltro || undefined).subscribe({
      next: (sols) => {
        // Transformar datos para RequestStatusTableComponent
        this.solicitudesProcesadas = sols.map(sol => ({
          id: sol.id_solicitud,
          nombre: sol.nombre_solicitud,
          fecha: new Date(sol.fecha_registro_solicitud).toLocaleDateString(),
          estado: this.getEstadoActual(sol),
          fechaProcesamiento: this.getFechaProcesamiento(sol),
          rutaArchivo: '',
          comentarios: ''
        }));
      },
      error: (err) => {
        this.snackbar.error('Error al cargar historial de solicitudes procesadas');
      }
    });
  }

  /**
   * Manejar cambio de período académico en el filtro
   */
  onPeriodoChange(periodo: string): void {
    // Si es "todos", enviar null/undefined para que el backend muestre todas las solicitudes
    if (periodo === 'todos' || !periodo) {
      this.periodoAcademicoFiltro = null;
    } else {
      this.periodoAcademicoFiltro = periodo;
    }
    this.periodoAcademicoFiltro = periodo || null;
    this.cargarSolicitudesProcesadas();
  }

  /**
   * Obtener fecha de procesamiento (último estado)
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
   * Verificar si la solicitud tiene oficios PDF (ya fue enviada al estudiante)
   */
  tieneOficiosPDF(solicitud: SolicitudHomologacionDTORespuesta): boolean {
    if (!solicitud.documentos || solicitud.documentos.length === 0) {
      return false;
    }

    // Buscar documentos que sean oficios/resoluciones (PDFs subidos por secretaria)
    return solicitud.documentos.some(doc => {
      if (!doc.nombre) return false;

      const nombre = doc.nombre.toLowerCase();
      const esPDF = nombre.endsWith('.pdf');
      const esOficio = nombre.includes('oficio') ||
                      nombre.includes('resolucion') ||
                      nombre.includes('paz') ||
                      nombre.includes('salvo') ||
                      nombre.includes('aprobacion');

      return esPDF && esOficio;
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
    this.pazSalvoService.getSecretariaRequests().subscribe({
      next: (sols) => {
        // El backend YA filtra, solo buscamos la solicitud por ID
        this.selectedSolicitud = sols.find(sol => sol.id_solicitud === solicitudId);
        // Cargar documentos usando el nuevo endpoint
        if (this.selectedSolicitud) {
          this.cargarDocumentos(this.selectedSolicitud.id_solicitud);
        }
      }
    });
  }

  /**
   * Cargar documentos usando el endpoint para secretaria
   */
  cargarDocumentos(idSolicitud: number): void {
    const endpoint = `/api/solicitudes-pazysalvo/obtenerOficios/${idSolicitud}`;
    this.pazSalvoService.obtenerOficios(idSolicitud).subscribe({
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
        
        if (this.selectedSolicitud) {
          this.selectedSolicitud.documentos = [];
          this.cdr.detectChanges();
        }
        
        this.snackbar.error('Error al cargar documentos');
      }
    });
  }

  onTengoDocumento(): void {
    this.documentoHabilitado = true;
    this.snackbar.info('Sección de carga de PDF habilitada. Ahora puedes subir tu documento.');
  }

  /**
   * Generar documento usando el componente genérico
   */
  onGenerarDocumento(request: DocumentRequest): void {
    if (!this.selectedSolicitud) return;

    this.loading = true;
    this.documentGeneratorService.generarDocumento(request).subscribe({
      next: (blob) => {
        // Generar nombre de archivo
        const nombreArchivo = `${request.tipoDocumento}_${this.selectedSolicitud!.objUsuario.nombre_completo}_${new Date().getFullYear()}.docx`;

        // Descargar archivo Word
        this.documentGeneratorService.descargarArchivo(blob, nombreArchivo);

        // Marcar que el documento fue generado (SIN cambiar el estado de la solicitud)
        this.documentoGenerado = true;

        this.snackbar.success('Documento Word generado y descargado. Ahora sube el PDF para enviar al estudiante.');
        this.loading = false;
      },
      error: (err: any) => {
        this.snackbar.error('Error al generar documento');
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
      this.snackbar.warning('Por favor selecciona un archivo PDF válido');
    }
  }

  /**
   * Subir archivo PDF al servidor
   */
  subirPDF(): void {
    if (!this.archivoPDF || !this.selectedSolicitud) {
      this.snackbar.warning('Por favor selecciona un archivo PDF');
      return;
    }

    this.subiendoPDF = true;
    // Usar el endpoint específico de Paz y Salvo para subir el oficio PDF
    this.pazSalvoService.subirOficioPdf(this.selectedSolicitud.id_solicitud, this.archivoPDF).subscribe({
      next: (response) => {
        this.snackbar.success('Archivo PDF subido exitosamente. Ahora puedes enviarlo al estudiante.');
        this.subiendoPDF = false;
      },
      error: (err) => {
        this.snackbar.error('Error al subir archivo PDF: ' + (err.error?.message || err.message || 'Error desconocido'));
        this.subiendoPDF = false;
      }
    });
  }

  /**
   * Enviar PDF al estudiante (cambia el estado a APROBADA)
   */
  enviarPDFAlEstudiante(): void {
    if (!this.selectedSolicitud) {
      this.snackbar.warning('Por favor selecciona una solicitud');
      return;
    }

    this.enviandoPDF = true;
    // Actualizar estado de la solicitud a APROBADA cuando se envía el PDF
    this.pazSalvoService.approveDefinitively(this.selectedSolicitud.id_solicitud).subscribe({
      next: () => {
        this.snackbar.success('PDF enviado al estudiante y solicitud aprobada exitosamente');
        this.enviandoPDF = false;

        // Limpiar el estado
        this.documentoGenerado = false;
        this.archivoPDF = null;
        this.selectedSolicitud = undefined;

        // Recargar ambas listas
        this.cargarSolicitudesPendientes();
        this.cargarSolicitudesProcesadas();
      },
      error: (err: any) => {
        this.snackbar.error('Error al enviar al estudiante');
        this.enviandoPDF = false;
      }
    });
  }

  /**
   * Enviar documento (unifica subir PDF y enviar al estudiante)
   */
  enviarDocumento(): void {
    if (!this.archivoPDF || !this.selectedSolicitud) {
      this.snackbar.warning('Por favor selecciona un archivo PDF');
      return;
    }

    // Paso 1: Subir PDF
    this.subiendoPDF = true;
    // Usar el endpoint específico de Paz y Salvo para subir el oficio PDF
    this.pazSalvoService.subirOficioPdf(this.selectedSolicitud.id_solicitud, this.archivoPDF).subscribe({
      next: (response) => {
        this.subiendoPDF = false;

        // Paso 2: Enviar al estudiante (cambiar estado)
        this.enviandoPDF = true;
        // Verificar que la solicitud sigue seleccionada
        if (!this.selectedSolicitud) {
          this.snackbar.error('Error: Solicitud no encontrada');
          this.enviandoPDF = false;
          return;
        }

        // Actualizar estado de la solicitud a APROBADA cuando se envía el PDF
        this.pazSalvoService.approveDefinitively(this.selectedSolicitud.id_solicitud).subscribe({
          next: () => {
            this.snackbar.success('Documento enviado al estudiante y solicitud aprobada exitosamente');
            this.enviandoPDF = false;

            // Limpiar el estado
            this.documentoGenerado = false;
            this.archivoPDF = null;
            this.selectedSolicitud = undefined;

        // Recargar ambas listas para mostrar el cambio de estado
        this.cargarSolicitudesPendientes();
        this.cargarSolicitudesProcesadas();
          },
          error: (err: any) => {
            this.snackbar.error('PDF subido pero error al enviar al estudiante');
            this.enviandoPDF = false;
          }
        });
      },
      error: (err) => {
        this.snackbar.error('Error al subir archivo PDF: ' + (err.error?.message || err.message || 'Error desconocido'));
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
  }
}
