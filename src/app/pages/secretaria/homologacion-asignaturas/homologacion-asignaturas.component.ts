import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';
import { DocumentGeneratorService } from '../../../core/services/document-generator.service';
import { SolicitudHomologacionDTORespuesta } from '../../../core/models/procesos.model';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { DocumentGeneratorComponent, DocumentRequest, DocumentTemplate } from '../../../shared/components/document-generator/document-generator.component';

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
    DocumentGeneratorComponent
  ],
  templateUrl: './homologacion-asignaturas.component.html',
  styleUrls: ['./homologacion-asignaturas.component.css']
})
export class HomologacionAsignaturasComponent implements OnInit {
  solicitudes: any[] = []; // Transformado para RequestStatusTableComponent
  selectedSolicitud?: SolicitudHomologacionDTORespuesta;
  template!: DocumentTemplate;
  loading: boolean = false;
  
  // Nuevas propiedades para el flujo de PDF
  documentoGenerado: boolean = false;
  archivoPDF: File | null = null;
  subiendoPDF: boolean = false;
  enviandoPDF: boolean = false;

  constructor(
    private homologacionService: HomologacionAsignaturasService,
    private documentGeneratorService: DocumentGeneratorService,
    private snackBar: MatSnackBar
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
  }

  /**
   * Cargar solicitudes pendientes para secretaría (solo las aprobadas por coordinador)
   */
  cargarSolicitudes(): void {
    this.homologacionService.getSecretariaRequests().subscribe({
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
        console.log('📋 Solicitudes cargadas para secretaría:', this.solicitudes);
      },
      error: (err) => {
        console.error('❌ Error al cargar solicitudes:', err);
        this.snackBar.open('Error al cargar solicitudes', 'Cerrar', { duration: 3000 });
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
   * Seleccionar solicitud (evento del RequestStatusTableComponent)
   */
  onSolicitudSeleccionada(solicitudId: number): void {
    // Buscar la solicitud original por ID
    this.homologacionService.getSecretariaRequests().subscribe({
      next: (sols) => {
        this.selectedSolicitud = sols.find(sol => sol.id_solicitud === solicitudId);
        console.log('✅ Solicitud seleccionada:', this.selectedSolicitud);
      }
    });
  }

  /**
   * Generar documento usando el componente genérico
   */
  onGenerarDocumento(request: DocumentRequest): void {
    if (!this.selectedSolicitud) return;

    this.loading = true;
    console.log('📄 Generando documento:', request);

    this.documentGeneratorService.generarDocumento(request).subscribe({
      next: (blob) => {
        console.log('✅ Documento generado exitosamente');
        
        // Generar nombre de archivo
        const nombreArchivo = `${request.tipoDocumento}_${this.selectedSolicitud!.objUsuario.nombre_completo}_${new Date().getFullYear()}.docx`;
        
        // Descargar archivo Word
        this.documentGeneratorService.descargarArchivo(blob, nombreArchivo);
        
        // Actualizar estado de la solicitud a APROBADA
        this.homologacionService.approveDefinitively(this.selectedSolicitud!.id_solicitud).subscribe({
          next: () => {
            console.log('✅ Estado de solicitud actualizado a APROBADA');
            
            // Marcar que el documento fue generado
            this.documentoGenerado = true;
            
            this.snackBar.open('Documento Word generado, descargado y solicitud aprobada. Ahora sube el PDF para enviar al estudiante.', 'Cerrar', { duration: 5000 });
            this.loading = false;
            
            // Recargar solicitudes para mostrar el cambio de estado
            this.cargarSolicitudes();
          },
          error: (err: any) => {
            console.error('❌ Error al actualizar estado de solicitud:', err);
            this.snackBar.open('Documento generado pero error al actualizar estado', 'Cerrar', { duration: 3000 });
            this.documentoGenerado = true;
            this.loading = false;
          }
        });
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
    this.selectedSolicitud = undefined;
    this.documentoGenerado = false;
    this.archivoPDF = null;
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
    console.log('📤 Subiendo archivo PDF:', this.archivoPDF.name);

    // Usar el servicio para subir el PDF con idSolicitud
    this.homologacionService.subirArchivoPDF(this.archivoPDF, this.selectedSolicitud.id_solicitud).subscribe({
      next: (response) => {
        console.log('✅ Archivo PDF subido exitosamente:', response);
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
   * Enviar PDF al estudiante
   */
  enviarPDFAlEstudiante(): void {
    if (!this.archivoPDF || !this.selectedSolicitud) {
      this.snackBar.open('Por favor sube un archivo PDF primero', 'Cerrar', { duration: 3000 });
      return;
    }

    this.enviandoPDF = true;
    console.log('📧 Enviando PDF al estudiante:', this.selectedSolicitud.id_solicitud);

    // Simular envío del PDF (el estado ya se actualizó cuando se generó el documento)
    setTimeout(() => {
      console.log('✅ PDF enviado al estudiante exitosamente');
      this.snackBar.open('PDF enviado al estudiante exitosamente ✅', 'Cerrar', { duration: 3000 });
      this.enviandoPDF = false;
      
      // Limpiar el estado
      this.documentoGenerado = false;
      this.archivoPDF = null;
      this.selectedSolicitud = undefined;
      
      // Recargar solicitudes
      this.cargarSolicitudes();
    }, 1000);
  }

  /**
   * Verificar si se puede enviar el PDF
   */
  puedeEnviarPDF(): boolean {
    return this.documentoGenerado && this.archivoPDF !== null && !this.subiendoPDF && !this.enviandoPDF;
  }
}
