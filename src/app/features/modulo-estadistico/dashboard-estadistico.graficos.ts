import { formatNumber } from '@angular/common';
import type { ChartConfiguration, TooltipItem } from 'chart.js';
import { EstadisticasPorPeriodoMejoradasResponse } from '@features/modulo-estadistico/models/mejoradas.model';
import { ProcesoDetallado } from '@features/modulo-estadistico/models/generales.model';
import { COLOR_POR_PROCESO, COLORS, PALETA_CATEGORIAS, conAlfa } from '@core/design-system/design-tokens';

/** Configuraciones de Chart.js del dashboard estadístico. Sin animaciones, por rendimiento. */

/** Nombre del proceso (sin tildes ni mayúsculas) → color institucional del proceso. */
const COLOR_POR_NOMBRE: Record<string, string> = {
  'cursos de verano': COLOR_POR_PROCESO.cursosVerano,
  'paz y salvo': COLOR_POR_PROCESO.pazSalvo,
  reingreso: COLOR_POR_PROCESO.reingreso,
  ecaes: COLOR_POR_PROCESO.ecaes,
  homologacion: COLOR_POR_PROCESO.homologacion,
};

/** Tooltip con el azul oscuro institucional, como `mat-tooltip`. */
const TOOLTIP = {
  backgroundColor: COLORS.primaryDark,
  titleColor: COLORS.white,
  bodyColor: COLORS.white,
  borderColor: COLORS.white,
  borderWidth: 1,
};

/** Parte de `valor` sobre la suma de `datos`, con un decimal y el separador del locale ("39,3" en es-CO). */
function porcentaje(valor: number, datos: number[], locale: string): string {
  const total = datos.reduce((a, b) => a + b, 0);
  return formatNumber(total > 0 ? (valor / total) * 100 : 0, locale, '1.1-1');
}

function colorDeProceso(nombre: string): string {
  const clave = nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const proceso = Object.keys(COLOR_POR_NOMBRE).find((p) => clave.includes(p));
  return proceso ? COLOR_POR_NOMBRE[proceso] : COLORS.neutralSecondary;
}

function dona(
  etiquetas: string[],
  valores: number[],
  colores: string[],
  locale: string
): ChartConfiguration<'doughnut'> {
  return {
    type: 'doughnut',
    data: {
      labels: etiquetas,
      datasets: [
        {
          label: 'Solicitudes',
          data: valores,
          backgroundColor: colores,
          borderWidth: 3,
          borderColor: COLORS.white,
          hoverBorderWidth: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 20, usePointStyle: true, font: { size: 12 } },
        },
        tooltip: {
          callbacks: {
            label: (context: TooltipItem<'doughnut'>) =>
              `${context.label || ''}: ${context.parsed} (${porcentaje(context.parsed, context.dataset.data as number[], locale)}%)`,
          },
        },
      },
      animation: { animateRotate: false, animateScale: false, duration: 0 },
    },
  };
}

/** Solicitudes por proceso (de /estadisticas-por-proceso). `locale` formatea el porcentaje del tooltip. */
export function graficoProcesos(
  procesos: Record<string, ProcesoDetallado>,
  locale: string
): ChartConfiguration<'doughnut'> {
  const etiquetas = Object.keys(procesos).map((nombre) =>
    nombre.replace('Solicitud de ', '').replace('Solicitud ', '')
  );
  const valores = Object.values(procesos).map((p) => p.totalSolicitudes || 0);
  return dona(etiquetas, valores, etiquetas.map(colorDeProceso), locale);
}

/** Solicitudes por proceso a partir del resumen, si el endpoint detallado falla. */
export function graficoProcesosDesdeResumen(
  etiquetas: string[],
  valores: number[],
  locale: string
): ChartConfiguration<'doughnut'> {
  return dona(etiquetas, valores, etiquetas.map(colorDeProceso), locale);
}

/** Solicitudes y aprobadas por mes. */
export function graficoTendencia(datos: EstadisticasPorPeriodoMejoradasResponse): ChartConfiguration<'line'> {
  let meses: string[];
  let solicitudes: number[];
  let aprobadas: number[];

  if (datos.mesesOrdenados?.length) {
    meses = datos.mesesOrdenados.map((m) => m.mes || '');
    solicitudes = datos.mesesOrdenados.map((m) => m.total || 0);
    aprobadas = datos.mesesOrdenados.map((m) => m.aprobadas || 0);
  } else {
    meses = datos.todosLosMeses?.length ? datos.todosLosMeses : Object.keys(datos.porMes);
    solicitudes = meses.map((mes) => datos.porMes[mes]?.total || 0);
    aprobadas = meses.map((mes) => datos.porMes[mes]?.aprobadas || 0);
  }

  const serie = (label: string, data: number[], color: string) => ({
    label,
    data,
    borderColor: color,
    backgroundColor: conAlfa(color, 0.1),
    tension: 0.4,
    fill: true,
    pointBackgroundColor: color,
    pointBorderColor: COLORS.white,
    pointBorderWidth: 2,
    pointRadius: 6,
  });

  return {
    type: 'line',
    data: {
      labels: meses,
      datasets: [serie('Solicitudes', solicitudes, COLORS.tertiary), serie('Aprobadas', aprobadas, COLORS.success)],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, padding: 20 } },
        tooltip: { mode: 'index', intersect: false, ...TOOLTIP },
      },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' } },
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      animation: { duration: 0, easing: 'linear' },
    },
  };
}

/** Solicitudes por programa académico. `locale` formatea el porcentaje del tooltip. */
export function graficoProgramas(programas: string[], valores: number[], locale: string): ChartConfiguration<'bar'> {
  return {
    type: 'bar',
    data: {
      labels: programas,
      datasets: [
        {
          label: 'Solicitudes',
          data: valores,
          backgroundColor: PALETA_CATEGORIAS,
          borderColor: PALETA_CATEGORIAS,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          ...TOOLTIP,
          callbacks: {
            label: (context: TooltipItem<'bar'>) => {
              const valor = context.parsed?.y || 0;
              return `${context.label || ''}: ${valor} solicitudes (${porcentaje(valor, context.dataset.data as number[], locale)}%)`;
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45 } },
        y: { beginAtZero: true, grid: { color: 'rgba(0, 0, 0, 0.1)' }, ticks: { precision: 0 } },
      },
      animation: { duration: 0, easing: 'linear' },
    },
  };
}
