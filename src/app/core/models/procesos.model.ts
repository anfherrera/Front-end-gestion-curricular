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

export interface SolicitudList {
  id: number;
  nombre: string;
  fecha: string;
  estado: string;
  rutaArchivo: string;
  comentarios?: string;
}

// Modelo para la respuesta del endpoint de homologación por rol
export interface EstadoSolicitud {
  id_estado: number;
  estado_actual: string;
  fecha_registro_estado: string;
  objSolicitud?: any;
}

export interface Rol {
  id_rol: number;
  nombre: string;
}

export interface Programa {
  id_programa: number;
  codigo: string;
  nombre_programa: string;
}

export interface UsuarioHomologacion {
  id_usuario: number;
  nombre_completo: string;
  rol: Rol;
  codigo: string;
  correo: string;
  estado_usuario: boolean;
  objPrograma: Programa;
}

export interface DocumentoHomologacion {
  id_documento: number;
  nombre: string;
  ruta_documento: string;
  fecha_documento: string;
  esValido: boolean;
  comentario?: string | null;
  tipoDocumentoSolicitudPazYSalvo?: any;
}

export interface SolicitudHomologacionDTORespuesta {
  id_solicitud: number;
  nombre_solicitud: string;
  fecha_registro_solicitud: string;
  esSeleccionado?: boolean | null;
  estadosSolicitud: EstadoSolicitud[];
  objUsuario: UsuarioHomologacion;
  documentos: DocumentoHomologacion[];
}

