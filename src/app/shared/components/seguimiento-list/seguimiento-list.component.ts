import { Component, Input, Output, EventEmitter } from '@angular/core';
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
}
