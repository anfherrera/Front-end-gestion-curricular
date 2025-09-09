import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface Archivo {
  nombre: string;
  fecha: string;
}

@Component({
  selector: 'app-required-docs',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './required-docs.component.html',
  styleUrls: ['./required-docs.component.css']
})
export class RequiredDocsComponent {
  @Input() requiredFiles: string[] = [];
  @Input() archivos: Archivo[] = [];

  /** Verifica si un archivo está subido */
  isUploaded(file: string): boolean {
    if (file === 'Formato TI-G o Formato PP-H') {
      return (
        this.archivos.some(a => a.nombre.includes('Formato TI-G')) ||
        this.archivos.some(a => a.nombre.includes('Formato PP-H'))
      );
    }
    return this.archivos.some(a => a.nombre.includes(file));
  }

  /** Cambia el texto dinámicamente según cuál archivo se subió */
  getFileLabel(file: string): string {
    if (file === 'Formato TI-G o Formato PP-H') {
      if (this.archivos.some(a => a.nombre.includes('Formato TI-G'))) {
        return 'Formato TI-G';
      }
      if (this.archivos.some(a => a.nombre.includes('Formato PP-H'))) {
        return 'Formato PP-H';
      }
    }
    return file;
  }
}
