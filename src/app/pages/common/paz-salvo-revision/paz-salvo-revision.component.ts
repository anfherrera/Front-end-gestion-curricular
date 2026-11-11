import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';

import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { Solicitud, SolicitudHomologacionDTORespuesta, DocumentoHomologacion } from '../../../core/models/procesos.model';
import { SolicitudStatusEnum } from '../../../core/enums/solicitud-status.enum';
import { RechazoDialogComponent, RechazoDialogData } from '../../../shared/components/rechazo-dialog/rechazo-dialog.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { DocumentationViewerComponent } from '../../../shared/components/documentation-viewer/documentation-viewer.component';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { PeriodoFiltroSelectorComponent } from '../../../shared/components/periodo-filtro-selector/periodo-filtro-selector.component';
import { snackbarConfig } from '../../../core/design-system/design-tokens';

/** Roles que revisan paz y salvo con esta pantalla. Secretaría tiene su propio flujo (oficio). */
export type RolRevisionPazSalvo = 'funcionario' | 'coordinador';

interface ConfigRevision {
  pendientes: (periodo?: string) => Observable<SolicitudHomologacionDTORespuesta[]>;
  procesadas: (periodo?: string) => Observable<SolicitudHomologacionDTORespuesta[]>;
  aprobar: (id: number) => Observable<any>;
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
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatTabsModule,
    CardContainerComponent,
    RequestStatusTableComponent,
    DocumentationViewerComponent,
    PeriodoFiltroSelectorComponent
  ],
  templateUrl: './paz-salvo-revision.component.html',
  styleUrls: ['./paz-salvo-revision.component.css']
})
export class PazSalvoRevisionComponent implements OnInit {
  @ViewChild('requestStatusTable') requestStatusTable!: RequestStatusTableComponent;

  rol: RolRevisionPazSalvo = 'funcionario';
  config!: ConfigRevision;

  solicitudes: Solicitud[] = [];              // Pendientes
  solicitudesProcesadas: Solicitud[] = [];    // Historial
  /** Respuesta original de pendientes, para recuperar la solicitud al seleccionarla. */
  private pendientesOriginales: SolicitudHomologacionDTORespuesta[] = [];
  selectedSolicitud: SolicitudHomologacionDTORespuesta | null = null;
  periodoAcademicoFiltro: string | null = null;

  constructor(
    public pazSalvoService: PazSalvoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

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
    this.config.pendientes().subscribe({
      next: (sols) => {
        this.pendientesOriginales = sols;
        this.solicitudes = sols.map(sol => this.aFilaTabla(sol));
      },
      error: () => {
        this.snackBar.open('Error al cargar solicitudes', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  cargarSolicitudesProcesadas(): void {
    this.config.procesadas(this.periodoAcademicoFiltro || undefined).subscribe({
      next: (sols) => {
        this.solicitudesProcesadas = sols.map(sol => ({
          ...this.aFilaTabla(sol),
          fechaProcesamiento: this.getFechaProcesamiento(sol)
        }));
      },
      error: () => {
        this.snackBar.open('Error al cargar historial de solicitudes', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  /** Fila para RequestStatusTableComponent. La fecha va en ISO: el pipe `fecha` la formatea. */
  private aFilaTabla(sol: SolicitudHomologacionDTORespuesta): Solicitud {
    const ultimoEstado = sol.estadosSolicitud?.[sol.estadosSolicitud.length - 1];
    return {
      id: sol.id_solicitud,
      nombre: sol.nombre_solicitud,
      fecha: sol.fecha_registro_solicitud,
      estado: (ultimoEstado?.estado_actual as SolicitudStatusEnum) || SolicitudStatusEnum.ENVIADA,
      comentarios: ultimoEstado?.comentario || '',
      archivos: sol.documentos?.map((doc: DocumentoHomologacion) => ({
        id_documento: doc.id_documento,
        nombre: doc.nombre,
        ruta_documento: doc.ruta_documento,
        fecha: doc.fecha_documento,
        esValido: doc.esValido,
        comentario: doc.comentario
      })) || []
    } as Solicitud;
  }

  onPeriodoChange(periodo: string): void {
    // "todos" o vacío: el backend devuelve todas las solicitudes
    this.periodoAcademicoFiltro = (periodo === 'todos' || !periodo) ? null : periodo;
    this.cargarSolicitudesProcesadas();
  }

  // ===== Selección y documentos =====

  onSolicitudSeleccionada(solicitudId: number | null): void {
    if (solicitudId === null) {
      this.selectedSolicitud = null;
      return;
    }

    this.selectedSolicitud = this.pendientesOriginales.find(sol => sol.id_solicitud === solicitudId) || null;
    if (this.selectedSolicitud && this.config.cargarDocumentosAparte) {
      this.cargarDocumentos(this.selectedSolicitud.id_solicitud);
    }
  }

  /** Documentos de la solicitud por el endpoint de coordinador. */
  private cargarDocumentos(idSolicitud: number): void {
    this.pazSalvoService.obtenerDocumentosCoordinador(idSolicitud).subscribe({
      next: (documentos: any[]) => {
        if (this.selectedSolicitud?.id_solicitud !== idSolicitud) return;
        this.selectedSolicitud.documentos = documentos.map(doc => ({
          id_documento: doc.id,
          nombre: doc.nombreArchivo || doc.nombre,
          ruta_documento: doc.ruta,
          fecha_documento: doc.fecha,
          esValido: doc.esValido,
          comentario: doc.comentario
        }));
        this.cdr.detectChanges();
      },
      error: () => {
        if (this.selectedSolicitud?.id_solicitud === idSolicitud) {
          this.selectedSolicitud.documentos = [];
          this.cdr.detectChanges();
        }
        this.snackBar.open('Error al cargar documentos', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  get documentosDelEstudiante(): DocumentoHomologacion[] {
    return this.selectedSolicitud?.documentos ?? [];
  }

  getEstadoActual(solicitud: SolicitudHomologacionDTORespuesta): string {
    const estados = solicitud.estadosSolicitud;
    return estados && estados.length > 0 ? estados[estados.length - 1].estado_actual : 'Pendiente';
  }

  /** Fecha del último estado (cuando se procesó). */
  getFechaProcesamiento(solicitud: SolicitudHomologacionDTORespuesta): string {
    const estados = solicitud.estadosSolicitud;
    const ultimo = estados && estados.length > 0 ? estados[estados.length - 1] : null;
    if (!ultimo?.fecha_registro_estado) return '';
    return new Date(ultimo.fecha_registro_estado).toLocaleString('es-ES', {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  }

  obtenerComentarioRechazo(solicitud: SolicitudHomologacionDTORespuesta): string | null {
    const rechazos = (solicitud.estadosSolicitud || []).filter(e =>
      e.estado_actual === 'RECHAZADA' || e.estado_actual === 'Rechazada'
    );
    return rechazos.length > 0 ? rechazos[rechazos.length - 1].comentario || null : null;
  }

  estaRechazada(): boolean {
    if (!this.selectedSolicitud) return false;
    const estado = this.getEstadoActual(this.selectedSolicitud);
    return estado === 'RECHAZADA' || estado === 'Rechazada';
  }

  onComentarioAgregado(event: { documento: any, comentario: string }): void {
    if (!event.documento.id_documento) return;
    this.pazSalvoService.agregarComentario(event.documento.id_documento, event.comentario).subscribe({
      next: () => {
        this.snackBar.open('Comentario añadido correctamente', 'Cerrar', snackbarConfig(['success-snackbar']));
        this.cargarSolicitudesPendientes();
      },
      error: () => {
        this.snackBar.open('Error al añadir comentario', 'Cerrar', snackbarConfig(['error-snackbar']));
      }
    });
  }

  // ===== Decisión =====

  aprobarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;
    const id = this.selectedSolicitud.id_solicitud;

    this.config.aprobar(id).subscribe({
      next: () => {
        if (!this.config.marcarDocumentosAlDecidir) {
          this.finalizarDecision(this.config.mensajeAprobada);
          return;
        }
        // No bloquear si falla la actualización de documentos
        this.pazSalvoService.actualizarEstadoDocumentos(id, this.documentosConValidez(true)).subscribe({
          next: () => this.finalizarDecision('Solicitud aprobada y documentos actualizados'),
          error: () => this.finalizarDecision('Solicitud aprobada (Documentos se actualizarán automáticamente)')
        });
      },
      error: (err) => this.mostrarErrorAprobacion(err)
    });
  }

  rechazarSolicitudSeleccionada(): void {
    if (!this.selectedSolicitud) return;
    const id = this.selectedSolicitud.id_solicitud;

    const dialogRef = this.dialog.open(RechazoDialogComponent, {
      width: '450px',
      data: <RechazoDialogData>{
        titulo: this.config.tituloRechazo,
        descripcion: this.config.descripcionRechazo,
        placeholder: 'Motivo de rechazo'
      }
    });

    dialogRef.afterClosed().subscribe((motivo: string) => {
      if (!motivo) return;
      this.pazSalvoService.rejectRequest(id, motivo).subscribe({
        next: () => {
          if (!this.config.marcarDocumentosAlDecidir) {
            this.finalizarDecision('Paz y Salvo rechazado');
            return;
          }
          this.pazSalvoService.actualizarEstadoDocumentos(id, this.documentosConValidez(false)).subscribe({
            next: () => this.finalizarDecision('Solicitud rechazada y documentos actualizados'),
            error: () => this.finalizarDecision('Solicitud rechazada, pero error al actualizar documentos', 'warning-snackbar')
          });
        },
        error: () => this.snackBar.open('Error al rechazar solicitud', 'Cerrar', snackbarConfig(['error-snackbar']))
      });
    });
  }

  private documentosConValidez(esValido: boolean): { id_documento: number; esValido: boolean }[] {
    return this.documentosDelEstudiante.map(doc => ({ id_documento: doc.id_documento, esValido }));
  }

  /** Mensaje, recarga de listas y limpieza de la selección tras aprobar o rechazar. */
  private finalizarDecision(mensaje: string, clase: string = 'success-snackbar'): void {
    this.snackBar.open(mensaje, 'Cerrar', snackbarConfig([clase]));
    this.cargarSolicitudesPendientes();
    this.cargarSolicitudesProcesadas();
    this.selectedSolicitud = null;
    this.requestStatusTable?.resetSelection();
  }

  private mostrarErrorAprobacion(err: any): void {
    const abrir = (texto: string) => this.snackBar.open(texto, 'Cerrar', snackbarConfig(['error-snackbar']));
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
