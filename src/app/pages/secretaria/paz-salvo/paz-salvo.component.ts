import { Component, OnInit, ChangeDetectorRef, ViewChild, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { switchMap, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { PazSalvoService } from '@core/services/paz-salvo.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { DocumentGeneratorService } from '@core/services/document-generator.service';
import { SolicitudHomologacionDTORespuesta } from '@core/models/procesos.model';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import { DocumentGeneratorComponent } from '@shared/components/document-generator/document-generator.component';
import { DocumentRequest, DocumentTemplate } from '@core/models/documento.model';
import { descargarBlob } from '@core/utils/download.util';
import { SolicitudesBandejaComponent } from '@shared/components/solicitudes-bandeja/solicitudes-bandeja.component';
import { aDocumentos } from '../../common/paz-salvo-revision/paz-salvo-filas';

/**
 * Secretaría: genera el oficio de paz y salvo, sube el PDF firmado y con eso
 * aprueba definitivamente la solicitud.
 */
@Component({
  selector: 'app-secretaria-paz-salvo',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    CardContainerComponent,
    DocumentGeneratorComponent,
    SolicitudesBandejaComponent
  ],
  templateUrl: './paz-salvo.component.html',
  styleUrls: ['../secretaria-comun.css', './paz-salvo.component.css']
})
export class SecretariaPazSalvoComponent implements OnInit {
  @ViewChild('bandeja') bandeja?: SolicitudesBandejaComponent<SolicitudHomologacionDTORespuesta>;

  solicitudes: SolicitudHomologacionDTORespuesta[] = [];             // Pendientes
  solicitudesProcesadas: SolicitudHomologacionDTORespuesta[] = [];   // Historial
  selectedSolicitud?: SolicitudHomologacionDTORespuesta;
  periodoAcademicoFiltro: string | null = null;
  loading = false;

  readonly template: DocumentTemplate = {
    id: 'OFICIO_PAZ_SALVO',
    nombre: 'Oficio de Paz y Salvo',
    descripcion: 'Documento oficial que aprueba el paz y salvo del estudiante',
    camposRequeridos: ['numeroDocumento', 'fechaDocumento'],
    camposOpcionales: []
  };

  // Flujo del PDF: generar Word (o indicar que ya se tiene) -> elegir PDF -> subir y aprobar
  documentoGenerado = false;
  documentoHabilitado = false;
  archivoPDF: File | null = null;
  subiendoPDF = false;
  enviandoPDF = false;
  private destroyRef = inject(DestroyRef);

  constructor(
    public pazSalvoService: PazSalvoService,
    private documentGeneratorService: DocumentGeneratorService,
    private snackbar: SnackbarService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudesPendientes();
    this.cargarSolicitudesProcesadas();
  }

  /** Pendientes de secretaría: el backend ya las filtra (APROBADA_COORDINADOR). */
  cargarSolicitudesPendientes(): void {
    this.pazSalvoService.getSecretariaRequests().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (sols) => this.solicitudes = sols,
      error: () => this.snackbar.error('Error al cargar solicitudes')
    });
  }

  cargarSolicitudesProcesadas(): void {
    this.pazSalvoService.getSolicitudesProcesadasSecretaria(this.periodoAcademicoFiltro || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (sols) => this.solicitudesProcesadas = sols,
      error: () => this.snackbar.error('Error al cargar historial de solicitudes procesadas')
    });
  }

  onPeriodoChange(periodo: string | null): void {
    this.periodoAcademicoFiltro = periodo;
    this.cargarSolicitudesProcesadas();
  }

  onSolicitudSeleccionada(solicitud: SolicitudHomologacionDTORespuesta | null): void {
    this.limpiarEstado();
    this.selectedSolicitud = solicitud ?? undefined;

    if (this.selectedSolicitud) {
      this.cargarDocumentos(this.selectedSolicitud.id_solicitud);
    }
  }

  cargarDocumentos(idSolicitud: number): void {
    this.pazSalvoService.obtenerOficios(idSolicitud).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (documentos) => {
        if (this.selectedSolicitud?.id_solicitud !== idSolicitud) return;
        this.selectedSolicitud.documentos = aDocumentos(documentos);
        this.cdr.detectChanges();
      },
      error: () => {
        if (this.selectedSolicitud?.id_solicitud === idSolicitud) {
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

  /** Genera y descarga el oficio en Word; el estado de la solicitud no cambia. */
  onGenerarDocumento(request: DocumentRequest): void {
    if (!this.selectedSolicitud) return;
    const nombreEstudiante = this.selectedSolicitud.objUsuario.nombre_completo;

    this.loading = true;
    this.documentGeneratorService.generarDocumento(request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob) => {
        const nombreArchivo = `${request.tipoDocumento}_${nombreEstudiante}_${new Date().getFullYear()}.docx`;
        descargarBlob(blob, nombreArchivo);
        this.documentoGenerado = true;
        this.loading = false;
        this.snackbar.exito('Documento Word generado y descargado. Ahora sube el PDF para enviar al estudiante.');
      },
      error: () => {
        this.loading = false;
        this.snackbar.error('Error al generar documento');
      }
    });
  }

  onCancelarGeneracion(): void {
    this.limpiarEstado();
    this.selectedSolicitud = undefined;
  }

  onArchivoSeleccionado(event: Event): void {
    const archivo = (event.target as HTMLInputElement).files?.[0];
    if (archivo && archivo.type === 'application/pdf') {
      this.archivoPDF = archivo;
      this.snackbar.info(`Archivo PDF seleccionado: ${archivo.name}`);
    } else {
      this.snackbar.advertencia('Por favor selecciona un archivo PDF válido');
    }
  }

  /** Sube el oficio en PDF y, si sale bien, aprueba definitivamente la solicitud. */
  enviarDocumento(): void {
    if (!this.archivoPDF || !this.selectedSolicitud) {
      this.snackbar.advertencia('Por favor selecciona un archivo PDF');
      return;
    }
    const id = this.selectedSolicitud.id_solicitud;

    this.subiendoPDF = true;
    let pdfSubido = false;
    this.pazSalvoService.subirOficioPdf(id, this.archivoPDF).pipe(
      tap(() => {
        pdfSubido = true;
        this.subiendoPDF = false;
        this.enviandoPDF = true;
      }),
      switchMap(() => this.pazSalvoService.approveDefinitively(id)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.snackbar.exito('Documento enviado al estudiante y solicitud aprobada exitosamente');
        this.limpiarEstado();
        this.selectedSolicitud = undefined;
        this.bandeja?.resetSelection();
        this.cargarSolicitudesPendientes();
        this.cargarSolicitudesProcesadas();
      },
      error: (err: HttpErrorResponse) => {
        if (pdfSubido) {
          this.enviandoPDF = false;
          this.snackbar.error('PDF subido pero error al enviar al estudiante');
          return;
        }
        this.subiendoPDF = false;
        this.snackbar.error('Error al subir archivo PDF: ' + (err.error?.message || err.message || 'Error desconocido'));
      }
    });
  }

  private limpiarEstado(): void {
    this.documentoGenerado = false;
    this.documentoHabilitado = false;
    this.archivoPDF = null;
    this.subiendoPDF = false;
    this.enviandoPDF = false;
    this.loading = false;
  }
}
