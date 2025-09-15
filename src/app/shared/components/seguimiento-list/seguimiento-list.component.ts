import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

export interface Seguimiento {
  fecha: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  comentario?: string;
}

@Component({
  selector: 'app-seguimiento-list',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule],
  templateUrl: './seguimiento-list.component.html',
  styleUrls: ['./seguimiento-list.component.css']
})
export class SeguimientoListComponent {
  @Input() seguimiento: Seguimiento[] = [];
  displayedColumns: string[] = ['fecha', 'estado', 'comentario'];

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'aprobada': return 'check_circle';
      case 'rechazada': return 'cancel';
      case 'pendiente': return 'hourglass_top';
      default: return '';
    }
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'aprobada': return 'green';
      case 'rechazada': return 'red';
      case 'pendiente': return 'orange';
      default: return '';
    }
  }
}
