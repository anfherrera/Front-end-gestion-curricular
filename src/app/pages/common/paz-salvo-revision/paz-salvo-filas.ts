import { DocumentoHomologacion } from '@core/models/procesos.model';
import { DocumentoPazSalvoRespuesta } from '@core/services/paz-salvo.service';

/** Documentos tal como los devuelven los endpoints obtenerOficios / obtenerDocumentos de paz y salvo. */
export function aDocumentos(documentos: DocumentoPazSalvoRespuesta[]): DocumentoHomologacion[] {
  return documentos.map(doc => ({
    id_documento: doc.id,
    nombre: doc.nombreArchivo || doc.nombre,
    ruta_documento: doc.ruta ?? '',
    fecha_documento: doc.fecha ?? '',
    esValido: doc.esValido ?? false,
    comentario: doc.comentario
  }));
}
