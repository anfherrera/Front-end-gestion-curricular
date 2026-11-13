import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, catchError, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { ApiEndpoints } from '../utils/api-endpoints';
import { formatearPeriodo } from '../utils/periodo.utils';

/** El backend devuelve a veces los períodos como texto ("2025-2") y a veces como objetos. */
function aPeriodos(datos: PeriodoAcademico[] | string[]): PeriodoAcademico[] {
  return datos.map(p => typeof p === 'string' ? {
    valor: p,
    año: parseInt(p.split('-')[0]) || new Date().getFullYear(),
    numeroPeriodo: parseInt(p.split('-')[1]) || 1,
    nombrePeriodo: formatearPeriodo(p),
    fechaInicio: '',
    fechaFin: '',
    activo: true,
    tipoPeriodo: 'ORDINARIO',
    esPeriodoEspecial: false,
    descripcion: ''
  } : p);
}

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
  data: string | null; // El backend retorna el período como string (ej: "2025-2") o null
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
  private http = inject(HttpClient);

  private periodoActualSubject = new BehaviorSubject<PeriodoAcademico | null>(null);
  public periodoActual$ = this.periodoActualSubject.asObservable();
  private periodoAnterior: PeriodoAcademico | null = null;
  private cambioPeriodoSubject = new BehaviorSubject<{ anterior: PeriodoAcademico | null, actual: PeriodoAcademico | null } | null>(null);
  public cambioPeriodo$ = this.cambioPeriodoSubject.asObservable();

  constructor() {
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
   * Obtiene el período académico actual
   * El backend retorna un string (ej: "2025-2") o null
   */
  getPeriodoActual(): Observable<PeriodoAcademico | null> {
    const url = ApiEndpoints.PERIODOS_ACADEMICOS.ACTUAL;
    
    // El endpoint NO requiere autenticación según la documentación
    return this.http.get<PeriodoActualResponse>(url).pipe(
      map(response => {
        if (response.success && response.data) {
          // Convertir el string del período (ej: "2025-2") a un objeto PeriodoAcademico
          const periodoValor = response.data;
          const partes = periodoValor.split('-');
          const año = parseInt(partes[0]) || new Date().getFullYear();
          const numeroPeriodo = parseInt(partes[1]) || 1;
          
          const periodoAcademico: PeriodoAcademico = {
            valor: periodoValor,
            año: año,
            numeroPeriodo: numeroPeriodo,
            nombrePeriodo: formatearPeriodo(periodoValor),
            fechaInicio: '',
            fechaFin: '',
            activo: true,
            tipoPeriodo: 'ORDINARIO',
            esPeriodoEspecial: false,
            descripcion: ''
          };
          
          const periodoAnterior = this.periodoActualSubject.value;
          this.periodoActualSubject.next(periodoAcademico);
          
          // Detectar cambio de período
          if (periodoAnterior && periodoAnterior.valor !== periodoAcademico.valor) {
            this.cambioPeriodoSubject.next({
              anterior: periodoAnterior,
              actual: periodoAcademico
            });
          }
          
          return periodoAcademico;
        }
        // Si data es null, limpiar el subject
        this.periodoActualSubject.next(null);
        return null;
      }),
      catchError(() => {
        // Silenciosamente retornar null si el backend no está disponible
        this.periodoActualSubject.next(null);
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
    
    return this.http.get<{ success: boolean; data: PeriodoAcademico[] | string[] }>(url).pipe(
      map(response => response.success && response.data ? aPeriodos(response.data) : []),
      catchError(() => {
        return of([]);
      })
    );
  }

  /** Valores ("2025-1") de todos los períodos o, si no hay, de los recientes. Lista vacía si fallan los dos. */
  getValoresPeriodos(): Observable<string[]> {
    return this.getTodosLosPeriodos().pipe(
      switchMap(periodos => periodos.length ? of(periodos) : this.getPeriodosRecientes()),
      map(periodos => periodos.map(p => p.valor))
    );
  }

  /**
   * Obtiene períodos futuros
   */
  getPeriodosFuturos(): Observable<PeriodoAcademico[]> {
    const url = ApiEndpoints.PERIODOS_ACADEMICOS.FUTUROS;
    
    return this.http.get<{ success: boolean; data: PeriodoAcademico[] }>(url).pipe(
      map(response => response.success ? response.data : []),
      catchError(() => {
        return of([]);
      })
    );
  }

  /**
   * Obtiene períodos recientes (últimos 5 años)
   * 
   * Endpoint: GET /api/periodos-academicos/recientes
   * 
   * NOTA: El endpoint puede retornar:
   * - Array de strings: ["2025-2", "2025-1", "2024-2", ...]
   * - Array de objetos PeriodoAcademico completos
   * 
   * Este método maneja ambos casos convirtiendo strings a objetos PeriodoAcademico si es necesario.
   */
  getPeriodosRecientes(): Observable<PeriodoAcademico[]> {
    const url = ApiEndpoints.PERIODOS_ACADEMICOS.RECIENTES;
    
    return this.http.get<{ success: boolean; data: PeriodoAcademico[] | string[] }>(url).pipe(
      map(response => response.success && response.data ? aPeriodos(response.data) : []),
      catchError(() => {
        return of([]);
      })
    );
  }

  /**
   * Obtiene información de un período específico
   */
  getInfoPeriodo(periodo: string): Observable<PeriodoAcademico | null> {
    const url = ApiEndpoints.PERIODOS_ACADEMICOS.INFO(periodo);
    
    return this.http.get<{ success: boolean; data: PeriodoAcademico }>(url).pipe(
      map(response => response.success ? response.data : null),
      catchError(() => {
        return of(null);
      })
    );
  }

  /**
   * Obtiene la configuración del período activo (solo admin)
   */
  getPeriodoActivoConfig(): Observable<PeriodoActivoConfig | null> {
    const url = ApiEndpoints.PERIODOS_ACADEMICOS.ADMIN.PERIODO_ACTIVO;
    
    return this.http.get<PeriodoActivoResponse>(url).pipe(
      map(response => response.success ? response.data : null),
      catchError(() => {
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
    
    return this.http.put<PeriodoActivoResponse>(url, { periodoAcademico }).pipe(
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
      catchError(() => {
        return of(null);
      })
    );
  }

  /**
   * Inicializa el período actual (llamar al iniciar la app)
   * Solo intenta cargar si hay un token disponible
   */
  inicializarPeriodoActual(): void {
    // El endpoint NO requiere autenticación, así que siempre intentamos cargarlo
    if (typeof window !== 'undefined') {
      this.getPeriodoActual().subscribe();
    }
  }
}

