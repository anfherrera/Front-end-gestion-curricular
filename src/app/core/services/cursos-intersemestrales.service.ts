import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiEndpoints } from '../utils/api-endpoints';
import { nombreDeContentDisposition } from '../utils/download.util';
import {
  ArchivoDescargado,
  CondicionSolicitudVerano,
  CreateCursoDTO,
  CreateInscripcionDTO,
  CreatePreinscripcionDTO,
  CreateSolicitudCursoNuevoDTO,
  CursoOfertadoVerano,
  DashboardEstadisticas,
  Docente,
  EstudianteElegible,
  Materia,
  MateriaFiltro,
  PreinscripcionCurso,
  PreinscripcionUsuario,
  RespuestaAccion,
  RespuestaEstudiantesCurso,
  Salon,
  SeguimientoActividades,
  SolicitudCreada,
  SolicitudCursoVerano,
  SolicitudVisualizar,
  UpdateCursoDTO
} from '../models/cursos-intersemestrales.model';

const BASE = ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE;
const VERANO = ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO;
const GRUPOS = ['A', 'B', 'C', 'D'];

/** El backend recibe los estados de curso sin tilde. */
const ESTADO_PARA_BACKEND: Record<string, string> = {
  'Preinscripción': 'Preinscripcion',
  'Inscripción': 'Inscripcion'
};

/** Valor de un filtro de período: vacío o "todos" significan sin filtro. */
function periodoFiltrado(periodo?: string | null): string | null {
  const valor = periodo?.trim();
  return valor && valor.toLowerCase() !== 'todos' ? valor : null;
}

/** Parámetros de consulta, omitiendo los vacíos. */
function parametros(valores: Record<string, string | number | null | undefined>): HttpParams {
  let params = new HttpParams();
  for (const [clave, valor] of Object.entries(valores)) {
    if (valor === null || valor === undefined) continue;
    const texto = String(valor).trim();
    if (texto !== '') params = params.set(clave, texto);
  }
  return params;
}

function conParametros(params: HttpParams): { params?: HttpParams } {
  return params.keys().length > 0 ? { params } : {};
}

function fechaHoy(): string {
  return new Date().toISOString().split('T')[0];
}

/** Rellena `periodoAcademico` y `grupo` para que los componentes no tengan que adivinarlos. */
function normalizarCurso(curso: CursoOfertadoVerano): CursoOfertadoVerano {
  if (!curso) return curso;
  const periodo = curso.periodo ?? curso.periodoAcademico;
  const grupo = curso.grupo || 'A';
  if (curso.periodo === periodo && curso.periodoAcademico === periodo && curso.grupo === grupo) {
    return curso;
  }
  return { ...curso, periodo, periodoAcademico: periodo, grupo };
}

/** Los períodos llegan como strings o como { valor, descripcion }, a veces envueltos en { success, data }. */
type RespuestaPeriodos = string[] | { valor: string }[] | { success: boolean; data: string[] | { valor: string }[] };

function aPeriodos(respuesta: RespuestaPeriodos | null): string[] {
  const datos = respuesta && !Array.isArray(respuesta) ? respuesta.data : respuesta;
  if (!Array.isArray(datos)) return [];
  return datos.map(p => typeof p === 'string' ? p : p.valor);
}

/**
 * Cursos intersemestrales (de verano): cursos, catálogos, preinscripciones,
 * inscripciones y exportaciones. Los modelos están en core/models/cursos-intersemestrales.model.ts.
 */
@Injectable({ providedIn: 'root' })
export class CursosIntersemestralesService {
  constructor(private http: HttpClient) {}

  // ====== PERÍODOS ACADÉMICOS ======

  /** Todos los períodos (2020-1 a 2030-2). Si falla, lista vacía. */
  getPeriodosAcademicos(): Observable<string[]> {
    return this.periodos(ApiEndpoints.PERIODOS_ACADEMICOS.TODOS);
  }

  /** Solo períodos futuros. Si falla, lista vacía. */
  getPeriodosFuturos(): Observable<string[]> {
    return this.periodos(ApiEndpoints.PERIODOS_ACADEMICOS.FUTUROS);
  }

  /** Períodos de los últimos 5 años. Si falla, lista vacía. */
  getPeriodosRecientes(): Observable<string[]> {
    return this.periodos(ApiEndpoints.PERIODOS_ACADEMICOS.RECIENTES);
  }

  /** Períodos que tienen cursos registrados. */
  getPeriodosRegistrados(): Observable<string[]> {
    return this.http.get<string[]>(`${BASE}/periodos-registrados`);
  }

  private periodos(url: string): Observable<string[]> {
    return this.http.get<RespuestaPeriodos>(url).pipe(
      map(aPeriodos),
      catchError(() => of([]))
    );
  }

  // ====== CURSOS ======

  /**
   * Cursos disponibles para el estudiante. Sin período, el backend usa el actual;
   * "todos" o `todosLosPeriodos` muestran todos. Si falla, lista vacía.
   */
  getCursosDisponibles(periodoAcademico?: string | null, idPrograma?: number, todosLosPeriodos?: boolean): Observable<CursoOfertadoVerano[]> {
    const todos = todosLosPeriodos === true || periodoAcademico?.trim().toLowerCase() === 'todos';
    const params = parametros({
      todosLosPeriodos: todos ? 'true' : null,
      periodoAcademico: todos ? null : periodoAcademico,
      idPrograma
    });
    return this.http.get<CursoOfertadoVerano[] | { data: CursoOfertadoVerano[] }>(VERANO.DISPONIBLES, conParametros(params)).pipe(
      map(respuesta => (Array.isArray(respuesta) ? respuesta : respuesta?.data ?? []).map(normalizarCurso)),
      catchError(() => of([]))
    );
  }

  /** Todos los cursos (funcionario/coordinador). Sin período o con "todos" no filtra. */
  getTodosLosCursosParaFuncionarios(periodoAcademico?: string | null, idPrograma?: number): Observable<CursoOfertadoVerano[]> {
    const params = parametros({ periodoAcademico: periodoFiltrado(periodoAcademico), idPrograma });
    return this.http.get<CursoOfertadoVerano[]>(VERANO.TODOS, conParametros(params)).pipe(
      map(cursos => cursos.map(normalizarCurso))
    );
  }

  /**
   * Cursos en un estado. Preinscripción e Inscripción tienen endpoint propio;
   * los demás estados se filtran sobre la lista completa.
   */
  getCursosPorEstado(estado: string, periodoAcademico?: string | null): Observable<CursoOfertadoVerano[]> {
    const url = estado === 'Preinscripción' ? VERANO.PREINSCRIPCION
      : estado === 'Inscripción' ? VERANO.INSCRIPCION
      : VERANO.TODOS;
    const params = parametros({ periodoAcademico: periodoFiltrado(periodoAcademico) });
    return this.http.get<CursoOfertadoVerano[]>(url, conParametros(params)).pipe(
      map(cursos => {
        const normalizados = cursos.map(normalizarCurso);
        return url === VERANO.TODOS
          ? normalizados.filter(curso => (curso.estado || 'Borrador') === estado)
          : normalizados;
      })
    );
  }

  getCursoPorId(id: number): Observable<CursoOfertadoVerano> {
    return this.http.get<CursoOfertadoVerano>(`${VERANO.GESTION}/${id}`);
  }

  /** Crea el curso. El backend toma nombre, código y descripción de la materia. */
  crearCurso(payload: CreateCursoDTO): Observable<CursoOfertadoVerano> {
    const grupo = String(payload.grupo || 'A').toUpperCase().trim();
    const cuerpo: CreateCursoDTO = {
      id_materia: Number(payload.id_materia),
      id_docente: Number(payload.id_docente),
      cupo_estimado: Number(payload.cupo_estimado),
      fecha_inicio: payload.fecha_inicio,
      fecha_fin: payload.fecha_fin,
      periodoAcademico: payload.periodoAcademico,
      grupo: GRUPOS.includes(grupo) ? grupo : 'A'
    };
    if (payload.id_salon) {
      cuerpo.id_salon = Number(payload.id_salon);
    } else if (payload.espacio_asignado) {
      cuerpo.espacio_asignado = payload.espacio_asignado;
    }
    if (payload.estado) {
      cuerpo.estado = ESTADO_PARA_BACKEND[payload.estado] ?? payload.estado;
    }
    return this.http.post<CursoOfertadoVerano>(VERANO.GESTION, cuerpo).pipe(map(normalizarCurso));
  }

  /** Actualiza los campos editables del curso. */
  actualizarCurso(id: number, payload: UpdateCursoDTO): Observable<CursoOfertadoVerano> {
    const cuerpo = {
      ...payload,
      estado: payload.estado ? ESTADO_PARA_BACKEND[payload.estado] ?? payload.estado : payload.estado
    };
    return this.http.put<CursoOfertadoVerano>(`${VERANO.GESTION}/${id}`, cuerpo);
  }

  eliminarCurso(id: number): Observable<void> {
    return this.http.delete<void>(`${VERANO.GESTION}/${id}`);
  }

  getDashboardEstadisticas(): Observable<DashboardEstadisticas> {
    return this.http.get<DashboardEstadisticas>(VERANO.DASHBOARD_ESTADISTICAS).pipe(
      catchError(() => of({
        totalPreinscripciones: 0,
        totalInscripciones: 0,
        totalSolicitudesCursoNuevo: 0,
        cursosActivos: 0,
        totalCursos: 0,
        cursosGestionados: 0,
        porcentajeProgreso: 0,
        fechaConsulta: new Date().toISOString()
      }))
    );
  }

  // ====== CATÁLOGOS ======

  /** Salones activos (funcionario, coordinador o administrador). */
  getSalones(): Observable<Salon[]> {
    return this.http.get<Salon[]>(VERANO.SALONES);
  }

  getTodasLasMaterias(): Observable<Materia[]> {
    return this.http.get<Materia[]>(`${BASE}/materias`);
  }

  /** Materias que el estudiante puede pedir como curso nuevo. */
  getMateriasDisponibles(): Observable<Materia[]> {
    return this.http.get<Materia[]>(VERANO.CURSOS_DISPONIBLES);
  }

  /** Materias para el filtro de solicitudes (incluye "Todas las materias" con id 0). */
  getMateriasFiltro(): Observable<MateriaFiltro[]> {
    return this.http.get<MateriaFiltro[]>(`${BASE}/materias-filtro`);
  }

  getTodosLosDocentes(): Observable<Docente[]> {
    return this.http.get<Docente[]>(`${BASE}/docentes`);
  }

  getCondicionesSolicitud(): Observable<CondicionSolicitudVerano[]> {
    return this.http.get<CondicionSolicitudVerano[]>(VERANO.CONDICIONES);
  }

  // ====== ESTUDIANTE ======

  crearPreinscripcion(payload: CreatePreinscripcionDTO): Observable<SolicitudCreada> {
    return this.http.post<SolicitudCreada>(VERANO.PREINSCRIPCIONES, payload);
  }

  crearInscripcion(payload: CreateInscripcionDTO): Observable<SolicitudCreada> {
    return this.http.post<SolicitudCreada>(VERANO.INSCRIPCIONES, payload);
  }

  crearSolicitudCursoNuevo(payload: CreateSolicitudCursoNuevoDTO): Observable<unknown> {
    return this.http.post(VERANO.SOLICITUDES_CURSO_NUEVO, payload);
  }

  /** Sube el comprobante de pago de una inscripción ya creada. */
  subirComprobantePago(archivo: File, inscripcionId: number): Observable<unknown> {
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('inscripcionId', inscripcionId.toString());
    formData.append('solicitudId', inscripcionId.toString());
    formData.append('idSolicitud', inscripcionId.toString());
    formData.append('tipoSolicitud', 'curso-verano');
    return this.http.post(ApiEndpoints.ARCHIVOS.SUBIR_PDF, formData);
  }

  /** Preinscripciones e inscripciones del estudiante. */
  getSeguimientoActividades(idUsuario: number): Observable<SeguimientoActividades> {
    return this.http.get<SeguimientoActividades>(`${BASE}/seguimiento/${idUsuario}`);
  }

  getPreinscripcionesUsuario(idUsuario: number): Observable<PreinscripcionUsuario[]> {
    return this.http.get<PreinscripcionUsuario[]>(`${BASE}/preinscripciones/usuario/${idUsuario}`);
  }

  // ====== PREINSCRIPCIONES (FUNCIONARIO) ======

  getPreinscripcionesPorCurso(idCurso: number): Observable<SolicitudCursoVerano[]> {
    return this.http.get<PreinscripcionCurso[]>(`${BASE}/preinscripciones/curso/${idCurso}`).pipe(
      map(preinscripciones => preinscripciones.map(p => ({
        id_solicitud: p.id_solicitud,
        id_preinscripcion: p.id_preinscripcion,
        nombre_solicitud: `Preinscripción - ${p.objUsuario.nombre_completo}`,
        fecha_solicitud: new Date(p.fecha_preinscripcion),
        estado: p.estado,
        observaciones: p.observaciones || undefined,
        condicion: p.condicion || undefined,
        objUsuario: {
          id_usuario: p.objUsuario.id_usuario,
          nombre_completo: p.objUsuario.nombre_completo,
          correo: p.objUsuario.correo,
          codigo: p.objUsuario.codigo,
          codigo_estudiante: p.objUsuario.codigo_estudiante
        },
        objCurso: p.objCurso,
        tipoSolicitud: 'PREINSCRIPCION' as const,
        fecha_preinscripcion: p.fecha_preinscripcion
      })))
    );
  }

  aprobarPreinscripcion(id: number, comentarios?: string): Observable<RespuestaAccion> {
    return this.http.put<RespuestaAccion>(`${BASE}/preinscripciones/${id}/aprobar`, comentarios ? { comentarios } : {});
  }

  rechazarPreinscripcion(id: number, motivo: string): Observable<RespuestaAccion> {
    return this.http.put<RespuestaAccion>(`${BASE}/preinscripciones/${id}/rechazar`, { motivo });
  }

  actualizarObservacionesPreinscripcion(id: number, observaciones: string): Observable<RespuestaAccion> {
    return this.http.put<RespuestaAccion>(`${BASE}/preinscripciones/${id}/observaciones`, { observaciones });
  }

  // ====== INSCRIPCIONES (FUNCIONARIO) ======

  /** Estudiantes con pago por validar o ya validado. */
  getEstudiantesElegibles(idCurso: number): Observable<EstudianteElegible[]> {
    return this.http.get<EstudianteElegible[]>(VERANO.ESTUDIANTES_ELEGIBLES(idCurso)).pipe(
      map(estudiantes => estudiantes || [])
    );
  }

  aceptarInscripcion(idInscripcion: number, observaciones = 'Inscripción aceptada'): Observable<RespuestaAccion> {
    return this.http.put<RespuestaAccion>(`${BASE}/inscripciones/${idInscripcion}/aceptar`, { observaciones });
  }

  rechazarInscripcion(idInscripcion: number, motivo: string): Observable<RespuestaAccion> {
    return this.http.put<RespuestaAccion>(`${BASE}/inscripciones/${idInscripcion}/rechazar`, { motivo });
  }

  descargarComprobantePago(idInscripcion: number): Observable<Blob> {
    return this.http.get(ApiEndpoints.ARCHIVOS.DESCARGAR_PDF_POR_INSCRIPCION(idInscripcion), {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' }
    });
  }

  /** Preinscritos e inscritos de un curso (funcionario, coordinador o administrador). */
  getEstudiantesDelCurso(idCurso: number): Observable<RespuestaEstudiantesCurso> {
    return this.http.get<RespuestaEstudiantesCurso>(VERANO.ESTUDIANTES_CURSO(idCurso));
  }

  // ====== SOLICITUDES Y EXPORTACIONES ======

  /** Solicitudes de la pantalla "Visualizar solicitudes". Sin filtros devuelve todas. */
  getSolicitudesVisualizar(
    idMateria?: number | null,
    periodoAcademico?: string | null,
    idCurso?: number | null,
    estado?: string | null,
    fechaInicio?: string | null,
    fechaFin?: string | null
  ): Observable<SolicitudVisualizar[]> {
    const params = parametros({
      idMateria: idMateria || null,
      periodoAcademico: periodoFiltrado(periodoAcademico),
      idCurso,
      estado,
      fechaInicio,
      fechaFin
    });
    return this.http.get<SolicitudVisualizar[]>(`${BASE}/solicitudes`, conParametros(params));
  }

  exportarCursosPDF(periodoAcademico?: string | null, idPrograma?: number): Observable<ArchivoDescargado> {
    const periodo = periodoFiltrado(periodoAcademico);
    const params = parametros({ periodoAcademico: periodo, idPrograma });
    const sufijo = periodo ? `_${periodo.replace('-', '_')}` : '';
    return this.descargar(VERANO.EXPORTAR_CURSOS_PDF, params, `cursos_verano${sufijo}_${fechaHoy()}.pdf`);
  }

  exportarEstudiantesPDF(idCurso: number): Observable<ArchivoDescargado> {
    return this.descargar(VERANO.EXPORTAR_ESTUDIANTES_PDF(idCurso), new HttpParams(), `estudiantes_curso_${idCurso}_${fechaHoy()}.pdf`);
  }

  /** Excel de solicitudes. Falla si el servidor no devuelve un Excel. */
  exportarSolicitudesExcel(
    periodoAcademico?: string | null,
    idCurso?: number,
    estado?: string,
    fechaInicio?: string,
    fechaFin?: string
  ): Observable<ArchivoDescargado> {
    const params = parametros({ periodoAcademico: periodoFiltrado(periodoAcademico), idCurso, estado, fechaInicio, fechaFin });
    return this.http.get(VERANO.EXPORTAR_SOLICITUDES_EXCEL, { ...conParametros(params), responseType: 'blob', observe: 'response' }).pipe(
      map(respuesta => {
        const tipo = respuesta.headers.get('Content-Type') || '';
        const esExcel = ['spreadsheetml.sheet', 'ms-excel', 'octet-stream'].some(t => tipo.includes(t));
        if (!esExcel) {
          throw new Error(`El servidor no devolvió un Excel válido. Content-Type: ${tipo}`);
        }
        return this.archivo(respuesta, `solicitudes_cursos_intersemestrales_${fechaHoy()}.xlsx`);
      })
    );
  }

  private descargar(url: string, params: HttpParams, nombrePorDefecto: string): Observable<ArchivoDescargado> {
    return this.http.get(url, { ...conParametros(params), responseType: 'blob', observe: 'response' }).pipe(
      map(respuesta => this.archivo(respuesta, nombrePorDefecto))
    );
  }

  private archivo(respuesta: HttpResponse<Blob>, nombrePorDefecto: string): ArchivoDescargado {
    return {
      blob: respuesta.body as Blob,
      filename: nombreDeContentDisposition(respuesta.headers) || nombrePorDefecto
    };
  }
}
