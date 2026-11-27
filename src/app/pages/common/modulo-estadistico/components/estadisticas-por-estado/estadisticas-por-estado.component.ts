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
import { CommonModule, formatNumber } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EstadisticasService } from '@core/services/estadisticas.service';
import { EstadoSolicitudesResponse, EstadoInfo } from '@core/models/estadisticas/generales.model';
import { Subscription } from 'rxjs';
import { COLORS } from '@core/design-system/design-tokens';

@Component({
  selector: 'app-estadisticas-por-estado',
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatButtonModule, MatTooltipModule],
  templateUrl: './estadisticas-por-estado.component.html',
  styleUrl: './estadisticas-por-estado.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadisticasPorEstadoComponent implements OnInit, OnDestroy, OnChanges {
  private estadisticasService = inject(EstadisticasService);
  private locale = inject(LOCALE_ID);

  readonly periodoAcademico = input<string>();
  readonly idPrograma = input<number>();

  readonly data = signal<EstadoSolicitudesResponse | null>(null);
  readonly estadosData = signal<({ nombre: string } & EstadoInfo)[]>([]);
  readonly totalSolicitudes = signal(0);
  readonly fechaConsulta = signal('');
  readonly loading = signal(true);
  readonly error = signal(false);
  private subscription: Subscription = new Subscription();

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnChanges(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
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

    // Usar el endpoint específico de estado de solicitudes que funciona
    const sub = this.estadisticasService.getEstadoSolicitudes(filtros).subscribe({
      next: (response: EstadoSolicitudesResponse) => {
        // Procesar datos desde el endpoint de estado de solicitudes
        const estados = response.resumenPorEstado || response.estados || {};
        this.totalSolicitudes.set(response.totalSolicitudes || 0);
        this.fechaConsulta.set(response.fechaConsulta || new Date().toISOString());

        // Siempre mostrar los 4 estados principales, incluso con cantidad 0
        // El backend ahora siempre devuelve: APROBADA, ENVIADA, EN_PROCESO, RECHAZADA
        const estadosPrincipales = ['APROBADA', 'ENVIADA', 'EN_PROCESO', 'RECHAZADA'];

        // Usar el nuevo estado EN_PROCESO (combinado) en lugar de APROBADA_FUNCIONARIO y APROBADA_COORDINADOR
        this.estadosData.set(
          estadosPrincipales.map((estadoKey) => {
            const estado = estados[estadoKey];

            // Si el estado existe en la respuesta, usar sus datos
            if (estado) {
              return {
                nombre: estadoKey, // Usar estadoKey directamente ya que EstadoInfo no tiene propiedad 'estado'
                cantidad: estado.cantidad || 0,
                porcentaje: estado.porcentaje || 0.0,
                icono: estado.icono || this.getDefaultIcon(estadoKey),
                // El backend manda su propio color; se usa siempre el institucional del estado
                color: this.getDefaultColor(estadoKey),
                descripcion: estado.descripcion || this.getDefaultDescription(estadoKey),
              };
            }

            // Si no existe, crear un estado por defecto con cantidad 0
            return {
              nombre: estadoKey,
              cantidad: 0,
              porcentaje: 0.0,
              icono: this.getDefaultIcon(estadoKey),
              color: this.getDefaultColor(estadoKey),
              descripcion: this.getDefaultDescription(estadoKey),
            };
          })
        );

        // Crear datos de análisis usando los estados principales
        // Usar tasaResolucion del nivel raíz si está disponible, sino calcular
        const tasaResolucion =
          response.tasaResolucion ??
          response.analisis?.tasaResolucion ??
          (this.totalSolicitudes() > 0 ? ((estados['APROBADA']?.cantidad || 0) / this.totalSolicitudes()) * 100 : 0);
        const analisis = response.analisis;
        this.data.set({
          totalSolicitudes: this.totalSolicitudes(),
          fechaConsulta: this.fechaConsulta(),
          estados: estados,
          analisis: {
            solicitudesPendientes:
              analisis?.solicitudesPendientes ??
              (estados['ENVIADA']?.cantidad || 0) + (estados['EN_PROCESO']?.cantidad || 0),
            solicitudesCompletadas: analisis?.solicitudesCompletadas ?? (estados['APROBADA']?.cantidad || 0),
            tasaResolucion: tasaResolucion,
            estadoMasComun: analisis?.estadoMasComun || this.obtenerEstadoMasComun(estados),
          },
        });

        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });

    this.subscription.add(sub);
  }

  private obtenerEstadoMasComun(estados: Record<string, EstadoInfo>): string {
    let maxCantidad = 0;
    let estadoMasComun = 'N/A';

    Object.entries(estados).forEach(([nombre, info]) => {
      const cantidad = info?.cantidad || 0;
      if (cantidad > maxCantidad) {
        maxCantidad = cantidad;
        estadoMasComun = nombre.replace(/_/g, ' ');
      }
    });

    return estadoMasComun;
  }

  /**
   * Obtiene el icono según el estado - Material Icons (Sistema de Diseño TIC)
   */
  private getDefaultIcon(estadoKey: string): string {
    const iconMap: Record<string, string> = {
      APROBADA: 'check_circle',
      ENVIADA: 'send',
      EN_PROCESO: 'schedule',
      RECHAZADA: 'cancel',
    };
    return iconMap[estadoKey] || 'info';
  }

  /**
   * Obtiene el color según el estado - Colores institucionales (Sistema de Diseño TIC)
   */
  private getDefaultColor(estadoKey: string): string {
    const colorMap: Record<string, string> = {
      APROBADA: COLORS.success,
      ENVIADA: COLORS.tertiary,
      EN_PROCESO: COLORS.primary,
      RECHAZADA: COLORS.error,
    };
    return colorMap[estadoKey] || COLORS.neutralText;
  }

  /**
   * Obtiene la descripción por defecto según el estado
   */
  private getDefaultDescription(estadoKey: string): string {
    const descMap: Record<string, string> = {
      APROBADA: 'Solicitudes completamente aprobadas',
      ENVIADA: 'Solicitudes enviadas pendientes de revisión',
      EN_PROCESO: 'Solicitudes en proceso de revisión',
      RECHAZADA: 'Solicitudes rechazadas',
    };
    return descMap[estadoKey] || 'Estado de solicitud';
  }

  actualizarDatos(): void {
    this.cargarDatos();
  }

  getIconName(icono: string): string {
    // Material Icons por defecto; compatibilidad con FontAwesome si se recibe del backend
    const faToMat: Record<string, string> = {
      'fas fa-check-circle': 'check_circle',
      'fas fa-paper-plane': 'send',
      'fas fa-times-circle': 'cancel',
      'fas fa-clock': 'schedule',
      'fas fa-pause-circle': 'pause_circle',
      'fas fa-exclamation-circle': 'warning',
      'fas fa-info-circle': 'info',
    };
    return faToMat[icono] || icono || 'help_outline';
  }

  /** Porcentaje con un decimal y el separador del locale: 39.34 → "39,3%" en es-CO. */
  formatPorcentaje(valor: number): string {
    return `${formatNumber(valor, this.locale, '1.1-1')}%`;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
