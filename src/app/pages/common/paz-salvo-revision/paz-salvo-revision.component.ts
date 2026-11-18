import { ChangeDetectionStrategy, Component, OnInit, ViewChild, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

import { ActivatedRoute } from '@angular/router';
import { Observable, filter, switchMap } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { PazSalvoService } from '@core/services/paz-salvo.service';
import { SolicitudHomologacionDTORespuesta, DocumentoHomologacion, DocumentosDTORespuesta } from '@core/models/procesos.model';
import { DocumentationViewerComponent } from '@shared/components/documentation-viewer/documentation-viewer.component';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';
import { SolicitudesBandejaComponent } from '@shared/components/solicitudes-bandeja/solicitudes-bandeja.component';
import { aDocumentos } from './paz-salvo-filas';
import { estadoActual } from '@core/utils/estado-solicitud.util';
import { TextoDialogComponent, datosRechazo } from '@shared/components/texto-dialog/texto-dialog.component';
import { SnackbarService } from '@core/services/snackbar.service';

/** Roles que revisan paz y salvo con esta pantalla. Secretaría tiene su propio flujo (oficio). */
export type RolRevisionPazSalvo = 'funcionario' | 'coordinador';

interface ConfigRevision {
  pendientes: (periodo?: string) => Observable<SolicitudHomologacionDTORespuesta[]>;
  procesadas: (periodo?: string) => Observable<SolicitudHomologacionDTORespuesta[]>;
  aprobar: (id: number) => Observable<unknown>;
  /** El coordinador consulta los documentos aparte; al funcionario le llegan con la lista. */
  cargarDocumentosAparte: boolean;
  textoAprobar: string;
  mensajeAprobada: string;
  tituloRechazo: string;
  descripcionRechazo: string;
}

/**
 * Revisión de solicitudes de paz y salvo para funcionario y coordinador.
 * El rol llega como dato de la ruta (data.rolRevision) desde gestion.routes.ts.
 */
@Component({
  selector: 'app-paz-salvo-revision',
  imports: [
    MatButtonModule,
    MatIconModule,
    CardContainerComponent,
    DocumentationViewerComponent,
    SolicitudesBandejaComponent
],
  templateUrl: './paz-salvo-revision.component.html',
  styleUrls: ['./paz-salvo-revision.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PazSalvoRevisionComponent implements OnInit {
  pazSalvoService = inject(PazSalvoService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);

  @ViewChild('bandeja') bandeja?: SolicitudesBandejaComponent<SolicitudHomologacionDTORespuesta>;

  rol: RolRevisionPazSalvo = 'funcionario';
  config!: ConfigRevision;

  readonly solicitudes = signal<SolicitudHomologacionDTORespuesta[]>([]);              // Pendientes
  readonly solicitudesProcesadas = signal<SolicitudHomologacionDTORespuesta[]>([]);    // Historial
  readonly selectedSolicitud = signal<SolicitudHomologacionDTORespuesta | null>(null);
  periodoAcademicoFiltro: string | null = null;
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.rol = this.route.snapshot.data['rolRevision'] === 'coordinador' ? 'coordinador' : 'funcionario';
    this.config = this.crearConfig(this.rol);
    this.cargarSolicitudesPendientes();
    this.cargarSolicitudesProcesadas();
  }

  private crearConfig(rol: RolRevisionPazSalvo): ConfigRevision {
    const s = this.pazSalvoService;
    if (rol === 'coordinador') {
      return {
        pendientes: p => s.getCoordinatorRequests(p),
        procesadas: p => s.getSolicitudesProcesadasCoordinador(p),
        aprobar: id => s.approveAsCoordinador(id),
        cargarDocumentosAparte: true,
        textoAprobar: 'Aprobar Definitivamente',
        mensajeAprobada: 'Solicitud aprobada definitivamente',
        tituloRechazo: 'Rechazar Paz y Salvo',
        descripcionRechazo: 'Indique el motivo de rechazo del paz y salvo:'
      };
    }
    return {
      pendientes: p => s.getPendingRequests(p),
      procesadas: p => s.getSolicitudesProcesadasFuncionario(p),
      aprobar: id => s.approveRequest(id),
      cargarDocumentosAparte: false,
      textoAprobar: 'Aprobar Paz y Salvo',
      mensajeAprobada: 'Solicitud aprobada',
      tituloRechazo: 'Rechazar solicitud',
      descripcionRechazo: 'Indique el motivo de rechazo de toda la solicitud:'
    };
  }

  // ===== Listados =====

  cargarSolicitudesPendientes(): void {
    this.config.pendientes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (sols) => this.solicitudes.set(sols),
      error: () => {
        this.snackbar.error('Error al cargar solicitudes');
      }
    });
  }

  cargarSolicitudesProcesadas(): void {
    this.config.procesadas(this.periodoAcademicoFiltro || undefined).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (sols) => this.solicitudesProcesadas.set(sols),
      error: () => {
        this.snackbar.error('Error al cargar historial de solicitudes');
      }
    });
  }

  onPeriodoChange(periodo: string | null): void {
    this.periodoAcademicoFiltro = periodo;
    this.cargarSolicitudesProcesadas();
  }

  // ===== Selección y documentos =====

  onSolicitudSeleccionada(solicitud: SolicitudHomologacionDTORespuesta | null): void {
    this.selectedSolicitud.set(solicitud);
    if (solicitud && this.config.cargarDocumentosAparte) {
      this.cargarDocumentos(solicitud.id_solicitud);
    }
  }

  /** Documentos de la solicitud por el endpoint de coordinador. */
  private cargarDocumentos(idSolicitud: number): void {
    this.pazSalvoService.obtenerDocumentosCoordinador(idSolicitud).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (documentos) => this.ponerDocumentos(idSolicitud, aDocumentos(documentos)),
      error: () => {
        this.ponerDocumentos(idSolicitud, []);
        this.snackbar.error('Error al cargar documentos');
      }
    });
  }

  /** Si sigue elegida la misma solicitud, la cambia por una copia con esos documentos. */
  private ponerDocumentos(idSolicitud: number, documentos: DocumentoHomologacion[]): void {
    this.selectedSolicitud.update(sol => sol?.id_solicitud === idSolicitud ? { ...sol, documentos } : sol);
  }

  readonly documentosDelEstudiante = computed<DocumentoHomologacion[]>(() => this.selectedSolicitud()?.documentos ?? []);

  obtenerComentarioRechazo(solicitud: SolicitudHomologacionDTORespuesta): string | null {
    const rechazos = (solicitud.estadosSolicitud || []).filter(e =>
      e.estado_actual === 'RECHAZADA' || e.estado_actual === 'Rechazada'
    );
    return rechazos.length > 0 ? rechazos[rechazos.length - 1].comentario || null : null;
  }

  estaRechazada(): boolean {
    const seleccionada = this.selectedSolicitud();
    if (!seleccionada) return false;
    const estado = estadoActual(seleccionada);
    return estado === 'RECHAZADA' || estado === 'Rechazada';
  }

  onComentarioAgregado(event: { documento: DocumentoHomologacion | DocumentosDTORespuesta, comentario: string }): void {
    if (!event.documento.id_documento) return;
    this.pazSalvoService.agregarComentario(event.documento.id_documento, event.comentario).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.snackbar.exito('Comentario añadido correctamente');
        this.cargarSolicitudesPendientes();
      },
      error: () => {
        this.snackbar.error('Error al añadir comentario');
      }
    });
  }

  // ===== Decisión =====

  aprobarSolicitudSeleccionada(): void {
    const id = this.selectedSolicitud()?.id_solicitud;
    if (id === undefined) return;

    this.config.aprobar(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.finalizarDecision(this.config.mensajeAprobada),
      error: (err: HttpErrorResponse) => this.mostrarErrorAprobacion(err)
    });
  }

  rechazarSolicitudSeleccionada(): void {
    const id = this.selectedSolicitud()?.id_solicitud;
    if (id === undefined) return;

    const dialogRef = this.dialog.open(TextoDialogComponent, {
      width: '450px',
      data: datosRechazo(this.config.tituloRechazo, this.config.descripcionRechazo)
    });

    dialogRef.afterClosed().pipe(
      filter((motivo: string | undefined): motivo is string => !!motivo),
      switchMap(motivo => this.pazSalvoService.rejectRequest(id, motivo)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.finalizarDecision('Paz y Salvo rechazado'),
      error: () => this.snackbar.error('Error al rechazar solicitud')
    });
  }

  /** Mensaje, recarga de listas y limpieza de la selección tras aprobar o rechazar. */
  private finalizarDecision(mensaje: string): void {
    this.snackbar.exito(mensaje);
    this.cargarSolicitudesPendientes();
    this.cargarSolicitudesProcesadas();
    this.selectedSolicitud.set(null);
    this.bandeja?.resetSelection();
  }

  private mostrarErrorAprobacion(err: HttpErrorResponse): void {
    const abrir = (texto: string) => this.snackbar.error(texto);
    if (err?.error instanceof Blob) {
      err.error.text().then((texto: string) => {
        try {
          const datos = JSON.parse(texto);
          abrir('Error del servidor: ' + (datos.message || datos.error || 'Error desconocido'));
        } catch {
          abrir('Error del servidor: ' + texto);
        }
      });
      return;
    }
    abrir('Error al aprobar solicitud: ' + (err?.error?.message || err?.error?.error || err?.message || 'Error desconocido'));
  }
}
