// Predicciones globales del dashboard general.

export interface PrediccionItem {
  nombre: string;
  tipo: 'PROCESO' | 'PROGRAMA';
  demandaActual: number;
  demandaEstimada: number;
  variacion: number;
  porcentajeVariacion: number;
  tendencia: 'CRECIENTE' | 'DECRECIENTE' | 'ESTABLE';
  // Backend ya no envía: pendiente, rSquared, modeloUtilizado
}

export interface PrediccionesGlobales {
  // Predicción Global
  demandaTotalActual: number;
  demandaTotalEstimada: number;
  variacionTotal: number;
  porcentajeVariacionTotal: number;
  
  // Predicciones por Proceso
  procesosConTendenciaCreciente: PrediccionItem[];
  procesosConTendenciaDecreciente: PrediccionItem[];
  procesosEstables: PrediccionItem[];
  
  // Predicciones por Programa
  programasConTendenciaCreciente: PrediccionItem[];
  programasConTendenciaDecreciente: PrediccionItem[];
  programasEstables: PrediccionItem[];
  
  // Metadata
  // metodologia eliminado (campo técnico innecesario)
  confiabilidad: 'ALTA' | 'MEDIA' | 'BAJA';
  fechaPrediccion: string;
  umbralTendencia: number;
}
