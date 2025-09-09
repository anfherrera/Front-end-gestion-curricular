import { SolicitudStatus } from './solicitud-status.enum';

export interface Documento {
  id: number;
  nombre: string;
  fecha: string;
  url: string;
  aprobado?: boolean; // usado por funcionario/coordinador en revisión
}

export interface Solicitud {
  id: number;
  fecha: string;
  estado: SolicitudStatus;
  documentos: Documento[];
  oficioUrl?: string;     // link al oficio/resolución cuando esté listo
  comentarios?: string;   // usado si la solicitud es rechazada
}
