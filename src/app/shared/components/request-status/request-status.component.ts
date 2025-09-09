import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';

export interface SolicitudStatus {
  nombre: string;
  fecha: string;
  estado: 'Revisión' | 'Aprobado' | 'Rechazado' | string;
  oficioUrl?: string;   // URL del oficio o resolución si existe
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

  getEstadoIcon(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'aprobado': return 'check_circle';
      case 'rechazado': return 'cancel';
      case 'revisión':
      case 'revision': return 'hourglass_top';
      default: return 'info';
    }
  }

  getEstadoColor(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'aprobado': return 'green';
      case 'rechazado': return 'red';
      case 'revisión':
      case 'revision': return 'orange';
      default: return 'blue';
    }
  }
}
