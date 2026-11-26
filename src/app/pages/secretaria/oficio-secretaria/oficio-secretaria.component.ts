import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  input,
  viewChild,
  computed,
  signal,
} from '@angular/core';
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
  ServicioDocumentos,
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
    SolicitudesBandejaComponent,
  ],
  templateUrl: './oficio-secretaria.component.html',
  styleUrls: ['../secretaria-comun.css', './oficio-secretaria.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OficioSecretariaComponent<S extends SolicitudAprobable> implements OnInit {
  readonly config = input.required<ConfigOficioSecretaria<S>>();
  private readonly bandeja = viewChild<SolicitudesBandejaComponent<S>>('bandeja');

  private readonly documentGenerator = inject(DocumentGeneratorService);
  private readonly snackbar = inject(SnackbarService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pendientes = signal<S[]>([]);
  readonly procesadas = signal<S[]>([]);
  readonly seleccionada = signal<S | null>(null);
  /** La seleccionada como lista, para que el @for recree el generador al cambiar de solicitud. */
  readonly seleccionadaEnLista = computed(() => {
    const seleccionada = this.seleccionada();
    return seleccionada ? [seleccionada] : [];
  });
  private periodo: string | null = null;

  // Flujo del PDF: generar Word (o indicar que ya se tiene) -> elegir PDF -> subir y aprobar
  readonly generando = signal(false);
  readonly documentoGenerado = signal(false);
  readonly documentoHabilitado = signal(false);
  readonly archivoPDF = signal<File | null>(null);
  readonly subiendoPDF = signal(false);
  readonly enviandoPDF = signal(false);
  readonly ocupado = computed(() => this.subiendoPDF() || this.enviandoPDF());

  ngOnInit(): void {
    this.cargarPendientes();
    this.cargarProcesadas();
  }

  // ===== Listados =====

  cargarPendientes(): void {
    this.config()
      .pendientes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sols) => this.pendientes.set(sols),
        error: (err) => this.mostrarError(err, 'Error al cargar solicitudes'),
      });
  }

  cargarProcesadas(): void {
    this.config()
      .procesadas(this.periodo ?? undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sols) => this.procesadas.set(sols),
        error: (err) => this.mostrarError(err, 'Error al cargar historial de solicitudes procesadas'),
      });
  }

  onPeriodoChange(periodo: string | null): void {
    this.periodo = periodo;
    this.cargarProcesadas();
  }

  onSolicitudSeleccionada(solicitud: S | null): void {
    this.limpiarEstado();
    this.seleccionada.set(solicitud);
  }

  // ===== Oficio =====

  onTengoDocumento(): void {
    this.documentoHabilitado.set(true);
    this.snackbar.info('Sección de carga de PDF habilitada. Ahora puede subir su documento.');
  }

  /** Genera y descarga el oficio en Word; el estado de la solicitud no cambia. */
  onGenerarDocumento(request: DocumentRequest): void {
    const seleccionada = this.seleccionada();
    if (!seleccionada) return;
    const nombreEstudiante = seleccionada.objUsuario.nombre_completo;

    this.generando.set(true);
    this.documentGenerator
      .generarDocumento(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          descargarBlob(blob, `${request.tipoDocumento}_${nombreEstudiante}_${new Date().getFullYear()}.docx`);
          this.documentoGenerado.set(true);
          this.generando.set(false);
          this.snackbar.exito('Documento Word generado y descargado. Ahora suba el PDF para enviar al estudiante.');
        },
        error: (err) => {
          this.generando.set(false);
          this.mostrarError(err, 'Error al generar documento');
        },
      });
  }

  onCancelarGeneracion(): void {
    this.limpiarEstado();
    this.seleccionada.set(null);
    this.bandeja()?.resetSelection();
  }

  onArchivoSeleccionado(event: Event): void {
    const archivo = (event.target as HTMLInputElement).files?.[0];
    if (archivo && archivo.type === 'application/pdf') {
      this.archivoPDF.set(archivo);
      this.snackbar.info(`Archivo PDF seleccionado: ${archivo.name}`);
    } else {
      this.snackbar.advertencia('Por favor, seleccione un archivo PDF válido');
    }
  }

  /** Sube el PDF y, si sale bien, aprueba definitivamente la solicitud. */
  enviarDocumento(): void {
    const archivoPDF = this.archivoPDF();
    const seleccionada = this.seleccionada();
    if (!archivoPDF || !seleccionada) {
      this.snackbar.advertencia('Por favor, seleccione un archivo PDF');
      return;
    }
    const id = seleccionada.id_solicitud;
    const { subirPdf, aprobar } = this.config();

    this.subiendoPDF.set(true);
    let pdfSubido = false;
    subirPdf(id, archivoPDF)
      .pipe(
        tap(() => {
          pdfSubido = true;
          this.subiendoPDF.set(false);
          this.enviandoPDF.set(true);
        }),
        switchMap(() => aprobar(id)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.snackbar.exito('Documento enviado al estudiante y solicitud aprobada exitosamente');
          this.limpiarEstado();
          this.seleccionada.set(null);
          this.bandeja()?.resetSelection();
          this.cargarPendientes();
          this.cargarProcesadas();
        },
        error: (err) => {
          this.subiendoPDF.set(false);
          this.enviandoPDF.set(false);
          // Si el PDF ya quedó subido hay que decirlo así, aunque el backend traiga su propio mensaje
          if (pdfSubido) this.snackbar.error('PDF subido pero error al enviar al estudiante');
          else this.mostrarError(err, 'Error al subir archivo PDF');
        },
      });
  }

  private limpiarEstado(): void {
    this.generando.set(false);
    this.documentoGenerado.set(false);
    this.documentoHabilitado.set(false);
    this.archivoPDF.set(null);
    this.subiendoPDF.set(false);
    this.enviandoPDF.set(false);
  }

  private mostrarError(err: unknown, porDefecto: string): void {
    this.snackbar.error(this.errorHandler.extraerMensajeError(err) || porDefecto);
  }
}
