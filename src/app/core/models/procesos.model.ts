import { SolicitudStatusEnum } from '../enums/solicitud-status.enum';

export type ArchivoEstado = 'pendiente' | 'aprobado' | 'rechazado';

export interface Archivo {
  file?: File;            // Solo usado temporalmente cuando se sube
  nombre: string;         // Nombre que se muestra
  originalName: string;   // Nombre original del archivo
  fecha: string;          // Fecha de subida
  url?: string;           // Path o URL para acceder al archivo desde el backend
  estado?: ArchivoEstado;
  comentario?: string;
  tipoDocumentoSolicitudPazYSalvo?: string;
}

export interface Usuario {
  id: number;
  nombre_completo: string;
  rol: {
    id_rol: number;
    nombre_rol: string;
  };
  codigo: string;
  correo: string;
  password?: string;
  estado_usuario?: boolean;
  objPrograma?: {
    id_programa: number;
    nombre_programa: string;
  };
}

export interface Solicitud {
  id: number;
  nombre: string;
  fecha: string;
  estado: SolicitudStatusEnum;
  usuario?: Usuario;     // 🔹 agregado para filtrar por studentId
  oficioUrl?: string;
  comentarios?: string;
  archivos?: Archivo[];
}
