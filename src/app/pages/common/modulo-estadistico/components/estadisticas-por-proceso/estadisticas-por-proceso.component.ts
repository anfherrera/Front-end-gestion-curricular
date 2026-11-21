import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, OnChanges, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Subscription } from 'rxjs';
import { EstadisticasService } from '@core/services/estadisticas.service';
import { EstadisticasPorProcesoResponse, ProcesoDetallado } from '@core/models/estadisticas/generales.model';

interface ProcesoData {
  nombre: string;
  nombreFormateado: string;
  datos: ProcesoDetallado;
  totalSolicitudes: number;
  aprobadas: number;
  rechazadas: number;
  enProceso: number;
  enviadas: number;
  porcentajeAprobacion: number;
}

interface PresentacionProceso {
  nombre: string;
  clase: string;
  icono: string;
}

/**
 * Presentación de cada proceso, por la clave que envía el backend (TipoProcesoSolicitud: "Homologacion",
 * "Paz y Salvo", "Reingreso", "Cursos de Verano", "ECAES"), sin tildes y en minúsculas.
 */
const PRESENTACION_PROCESOS: Record<string, PresentacionProceso> = {
  reingreso: { nombre: 'Reingreso de Estudiante', clase: 'reingreso', icono: 'person_add' },
  homologacion: { nombre: 'Homologación de Asignaturas', clase: 'homologacion', icono: 'swap_horiz' },
  'cursos de verano': { nombre: 'Cursos de Verano', clase: 'cursos', icono: 'school' },
  ecaes: { nombre: 'Pruebas ECAES', clase: 'ecaes', icono: 'quiz' },
  'paz y salvo': { nombre: 'Paz y Salvo', clase: 'paz', icono: 'verified' },
};

function presentacionProceso(nombre: string): PresentacionProceso | undefined {
  const clave = nombre.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
  return PRESENTACION_PROCESOS[clave];
}

@Component({
  selector: 'app-estadisticas-por-proceso',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './estadisticas-por-proceso.component.html',
  styleUrl: './estadisticas-por-proceso.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstadisticasPorProcesoComponent implements OnInit, OnDestroy, OnChanges {
  private estadisticasService = inject(EstadisticasService);

  readonly autoLoad = input(true);
  readonly periodoAcademico = input<string>();
  readonly idPrograma = input<number>();

  readonly procesosData = signal<ProcesoData[]>([]);
  readonly fechaConsulta = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  mostrarDatosRaw = false;

  private subscription: Subscription = new Subscription();

  ngOnInit(): void {
    if (this.autoLoad()) {
      this.cargarDatos();
    }
  }

  ngOnChanges(): void {
    if (this.autoLoad()) {
      this.cargarDatos();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  cargarDatos(): void {
    this.loading.set(true);
    this.error.set(null);

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

    const sub = this.estadisticasService.getEstadisticasDetalladasPorProceso(filtros).subscribe({
      next: (response: EstadisticasPorProcesoResponse) => {
        this.fechaConsulta.set(response.fechaConsulta);
        this.procesosData.set(this.procesarDatos(response.estadisticasPorProceso));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Error al cargar estadísticas por proceso');
      },
    });

    this.subscription.add(sub);
  }

  private procesarDatos(estadisticasPorProceso: Record<string, ProcesoDetallado>): ProcesoData[] {
    return Object.entries(estadisticasPorProceso)
      .map(([nombre, datos]) => {
        const total = datos.totalSolicitudes || 0;
        const aprobadas = datos.aprobadas || 0;
        return {
          nombre,
          nombreFormateado: this.formatearNombreProceso(nombre),
          datos,
          totalSolicitudes: total,
          aprobadas,
          rechazadas: datos.rechazadas || 0,
          enProceso: datos.enProceso || 0,
          enviadas: datos.enviadas || 0,
          porcentajeAprobacion: total > 0 ? (aprobadas / total) * 100 : 0,
        };
      })
      .sort((a, b) => b.totalSolicitudes - a.totalSolicitudes);
  }

  private formatearNombreProceso(nombre: string): string {
    return presentacionProceso(nombre)?.nombre ?? nombre;
  }

  getProcesoClass(nombre: string): string {
    return presentacionProceso(nombre)?.clase ?? 'default';
  }

  getProcesoIcon(nombre: string): string {
    return presentacionProceso(nombre)?.icono ?? 'description';
  }

  /** Hasta 5 campos del proceso, para la vista de datos detallados. */
  getDatosKeys(datos: ProcesoDetallado): (keyof ProcesoDetallado)[] {
    return (Object.keys(datos) as (keyof ProcesoDetallado)[]).slice(0, 5);
  }

  toggleDatosRaw(): void {
    this.mostrarDatosRaw = !this.mostrarDatosRaw;
  }
}
