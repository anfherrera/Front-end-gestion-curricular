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
  @Input() requiredFiles: Documento[] = [];
  @Input() exclusiveFiles: string[] = [];
  @Input() optionalFiles: string[] = [];
  @Input() archivos: Archivo[] = [];

  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\.[^/.]+$/, '') // eliminar extensión
      .replace(/[^a-z0-9]/g, ''); // eliminar caracteres no alfanuméricos
  }

  isUploaded(file: string): boolean {
    const target = this.normalizarTexto(file);
    return this.archivos.some(a =>
      this.normalizarTexto(a.nombre).includes(target)
    );
  }

  exclusiveUploaded(): string | null {
    const exclusivosNormalizados = this.exclusiveFiles.map(nombre => this.normalizarTexto(nombre));
    const encontrados = this.archivos.filter(a =>
      exclusivosNormalizados.some(exclusivo =>
        this.normalizarTexto(a.nombre).includes(exclusivo)
      )
    );
    return encontrados.length ? encontrados[0].nombre : null;
  }

  optionalUploaded(file: string): boolean {
    const target = this.normalizarTexto(file);
    return this.archivos.some(a =>
      this.normalizarTexto(a.nombre).includes(target)
    );
  }
}
