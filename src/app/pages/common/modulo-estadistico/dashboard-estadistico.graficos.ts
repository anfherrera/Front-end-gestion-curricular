import type { ChartConfiguration, TooltipItem } from 'chart.js';
import { EstadisticasPorPeriodoMejoradasResponse } from '@core/models/estadisticas/mejoradas.model';
import { ProcesoDetallado } from '@core/models/estadisticas/generales.model';

/** Configuraciones de Chart.js del dashboard estadístico. Sin animaciones, por rendimiento. */

const COLOR_POR_PROCESO: Record<string, string> = {
  'Cursos de Verano': '#2196F3',
  'Paz y Salvo': '#FF9800',
  'Reingreso': '#4CAF50',
  'ECAES': '#F44336',
  'Homologación': '#9C27B0'
};
const COLOR_PROCESO_DESCONOCIDO = '#607D8B';

/** Colores del gráfico de procesos cuando se arma con el resumen (sin nombres del backend). */
const COLORES_PROCESOS_RESUMEN = ['#ff9800', '#8e24aa', '#249337', '#2196f3'];

const COLORES_PROGRAMAS = ['#2196f3', '#ff9800', '#249337', '#9c27b0'];
const BORDES_PROGRAMAS = ['#1976d2', '#f57c00', '#388e3c', '#7b1fa2'];

function porcentaje(valor: number, datos: number[]): string {
  const total = datos.reduce((a, b) => a + b, 0);
  return total > 0 ? ((valor / total) * 100).toFixed(1) : '0.0';
}

function colorDeProceso(nombre: string): string {
  if (COLOR_POR_PROCESO[nombre]) return COLOR_POR_PROCESO[nombre];
  const parecido = Object.keys(COLOR_POR_PROCESO).find(proceso => nombre.includes(proceso));
  return parecido ? COLOR_POR_PROCESO[parecido] : COLOR_PROCESO_DESCONOCIDO;
}

function dona(etiquetas: string[], valores: number[], colores: string[]): ChartConfiguration<'doughnut'> {
  return {
    type: 'doughnut',
    data: {
      labels: etiquetas,
      datasets: [{
        label: 'Solicitudes',
        data: valores,
        backgroundColor: colores,
        borderWidth: 3,
        borderColor: '#fff',
        hoverBorderWidth: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 20, usePointStyle: true, font: { size: 12 } }
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'doughnut'>) =>
              `${context.label || ''}: ${context.parsed} (${porcentaje(context.parsed, context.dataset.data as number[])}%)`
          }
        }
      },
      animation: { animateRotate: false, animateScale: false, duration: 0 }
    }
  };
}

/** Solicitudes por proceso (de /estadisticas-por-proceso). */
export function graficoProcesos(procesos: Record<string, ProcesoDetallado>): ChartConfiguration<'doughnut'> {
  const etiquetas = Object.keys(procesos).map(nombre => nombre.replace('Solicitud de ', '').replace('Solicitud ', ''));
  const valores = Object.values(procesos).map(p => p.totalSolicitudes || 0);
  return dona(etiquetas, valores, etiquetas.map(colorDeProceso));
}

/** Solicitudes por proceso a partir del resumen, si el endpoint detallado falla. */
export function graficoProcesosDesdeResumen(etiquetas: string[], valores: number[]): ChartConfiguration<'doughnut'> {
  return dona(etiquetas, valores, COLORES_PROCESOS_RESUMEN);
}

/** Solicitudes y aprobadas por mes. */
export function graficoTendencia(datos: EstadisticasPorPeriodoMejoradasResponse): ChartConfiguration<'line'> {
  let meses: string[];
  let solicitudes: number[];
  let aprobadas: number[];

  if (datos.mesesOrdenados?.length) {
    meses = datos.mesesOrdenados.map(m => m.mes || '');
    solicitudes = datos.mesesOrdenados.map(m => m.total || 0);
    aprobadas = datos.mesesOrdenados.map(m => m.aprobadas || 0);
  } else {
    meses = datos.todosLosMeses?.length ? datos.todosLosMeses : Object.keys(datos.porMes);
    solicitudes = meses.map(mes => datos.porMes[mes]?.total || 0);
    aprobadas = meses.map(mes => datos.porMes[mes]?.aprobadas || 0);
  }

  const serie = (label: string, data: number[], color: string, relleno: string) => ({
    label,
    data,
    borderColor: color,
    backgroundColor: relleno,
    tension: 0.4,
    fill: true,
    pointBackgroundColor: color,
    pointBorderColor: '#fff',
    pointBorderWidth: 2,
    pointRadius: 6
  });

  return {
    type: 'line',
    data: {
      labels: meses,
      datasets: [
        serie('Solicitudes', solicitudes, '#2196f3', 'rgba(33, 150, 243, 0.1)'),
        serie('Aprobadas', aprobadas, '#249337', 'rgba(76, 175, 80, 0.1)')
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, padding: 20 } },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#fff',
          borderWidth: 1
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' } }
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      animation: { duration: 0, easing: 'linear' }
    }
  };
}

/** Solicitudes por programa académico. */
export function graficoProgramas(programas: string[], valores: number[]): ChartConfiguration<'bar'> {
  return {
    type: 'bar',
    data: {
      labels: programas,
      datasets: [{
        label: 'Solicitudes',
        data: valores,
        backgroundColor: COLORES_PROGRAMAS,
        borderColor: BORDES_PROGRAMAS,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#fff',
          borderWidth: 1,
          callbacks: {
            label: (context: TooltipItem<'bar'>) => {
              const valor = context.parsed?.y || 0;
              return `${context.label || ''}: ${valor} solicitudes (${porcentaje(valor, context.dataset.data as number[])}%)`;
            }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45 } },
        y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' }, ticks: { precision: 0 } }
      },
      animation: { duration: 0, easing: 'linear' }
    }
  };
}
