import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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
        
        // Descargar archivo
        this.documentGeneratorService.descargarArchivo(blob, nombreArchivo);
        
        this.snackBar.open('Documento generado y descargado exitosamente ✅', 'Cerrar', { duration: 3000 });
        this.loading = false;
        this.cargarSolicitudes(); // Recargar para actualizar estados
      },
      error: (err) => {
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
  }
}
