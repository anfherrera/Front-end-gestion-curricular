import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
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
  opcional?: boolean;
}

/**
 * Componente para mostrar la documentación requerida según el programa del estudiante
 * Maneja lógica específica para programas como Telemática, Sistemas, etc.
 */
@Component({
  selector: 'app-required-docs',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './required-docs.component.html',
  styleUrls: ['./required-docs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequiredDocsComponent {
  /** Lista de documentos requeridos */
  @Input() requiredFiles: Documento[] = [];
  
  /** Archivos que son mutuamente exclusivos */
  @Input() exclusiveFiles: string[] = [];
  
  /** Archivos opcionales */
  @Input() optionalFiles: string[] = [];
  
  /** Archivos ya subidos por el estudiante */
  @Input() archivos: Archivo[] = [];
  
  /** Nombre del programa del estudiante */
  @Input() programaEstudiante: string = '';
  
  /** Indica si es para el proceso de Paz y Salvo */
  @Input() esPazYSalvo: boolean = false;

  get esTelematica(): boolean {
    if (!this.programaEstudiante) return false;
    const programa = this.programaEstudiante.toLowerCase().trim();
    return programa.includes('telemática') || programa.includes('telematica');
  }

  get esSistemasElectronicaAutomatica(): boolean {
    if (!this.programaEstudiante) return false;
    const programa = this.programaEstudiante.toLowerCase().trim();
    // Verificar variaciones del nombre del programa
    return programa.includes('sistemas') || 
           programa.includes('electrónica') || 
           programa.includes('electronica') ||
           programa.includes('electrónica y telecomunicaciones') ||
           programa.includes('electronica y telecomunicaciones') ||
           programa.includes('automática') ||
           programa.includes('automatica') ||
           programa.includes('automatización') ||
           programa.includes('automatizacion') ||
           programa.includes('ingeniería de sistemas') ||
           programa.includes('ingenieria de sistemas') ||
           programa.includes('ingeniería en sistemas') ||
           programa.includes('ingenieria en sistemas');
  }

  get documentosObligatorios(): Documento[] {
    if (this.esTelematica) {
      return []; // Telemática solo sube la cédula, no los 4 documentos obligatorios
    }
    return this.requiredFiles.filter(doc => doc.obligatorio);
  }

  get documentosSegunModalidad(): Documento[] {
    if (this.esTelematica) {
      return []; // Telemática no necesita estos formatos
    }
    return this.requiredFiles.filter(doc => !doc.obligatorio && !doc.opcional);
  }

  get documentosOpcionales(): Documento[] {
    return this.requiredFiles.filter(doc => doc.opcional === true);
  }

  get archivosExclusivosFiltrados(): string[] {
    if (this.esSistemasElectronicaAutomatica) {
      return this.exclusiveFiles; // Solo para Sistemas, Electrónica, Automática
    }
    return []; // No mostrar para otros programas
  }

  get archivosOpcionalesFiltrados(): string[] {
    return []; // Ya no hay opcionales, la cédula es obligatoria para Telemática
  }

  get archivosObligatoriosTelematica(): string[] {
    if (this.esTelematica) {
      return this.optionalFiles; // Para Telemática, la cédula es obligatoria
    }
    return []; // No mostrar para otros programas
  }

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
