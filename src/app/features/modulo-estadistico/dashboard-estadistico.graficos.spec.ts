import { registerLocaleData } from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';
import type { TooltipItem } from 'chart.js';

import { graficoProgramas } from './dashboard-estadistico.graficos';

/** Porcentajes del módulo estadístico con el separador decimal del locale (la app usa es-CO). */
describe('Porcentajes del módulo estadístico según el locale', () => {
  beforeAll(() => registerLocaleData(localeEsCO));

  it('las barras de programas usan coma decimal en es-CO y punto en en-US', () => {
    const contexto = {
      label: 'Ingeniería de Sistemas',
      parsed: { x: 0, y: 3 },
      dataset: { data: [3, 5] },
    } as unknown as TooltipItem<'bar'>;
    const etiqueta = (locale: string) =>
      graficoProgramas(['Ingeniería de Sistemas', 'Electrónica'], [3, 5], locale).options!.plugins!.tooltip!.callbacks!
        .label!;

    expect(etiqueta('es-CO').call(null as never, contexto)).toBe('Ingeniería de Sistemas: 3 solicitudes (37,5%)');
    expect(etiqueta('en-US').call(null as never, contexto)).toBe('Ingeniería de Sistemas: 3 solicitudes (37.5%)');
  });
});
