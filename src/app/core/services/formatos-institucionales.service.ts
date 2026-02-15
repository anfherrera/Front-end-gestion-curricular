import { Injectable } from '@angular/core';

export const FORMATO_IDS = {
  REINGRESO: 'reingreso',
  HOMOLOGACION: 'homologacion'
} as const;

export type FormatoId = typeof FORMATO_IDS[keyof typeof FORMATO_IDS];

export interface FormatoInstitucional {
  id: FormatoId;
  nombre: string;
  url: string;
  procesoLabel: string; // etiqueta para mostrar en admin (ej. "Reingreso", "Homologación")
}

const STORAGE_KEY = 'formatos_institucionales';

const DEFAULTS: FormatoInstitucional[] = [
  {
    id: FORMATO_IDS.REINGRESO,
    nombre: 'PM-FO-4-FOR-17 Solicitud de Reingreso V2',
    url: 'https://share.google/YWwAuZFs7tytr6sNu',
    procesoLabel: 'Reingreso Estudiante'
  },
  {
    id: FORMATO_IDS.HOMOLOGACION,
    nombre: 'PM-FO-4-FOR-22-Solicitud-Homologacion-de-Asignaturas-V1',
    url: 'https://share.google/JrNoszFyerPeZ0mX1',
    procesoLabel: 'Homologación de Asignaturas'
  }
];

@Injectable({
  providedIn: 'root'
})
export class FormatosInstitucionalesService {

  private cache: Map<FormatoId, FormatoInstitucional> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr: FormatoInstitucional[] = JSON.parse(raw);
        this.cache.clear();
        arr.forEach(f => this.cache.set(f.id, f));
      }
    } catch {
      this.cache.clear();
    }
    // Asegurar que existan todos los formatos con valores por defecto
    DEFAULTS.forEach(d => {
      if (!this.cache.has(d.id)) {
        this.cache.set(d.id, { ...d });
      }
    });
  }

  private saveToStorage(): void {
    const arr = Array.from(this.cache.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  /** Obtener todos los formatos (para la vista de administración) */
  getAll(): FormatoInstitucional[] {
    return DEFAULTS.map(d => this.cache.get(d.id) ?? { ...d });
  }

  /** Obtener un formato por id (para vistas estudiante) */
  getFormato(id: FormatoId): FormatoInstitucional | null {
    return this.cache.get(id) ?? DEFAULTS.find(d => d.id === id) ?? null;
  }

  /** Obtener nombre y url para Reingreso */
  getReingreso(): { nombre: string; url: string } {
    const f = this.getFormato(FORMATO_IDS.REINGRESO);
    return f ? { nombre: f.nombre, url: f.url } : { nombre: DEFAULTS[0].nombre, url: DEFAULTS[0].url };
  }

  /** Obtener nombre y url para Homologación */
  getHomologacion(): { nombre: string; url: string } {
    const f = this.getFormato(FORMATO_IDS.HOMOLOGACION);
    return f ? { nombre: f.nombre, url: f.url } : { nombre: DEFAULTS[1].nombre, url: DEFAULTS[1].url };
  }

  /** Actualizar nombre y/o url de un formato */
  actualizar(id: FormatoId, datos: { nombre?: string; url?: string }): void {
    const actual = this.cache.get(id) ?? DEFAULTS.find(d => d.id === id);
    if (!actual) return;
    const updated: FormatoInstitucional = {
      ...actual,
      ...(datos.nombre != null && { nombre: datos.nombre.trim() }),
      ...(datos.url != null && { url: datos.url.trim() })
    };
    this.cache.set(id, updated);
    this.saveToStorage();
  }
}
