import { SolicitudStatusEnum } from '../enums/solicitud-status.enum';
import { UserRole } from '../enums/roles.enum';

export type ArchivoEstado = 'pendiente' | 'aprobado' | 'rechazado' | 'error';

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
  comentario?: string | null;
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
  periodo_academico: string; // Obligatorio, formato YYYY-P
  fecha_ceremonia?: string | null; // Opcional
  estadosSolicitud: EstadoSolicitud[];
  objUsuario: UsuarioHomologacion;
  documentos: DocumentoHomologacion[];
  programa_origen?: string | null; // Opcional, máximo 200 caracteres
  programa_destino?: string | null; // Opcional, máximo 200 caracteres
}

// ================================
// Modelos para Homologación de Asignaturas (Request)
// ================================

export interface SolicitudHomologacionDTOPeticion {
  id_solicitud?: number;
  nombre_solicitud: string;
  fecha_registro_solicitud: Date | string;
  periodo_academico: string; // Obligatorio, formato YYYY-P
  fecha_ceremonia?: Date | string | null; // Opcional
  estado_actual?: EstadoSolicitudDTOPeticion;
  objUsuario: UsuarioDTOPeticion;
  documentos?: DocumentosDTOPeticion[];
  archivos?: any[]; // Archivos subidos
  programa_origen?: string | null; // Opcional, máximo 200 caracteres
  programa_destino?: string | null; // Opcional, máximo 200 caracteres
}

// ================================
// Modelos para Reingreso de Estudiante
// ================================

export interface SolicitudReingresoDTOPeticion {
  id_solicitud?: number;
  nombre_solicitud: string;
  fecha_registro_solicitud: Date;
  periodo_academico: string; // Obligatorio, formato YYYY-P
  fecha_ceremonia?: string | null; // Opcional
  estado_actual?: EstadoSolicitudDTOPeticion;
  objUsuario: UsuarioDTOPeticion;
  documentos?: DocumentosDTOPeticion[];
}

export interface SolicitudReingresoDTORespuesta {
  id_solicitud: number;
  nombre_solicitud: string;
  fecha_registro_solicitud: Date;
  periodo_academico: string; // Obligatorio, formato YYYY-P
  fecha_ceremonia?: string | null; // Opcional
  estadosSolicitud: EstadoSolicitudDTORespuesta[];
  objUsuario: UsuarioDTORespuesta;
  documentos: DocumentosDTORespuesta[];
}

export interface CambioEstadoSolicitudDTOPeticion {
  idSolicitud: number;
  nuevoEstado: string;
}

// ================================
// DTOs base que heredan los de reingreso
// ================================

export interface EstadoSolicitudDTOPeticion {
  id_estado?: number;
  estado_actual: string;
  fecha_registro_estado: Date;
  comentario?: string;
}

export interface EstadoSolicitudDTORespuesta {
  id_estado: number;
  estado_actual: string;
  fecha_registro_estado: Date;
  comentario?: string;
}

export interface UsuarioDTOPeticion {
  id_usuario: number;
  nombre_completo: string;
  rol: Rol;
  codigo: string;
  cedula: string; // Obligatorio, 5-20 caracteres, solo números
  correo: string;
  estado_usuario: boolean;
  id_rol?: number; // Campo requerido por el backend
  id_programa?: number; // Campo requerido por el backend
  objPrograma: Programa;
}

export interface UsuarioDTORespuesta {
  id_usuario: number;
  nombre_completo: string;
  rol: Rol;
  codigo: string;
  cedula: string; // Obligatorio
  correo: string;
  estado_usuario: boolean;
  objPrograma: Programa;
}

export interface DocumentosDTOPeticion {
  id_documento?: number;
  nombre: string;
  ruta_documento?: string;
  fecha_documento: Date;
  esValido: boolean;
  comentario?: string;
}

export interface DocumentosDTORespuesta {
  id_documento: number;
  nombre: string;
  ruta_documento: string;
  fecha_documento: Date;
  esValido: boolean;
  comentario?: string;
}

