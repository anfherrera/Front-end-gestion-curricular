import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Archivo } from '../../../core/models/procesos.model';

export type ArchivoEstado = 'pendiente' | 'aprobado' | 'rechazado';

@Component({
  selector: 'app-archivo-list',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './archivo-list.component.html',
  styleUrls: ['./archivo-list.component.css']
})
export class ArchivoListComponent {
  @Input() archivos: (Archivo & { estado?: ArchivoEstado })[] = [];
  @Input() modo: 'estudiante' | 'funcionario' = 'estudiante';

  @Output() aprobar = new EventEmitter<number>();
  @Output() rechazar = new EventEmitter<number>();
  @Output() ver = new EventEmitter<Archivo>();

  aprobarArchivo(index: number) {
    this.aprobar.emit(index);
  }

  rechazarArchivo(index: number) {
    this.rechazar.emit(index);
  }

  verArchivo(archivo: Archivo) {
    this.ver.emit(archivo);
  }
}
