export interface ProcesoDTOPeticion {
  id_proceso?: number;
  nombre_proceso: string;
  descripcion?: string | null;
  estado_proceso: boolean;
}

export interface ProcesoDTORespuesta {
  id_proceso: number;
  nombre_proceso: string;
  descripcion?: string | null;
  estado_proceso: boolean;
}
