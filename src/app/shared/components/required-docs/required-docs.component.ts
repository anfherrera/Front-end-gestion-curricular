import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

export interface Archivo {
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
    return this.archivos.some(a => a.nombre.includes(file));
  }
}
