import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Archivo } from '../../../core/models/procesos.model';

export interface Documento {
  label: string;
  obligatorio: boolean;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './file-upload-dialog.component.html',
  styleUrls: ['./file-upload-dialog.component.css']
})
export class FileUploadComponent {
  @Input() documentosRequeridos: Documento[] = [];
  @Input() documentosExclusivos: Documento[] = [];
  @Output() enviarSolicitud = new EventEmitter<Archivo[]>();

  archivos: Archivo[] = [];

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    Array.from(input.files).forEach(file => {
      const nombreSinExt = file.name.replace(/\.[^/.]+$/, "");

      // Evitar duplicados
      if (this.archivos.some(a => a.nombre === file.name)) return;

      // Validar que el archivo esté permitido
      const permitido = this.documentosRequeridos.concat(this.documentosExclusivos)
                            .some(d => d.label === nombreSinExt);
      if (!permitido) return;

      // Validación de exclusivos: solo uno permitido
      const esExclusivo = this.documentosExclusivos.some(d => d.label === nombreSinExt);
      if (esExclusivo) {
        const yaSubidoExclusivo = this.archivos
          .some(a => this.documentosExclusivos
                     .map(d => d.label)
                     .includes(a.nombre.replace(/\.[^/.]+$/, "")));
        if (yaSubidoExclusivo) return;
      }

      // Agregar archivo con buena práctica usando modelo global
      this.archivos.push({
        nombre: file.name,
        originalName: file.name,
        fecha: new Date().toLocaleDateString()
      });
    });

    input.value = '';
  }

  removeFile(index: number) {
    this.archivos.splice(index, 1);
  }

  canSend(): boolean {
    const subidos = this.archivos.map(a => a.nombre.replace(/\.[^/.]+$/, ""));

    // Todos los obligatorios deben estar subidos
    const obligatorios = this.documentosRequeridos
                          .filter(d => d.obligatorio)
                          .map(d => d.label);
    const obligatoriosOk = obligatorios.every(o => subidos.includes(o));

    // Solo máximo un exclusivo
    const subidosExclusivos = this.documentosExclusivos
                                .map(d => d.label)
                                .filter(label => subidos.includes(label));
    const exclusivosOk = subidosExclusivos.length <= 1;

    return obligatoriosOk && exclusivosOk;
  }

  enviar() {
    if (!this.canSend()) return;
    this.enviarSolicitud.emit(this.archivos);
    this.archivos = [];
  }
}
