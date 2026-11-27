import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  AlertaCritica,
  EstadisticasRecomendaciones,
  PrioridadRecomendacion,
  Recomendacion,
} from '@core/models/estadisticas/cursos-verano.model';
import { COLORS } from '@core/design-system/design-tokens';

const ORDEN_PRIORIDAD: Record<PrioridadRecomendacion, number> = { CRITICA: 0, ALTA: 1, MEDIA: 2, BAJA: 3 };
const COLOR_PRIORIDAD: Record<PrioridadRecomendacion, string> = {
  CRITICA: COLORS.errorText,
  ALTA: COLORS.primary,
  MEDIA: COLORS.tertiary,
  BAJA: COLORS.neutralSecondary,
};
const ETIQUETA_PRIORIDAD: Record<PrioridadRecomendacion, string> = {
  CRITICA: 'Crítica',
  ALTA: 'Alta',
  MEDIA: 'Media',
  BAJA: 'Baja',
};

/** Pestaña "Recomendaciones" del dashboard de cursos de verano: resumen, alertas y tarjetas que se expanden. */
@Component({
  selector: 'app-recomendaciones-cursos-verano',
  imports: [DecimalPipe, MatButtonModule, MatCardModule, MatIconModule],
  templateUrl: './recomendaciones-cursos-verano.component.html',
  styleUrl: './recomendaciones-cursos-verano.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecomendacionesCursosVeranoComponent {
  readonly recomendaciones = input<Recomendacion[]>([]);
  readonly alertasCriticas = input<AlertaCritica[]>([]);
  readonly estadisticas = input<Partial<EstadisticasRecomendaciones>>({});

  /** De la más a la menos prioritaria. */
  readonly ordenadas = computed(() => {
    const orden = (r: Recomendacion) => ORDEN_PRIORIDAD[r.prioridad] ?? 999;
    return [...this.recomendaciones()].sort((a, b) => orden(a) - orden(b));
  });

  /** Ids de las recomendaciones con los detalles abiertos. */
  readonly expandidas = signal(new Set<string>());

  alternar(id: string): void {
    this.expandidas.update((actual) => {
      const nuevo = new Set(actual);
      if (!nuevo.delete(id)) nuevo.add(id);
      return nuevo;
    });
  }

  colorPrioridad(prioridad: string): string {
    return COLOR_PRIORIDAD[prioridad as PrioridadRecomendacion] || COLORS.neutralSecondary;
  }

  etiquetaPrioridad(prioridad: string): string {
    return ETIQUETA_PRIORIDAD[(prioridad || '').toUpperCase() as PrioridadRecomendacion] || prioridad;
  }
}
