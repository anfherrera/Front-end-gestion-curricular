import { SolicitudStatusEnum } from './solicitud-status.enum';

export interface Solicitud {
  id: number;                  // opcional si manejas BD
  nombre: string;
  fecha: string;
  estado: SolicitudStatusEnum;
  oficioUrl?: string;           // puede ser oficio o resolución
}
