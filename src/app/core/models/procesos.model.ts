import { SolicitudStatusEnum } from '../enums/solicitud-status.enum';
import { UserRole } from '../enums/roles.enum';

export type ArchivoEstado = 'pendiente' | 'aprobado' | 'rechazado';

export interface Archivo {
  id_documento?: number;     // ID en backend
  file?: File;               // Solo usado temporalmente cuando se sube
  nombre: string;            // Nombre que se muestra
  originalName?: string;     // Nombre original del archivo
  ruta_documento?: string;   // Path en backend
  fecha: string;             // Fecha de subida
  esValido?: boolean;        // Validez del archivo
  comentario?: string | null;// Comentarios de validación
  estado?: ArchivoEstado;    // Estado del archivo
  url?: string;              // URL para acceder al archivo
}

export interface Usuario {
  id_usuario: number;
  nombre_completo: string;
  rol: UserRole;
  codigo: string;
  correo: string;
  estado_usuario: boolean;
  objPrograma: {
    id_programa: number;
    nombre_programa: string;
  };
}

export interface Solicitud {
  id: number;
  nombre: string;
  fecha: string;
  estado: SolicitudStatusEnum;
  usuario?: Usuario;
  archivos?: Archivo[];
  oficioUrl?: string;
  comentarios?: string;
}
