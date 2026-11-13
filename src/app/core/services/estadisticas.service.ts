import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, map, catchError, shareReplay } from 'rxjs';
import { ApiEndpoints } from '../utils/api-endpoints';
import { ProgramasService } from './programas.service';
import { ResumenCompletoAPI, FiltroEstadisticas, TotalEstudiantesResponse, EstudiantesPorProgramaResponse, EstadisticasPorProcesoResponse, EstadoSolicitudesResponse } from '../models/estadisticas/generales.model';
import { TendenciasComparativasResponse } from '../models/estadisticas/tendencias.model';
import { EstadisticasPorProgramaMejoradasResponse, EstadisticasPorPeriodoMejoradasResponse } from '../models/estadisticas/mejoradas.model';
import { CursosVeranoResponse, TendenciaTemporal } from '../models/estadisticas/cursos-verano.model';

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {
  private http = inject(HttpClient);
  private programasService = inject(ProgramasService);


  /** Caché del catálogo nombre de programa → id_programa real (BD). */
  private idsProgramaPorNombre$?: Observable<Map<string, number>>;

  /**
   * Normaliza un nombre de programa para compararlo (minúsculas, sin tildes ni espacios extra).
   */
  static normalizarNombrePrograma(nombre: string): string {
    return (nombre || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Mapa nombre de programa (normalizado) → id_programa real, desde /api/programas/listarProgramas.
   * Los endpoints de estadísticas devuelven `porPrograma` como { nombre: cantidad } sin el id,
   * así que el id real se resuelve con este catálogo.
   * Si falla, devuelve un mapa vacío (y no lo deja en caché para reintentar después).
   */
  getIdsProgramaPorNombre(): Observable<Map<string, number>> {
    if (!this.idsProgramaPorNombre$) {
      this.idsProgramaPorNombre$ = this.programasService.listarProgramas().pipe(
        map(programas => new Map(
          (programas || []).map(p => [EstadisticasService.normalizarNombrePrograma(p.nombre_programa), p.id_programa] as [string, number])
        )),
        catchError(() => {
          this.idsProgramaPorNombre$ = undefined;
          return of(new Map<string, number>());
        }),
        shareReplay(1)
      );
    }
    return this.idsProgramaPorNombre$;
  }

  /**
   * Obtiene el resumen completo de estadísticas con soporte para filtros opcionales
   * GET /api/estadisticas/resumen-completo
   * 
   * Parámetros de consulta (todos opcionales):
   * - periodoAcademico: String en formato "YYYY-P" (ej: "2025-1", "2025-2")
   *   El backend acepta múltiples formatos y los normaliza automáticamente:
   *   - "2025-1" o "2025-2" (formato estándar)
   *   - "2025 - Primer Semestre" o "2025 - Segundo Semestre"
   *   - "2025 Primer Semestre" o "2025 Segundo Semestre"
   *   - "Primer Semestre 2025" o "Segundo Semestre 2025"
   * - idPrograma: Integer - ID del programa académico (ej: 1, 2, 3)
   * - proceso: String - Tipo de proceso (Reingreso, Homologacion, Paz y Salvo, Cursos de Verano, ECAES)
   * 
   * Ejemplos de uso:
   * 1. Sin filtros (todas las estadísticas):
   *    getResumenCompleto().subscribe(...)
   * 
   * 2. Solo período académico:
   *    getResumenCompleto({ periodoAcademico: '2025-2' }).subscribe(...)
   * 
   * 3. Solo programa:
   *    getResumenCompleto({ idPrograma: 1 }).subscribe(...)
   * 
   * 4. Ambos filtros combinados:
   *    getResumenCompleto({ periodoAcademico: '2025-1', idPrograma: 1 }).subscribe(...)
   * 
   * La respuesta incluye:
   * - estadisticasGlobales: Resumen general con totales y porcentajes
   * - porTipoProceso: Estadísticas desglosadas por tipo de proceso (objeto con claves como "Reingreso", "Homologacion", etc.)
   * - porEstado: Estadísticas desglosadas por estado (objeto con claves como "APROBADA", "RECHAZADA", etc.)
   * - totalProgramas: Número total de programas
   * - fechaGeneracion: Fecha de generación del resumen
   * - filtrosAplicados: Indica qué filtros se aplicaron (si hay)
   * 
   * @param filtros Filtros opcionales: periodoAcademico (formato "YYYY-P" o variantes), idPrograma (número), proceso (Reingreso, Homologacion, Paz y Salvo, Cursos de Verano, ECAES)
   * @returns Observable con el resumen completo de estadísticas en formato ResumenCompletoAPI
   */
  getResumenCompleto(filtros: { periodoAcademico?: string; idPrograma?: number; proceso?: string } = {}): Observable<ResumenCompletoAPI> {
    let params = new HttpParams();
    
    // Validar y agregar periodoAcademico solo si tiene valor válido
    if (filtros.periodoAcademico && filtros.periodoAcademico.trim() !== '') {
      params = params.set('periodoAcademico', filtros.periodoAcademico.trim());
    }
    
    // Validar y agregar idPrograma solo si tiene valor válido
    if (filtros.idPrograma !== undefined && filtros.idPrograma !== null && !isNaN(filtros.idPrograma) && filtros.idPrograma > 0) {
      params = params.set('idPrograma', filtros.idPrograma.toString());
    }
    
    // Validar y agregar proceso solo si el usuario eligió uno
    if (filtros.proceso && filtros.proceso.trim() !== '' && filtros.proceso !== 'Todos los procesos') {
      params = params.set('proceso', filtros.proceso.trim());
    }
    
    const options = params.keys().length > 0 ? { params } : {};
    
    return this.http.get<ResumenCompletoAPI>(ApiEndpoints.MODULO_ESTADISTICO.RESUMEN_COMPLETO, options);
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
  /**
   * Obtiene estudiantes por programa con filtros opcionales
   * GET /api/estadisticas/estudiantes-por-programa
   * @param filtros Filtros opcionales: periodoAcademico, idPrograma
   */
  getEstudiantesPorPrograma(filtros: { periodoAcademico?: string; idPrograma?: number; proceso?: string } = {}): Observable<EstudiantesPorProgramaResponse> {
    let params = new HttpParams();
    
    if (filtros.periodoAcademico && filtros.periodoAcademico.trim() !== '') {
      params = params.set('periodoAcademico', filtros.periodoAcademico.trim());
    }
    
    if (filtros.idPrograma !== undefined && filtros.idPrograma !== null && !isNaN(filtros.idPrograma) && filtros.idPrograma > 0) {
      params = params.set('idPrograma', filtros.idPrograma.toString());
    }
    
    if (filtros.proceso && filtros.proceso.trim() !== '' && filtros.proceso !== 'Todos los procesos') {
      params = params.set('proceso', filtros.proceso.trim());
    }
    
    return this.http.get<EstudiantesPorProgramaResponse>(ApiEndpoints.MODULO_ESTADISTICO.ESTUDIANTES_POR_PROGRAMA, { params });
  }

  /**
   * Obtiene estadísticas detalladas por proceso académico con filtros opcionales
   * GET /api/estadisticas/estadisticas-por-proceso
   * @param filtros Filtros opcionales: periodoAcademico, idPrograma
   */
  getEstadisticasDetalladasPorProceso(filtros: { periodoAcademico?: string; idPrograma?: number; proceso?: string } = {}): Observable<EstadisticasPorProcesoResponse> {
    let params = new HttpParams();
    
    // Agregar timestamp para evitar caché
    params = params.set('t', Date.now().toString());
    
    if (filtros.periodoAcademico && filtros.periodoAcademico.trim() !== '') {
      params = params.set('periodoAcademico', filtros.periodoAcademico.trim());
    }
    
    if (filtros.idPrograma !== undefined && filtros.idPrograma !== null && !isNaN(filtros.idPrograma) && filtros.idPrograma > 0) {
      params = params.set('idPrograma', filtros.idPrograma.toString());
    }
    
    if (filtros.proceso && filtros.proceso.trim() !== '' && filtros.proceso !== 'Todos los procesos') {
      params = params.set('proceso', filtros.proceso.trim());
    }
    
    return this.http.get<EstadisticasPorProcesoResponse>(ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_POR_PROCESO, { params });
  }

  /**
   * Obtiene estadísticas por estado de solicitudes con filtros opcionales
   * GET /api/estadisticas/estado-solicitudes
   * @param filtros Filtros opcionales: periodoAcademico, idPrograma
   */
  getEstadoSolicitudes(filtros: { periodoAcademico?: string; idPrograma?: number; proceso?: string } = {}): Observable<EstadoSolicitudesResponse> {
    let params = new HttpParams();
    
    if (filtros.periodoAcademico && filtros.periodoAcademico.trim() !== '') {
      params = params.set('periodoAcademico', filtros.periodoAcademico.trim());
    }
    
    if (filtros.idPrograma !== undefined && filtros.idPrograma !== null && !isNaN(filtros.idPrograma) && filtros.idPrograma > 0) {
      params = params.set('idPrograma', filtros.idPrograma.toString());
    }
    
    if (filtros.proceso && filtros.proceso.trim() !== '' && filtros.proceso !== 'Todos los procesos') {
      params = params.set('proceso', filtros.proceso.trim());
    }
    
    return this.http.get<EstadoSolicitudesResponse>(ApiEndpoints.MODULO_ESTADISTICO.ESTADO_SOLICITUDES, { params });
  }

  /**
   * Obtiene tendencias y comparativas estratégicas con filtros opcionales
   * GET /api/estadisticas/tendencias-comparativas
   * @param filtros Filtros opcionales: periodoAcademico, idPrograma
   */
  getTendenciasComparativas(filtros: { periodoAcademico?: string; idPrograma?: number; proceso?: string } = {}): Observable<TendenciasComparativasResponse> {
    let params = new HttpParams();
    
    if (filtros.periodoAcademico && filtros.periodoAcademico.trim() !== '') {
      params = params.set('periodoAcademico', filtros.periodoAcademico.trim());
    }
    
    if (filtros.idPrograma !== undefined && filtros.idPrograma !== null && !isNaN(filtros.idPrograma) && filtros.idPrograma > 0) {
      params = params.set('idPrograma', filtros.idPrograma.toString());
    }
    
    if (filtros.proceso && filtros.proceso.trim() !== '' && filtros.proceso !== 'Todos los procesos') {
      params = params.set('proceso', filtros.proceso.trim());
    }
    
    return this.http.get<TendenciasComparativasResponse>(ApiEndpoints.MODULO_ESTADISTICO.TENDENCIAS_COMPARATIVAS, { params });
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
   * GET /api/estadisticas/por-programa
   * @param filtros Filtros opcionales: periodoAcademico, idPrograma
   */
  getEstadisticasPorProgramaMejoradas(filtros: { periodoAcademico?: string; idPrograma?: number; proceso?: string } = {}): Observable<EstadisticasPorProgramaMejoradasResponse> {
    let params = new HttpParams();
    
    if (filtros.periodoAcademico && filtros.periodoAcademico.trim() !== '') {
      params = params.set('periodoAcademico', filtros.periodoAcademico.trim());
    }
    
    if (filtros.idPrograma !== undefined && filtros.idPrograma !== null && !isNaN(filtros.idPrograma) && filtros.idPrograma > 0) {
      params = params.set('idPrograma', filtros.idPrograma.toString());
    }
    
    if (filtros.proceso && filtros.proceso.trim() !== '' && filtros.proceso !== 'Todos los procesos') {
      params = params.set('proceso', filtros.proceso.trim());
    }
    
    return this.http.get<EstadisticasPorProgramaMejoradasResponse>(ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_POR_PROGRAMA_MEJORADAS, { params });
  }

  /**
   * Obtiene estadísticas por período mejoradas con tendencias y proyecciones
   * GET /api/estadisticas/por-periodo
   * @param filtros Filtros opcionales: periodoAcademico, idPrograma
   */
  getEstadisticasPorPeriodoMejoradas(filtros: { periodoAcademico?: string; idPrograma?: number; proceso?: string } = {}): Observable<EstadisticasPorPeriodoMejoradasResponse> {
    let params = new HttpParams();
    
    if (filtros.periodoAcademico && filtros.periodoAcademico.trim() !== '') {
      params = params.set('periodoAcademico', filtros.periodoAcademico.trim());
    }
    
    if (filtros.idPrograma !== undefined && filtros.idPrograma !== null && !isNaN(filtros.idPrograma) && filtros.idPrograma > 0) {
      params = params.set('idPrograma', filtros.idPrograma.toString());
    }
    
    if (filtros.proceso && filtros.proceso.trim() !== '' && filtros.proceso !== 'Todos los procesos') {
      params = params.set('proceso', filtros.proceso.trim());
    }
    
    return this.http.get<EstadisticasPorPeriodoMejoradasResponse>(ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_POR_PERIODO_MEJORADAS, { params });
  }

  /**
   * Obtiene la lista de procesos disponibles (nombres exactos del backend)
   * Usa los nombres exactos que el backend espera
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
   * Programas para los filtros, desde el catálogo real (/api/programas/listarProgramas).
   * Si el backend falla, devuelve una lista vacía (el filtro queda en "Todos los programas").
   */
  getProgramasDisponibles(): Observable<{ id: number; nombre: string }[]> {
    return this.programasService.listarProgramas().pipe(
      map(programas => (programas || [])
        .map(p => ({ id: p.id_programa, nombre: p.nombre_programa }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))),
      catchError(() => of([]))
    );
  }

  /**
   * Exporta estadísticas a PDF usando el endpoint del backend
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
    
    // fechaInicio y fechaFin eliminados - usar periodoAcademico en su lugar

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
   * Exporta estadísticas a Excel usando el endpoint del backend
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
    
    // fechaInicio y fechaFin eliminados - usar periodoAcademico en su lugar

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

}
