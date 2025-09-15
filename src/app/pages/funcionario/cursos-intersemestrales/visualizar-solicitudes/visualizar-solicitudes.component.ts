import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardContainerComponent } from '../../../../shared/components/card-container/card-container.component';
import { SeguimientoListComponent, Seguimiento } from '../../../../shared/components/seguimiento-list/seguimiento-list.component';

@Component({
  selector: 'app-visualizar-solicitudes',
  standalone: true,
  imports: [
    CommonModule,
    CardContainerComponent,
    SeguimientoListComponent
  ],
  templateUrl: './visualizar-solicitudes.component.html',
  styleUrls: ['./visualizar-solicitudes.component.css']
})
export class VisualizarSolicitudesComponent {
  seguimientoSolicitudes: Seguimiento[] = [
    { fecha: '2025-09-10', estado: 'aprobada', comentario: 'Curso aprobado exitosamente' },
    { fecha: '2025-09-12', estado: 'pendiente', comentario: 'Esperando documentación' },
    { fecha: '2025-09-14', estado: 'rechazada', comentario: 'No cumple requisitos' }
  ];
}
