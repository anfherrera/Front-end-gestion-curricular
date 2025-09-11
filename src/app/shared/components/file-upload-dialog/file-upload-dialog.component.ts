import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Archivo } from '../../../core/models/procesos.model';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './file-upload-dialog.component.html',
  styleUrls: ['./file-upload-dialog.component.css']
})
export class FileUploadComponent {
  @Output() archivosChange = new EventEmitter<Archivo[]>(); // emitirá arreglo de archivos

  archivos: Archivo[] = [];

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    Array.from(input.files).forEach(file => {
      // Solo PDF
      if (file.type !== 'application/pdf') {
        alert(`Solo se permiten archivos PDF: ${file.name}`);
        return;
      }

      // Evitar duplicados
      if (this.archivos.some(a => a.nombre === file.name)) {
        alert(`Ya subiste el archivo: ${file.name}`);
        return;
      }

      // Agregar archivo
      this.archivos.push({
        nombre: file.name,
        originalName: file.name,
        fecha: new Date().toLocaleDateString()
      });
    });

    input.value = ''; 
    this.archivosChange.emit(this.archivos); // emitir arreglo actualizado
  }

  removeFile(index: number) {
    this.archivos.splice(index, 1);
    this.archivosChange.emit(this.archivos); // emitir arreglo actualizado
  }
}
