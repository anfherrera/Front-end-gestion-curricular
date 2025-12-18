import { Component, Input, OnInit, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';

import { Solicitud } from '../../../core/models/procesos.model';
import { SolicitudStatusEnum } from '../../../core/enums/solicitud-status.enum';
import { OficioDescargaComponent } from '../oficio-descarga/oficio-descarga.component';
import { FechaPipe } from '../../pipes/fecha.pipe';

/**
 * Componente de tabla para mostrar el estado de solicitudes
 * Permite visualizar, seleccionar y realizar acciones sobre solicitudes
 */
@Component({
  selector: 'app-request-status-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    OficioDescargaComponent,
    FechaPipe
  ],
  templateUrl: './request-status.component.html',
  styleUrls: ['./request-status.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequestStatusTableComponent implements OnInit {
  @Input() solicitudes: Solicitud[] = [];
  @Input() showOficio: boolean = true;
  @Input() showComentarios: boolean = false;
  @Input() showSeleccionar: boolean = false;
  @Input() headerAcciones: string = 'Oficio/Resolución';
  @Output() verComentarios = new EventEmitter<number>();
  @Output() solicitudSeleccionada = new EventEmitter<number | null>();
  @Output() descargarOficio = new EventEmitter<{id: number, nombreArchivo: string}>();
  @Output() mostrarInfoPreregistro = new EventEmitter<void>();

  displayedColumns: string[] = ['nombre', 'fecha', 'estado'];
  selectedSolicitudId: number | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    if (this.showOficio) {
      this.displayedColumns.push('acciones');
    }
    if (this.showComentarios) {
      this.displayedColumns.push('comentarios');
    }
    if (this.showSeleccionar) {
      this.displayedColumns.push('seleccionar');
    }
  }

  onVerComentarios(solicitudId: number): void {
    this.verComentarios.emit(solicitudId);
  }

  /**
   * Maneja la selección/deselección de una solicitud
   * @param solicitudId ID de la solicitud a seleccionar
   */
  onSeleccionarSolicitud(solicitudId: number): void {
    // Si ya está seleccionada, deseleccionar
    if (this.selectedSolicitudId === solicitudId) {
      this.selectedSolicitudId = null;
    } else {
      // Seleccionar nueva solicitud
      this.selectedSolicitudId = solicitudId;
    }

    // Marcar para detección de cambios con OnPush
    this.cdr.markForCheck();

    // Emitir el ID de la solicitud seleccionada (o null si se deseleccionó)
    this.solicitudSeleccionada.emit(this.selectedSolicitudId);
  }

  /**
   * Verifica si una solicitud está seleccionada
   * @param solicitudId ID de la solicitud a verificar
   * @returns true si la solicitud está seleccionada
   */
  isSelected(solicitudId: number): boolean {
    return this.selectedSolicitudId === solicitudId;
  }

  /**
   * Resetea la selección de solicitudes
   * Llamado desde el componente padre cuando se necesita limpiar la selección
   */
  resetSelection(): void {
    this.selectedSolicitudId = null;
    this.cdr.markForCheck();
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
    const estadoUpper = estado.toUpperCase();
    return estadoUpper === 'APROBADA';
  }

  esEstadoPreregistrado(estado: string): boolean {
    const estadoUpper = estado.toUpperCase();
    return estadoUpper === 'PRE_REGISTRADO' || estadoUpper === 'PRE-REGISTRADO' || estadoUpper === 'PREREGISTRADO';
  }

  esSolicitudRechazada(estado: string): boolean {
    return estado === 'RECHAZADA' || estado === 'Rechazada';
  }

  getEstadoIcon(estado: string): string {
    const estadoUpper = estado.toUpperCase();
    switch (estadoUpper) {
      case 'APROBADA':
      case 'APROBADA_FUNCIONARIO':
      case 'APROBADA_COORDINADOR':
        return 'check_circle';
      case 'RECHAZADA':
        return 'cancel';
      case 'ENVIADA':
        return 'send';
      case 'EN_REVISION_SECRETARIA':
      case 'EN_REVISION_FUNCIONARIO':
      case 'EN_REVISION_COORDINADOR':
      case 'EN REVISIÓN':
        return 'hourglass_top';
      case 'PRE_REGISTRADO':
      case 'PRE-REGISTRADO':
      case 'PREREGISTRADO':
        return 'info';
      default: return 'info';
    }
  }

  getEstadoColor(estado: string): string {
    const estadoUpper = estado.toUpperCase();
    switch (estadoUpper) {
      case 'APROBADA':
      case 'APROBADA_FUNCIONARIO':
      case 'APROBADA_COORDINADOR':
        return 'green';
      case 'RECHAZADA':
        return 'red';
      case 'ENVIADA':
        return 'blue';
      case 'EN_REVISION_SECRETARIA':
      case 'EN_REVISION_FUNCIONARIO':
      case 'EN_REVISION_COORDINADOR':
      case 'EN REVISIÓN':
        return 'orange';
      case 'PRE_REGISTRADO':
      case 'PRE-REGISTRADO':
      case 'PREREGISTRADO':
        return '#1976d2';
      default: return 'gray';
    }
  }
}
