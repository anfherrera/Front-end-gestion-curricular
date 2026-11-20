import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  OnInit,
  OnDestroy,
  OnChanges,
  inject,
  input,
  signal,
} from '@angular/core';
import { formatNumber } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';

import { EstadisticasService } from '@core/services/estadisticas.service';
import { TendenciasComparativasResponse } from '@core/models/estadisticas/tendencias.model';
import { SnackbarService } from '@core/services/snackbar.service';

@Component({
  selector: 'app-tendencias-comparativas',
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule, MatButtonModule],
  templateUrl: './tendencias-comparativas.component.html',
  styleUrls: ['./tendencias-comparativas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TendenciasComparativasComponent implements OnInit, OnDestroy, OnChanges {
  private estadisticasService = inject(EstadisticasService);
  private snackbar = inject(SnackbarService);
  private locale = inject(LOCALE_ID);

  readonly periodoAcademico = input<string>();
  readonly idPrograma = input<number>();

  readonly data = signal<TendenciasComparativasResponse | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.cargarTendenciasComparativas();
  }

  ngOnChanges(): void {
    this.cargarTendenciasComparativas();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Carga las tendencias y comparativas desde el API con filtros opcionales
   */
  cargarTendenciasComparativas(): void {
    this.loading.set(true);
    this.error.set(false);

    // Preparar filtros
    const filtros: { periodoAcademico?: string; idPrograma?: number } = {};

    const periodoAcademico = this.periodoAcademico();
    if (periodoAcademico && periodoAcademico.trim() !== '' && periodoAcademico !== 'todos') {
      filtros.periodoAcademico = periodoAcademico.trim();
    }

    const idPrograma = this.idPrograma();
    if (idPrograma !== undefined && idPrograma !== null && !isNaN(idPrograma) && idPrograma > 0) {
      filtros.idPrograma = idPrograma;
    }

    const subscription = this.estadisticasService.getTendenciasComparativas(filtros).subscribe({
      next: (response) => {
        this.data.set(response);
        this.loading.set(false);
        this.mostrarExito('Tendencias y comparativas cargadas correctamente');
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
        this.mostrarError('Error al cargar tendencias y comparativas');
      },
    });

    this.subscriptions.push(subscription);
  }

  /**
   * Obtiene el color según la tendencia
   */
  getTendenciaColor(tendencia: string): string {
    switch (tendencia.toLowerCase()) {
      case 'creciente':
        return '#10b981'; // Verde
      case 'decreciente':
        return '#ef4444'; // Rojo
      case 'estable':
        return '#3b82f6'; // Azul
      default:
        return '#6b7280'; // Gris
    }
  }

  /**
   * Obtiene el icono según la tendencia
   */
  getTendenciaIcon(tendencia: string): string {
    switch (tendencia.toLowerCase()) {
      case 'creciente':
        return 'trending_up';
      case 'decreciente':
        return 'trending_down';
      case 'estable':
        return 'trending_flat';
      default:
        return 'help_outline';
    }
  }

  /** Porcentaje con un decimal y el separador del locale: 52.5 → "52,5%" en es-CO. */
  formatPorcentaje(valor: number): string {
    return `${formatNumber(valor, this.locale, '1.1-1')}%`;
  }

  /**
   * Obtiene las claves de un objeto para iterar
   */
  getObjectKeys(obj: object | null | undefined): string[] {
    return obj ? Object.keys(obj) : [];
  }

  /**
   * Muestra mensaje de éxito
   */
  private mostrarExito(mensaje: string): void {
    this.snackbar.exito(mensaje);
  }

  /**
   * Muestra mensaje de error
   */
  private mostrarError(mensaje: string): void {
    this.snackbar.error(mensaje);
  }
}
