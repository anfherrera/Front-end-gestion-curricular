// src/app/core/models/procesos.model.ts
import { SolicitudStatusEnum } from './solicitud-status.enum';

export type ArchivoEstado = 'pendiente' | 'aprobado' | 'rechazado';

export interface Archivo {
  file?: File;            // Solo usado temporalmente cuando se sube
  nombre: string;         // Nombre que se muestra
  originalName: string;   // Nombre original del archivo
  fecha: string;          // Fecha de subida
  url?: string;           // Path o URL para acceder al archivo desde el backend
  estado?: ArchivoEstado; // <-- agregamos esto
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
