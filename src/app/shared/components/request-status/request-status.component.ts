import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';

import { Solicitud } from '../../../core/models/procesos.model';
import { SolicitudStatusEnum } from '../../../core/enums/solicitud-status.enum';
import { OficioDescargaComponent } from '../oficio-descarga/oficio-descarga.component';

@Component({
  selector: 'app-request-status-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    OficioDescargaComponent
  ],
  templateUrl: './request-status.component.html',
  styleUrls: ['./request-status.component.css']
})
export class RequestStatusTableComponent implements OnInit {
  @Input() solicitudes: Solicitud[] = [];
  @Input() showOficio: boolean = true; // 👈 controla si se muestra la columna
  @Input() showComentarios: boolean = false; // 👈 controla si se muestra la columna de comentarios
  @Input() showSeleccionar: boolean = false; // 👈 controla si se muestra la columna de seleccionar
  @Output() verComentarios = new EventEmitter<number>(); // 👈 emite el ID de la solicitud
  @Output() solicitudSeleccionada = new EventEmitter<number>(); // 👈 emite el ID de la solicitud seleccionada
  @Output() descargarOficio = new EventEmitter<{id: number, nombreArchivo: string}>(); // 👈 emite datos para descargar oficio

  displayedColumns: string[] = ['nombre', 'fecha', 'estado'];

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

  onSeleccionarSolicitud(solicitudId: number): void {
    this.solicitudSeleccionada.emit(solicitudId);
  }

  onDescargarOficio(solicitudId: number): void {
    // Por ahora, usamos un nombre genérico. En el futuro se puede obtener del backend
    const nombreArchivo = `oficio_homologacion_${solicitudId}.docx`;
    this.descargarOficio.emit({ id: solicitudId, nombreArchivo });
  }

  puedeDescargarOficio(estado: string): boolean {
    const estadoUpper = estado.toUpperCase();
    return estadoUpper === 'APROBADA' || estadoUpper === 'APROBADA_COORDINADOR';
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
      default: return 'gray';
    }
  }
}
