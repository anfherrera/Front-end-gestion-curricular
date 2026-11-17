import { SolicitudRevisable } from './solicitud-revision.model';

/** Plantilla de oficio que secretaría genera para un proceso. */
export interface DocumentTemplate {
  id: string;
  nombre: string;
  descripcion: string;
  camposRequeridos: string[];
  camposOpcionales?: string[];
}

/** Datos que se escriben en el formulario de generación. */
export interface DocumentData {
  numeroDocumento: string;
  /** Fecha elegida en el calendario, o texto YYYY-MM-DD; sin fecha el backend usa la actual. */
  fechaDocumento: Date | string | null;
  observaciones?: string;
  /** Campos propios de cada proceso (tipoHomologacion, semestre, motivoReingreso…). */
  [campo: string]: unknown;
}

/** Datos de la solicitud que acompañan al oficio. */
export interface DatosSolicitudDocumento {
  idSolicitud: number;
  nombreEstudiante?: string;
  codigoEstudiante?: string;
  cedula?: string;
  programa?: string;
  fechaSolicitud?: string | Date;
  estado: string;
  tituloTrabajoGrado?: string;
  directorTrabajoGrado?: string;
}

export interface DocumentRequest {
  idSolicitud: number;
  tipoDocumento: string;
  datosDocumento: DocumentData;
  datosSolicitud: DatosSolicitudDocumento;
}

/** Lo que lee el generador de oficios de una solicitud del backend (paz y salvo, homologación, reingreso). */
export interface SolicitudParaDocumento extends SolicitudRevisable {
  objUsuario?: {
    nombre_completo?: string;
    codigo?: string;
    objPrograma?: { nombre_programa?: string } | null;
  } | null;
  /** Paz y salvo: datos del trabajo de grado, si el backend los devuelve. */
  titulo_trabajo_grado?: string | null;
  director_trabajo_grado?: string | null;
}
