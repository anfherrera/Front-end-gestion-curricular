/** Tipo de documento de identidad como lo devuelve /tipos-documento/todos. */
export interface TipoDocumento {
  codigo: string;
  descripcion: string;
}

/** Respuesta de /tipos-documento/todos. */
export interface TiposDocumentoRespuesta {
  success: boolean;
  data?: TipoDocumento[];
}
