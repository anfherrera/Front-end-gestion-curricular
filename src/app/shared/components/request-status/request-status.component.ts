import { Component, ChangeDetectionStrategy, computed, input, output, signal } from '@angular/core';

import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';

import { Solicitud } from '@core/models/procesos.model';
import { OficioDescargaComponent } from '../oficio-descarga/oficio-descarga.component';
import { FechaPipe } from '../../pipes/fecha.pipe';
import { EstadoColorPipe, EstadoIconoPipe, EstadoLabelPipe } from '../../pipes/estado.pipes';
import { EstadosSolicitud } from '@core/enums/estados-solicitud.enum';
import { normalizarEstado } from '@core/utils/estado-solicitud.util';

/**
 * Componente de tabla para mostrar el estado de solicitudes
 * Permite visualizar, seleccionar y realizar acciones sobre solicitudes
 */
@Component({
  selector: 'app-request-status-table',
  imports: [
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    OficioDescargaComponent,
    FechaPipe,
    EstadoColorPipe,
    EstadoIconoPipe,
    EstadoLabelPipe
],
  templateUrl: './request-status.component.html',
  styleUrls: ['./request-status.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequestStatusTableComponent {
  readonly solicitudes = input<Solicitud[]>([]);
  readonly showOficio = input(true);
  readonly showComentarios = input(false);
  readonly showSeleccionar = input(false);
  readonly headerAcciones = input('Oficio/Resolución');
  readonly verComentarios = output<number>();
  readonly solicitudSeleccionada = output<number | null>();
  readonly descargarOficio = output<{ id: number; nombreArchivo: string }>();
  readonly mostrarInfoPreregistro = output<void>();

  readonly displayedColumns = computed(() => [
    'nombre', 'fecha', 'estado',
    ...(this.showOficio() ? ['acciones'] : []),
    ...(this.showComentarios() ? ['comentarios'] : []),
    ...(this.showSeleccionar() ? ['seleccionar'] : [])
  ]);
  readonly selectedSolicitudId = signal<number | null>(null);

  onVerComentarios(solicitudId: number): void {
    this.verComentarios.emit(solicitudId);
  }

  /**
   * Maneja la selección/deselección de una solicitud
   * @param solicitudId ID de la solicitud a seleccionar
   */
  onSeleccionarSolicitud(solicitudId: number): void {
    // Si ya está seleccionada, deseleccionar
    this.selectedSolicitudId.update(actual => actual === solicitudId ? null : solicitudId);

    // Emitir el ID de la solicitud seleccionada (o null si se deseleccionó)
    this.solicitudSeleccionada.emit(this.selectedSolicitudId());
  }

  /**
   * Verifica si una solicitud está seleccionada
   * @param solicitudId ID de la solicitud a verificar
   * @returns true si la solicitud está seleccionada
   */
  isSelected(solicitudId: number): boolean {
    return this.selectedSolicitudId() === solicitudId;
  }

  /**
   * Resetea la selección de solicitudes
   * Llamado desde el componente padre cuando se necesita limpiar la selección
   */
  resetSelection(): void {
    this.selectedSolicitudId.set(null);
  }

  onDescargarOficio(solicitudId: number): void {
    // Por ahora, usamos un nombre genérico. En el futuro se puede obtener del backend
    const nombreArchivo = `oficio_homologacion_${solicitudId}.docx`;
    this.descargarOficio.emit({ id: solicitudId, nombreArchivo });
  }

  onMostrarInfoPreregistro(): void {
    this.mostrarInfoPreregistro.emit();
  }

  puedeDescargarOficio(estado: string): boolean {
    return normalizarEstado(estado) === EstadosSolicitud.APROBADA;
  }

  esEstadoPreregistrado(estado: string): boolean {
    return normalizarEstado(estado) === EstadosSolicitud.PRE_REGISTRADO;
  }

  esSolicitudRechazada(estado: string): boolean {
    return normalizarEstado(estado) === EstadosSolicitud.RECHAZADA;
  }
}
