import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { SolicitudStatusEnum } from '../../../core/models/solicitud-status.enum';

export interface SolicitudStatus {
  nombre: string;
  fecha: string;
  estado: SolicitudStatusEnum;   // usamos el enum aquí
  oficioUrl?: string;            // URL del oficio o resolución si existe
}

@Component({
  selector: 'app-request-status-table',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule
  ],
  templateUrl: './request-status.component.html',
  styleUrls: ['./request-status.component.css']
})
export class RequestStatusTableComponent {
  @Input() solicitudes: SolicitudStatus[] = [];

  displayedColumns: string[] = ['nombre', 'fecha', 'estado', 'acciones'];

  getEstadoIcon(estado: SolicitudStatusEnum): string {
    switch (estado) {
      case SolicitudStatusEnum.APROBADA: return 'check_circle';
      case SolicitudStatusEnum.RECHAZADA: return 'cancel';
      case SolicitudStatusEnum.ENVIADA: return 'send';
      case SolicitudStatusEnum.EN_REVISION_SECRETARIA:
      case SolicitudStatusEnum.EN_REVISION_FUNCIONARIO:
      case SolicitudStatusEnum.EN_REVISION_COORDINADOR:
        return 'hourglass_top';
      default: return 'info';
    }
  }

  getEstadoColor(estado: SolicitudStatusEnum): string {
    switch (estado) {
      case SolicitudStatusEnum.APROBADA: return 'green';
      case SolicitudStatusEnum.RECHAZADA: return 'red';
      case SolicitudStatusEnum.ENVIADA: return 'blue';
      case SolicitudStatusEnum.EN_REVISION_SECRETARIA:
      case SolicitudStatusEnum.EN_REVISION_FUNCIONARIO:
      case SolicitudStatusEnum.EN_REVISION_COORDINADOR:
        return 'orange';
      default: return 'gray';
    }
  }
}
