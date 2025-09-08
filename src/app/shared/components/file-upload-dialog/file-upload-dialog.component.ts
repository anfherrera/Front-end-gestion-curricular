import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

interface Archivo {
  nombre: string;
  fecha: string;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, FormsModule],
  templateUrl: './file-upload-dialog.component.html',
  styleUrls: ['./file-upload-dialog.component.css']
})
export class FileUploadComponent {
  archivos: Archivo[] = [];
  allowedExtensions: string[] = ['pdf'];

  // Maneja la selección de archivos
  onFileSelected(event: any) {
    const selectedFiles: FileList = event.target.files;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles.item(i);
      if (file && this.isAllowedExtension(file)) {
        this.archivos.push({
          nombre: file.name,
          fecha: new Date().toLocaleDateString()
        });
      }
    }

    // Reset input para permitir volver a subir el mismo archivo si es necesario
    event.target.value = '';
  }

  // Valida extensión
  private isAllowedExtension(file: File): boolean {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ext ? this.allowedExtensions.includes(ext) : false;
  }

  // Elimina archivo
  removeFile(index: number) {
    this.archivos.splice(index, 1);
  }

  // Verifica si se pueden enviar los archivos
  canSend(): boolean {
    return this.archivos.length === 7;
  }

  // Enviar solicitud
  enviarSolicitud() {
    console.log('Solicitud enviada con archivos:', this.archivos);
    alert('Solicitud enviada con éxito.');
    this.archivos = []; // Limpia lista tras enviar
  }
}
