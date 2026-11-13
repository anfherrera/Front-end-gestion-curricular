import { Component, computed, input, output, viewChild } from '@angular/core';

import { MatTabsModule } from '@angular/material/tabs';

import { SolicitudRevisable } from '@core/models/solicitud-revision.model';
import { aFilaSolicitud } from '@core/utils/fila-solicitud.util';
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
  imports: [MatTabsModule, CardContainerComponent, RequestStatusTableComponent, PeriodoFiltroSelectorComponent],
  templateUrl: './solicitudes-bandeja.component.html',
  styleUrls: ['./solicitudes-bandeja.component.css']
})
export class SolicitudesBandejaComponent<S extends SolicitudRevisable = SolicitudRevisable> {
  readonly pendientes = input<S[] | null | undefined>([]);
  readonly procesadas = input<S[] | null | undefined>([]);

  /** Solicitud pendiente elegida, o null al quitar la selección. */
  readonly solicitudSeleccionada = output<S | null>();
  /** Período del historial; null significa todos los períodos. */
  readonly periodoChange = output<string | null>();

  private readonly tablaPendientes = viewChild<RequestStatusTableComponent>('tablaPendientes');

  readonly filasPendientes = computed(() => (this.pendientes() ?? []).map(aFilaSolicitud));
  readonly filasProcesadas = computed(() => (this.procesadas() ?? []).map(aFilaSolicitud));

  onFilaSeleccionada(id: number | null): void {
    const solicitud = id === null ? undefined : (this.pendientes() ?? []).find(sol => sol.id_solicitud === id);
    this.solicitudSeleccionada.emit(solicitud ?? null);
  }

  onPeriodoChange(periodo: string): void {
    this.periodoChange.emit(periodo === 'todos' || !periodo ? null : periodo);
  }

  /** Quita la selección de la tabla de pendientes (tras aprobar o rechazar). */
  resetSelection(): void {
    this.tablaPendientes()?.resetSelection();
  }
}
