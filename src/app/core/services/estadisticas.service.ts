import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';
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
  EstadisticasCompletas
} from '../models/estadisticas.model';

@Injectable({
  providedIn: 'root'
})
export class EstadisticasService {

  constructor(private http: HttpClient) { }

  /**
   * Obtiene estadísticas globales del API real con filtros opcionales
   */
  getEstadisticasGlobales(filtros: FiltroEstadisticas = {}): Observable<EstadisticasGlobalesAPI> {
    let params = new HttpParams();
    
    if (filtros.proceso) {
      params = params.set('proceso', filtros.proceso);
    }
    
    if (filtros.programa) {
      params = params.set('idPrograma', filtros.programa.toString());
    }
    
    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }
    
    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }

    return this.http.get<EstadisticasGlobalesAPI>(ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_GLOBALES, { params });
  }

  /**
   * Obtiene estadísticas globales (método legacy para compatibilidad)
   */
  getEstadisticasGlobalesLegacy(): Observable<EstadisticasGlobales> {
    return this.http.get<EstadisticasGlobales>(ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_GLOBALES);
  }

  /**
   * Obtiene estadísticas de un proceso específico
   * @param nombreProceso Nombre del proceso (ej: 'reingreso', 'homologacion', etc.)
   */
  getEstadisticasProceso(nombreProceso: string): Observable<EstadisticasProceso> {
    return this.http.get<EstadisticasProceso>(ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_PROCESO(nombreProceso));
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
   */
  getResumenCompleto(): Observable<ResumenCompleto> {
    return this.http.get<ResumenCompleto>(ApiEndpoints.MODULO_ESTADISTICO.RESUMEN_COMPLETO);
  }

  /**
   * Obtiene estadísticas con filtros aplicados usando el endpoint real del backend
   * @param filtros Filtros a aplicar
   */
  getEstadisticasConFiltros(filtros: FiltroEstadisticas): Observable<any> {
    let params = new HttpParams();
    
    if (filtros.proceso) {
      params = params.set('proceso', filtros.proceso);
    }
    
    if (filtros.programa) {
      params = params.set('idPrograma', filtros.programa.toString());
    }
    
    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }
    
    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }

    return this.http.get(ApiEndpoints.MODULO_ESTADISTICO.POR_PERIODO_ESTADO_PROGRAMA, { params });
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
    console.log('📊 Obteniendo total de estudiantes desde:', ApiEndpoints.MODULO_ESTADISTICO.TOTAL_ESTUDIANTES);
    return this.http.get<TotalEstudiantesResponse>(ApiEndpoints.MODULO_ESTADISTICO.TOTAL_ESTUDIANTES);
  }

  /**
   * Obtiene la distribución de estudiantes por programa académico
   * @returns Observable con la respuesta del endpoint de estudiantes por programa
   */
  getEstudiantesPorPrograma(): Observable<EstudiantesPorProgramaResponse> {
    console.log('📊 Obteniendo estudiantes por programa desde:', ApiEndpoints.MODULO_ESTADISTICO.ESTUDIANTES_POR_PROGRAMA);
    return this.http.get<EstudiantesPorProgramaResponse>(ApiEndpoints.MODULO_ESTADISTICO.ESTUDIANTES_POR_PROGRAMA);
  }

  /**
   * Obtiene estadísticas detalladas por proceso académico
   * @returns Observable con la respuesta del endpoint de estadísticas por proceso
   */
  getEstadisticasDetalladasPorProceso(): Observable<EstadisticasPorProcesoResponse> {
    console.log('📊 Obteniendo estadísticas por proceso desde:', ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_POR_PROCESO);
    return this.http.get<EstadisticasPorProcesoResponse>(ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_POR_PROCESO);
  }

  /**
   * Obtiene estadísticas por estado de solicitudes
   * @returns Observable con la respuesta del endpoint de estado de solicitudes
   */
  getEstadoSolicitudes(): Observable<EstadoSolicitudesResponse> {
    console.log('📊 Obteniendo estado de solicitudes desde:', ApiEndpoints.MODULO_ESTADISTICO.ESTADO_SOLICITUDES);
    return this.http.get<EstadoSolicitudesResponse>(ApiEndpoints.MODULO_ESTADISTICO.ESTADO_SOLICITUDES);
  }

  /**
   * Obtiene todas las estadísticas de estudiantes en una sola llamada
   * @returns Observable con todas las estadísticas consolidadas
   */
  getEstadisticasCompletas(): Observable<EstadisticasCompletas> {
    console.log('📊 Obteniendo estadísticas completas...');
    
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
            estadoSolicitudes = response.estados;
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
   * Obtiene la lista de procesos disponibles
   */
  getProcesosDisponibles(): string[] {
    return [
      'reingreso-estudiante',
      'homologacion-asignaturas', 
      'cursos-intersemestrales',
      'pruebas-ecaes',
      'paz-salvo'
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
    console.log('🔍 Aplicando filtros:', filtros);
    
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
          solicitudesEnProceso: procesoFiltrado.enProceso,
          totalEstudiantes: Math.floor(procesoFiltrado.totalSolicitudes * 2.6), // Aproximación
          totalProgramas: 1
        };
      }
    }

    // Filtrar por programa
    if (filtros.programa) {
      const programaFiltrado = estadisticasPorPrograma.find(
        programa => programa.idPrograma === filtros.programa
      );
      
      if (programaFiltrado) {
        // Ajustar estadísticas basadas en el programa filtrado
        const factor = programaFiltrado.totalSolicitudes / estadisticasGlobales.totalSolicitudes;
        estadisticasGlobales = {
          totalSolicitudes: Math.floor(estadisticasGlobales.totalSolicitudes * factor),
          solicitudesAprobadas: Math.floor(estadisticasGlobales.solicitudesAprobadas * factor),
          solicitudesRechazadas: Math.floor(estadisticasGlobales.solicitudesRechazadas * factor),
          solicitudesEnProceso: Math.floor(estadisticasGlobales.solicitudesEnProceso * factor),
          totalEstudiantes: Math.floor(estadisticasGlobales.totalEstudiantes * factor),
          totalProgramas: 1
        };
      }
    }

    // Filtrar por rango de fechas (simulado)
    if (filtros.fechaInicio || filtros.fechaFin) {
      // Simular reducción de datos por filtro de fechas
      const factorFecha = 0.7; // 70% de los datos en el rango
      estadisticasGlobales = {
        totalSolicitudes: Math.floor(estadisticasGlobales.totalSolicitudes * factorFecha),
        solicitudesAprobadas: Math.floor(estadisticasGlobales.solicitudesAprobadas * factorFecha),
        solicitudesRechazadas: Math.floor(estadisticasGlobales.solicitudesRechazadas * factorFecha),
        solicitudesEnProceso: Math.floor(estadisticasGlobales.solicitudesEnProceso * factorFecha),
        totalEstudiantes: Math.floor(estadisticasGlobales.totalEstudiantes * factorFecha),
        totalProgramas: estadisticasGlobales.totalProgramas
      };
    }

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
    
    if (filtros.programa) {
      params = params.set('idPrograma', filtros.programa.toString());
    }
    
    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }
    
    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }

    console.log('📄 Exportando PDF con filtros:', filtros);
    console.log('🔗 URL:', ApiEndpoints.MODULO_ESTADISTICO.EXPORTAR_PDF);

    return this.http.get(ApiEndpoints.MODULO_ESTADISTICO.EXPORTAR_PDF, {
      params,
      responseType: 'blob'
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
    
    if (filtros.programa) {
      params = params.set('idPrograma', filtros.programa.toString());
    }
    
    if (filtros.fechaInicio) {
      params = params.set('fechaInicio', filtros.fechaInicio);
    }
    
    if (filtros.fechaFin) {
      params = params.set('fechaFin', filtros.fechaFin);
    }

    console.log('📊 Exportando Excel con filtros:', filtros);
    console.log('🔗 URL:', ApiEndpoints.MODULO_ESTADISTICO.EXPORTAR_EXCEL);

    return this.http.get(ApiEndpoints.MODULO_ESTADISTICO.EXPORTAR_EXCEL, {
      params,
      responseType: 'blob'
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
    
    if (filtros.programa) {
      params.append('idPrograma', filtros.programa.toString());
    }
    
    if (filtros.fechaInicio) {
      params.append('fechaInicio', filtros.fechaInicio);
    }
    
    if (filtros.fechaFin) {
      params.append('fechaFin', filtros.fechaFin);
    }

    const url = `${ApiEndpoints.MODULO_ESTADISTICO.EXPORTAR_PDF}?${params.toString()}`;
    console.log('📄 Descargando reporte de texto con fetch:', url);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'estadisticas.txt'; // ✅ Cambiado a .txt
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('✅ Reporte de texto descargado exitosamente');
    } catch (error) {
      console.error('❌ Error al descargar reporte de texto:', error);
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
    
    if (filtros.programa) {
      params.append('idPrograma', filtros.programa.toString());
    }
    
    if (filtros.fechaInicio) {
      params.append('fechaInicio', filtros.fechaInicio);
    }
    
    if (filtros.fechaFin) {
      params.append('fechaFin', filtros.fechaFin);
    }

    const url = `${ApiEndpoints.MODULO_ESTADISTICO.EXPORTAR_PDF}?${params.toString()}`;
    console.log('📄 Descargando reporte de texto directamente:', url);
    
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
    
    if (filtros.programa) {
      params.append('idPrograma', filtros.programa.toString());
    }
    
    if (filtros.fechaInicio) {
      params.append('fechaInicio', filtros.fechaInicio);
    }
    
    if (filtros.fechaFin) {
      params.append('fechaFin', filtros.fechaFin);
    }

    const url = `${ApiEndpoints.MODULO_ESTADISTICO.EXPORTAR_EXCEL}?${params.toString()}`;
    console.log('📊 Descargando Excel con fetch:', url);
    
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
      
      console.log('✅ Excel descargado exitosamente');
    } catch (error) {
      console.error('❌ Error al descargar Excel:', error);
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
    
    if (filtros.programa) {
      params.append('idPrograma', filtros.programa.toString());
    }
    
    if (filtros.fechaInicio) {
      params.append('fechaInicio', filtros.fechaInicio);
    }
    
    if (filtros.fechaFin) {
      params.append('fechaFin', filtros.fechaFin);
    }

    const url = `${ApiEndpoints.MODULO_ESTADISTICO.EXPORTAR_EXCEL}?${params.toString()}`;
    console.log('📊 Descargando Excel directamente:', url);
    
    // Abrir en nueva ventana para descarga directa
    window.open(url, '_blank');
  }

  /**
   * Convierte los datos del API real al formato del dashboard
   */
  convertirDatosAPI(datosAPI: EstadisticasGlobalesAPI): ResumenCompleto {
    console.log('🔄 Convirtiendo datos del API:', datosAPI);
    
    // Agrupar datos por tipo de proceso para evitar duplicados
    const procesosAgrupados: { [key: string]: { total: number, aprobadas: number, rechazadas: number, enProceso: number } } = {};
    
    // Procesar porTipoProceso y agrupar por tipo de proceso
    Object.keys(datosAPI.porTipoProceso).forEach(tipoProceso => {
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
        const cantidad = datosAPI.porTipoProceso[tipoProceso];
        
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

    console.log('✅ Procesos agrupados:', estadisticasPorProceso);

    // Convertir porPrograma a estadísticas por programa
    const estadisticasPorPrograma: EstadisticasPrograma[] = Object.keys(datosAPI.porPrograma).map((nombrePrograma, index) => ({
      idPrograma: index + 1,
      nombrePrograma,
      totalSolicitudes: datosAPI.porPrograma[nombrePrograma] || 0,
      distribucionPorProceso: [],
      tendenciaAnual: []
    }));

    return {
      estadisticasGlobales: {
        totalSolicitudes: datosAPI.totalSolicitudes,
        solicitudesAprobadas: datosAPI.totalAprobadas,
        solicitudesRechazadas: datosAPI.totalRechazadas,
        solicitudesEnProceso: datosAPI.totalEnProceso,
        totalEstudiantes: Math.floor(datosAPI.totalSolicitudes * 2.5), // Aproximación
        totalProgramas: Object.keys(datosAPI.porPrograma).length
      },
      estadisticasPorProceso,
      estadisticasPorPrograma,
      ultimaActualizacion: datosAPI.fechaConsulta
    };
  }
}
