import { Component, ChangeDetectionStrategy, input } from '@angular/core';

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
  /** URL para descargar el formato del documento (ej. en Reingreso: PM-FO-4-FOR-17) */
  formatoDisponibleUrl?: string;
}

/**
 * Componente para mostrar la documentación requerida según el programa del estudiante
 * Maneja lógica específica para programas como Telemática, Sistemas, etc.
 */
@Component({
  selector: 'app-required-docs',
  imports: [MatCardModule, MatIconModule],
  templateUrl: './required-docs.component.html',
  styleUrls: ['./required-docs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RequiredDocsComponent {
  /** Lista de documentos requeridos */
  readonly requiredFiles = input<Documento[]>([]);
  
  /** Archivos que son mutuamente exclusivos */
  readonly exclusiveFiles = input<string[]>([]);
  
  /** Archivos opcionales */
  readonly optionalFiles = input<string[]>([]);
  
  /** Archivos ya subidos por el estudiante */
  readonly archivos = input<Archivo[]>([]);
  
  /** Nombre del programa del estudiante */
  readonly programaEstudiante = input('');
  
  /** Indica si es para el proceso de Paz y Salvo */
  readonly esPazYSalvo = input(false);

  get esTelematica(): boolean {
    const programaEstudiante = this.programaEstudiante();
    if (!programaEstudiante) return false;
    const programa = programaEstudiante.toLowerCase().trim();
    return programa.includes('telemática') || programa.includes('telematica');
  }

  get esSistemasElectronicaAutomatica(): boolean {
    const programaEstudiante = this.programaEstudiante();
    if (!programaEstudiante) return false;
    const programa = programaEstudiante.toLowerCase().trim();
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
    return this.requiredFiles().filter(doc => doc.obligatorio);
  }

  get documentosSegunModalidad(): Documento[] {
    if (this.esTelematica) {
      return []; // Telemática no necesita estos formatos
    }
    return this.requiredFiles().filter(doc => !doc.obligatorio && !doc.opcional);
  }

  get documentosOpcionales(): Documento[] {
    return this.requiredFiles().filter(doc => doc.opcional === true);
  }

  get archivosExclusivosFiltrados(): string[] {
    if (this.esSistemasElectronicaAutomatica) {
      return this.exclusiveFiles(); // Solo para Sistemas, Electrónica, Automática
    }
    return []; // No mostrar para otros programas
  }

  get archivosOpcionalesFiltrados(): string[] {
    return []; // Ya no hay opcionales, la cédula es obligatoria para Telemática
  }

  get archivosObligatoriosTelematica(): string[] {
    if (this.esTelematica) {
      return this.optionalFiles(); // Para Telemática, la cédula es obligatoria
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
    return this.archivos().some(a =>
      this.normalizarTexto(a.nombre).includes(target)
    );
  }

  exclusiveUploaded(): string | null {
    const exclusivosNormalizados = this.exclusiveFiles().map(nombre => this.normalizarTexto(nombre));
    const encontrados = this.archivos().filter(a =>
      exclusivosNormalizados.some(exclusivo =>
        this.normalizarTexto(a.nombre).includes(exclusivo)
      )
    );
    return encontrados.length ? encontrados[0].nombre : null;
  }

  optionalUploaded(file: string): boolean {
    const target = this.normalizarTexto(file);
    return this.archivos().some(a =>
      this.normalizarTexto(a.nombre).includes(target)
    );
  }
}
