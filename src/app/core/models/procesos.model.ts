// procesos.model.ts
import { SolicitudStatusEnum } from './solicitud-status.enum';

export interface Archivo {
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
  archivos?: Archivo[];  // <-- Aquí agregamos la propiedad
}
