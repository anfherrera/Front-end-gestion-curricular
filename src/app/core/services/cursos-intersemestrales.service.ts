import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiEndpoints } from '../utils/api-endpoints';
import { Curso as CursoList } from '../../shared/components/curso-list/curso-list.component';

// ================== MODELOS ACTUALIZADOS ==================
export interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  codigo_estudiante?: string;
  objRol: Rol;
}

export interface Rol {
  id_rol: number;
  nombre_rol: string;
}

export interface Materia {
  id_materia: number;
  nombre_materia: string;
  codigo_materia: string;
  creditos: number;
}

export interface CursoOfertadoVerano {
  id_curso: number;
  nombre_curso: string;
  codigo_curso: string;
  descripcion: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  cupo_maximo: number;
  cupo_disponible: number;
  cupo_estimado: number;
  espacio_asignado: string;
  estado: 'Abierto' | 'Publicado' | 'Preinscripcion' | 'Inscripcion' | 'Cerrado';
  objMateria: Materia;
  objDocente: Usuario;
}

export interface SolicitudCursoVerano {
  id_solicitud: number;
  nombre_solicitud: string;
  fecha_solicitud: Date;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Completado';
  objUsuario: Usuario;
  objCursoOfertadoVerano: CursoOfertadoVerano;
  tipoSolicitud: 'PREINSCRIPCION' | 'INSCRIPCION';
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
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
  objUsuario: Usuario;
}

// ================== MODELOS LEGACY (para compatibilidad) ==================
export interface Solicitud {
  id: number;
  fecha: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
}

export interface Inscripcion {
  id: number;
  cursoId: number;
  estudianteId: number;
  fecha: string;
  estado: 'inscrito' | 'cancelado';
  archivoPago?: {
    id: number;
    nombre: string;
    url: string;
    fecha: string;
  };
}

export interface CursoBackend {
  id: number;
  nombre: string;
  cupos: number;
  docente: string;
  tipo: 'ofertado' | 'preinscripcion' | 'inscrito';
}

// ================== DTOs ACTUALIZADOS ==================
export interface CreatePreinscripcionDTO {
  idUsuario: number;
  idCurso: number;
  nombreSolicitud: string;
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
  constructor(private http: HttpClient) {}

  // ====== CURSOS DE VERANO - NUEVAS APIs ======
  
  // Obtener cursos disponibles para verano
  getCursosDisponibles(): Observable<CursoOfertadoVerano[]> {
    console.log('🌐 Llamando a API:', ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.DISPONIBLES);
    return this.http.get<CursoOfertadoVerano[]>(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.DISPONIBLES);
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
  aprobarPreinscripcion(id: number): Observable<SolicitudCursoVerano> {
    return this.http.put<SolicitudCursoVerano>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-verano/preinscripciones/${id}/aprobar`, {});
  }

  // Rechazar preinscripción
  rechazarPreinscripcion(id: number, motivo?: string): Observable<SolicitudCursoVerano> {
    return this.http.put<SolicitudCursoVerano>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-verano/preinscripciones/${id}/rechazar`, { motivo });
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
  
  // Obtener todos los cursos disponibles para solicitar
  getCursosDisponiblesParaSolicitud(): Observable<CursoDisponible[]> {
    console.log('🌐 Llamando a API:', ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.CURSOS_DISPONIBLES);
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

  // ====== GESTIÓN DE CURSOS (para funcionarios) ======
  
  // Obtener todos los cursos para gestión
  getTodosLosCursos(): Observable<CursoOfertadoVerano[]> {
    console.log('🌐 Llamando a API: GET /api/cursos-intersemestrales/cursos-verano');
    return this.http.get<CursoOfertadoVerano[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-verano`);
  }

  // Crear nuevo curso
  crearCurso(payload: CreateCursoDTO): Observable<CursoOfertadoVerano> {
    console.log('🌐 Llamando a API: POST /api/cursos-intersemestrales/cursos-verano');
    return this.http.post<CursoOfertadoVerano>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-verano`, payload);
  }

  // Actualizar curso existente
  actualizarCurso(id: number, payload: UpdateCursoDTO): Observable<CursoOfertadoVerano> {
    console.log(`🌐 Llamando a API: PUT /api/cursos-intersemestrales/cursos-verano/${id}`);
    return this.http.put<CursoOfertadoVerano>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-verano/${id}`, payload);
  }

  // Eliminar curso
  eliminarCurso(id: number): Observable<void> {
    console.log(`🌐 Llamando a API: DELETE /api/cursos-intersemestrales/cursos-verano/${id}`);
    return this.http.delete<void>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-verano/${id}`);
  }

  // Obtener curso por ID
  getCursoPorId(id: number): Observable<CursoOfertadoVerano> {
    console.log(`🌐 Llamando a API: GET /api/cursos-intersemestrales/cursos-verano/${id}`);
    return this.http.get<CursoOfertadoVerano>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-verano/${id}`);
  }

  // Obtener todas las materias
  getTodasLasMaterias(): Observable<Materia[]> {
    console.log('🌐 Llamando a API: GET /api/cursos-intersemestrales/materias');
    return this.http.get<Materia[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/materias`);
  }

  // Obtener todos los docentes
  getTodosLosDocentes(): Observable<Usuario[]> {
    console.log('🌐 Llamando a API: GET /api/cursos-intersemestrales/docentes');
    return this.http.get<Usuario[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/docentes`);
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
  getInscripciones(): Observable<Inscripcion[]> {
    return this.http.get<Inscripcion[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones`);
  }

  crearInscripcionLegacy(payload: CreateInscripcionLegacyDTO): Observable<Inscripcion> {
    return this.http.post<Inscripcion>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones`, payload);
  }

  cancelarInscripcion(id: number): Observable<void> {
    return this.http.delete<void>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones/${id}`);
  }

  // ====== CURSOS (adaptados a CursoListComponent) ======
  private mapCursoVerano(c: CursoOfertadoVerano): CursoList {
    let estado: 'Disponible' | 'Cerrado' | 'En espera' = 'En espera';
    switch (c.estado) {
      case 'Abierto':
      case 'Publicado':
      case 'Preinscripcion':
      case 'Inscripcion':
        estado = 'Disponible';
        break;
      case 'Cerrado':
        estado = 'Cerrado';
        break;
    }
    return {
      codigo: c.id_curso.toString(),
      nombre: c.nombre_curso,
      docente: `${c.objDocente.nombre} ${c.objDocente.apellido}`,
      cupos: c.cupo_disponible,
      estado
    };
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
      codigo: c.id.toString(),
      nombre: c.nombre,
      docente: c.docente,
      cupos: c.cupos,
      estado
    };
  }

  // Métodos nuevos para cursos de verano
  getCursosOfertadosVerano(): Observable<CursoList[]> {
    return this.getCursosDisponibles()
      .pipe(map(cursos => cursos.map(this.mapCursoVerano)));
  }

  // Métodos legacy (para compatibilidad)
  getCursosOfertados(): Observable<CursoList[]> {
    return this.http
      .get<CursoBackend[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos/ofertados`)
      .pipe(map(cursos => cursos.map(this.mapCursoLegacy)));
  }

  getCursosPreinscripcion(): Observable<CursoList[]> {
    return this.http
      .get<CursoBackend[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos/preinscripcion`)
      .pipe(map(cursos => cursos.map(this.mapCursoLegacy)));
  }

  getCursosInscritos(): Observable<CursoList[]> {
    return this.http
      .get<CursoBackend[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos/inscritos`)
      .pipe(map(cursos => cursos.map(this.mapCursoLegacy)));
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
  cupo_maximo: number;
  cupo_estimado: number;
  espacio_asignado: string;
  estado: 'Abierto' | 'Publicado' | 'Preinscripcion' | 'Inscripcion' | 'Cerrado';
  id_materia: number;
  id_docente: number;
}

export interface UpdateCursoDTO {
  nombre_curso?: string;
  codigo_curso?: string;
  descripcion?: string;
  fecha_inicio?: string; // ISO string
  fecha_fin?: string; // ISO string
  cupo_maximo?: number;
  cupo_estimado?: number;
  espacio_asignado?: string;
  estado?: 'Abierto' | 'Publicado' | 'Preinscripcion' | 'Inscripcion' | 'Cerrado';
  id_materia?: number;
  id_docente?: number;
}
