import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';

import { Solicitud } from '../../../core/models/procesos.model';
import { SolicitudRevisable } from '../../../core/models/solicitud-revision.model';
import { aFilaSolicitud } from '../../../core/utils/fila-solicitud.util';
import { CardContainerComponent } from '../card-container/card-container.component';
import { RequestStatusTableComponent } from '../request-status/request-status.component';
import { PeriodoFiltroSelectorComponent } from '../periodo-filtro-selector/periodo-filtro-selector.component';

/**
 * Pestañas "Pendientes de procesar" (con selección) e "Historial" (con filtro de período)
 * de las pantallas que revisan solicitudes. Recibe las solicitudes tal como llegan del
 * backend, arma las filas de la tabla y devuelve la solicitud elegida.
 */
@Component({
  selector: 'app-solicitudes-bandeja',
  standalone: true,
  imports: [CommonModule, MatTabsModule, CardContainerComponent, RequestStatusTableComponent, PeriodoFiltroSelectorComponent],
  templateUrl: './solicitudes-bandeja.component.html',
  styleUrls: ['./solicitudes-bandeja.component.css']
})
export class SolicitudesBandejaComponent<S extends SolicitudRevisable = SolicitudRevisable> {
  @Input() set pendientes(solicitudes: S[]) {
    this.pendientesOriginales = solicitudes ?? [];
    this.filasPendientes = this.pendientesOriginales.map(aFilaSolicitud);
  }

  @Input() set procesadas(solicitudes: S[]) {
    this.filasProcesadas = (solicitudes ?? []).map(aFilaSolicitud);
  }

  /** Solicitud pendiente elegida, o null al quitar la selección. */
  @Output() solicitudSeleccionada = new EventEmitter<S | null>();
  /** Período del historial; null significa todos los períodos. */
  @Output() periodoChange = new EventEmitter<string | null>();

  @ViewChild('tablaPendientes') private tablaPendientes?: RequestStatusTableComponent;

  filasPendientes: Solicitud[] = [];
  filasProcesadas: Solicitud[] = [];
  private pendientesOriginales: S[] = [];

  onFilaSeleccionada(id: number | null): void {
    const solicitud = id === null ? undefined : this.pendientesOriginales.find(sol => sol.id_solicitud === id);
    this.solicitudSeleccionada.emit(solicitud ?? null);
  }

  onPeriodoChange(periodo: string): void {
    this.periodoChange.emit(periodo === 'todos' || !periodo ? null : periodo);
  }

  /** Quita la selección de la tabla de pendientes (tras aprobar o rechazar). */
  resetSelection(): void {
    this.tablaPendientes?.resetSelection();
  }
}
