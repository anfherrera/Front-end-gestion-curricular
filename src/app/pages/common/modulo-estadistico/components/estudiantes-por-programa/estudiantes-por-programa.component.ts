import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, OnChanges, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { EstadisticasService } from '@core/services/estadisticas.service';
import { EstudiantesPorProgramaResponse, ProgramaData } from '@core/models/estadisticas/generales.model';

@Component({
  selector: 'app-estudiantes-por-programa',
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule, MatButtonModule, MatTooltipModule],
  templateUrl: './estudiantes-por-programa.component.html',
  styleUrl: './estudiantes-por-programa.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstudiantesPorProgramaComponent implements OnInit, OnDestroy, OnChanges {
  private estadisticasService = inject(EstadisticasService);

  readonly autoLoad = input(true);
  readonly periodoAcademico = input<string>();
  readonly idPrograma = input<number>();

  readonly programasData = signal<ProgramaData[]>([]);
  readonly totalEstudiantes = signal(0);
  readonly fechaConsulta = signal<string | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

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

    const sub = this.estadisticasService.getEstudiantesPorPrograma(filtros).subscribe({
      next: (response: EstudiantesPorProgramaResponse) => {
        this.fechaConsulta.set(response.fechaConsulta);
        this.programasData.set(this.procesarDatos(response.estudiantesPorPrograma));
        this.totalEstudiantes.set(this.calcularTotalEstudiantes(response.estudiantesPorPrograma));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Error al cargar datos de estudiantes por programa');
      },
    });

    this.subscription.add(sub);
  }

  private procesarDatos(estudiantesPorPrograma: Record<string, number>): ProgramaData[] {
    const total = this.calcularTotalEstudiantes(estudiantesPorPrograma);

    return Object.entries(estudiantesPorPrograma)
      .map(([nombre, cantidad]) => ({
        nombre: this.formatearNombrePrograma(nombre),
        cantidad,
        porcentaje: total > 0 ? (cantidad / total) * 100 : 0,
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  private calcularTotalEstudiantes(estudiantesPorPrograma: Record<string, number>): number {
    return Object.values(estudiantesPorPrograma).reduce((total, cantidad) => total + cantidad, 0);
  }

  private formatearNombrePrograma(nombre: string): string {
    // Formatear nombres largos de programas
    if (nombre.length > 30) {
      return nombre.substring(0, 27) + '...';
    }
    return nombre;
  }
}
