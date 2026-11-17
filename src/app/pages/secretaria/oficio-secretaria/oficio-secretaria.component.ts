import { Component, DestroyRef, OnInit, inject, input, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, switchMap, tap } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { DocumentRequest, DocumentTemplate } from '@core/models/documento.model';
import { SolicitudAprobable } from '@core/models/solicitud-revision.model';
import { DocumentGeneratorService } from '@core/services/document-generator.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { descargarBlob } from '@core/utils/download.util';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import { DocumentGeneratorComponent } from '@shared/components/document-generator/document-generator.component';
import {
  DocumentationViewerComponent,
  ServicioDocumentos
} from '@shared/components/documentation-viewer/documentation-viewer.component';
import { SolicitudesBandejaComponent } from '@shared/components/solicitudes-bandeja/solicitudes-bandeja.component';

/** Lo que cambia entre los procesos que cierra secretaría. */
export interface ConfigOficioSecretaria<S extends SolicitudAprobable> {
  proceso: 'paz-salvo' | 'homologacion' | 'reingreso';
  plantilla: DocumentTemplate;
  /** Pendientes de secretaría (aprobadas por el coordinador). */
  pendientes: () => Observable<S[]>;
  /** Historial (ya enviadas al estudiante); sin período, el backend usa el actual. */
  procesadas: (periodo?: string) => Observable<S[]>;
  /** Sube el oficio o resolución firmada en PDF. */
  subirPdf: (idSolicitud: number, archivo: File) => Observable<unknown>;
  /** Aprobación definitiva, después de subir el PDF. */
  aprobar: (idSolicitud: number) => Observable<unknown>;
  /** Si viene, se muestran los documentos que adjuntó el estudiante. */
  servicioDocumentos?: ServicioDocumentos;
}

/**
 * Secretaría cierra una solicitud aprobada por el coordinador: genera el oficio en Word
 * (o indica que ya lo tiene), sube el PDF firmado y con eso la aprueba definitivamente.
 * Lo usan paz y salvo, homologación y reingreso.
 */
@Component({
  selector: 'app-oficio-secretaria',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    CardContainerComponent,
    DocumentGeneratorComponent,
    DocumentationViewerComponent,
    SolicitudesBandejaComponent
  ],
  templateUrl: './oficio-secretaria.component.html',
  styleUrls: ['../secretaria-comun.css', './oficio-secretaria.component.css']
})
export class OficioSecretariaComponent<S extends SolicitudAprobable> implements OnInit {
  readonly config = input.required<ConfigOficioSecretaria<S>>();
  private readonly bandeja = viewChild<SolicitudesBandejaComponent<S>>('bandeja');

  private readonly documentGenerator = inject(DocumentGeneratorService);
  private readonly snackbar = inject(SnackbarService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly destroyRef = inject(DestroyRef);

  pendientes: S[] = [];
  procesadas: S[] = [];
  seleccionada: S | null = null;
  private periodo: string | null = null;

  // Flujo del PDF: generar Word (o indicar que ya se tiene) -> elegir PDF -> subir y aprobar
  generando = false;
  documentoGenerado = false;
  documentoHabilitado = false;
  archivoPDF: File | null = null;
  subiendoPDF = false;
  enviandoPDF = false;

  ngOnInit(): void {
    this.cargarPendientes();
    this.cargarProcesadas();
  }

  get ocupado(): boolean {
    return this.subiendoPDF || this.enviandoPDF;
  }

  // ===== Listados =====

  cargarPendientes(): void {
    this.config().pendientes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (sols) => this.pendientes = sols,
      error: (err) => this.mostrarError(err, 'Error al cargar solicitudes')
    });
  }

  cargarProcesadas(): void {
    this.config().procesadas(this.periodo ?? undefined).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (sols) => this.procesadas = sols,
      error: (err) => this.mostrarError(err, 'Error al cargar historial de solicitudes procesadas')
    });
  }

  onPeriodoChange(periodo: string | null): void {
    this.periodo = periodo;
    this.cargarProcesadas();
  }

  onSolicitudSeleccionada(solicitud: S | null): void {
    this.limpiarEstado();
    this.seleccionada = solicitud;
  }

  // ===== Oficio =====

  onTengoDocumento(): void {
    this.documentoHabilitado = true;
    this.snackbar.info('Sección de carga de PDF habilitada. Ahora puedes subir tu documento.');
  }

  /** Genera y descarga el oficio en Word; el estado de la solicitud no cambia. */
  onGenerarDocumento(request: DocumentRequest): void {
    if (!this.seleccionada) return;
    const nombreEstudiante = this.seleccionada.objUsuario.nombre_completo;

    this.generando = true;
    this.documentGenerator.generarDocumento(request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (blob) => {
        descargarBlob(blob, `${request.tipoDocumento}_${nombreEstudiante}_${new Date().getFullYear()}.docx`);
        this.documentoGenerado = true;
        this.generando = false;
        this.snackbar.exito('Documento Word generado y descargado. Ahora sube el PDF para enviar al estudiante.');
      },
      error: (err) => {
        this.generando = false;
        this.mostrarError(err, 'Error al generar documento');
      }
    });
  }

  onCancelarGeneracion(): void {
    this.limpiarEstado();
    this.seleccionada = null;
    this.bandeja()?.resetSelection();
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

  /** Sube el PDF y, si sale bien, aprueba definitivamente la solicitud. */
  enviarDocumento(): void {
    if (!this.archivoPDF || !this.seleccionada) {
      this.snackbar.advertencia('Por favor selecciona un archivo PDF');
      return;
    }
    const id = this.seleccionada.id_solicitud;
    const { subirPdf, aprobar } = this.config();

    this.subiendoPDF = true;
    let pdfSubido = false;
    subirPdf(id, this.archivoPDF).pipe(
      tap(() => {
        pdfSubido = true;
        this.subiendoPDF = false;
        this.enviandoPDF = true;
      }),
      switchMap(() => aprobar(id)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.snackbar.exito('Documento enviado al estudiante y solicitud aprobada exitosamente');
        this.limpiarEstado();
        this.seleccionada = null;
        this.bandeja()?.resetSelection();
        this.cargarPendientes();
        this.cargarProcesadas();
      },
      error: (err) => {
        this.subiendoPDF = false;
        this.enviandoPDF = false;
        // Si el PDF ya quedó subido hay que decirlo así, aunque el backend traiga su propio mensaje
        if (pdfSubido) this.snackbar.error('PDF subido pero error al enviar al estudiante');
        else this.mostrarError(err, 'Error al subir archivo PDF');
      }
    });
  }

  private limpiarEstado(): void {
    this.generando = false;
    this.documentoGenerado = false;
    this.documentoHabilitado = false;
    this.archivoPDF = null;
    this.subiendoPDF = false;
    this.enviandoPDF = false;
  }

  private mostrarError(err: unknown, porDefecto: string): void {
    this.snackbar.error(this.errorHandler.extraerMensajeError(err) || porDefecto);
  }
}
