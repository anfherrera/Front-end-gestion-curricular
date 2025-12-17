import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, map, catchError } from 'rxjs';
import { ApiEndpoints } from '../utils/api-endpoints';
import { 
  EstadisticasGlobales, 
  EstadisticasProceso, 
  EstadisticasPrograma, 
  ResumenCompleto,
  FiltroEstadisticas,
  FiltrosDashboard,
  EstadisticasGlobalesAPI,
  TotalEstudiantesResponse,
  EstudiantesPorProgramaResponse,
  EstadisticasPorProcesoResponse,
  EstadoSolicitudesResponse,
  TendenciasComparativasResponse,
  EstadisticasCompletas,
  EstadisticasPorProgramaMejoradasResponse,
  EstadisticasPorPeriodoMejoradasResponse,
  CursosVeranoResponse,
  TendenciaTemporal
} from '../models/estadisticas.model';

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {

  constructor(private http: HttpClient) { }

  /**
   * Obtiene estadísticas globales del API real con filtros opcionales
   * GET /api/estadisticas/globales
   * Query params (todos opcionales):
   * - proceso: "Reingreso", "Paz y Salvo", "Homologación", "CURSO_VERANO", "ECAES"
   * - idPrograma: ID del programa
   * - fechaInicio: "yyyy-MM-dd"
   * - fechaFin: "yyyy-MM-dd"
   * ACTUALIZADO: Maneja código 500 como respuesta válida con valores en 0
   */
  getEstadisticasGlobales(filtros: FiltroEstadisticas = {}): Observable<EstadisticasGlobalesAPI> {
    let params = new HttpParams();
    
    if (filtros.proceso) {
      params = params.set('proceso', filtros.proceso);
    }
    
    if (filtros.idPrograma) {
      params = params.set('idPrograma', filtros.idPrograma.toString());
    }
    
    if (filtros.periodoAcademico) {
      params = params.set('periodoAcademico', filtros.periodoAcademico);
    }
    
    // ACTUALIZADO: Agregar fechaInicio y fechaFin según las nuevas instrucciones
    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }
    
    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }

    const url = ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_GLOBALES;

    // ACTUALIZADO: Detectar cuando el endpoint devuelve 500 con valores en 0 o bandera usarEndpointsAlternativos
    // En ese caso, lanzar error para que el componente use endpoints alternativos
    return this.http.get<EstadisticasGlobalesAPI & { usarEndpointsAlternativos?: boolean; error?: boolean; mensaje?: string }>(url, { 
      params,
      observe: 'response' 
    }).pipe(
      map(response => {
        const data = response.body || {} as EstadisticasGlobalesAPI;
        
        // Si el status es 200, usar los datos directamente
        if (response.status === 200) {
          return {
            fechaConsulta: data.fechaConsulta || new Date().toISOString(),
            totalSolicitudes: data.totalSolicitudes || 0,
            totalAprobadas: data.totalAprobadas || 0,
            totalRechazadas: data.totalRechazadas || 0,
            totalEnviadas: data.totalEnviadas || 0,
            totalEnProceso: data.totalEnProceso || 0,
            porcentajeAprobacion: data.porcentajeAprobacion || 0.0,
            porTipoProceso: data.porTipoProceso || {},
            porPrograma: data.porPrograma || {},
            porEstado: data.porEstado || {},
            predicciones: data.predicciones
          } as EstadisticasGlobalesAPI;
        }
        
        // Si el status es 500, verificar si debe usar endpoints alternativos
        if (response.status === 500) {
          const dataWithFlags = data as any;
          
          // Verificar bandera usarEndpointsAlternativos
          if (dataWithFlags.usarEndpointsAlternativos === true || dataWithFlags.error === true) {
            throw new Error('USAR_ENDPOINTS_ALTERNATIVOS');
          }
          
          // Verificar si todos los valores son 0 (indicando que no hay datos reales)
          const tieneDatos = (data.totalSolicitudes || 0) > 0 || 
                            Object.keys(data.porTipoProceso || {}).length > 0 ||
                            Object.keys(data.porPrograma || {}).length > 0 ||
                            Object.keys(data.porEstado || {}).length > 0;
          
          if (!tieneDatos) {
            throw new Error('USAR_ENDPOINTS_ALTERNATIVOS');
          }
          
          // Si tiene datos reales, usar los datos incluso con status 500
          return {
            fechaConsulta: data.fechaConsulta || new Date().toISOString(),
            totalSolicitudes: data.totalSolicitudes || 0,
            totalAprobadas: data.totalAprobadas || 0,
            totalRechazadas: data.totalRechazadas || 0,
            totalEnviadas: data.totalEnviadas || 0,
            totalEnProceso: data.totalEnProceso || 0,
            porcentajeAprobacion: data.porcentajeAprobacion || 0.0,
            porTipoProceso: data.porTipoProceso || {},
            porPrograma: data.porPrograma || {},
            porEstado: data.porEstado || {},
            predicciones: data.predicciones
          } as EstadisticasGlobalesAPI;
        }
        
        // Para otros códigos de error, lanzar error
        throw new Error(`HTTP ${response.status}`);
      }),
      catchError(error => {
        // Si es el error especial para usar endpoints alternativos, propagarlo
        if (error.message === 'USAR_ENDPOINTS_ALTERNATIVOS') {
          throw error;
        }
        
        console.error('Error al obtener estadísticas globales:', error);
        // Para otros errores, también usar endpoints alternativos
        throw new Error('USAR_ENDPOINTS_ALTERNATIVOS');
      })
    );
  }

  /**
   * Obtiene estadísticas filtradas por período académico
   * GET /api/estadisticas/periodo
   * Query params:
   * - periodoAcademico: "2025-1" (formato YYYY-P) O
   * - fechaInicio: "yyyy-MM-dd"
   * - fechaFin: "yyyy-MM-dd"
   * @param periodo Período académico (ej: "2025-1") o objeto con fechaInicio y fechaFin
   */
  getEstadisticasPorPeriodo(periodo: string | { fechaInicio: string; fechaFin: string }): Observable<any> {
    let params = new HttpParams();
    
    if (typeof periodo === 'string') {
      params = params.set('periodoAcademico', periodo);
    } else {
      params = params.set('fechaInicio', periodo.fechaInicio);
      params = params.set('fechaFin', periodo.fechaFin);
    }
    
    // Usar el endpoint correcto según las instrucciones
    return this.http.get<any>(ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_PERIODO, { params });
  }

  /**
   * Obtiene estadísticas globales (método legacy para compatibilidad)
   */
  getEstadisticasGlobalesLegacy(): Observable<EstadisticasGlobales> {
    return this.http.get<EstadisticasGlobales>(ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_GLOBALES);
  }

  /**
   * Obtiene estadísticas de un proceso específico
   * GET /api/estadisticas/proceso/{tipoProceso}
   * Ejemplo: /api/estadisticas/proceso/Reingreso
   * @param nombreProceso Nombre del proceso (ej: 'Reingreso', 'Paz y Salvo', 'Homologación', etc.)
   */
  getEstadisticasProceso(nombreProceso: string): Observable<EstadisticasProceso> {
    return this.http.get<EstadisticasProceso>(ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_PROCESO(nombreProceso));
  }
  
  /**
   * Obtiene estadísticas por estado
   * GET /api/estadisticas/estado/{estado}
   * Ejemplo: /api/estadisticas/estado/Enviada
   * @param estado Estado de las solicitudes (ej: 'Enviada', 'Aprobada', 'Rechazada', etc.)
   */
  getEstadisticasPorEstado(estado: string): Observable<any> {
    return this.http.get<any>(ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_ESTADO(estado));
  }

  /**
   * Obtiene estadísticas de un programa específico
   * @param idPrograma ID del programa
   */
  getEstadisticasPrograma(idPrograma: number): Observable<EstadisticasPrograma> {
    return this.http.get<EstadisticasPrograma>(ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_PROGRAMA(idPrograma));
  }

  /**
   * Obtiene el resumen completo de estadísticas
   * GET /api/estadisticas/resumen-completo
   * 
   * Parámetros opcionales:
   * - periodoAcademico: formato "YYYY-P" (ej: "2025-2")
   * - idPrograma: ID del programa académico
   * 
   * IMPORTANTE: Para que las estadísticas generales se filtren correctamente,
   * el frontend debe pasar los mismos filtros a ambos endpoints:
   * - /api/estadisticas/cursos-verano
   * - /api/estadisticas/resumen-completo
   * 
   * Si no se pasan filtros, mostrará datos generales sin filtrar.
   * 
   * Ejemplo de uso:
   * ```typescript
   * const filtros = { periodoAcademico: '2025-2', idPrograma: 1 };
   * 
   * // Obtener estadísticas de cursos de verano con filtros
   * this.estadisticasService.getCursosVeranoEstadisticas(filtros).subscribe(...);
   * 
   * // Obtener resumen completo con LOS MISMOS filtros
   * this.estadisticasService.getResumenCompleto(filtros).subscribe(...);
   * ```
   * 
   * @param filtros Filtros opcionales: periodoAcademico, idPrograma
   * @returns Observable con el resumen completo de estadísticas
   */
  getResumenCompleto(filtros: { periodoAcademico?: string; idPrograma?: number } = {}): Observable<ResumenCompleto> {
    let params = new HttpParams();
    
    if (filtros.periodoAcademico) {
      params = params.set('periodoAcademico', filtros.periodoAcademico);
    }
    
    if (filtros.idPrograma !== undefined && filtros.idPrograma !== null) {
      params = params.set('idPrograma', filtros.idPrograma.toString());
    }
    
    const options = params.keys().length > 0 ? { params } : {};
    
    return this.http.get<ResumenCompleto>(ApiEndpoints.MODULO_ESTADISTICO.RESUMEN_COMPLETO, options);
  }

  /**
   * Obtiene estadísticas con filtros aplicados usando el endpoint real del backend
   * GET /api/estadisticas/filtradas
   * Query params (todos opcionales):
   * - nombreProceso: "Reingreso"
   * - idPrograma: ID del programa
   * - estado: "Enviada"
   * - fechaInicio: "yyyy-MM-dd"
   * - fechaFin: "yyyy-MM-dd"
   * @param filtros Filtros a aplicar
   */
  getEstadisticasConFiltros(filtros: FiltroEstadisticas & { nombreProceso?: string; estado?: string; fechaInicio?: string; fechaFin?: string }): Observable<any> {
    let params = new HttpParams();
    
    if (filtros.nombreProceso) {
      params = params.set('nombreProceso', filtros.nombreProceso);
    } else if (filtros.proceso) {
      params = params.set('nombreProceso', filtros.proceso);
    }
    
    if (filtros.idPrograma) {
      params = params.set('idPrograma', filtros.idPrograma.toString());
    }
    
    if (filtros.estado) {
      params = params.set('estado', filtros.estado);
    }
    
    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }
    
    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }
    
    if (filtros.periodoAcademico) {
      params = params.set('periodoAcademico', filtros.periodoAcademico);
    }

    return this.http.get(ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_FILTRADAS, { params });
  }

  /**
   * Obtiene estadísticas por período, estado y programa
   * @param fechaInicio Fecha de inicio del período
   * @param fechaFin Fecha de fin del período
   * @param idPrograma ID del programa (opcional)
   * @param estado Estado de las solicitudes (opcional)
   */
  getEstadisticasPorPeriodoEstadoPrograma(
    fechaInicio?: string, 
    fechaFin?: string, 
    idPrograma?: number, 
    estado?: string
  ): Observable<any> {
    let params = new HttpParams();
    
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    if (idPrograma) params = params.set('idPrograma', idPrograma.toString());
    if (estado) params = params.set('estado', estado);

    return this.http.get(ApiEndpoints.MODULO_ESTADISTICO.POR_PERIODO_ESTADO_PROGRAMA, { params });
  }

  /**
   * Obtiene estadísticas por solicitud, período, estado y programa
   * @param idEstadistica ID de la estadística
   * @param proceso Tipo de proceso
   * @param fechaInicio Fecha de inicio del período
   * @param fechaFin Fecha de fin del período
   * @param estado Estado de las solicitudes
   * @param idPrograma ID del programa
   */
  getEstadisticasPorSolicitudPeriodoEstadoPrograma(
    idEstadistica: number,
    proceso: string,
    fechaInicio?: string,
    fechaFin?: string,
    estado?: string,
    idPrograma?: number
  ): Observable<any> {
    let params = new HttpParams();
    
    params = params.set('idEstadistica', idEstadistica.toString());
    params = params.set('proceso', proceso);
    if (fechaInicio) params = params.set('fechaInicio', fechaInicio);
    if (fechaFin) params = params.set('fechaFin', fechaFin);
    if (estado) params = params.set('estado', estado);
    if (idPrograma) params = params.set('idPrograma', idPrograma.toString());

    return this.http.get(ApiEndpoints.MODULO_ESTADISTICO.POR_SOLICITUD_PERIODO_ESTADO_PROGRAMA, { params });
  }

  /**
   * Obtiene estadísticas por tipo de proceso
   * @param tipoProceso Tipo de proceso (ej: 'Solicitud de Reingreso')
   */
  getEstadisticasPorProceso(tipoProceso: string): Observable<any> {
    let params = new HttpParams();
    params = params.set('tipoProceso', tipoProceso);
    
    return this.http.get(ApiEndpoints.MODULO_ESTADISTICO.POR_PROCESO, { params });
  }

  /**
   * Obtiene el número total de estudiantes registrados en el sistema
   * @returns Observable con la respuesta del endpoint de estudiantes
   */
  getTotalEstudiantes(): Observable<TotalEstudiantesResponse> {
    return this.http.get<TotalEstudiantesResponse>(ApiEndpoints.MODULO_ESTADISTICO.TOTAL_ESTUDIANTES);
  }

  /**
   * Obtiene la distribución de estudiantes por programa académico
   * @returns Observable con la respuesta del endpoint de estudiantes por programa
   */
  getEstudiantesPorPrograma(): Observable<EstudiantesPorProgramaResponse> {
    return this.http.get<EstudiantesPorProgramaResponse>(ApiEndpoints.MODULO_ESTADISTICO.ESTUDIANTES_POR_PROGRAMA);
  }

  /**
   * Obtiene estadísticas detalladas por proceso académico
   * @returns Observable con la respuesta del endpoint de estadísticas por proceso
   */
  getEstadisticasDetalladasPorProceso(): Observable<EstadisticasPorProcesoResponse> {
    // Agregar timestamp para evitar caché
    const url = `${ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_POR_PROCESO}?t=${Date.now()}`;
    return this.http.get<EstadisticasPorProcesoResponse>(url);
  }


  /**
   * Obtiene estadísticas por estado de solicitudes
   * GET /api/estadisticas/estado-solicitudes
   * @returns Observable con la respuesta del endpoint de estado de solicitudes
   */
  getEstadoSolicitudes(): Observable<EstadoSolicitudesResponse> {
    return this.http.get<EstadoSolicitudesResponse>(ApiEndpoints.MODULO_ESTADISTICO.ESTADO_SOLICITUDES);
  }

  /**
   * Obtiene tendencias y comparativas estratégicas
   * @returns Observable con la respuesta del endpoint de tendencias y comparativas
   */
  getTendenciasComparativas(): Observable<TendenciasComparativasResponse> {
    return this.http.get<TendenciasComparativasResponse>(ApiEndpoints.MODULO_ESTADISTICO.TENDENCIAS_COMPARATIVAS);
  }

  /**
   * Obtiene estadísticas completas de cursos de verano con predicciones
   * @returns Observable con la respuesta del endpoint de cursos de verano
   */
  /**
   * Obtiene estadísticas de cursos de verano con filtros opcionales
   * GET /api/estadisticas/cursos-verano
   * 
   * Parámetros opcionales:
   * - periodoAcademico: formato "YYYY-P" (ej: "2025-2")
   * - idPrograma: ID del programa académico
   * 
   * Lógica de filtrado:
   * - Filtro por período académico: verifica el período en la solicitud y en el curso asociado
   * - Filtro por programa: verifica que el usuario de la solicitud pertenezca al programa especificado
   * - Ambos filtros son opcionales; si no se envían, se muestran todos los datos
   * 
   * @param filtros Filtros opcionales: periodoAcademico, idPrograma
   * @returns Observable con las estadísticas de cursos de verano
   */
  getCursosVeranoEstadisticas(filtros: { periodoAcademico?: string; idPrograma?: number } = {}): Observable<CursosVeranoResponse> {
    let params = new HttpParams();
    
    if (filtros.periodoAcademico) {
      params = params.set('periodoAcademico', filtros.periodoAcademico);
    }
    
    if (filtros.idPrograma !== undefined && filtros.idPrograma !== null) {
      params = params.set('idPrograma', filtros.idPrograma.toString());
    }
    
    return this.http.get<CursosVeranoResponse>(ApiEndpoints.MODULO_ESTADISTICO.CURSOS_VERANO, { params });
  }

  /**
   * Obtiene solo las tendencias temporales de cursos de verano (OPTIMIZADO)
   * GET /api/estadisticas/cursos-verano/tendencias-temporales
   * 
   * Parámetros opcionales (mismos que getCursosVeranoEstadisticas):
   * - periodoAcademico: formato "YYYY-P" (ej: "2025-2")
   * - idPrograma: ID del programa académico
   * 
   * Carga más rápida, solo datos temporales.
   * 
   * @param filtros Filtros opcionales: periodoAcademico, idPrograma
   * @returns Observable con las tendencias temporales de cursos de verano
   */
  getCursosVeranoTendenciasTemporales(filtros: { periodoAcademico?: string; idPrograma?: number } = {}): Observable<{tendenciasTemporales: TendenciaTemporal[]}> {
    let params = new HttpParams();
    
    if (filtros.periodoAcademico) {
      params = params.set('periodoAcademico', filtros.periodoAcademico);
    }
    
    if (filtros.idPrograma !== undefined && filtros.idPrograma !== null) {
      params = params.set('idPrograma', filtros.idPrograma.toString());
    }
    
    return this.http.get<{tendenciasTemporales: TendenciaTemporal[]}>(ApiEndpoints.MODULO_ESTADISTICO.CURSOS_VERANO_TENDENCIAS_TEMPORALES, { params });
  }

  // ===== MÉTODOS PARA ENDPOINTS MEJORADOS =====

  /**
   * Obtiene estadísticas por programa mejoradas con análisis de rendimiento
   * @returns Observable con la respuesta del endpoint mejorado de estadísticas por programa
   */
  getEstadisticasPorProgramaMejoradas(): Observable<EstadisticasPorProgramaMejoradasResponse> {
    return this.http.get<EstadisticasPorProgramaMejoradasResponse>(ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_POR_PROGRAMA_MEJORADAS);
  }

  /**
   * Obtiene estadísticas por período mejoradas con tendencias y proyecciones
   * @returns Observable con la respuesta del endpoint mejorado de estadísticas por período
   */
  getEstadisticasPorPeriodoMejoradas(): Observable<EstadisticasPorPeriodoMejoradasResponse> {
    return this.http.get<EstadisticasPorPeriodoMejoradasResponse>(ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_POR_PERIODO_MEJORADAS);
  }

  /**
   * Obtiene estado de solicitudes mejorado con análisis de distribución
   * @returns Observable con la respuesta del endpoint mejorado de estado de solicitudes
   */
  getEstadoSolicitudesMejorado(): Observable<EstadoSolicitudesResponse> {
    return this.http.get<EstadoSolicitudesResponse>(ApiEndpoints.MODULO_ESTADISTICO.ESTADO_SOLICITUDES);
  }

  /**
   * Obtiene todas las estadísticas de estudiantes en una sola llamada
   * @returns Observable con todas las estadísticas consolidadas
   */
  getEstadisticasCompletas(): Observable<EstadisticasCompletas> {
    
    return new Observable(observer => {
      let totalEstudiantes = 0;
      let estudiantesPorPrograma: { [programa: string]: number } = {};
      let estadisticasPorProceso: { [proceso: string]: any } = {};
      let estadoSolicitudes: { [estado: string]: any } = {};
      let fechaConsulta = new Date().toISOString();
      let error: string | undefined;

      // Ejecutar todas las llamadas en paralelo
      const totalEstudiantes$ = this.getTotalEstudiantes();
      const estudiantesPorPrograma$ = this.getEstudiantesPorPrograma();
      const estadisticasPorProceso$ = this.getEstadisticasDetalladasPorProceso();
      const estadoSolicitudes$ = this.getEstadoSolicitudes();

      // Combinar todas las respuestas
      const combined$ = new Observable(subscriber => {
        let completed = 0;
        const total = 4;

        totalEstudiantes$.subscribe({
          next: (response) => {
            totalEstudiantes = response.totalEstudiantes;
            fechaConsulta = response.fechaConsulta;
            completed++;
            if (completed === total) {
              subscriber.next(true);
              subscriber.complete();
            }
          },
          error: (err) => {
            console.error('Error obteniendo total de estudiantes:', err);
            error = 'Error al obtener total de estudiantes';
            completed++;
            if (completed === total) {
              subscriber.next(true);
              subscriber.complete();
            }
          }
        });

        estudiantesPorPrograma$.subscribe({
          next: (response) => {
            estudiantesPorPrograma = response.estudiantesPorPrograma;
            completed++;
            if (completed === total) {
              subscriber.next(true);
              subscriber.complete();
            }
          },
          error: (err) => {
            console.error('Error obteniendo estudiantes por programa:', err);
            error = 'Error al obtener estudiantes por programa';
            completed++;
            if (completed === total) {
              subscriber.next(true);
              subscriber.complete();
            }
          }
        });

        estadisticasPorProceso$.subscribe({
          next: (response) => {
            estadisticasPorProceso = response.estadisticasPorProceso;
            completed++;
            if (completed === total) {
              subscriber.next(true);
              subscriber.complete();
            }
          },
          error: (err) => {
            console.error('Error obteniendo estadísticas por proceso:', err);
            error = 'Error al obtener estadísticas por proceso';
            completed++;
            if (completed === total) {
              subscriber.next(true);
              subscriber.complete();
            }
          }
        });

        estadoSolicitudes$.subscribe({
          next: (response) => {
            // ACTUALIZADO: Usar resumenPorEstado con fallback a estados, asegurando que nunca sea undefined
            estadoSolicitudes = response.resumenPorEstado || response.estados || {};
            completed++;
            if (completed === total) {
              subscriber.next(true);
              subscriber.complete();
            }
          },
          error: (err) => {
            console.error('Error obteniendo estado de solicitudes:', err);
            error = 'Error al obtener estado de solicitudes';
            completed++;
            if (completed === total) {
              subscriber.next(true);
              subscriber.complete();
            }
          }
        });
      });

      combined$.subscribe({
        next: () => {
          const resultado: EstadisticasCompletas = {
            totalEstudiantes,
            estudiantesPorPrograma,
            estadisticasPorProceso,
            estadoSolicitudes,
            fechaConsulta,
            loading: false,
            error
          };
          observer.next(resultado);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }

  /**
   * Obtiene la lista de procesos disponibles (nombres exactos del backend)
   * ACTUALIZADO: Usa los nombres exactos que el backend espera según el backend
   */
  getProcesosDisponibles(): string[] {
    return [
      'Reingreso',
      'Homologación',
      'Cursos de Verano',
      'ECAES',
      'Paz y Salvo'
    ];
  }

  /**
   * Obtiene la lista de programas disponibles basados en los datos del backend
   */
  getProgramasDisponibles(): any[] {
    return [
      { id: 1, nombre: 'Ingenieria de Sistemas' },
      { id: 2, nombre: 'Ingenieria Electronica y Telecomunicaciones' },
      { id: 3, nombre: 'Ingenieria Automatica Industrial' },
      { id: 4, nombre: 'Tecnologia en Telematica' }
    ];
  }

  /**
   * Obtiene resumen completo con filtros aplicados
   */
  getResumenCompletoConFiltros(filtros: FiltrosDashboard): Observable<ResumenCompleto> {
    
    // Simular delay de red
    return of(this.generarResumenCompletoConFiltros(filtros)).pipe(delay(1000));
  }

  /**
   * Genera resumen completo con filtros aplicados (mock)
   */
  private generarResumenCompletoConFiltros(filtros: FiltrosDashboard): ResumenCompleto {
    const resumenBase = this.generarDatosMock();
    
    // Aplicar filtros
    let estadisticasGlobales = { ...resumenBase.estadisticasGlobales };
    let estadisticasPorProceso = [...resumenBase.estadisticasPorProceso];
    let estadisticasPorPrograma = [...resumenBase.estadisticasPorPrograma];

    // Filtrar por proceso
    if (filtros.proceso) {
      estadisticasPorProceso = estadisticasPorProceso.filter(
        proceso => proceso.nombreProceso === filtros.proceso
      );
      
      // Recalcular estadísticas globales basadas en el proceso filtrado
      if (estadisticasPorProceso.length > 0) {
        const procesoFiltrado = estadisticasPorProceso[0];
        estadisticasGlobales = {
          totalSolicitudes: procesoFiltrado.totalSolicitudes,
          solicitudesAprobadas: procesoFiltrado.aprobadas,
          solicitudesRechazadas: procesoFiltrado.rechazadas,
          solicitudesEnviadas: procesoFiltrado.enviadas || 0, // Campo obligatorio
          solicitudesEnProceso: procesoFiltrado.enProceso,
          totalEstudiantes: Math.floor(procesoFiltrado.totalSolicitudes * 2.6), // Aproximación
          totalProgramas: 1
        };
      }
    }

    // Filtrar por programa
    if (filtros.idPrograma) {
      const programaFiltrado = estadisticasPorPrograma.find(
        programa => programa.idPrograma === filtros.idPrograma
      );
      
      if (programaFiltrado) {
        // Ajustar estadísticas basadas en el programa filtrado
        const factor = programaFiltrado.totalSolicitudes / estadisticasGlobales.totalSolicitudes;
        estadisticasGlobales = {
          totalSolicitudes: Math.floor(estadisticasGlobales.totalSolicitudes * factor),
          solicitudesAprobadas: Math.floor(estadisticasGlobales.solicitudesAprobadas * factor),
          solicitudesRechazadas: Math.floor(estadisticasGlobales.solicitudesRechazadas * factor),
          solicitudesEnviadas: Math.floor(estadisticasGlobales.solicitudesEnviadas * factor), // Campo obligatorio
          solicitudesEnProceso: Math.floor(estadisticasGlobales.solicitudesEnProceso * factor),
          totalEstudiantes: Math.floor(estadisticasGlobales.totalEstudiantes * factor),
          totalProgramas: 1
        };
      }
    }

    // ELIMINADO: Filtro por rango de fechas - usar periodoAcademico en su lugar
    // El filtro por periodoAcademico se maneja en el backend

    return {
      estadisticasGlobales,
      estadisticasPorProceso,
      estadisticasPorPrograma,
      ultimaActualizacion: new Date().toISOString()
    };
  }

  /**
   * Genera datos mock para pruebas (temporal)
   */
  private generarDatosMock(): ResumenCompleto {
    return {
      estadisticasGlobales: {
        totalSolicitudes: 1247,
        solicitudesAprobadas: 892,
        solicitudesRechazadas: 156,
        solicitudesEnviadas: 120, // Campo obligatorio
        solicitudesEnProceso: 199,
        totalEstudiantes: 3241,
        totalProgramas: 5
      },
      estadisticasPorProceso: [
        {
          nombreProceso: 'reingreso',
          totalSolicitudes: 245,
          aprobadas: 180,
          rechazadas: 35,
          enProceso: 30,
          pendientes: 0,
          porcentajeAprobacion: 73.5,
          tendenciaMensual: [],
          distribucionPorPrograma: []
        },
        {
          nombreProceso: 'homologacion',
          totalSolicitudes: 312,
          aprobadas: 245,
          rechazadas: 42,
          enProceso: 25,
          pendientes: 0,
          porcentajeAprobacion: 78.5,
          tendenciaMensual: [],
          distribucionPorPrograma: []
        },
        {
          nombreProceso: 'cursos-intersemestrales',
          totalSolicitudes: 456,
          aprobadas: 298,
          rechazadas: 58,
          enProceso: 100,
          pendientes: 0,
          porcentajeAprobacion: 65.4,
          tendenciaMensual: [],
          distribucionPorPrograma: []
        },
        {
          nombreProceso: 'pruebas-ecaes',
          totalSolicitudes: 134,
          aprobadas: 89,
          rechazadas: 21,
          enProceso: 24,
          pendientes: 0,
          porcentajeAprobacion: 66.4,
          tendenciaMensual: [],
          distribucionPorPrograma: []
        },
        {
          nombreProceso: 'paz-salvo',
          totalSolicitudes: 100,
          aprobadas: 80,
          rechazadas: 0,
          enProceso: 20,
          pendientes: 0,
          porcentajeAprobacion: 80.0,
          tendenciaMensual: [],
          distribucionPorPrograma: []
        }
      ],
      estadisticasPorPrograma: [
        {
          idPrograma: 1,
          nombrePrograma: 'Ingeniería de Sistemas',
          totalSolicitudes: 320,
          distribucionPorProceso: [],
          tendenciaAnual: []
        },
        {
          idPrograma: 2,
          nombrePrograma: 'Ingeniería Civil',
          totalSolicitudes: 280,
          distribucionPorProceso: [],
          tendenciaAnual: []
        },
        {
          idPrograma: 3,
          nombrePrograma: 'Ingeniería Electrónica',
          totalSolicitudes: 245,
          distribucionPorProceso: [],
          tendenciaAnual: []
        },
        {
          idPrograma: 4,
          nombrePrograma: 'Ingeniería Mecánica',
          totalSolicitudes: 200,
          distribucionPorProceso: [],
          tendenciaAnual: []
        },
        {
          idPrograma: 5,
          nombrePrograma: 'Ingeniería Industrial',
          totalSolicitudes: 202,
          distribucionPorProceso: [],
          tendenciaAnual: []
        }
      ],
      ultimaActualizacion: new Date().toISOString()
    };
  }

  /**
   * Exporta estadísticas a PDF usando el endpoint del backend (ACTUALIZADO)
   * @param filtros Filtros a aplicar en la exportación
   */
  exportarPDF(filtros: FiltroEstadisticas = {}): Observable<Blob> {
    let params = new HttpParams();
    
    if (filtros.proceso) {
      params = params.set('proceso', filtros.proceso);
    }
    
    if (filtros.idPrograma) {
      params = params.set('idPrograma', filtros.idPrograma.toString());
    }
    
    if (filtros.periodoAcademico) {
      params = params.set('periodoAcademico', filtros.periodoAcademico);
    }
    
    // ELIMINADOS: fechaInicio y fechaFin - usar periodoAcademico en su lugar

    // Código simplificado - el backend ahora funciona correctamente
    return this.http.get(ApiEndpoints.MODULO_ESTADISTICO.EXPORTAR_PDF, {
      params,
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });
  }

  /**
   * Exporta estadísticas a Excel usando el endpoint del backend (ACTUALIZADO)
   * @param filtros Filtros a aplicar en la exportación
   */
  exportarExcel(filtros: FiltroEstadisticas = {}): Observable<Blob> {
    let params = new HttpParams();
    
    if (filtros.proceso) {
      params = params.set('proceso', filtros.proceso);
    }
    
    if (filtros.idPrograma) {
      params = params.set('idPrograma', filtros.idPrograma.toString());
    }
    
    if (filtros.periodoAcademico) {
      params = params.set('periodoAcademico', filtros.periodoAcademico);
    }
    
    // ELIMINADOS: fechaInicio y fechaFin - usar periodoAcademico en su lugar

    // Código simplificado - el backend ahora funciona correctamente
    return this.http.get(ApiEndpoints.MODULO_ESTADISTICO.EXPORTAR_EXCEL, {
      params,
      responseType: 'blob',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
  }

  // ===== MÉTODOS DE EXPORTACIÓN ESPECÍFICOS =====

  /**
   * Exporta reporte PDF del Dashboard General
   */
  exportarReporteGeneral(): Observable<Blob> {

    return this.http.get(ApiEndpoints.MODULO_ESTADISTICO.EXPORTAR_PDF_GENERAL, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });
  }

  /**
   * Exporta reporte Excel del Dashboard General
   */
  exportarExcelGeneral(): Observable<Blob> {

    return this.http.get(ApiEndpoints.MODULO_ESTADISTICO.EXPORTAR_EXCEL_GENERAL, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
  }

  /**
   * Exporta reporte PDF de Cursos de Verano con filtros opcionales
   * GET /api/estadisticas/export/pdf/cursos-verano
   * 
   * Parámetros opcionales:
   * - periodoAcademico: formato "YYYY-P" (ej: "2025-2")
   * - idPrograma: ID del programa académico
   * 
   * El PDF incluye:
   * - Fecha en formato: "EEE MMM dd HH:mm:ss zzz yyyy" (ej: "Wed Dec 17 00:36:01 COT 2025")
   * - Información de filtros aplicados si existen
   * 
   * @param filtros Filtros opcionales: periodoAcademico, idPrograma
   * @returns Observable con el blob del PDF
   */
  exportarReporteCursosVerano(filtros: { periodoAcademico?: string; idPrograma?: number } = {}): Observable<Blob> {
    let params = new HttpParams();
    
    if (filtros.periodoAcademico) {
      params = params.set('periodoAcademico', filtros.periodoAcademico);
    }
    
    if (filtros.idPrograma !== undefined && filtros.idPrograma !== null) {
      params = params.set('idPrograma', filtros.idPrograma.toString());
    }

    return this.http.get(ApiEndpoints.MODULO_ESTADISTICO.EXPORTAR_PDF_CURSOS_VERANO, {
      params,
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });
  }

  /**
   * Exporta reporte Excel de Cursos de Verano con filtros opcionales
   * GET /api/estadisticas/export/excel/cursos-verano
   * 
   * Parámetros opcionales:
   * - periodoAcademico: formato "YYYY-P" (ej: "2025-2")
   * - idPrograma: ID del programa académico
   * 
   * El Excel incluye:
   * - Fecha en formato: "EEE MMM dd HH:mm:ss zzz yyyy" (ej: "Wed Dec 17 00:36:01 COT 2025")
   * - Información de filtros aplicados si existen
   * 
   * @param filtros Filtros opcionales: periodoAcademico, idPrograma
   * @returns Observable con el blob del Excel
   */
  exportarExcelCursosVerano(filtros: { periodoAcademico?: string; idPrograma?: number } = {}): Observable<Blob> {
    let params = new HttpParams();
    
    if (filtros.periodoAcademico) {
      params = params.set('periodoAcademico', filtros.periodoAcademico);
    }
    
    if (filtros.idPrograma !== undefined && filtros.idPrograma !== null) {
      params = params.set('idPrograma', filtros.idPrograma.toString());
    }

    return this.http.get(ApiEndpoints.MODULO_ESTADISTICO.EXPORTAR_EXCEL_CURSOS_VERANO, {
      params,
      responseType: 'blob',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
  }

  /**
   * Exporta reporte de texto usando fetch (método recomendado)
   * @param filtros Filtros a aplicar en la exportación
   */
  async exportarPDFConFetch(filtros: FiltroEstadisticas = {}): Promise<void> {
    const params = new URLSearchParams();
    
    if (filtros.proceso) {
      params.append('proceso', filtros.proceso);
    }
    
    if (filtros.idPrograma) {
      params.append('idPrograma', filtros.idPrograma.toString());
    }
    
    if (filtros.periodoAcademico) {
      params.append('periodoAcademico', filtros.periodoAcademico);
    }
    
    // ELIMINADOS: fechaInicio y fechaFin - usar periodoAcademico en su lugar

    const url = `${ApiEndpoints.MODULO_ESTADISTICO.EXPORTAR_PDF}?${params.toString()}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'estadisticas.txt'; // Cambiado a .txt
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (error) {
      console.error('Error al descargar reporte de texto:', error);
      throw error;
    }
  }

  /**
   * Exporta reporte de texto usando window.open() (método alternativo)
   * @param filtros Filtros a aplicar en la exportación
   */
  exportarPDFDirecto(filtros: FiltroEstadisticas = {}): void {
    const params = new URLSearchParams();
    
    if (filtros.proceso) {
      params.append('proceso', filtros.proceso);
    }
    
    if (filtros.idPrograma) {
      params.append('idPrograma', filtros.idPrograma.toString());
    }
    
    if (filtros.periodoAcademico) {
      params.append('periodoAcademico', filtros.periodoAcademico);
    }
    
    // ELIMINADOS: fechaInicio y fechaFin - usar periodoAcademico en su lugar

    const url = `${ApiEndpoints.MODULO_ESTADISTICO.EXPORTAR_PDF}?${params.toString()}`;
    
    // Abrir en nueva ventana para descarga directa
    window.open(url, '_blank');
  }

  /**
   * Exporta Excel usando fetch (método recomendado)
   * @param filtros Filtros a aplicar en la exportación
   */
  async exportarExcelConFetch(filtros: FiltroEstadisticas = {}): Promise<void> {
    const params = new URLSearchParams();
    
    if (filtros.proceso) {
      params.append('proceso', filtros.proceso);
    }
    
    if (filtros.idPrograma) {
      params.append('idPrograma', filtros.idPrograma.toString());
    }
    
    if (filtros.periodoAcademico) {
      params.append('periodoAcademico', filtros.periodoAcademico);
    }
    
    // ELIMINADOS: fechaInicio y fechaFin - usar periodoAcademico en su lugar

    const url = `${ApiEndpoints.MODULO_ESTADISTICO.EXPORTAR_EXCEL}?${params.toString()}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'estadisticas.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (error) {
      console.error('Error al descargar Excel:', error);
      throw error;
    }
  }

  /**
   * Exporta Excel usando window.open() (método alternativo)
   * @param filtros Filtros a aplicar en la exportación
   */
  exportarExcelDirecto(filtros: FiltroEstadisticas = {}): void {
    const params = new URLSearchParams();
    
    if (filtros.proceso) {
      params.append('proceso', filtros.proceso);
    }
    
    if (filtros.idPrograma) {
      params.append('idPrograma', filtros.idPrograma.toString());
    }
    
    if (filtros.periodoAcademico) {
      params.append('periodoAcademico', filtros.periodoAcademico);
    }
    
    // ELIMINADOS: fechaInicio y fechaFin - usar periodoAcademico en su lugar

    const url = `${ApiEndpoints.MODULO_ESTADISTICO.EXPORTAR_EXCEL}?${params.toString()}`;
    
    // Abrir en nueva ventana para descarga directa
    window.open(url, '_blank');
  }

  /**
   * Convierte los datos del API real al formato del dashboard
   */
  convertirDatosAPI(datosAPI: EstadisticasGlobalesAPI): ResumenCompleto {
    
    // Validar que los datos existan
    if (!datosAPI) {
      throw new Error('Los datos del API están vacíos o son inválidos');
    }
    
    // Agrupar datos por tipo de proceso para evitar duplicados
    const procesosAgrupados: { [key: string]: { total: number, aprobadas: number, rechazadas: number, enProceso: number } } = {};
    
    // Procesar porTipoProceso y agrupar por tipo de proceso
    const porTipoProceso = datosAPI.porTipoProceso || {};
    Object.keys(porTipoProceso).forEach(tipoProceso => {
      // Extraer el tipo de proceso del nombre completo
      let nombreProceso = '';
      if (tipoProceso.includes('Reingreso')) {
        nombreProceso = 'reingreso';
      } else if (tipoProceso.includes('Homologacion')) {
        nombreProceso = 'homologacion';
      } else if (tipoProceso.includes('Curso Verano')) {
        nombreProceso = 'cursos-intersemestrales';
      } else if (tipoProceso.includes('ECAES')) {
        nombreProceso = 'pruebas-ecaes';
      } else if (tipoProceso.includes('Paz y Salvo')) {
        nombreProceso = 'paz-salvo';
      }

      if (nombreProceso) {
        const cantidad = porTipoProceso[tipoProceso] || 0;
        
        // Si ya existe el proceso, sumar las cantidades
        if (procesosAgrupados[nombreProceso]) {
          procesosAgrupados[nombreProceso].total += cantidad;
          procesosAgrupados[nombreProceso].aprobadas += Math.floor(cantidad * 0.7);
          procesosAgrupados[nombreProceso].rechazadas += Math.floor(cantidad * 0.1);
          procesosAgrupados[nombreProceso].enProceso += cantidad - Math.floor(cantidad * 0.7) - Math.floor(cantidad * 0.1);
        } else {
          // Crear nueva entrada para el proceso
          const aprobadas = Math.floor(cantidad * 0.7);
          const rechazadas = Math.floor(cantidad * 0.1);
          const enProceso = cantidad - aprobadas - rechazadas;
          
          procesosAgrupados[nombreProceso] = {
            total: cantidad,
            aprobadas,
            rechazadas,
            enProceso
          };
        }
      }
    });

    // Convertir datos agrupados a formato del dashboard
    const estadisticasPorProceso: EstadisticasProceso[] = Object.keys(procesosAgrupados).map(nombreProceso => {
      const proceso = procesosAgrupados[nombreProceso];
      return {
        nombreProceso,
        totalSolicitudes: proceso.total,
        aprobadas: proceso.aprobadas,
        rechazadas: proceso.rechazadas,
        enProceso: proceso.enProceso,
        pendientes: 0,
        porcentajeAprobacion: proceso.total > 0 ? (proceso.aprobadas / proceso.total) * 100 : 0,
        tendenciaMensual: [],
        distribucionPorPrograma: []
      };
    });


    // Convertir porPrograma a estadísticas por programa
    const porPrograma = datosAPI.porPrograma || {};
    const estadisticasPorPrograma: EstadisticasPrograma[] = Object.keys(porPrograma).map((nombrePrograma, index) => ({
      idPrograma: index + 1,
      nombrePrograma,
      totalSolicitudes: porPrograma[nombrePrograma] || 0,
      distribucionPorProceso: [],
      tendenciaAnual: []
    }));

    return {
      estadisticasGlobales: {
        totalSolicitudes: datosAPI.totalSolicitudes || 0,
        solicitudesAprobadas: datosAPI.totalAprobadas || 0,
        solicitudesRechazadas: datosAPI.totalRechazadas || 0,
        solicitudesEnviadas: datosAPI.totalEnviadas || 0, // Mapeo correcto del backend
        solicitudesEnProceso: datosAPI.totalEnProceso || 0,
        totalEstudiantes: 0, // Se actualizará con el valor real del endpoint /api/estadisticas/total-estudiantes
        totalProgramas: Object.keys(porPrograma).length
      },
      estadisticasPorProceso,
      estadisticasPorPrograma,
      ultimaActualizacion: datosAPI.fechaConsulta || new Date().toISOString()
    };
  }
}
