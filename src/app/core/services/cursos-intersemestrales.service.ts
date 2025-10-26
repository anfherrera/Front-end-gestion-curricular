import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
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
  // ✨ NUEVO: Período académico
  periodoAcademico?: string; // Ejemplo: "2025-1", "2025-2"
  cupo_maximo: number;
  cupo_disponible: number;
  cupo_estimado: number;
  espacio_asignado: string;
  // Mantener el campo estado para compatibilidad, pero ahora se obtendrá del estado actual
  estado?: 'Borrador' | 'Abierto' | 'Publicado' | 'Preinscripción' | 'Inscripción' | 'Cerrado' | 'Disponible';
  objMateria: Materia;
  objDocente: Usuario;
  // Nuevo campo para manejar los estados desde la tabla separada
  estados?: EstadoCurso[];
  estado_actual?: string; // Estado actual del curso
}

// Interfaz específica para usuarios en solicitudes (estructura del backend)
export interface UsuarioSolicitud {
  id_usuario: number;
  nombre_completo: string;
  rol: {
    id_rol: number;
    nombre: string;
  };
  codigo: string;
  correo: string;
  estado_usuario: boolean;
  objPrograma: {
    id_programa: number;
    nombre_programa: string;
  };
}

export interface SolicitudCursoVerano {
  id_solicitud: number;
  id_preinscripcion?: number; // ✅ Campo adicional para compatibilidad
  nombre_solicitud: string;
  fecha_solicitud: Date;
  estado: 'Pendiente' | 'Enviado' | 'Enviada' | 'Aprobado' | 'Rechazado' | 'Completado';
  observaciones?: string;
  condicion?: string;
  objUsuario: UsuarioSolicitud;
  objCursoOfertadoVerano: CursoOfertadoVerano;
  tipoSolicitud: 'PREINSCRIPCION' | 'INSCRIPCION';
  // 🆕 Nuevos campos para el seguimiento mejorado
  estadoCurso?: string;           // Estado actual del curso
  accionesDisponibles?: string[]; // Acciones que puede realizar el estudiante
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
  // 🆕 Nuevos campos para el seguimiento mejorado
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
  estadoCurso?: string;           // 🆕 NUEVO: Estado del curso
  accionesDisponibles?: string[]; // 🆕 NUEVO: Acciones que puede realizar
}

export interface InscripcionSeguimiento {
  id: number;
  fecha: string;
  estado: string;
  tipo: string;
  curso: string;
  estudianteId: number;
  cursoId: number;
  estadoCurso?: string;           // 🆕 NUEVO: Estado del curso
  accionesDisponibles?: string[]; // 🆕 NUEVO: Acciones que puede realizar
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
  constructor(private http: HttpClient, private authService: AuthService) {}

  // ====== PERÍODOS ACADÉMICOS ======

  // Obtener todos los períodos académicos disponibles (2020-1 a 2030-2)
  getPeriodosAcademicos(): Observable<string[]> {
    console.log('🌐 Llamando a API: GET /api/periodos-academicos/todos');
    return this.http.get<any>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE.replace('/cursos-intersemestrales', '')}/periodos-academicos/todos`).pipe(
      map(response => response.data || response)
    );
  }

  // Obtener período académico actual
  getPeriodoActual(): Observable<string> {
    console.log('🌐 Llamando a API: GET /api/periodos-academicos/actual');
    return this.http.get<any>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE.replace('/cursos-intersemestrales', '')}/periodos-academicos/actual`).pipe(
      map(response => response.data || response)
    );
  }

  // Obtener períodos que tienen cursos registrados
  getPeriodosRegistrados(): Observable<string[]> {
    console.log('🌐 Llamando a API: GET /api/cursos-intersemestrales/periodos-registrados');
    return this.http.get<string[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/periodos-registrados`);
  }

  // ====== CURSOS DE VERANO - NUEVAS APIs ======
  
  // Obtener cursos disponibles para verano (para estudiantes - datos reales de la BD)
  getCursosDisponibles(): Observable<CursoOfertadoVerano[]> {
    console.log('🌐 Llamando a API (estudiantes):', ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.DISPONIBLES);
    return this.http.get<CursoOfertadoVerano[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.DISPONIBLES);
  }

  // Obtener cursos filtrados por período académico
  getCursosPorPeriodo(periodo: string): Observable<CursoOfertadoVerano[]> {
    console.log(`🌐 Llamando a API: GET /api/cursos-intersemestrales/cursos-verano/periodo/${periodo}`);
    return this.http.get<CursoOfertadoVerano[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-verano/periodo/${periodo}`);
  }

  // Obtener cursos activos en una fecha específica
  getCursosActivos(fecha: string): Observable<CursoOfertadoVerano[]> {
    console.log(`🌐 Llamando a API: GET /api/cursos-intersemestrales/cursos-activos/${fecha}`);
    return this.http.get<CursoOfertadoVerano[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-activos/${fecha}`);
  }

  // Obtener estadísticas por período
  getEstadisticasPorPeriodo(periodo: string): Observable<any> {
    console.log(`🌐 Llamando a API: GET /api/cursos-intersemestrales/estadisticas/periodo/${periodo}`);
    return this.http.get<any>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/estadisticas/periodo/${periodo}`);
  }

  // Obtener todos los cursos para funcionarios (incluye todos los estados)
  getTodosLosCursosParaFuncionarios(): Observable<any> {
    console.log('🌐 Llamando a API (funcionarios):', ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.TODOS);
    return this.http.get<any>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.TODOS);
  }

  // Obtener cursos por estado específico
  getCursosPorEstado(estado: string): Observable<CursoOfertadoVerano[]> {
    console.log(`🔍 Filtrando cursos por estado: "${estado}"`);
    
    // Para funcionarios, usar endpoint /todos y filtrar localmente
    if (estado === 'Preinscripción') {
      console.log(`🌐 Llamando a endpoint específico para Preinscripción:`, ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.PREINSCRIPCION);
      return this.http.get<CursoOfertadoVerano[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.PREINSCRIPCION);
    } else if (estado === 'Inscripción') {
      console.log(`🌐 Llamando a endpoint específico para Inscripción:`, ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.INSCRIPCION);
      return this.http.get<CursoOfertadoVerano[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.INSCRIPCION);
    } else {
      // Para otros estados, obtener todos los cursos y filtrar localmente
      console.log(`🌐 Obteniendo todos los cursos para filtrar por estado "${estado}":`, ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.TODOS);
      return this.http.get<CursoOfertadoVerano[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.TODOS)
        .pipe(
          map(cursos => {
            const cursosFiltrados = cursos.filter(curso => {
              const estadoActual = this.obtenerEstadoActual(curso);
              return estadoActual === estado;
            });
            console.log(`✅ Cursos filtrados para "${estado}":`, cursosFiltrados.length, 'de', cursos.length);
            return cursosFiltrados;
          })
        );
    }
  }

  // Consultar permisos para un estado y rol específico
  getPermisosEstado(estado: string, rol: string): Observable<string[]> {
    console.log(`🌐 Consultando permisos (${estado}/${rol}):`, ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.PERMISOS_ESTADO(estado, rol));
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
    console.log(`🌐 Llamando a API: PUT /api/cursos-intersemestrales/preinscripciones/${id}/aprobar`);
    console.log(`🔍 DEBUG - ID enviado:`, id);
    console.log(`🔍 DEBUG - Comentarios enviados:`, comentarios);
    
    // ✅ Endpoint correcto según especificación
    const endpoint = `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/preinscripciones/${id}/aprobar`;
    
    // ✅ Body simplificado - solo comentarios si se proporcionan
    const body = comentarios ? { comentarios } : {};
    console.log(`🔍 DEBUG - Body enviado:`, body);
    console.log(`🔍 DEBUG - Endpoint final:`, endpoint);
    
    return this.http.put<any>(endpoint, body);
  }

  // Rechazar preinscripción
  rechazarPreinscripcion(id: number, motivo: string): Observable<any> {
    console.log(`🌐 Llamando a API: PUT /api/cursos-intersemestrales/preinscripciones/${id}/rechazar`);
    console.log(`🔍 DEBUG - ID enviado:`, id);
    console.log(`🔍 DEBUG - Motivo enviado:`, motivo);
    
    // ✅ Endpoint correcto según especificación
    const endpoint = `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/preinscripciones/${id}/rechazar`;
    
    // ✅ Body con motivo obligatorio
    const body = { motivo };
    console.log(`🔍 DEBUG - Body enviado:`, body);
    console.log(`🔍 DEBUG - Endpoint final:`, endpoint);
    
    return this.http.put<any>(endpoint, body);
  }

  // Actualizar observaciones de preinscripción
  actualizarObservacionesPreinscripcion(id: number, observaciones: string): Observable<any> {
    console.log(`🌐 Llamando a API: PUT /api/cursos-intersemestrales/preinscripciones/${id}/observaciones`);
    console.log(`🔍 DEBUG - ID enviado:`, id);
    console.log(`🔍 DEBUG - Observaciones enviadas:`, observaciones);
    
    // ✅ Endpoint correcto según especificación
    const endpoint = `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/preinscripciones/${id}/observaciones`;
    
    // ✅ Body con observaciones
    const body = { observaciones };
    console.log(`🔍 DEBUG - Body enviado:`, body);
    console.log(`🔍 DEBUG - Endpoint final:`, endpoint);
    
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
  
  // Obtener todas las materias disponibles para solicitar (datos reales de la BD)
  getMateriasDisponibles(): Observable<Materia[]> {
    console.log('🌐 Llamando a API (materias reales):', ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.CURSOS_DISPONIBLES);
    return this.http.get<Materia[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.CURSOS_DISPONIBLES);
  }

  // Método legacy para compatibilidad
  getCursosDisponiblesParaSolicitud(): Observable<CursoDisponible[]> {
    console.log('🌐 Llamando a API (legacy):', ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.CURSOS_DISPONIBLES);
    return this.http.get<CursoDisponible[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.CURSOS_DISPONIBLES);
  }

  // Obtener condiciones de solicitud (enum)
  getCondicionesSolicitud(): Observable<CondicionSolicitudVerano[]> {
    console.log('🌐 Llamando a API:', ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.CONDICIONES);
    return this.http.get<CondicionSolicitudVerano[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.CONDICIONES);
  }

  // Crear solicitud de curso nuevo
  crearSolicitudCursoNuevo(payload: CreateSolicitudCursoNuevoDTO): Observable<SolicitudCursoNuevo> {
    return this.http.post<SolicitudCursoNuevo>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.SOLICITUDES_CURSO_NUEVO, payload);
  }

  // Obtener todas las solicitudes (para funcionarios)
  getTodasLasSolicitudes(): Observable<SolicitudCursoVerano[]> {
    console.log('🌐 Llamando a API: GET /api/cursos-intersemestrales/solicitudes-curso-nuevo');
    return this.http.get<SolicitudCursoVerano[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/solicitudes-curso-nuevo`);
  }

  // 🆕 Nuevo método para el endpoint actualizado de visualizar solicitudes
  getSolicitudesVisualizar(): Observable<any[]> {
    console.log('🌐 Llamando a API: GET /api/cursos-intersemestrales/solicitudes');
    return this.http.get<any[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/solicitudes`);
  }

  // 🆕 Nuevo método para el filtro de materias
  getMateriasFiltro(): Observable<any[]> {
    console.log('🌐 Llamando a API: GET /api/cursos-intersemestrales/materias-filtro');
    return this.http.get<any[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/materias-filtro`);
  }

  // ====== GESTIÓN DE CURSOS (para funcionarios) ======
  
  // Obtener todos los cursos para gestión (legacy - usar getTodosLosCursosParaFuncionarios)
  getTodosLosCursos(): Observable<CursoOfertadoVerano[]> {
    console.log('🌐 Llamando a API (legacy): GET /api/cursos-intersemestrales/cursos-verano');
    return this.getTodosLosCursosParaFuncionarios();
  }

  // Crear nuevo curso
  crearCurso(payload: CreateCursoDTO): Observable<CursoOfertadoVerano> {
    console.log('🌐 Llamando a API: POST /api/cursos-intersemestrales/cursos-verano');
    
    // Mapear el estado para el backend
    const payloadParaBackend = {
      ...payload,
      estado: payload.estado ? this.mapEstadoParaBackend(payload.estado) : payload.estado
    };
    
    console.log('📤 Payload original:', payload);
    console.log('📤 Payload para backend:', payloadParaBackend);
    
    return this.http.post<CursoOfertadoVerano>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.GESTION, payloadParaBackend);
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
    console.log(`🌐 Llamando a API: PUT /api/cursos-intersemestrales/cursos-verano/${id}`);
    
    // Mapear el estado para el backend
    const payloadParaBackend = {
      ...payload,
      estado: payload.estado ? this.mapEstadoParaBackend(payload.estado) : payload.estado
    };
    
    console.log('📤 Payload original:', payload);
    console.log('📤 Payload para backend:', payloadParaBackend);
    
    return this.http.put<CursoOfertadoVerano>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.GESTION}/${id}`, payloadParaBackend);
  }

  // Eliminar curso
  eliminarCurso(id: number): Observable<void> {
    console.log(`🌐 Llamando a API: DELETE /api/cursos-intersemestrales/cursos-verano/${id}`);
    return this.http.delete<void>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.GESTION}/${id}`);
  }

  // Obtener curso por ID
  getCursoPorId(id: number): Observable<CursoOfertadoVerano> {
    console.log(`🌐 Llamando a API: GET /api/cursos-intersemestrales/cursos-verano/${id}`);
    return this.http.get<CursoOfertadoVerano>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.GESTION}/${id}`);
  }

  // Obtener todas las materias
  getTodasLasMaterias(): Observable<Materia[]> {
    console.log('🌐 Llamando a API: GET /api/cursos-intersemestrales/materias');
    return this.http.get<Materia[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/materias`);
  }

  // Obtener todos los docentes
  getTodosLosDocentes(): Observable<Usuario[]> {
    console.log('🌐 Llamando a API: GET /api/cursos-intersemestrales/docentes');
    return this.http.get<any[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/docentes`).pipe(
      map(docentes => docentes.map(docente => {
        console.log('🔍 Docente del backend:', docente);
        
        // Separar nombre completo en nombre y apellido
        const nombreCompleto = this.corregirEncoding(docente.nombre_usuario || '');
        const partesNombre = nombreCompleto.split(' ');
        const nombre = partesNombre[0] || 'Sin nombre';
        const apellido = partesNombre.slice(1).join(' ') || 'Sin apellido';
        
        return {
          id_usuario: docente.id_usuario,
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
      }))
    );
  }

  // ====== PREINSCRIPCIONES (para funcionarios) ======
  
  // Obtener preinscripciones por curso (endpoint actualizado)
  getPreinscripcionesPorCurso(idCurso: number): Observable<SolicitudCursoVerano[]> {
    console.log(`🌐 Llamando a API: GET /api/cursos-intersemestrales/preinscripciones/curso/${idCurso}`);
    return this.http.get<SolicitudCursoVerano[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/preinscripciones/curso/${idCurso}`);
  }

  // Obtener inscripciones por curso específico
  getInscripcionesPorCurso(idCurso: number): Observable<any[]> {
    console.log(`🌐 Llamando a API: GET /api/cursos-intersemestrales/inscripciones para filtrar por curso ${idCurso}`);
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
        
        console.log(`✅ Inscripciones filtradas para curso ${idCurso}:`, inscripcionesFiltradas);
        return inscripcionesFiltradas;
      })
    );
  }

  // 🆕 NUEVO: Obtener estudiantes elegibles para inscripción (con pago validado)
  getEstudiantesElegibles(idCurso: number): Observable<EstudianteElegible[]> {
    const endpoint = ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.ESTUDIANTES_ELEGIBLES(idCurso);
    console.log(`🌐 Llamando a API: GET ${endpoint}`);
    console.log(`🔍 ID del curso solicitado: ${idCurso}`);
    
    return this.http.get<EstudianteElegible[]>(endpoint).pipe(
      map(estudiantes => {
        console.log(`📊 Respuesta del backend para curso ${idCurso}:`, estudiantes);
        console.log(`📊 Tipo de respuesta:`, typeof estudiantes);
        console.log(`📊 Es array:`, Array.isArray(estudiantes));
        console.log(`📊 Cantidad de estudiantes:`, estudiantes?.length || 0);
        
        if (estudiantes && estudiantes.length > 0) {
          console.log(`✅ Primer estudiante recibido:`, estudiantes[0]);
        } else {
          console.log(`⚠️ No se recibieron estudiantes del backend para el curso ${idCurso}`);
        }
        
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
    console.log('🌐 Obteniendo todas las inscripciones para funcionarios');
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
        console.error('❌ Error obteniendo inscripciones:', error);
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


  // 🆕 NUEVO: Aceptar inscripción usando el endpoint correcto del backend
  aceptarInscripcion(idInscripcion: number, observaciones: string = "Inscripción aceptada"): Observable<any> {
    const endpoint = `http://localhost:5000/api/cursos-intersemestrales/inscripciones/${idInscripcion}/aceptar`;
    console.log(`🌐 Llamando a API: PUT ${endpoint}`);
    console.log(`🔍 ID de inscripción: ${idInscripcion}`);
    console.log(`🔍 Observaciones: ${observaciones}`);
    
    const body = { observaciones };
    
    return this.http.put<any>(endpoint, body);
  }

  // 🆕 NUEVO: Rechazar inscripción usando el endpoint correcto del backend
  rechazarInscripcion(idInscripcion: number, motivo: string): Observable<any> {
    const endpoint = `http://localhost:5000/api/cursos-intersemestrales/inscripciones/${idInscripcion}/rechazar`;
    console.log(`🌐 Llamando a API: PUT ${endpoint}`);
    console.log(`🔍 ID de inscripción: ${idInscripcion}`);
    console.log(`🔍 Motivo: ${motivo}`);
    
    const body = { motivo };
    
    return this.http.put<any>(endpoint, body);
  }

  // 🆕 NUEVO: Descargar comprobante de pago
  descargarComprobantePago(idInscripcion: number): Observable<Blob> {
    const endpoint = `http://localhost:5000/api/cursos-intersemestrales/inscripciones/${idInscripcion}/comprobante`;
    console.log(`🌐 Llamando a API: GET ${endpoint}`);
    console.log(`🔍 ID de inscripción: ${idInscripcion}`);
    
    return this.http.get(endpoint, { responseType: 'blob' });
  }

  // 🆕 NUEVO: Obtener estadísticas del curso
  obtenerEstadisticasCurso(idCurso: number): Observable<any> {
    const endpoint = `http://localhost:5000/api/cursos-intersemestrales/inscripciones/curso/${idCurso}/estadisticas`;
    console.log(`🌐 Llamando a API: GET ${endpoint}`);
    console.log(`🔍 ID del curso: ${idCurso}`);
    
    return this.http.get<any>(endpoint);
  }

  // 🔍 DEBUG: Endpoint para debuggear problemas con inscripciones
  debugInscripcion(idPreinscripcion: number): Observable<DebugInscripcionResponse> {
    const endpoint = ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.DEBUG_INSCRIPCION(idPreinscripcion);
    console.log(`🔍 Llamando a API de debug: GET ${endpoint}`);
    console.log(`🔍 ID de preinscripción a debuggear: ${idPreinscripcion}`);
    
    return this.http.get<DebugInscripcionResponse>(endpoint);
  }

  // 🔍 DIAGNÓSTICO: Verificar estado de preinscripciones de un usuario en un curso específico
  verificarPreinscripcionesUsuario(idUsuario: number, idCurso: number): Observable<any> {
    const endpoint = `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/preinscripciones/usuario/${idUsuario}/curso/${idCurso}`;
    console.log(`🔍 Verificando preinscripciones: ${endpoint}`);
    console.log(`📊 Parámetros: usuario=${idUsuario}, curso=${idCurso}`);
    return this.http.get<any>(endpoint);
  }

  // 🔍 DIAGNÓSTICO: Obtener todas las preinscripciones de un usuario
  getPreinscripcionesUsuario(idUsuario: number): Observable<any[]> {
    const endpoint = `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/preinscripciones/usuario/${idUsuario}`;
    console.log(`🔍 Obteniendo preinscripciones del usuario: ${endpoint}`);
    return this.http.get<any[]>(endpoint);
  }

  // 🔍 DIAGNÓSTICO: Obtener todas las preinscripciones de un curso (usando método existente)
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
      console.warn('Error corrigiendo encoding:', error);
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
    console.log('🔍 Mapeando curso:', c);
    
    // Obtener el estado actual del curso (de la nueva estructura o del campo legacy)
    const estadoActual = this.obtenerEstadoActual(c);
    console.log('🔍 Estado actual del curso:', estadoActual);
    
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
    
    const cursoMapeado = {
      codigo: c.codigo_curso || c.id_curso?.toString() || 'N/A',
      nombre: nombre,
      docente: docente,
      cupos: c.cupo_disponible || c.cupo_estimado || 0,
      creditos: c.objMateria?.creditos || 0,
      espacio: espacio,
      estado
    };
    
    console.log('✅ Curso mapeado:', cursoMapeado);
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
}

// ====== DTOs PARA GESTIÓN DE CURSOS ======

export interface CreateCursoDTO {
  nombre_curso: string;
  codigo_curso: string;
  descripcion: string;
  fecha_inicio: string; // ISO string
  fecha_fin: string; // ISO string
  // ✨ NUEVO: Período académico
  periodoAcademico?: string; // Ejemplo: "2025-1", "2025-2"
  cupo_maximo: number;
  cupo_estimado: number;
  espacio_asignado: string;
  estado: 'Borrador' | 'Abierto' | 'Publicado' | 'Preinscripción' | 'Inscripción' | 'Cerrado' | 'Disponible';
  id_materia: number;
  id_docente: number;
}

export interface UpdateCursoDTO {
  // Solo campos editables según requerimientos
  cupo_estimado?: number;
  espacio_asignado?: string;
  estado?: 'Borrador' | 'Abierto' | 'Publicado' | 'Preinscripción' | 'Inscripción' | 'Cerrado' | 'Disponible';
}
