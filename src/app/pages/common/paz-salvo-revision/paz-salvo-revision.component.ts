import { Component, OnInit, ViewChild, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';

import { ActivatedRoute } from '@angular/router';
import { Observable, catchError, filter, map, of, switchMap } from 'rxjs';
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
import { SnackbarService, TipoSnackbar } from '@core/services/snackbar.service';

/** Roles que revisan paz y salvo con esta pantalla. Secretaría tiene su propio flujo (oficio). */
export type RolRevisionPazSalvo = 'funcionario' | 'coordinador';

interface ConfigRevision {
  pendientes: (periodo?: string) => Observable<SolicitudHomologacionDTORespuesta[]>;
  procesadas: (periodo?: string) => Observable<SolicitudHomologacionDTORespuesta[]>;
  aprobar: (id: number) => Observable<unknown>;
  /** El coordinador consulta los documentos aparte; al funcionario le llegan con la lista. */
  cargarDocumentosAparte: boolean;
  /** El funcionario revisa los documentos: al decidir los marca como válidos o no válidos. */
  marcarDocumentosAlDecidir: boolean;
  textoAprobar: string;
  mensajeAprobada: string;
  tituloRechazo: string;
  descripcionRechazo: string;
}

/**
 * Revisión de solicitudes de paz y salvo para funcionario y coordinador.
 * El rol llega como dato de la ruta (data.rolRevision) desde app.routes.ts.
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
  styleUrls: ['./paz-salvo-revision.component.css']
})
export class PazSalvoRevisionComponent implements OnInit {
  pazSalvoService = inject(PazSalvoService);
  private snackbar = inject(SnackbarService);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('bandeja') bandeja?: SolicitudesBandejaComponent<SolicitudHomologacionDTORespuesta>;

  rol: RolRevisionPazSalvo = 'funcionario';
  config!: ConfigRevision;

  solicitudes: SolicitudHomologacionDTORespuesta[] = [];              // Pendientes
  solicitudesProcesadas: SolicitudHomologacionDTORespuesta[] = [];    // Historial
  selectedSolicitud: SolicitudHomologacionDTORespuesta | null = null;
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
        marcarDocumentosAlDecidir: false,
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
      marcarDocumentosAlDecidir: true,
      textoAprobar: 'Aprobar Paz y Salvo',
      mensajeAprobada: 'Solicitud aprobada',
      tituloRechazo: 'Rechazar solicitud',
      descripcionRechazo: 'Indique el motivo de rechazo de toda la solicitud:'
    };
  }

  // ===== Listados =====

  cargarSolicitudesPendientes(): void {
    this.config.pendientes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (sols) => this.solicitudes = sols,
      error: () => {
        this.snackbar.error('Error al cargar solicitudes');
      }
    });
  }

  cargarSolicitudesProcesadas(): void {
    this.config.procesadas(this.periodoAcademicoFiltro || undefined).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (sols) => this.solicitudesProcesadas = sols,
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
    this.selectedSolicitud = solicitud;
    if (this.selectedSolicitud && this.config.cargarDocumentosAparte) {
      this.cargarDocumentos(this.selectedSolicitud.id_solicitud);
    }
  }

  /** Documentos de la solicitud por el endpoint de coordinador. */
  private cargarDocumentos(idSolicitud: number): void {
    this.pazSalvoService.obtenerDocumentosCoordinador(idSolicitud).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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

  get documentosDelEstudiante(): DocumentoHomologacion[] {
    return this.selectedSolicitud?.documentos ?? [];
  }

  obtenerComentarioRechazo(solicitud: SolicitudHomologacionDTORespuesta): string | null {
    const rechazos = (solicitud.estadosSolicitud || []).filter(e =>
      e.estado_actual === 'RECHAZADA' || e.estado_actual === 'Rechazada'
    );
    return rechazos.length > 0 ? rechazos[rechazos.length - 1].comentario || null : null;
  }

  estaRechazada(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = estadoActual(this.selectedSolicitud);
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
    if (!this.selectedSolicitud) return;
    const id = this.selectedSolicitud.id_solicitud;

    const documentos = this.documentosConValidez(true);
    this.config.aprobar(id).pipe(
      // Si falla la actualización de documentos, la aprobación sigue valiendo
      switchMap(() => !this.config.marcarDocumentosAlDecidir
        ? of(this.config.mensajeAprobada)
        : this.pazSalvoService.actualizarEstadoDocumentos(id, documentos).pipe(
            map(() => 'Solicitud aprobada y documentos actualizados'),
            catchError(() => of('Solicitud aprobada (Documentos se actualizarán automáticamente)'))
          )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (mensaje) => this.finalizarDecision(mensaje),
      error: (err: HttpErrorResponse) => this.mostrarErrorAprobacion(err)
    });
  }

  rechazarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;
    const id = this.selectedSolicitud.id_solicitud;

    const dialogRef = this.dialog.open(TextoDialogComponent, {
      width: '450px',
      data: datosRechazo(this.config.tituloRechazo, this.config.descripcionRechazo)
    });

    const documentos = this.documentosConValidez(false);
    dialogRef.afterClosed().pipe(
      filter((motivo: string | undefined): motivo is string => !!motivo),
      switchMap(motivo => this.pazSalvoService.rejectRequest(id, motivo)),
      switchMap(() => !this.config.marcarDocumentosAlDecidir
        ? of({ mensaje: 'Paz y Salvo rechazado', tipo: 'exito' as TipoSnackbar })
        : this.pazSalvoService.actualizarEstadoDocumentos(id, documentos).pipe(
            map(() => ({ mensaje: 'Solicitud rechazada y documentos actualizados', tipo: 'exito' as TipoSnackbar })),
            catchError(() => of({ mensaje: 'Solicitud rechazada, pero error al actualizar documentos', tipo: 'advertencia' as TipoSnackbar }))
          )),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ mensaje, tipo }) => this.finalizarDecision(mensaje, tipo),
      error: () => this.snackbar.error('Error al rechazar solicitud')
    });
  }

  private documentosConValidez(esValido: boolean): { id_documento: number; esValido: boolean }[] {
    return this.documentosDelEstudiante.map(doc => ({ id_documento: doc.id_documento, esValido }));
  }

  /** Mensaje, recarga de listas y limpieza de la selección tras aprobar o rechazar. */
  private finalizarDecision(mensaje: string, tipo: TipoSnackbar = 'exito'): void {
    this.snackbar.mostrar(mensaje, tipo);
    this.cargarSolicitudesPendientes();
    this.cargarSolicitudesProcesadas();
    this.selectedSolicitud = null;
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
