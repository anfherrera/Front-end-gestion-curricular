import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';

import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { DocumentGeneratorService } from '../../../core/services/document-generator.service';
import { SolicitudHomologacionDTORespuesta } from '../../../core/models/procesos.model';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { DocumentGeneratorComponent, DocumentRequest, DocumentTemplate } from '../../../shared/components/document-generator/document-generator.component';

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
    DocumentGeneratorComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['./paz-salvo.component.css']
})
export class SecretariaPazSalvoComponent implements OnInit {
  solicitudes: any[] = []; // Transformado para RequestStatusTableComponent - Pendientes
  solicitudesProcesadas: any[] = []; // Transformado para RequestStatusTableComponent - Procesadas
  selectedSolicitud?: SolicitudHomologacionDTORespuesta;
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
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    // Inicializar plantilla para paz y salvo
    this.template = {
      id: 'OFICIO_PAZ_SALVO',
      nombre: 'Oficio de Paz y Salvo',
      descripcion: 'Documento oficial que aprueba el paz y salvo del estudiante',
      camposRequeridos: ['numeroDocumento', 'fechaDocumento'],
      camposOpcionales: ['observaciones']
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
    // ✅ IGUAL QUE HOMOLOGACIÓN: Usar método directo getSecretariaRequests()
    this.pazSalvoService.getSecretariaRequests().subscribe({
      next: (sols) => {
        // ✅ CORREGIDO: Filtrar solicitudes con estado APROBADA_COORDINADOR (igual que Homologación)
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
        console.error('❌ Error al cargar solicitudes (secretaria):', err);
        this.snackBar.open('Error al cargar solicitudes', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Cargar solicitudes procesadas (historial) - Estado APROBADA
   */
  cargarSolicitudesProcesadas(): void {
    this.pazSalvoService.getSolicitudesProcesadasSecretaria().subscribe({
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
        console.error('❌ Error al cargar solicitudes procesadas:', err);
        this.snackBar.open('Error al cargar historial de solicitudes procesadas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  /**
   * Obtener fecha de procesamiento (último estado APROBADA)
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

    // ✅ IGUAL QUE HOMOLOGACIÓN: Usar método directo
    // Buscar la solicitud original por ID
    this.pazSalvoService.getSecretariaRequests().subscribe({
      next: (sols) => {
        // ✅ El backend YA filtra, solo buscamos la solicitud por ID
        this.selectedSolicitud = sols.find(sol => sol.id_solicitud === solicitudId);
        // Cargar documentos usando el nuevo endpoint
        if (this.selectedSolicitud) {
          this.cargarDocumentos(this.selectedSolicitud.id_solicitud);
        }
      }
    });
  }

  /**
   * Maneja el clic en "Tengo un documento"
   */
  /**
   * 🆕 Cargar documentos usando el nuevo endpoint para secretaria
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
        console.error('❌ [DEBUG] Error al cargar documentos (secretaria):', error);
        console.error('❌ [DEBUG] Error completo:', JSON.stringify(error));
        
        if (this.selectedSolicitud) {
          this.selectedSolicitud.documentos = [];
          this.cdr.detectChanges();
        }
        
        this.snackBar.open('Error al cargar documentos', 'Cerrar', { duration: 3000 });
      }
    });
  }

  onTengoDocumento(): void {
    this.documentoHabilitado = true;
    this.snackBar.open('Sección de carga de PDF habilitada. Ahora puedes subir tu documento.', 'Cerrar', { duration: 3000 });
  }

  /**
   * Generar documento usando el componente genérico
   * ✅ IGUAL QUE HOMOLOGACIÓN: NO actualiza el estado aquí, solo genera el documento
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

        this.snackBar.open('Documento Word generado y descargado. Ahora sube el PDF para enviar al estudiante.', 'Cerrar', { duration: 5000 });
        this.loading = false;
      },
      error: (err: any) => {
        console.error('❌ Error al generar documento:', err);
        this.snackBar.open('Error al generar documento', 'Cerrar', { duration: 3000 });
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
    // Usar el endpoint específico de Paz y Salvo para subir el oficio PDF
    this.pazSalvoService.subirOficioPdf(this.selectedSolicitud.id_solicitud, this.archivoPDF).subscribe({
      next: (response) => {
        this.snackBar.open('Archivo PDF subido exitosamente. Ahora puedes enviarlo al estudiante.', 'Cerrar', { duration: 3000 });
        this.subiendoPDF = false;
      },
      error: (err) => {
        console.error('❌ Error al subir archivo PDF:', err);
        this.snackBar.open('Error al subir archivo PDF: ' + (err.error?.message || err.message || 'Error desconocido'), 'Cerrar', { duration: 5000 });
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
    // Actualizar estado de la solicitud a APROBADA cuando se envía el PDF
    this.pazSalvoService.approveDefinitively(this.selectedSolicitud.id_solicitud).subscribe({
      next: () => {
        this.snackBar.open('PDF enviado al estudiante y solicitud aprobada exitosamente ✅', 'Cerrar', { duration: 3000 });
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
        console.error('❌ Error al actualizar estado de solicitud:', err);
        this.snackBar.open('Error al enviar al estudiante', 'Cerrar', { duration: 3000 });
        this.enviandoPDF = false;
      }
    });
  }

  /**
   * Enviar documento (unifica subir PDF y enviar al estudiante)
   * ✅ IGUAL QUE HOMOLOGACIÓN: Sube el PDF y LUEGO actualiza el estado
   */
  enviarDocumento(): void {
    if (!this.archivoPDF || !this.selectedSolicitud) {
      this.snackBar.open('Por favor selecciona un archivo PDF', 'Cerrar', { duration: 3000 });
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
          console.error('❌ selectedSolicitud es undefined');
          this.snackBar.open('Error: Solicitud no encontrada', 'Cerrar', { duration: 3000 });
          this.enviandoPDF = false;
          return;
        }

        // Actualizar estado de la solicitud a APROBADA cuando se envía el PDF
        this.pazSalvoService.approveDefinitively(this.selectedSolicitud.id_solicitud).subscribe({
          next: () => {
            this.snackBar.open('Documento enviado al estudiante y solicitud aprobada exitosamente ✅', 'Cerrar', { duration: 3000 });
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
            console.error('❌ Error al actualizar estado de solicitud:', err);
            this.snackBar.open('PDF subido pero error al enviar al estudiante', 'Cerrar', { duration: 3000 });
            this.enviandoPDF = false;
          }
        });
      },
      error: (err) => {
        console.error('❌ Error al subir archivo PDF:', err);
        this.snackBar.open('Error al subir archivo PDF: ' + (err.error?.message || err.message || 'Error desconocido'), 'Cerrar', { duration: 5000 });
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
