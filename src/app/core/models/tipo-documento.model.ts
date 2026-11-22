/** Tipo de documento de identidad como lo devuelve /tipos-documento. */
export interface TipoDocumento {
  codigo: string;
  descripcion: string;
}

/** Respuesta de /tipos-documento. */
export interface TiposDocumentoRespuesta {
  success: boolean;
  data?: TipoDocumento[];
}
