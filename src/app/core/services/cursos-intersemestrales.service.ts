import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { ApiEndpoints } from '../utils/api-endpoints';
import { Curso as CursoList } from '../../shared/components/curso-list/curso-list.component';
import { AuthService } from './auth.service';

// ================== MODELOS ACTUALIZADOS ==================
export interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  codigo_usuario?: string;
  codigo_estudiante?: string;
  objRol: Rol;
}

// Nueva interfaz para la respuesta del endpoint de estudiantes elegibles (estructura real del backend)
// ================== INTERFACES PARA ESTUDIANTES DE UN CURSO ==================
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
  /**
   * Estado de la inscripción. Siempre viene del backend.
   * Puede ser:
   * - "Sin inscripción": No tiene solicitud de inscripción
   * - "Enviada": Inscripción enviada, pendiente de validación
   * - "Pago_Validado": Inscripción validada y completada (solo estos estudiantes son "Inscrito")
   * - "Pago_Rechazado": Pago rechazado
   * - Otros estados según el flujo
   */
  estado_inscripcion?: string | null;
  id_solicitud_inscripcion?: number | null;
  /**
   * Tipo del estudiante. Calculado por el backend.
   * - "Inscrito": Solo si estado_inscripcion === "Pago_Validado"
   * - "Preinscrito": En todos los demás casos
   */
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
  // Campos adicionales que pueden venir del backend (opcionales para compatibilidad)
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
  estado_inscripcion?: string;
  motivo_inclusion?: string;
  archivoPago?: {
    id_documento: string | null;
    nombre: string;
    url: string | null;
    fecha: string | null;
  };
  objCurso?: CursoOfertadoVerano;
}

export interface Rol {
  id_rol: number;
  nombre_rol: string;
}

export interface Materia {
  id_materia: number;
  codigo: string;
  nombre: string;
  creditos: number;
  descripcion: string;
}

// Interfaz para el estado del curso (nueva estructura del backend)
export interface EstadoCurso {
  idEstado: number;
  idfkCurso: number;
  fecha_registro_estado: string;
  estado_actual: string;
}

export interface CursoOfertadoVerano {
  id_curso: number;
  nombre_curso: string;
  codigo_curso: string;
  descripcion: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  periodo?: string; // Nuevo campo del backend (formato "YYYY-P")
  // Período académico
  periodoAcademico?: string; // Ejemplo: "2025-1", "2025-2"
  cupo_maximo: number;
  cupo_disponible: number;
  cupo_estimado: number;
  espacio_asignado: string;
  salon?: string; // Número del salón (String, ej: "221")
  id_salon?: number; // ID del salón asignado
  salonInfo?: Salon; // Información completa del salón (objeto)
  // Mantener el campo estado para compatibilidad, pero ahora se obtendrá del estado actual
  estado?: 'Borrador' | 'Abierto' | 'Publicado' | 'Preinscripción' | 'Inscripción' | 'Cerrado' | 'Disponible';
  objMateria: Materia;
  objDocente: Usuario;
  // Nuevo campo para manejar los estados desde la tabla separada
  estados?: EstadoCurso[];
  estado_actual?: string; // Estado actual del curso
  grupo?: string; // Grupo del curso (A, B, C, D)
}

// Interfaz específica para usuarios en solicitudes (estructura del backend)
export interface UsuarioSolicitud {
  id_usuario: number;
  nombre_completo: string;
  rol?: {
    id_rol: number;
    nombre: string;
  };
  codigo: string;
  codigo_estudiante?: string; // Campo opcional para compatibilidad
  correo: string;
  estado_usuario?: boolean;
  objPrograma?: {
    id_programa: number;
    nombre_programa: string;
  };
}

export interface EstadoSolicitudDetalle {
  idEstado?: number;
  estado: string;
  fecha?: string;
  comentario?: string | null;
  registradoPor?: string;
}

// Interfaz para la respuesta del endpoint de preinscripciones por curso
export interface PreinscripcionCurso {
  id_preinscripcion: number;
  id_solicitud: number; // Alias para compatibilidad
  fecha_preinscripcion: string; // ISO string
  estado: 'ENVIADA' | 'APROBADA' | 'APROBADA_FUNCIONARIO' | 'RECHAZADA';
  observaciones?: string | null;
  condicion?: string | null;
  objUsuario: {
    id_usuario: number;
    nombre_completo: string;
    correo: string;
    codigo: string;
    codigo_estudiante: string;
    objRol?: {
      id_rol: number;
      nombre: string;
    };
  };
  objCurso: {
    id_curso: number;
    nombre_curso: string;
    codigo_curso: string;
  };
}

export interface SolicitudCursoVerano {
  id_solicitud: number;
  id_preinscripcion?: number; // Campo adicional para compatibilidad
  nombre_solicitud: string;
  fecha_solicitud: Date;
  estado: 'Pendiente' | 'Enviado' | 'Enviada' | 'Aprobado' | 'Rechazado' | 'Completado' | 'ENVIADA' | 'APROBADA' | 'APROBADA_FUNCIONARIO' | 'RECHAZADA';
  observaciones?: string;
  condicion?: string;
  objUsuario: UsuarioSolicitud;
  objCursoOfertadoVerano?: CursoOfertadoVerano;
  objCurso?: { id_curso: number; nombre_curso: string; codigo_curso: string; }; // Alias para compatibilidad
  tipoSolicitud: 'PREINSCRIPCION' | 'INSCRIPCION';
  // Nuevos campos para el seguimiento mejorado
  estadoCurso?: string;           // Estado actual del curso
  accionesDisponibles?: string[]; // Acciones que puede realizar el estudiante
  comentarioEstado?: string | null; // Motivo asociado al estado actual
  estadoSolicitud?: EstadoSolicitudDetalle[]; // Historial de estados con comentarios
  // Campos adicionales para compatibilidad con el nuevo formato
  fecha_preinscripcion?: string; // ISO string para compatibilidad
}

export interface Notificacion {
  id_notificacion: number;
  tipoSolicitud: string;
  tipoNotificacion: string;
  titulo: string;
  mensaje: string;
  fechaCreacion: Date;
  leida: boolean;
  esUrgente: boolean;
  urlAccion: string;
}

// ================== MODELOS PARA SOLICITUD DE CURSO NUEVO ==================
export interface CursoDisponible {
  id_curso: number;
  nombre_curso: string;
  codigo_curso: string;
  creditos: number;
  descripcion: string;
}

export enum CondicionSolicitudVerano {
  Primera_Vez = 'Primera_Vez',
  Habilitacion = 'Habilitación',
  Repeticion = 'Repeteción'
}

export interface SolicitudCursoNuevo {
  id_solicitud: number;
  nombreCompleto: string;
  codigo: string;
  curso: string;
  condicion: CondicionSolicitudVerano;
  fecha: Date;
  estado: 'Pendiente' | 'Enviado' | 'Aprobado' | 'Rechazado';
  objUsuario: Usuario;
}

// ================== MODELOS LEGACY (para compatibilidad) ==================
export interface Solicitud {
  id: number;
  fecha: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
}

export interface Inscripcion {
  id_inscripcion: number;
  fecha_inscripcion: Date;
  estado: 'inscrito' | 'cancelado' | 'pendiente' | 'rechazado';
  archivoPago?: {
    id_documento: number;
    nombre: string;
    url: string;
    fecha: string;
  };
  objUsuario: Usuario;
  objCurso: CursoOfertadoVerano;
  // Nuevos campos para el seguimiento mejorado
  estadoCurso?: string;           // Estado actual del curso
  accionesDisponibles?: string[]; // Acciones que puede realizar el estudiante
}

export interface Preinscripcion {
  id_preinscripcion: number;
  fecha_preinscripcion: Date;
  estado: 'Pendiente' | 'Enviado' | 'Aprobado' | 'Rechazado';
  observaciones?: string;
  condicion?: string;
  objUsuario: Usuario;
  objCurso: CursoOfertadoVerano;
}

export interface CursoBackend {
  id: number;
  nombre: string;
  cupos: number;
  docente: string;
  tipo: 'ofertado' | 'preinscripcion' | 'inscrito';
}

// ================== INTERFACES PARA SEGUIMIENTO MEJORADO ==================
export interface PreinscripcionSeguimiento {
  id: number;
  fecha: string;
  estado: string;
  tipo: string;
  curso: string;
  estudianteId: number;
  cursoId: number;
  estadoCurso?: string;           // Estado del curso
  accionesDisponibles?: string[]; // Acciones que puede realizar
  comentarioEstado?: string | null; // Comentario o motivo asociado al estado actual
  estadoSolicitud?: EstadoSolicitudDetalle[]; // Historial de estados
}

export interface InscripcionSeguimiento {
  id: number;
  fecha: string;
  estado: string;
  tipo: string;
  curso: string;
  estudianteId: number;
  cursoId: number;
  estadoCurso?: string;           // Estado del curso
  accionesDisponibles?: string[]; // Acciones que puede realizar
  comentarioEstado?: string | null; // Comentario o motivo asociado al estado actual
  estadoSolicitud?: EstadoSolicitudDetalle[]; // Historial de estados
}

export interface SeguimientoActividades {
  preinscripciones: PreinscripcionSeguimiento[];
  inscripciones: InscripcionSeguimiento[];
}

// ================== DTOs ACTUALIZADOS ==================
export interface CreatePreinscripcionDTO {
  idUsuario: number;
  idCurso: number;
  nombreSolicitud: string;
  condicion?: string; // Condición de la preinscripción (Primera_Vez, Habilitación, Repetición)
}

export interface CreateInscripcionDTO {
  idUsuario: number;
  idCurso: number;
  nombreSolicitud: string;
}

export interface UpdateSolicitudDTO {
  estado?: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Completado';
  motivoRechazo?: string;
}

// DTO para aceptar inscripción
export interface AceptarInscripcionDTO {
  observaciones?: string;
}

// DTO para rechazar inscripción
export interface RechazarInscripcionDTO {
  motivo_rechazo: string;
}

// Respuesta del endpoint de aceptar inscripción
export interface AceptarInscripcionResponse {
  success: boolean;
  message: string;
}

// Respuesta del endpoint de rechazar inscripción
export interface RechazarInscripcionResponse {
  success: boolean;
  message: string;
}

// Respuesta del endpoint de debug
export interface DebugInscripcionResponse {
  success: boolean;
  message: string;
  data?: {
    preinscripcion_existe: boolean;
    base_datos_conectada: boolean;
    tipo_entidad?: string;
    errores?: string[];
    detalles?: any;
  };
}

// Interfaz para las estadísticas del dashboard
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

export interface CreateSolicitudCursoNuevoDTO {
  nombreCompleto: string;
  codigo: string;
  curso: string;
  condicion: CondicionSolicitudVerano;
  idUsuario: number;
}

// ================== DTOs LEGACY (para compatibilidad) ==================
export interface CreateSolicitudDTO {
  fecha: string;
  estado: 'pendiente';
}

export interface CreateInscripcionLegacyDTO {
  cursoId: number;
  estudianteId: number;
  fecha: string;
  estado: 'inscrito' | 'cancelado';
}

// ================== SERVICIO ==================
@Injectable({ providedIn: 'root' })
export class CursosIntersemestralesService {
  private normalizarCurso(curso: CursoOfertadoVerano): CursoOfertadoVerano {
    if (!curso) {
      return curso;
    }

    const periodo = curso.periodo ?? curso.periodoAcademico;

    // Preservar el campo grupo si existe, o usar 'A' por defecto
    const grupo = curso.grupo || 'A';

    // Log para depuración (solo en desarrollo)
    if (curso.grupo) {
      // Log de normalización de grupo (comentado para producción)
    }

    if (curso.periodo === periodo && curso.periodoAcademico === periodo && curso.grupo === grupo) {
      return curso;
    }

    const cursoNormalizado = {
      ...curso,
      periodo,
      periodoAcademico: periodo,
      grupo: grupo // Asegurar que el grupo se preserve
    };

    return cursoNormalizado;
  }

  constructor(private http: HttpClient, private authService: AuthService) {}

  // ====== PERÍODOS ACADÉMICOS ======

  // Interfaz para la respuesta de períodos del backend
  private mapPeriodosResponse(response: any): string[] {
    if (!response) return [];
    
    const data = response.success ? response.data : response;
    
    // Si el backend devuelve array de objetos con { valor, descripcion }
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && 'valor' in data[0]) {
      return data.map((p: any) => p.valor);
    }
    
    // Si el backend devuelve array de strings directamente
    if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  }

  // Obtener todos los períodos académicos disponibles (2020-1 a 2030-2)
  getPeriodosAcademicos(): Observable<string[]> {
    const url = ApiEndpoints.PERIODOS_ACADEMICOS.TODOS;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        const periodos = this.mapPeriodosResponse(response);
        return periodos;
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  // Obtener solo períodos futuros (recomendado para crear cursos)
  getPeriodosFuturos(): Observable<string[]> {
    const url = ApiEndpoints.PERIODOS_ACADEMICOS.FUTUROS;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        const periodos = this.mapPeriodosResponse(response);
        return periodos;
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  // Obtener períodos recientes (últimos 5 años)
  getPeriodosRecientes(): Observable<string[]> {
    const url = ApiEndpoints.PERIODOS_ACADEMICOS.RECIENTES;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        const periodos = this.mapPeriodosResponse(response);
        return periodos;
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  // Obtener período académico actual
  getPeriodoActual(): Observable<string> {
    const url = ApiEndpoints.PERIODOS_ACADEMICOS.ACTUAL;
    
    return this.http.get<any>(url).pipe(
      map(response => {
        if (!response) return '';
        const data = response.success ? response.data : response;
        const periodo = data?.valor || data || '';
        return periodo;
      }),
      catchError(error => {
        return of('');
      })
    );
  }

  // Obtener períodos que tienen cursos registrados
  getPeriodosRegistrados(): Observable<string[]> {
    return this.http.get<string[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/periodos-registrados`);
  }

  // ====== CURSOS DE VERANO - NUEVAS APIs ======
  
  /**
   * Obtener cursos disponibles para verano (para estudiantes - datos reales de la BD)
   * 
   * @param periodoAcademico (opcional): Período académico en formato "YYYY-P" (ej: "2025-2")
   *                         - Si se envía "todos", se muestran todos los cursos sin filtrar
   *                         - Si no se proporciona o es null/undefined, el backend automáticamente
   *                           filtra por el período académico actual calculado según la fecha del sistema.
   * @param idPrograma (opcional): ID del programa académico para filtrar cursos
   * @param todosLosPeriodos (opcional): Si es true, muestra todos los cursos sin filtrar por período
   * 
   * @returns Observable con la lista de cursos disponibles
   */
  getCursosDisponibles(
    periodoAcademico?: string | null, 
    idPrograma?: number,
    todosLosPeriodos?: boolean
  ): Observable<CursoOfertadoVerano[]> {
    const url = ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.DISPONIBLES;
    
    // Solo agregar parámetros si se proporcionan
    let httpParams = new HttpParams();
    
    // Si todosLosPeriodos es true, usar ese parámetro (ignora periodoAcademico)
    if (todosLosPeriodos === true) {
      httpParams = httpParams.set('todosLosPeriodos', 'true');
    } else if (periodoAcademico && periodoAcademico.trim() !== '') {
      // Si periodoAcademico es "todos", también mostrar todos
      if (periodoAcademico.trim().toLowerCase() === 'todos') {
        httpParams = httpParams.set('todosLosPeriodos', 'true');
      } else {
        httpParams = httpParams.set('periodoAcademico', periodoAcademico);
      }
    } else {
    }
    
    if (idPrograma !== undefined && idPrograma !== null) {
      httpParams = httpParams.set('idPrograma', idPrograma.toString());
    }
    
    // Si hay parámetros, agregarlos a la URL, si no, llamar sin parámetros para usar período actual automático
    const options = httpParams.keys().length > 0 
      ? { params: httpParams }
      : {};
    
    return this.http.get<CursoOfertadoVerano[] | { data: CursoOfertadoVerano[] }>(url, options).pipe(
      map(response => {
        let cursos: CursoOfertadoVerano[] = [];
        if (Array.isArray(response)) {
          cursos = response;
        } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
          cursos = (response as any).data;
        } else if (response && typeof response === 'object' && 'success' in response && (response as any).success && Array.isArray((response as any).data)) {
          cursos = (response as any).data;
        }
        
        const cursosNormalizados = cursos.map(curso => this.normalizarCurso(curso));
        return cursosNormalizados;
      }),
      catchError(error => {
        return of([]);
      })
    );
  }

  /**
   * Obtener todos los cursos (estudiantes)
   * GET /api/cursos-intersemestrales/cursos-verano
   * Query params opcionales:
   * - periodoAcademico: "2025-1" o "2025-2"
   * - idPrograma: ID del programa
   */
  getCursosVerano(periodoAcademico?: string, idPrograma?: number): Observable<CursoOfertadoVerano[]> {
    let params = new HttpParams();
    
    if (periodoAcademico) {
      params = params.set('periodoAcademico', periodoAcademico);
    }
    
    if (idPrograma !== undefined && idPrograma !== null) {
      params = params.set('idPrograma', idPrograma.toString());
    }
    
    const url = `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-verano`;
    const options = params.keys().length > 0 ? { params } : {};
    
    return this.http.get<CursoOfertadoVerano[]>(url, options).pipe(
      map(cursos => cursos.map(curso => this.normalizarCurso(curso))),
      catchError(error => {
        return of([]);
      })
    );
  }

  /**
   * Obtener cursos disponibles (estudiantes - solo visibles)
   * GET /api/cursos-intersemestrales/cursos-verano/disponibles
   * Query params opcionales:
   * - periodoAcademico: "2025-1", "2025-2" o "todos"
   * - idPrograma: ID del programa
   * - todosLosPeriodos: true/false
   */
  getCursosVeranoDisponibles(periodoAcademico?: string, idPrograma?: number, todosLosPeriodos?: boolean): Observable<CursoOfertadoVerano[]> {
    let params = new HttpParams();
    
    if (periodoAcademico) {
      params = params.set('periodoAcademico', periodoAcademico);
    }
    
    if (idPrograma !== undefined && idPrograma !== null) {
      params = params.set('idPrograma', idPrograma.toString());
    }
    
    if (todosLosPeriodos !== undefined) {
      params = params.set('todosLosPeriodos', todosLosPeriodos.toString());
    }
    
    const url = ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.DISPONIBLES;
    const options = params.keys().length > 0 ? { params } : {};
    
    return this.http.get<CursoOfertadoVerano[]>(url, options).pipe(
      map(cursos => cursos.map(curso => this.normalizarCurso(curso))),
      catchError(error => {
        return of([]);
      })
    );
  }

  // Obtener cursos filtrados por período académico (método legacy - mantener para compatibilidad)
  getCursosPorPeriodo(periodo: string): Observable<CursoOfertadoVerano[]> {
    return this.getCursosVerano(periodo);
  }

  // Obtener cursos activos en una fecha específica
  getCursosActivos(fecha: string): Observable<CursoOfertadoVerano[]> {
    return this.http.get<CursoOfertadoVerano[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-activos/${fecha}`).pipe(
      map(cursos => cursos.map(curso => this.normalizarCurso(curso)))
    );
  }

  // Obtener estadísticas por período
  getEstadisticasPorPeriodo(periodo: string): Observable<any> {
    return this.http.get<any>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/estadisticas/periodo/${periodo}`);
  }

  /**
   * Obtener todos los cursos (funcionarios/coordinadores)
   * GET /api/cursos-intersemestrales/cursos-verano/todos
   * Query params opcionales:
   * - periodoAcademico: "2025-1", "2025-2" o "todos"
   * - idPrograma: ID del programa
   * 
   * @param periodoAcademico (opcional): Período académico en formato "YYYY-P" (ej: "2025-2")
   *                         Si no se proporciona o se envía "todos", muestra TODOS los cursos sin filtrar.
   * @param idPrograma (opcional): ID del programa académico para filtrar cursos
   * 
   * @returns Observable con la lista de cursos
   */
  getTodosLosCursosParaFuncionarios(periodoAcademico?: string | null, idPrograma?: number): Observable<CursoOfertadoVerano[]> {
    const url = ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.TODOS;
    
    // Solo agregar parámetros si se proporcionan
    let httpParams = new HttpParams();
    
    if (periodoAcademico && periodoAcademico.trim() !== '' && periodoAcademico.trim().toLowerCase() !== 'todos') {
      // Normalizar el período: asegurar formato YYYY-P (el backend normaliza automáticamente)
      const periodoNormalizado = periodoAcademico.trim();
      httpParams = httpParams.set('periodoAcademico', periodoNormalizado);
    } else {
    }
    
    if (idPrograma !== undefined && idPrograma !== null) {
      httpParams = httpParams.set('idPrograma', idPrograma.toString());
    }
    
    // Si hay parámetros, agregarlos a la URL, si no, llamar sin parámetros para mostrar todos
    const options = httpParams.keys().length > 0 
      ? { params: httpParams }
      : {};
    
    return this.http.get<CursoOfertadoVerano[]>(url, options).pipe(
      map(cursos => {
        if (periodoAcademico && periodoAcademico.trim() !== '' && periodoAcademico.trim().toLowerCase() !== 'todos') {
        }
        return cursos.map(curso => this.normalizarCurso(curso));
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Obtener cursos filtrados por estado
   * 
   * @param estado Estado del curso (Preinscripción, Inscripción, etc.)
   * @param periodoAcademico (opcional): Período académico en formato "YYYY-P" (ej: "2025-2")
   *                         Si no se proporciona o se envía "todos", muestra cursos de todos los períodos.
   * 
   * @returns Observable con la lista de cursos filtrados por estado
   */
  getCursosPorEstado(estado: string, periodoAcademico?: string | null): Observable<CursoOfertadoVerano[]> {
    let url: string;
    let httpParams = new HttpParams();
    
    // Determinar el endpoint según el estado
    if (estado === 'Preinscripción') {
      url = ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.PREINSCRIPCION;
    } else if (estado === 'Inscripción') {
      url = ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.INSCRIPCION;
    } else {
      // Para otros estados, usar endpoint /todos y filtrar localmente
      url = ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.TODOS;
    }
    
    // Agregar parámetro de período si se proporciona (y no es "todos")
    if (periodoAcademico && periodoAcademico.trim() !== '' && periodoAcademico.trim().toLowerCase() !== 'todos') {
      httpParams = httpParams.set('periodoAcademico', periodoAcademico);
    
    const options = httpParams.keys().length > 0 
      ? { params: httpParams }
      : {};
    
    return this.http.get<CursoOfertadoVerano[]>(url, options).pipe(
      map(cursos => {
        const cursosNormalizados = cursos.map(curso => this.normalizarCurso(curso));
        
        // Si no es Preinscripción ni Inscripción, filtrar por estado localmente
        if (estado !== 'Preinscripción' && estado !== 'Inscripción') {
          return cursosNormalizados.filter(curso => {
            const estadoActual = this.obtenerEstadoActual(curso);
            return estadoActual === estado;
          });
        }
        
        return cursosNormalizados;
      })
    );
  }

  // Consultar permisos para un estado y rol específico
  getPermisosEstado(estado: string, rol: string): Observable<string[]> {
    return this.http.get<string[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.PERMISOS_ESTADO(estado, rol));
  }

  // Preinscripción a curso de verano
  crearPreinscripcion(payload: CreatePreinscripcionDTO): Observable<SolicitudCursoVerano> {
    return this.http.post<SolicitudCursoVerano>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.PREINSCRIPCIONES, payload);
  }

  // Inscripción a curso de verano
  crearInscripcion(payload: CreateInscripcionDTO): Observable<SolicitudCursoVerano> {
    return this.http.post<SolicitudCursoVerano>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.INSCRIPCIONES, payload);
  }

  // Obtener solicitudes de un usuario
  getSolicitudesUsuario(idUsuario: number): Observable<SolicitudCursoVerano[]> {
    return this.http.get<SolicitudCursoVerano[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-verano/solicitudes/${idUsuario}`);
  }

  // Seguimiento de solicitud
  getSeguimientoSolicitud(idSolicitud: number): Observable<SolicitudCursoVerano> {
    return this.http.get<SolicitudCursoVerano>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-verano/seguimiento/${idSolicitud}`);
  }

  // ====== FUNCIONARIOS - GESTIÓN DE SOLICITUDES ======
  
  // Obtener preinscripciones de un curso
  getPreinscripcionesCurso(idCurso: number): Observable<SolicitudCursoVerano[]> {
    return this.http.get<SolicitudCursoVerano[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-verano/preinscripciones/${idCurso}`);
  }

  // Obtener inscripciones de un curso
  getInscripcionesCurso(idCurso: number): Observable<SolicitudCursoVerano[]> {
    return this.http.get<SolicitudCursoVerano[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-verano/inscripciones/${idCurso}`);
  }

  // Aprobar preinscripción
  aprobarPreinscripcion(id: number, comentarios?: string): Observable<any> {
    // Endpoint correcto según especificación
    const endpoint = `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/preinscripciones/${id}/aprobar`;
    
    // Body simplificado - solo comentarios si se proporcionan
    const body = comentarios ? { comentarios } : {};
    
    return this.http.put<any>(endpoint, body);
  }

  // Rechazar preinscripción
  rechazarPreinscripcion(id: number, motivo: string): Observable<any> {
    // Endpoint correcto según especificación
    const endpoint = `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/preinscripciones/${id}/rechazar`;
    
    // Body con motivo obligatorio
    const body = { motivo };
    
    return this.http.put<any>(endpoint, body);
  }

  // Actualizar observaciones de preinscripción
  actualizarObservacionesPreinscripcion(id: number, observaciones: string): Observable<any> {
    // Endpoint correcto según especificación
    const endpoint = `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/preinscripciones/${id}/observaciones`;
    
    // Body con observaciones
    const body = { observaciones };
    
    return this.http.put<any>(endpoint, body);
  }

  // Validar pago de inscripción
  validarPagoInscripcion(id: number): Observable<SolicitudCursoVerano> {
    return this.http.put<SolicitudCursoVerano>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-verano/inscripciones/${id}/validar-pago`, {});
  }

  // Completar inscripción
  completarInscripcion(id: number): Observable<SolicitudCursoVerano> {
    return this.http.put<SolicitudCursoVerano>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-verano/inscripciones/${id}/completar`, {});
  }

  // ====== NOTIFICACIONES ======
  
  // Obtener notificaciones de usuario
  getNotificacionesUsuario(idUsuario: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/notificaciones/usuario/${idUsuario}`);
  }

  // Obtener notificaciones no leídas
  getNotificacionesNoLeidas(idUsuario: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/notificaciones/usuario/${idUsuario}/no-leidas`);
  }

  // Obtener dashboard de notificaciones
  getDashboardNotificaciones(idUsuario: number): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/notificaciones/dashboard/${idUsuario}`);
  }

  // Marcar notificación como leída
  marcarNotificacionLeida(idNotificacion: number): Observable<void> {
    return this.http.put<void>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/notificaciones/${idNotificacion}/marcar-leida`, {});
  }

  // ====== SOLICITUD DE CURSO NUEVO ======
  
  /**
   * Obtiene la lista de salones activos disponibles
   * Requiere autenticación con rol Funcionario, Coordinador o Administrador
   */
  getSalones(): Observable<Salon[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`,
      'Content-Type': 'application/json; charset=utf-8'
    });
    
    return this.http.get<Salon[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.SALONES, { headers })
      .pipe(
        catchError((error: any) => {
          return throwError(() => error);
        })
      );
  }

  // Obtener todas las materias disponibles para solicitar (datos reales de la BD)
  getMateriasDisponibles(): Observable<Materia[]> {
    return this.http.get<Materia[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.CURSOS_DISPONIBLES);
  }

  // Método legacy para compatibilidad
  getCursosDisponiblesParaSolicitud(): Observable<CursoDisponible[]> {
    return this.http.get<CursoDisponible[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.CURSOS_DISPONIBLES);
  }

  // Obtener condiciones de solicitud (enum)
  getCondicionesSolicitud(): Observable<CondicionSolicitudVerano[]> {
    return this.http.get<CondicionSolicitudVerano[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.CONDICIONES);
  }

  // Crear solicitud de curso nuevo
  crearSolicitudCursoNuevo(payload: CreateSolicitudCursoNuevoDTO): Observable<SolicitudCursoNuevo> {
    return this.http.post<SolicitudCursoNuevo>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.SOLICITUDES_CURSO_NUEVO, payload);
  }

  // Obtener todas las solicitudes (para funcionarios)
  getTodasLasSolicitudes(): Observable<SolicitudCursoVerano[]> {
    return this.http.get<SolicitudCursoVerano[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/solicitudes-curso-nuevo`);
  }

  // Nuevo método para el endpoint actualizado de visualizar solicitudes
  getSolicitudesVisualizar(
    idMateria?: number | null,
    periodoAcademico?: string | null,
    idCurso?: number | null,
    estado?: string | null,
    fechaInicio?: string | null,
    fechaFin?: string | null
  ): Observable<any[]> {
    const url = `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/solicitudes`;
    let httpParams = new HttpParams();
    
    if (idMateria !== undefined && idMateria !== null && idMateria !== 0) {
      httpParams = httpParams.set('idMateria', idMateria.toString());
    }
    
    if (periodoAcademico && periodoAcademico.trim() !== '' && periodoAcademico.trim().toLowerCase() !== 'todos') {
      httpParams = httpParams.set('periodoAcademico', periodoAcademico.trim());
    }
    
    if (idCurso !== undefined && idCurso !== null) {
      httpParams = httpParams.set('idCurso', idCurso.toString());
    }
    
    if (estado && estado.trim() !== '') {
      httpParams = httpParams.set('estado', estado.trim());
    }
    
    if (fechaInicio && fechaInicio.trim() !== '') {
      httpParams = httpParams.set('fechaInicio', fechaInicio.trim());
    }
    
    if (fechaFin && fechaFin.trim() !== '') {
      httpParams = httpParams.set('fechaFin', fechaFin.trim());
    }
    
    const options = httpParams.keys().length > 0 
      ? { params: httpParams }
      : {};
    
      idMateria,
      periodoAcademico,
      idCurso,
      estado,
      fechaInicio,
      fechaFin
    });
    
    return this.http.get<any[]>(url, options).pipe(
      map(solicitudes => {
        return solicitudes;
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  // Nuevo método para el filtro de materias
  getMateriasFiltro(): Observable<any[]> {
    return this.http.get<any[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/materias-filtro`);
  }

  // ====== GESTIÓN DE CURSOS (para funcionarios) ======
  
  // Obtener todos los cursos para gestión (legacy - usar getTodosLosCursosParaFuncionarios)
  getTodosLosCursos(): Observable<CursoOfertadoVerano[]> {
    return this.getTodosLosCursosParaFuncionarios();
  }

  // Crear nuevo curso
  crearCurso(payload: CreateCursoDTO): Observable<CursoOfertadoVerano> {
    // Construir payload SOLO con los campos que el backend espera
    // El backend NO espera: nombre_curso, codigo_curso, descripcion, cupo_maximo
    const payloadParaBackend: any = {
      id_materia: Number(payload.id_materia),
      id_docente: Number(payload.id_docente), // Asegurar que sea número
      cupo_estimado: Number(payload.cupo_estimado),
      fecha_inicio: payload.fecha_inicio,
      fecha_fin: payload.fecha_fin,
      periodoAcademico: payload.periodoAcademico
    };
    
    // Campos opcionales (solo incluir si tienen valor)
    if (payload.id_salon) {
      payloadParaBackend.id_salon = Number(payload.id_salon);
    } else if (payload.espacio_asignado) {
      // Mantener compatibilidad con espacio_asignado (deprecated)
      payloadParaBackend.espacio_asignado = payload.espacio_asignado;
    }
    
    if (payload.estado) {
      // Mapear el estado para el backend (sin tildes)
      payloadParaBackend.estado = this.mapEstadoParaBackend(payload.estado);
    }
    
    // Campo grupo (opcional, se valida en el backend)
    if (payload.grupo) {
      const grupoUpper = String(payload.grupo).toUpperCase().trim();
      if (['A', 'B', 'C', 'D'].includes(grupoUpper)) {
        payloadParaBackend.grupo = grupoUpper;
      } else {
        // Si no es válido, usar "A" por defecto
        payloadParaBackend.grupo = 'A';
      }
    } else {
      // Si no se proporciona, usar "A" por defecto
      payloadParaBackend.grupo = 'A';
    }
    
    // Asegurar que id_docente sea un número
    payloadParaBackend.id_docente = Number(payloadParaBackend.id_docente);
    
    
    return this.http.post<CursoOfertadoVerano>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.GESTION, payloadParaBackend)
      .pipe(
        map(curso => {
          // Normalizar el curso retornado para asegurar que el grupo se preserve
          const cursoNormalizado = this.normalizarCurso(curso);
          // Log de depuración (comentado para producción)
          return cursoNormalizado;
        })
      );
  }

  // Mapear estados del frontend al backend (para envío)
  private mapEstadoParaBackend(estado: string): string {
    const estadosMap: { [key: string]: string } = {
      'Borrador': 'Borrador',
      'Abierto': 'Abierto',
      'Publicado': 'Publicado', 
      'Preinscripción': 'Preinscripcion',  // Sin tilde para el backend
      'Inscripción': 'Inscripcion',        // Sin tilde para el backend
      'Cerrado': 'Cerrado'
    };
    return estadosMap[estado] || estado;
  }

  // Actualizar curso existente (solo campos editables)
  actualizarCurso(id: number, payload: UpdateCursoDTO): Observable<CursoOfertadoVerano> {
    // Mapear el estado para el backend
    const payloadParaBackend = {
      ...payload,
      estado: payload.estado ? this.mapEstadoParaBackend(payload.estado) : payload.estado
    };
    
    return this.http.put<CursoOfertadoVerano>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.GESTION}/${id}`, payloadParaBackend);
  }

  // Eliminar curso
  eliminarCurso(id: number): Observable<void> {
    return this.http.delete<void>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.GESTION}/${id}`);
  }

  // Obtener curso por ID
  getCursoPorId(id: number): Observable<CursoOfertadoVerano> {
    return this.http.get<CursoOfertadoVerano>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.GESTION}/${id}`);
  }

  // Obtener todas las materias
  getTodasLasMaterias(): Observable<Materia[]> {
    return this.http.get<Materia[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/materias`);
  }

  // Obtener todos los docentes
  getTodosLosDocentes(): Observable<Usuario[]> {
    return this.http.get<any[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/docentes`).pipe(
      map(docentes => docentes.map(docente => {
        // Separar nombre completo en nombre y apellido
        const nombreCompleto = this.corregirEncoding(docente.nombre_usuario || '');
        const partesNombre = nombreCompleto.split(' ');
        const nombre = partesNombre[0] || 'Sin nombre';
        const apellido = partesNombre.slice(1).join(' ') || 'Sin apellido';
        
        const docenteMapeado = {
          id_usuario: docente.id_usuario,
          id_docente: docente.id_docente || docente.id_usuario, // Incluir id_docente si está disponible
          nombre: nombre,
          apellido: apellido,
          email: this.corregirEncoding(docente.correo || 'Sin email'),
          telefono: docente.telefono || 'Sin teléfono',
          codigo_usuario: docente.codigo_usuario || 'Sin código',
          objRol: {
            id_rol: docente.objRol?.id_rol || 1,
            nombre_rol: this.corregirEncoding(docente.objRol?.nombre || 'Docente')
          }
        };
        
        return docenteMapeado;
      }))
    );
  }

  // ====== PREINSCRIPCIONES (para funcionarios) ======
  
  /**
   * Obtener preinscripciones por curso
   * 
   * @param idCurso ID del curso del cual se desean obtener las preinscripciones
   * @returns Observable con la lista de preinscripciones del curso
   */
  getPreinscripcionesPorCurso(idCurso: number): Observable<SolicitudCursoVerano[]> {
    const url = `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/preinscripciones/curso/${idCurso}`;
    
    return this.http.get<PreinscripcionCurso[]>(url).pipe(
      map(preinscripciones => {
        
        // Convertir PreinscripcionCurso[] a SolicitudCursoVerano[] para compatibilidad
        return preinscripciones.map(preins => {
          // Obtener el curso completo si está disponible, o crear uno básico
          const cursoCompleto: CursoOfertadoVerano | undefined = undefined; // Se puede obtener después si es necesario
          
          const solicitud: SolicitudCursoVerano = {
            id_solicitud: preins.id_solicitud,
            id_preinscripcion: preins.id_preinscripcion,
            nombre_solicitud: `Preinscripción - ${preins.objUsuario.nombre_completo}`,
            fecha_solicitud: new Date(preins.fecha_preinscripcion),
            estado: preins.estado as any, // Convertir el estado (ENVIADA, APROBADA_FUNCIONARIO, etc.)
            observaciones: preins.observaciones || undefined,
            condicion: preins.condicion || undefined,
            objUsuario: {
              id_usuario: preins.objUsuario.id_usuario,
              nombre_completo: preins.objUsuario.nombre_completo,
              correo: preins.objUsuario.correo,
              codigo: preins.objUsuario.codigo,
              codigo_estudiante: preins.objUsuario.codigo_estudiante
            },
            objCurso: preins.objCurso, // Usar objCurso del nuevo formato
            objCursoOfertadoVerano: cursoCompleto, // Puede ser undefined, se completará si es necesario
            tipoSolicitud: 'PREINSCRIPCION',
            fecha_preinscripcion: preins.fecha_preinscripcion
          };
          return solicitud;
        });
      }),
      catchError(error => {
        if (error.status === 404) {
        }
        throw error;
      })
    );
  }

  // Obtener inscripciones por curso específico
  getInscripcionesPorCurso(idCurso: number): Observable<any[]> {
    return this.http.get<any>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones`).pipe(
      map(response => {
        // El backend devuelve { value: [...], Count: n }
        let inscripciones = response;
        if (response && response.value) {
          inscripciones = response.value;
        }
        
        // Filtrar inscripciones por curso
        const inscripcionesFiltradas = inscripciones.filter((inscripcion: any) => 
          inscripcion.cursoId === idCurso
        );
        
        return inscripcionesFiltradas;
      })
    );
  }

  /**
   * Obtener la lista completa de estudiantes (preinscritos e inscritos) de un curso
   * Solo accesible para funcionarios, coordinadores y administradores
   * 
   * @param idCurso ID del curso del cual se desean obtener los estudiantes
   * @returns Observable con la respuesta que incluye información del curso y lista de estudiantes
   */
  getEstudiantesDelCurso(idCurso: number): Observable<RespuestaEstudiantesCurso> {
    const endpoint = ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.ESTUDIANTES_CURSO(idCurso);
    
    // El backend ahora maneja UTF-8 correctamente, no necesitamos normalización manual
    // Los headers UTF-8 se configuran automáticamente en el JWT interceptor
    return this.http.get<RespuestaEstudiantesCurso>(endpoint).pipe(
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Exporta los cursos filtrados a PDF
   * @param periodoAcademico Período académico para filtrar (opcional)
   * @param idPrograma ID del programa para filtrar (opcional)
   * @returns Observable con el blob del PDF y el nombre del archivo
   */
  exportarCursosPDF(periodoAcademico?: string | null, idPrograma?: number): Observable<{ blob: Blob; filename: string }> {
    const url = ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.EXPORTAR_CURSOS_PDF;
    
    let httpParams = new HttpParams();
    
    if (periodoAcademico && periodoAcademico.trim() !== '' && periodoAcademico.trim().toLowerCase() !== 'todos') {
      httpParams = httpParams.set('periodoAcademico', periodoAcademico.trim());
    }
    
    if (idPrograma !== undefined && idPrograma !== null) {
      httpParams = httpParams.set('idPrograma', idPrograma.toString());
    }
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`,
      'Content-Type': 'application/json; charset=utf-8'
    });
    
    return this.http.get(url, {
      headers,
      params: httpParams.keys().length > 0 ? httpParams : undefined,
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map(response => {
        const blob = response.body as Blob;
        let filename = 'cursos_verano.pdf';
        
        // Intentar obtener el nombre del archivo del header Content-Disposition
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
            try {
              filename = decodeURIComponent(filename);
            } catch (e) {
              // Si falla la decodificación, usar el nombre tal cual
            }
          }
        }
        
        // Si no se obtuvo del header, generar uno con la fecha actual
        if (filename === 'cursos_verano.pdf') {
          const fecha = new Date().toISOString().split('T')[0];
          const periodoStr = periodoAcademico ? `_${periodoAcademico.replace('-', '_')}` : '';
          filename = `cursos_verano${periodoStr}_${fecha}.pdf`;
        }
        
        return { blob, filename };
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Exporta los estudiantes de un curso a PDF
   * @param idCurso ID del curso
   * @returns Observable con el blob del PDF y el nombre del archivo
   */
  exportarEstudiantesPDF(idCurso: number): Observable<{ blob: Blob; filename: string }> {
    const url = ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.EXPORTAR_ESTUDIANTES_PDF(idCurso);
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.authService.getToken()}`,
      'Content-Type': 'application/json; charset=utf-8'
    });
    
    return this.http.get(url, {
      headers,
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map(response => {
        const blob = response.body as Blob;
        let filename = `estudiantes_curso_${idCurso}.pdf`;
        
        // Intentar obtener el nombre del archivo del header Content-Disposition
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
            try {
              filename = decodeURIComponent(filename);
            } catch (e) {
              // Si falla la decodificación, usar el nombre tal cual
            }
          }
        }
        
        // Si no se obtuvo del header, generar uno con la fecha actual
        if (filename === `estudiantes_curso_${idCurso}.pdf`) {
          const fecha = new Date().toISOString().split('T')[0];
          filename = `estudiantes_curso_${idCurso}_${fecha}.pdf`;
        }
        
        return { blob, filename };
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // Obtener estudiantes elegibles para inscripción (con pago validado)
  getEstudiantesElegibles(idCurso: number): Observable<EstudianteElegible[]> {
    const endpoint = ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.ESTUDIANTES_ELEGIBLES(idCurso);
    
    return this.http.get<EstudianteElegible[]>(endpoint).pipe(
      map(estudiantes => {
        
        return estudiantes || [];
      })
    );
  }




  // Obtener solicitudes de curso nuevo del usuario
  getSolicitudesCursoNuevoUsuario(idUsuario: number): Observable<SolicitudCursoNuevo[]> {
    return this.http.get<SolicitudCursoNuevo[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.SOLICITUDES_CURSO_NUEVO_USUARIO(idUsuario));
  }

  // ====== MÉTODOS LEGACY (para compatibilidad) ======
  getSolicitudes(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE);
  }

  getSolicitudEstudiante(estudianteId: number): Observable<Solicitud> {
    return this.http.get<Solicitud>(
      `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/estudiante/${estudianteId}`
    );
  }

  crearSolicitud(payload: CreateSolicitudDTO): Observable<Solicitud> {
    return this.http.post<Solicitud>(ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE, payload);
  }

  actualizarSolicitud(id: number, payload: UpdateSolicitudDTO): Observable<Solicitud> {
    return this.http.put<Solicitud>(ApiEndpoints.CURSOS_INTERSEMESTRALES.BY_ID(id.toString()), payload);
  }

  eliminarSolicitud(id: number): Observable<void> {
    return this.http.delete<void>(ApiEndpoints.CURSOS_INTERSEMESTRALES.BY_ID(id.toString()));
  }

  aprobarSolicitud(id: number): Observable<Solicitud> {
    return this.http.put<Solicitud>(ApiEndpoints.CURSOS_INTERSEMESTRALES.APROBAR(id.toString()), {});
  }

  rechazarSolicitud(id: number, motivo?: string): Observable<Solicitud> {
    return this.http.put<Solicitud>(
      ApiEndpoints.CURSOS_INTERSEMESTRALES.RECHAZAR(id.toString()),
      { motivo }
    );
  }

  // ====== INSCRIPCIONES LEGACY ======
  
  // Obtener todas las inscripciones (para funcionarios)
  getTodasLasInscripciones(): Observable<Inscripcion[]> {
    return this.http.get<any[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.INSCRIPCIONES}`).pipe(
      switchMap(inscripciones => {
        // Obtener cursos para mapear correctamente
        return this.getTodosLosCursosParaFuncionarios().pipe(
          map(cursos => inscripciones.map(inscripcion => {
            const curso = cursos.find((c: any) => c.id_curso === inscripcion.cursoId);
            return {
              id_inscripcion: inscripcion.id,
              fecha_inscripcion: new Date(inscripcion.fecha),
              estado: inscripcion.estado,
              archivoPago: inscripcion.archivoPago ? {
                id_documento: inscripcion.archivoPago.id_documento,
                nombre: inscripcion.archivoPago.nombre,
                url: inscripcion.archivoPago.url,
                fecha: inscripcion.archivoPago.fecha
              } : undefined,
              objUsuario: inscripcion.usuario,
              objCurso: curso || inscripcion.curso
            };
          }))
        );
      }),
      catchError(error => {
        // Intentar con endpoint alternativo
        return this.http.get<any[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones`).pipe(
          switchMap(inscripciones => {
            return this.getTodosLosCursosParaFuncionarios().pipe(
              map(cursos => inscripciones.map(inscripcion => {
                const curso = cursos.find((c: any) => c.id_curso === inscripcion.cursoId);
                return {
                  id_inscripcion: inscripcion.id,
                  fecha_inscripcion: new Date(inscripcion.fecha),
                  estado: inscripcion.estado,
                  archivoPago: inscripcion.archivoPago ? {
                    id_documento: inscripcion.archivoPago.id_documento,
                    nombre: inscripcion.archivoPago.nombre,
                    url: inscripcion.archivoPago.url,
                    fecha: inscripcion.archivoPago.fecha
                  } : undefined,
                  objUsuario: inscripcion.usuario,
                  objCurso: curso || inscripcion.curso
                };
              }))
            );
          })
        );
      })
    );
  }
  
  // Obtener inscripciones del usuario autenticado
  getInscripciones(): Observable<Inscripcion[]> {
    // Obtener el usuario autenticado
    const usuario = this.authService.getUsuario();
    if (!usuario?.id_usuario) {
      return of([]); // Retornar array vacío si no hay usuario autenticado
    }
    
    return this.http.get<any[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones-reales/${usuario.id_usuario}`).pipe(
      switchMap(inscripciones => {
        // Obtener cursos para mapear correctamente
        return this.getCursosDisponibles().pipe(
          map(cursos => inscripciones.map(inscripcion => {
            const curso = cursos.find((c: any) => c.id_curso === inscripcion.cursoId);
            return {
              id_inscripcion: inscripcion.id,
              fecha_inscripcion: new Date(inscripcion.fecha),
              estado: inscripcion.estado,
              archivoPago: inscripcion.archivoPago ? {
                id_documento: inscripcion.archivoPago.id_documento,
                nombre: inscripcion.archivoPago.nombre,
                url: inscripcion.archivoPago.url,
                fecha: inscripcion.archivoPago.fecha
              } : undefined,
              objUsuario: {
                id_usuario: inscripcion.estudiante.id_usuario,
                nombre: inscripcion.estudiante.nombre,
                apellido: inscripcion.estudiante.apellido,
                email: inscripcion.estudiante.email,
                telefono: this.getTelefonoEstudiante(inscripcion.estudiante.id_usuario), // Mantener para compatibilidad
                codigo_estudiante: inscripcion.estudiante.codigo_estudiante,
                objRol: { id_rol: 1, nombre_rol: 'Estudiante' }
              },
              objCurso: curso || {
                id_curso: inscripcion.cursoId,
                nombre_curso: 'Curso no encontrado',
                codigo_curso: 'N/A',
                descripcion: 'Curso no disponible',
                fecha_inicio: new Date(),
                fecha_fin: new Date(),
                cupo_maximo: 0,
                cupo_estimado: 0,
                cupo_disponible: 0,
                espacio_asignado: 'N/A',
                estado: 'Cerrado',
                objMateria: { id_materia: 0, codigo: 'N/A', nombre: 'N/A', creditos: 0, descripcion: 'N/A' },
                objDocente: { id_usuario: 0, nombre: 'N/A', apellido: 'N/A', email: 'N/A', telefono: 'N/A', objRol: { id_rol: 2, nombre_rol: 'Docente' } }
              }
            };
          }))
        );
      })
    );
  }

  // Métodos auxiliares para obtener datos de estudiantes
  private getNombreEstudiante(estudianteId: number): string {
    const nombres = ['Ana', 'Carlos', 'María', 'Pedro', 'Laura', 'Diego', 'Sofia', 'Andrés'];
    return nombres[estudianteId % nombres.length] || 'Estudiante';
  }

  private getApellidoEstudiante(estudianteId: number): string {
    const apellidos = ['González', 'Rodríguez', 'Martínez', 'López', 'García', 'Pérez', 'Sánchez', 'Ramírez'];
    return apellidos[estudianteId % apellidos.length] || 'Estudiante';
  }

  private getEmailEstudiante(estudianteId: number): string {
    const nombres = this.getNombreEstudiante(estudianteId).toLowerCase();
    const apellidos = this.getApellidoEstudiante(estudianteId).toLowerCase();
    return `${nombres}.${apellidos}@unicauca.edu.co`;
  }

  private getCodigoEstudiante(estudianteId: number): string {
    return `10461234566${estudianteId}`;
  }

  private getTelefonoEstudiante(estudianteId: number): string {
    return `300${String(estudianteId).padStart(7, '0')}`;
  }

  crearInscripcionLegacy(payload: CreateInscripcionLegacyDTO): Observable<Inscripcion> {
    return this.http.post<Inscripcion>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones`, payload);
  }

  cancelarInscripcion(id: number): Observable<void> {
    return this.http.delete<void>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones/${id}`);
  }

  // Seguimiento de actividades (preinscripciones + inscripciones)
  getSeguimientoActividades(idUsuario: number): Observable<SeguimientoActividades> {
    return this.http.get<SeguimientoActividades>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/seguimiento/${idUsuario}`);
  }

  confirmarInscripcion(id: number): Observable<Inscripcion> {
    return this.http.put<Inscripcion>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones/${id}/confirmar`, {});
  }


  // Aceptar inscripción usando el endpoint correcto del backend
  aceptarInscripcion(idInscripcion: number, observaciones: string = "Inscripción aceptada"): Observable<any> {
    const endpoint = `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones/${idInscripcion}/aceptar`;
    const body = { observaciones };
    
    return this.http.put<any>(endpoint, body);
  }

  // Rechazar inscripción usando el endpoint correcto del backend
  rechazarInscripcion(idInscripcion: number, motivo: string): Observable<any> {
    const endpoint = `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones/${idInscripcion}/rechazar`;
    const body = { motivo };
    
    return this.http.put<any>(endpoint, body);
  }

  // Descargar comprobante de pago
  descargarComprobantePago(idInscripcion: number): Observable<Blob> {
    // Usar el endpoint correcto de archivos
    const endpoint = ApiEndpoints.ARCHIVOS.DESCARGAR_PDF_POR_INSCRIPCION(idInscripcion);
    
    return this.http.get(endpoint, { 
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });
  }

  // Obtener estadísticas del curso
  obtenerEstadisticasCurso(idCurso: number): Observable<any> {
    const endpoint = `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones/curso/${idCurso}/estadisticas`;
    return this.http.get<any>(endpoint);
  }

  // DEBUG: Endpoint para debuggear problemas con inscripciones
  debugInscripcion(idPreinscripcion: number): Observable<DebugInscripcionResponse> {
    const endpoint = ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.DEBUG_INSCRIPCION(idPreinscripcion);
    return this.http.get<DebugInscripcionResponse>(endpoint);
  }

  // DIAGNÓSTICO: Verificar estado de preinscripciones de un usuario en un curso específico
  verificarPreinscripcionesUsuario(idUsuario: number, idCurso: number): Observable<any> {
    const endpoint = `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/preinscripciones/usuario/${idUsuario}/curso/${idCurso}`;
    return this.http.get<any>(endpoint);
  }

  // DIAGNÓSTICO: Obtener todas las preinscripciones de un usuario
  getPreinscripcionesUsuario(idUsuario: number): Observable<any[]> {
    const endpoint = `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/preinscripciones/usuario/${idUsuario}`;
    return this.http.get<any[]>(endpoint);
  }

  // DIAGNÓSTICO: Obtener todas las preinscripciones de un curso (usando método existente)
  // Nota: Ya existe getPreinscripcionesCurso en la línea 82, no duplicar

  // ====== CURSOS (adaptados a CursoListComponent) ======
  
  // Método para corregir problemas de encoding UTF-8
  private corregirEncoding(texto: string | undefined | null): string {
    if (!texto) return '';
    
    try {
      // Intentar corregir caracteres mal codificados
      return texto
        .replace(/Ã¡/g, 'á')
        .replace(/Ã©/g, 'é')
        .replace(/Ã­/g, 'í')
        .replace(/Ã³/g, 'ó')
        .replace(/Ãº/g, 'ú')
        .replace(/Ã±/g, 'ñ')
        .replace(/Ã/g, 'Á')
        .replace(/Ã‰/g, 'É')
        .replace(/Ã/g, 'Í')
        .replace(/Ã"/g, 'Ó')
        .replace(/Ãš/g, 'Ú')
        .replace(/Ã'/g, 'Ñ')
        // Agregar más patrones de encoding problemático
        .replace(/Garc\?\?a/g, 'García')
        .replace(/Mar\?\?a/g, 'María')
        .replace(/L\?\?pez/g, 'López')
        .replace(/Mart\?\?nez/g, 'Martínez')
        .replace(/Rodr\?\?guez/g, 'Rodríguez')
        .replace(/Botero/g, 'Botero'); // Este no tiene acentos
    } catch (error) {
      return texto || '';
    }
  }

  // Método para obtener el estado actual del curso desde la nueva estructura
  private obtenerEstadoActual(curso: CursoOfertadoVerano): string {
    // Si hay estado_actual, usarlo
    if (curso.estado_actual) {
      return curso.estado_actual;
    }
    
    // Si hay estados y hay al menos uno, tomar el más reciente
    if (curso.estados && curso.estados.length > 0) {
      // Ordenar por fecha_registro_estado descendente y tomar el más reciente
      const estadoMasReciente = curso.estados
        .sort((a, b) => new Date(b.fecha_registro_estado).getTime() - new Date(a.fecha_registro_estado).getTime())[0];
      return estadoMasReciente.estado_actual;
    }
    
    // Fallback al campo estado legacy
    return curso.estado || 'Borrador';
  }

  private mapCursoVerano(c: CursoOfertadoVerano): CursoList {
    
    // Obtener el estado actual del curso (de la nueva estructura o del campo legacy)
    const estadoActual = this.obtenerEstadoActual(c);
    
    let estado: 'Disponible' | 'Cerrado' | 'En espera' = 'En espera';
    switch (estadoActual) {
      case 'Abierto':
      case 'Publicado':
      case 'Preinscripción':
      case 'Inscripción':
      case 'Disponible':  // ← AGREGAR ESTE CASE
        estado = 'Disponible';
        break;
      case 'Cerrado':
        estado = 'Cerrado';
        break;
    }
    
    // Usar datos directamente del backend con fallbacks seguros
    const nombre = this.corregirEncoding(c.nombre_curso) || c.nombre_curso || 'Sin nombre';
    const docenteNombre = this.corregirEncoding(c.objDocente?.nombre) || c.objDocente?.nombre || '';
    const docenteApellido = this.corregirEncoding(c.objDocente?.apellido) || c.objDocente?.apellido || '';
    const docente = docenteNombre && docenteApellido ? `${docenteNombre} ${docenteApellido}`.trim() : 'Sin asignar';
    const espacio = this.corregirEncoding(c.espacio_asignado) || c.espacio_asignado || 'Por asignar';
    
    // Obtener período académico (puede venir como 'periodo' o 'periodoAcademico')
    const periodo = c.periodo || c.periodoAcademico || undefined;
    
    const cursoMapeado = {
      codigo: c.codigo_curso || c.id_curso?.toString() || 'N/A',
      nombre: nombre,
      docente: docente,
      cupos: c.cupo_disponible || c.cupo_estimado || 0,
      creditos: c.objMateria?.creditos || 0,
      espacio: espacio,
      estado,
      // Campos de período y fechas
      periodo: periodo,
      periodoAcademico: periodo,
      fecha_inicio: c.fecha_inicio,
      fecha_fin: c.fecha_fin,
      // Campo grupo (A, B, C, D)
      grupo: c.grupo || 'A'
    };
    
    return cursoMapeado;
  }

  private mapCursoLegacy(c: CursoBackend): CursoList {
    let estado: 'Disponible' | 'Cerrado' | 'En espera' = 'En espera';
    switch (c.tipo) {
      case 'ofertado':
      case 'preinscripcion':
        estado = 'Disponible';
        break;
      case 'inscrito':
        estado = 'En espera';
        break;
    }
    return {
      codigo: c.id?.toString() || 'N/A',
      nombre: c.nombre || 'Sin nombre',
      docente: c.docente || 'Sin asignar',
      cupos: c.cupos || 0,
      creditos: 0, // CursoBackend no tiene créditos, usar valor por defecto
      espacio: 'Por asignar', // CursoBackend no tiene espacio, usar valor por defecto
      estado
    };
  }

  // Métodos nuevos para cursos de verano
  getCursosOfertadosVerano(): Observable<CursoList[]> {
    return this.getCursosDisponibles()
      .pipe(map(cursos => cursos.map(curso => this.mapCursoVerano(curso))));
  }

  // Métodos legacy (para compatibilidad)
  getCursosOfertados(): Observable<CursoList[]> {
    return this.http
      .get<CursoBackend[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos/ofertados`)
      .pipe(map(cursos => cursos.map(curso => this.mapCursoLegacy(curso))));
  }

  getCursosPreinscripcion(): Observable<CursoList[]> {
    return this.http
      .get<CursoOfertadoVerano[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos/preinscripcion`)
      .pipe(map(cursos => cursos.map(curso => this.mapCursoVerano(curso))));
  }


  getCursosInscritos(): Observable<CursoList[]> {
    return this.http
      .get<CursoBackend[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos/inscritos`)
      .pipe(map(cursos => cursos.map(curso => this.mapCursoLegacy(curso))));
  }

  // ====== DOCUMENTOS ======
  getDocumentos(solicitudId: number): Observable<any[]> {
    return this.http.get<any[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.DOCUMENTOS(solicitudId.toString()));
  }

  uploadDocumento(solicitudId: number, archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    return this.http.post<any>(
      ApiEndpoints.CURSOS_INTERSEMESTRALES.UPLOAD_DOCUMENT(solicitudId.toString()),
      formData
    );
  }

  /**
   * Subir comprobante de pago para inscripción a curso de verano
   * RECOMENDADO: Usar después de crear la inscripción
   * @param archivo - Archivo PDF del comprobante de pago
   * @param inscripcionId - ID de la inscripción (obtenido después de crear la inscripción)
   * @returns Observable con la respuesta del servidor
   */
  subirComprobantePago(archivo: File, inscripcionId: number): Observable<any> {
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('inscripcionId', inscripcionId.toString());
    // También enviar como alias para compatibilidad
    formData.append('solicitudId', inscripcionId.toString());
    formData.append('idSolicitud', inscripcionId.toString());
    // Opcional: Ser explícito sobre el tipo (también funciona sin esto)
    formData.append('tipoSolicitud', 'curso-verano');

    return this.http.post<any>(
      ApiEndpoints.ARCHIVOS.SUBIR_PDF,
      formData
    );
  }

  /**
   * Subir comprobante ANTES de crear inscripción (también funciona)
   * El archivo se moverá automáticamente cuando se cree la inscripción
   * @param archivo - Archivo PDF del comprobante de pago
   * @returns Observable con la respuesta del servidor
   */
  subirComprobanteSinInscripcion(archivo: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', archivo);

    return this.http.post<any>(
      ApiEndpoints.ARCHIVOS.SUBIR_PDF,
      formData
    );
  }

  /**
   * Obtiene las estadísticas del dashboard de cursos intersemestrales
   * @returns Observable con las estadísticas del dashboard
   */
  getDashboardEstadisticas(): Observable<DashboardEstadisticas> {
    return this.http.get<DashboardEstadisticas>(
      ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.DASHBOARD_ESTADISTICAS
    ).pipe(
      catchError(error => {
        // Retornar valores por defecto en caso de error
        return of({
          totalPreinscripciones: 0,
          totalInscripciones: 0,
          totalSolicitudesCursoNuevo: 0,
          cursosActivos: 0,
          totalCursos: 0,
          cursosGestionados: 0,
          porcentajeProgreso: 0,
          fechaConsulta: new Date().toISOString()
        });
      })
    );
  }

  /**
   * Exporta las solicitudes de cursos intersemestrales a Excel
   * @returns Observable con el blob del archivo Excel y el nombre del archivo
   */
  exportarSolicitudesExcel(
    periodoAcademico?: string | null, 
    idCurso?: number,
    estado?: string,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<{ blob: Blob; filename?: string }> {
    let httpParams = new HttpParams();
    
    if (periodoAcademico && periodoAcademico.trim() !== '' && periodoAcademico.trim().toLowerCase() !== 'todos') {
      httpParams = httpParams.set('periodoAcademico', periodoAcademico.trim());
    }
    
    if (idCurso !== undefined && idCurso !== null) {
      httpParams = httpParams.set('idCurso', idCurso.toString());
    }
    
    if (estado && estado.trim() !== '') {
      httpParams = httpParams.set('estado', estado.trim());
    }
    
    if (fechaInicio && fechaInicio.trim() !== '') {
      httpParams = httpParams.set('fechaInicio', fechaInicio.trim());
    }
    
    if (fechaFin && fechaFin.trim() !== '') {
      httpParams = httpParams.set('fechaFin', fechaFin.trim());
    }
    
    const options = httpParams.keys().length > 0 
      ? { params: httpParams, responseType: 'blob' as 'blob', observe: 'response' as const }
      : { responseType: 'blob' as 'blob', observe: 'response' as const };
    
    
    return this.http.get(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.EXPORTAR_SOLICITUDES_EXCEL, options).pipe(
      map(response => {
        // Verificar que la respuesta sea un blob válido
        const contentType = response.headers.get('Content-Type');
        if (contentType && (
          contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ||
          contentType.includes('application/vnd.ms-excel') ||
          contentType.includes('application/octet-stream')
        )) {
          
          // Extraer el nombre del archivo del header Content-Disposition
          const contentDisposition = response.headers.get('Content-Disposition');
          let filename: string | undefined;
          
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1].replace(/['"]/g, '');
              // Decodificar si está codificado en UTF-8
              try {
                filename = decodeURIComponent(filename);
              } catch {
                // Si falla la decodificación, usar el nombre tal cual
              }
            }
          }
          
          return {
            blob: response.body as Blob,
            filename
          };
        } else {
          throw new Error(`El servidor no devolvió un Excel válido. Content-Type: ${contentType}`);
        }
      }),
      catchError(error => {
        throw error;
      })
    );
  }
}

// ====== DTOs PARA GESTIÓN DE CURSOS ======

export interface Salon {
  id_salon: number;
  numero_salon: string;
  edificio: string;
  activo: boolean;
  descripcion: string;
}

export interface CreateCursoDTO {
  // Campos OBLIGATORIOS según especificación del backend
  id_materia: number;              // Long - ID de la materia seleccionada
  id_docente: number;              // Long - ID del docente seleccionado (usar id_docente, NO id_usuario)
  cupo_estimado: number;           // Integer - Entre 1 y 100
  fecha_inicio: string;            // String - Formato ISO 8601 o fecha simple
  fecha_fin: string;               // String - Formato ISO 8601 o fecha simple
  periodoAcademico: string;        // String - Formato "YYYY-P" (ej: "2025-1", "2025-2")
  
  // Campos OPCIONALES
  id_salon?: number;               // Integer - ID del salón seleccionado (recomendado)
  espacio_asignado?: string;       // String - Deprecated: Si no se envía id_salon, se asigna "Aula 101" por defecto
  estado?: string;                 // String - Valores: "Borrador", "Abierto", "Publicado", "Preinscripcion", "Inscripcion", "Cerrado"
                                   // Si no se envía, se asigna "Abierto" por defecto
  grupo?: string;                  // String - Valores: "A", "B", "C", "D" (case-insensitive)
                                   // Si no se envía o es inválido, se asigna "A" por defecto
  
  // Campos que NO se deben enviar (se obtienen automáticamente del backend):
  // - nombre_curso: Se obtiene de la materia seleccionada
  // - codigo_curso: Se obtiene de la materia seleccionada
  // - descripcion: Se genera automáticamente como "Curso de [nombre_materia]"
  // - cupo_maximo: Es igual a cupo_estimado (se calcula automáticamente)
}

export interface UpdateCursoDTO {
  // Solo campos editables según requerimientos
  cupo_estimado?: number;
  id_salon?: number;               // ID del salón seleccionado (recomendado)
  espacio_asignado?: string;       // Deprecated: mantener para compatibilidad
  estado?: 'Borrador' | 'Abierto' | 'Publicado' | 'Preinscripción' | 'Inscripción' | 'Cerrado' | 'Disponible';
  fecha_inicio?: string;           // Opcional
  fecha_fin?: string;              // Opcional
}
