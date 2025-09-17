// src/app/core/models/procesos.model.ts
import { SolicitudStatusEnum } from '../enums/solicitud-status.enum';

export type ArchivoEstado = 'pendiente' | 'aprobado' | 'rechazado';

// export interface Archivo {
//   file?: File;            // Solo usado temporalmente cuando se sube
//   nombre: string;         // Nombre que se muestra
//   originalName: string;   // Nombre original del archivo
//   fecha: string;          // Fecha de subida
//   url?: string;           // Path o URL para acceder al archivo desde el backend
//   estado?: ArchivoEstado; // <-- agregamos esto
// }
export interface Archivo {
  id_documento?: number;
  file?: File; // opcional: solo se usa en frontend
  nombre: string;
  originalName?: string;
  ruta_documento?: string;
  fecha: string;
  esValido?: boolean;
  comentario?: string | null;

  estado?: 'pendiente' | 'aprobado' | 'rechazado';
  url?: string;
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

export interface SolicitudList {
  id: number;
  nombre: string;
  fecha: string;
  estado: string;
  rutaArchivo: string;
  comentarios?: string;
}

