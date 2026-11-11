import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';

import { Solicitud } from '../../../core/models/procesos.model';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { RequestStatusTableComponent } from '../../../shared/components/request-status/request-status.component';
import { PeriodoFiltroSelectorComponent } from '../../../shared/components/periodo-filtro-selector/periodo-filtro-selector.component';

/**
 * Pestañas "Pendientes de procesar" e "Historial" de paz y salvo.
 * La usan la revisión (funcionario y coordinador) y la pantalla de secretaría.
 */
@Component({
  selector: 'app-paz-salvo-bandeja',
  standalone: true,
  imports: [CommonModule, MatTabsModule, CardContainerComponent, RequestStatusTableComponent, PeriodoFiltroSelectorComponent],
  templateUrl: './paz-salvo-bandeja.component.html',
  styleUrls: ['./paz-salvo-bandeja.component.css']
})
export class PazSalvoBandejaComponent {
  @Input() pendientes: Solicitud[] = [];
  @Input() procesadas: Solicitud[] = [];

  /** Id de la solicitud pendiente elegida, o null al quitar la selección. */
  @Output() solicitudSeleccionada = new EventEmitter<number | null>();
  /** Período del historial; null significa todos los períodos. */
  @Output() periodoChange = new EventEmitter<string | null>();

  @ViewChild('tablaPendientes') private tablaPendientes?: RequestStatusTableComponent;

  onPeriodoChange(periodo: string): void {
    this.periodoChange.emit(periodo === 'todos' || !periodo ? null : periodo);
  }

  /** Quita la selección de la tabla de pendientes (tras aprobar o rechazar). */
  resetSelection(): void {
    this.tablaPendientes?.resetSelection();
  }
}
