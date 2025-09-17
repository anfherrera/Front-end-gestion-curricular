import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

export interface Archivo {
  nombre: string;
  fecha: string;
}

export interface Documento {
  label: string;
  obligatorio: boolean;
}

@Component({
  selector: 'app-required-docs',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './required-docs.component.html',
  styleUrls: ['./required-docs.component.css']
})
export class RequiredDocsComponent {
  /** Documentos obligatorios y opcionales */
  @Input() requiredFiles: Documento[] = [];

  /** Archivos exclusivos (solo se puede subir uno) */
  @Input() exclusiveFiles: string[] = [];

  /** Archivos ya subidos */
  @Input() archivos: Archivo[] = [];

  /** Verifica si un archivo obligatorio está subido */
  isUploaded(file: string): boolean {
    return this.archivos.some(a => a.nombre.includes(file));
  }

  /** Verifica si algún archivo exclusivo está subido */
  exclusiveUploaded(): string | null {
    const encontrados = this.archivos.filter(a =>
      this.exclusiveFiles.includes(a.nombre)
    );
    return encontrados.length ? encontrados[0].nombre : null;
  }
}
