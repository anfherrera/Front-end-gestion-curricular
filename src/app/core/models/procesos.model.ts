// src/app/core/models/procesos.model.ts
import { SolicitudStatusEnum } from './solicitud-status.enum';

export interface Archivo {
  file?: File; // <-- ahora es opcional
  nombre: string;
  originalName: string;
  fecha: string;
}

export interface Solicitud {
  id: number;
  nombre: string;
  fecha: string;
  estado: SolicitudStatusEnum;
  oficioUrl?: string;
  comentarios?: string;
  archivos?: Archivo[];
}
