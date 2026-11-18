import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, ViewChild, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ActivatedRoute } from '@angular/router';
import { Observable, filter, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { DocumentoHomologacion, DocumentosDTORespuesta } from '@core/models/procesos.model';
import { RolRevision, SolicitudAprobable } from '@core/models/solicitud-revision.model';
import { EstadosSolicitud } from '@core/enums/estados-solicitud.enum';
import { SolicitudesAprobacionService } from '@core/services/base/solicitudes-aprobacion.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { ESTADO_SIN_HISTORIAL, estadoActual, normalizarEstado } from '@core/utils/estado-solicitud.util';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import {
  DocumentationViewerComponent,
  ServicioDocumentos
} from '@shared/components/documentation-viewer/documentation-viewer.component';
import { SolicitudesBandejaComponent } from '@shared/components/solicitudes-bandeja/solicitudes-bandeja.component';
import { TextoDialogComponent, datosRechazo } from '@shared/components/texto-dialog/texto-dialog.component';

/**
 * Lo que la revisión usa del servicio del proceso. Lo cumplen SolicitudesAprobacionService
 * (homologación y reingreso) y PazSalvoService.
 */
export type ServicioRevision<S> = Pick<SolicitudesAprobacionService<S>,
  | 'getPendingRequests' | 'getCoordinadorRequests'
  | 'getSolicitudesProcesadasFuncionario' | 'getSolicitudesProcesadasCoordinador'
  | 'approveRequest' | 'approveAsCoordinador' | 'rejectRequest' | 'agregarComentario'
> & ServicioDocumentos;

/** Lo que cambia entre procesos; lo que depende del rol se deduce de `rol`. */
export interface ConfigRevisionAprobacion<S extends SolicitudAprobable> {
  rol: RolRevision;
  servicio: ServicioRevision<S>;
  proceso: 'homologacion' | 'reingreso' | 'paz-salvo';
  /** Va en los botones: "Aprobar Homologación", "Rechazar Homologación". */
  nombreProceso: string;
  /**
   * Si viene, los documentos de la solicitud elegida se piden con esta función en vez de
   * leerlos de la lista (el coordinador de paz y salvo).
   */
  documentosAparte?: (idSolicitud: number) => Observable<DocumentoHomologacion[]>;
  /** Aviso tras rechazar. Por defecto, "Solicitud rechazada". */
  mensajeRechazada?: string;
  /** Título y descripción del diálogo de rechazo. Por defecto, los de `datosRechazo()`. */
  dialogoRechazo?: { titulo: string; descripcion: string };
}

/** Rol de revisión según `data.rolRevision` de la ruta (funcionario si no viene). */
export function rolRevisionDeRuta(route: ActivatedRoute): RolRevision {
  return route.snapshot.data['rolRevision'] === 'coordinador' ? 'coordinador' : 'funcionario';
}

/**
 * Revisión de solicitudes por funcionario o coordinador (homologación, reingreso y paz y
 * salvo): bandeja con pendientes e historial, documentos de la solicitud elegida y botones
 * de aprobar y rechazar.
 */
@Component({
  selector: 'app-revision-aprobacion',
  imports: [MatButtonModule, MatIconModule, CardContainerComponent, DocumentationViewerComponent, SolicitudesBandejaComponent],
  templateUrl: './revision-aprobacion.component.html',
  styleUrls: ['./revision-aprobacion.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RevisionAprobacionComponent<S extends SolicitudAprobable> implements OnInit {
  readonly config = input.required<ConfigRevisionAprobacion<S>>();
  @ViewChild('bandeja') private bandeja?: SolicitudesBandejaComponent<S>;

  private readonly snackbar = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pendientes = signal<S[]>([]);
  readonly procesadas = signal<S[]>([]);
  readonly seleccionada = signal<S | null>(null);
  private periodo: string | null = null;

  ngOnInit(): void {
    this.cargarPendientes();
    this.cargarProcesadas();
  }

  readonly esCoordinador = computed(() => this.config().rol === 'coordinador');

  readonly textoAprobar = computed(() =>
    this.esCoordinador() ? 'Aprobar Definitivamente' : `Aprobar ${this.config().nombreProceso}`);

  readonly documentos = computed<(DocumentoHomologacion | DocumentosDTORespuesta)[]>(() =>
    this.seleccionada()?.documentos ?? []);

  /** El funcionario decide las solicitudes enviadas; el coordinador, las aprobadas por el funcionario. */
  readonly puedeDecidir = computed(() => {
    const seleccionada = this.seleccionada();
    if (!seleccionada) return false;
    const estado = normalizarEstado(estadoActual(seleccionada));
    return this.esCoordinador()
      ? estado === EstadosSolicitud.APROBADA_FUNCIONARIO
      : estado === EstadosSolicitud.ENVIADA || estado === normalizarEstado(ESTADO_SIN_HISTORIAL);
  });

  /** Comentario del último rechazo, si la solicitud elegida está rechazada. */
  readonly motivoRechazo = computed<string | null>(() => {
    const seleccionada = this.seleccionada();
    if (!seleccionada || normalizarEstado(estadoActual(seleccionada)) !== EstadosSolicitud.RECHAZADA) return null;
    const rechazos = (seleccionada.estadosSolicitud ?? [])
      .filter(e => normalizarEstado(e.estado_actual) === EstadosSolicitud.RECHAZADA);
    return rechazos.at(-1)?.comentario || null;
  });

  // ===== Listados =====

  cargarPendientes(): void {
    const servicio = this.config().servicio;
    const pendientes$ = this.esCoordinador() ? servicio.getCoordinadorRequests() : servicio.getPendingRequests();
    pendientes$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (sols) => {
        this.pendientes.set(sols);
        this.refrescarSeleccion(sols);
      },
      error: (err) => this.mostrarError(err, 'Error al cargar solicitudes')
    });
  }

  cargarProcesadas(): void {
    const servicio = this.config().servicio;
    const periodo = this.periodo ?? undefined;
    const procesadas$ = this.esCoordinador()
      ? servicio.getSolicitudesProcesadasCoordinador(periodo)
      : servicio.getSolicitudesProcesadasFuncionario(periodo);
    procesadas$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (sols) => this.procesadas.set(sols),
      error: (err) => this.mostrarError(err, 'Error al cargar historial de solicitudes procesadas')
    });
  }

  onPeriodoChange(periodo: string | null): void {
    this.periodo = periodo;
    this.cargarProcesadas();
  }

  onSolicitudSeleccionada(solicitud: S | null): void {
    this.seleccionar(solicitud);
  }

  /** Tras recargar las pendientes, la selección pasa a la copia nueva (con los comentarios al día). */
  private refrescarSeleccion(sols: S[]): void {
    const id = this.seleccionada()?.id_solicitud;
    if (id === undefined) return;
    const recargada = sols.find(sol => sol.id_solicitud === id) ?? null;
    this.seleccionar(recargada);
    if (!recargada) this.bandeja?.resetSelection();
  }

  private seleccionar(solicitud: S | null): void {
    this.seleccionada.set(solicitud);
    const documentosAparte = this.config().documentosAparte;
    if (!solicitud || !documentosAparte) return;

    const id = solicitud.id_solicitud;
    documentosAparte(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (documentos) => this.ponerDocumentos(id, documentos),
      error: (err) => {
        this.ponerDocumentos(id, []);
        this.mostrarError(err, 'Error al cargar documentos');
      }
    });
  }

  /** Si sigue elegida la misma solicitud, la cambia por una copia con esos documentos. */
  private ponerDocumentos(idSolicitud: number, documentos: DocumentoHomologacion[]): void {
    this.seleccionada.update(sol => sol?.id_solicitud === idSolicitud ? { ...sol, documentos } : sol);
  }

  onComentarioAgregado(event: { documento: DocumentoHomologacion | DocumentosDTORespuesta; comentario: string }): void {
    if (!event.documento.id_documento) return;
    this.config().servicio.agregarComentario(event.documento.id_documento, event.comentario)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.snackbar.exito('Comentario añadido correctamente');
          this.cargarPendientes();
        },
        error: (err) => this.mostrarError(err, 'Error al añadir comentario')
      });
  }

  // ===== Decisión =====

  aprobar(): void {
    const id = this.seleccionada()?.id_solicitud;
    if (id === undefined) return;
    const servicio = this.config().servicio;
    const aprobar$ = this.esCoordinador() ? servicio.approveAsCoordinador(id) : servicio.approveRequest(id);
    const mensaje = this.esCoordinador() ? 'Solicitud aprobada definitivamente' : 'Solicitud aprobada';

    aprobar$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.finalizarDecision(mensaje),
      error: (err) => this.mostrarError(err, 'Error al aprobar solicitud')
    });
  }

  rechazar(): void {
    const id = this.seleccionada()?.id_solicitud;
    if (id === undefined) return;
    const { dialogoRechazo, mensajeRechazada } = this.config();
    const data = datosRechazo(dialogoRechazo?.titulo, dialogoRechazo?.descripcion);

    this.dialog.open(TextoDialogComponent, { width: '450px', data }).afterClosed().pipe(
      filter((motivo: string | undefined): motivo is string => !!motivo),
      switchMap(motivo => this.config().servicio.rejectRequest(id, motivo)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.finalizarDecision(mensajeRechazada ?? 'Solicitud rechazada'),
      error: (err) => this.mostrarError(err, 'Error al rechazar solicitud')
    });
  }

  private finalizarDecision(mensaje: string): void {
    this.snackbar.exito(mensaje);
    this.seleccionada.set(null);
    this.bandeja?.resetSelection();
    this.cargarPendientes();
    this.cargarProcesadas();
  }

  private mostrarError(err: unknown, porDefecto: string): void {
    this.snackbar.error(this.errorHandler.extraerMensajeError(err) || porDefecto);
  }
}
