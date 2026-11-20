import { registerLocaleData } from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { TooltipItem } from 'chart.js';

import { EstadisticasService } from '@core/services/estadisticas.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { graficoProcesosDesdeResumen, graficoProgramas } from './dashboard-estadistico.graficos';
import { EstadisticasPorEstadoComponent } from './components/estadisticas-por-estado/estadisticas-por-estado.component';
import { TendenciasComparativasComponent } from './components/tendencias-comparativas/tendencias-comparativas.component';

/** Porcentajes del módulo estadístico con el separador decimal del locale (la app usa es-CO). */
describe('Porcentajes del módulo estadístico según el locale', () => {
  beforeAll(() => registerLocaleData(localeEsCO));

  describe('tooltips de los gráficos', () => {
    it('la dona de procesos usa coma decimal en es-CO y punto en en-US', () => {
      const contexto = { label: 'Reingreso', parsed: 1, dataset: { data: [1, 2] } } as TooltipItem<'doughnut'>;
      const etiqueta = (locale: string) =>
        graficoProcesosDesdeResumen(['Reingreso', 'ECAES'], [1, 2], locale).options!.plugins!.tooltip!.callbacks!
          .label!;

      expect(etiqueta('es-CO').call(null as never, contexto)).toBe('Reingreso: 1 (33,3%)');
      expect(etiqueta('en-US').call(null as never, contexto)).toBe('Reingreso: 1 (33.3%)');
    });

    it('las barras de programas usan coma decimal en es-CO', () => {
      const contexto = {
        label: 'Ingeniería de Sistemas',
        parsed: { x: 0, y: 3 },
        dataset: { data: [3, 5] },
      } as unknown as TooltipItem<'bar'>;
      const etiqueta = graficoProgramas(['Ingeniería de Sistemas', 'Electrónica'], [3, 5], 'es-CO').options!.plugins!
        .tooltip!.callbacks!.label!;

      expect(etiqueta.call(null as never, contexto)).toBe('Ingeniería de Sistemas: 3 solicitudes (37,5%)');
    });
  });

  describe('formatPorcentaje de las tarjetas', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          { provide: LOCALE_ID, useValue: 'es-CO' },
          { provide: EstadisticasService, useValue: {} },
          { provide: SnackbarService, useValue: {} },
        ],
      });
    });

    it('estado de solicitudes: un decimal con coma', () => {
      const c = TestBed.runInInjectionContext(() => new EstadisticasPorEstadoComponent());
      expect(c.formatPorcentaje(39.34)).toBe('39,3%');
      expect(c.formatPorcentaje(0)).toBe('0,0%');
    });

    it('tendencias comparativas: un decimal con coma y punto de miles', () => {
      const c = TestBed.runInInjectionContext(() => new TendenciasComparativasComponent());
      expect(c.formatPorcentaje(52.5)).toBe('52,5%');
      expect(c.formatPorcentaje(1200)).toBe('1.200,0%');
    });
  });
});
