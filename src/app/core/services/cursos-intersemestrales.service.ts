import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
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
  codigo_estudiante?: string;
  objRol: Rol;
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
  estado: 'Abierto' | 'Publicado' | 'Preinscripcion' | 'Inscripcion' | 'Cerrado' | 'Disponible';
  objMateria: Materia;
  objDocente: Usuario;
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
  nombre_solicitud: string;
  fecha_solicitud: Date;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Completado';
  observaciones?: string;
  condicion?: string;
  objUsuario: UsuarioSolicitud;
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
}

export interface Preinscripcion {
  id_preinscripcion: number;
  fecha_preinscripcion: Date;
  estado: 'Pendiente' | 'Aprobado' | 'Rechazado';
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
  constructor(private http: HttpClient, private authService: AuthService) {}

  // ====== CURSOS DE VERANO - NUEVAS APIs ======
  
  // Obtener cursos disponibles para verano
  getCursosDisponibles(): Observable<CursoOfertadoVerano[]> {
    console.log('🌐 Llamando a API:', `${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-verano`);
    return this.http.get<CursoOfertadoVerano[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-verano`);
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
  
  // Obtener todas las materias disponibles para solicitar
  getMateriasDisponibles(): Observable<Materia[]> {
    console.log('🌐 Llamando a API:', ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.CURSOS_DISPONIBLES);
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

  // ====== PREINSCRIPCIONES (para funcionarios) ======
  
  // Obtener preinscripciones por curso
  getPreinscripcionesPorCurso(idCurso: number): Observable<Preinscripcion[]> {
    console.log(`🌐 Llamando a API: GET /api/cursos-intersemestrales/preinscripciones/curso/${idCurso}`);
    return this.http.get<Preinscripcion[]>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/preinscripciones/curso/${idCurso}`);
  }

  // Actualizar observaciones de preinscripción
  actualizarObservacionesPreinscripcion(idPreinscripcion: number, observaciones: string): Observable<any> {
    console.log(`🌐 Llamando a API: PUT /api/cursos-intersemestrales/preinscripciones/${idPreinscripcion}/observaciones`);
    return this.http.put<any>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/preinscripciones/${idPreinscripcion}/observaciones`, {
      observaciones: observaciones
    });
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
            const curso = cursos.find(c => c.id_curso === inscripcion.cursoId);
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
  getSeguimientoActividades(idUsuario: number): Observable<any> {
    return this.http.get(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/seguimiento/${idUsuario}`);
  }

  confirmarInscripcion(id: number): Observable<Inscripcion> {
    return this.http.put<Inscripcion>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones/${id}/confirmar`, {});
  }

  rechazarInscripcion(id: number): Observable<Inscripcion> {
    return this.http.put<Inscripcion>(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/inscripciones/${id}/rechazar`, {});
  }

  // ====== CURSOS (adaptados a CursoListComponent) ======
  
  // Método para corregir problemas de encoding UTF-8
  private corregirEncoding(texto: string | undefined | null): string {
    if (!texto) return ''; // ← CAMBIAR: devolver '' en lugar de undefined
    
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
        .replace(/Ã'/g, 'Ñ');
    } catch (error) {
      console.warn('Error corrigiendo encoding:', error);
      return texto || '';
    }
  }

  private mapCursoVerano(c: CursoOfertadoVerano): CursoList {
    console.log('🔍 Mapeando curso:', c);
    
    let estado: 'Disponible' | 'Cerrado' | 'En espera' = 'En espera';
    switch (c.estado) {
      case 'Abierto':
      case 'Publicado':
      case 'Preinscripcion':
      case 'Inscripcion':
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
  cupo_maximo: number;
  cupo_estimado: number;
  espacio_asignado: string;
  estado: 'Abierto' | 'Publicado' | 'Preinscripcion' | 'Inscripcion' | 'Cerrado' | 'Disponible';
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
  estado?: 'Abierto' | 'Publicado' | 'Preinscripcion' | 'Inscripcion' | 'Cerrado' | 'Disponible';
  id_materia?: number;
  id_docente?: number;
}
