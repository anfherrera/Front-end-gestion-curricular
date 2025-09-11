import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ArchivoListComponent, ArchivoEstado } from '../archivo-list/archivo-list.component';
import { Archivo } from '../../../core/models/procesos.model';

export interface SolicitudItem {
  id: number;
  solicitante: string;
  fecha: string;
  archivos: (Archivo & { estado?: ArchivoEstado })[];
}

@Component({
  selector: 'app-solicitud-item',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, ArchivoListComponent],
  templateUrl: './solicitud-item.component.html',
  styleUrls: ['./solicitud-item.component.css']
})
export class SolicitudItemComponent {
  @Input() solicitud!: SolicitudItem;
  @Input() modo: 'estudiante' | 'funcionario' = 'funcionario';

  @Output() aprobarArchivo = new EventEmitter<number>();
  @Output() rechazarArchivo = new EventEmitter<number>();
  @Output() verArchivo = new EventEmitter<Archivo>();
  @Output() rechazarSolicitud = new EventEmitter<void>();
  @Output() terminarValidacion = new EventEmitter<void>();

  onAprobarArchivo(index: number) {
    this.aprobarArchivo.emit(index);
  }

  onRechazarArchivo(index: number) {
    this.rechazarArchivo.emit(index);
  }

  onVerArchivo(archivo: Archivo) {
    this.verArchivo.emit(archivo);
  }

  onRechazarSolicitud() {
    this.rechazarSolicitud.emit();
  }

  onTerminarValidacion() {
    this.terminarValidacion.emit();
  }
}
