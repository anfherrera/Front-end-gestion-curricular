import { Component, OnInit, OnDestroy, OnChanges, Input } from '@angular/core';
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
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './estudiantes-por-programa.component.html',
  styleUrl: './estudiantes-por-programa.component.css'
})
export class EstudiantesPorProgramaComponent implements OnInit, OnDestroy, OnChanges {
  @Input() autoLoad = true;
  @Input() periodoAcademico?: string;
  @Input() idPrograma?: number;
  
  programasData: ProgramaData[] = [];
  totalEstudiantes = 0;
  fechaConsulta: string | null = null;
  loading = false;
  error: string | null = null;

  private subscription: Subscription = new Subscription();

  constructor(private estadisticasService: EstadisticasService) {}

  ngOnInit(): void {
    if (this.autoLoad) {
      this.cargarDatos();
    }
  }

  ngOnChanges(): void {
    if (this.autoLoad) {
      this.cargarDatos();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = null;

    // Preparar filtros
    const filtros: { periodoAcademico?: string; idPrograma?: number } = {};
    
    if (this.periodoAcademico && this.periodoAcademico.trim() !== '' && this.periodoAcademico !== 'todos') {
      filtros.periodoAcademico = this.periodoAcademico.trim();
    }
    
    if (this.idPrograma !== undefined && this.idPrograma !== null && !isNaN(this.idPrograma) && this.idPrograma > 0) {
      filtros.idPrograma = this.idPrograma;
    }

    const sub = this.estadisticasService.getEstudiantesPorPrograma(filtros)
      .subscribe({
        next: (response: EstudiantesPorProgramaResponse) => {
          this.fechaConsulta = response.fechaConsulta;
          this.programasData = this.procesarDatos(response.estudiantesPorPrograma);
          this.totalEstudiantes = this.calcularTotalEstudiantes(response.estudiantesPorPrograma);
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.error = 'Error al cargar datos de estudiantes por programa';
        }
      });

    this.subscription.add(sub);
  }

  private procesarDatos(estudiantesPorPrograma: Record<string, number>): ProgramaData[] {
    const total = this.calcularTotalEstudiantes(estudiantesPorPrograma);
    
    return Object.entries(estudiantesPorPrograma)
      .map(([nombre, cantidad]) => ({
        nombre: this.formatearNombrePrograma(nombre),
        cantidad,
        porcentaje: total > 0 ? (cantidad / total) * 100 : 0
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
