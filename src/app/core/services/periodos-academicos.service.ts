import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, tap, distinctUntilChanged } from 'rxjs/operators';
import { ApiEndpoints } from '../utils/api-endpoints';

export interface PeriodoAcademico {
  valor: string;
  año: number;
  numeroPeriodo: number;
  nombrePeriodo: string;
  fechaInicio: string;
  fechaFin: string;
  fechaInicioClases?: string | null;
  fechaFinClases?: string | null;
  activo: boolean;
  tipoPeriodo: string;
  esPeriodoEspecial: boolean;
  descripcion: string;
}

export interface PeriodoActualResponse {
  success: boolean;
  data: PeriodoAcademico;
  message: string;
}

export interface PeriodoActivoConfig {
  periodoAcademico: string | null;
  modo: 'automatico' | 'manual';
  descripcion: string;
}

export interface PeriodoActivoResponse {
  success: boolean;
  data: PeriodoActivoConfig;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class PeriodosAcademicosService {
  private periodoActualSubject = new BehaviorSubject<PeriodoAcademico | null>(null);
  public periodoActual$ = this.periodoActualSubject.asObservable();
  private periodoAnterior: PeriodoAcademico | null = null;
  private cambioPeriodoSubject = new BehaviorSubject<{ anterior: PeriodoAcademico | null, actual: PeriodoAcademico | null } | null>(null);
  public cambioPeriodo$ = this.cambioPeriodoSubject.asObservable();

  constructor(private http: HttpClient) {
    // Detectar cambios en el período
    this.periodoActual$.pipe(
      distinctUntilChanged((prev, curr) => prev?.valor === curr?.valor)
    ).subscribe(periodo => {
      if (this.periodoAnterior && periodo && this.periodoAnterior.valor !== periodo.valor) {
        // El período cambió
        this.cambioPeriodoSubject.next({
          anterior: this.periodoAnterior,
          actual: periodo
        });
      }
      this.periodoAnterior = periodo;
    });
  }

  /**
   * Obtiene los headers de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    if (typeof window === 'undefined') {
      return new HttpHeaders({ 'Content-Type': 'application/json' });
    }
    
    const token = localStorage.getItem('token');
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return new HttpHeaders(headers);
  }

  /**
   * Obtiene el período académico actual
   */
  getPeriodoActual(): Observable<PeriodoAcademico | null> {
    const url = ApiEndpoints.PERIODOS_ACADEMICOS.ACTUAL;
    
    return this.http.get<PeriodoActualResponse>(url, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        if (response.success && response.data) {
          const periodoAnterior = this.periodoActualSubject.value;
          this.periodoActualSubject.next(response.data);
          
          // Detectar cambio de período
          if (periodoAnterior && periodoAnterior.valor !== response.data.valor) {
            this.cambioPeriodoSubject.next({
              anterior: periodoAnterior,
              actual: response.data
            });
          }
          
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        // Solo mostrar error si no es un error de conexión (backend no disponible) o 403 (sin permisos)
        // El 403 puede ocurrir si el usuario no está autenticado o no tiene permisos
        if (error.status !== 0 && error.status !== undefined && error.status !== 403) {
          console.error('[PERIODOS] Error obteniendo período actual:', error);
        }
        // Silenciosamente retornar null si el backend no está disponible o hay error de permisos
        return of(null);
      })
    );
  }

  /**
   * Obtiene el período actual desde el subject (sin hacer petición HTTP)
   */
  getPeriodoActualValue(): PeriodoAcademico | null {
    return this.periodoActualSubject.value;
  }

  /**
   * Obtiene todos los períodos académicos
   */
  getTodosLosPeriodos(): Observable<PeriodoAcademico[]> {
    const url = ApiEndpoints.PERIODOS_ACADEMICOS.TODOS;
    
    return this.http.get<{ success: boolean; data: PeriodoAcademico[] }>(url, { headers: this.getAuthHeaders() }).pipe(
      map(response => response.success ? response.data : []),
      catchError(error => {
        // Solo mostrar error si no es un error de conexión
        if (error.status !== 0 && error.status !== undefined) {
          console.error('[PERIODOS] Error obteniendo todos los períodos:', error);
        }
        return of([]);
      })
    );
  }

  /**
   * Obtiene períodos futuros
   */
  getPeriodosFuturos(): Observable<PeriodoAcademico[]> {
    const url = ApiEndpoints.PERIODOS_ACADEMICOS.FUTUROS;
    
    return this.http.get<{ success: boolean; data: PeriodoAcademico[] }>(url, { headers: this.getAuthHeaders() }).pipe(
      map(response => response.success ? response.data : []),
      catchError(error => {
        // Solo mostrar error si no es un error de conexión
        if (error.status !== 0 && error.status !== undefined) {
          console.error('[PERIODOS] Error obteniendo períodos futuros:', error);
        }
        return of([]);
      })
    );
  }

  /**
   * Obtiene períodos recientes (últimos 5 años)
   */
  getPeriodosRecientes(): Observable<PeriodoAcademico[]> {
    const url = ApiEndpoints.PERIODOS_ACADEMICOS.RECIENTES;
    
    return this.http.get<{ success: boolean; data: PeriodoAcademico[] }>(url, { headers: this.getAuthHeaders() }).pipe(
      map(response => response.success ? response.data : []),
      catchError(error => {
        // Solo mostrar error si no es un error de conexión
        if (error.status !== 0 && error.status !== undefined) {
          console.error('[PERIODOS] Error obteniendo períodos recientes:', error);
        }
        return of([]);
      })
    );
  }

  /**
   * Obtiene información de un período específico
   */
  getInfoPeriodo(periodo: string): Observable<PeriodoAcademico | null> {
    const url = ApiEndpoints.PERIODOS_ACADEMICOS.INFO(periodo);
    
    return this.http.get<{ success: boolean; data: PeriodoAcademico }>(url, { headers: this.getAuthHeaders() }).pipe(
      map(response => response.success ? response.data : null),
      catchError(error => {
        // Solo mostrar error si no es un error de conexión
        if (error.status !== 0 && error.status !== undefined) {
          console.error(`[PERIODOS] Error obteniendo info del período ${periodo}:`, error);
        }
        return of(null);
      })
    );
  }

  /**
   * Obtiene la configuración del período activo (solo admin)
   */
  getPeriodoActivoConfig(): Observable<PeriodoActivoConfig | null> {
    const url = ApiEndpoints.PERIODOS_ACADEMICOS.ADMIN.PERIODO_ACTIVO;
    
    return this.http.get<PeriodoActivoResponse>(url, { headers: this.getAuthHeaders() }).pipe(
      map(response => response.success ? response.data : null),
      catchError(error => {
        // Solo mostrar error si no es un error de conexión
        if (error.status !== 0 && error.status !== undefined) {
          console.error('[PERIODOS] Error obteniendo configuración de período activo:', error);
        }
        return of(null);
      })
    );
  }

  /**
   * Establece el período activo (solo admin)
   * @param periodoAcademico Período a establecer o null para modo automático
   */
  setPeriodoActivo(periodoAcademico: string | null): Observable<PeriodoActivoConfig | null> {
    const url = ApiEndpoints.PERIODOS_ACADEMICOS.ADMIN.PERIODO_ACTIVO;
    
    return this.http.put<PeriodoActivoResponse>(url, { periodoAcademico }, { headers: this.getAuthHeaders() }).pipe(
      map(response => {
        if (response.success && response.data) {
          // Si se cambió el período, actualizar el período actual
          if (periodoAcademico) {
            this.getPeriodoActual().subscribe();
          } else {
            // Modo automático, obtener el período actual
            this.getPeriodoActual().subscribe();
          }
          return response.data;
        }
        return null;
      }),
      catchError(error => {
        // Solo mostrar error si no es un error de conexión
        if (error.status !== 0 && error.status !== undefined) {
          console.error('[PERIODOS] Error estableciendo período activo:', error);
        }
        return of(null);
      })
    );
  }

  /**
   * Inicializa el período actual (llamar al iniciar la app)
   * Solo intenta cargar si hay un token disponible
   */
  inicializarPeriodoActual(): void {
    // Verificar si hay token antes de hacer la petición
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      this.getPeriodoActual().subscribe();
    }
  }
}

