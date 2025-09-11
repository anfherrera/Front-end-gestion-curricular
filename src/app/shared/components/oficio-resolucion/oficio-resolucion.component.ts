import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Solicitud } from '../../../core/models/procesos.model';

@Component({
  selector: 'app-oficio-resolucion',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule
  ],
  templateUrl: './oficio-resolucion.component.html',
  styleUrls: ['./oficio-resolucion.component.css']
})
export class OficioResolucionComponent {
  @Input() solicitud!: Solicitud; // La solicitud seleccionada
  @Input() modo: 'secretaria' | 'coordinador' = 'secretaria'; // Para adaptar título o botones
  @Output() enviar = new EventEmitter<string>(); // Emitimos el contenido del oficio

  contenidoOficio: string = '';

  ngOnChanges() {
    if (this.solicitud) {
      this.prellenarOficio();
    }
  }

  prellenarOficio() {
    // Generamos un texto base con los datos del estudiante y solicitud
    const nombre = this.solicitud.nombre;
    const fecha = this.solicitud.fecha;
    const estado = this.solicitud.estado;

    this.contenidoOficio = `
Estimado(a) ${nombre},

En relación con su solicitud de paz y salvo presentada el ${fecha}, informamos que la misma ha sido ${estado?.toLowerCase()}.

Favor tener en cuenta las indicaciones correspondientes.
    
Atentamente,
${this.modo === 'secretaria' ? 'Secretaría Académica' : 'Coordinador'}
    `;
  }

  enviarOficio() {
    if (!this.contenidoOficio.trim()) return;
    this.enviar.emit(this.contenidoOficio);
  }
}
