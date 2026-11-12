/**
 * Modelos de cursos intersemestrales (cursos de verano), con la forma en que
 * los devuelve el backend (/api/cursos-intersemestrales).
 */

// ================== CATÁLOGOS ==================

export interface Materia {
  id_materia: number;
  codigo: string;
  nombre: string;
  creditos: number;
  descripcion?: string;
}

/** /materias-filtro: incluye la opción "Todas las materias" con id 0. */
export interface MateriaFiltro {
  id: number;
  nombre: string;
  codigo: string;
}

/** Docente tal como viene en /docentes y en objDocente de cada curso. */
export interface Docente {
  id_docente: number;
  codigo_docente: string;
  nombre_docente: string;
}

export interface Salon {
  id_salon: number;
  numero_salon: string;
  edificio: string;
  activo: boolean;
  descripcion: string;
}

export enum CondicionSolicitudVerano {
  Primera_Vez = 'Primera_Vez',
  Habilitacion = 'Habilitación',
  Repeticion = 'Repeteción'
}

// ================== CURSOS ==================

export type EstadoCursoVerano =
  'Borrador' | 'Abierto' | 'Publicado' | 'Preinscripción' | 'Inscripción' | 'Cerrado' | 'Disponible';

export interface EstadoCursoOfertado {
  id_estado: number;
  estado_actual: string;
  fecha_registro_estado: string;
}

export interface CursoOfertadoVerano {
  id_curso: number;
  nombre_curso: string;
  codigo_curso: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  /** Período "YYYY-P" que calcula el backend. */
  periodo?: string;
  /** Copia de `periodo`; el servicio rellena ambos. */
  periodoAcademico?: string;
  cupo_maximo: number;
  cupo_disponible: number;
  cupo_estimado: number;
  espacio_asignado: string;
  salon?: string;
  id_salon?: number;
  salonInfo?: Partial<Salon>;
  estado?: EstadoCursoVerano;
  objMateria: Materia;
  objDocente?: Docente | null;
  estadosCursoOfertados?: EstadoCursoOfertado[];
  /** Grupo A, B, C o D. */
  grupo?: string;
}

export interface CreateCursoDTO {
  id_materia: number;
  /** id_docente, no id_usuario. */
  id_docente: number;
  /** Entre 1 y 100; el cupo máximo es igual a este. */
  cupo_estimado: number;
  fecha_inicio: string;
  fecha_fin: string;
  periodoAcademico: string;
  id_salon?: number;
  /** Obsoleto: solo si no hay id_salon. */
  espacio_asignado?: string;
  /** Si no se envía, el backend asigna "Abierto". */
  estado?: string;
  /** A, B, C o D; por defecto "A". */
  grupo?: string;
}

export interface UpdateCursoDTO {
  cupo_estimado?: number;
  id_salon?: number;
  /** Obsoleto: solo si no hay id_salon. */
  espacio_asignado?: string;
  estado?: EstadoCursoVerano;
  fecha_inicio?: string;
  fecha_fin?: string;
}

/** Archivo descargado con el nombre que indicó el servidor (o uno generado). */
export interface ArchivoDescargado {
  blob: Blob;
  filename: string;
}

// ================== ESTUDIANTES DE UN CURSO ==================

export interface EstudianteCurso {
  id_usuario: number;
  nombre_completo: string;
  codigo: string;
  correo: string;
  programa: string;
  id_programa: number;
  estado_preinscripcion?: string | null;
  fecha_preinscripcion?: string | null;
  id_solicitud_preinscripcion?: number | null;
  condicion?: string | null;
  tiene_inscripcion: boolean;
  /** "Sin inscripción", "Enviada", "Pago_Validado", "Pago_Rechazado", ... */
  estado_inscripcion?: string | null;
  id_solicitud_inscripcion?: number | null;
  /** "Inscrito" solo si el pago está validado. */
  tipo: 'Preinscrito' | 'Inscrito';
}

export interface RespuestaEstudiantesCurso {
  id_curso: number;
  nombre_curso: string;
  codigo_curso: string;
  cupo_estimado: number;
  total_estudiantes: number;
  total_preinscritos: number;
  total_inscritos: number;
  estudiantes: EstudianteCurso[];
}

export interface EstudianteElegible {
  nombre_completo: string;
  codigo: string;
  id_solicitud: number;
  id_curso: number;
  tipo_solicitud: string;
  condicion_solicitud: string;
  tiene_inscripcion_formal: boolean;
  objUsuario?: {
    id_usuario: number;
    nombre_completo: string;
    correo: string;
    codigo: string;
    codigo_estudiante: string;
  };
  id_preinscripcion?: number;
  fecha_preinscripcion?: string;
  estado_preinscripcion?: string;
  id_inscripcion?: number;
  fecha_inscripcion?: string;
  estado_inscripcion?: string | null;
  /** Estado que envía el backend; la pantalla lo copia a estado_inscripcion. */
  estado_actual?: string | null;
  motivo_inclusion?: string;
  archivoPago?: {
    id_documento: string | null;
    nombre: string;
    url: string | null;
    fecha: string | null;
  };
  objCurso?: CursoOfertadoVerano;
}

// ================== SOLICITUDES (FUNCIONARIO) ==================

export interface EstadoSolicitudDetalle {
  idEstado?: number;
  estado: string;
  fecha?: string;
  comentario?: string | null;
  registradoPor?: string;
}

/** /preinscripciones/curso/{idCurso} */
export interface PreinscripcionCurso {
  id_preinscripcion: number;
  id_solicitud: number;
  fecha_preinscripcion: string;
  estado: 'ENVIADA' | 'APROBADA' | 'APROBADA_FUNCIONARIO' | 'RECHAZADA';
  observaciones?: string | null;
  condicion?: string | null;
  objUsuario: {
    id_usuario: number;
    nombre_completo: string;
    correo: string;
    codigo: string;
    codigo_estudiante: string;
    objRol?: { id_rol: number; nombre: string };
  };
  objCurso: {
    id_curso: number;
    nombre_curso: string;
    codigo_curso: string;
  };
}

export interface UsuarioSolicitud {
  id_usuario: number;
  nombre_completo: string;
  rol?: { id_rol: number; nombre: string };
  codigo: string;
  codigo_estudiante?: string;
  correo: string;
  estado_usuario?: boolean;
  objPrograma?: { id_programa: number; nombre_programa: string };
}

/** Preinscripción de un curso, como la muestra la pantalla del funcionario. */
export interface SolicitudCursoVerano {
  id_solicitud: number;
  id_preinscripcion?: number;
  nombre_solicitud: string;
  fecha_solicitud: Date;
  estado: string;
  observaciones?: string;
  condicion?: string;
  objUsuario: UsuarioSolicitud;
  objCursoOfertadoVerano?: CursoOfertadoVerano;
  objCurso?: { id_curso: number; nombre_curso: string; codigo_curso: string };
  tipoSolicitud: 'PREINSCRIPCION' | 'INSCRIPCION';
  estadoCurso?: string;
  accionesDisponibles?: string[];
  comentarioEstado?: string | null;
  estadoSolicitud?: EstadoSolicitudDetalle[];
  fecha_preinscripcion?: string;
}

/** /solicitudes (pantalla "Visualizar solicitudes"). */
export interface SolicitudVisualizar {
  nombreCompleto: string;
  codigo: string;
  curso: string;
  condicion: string;
  estado: string;
  fecha: string;
  motivoSolicitud?: string;
}

/** Respuesta de aprobar/rechazar/observaciones/aceptar inscripción. */
export interface RespuestaAccion {
  success?: boolean;
  message?: string;
  id_solicitud?: number;
  /** Al rechazar, el backend devuelve el motivo registrado. */
  motivo?: string;
}

export interface DashboardEstadisticas {
  totalPreinscripciones: number;
  totalInscripciones: number;
  totalSolicitudesCursoNuevo: number;
  cursosActivos: number;
  totalCursos: number;
  cursosGestionados: number;
  porcentajeProgreso: number;
  fechaConsulta: string;
}

// ================== SEGUIMIENTO (ESTUDIANTE) ==================

/** Preinscripción en /seguimiento/{idUsuario}. */
export interface PreinscripcionSeguimiento {
  id: number;
  fecha: string;
  estado: string;
  tipo: string;
  curso: string;
  estudianteId: number;
  cursoId: number;
  estadoCurso?: string;
  accionesDisponibles?: string[];
  /** No viene en /seguimiento: la pantalla lo toma de /preinscripciones/usuario. */
  comentarioEstado?: string | null;
}

/** Inscripción en /seguimiento/{idUsuario}. */
export interface InscripcionSeguimiento {
  id: number;
  fecha: string;
  estado: string;
  tipoSolicitud?: string;
  nombreSolicitud?: string;
  curso: string;
  estudianteId: number;
  cursoId: number;
  estadoCurso?: string;
  accionesDisponibles?: string[];
  comentarioEstado?: string | null;
}

export interface SeguimientoActividades {
  preinscripciones: PreinscripcionSeguimiento[];
  inscripciones: InscripcionSeguimiento[];
}

/** /preinscripciones/usuario/{id}: igual que el seguimiento, con el comentario del último estado. */
export interface PreinscripcionUsuario {
  id: number;
  fecha: string;
  estado: string;
  comentarioEstado?: string;
  tipo: string;
  estudianteId: number;
  cursoId?: number;
  cursoNombre?: string;
  accionesDisponibles: string[];
}

// ================== PETICIONES DEL ESTUDIANTE ==================

export interface CreatePreinscripcionDTO {
  idUsuario: number;
  idCurso: number;
  nombreSolicitud: string;
  /** Primera_Vez, Habilitación o Repetición. */
  condicion?: string;
}

export interface CreateInscripcionDTO {
  idUsuario: number;
  idCurso: number;
  nombreSolicitud: string;
}

export interface CreateSolicitudCursoNuevoDTO {
  nombreCompleto: string;
  codigo: string;
  curso: string;
  condicion: CondicionSolicitudVerano;
  idUsuario: number;
}

/** Lo que devuelve crear preinscripción / inscripción (se usa el id para subir el comprobante). */
export interface SolicitudCreada {
  id_solicitud: number;
}
