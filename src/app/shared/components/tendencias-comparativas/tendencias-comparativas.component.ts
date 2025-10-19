import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';

import { EstadisticasService } from '../../../core/services/estadisticas.service';
import { TendenciasComparativasResponse, CrecimientoTemporal, ComparativaProcesos, ComparativaProgramas, ResumenEstrategico } from '../../../core/models/estadisticas.model';

@Component({
  selector: 'app-tendencias-comparativas',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatButtonModule
  ],
  templateUrl: './tendencias-comparativas.component.html',
  styleUrls: ['./tendencias-comparativas.component.css']
})
export class TendenciasComparativasComponent implements OnInit, OnDestroy {
  data: TendenciasComparativasResponse | null = null;
  loading = false;
  error = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private estadisticasService: EstadisticasService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.cargarTendenciasComparativas();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Carga las tendencias y comparativas desde el API
   */
  cargarTendenciasComparativas(): void {
    this.loading = true;
    this.error = false;
    
    console.log('🔄 Cargando tendencias y comparativas...');
    
    const subscription = this.estadisticasService.getTendenciasComparativas()
      .subscribe({
        next: (response) => {
          console.log('✅ Tendencias y comparativas cargadas:', response);
          this.data = response;
          this.loading = false;
          this.mostrarExito('Tendencias y comparativas cargadas correctamente');
        },
        error: (error) => {
          console.error('❌ Error cargando tendencias y comparativas:', error);
          this.loading = false;
          this.error = true;
          this.mostrarError('Error al cargar tendencias y comparativas');
        }
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

  /**
   * Formatea un número como porcentaje
   */
  formatPorcentaje(valor: number): string {
    return `${valor.toFixed(1)}%`;
  }

  /**
   * Obtiene las claves de un objeto para iterar
   */
  getObjectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  /**
   * Muestra mensaje de éxito
   */
  private mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  /**
   * Muestra mensaje de error
   */
  private mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
