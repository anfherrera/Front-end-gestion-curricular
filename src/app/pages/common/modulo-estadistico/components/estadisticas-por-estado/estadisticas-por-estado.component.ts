import { Component, OnInit, OnDestroy, OnChanges, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EstadisticasService } from '@core/services/estadisticas.service';
import { EstadoSolicitudesResponse, EstadoInfo } from '@core/models/estadisticas/generales.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-estadisticas-por-estado',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './estadisticas-por-estado.component.html',
  styleUrl: './estadisticas-por-estado.component.css'
})
export class EstadisticasPorEstadoComponent implements OnInit, OnDestroy, OnChanges {
  private estadisticasService = inject(EstadisticasService);

  @Input() periodoAcademico?: string;
  @Input() idPrograma?: number;
  
  data: EstadoSolicitudesResponse | null = null;
  estadosData: ({nombre: string} & EstadoInfo)[] = [];
  totalSolicitudes = 0;
  fechaConsulta = '';
  loading = true;
  error = false;
  private subscription: Subscription = new Subscription();

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnChanges(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.loading = true;
    this.error = false;

    // Preparar filtros
    const filtros: { periodoAcademico?: string; idPrograma?: number } = {};
    
    if (this.periodoAcademico && this.periodoAcademico.trim() !== '' && this.periodoAcademico !== 'todos') {
      filtros.periodoAcademico = this.periodoAcademico.trim();
    }
    
    if (this.idPrograma !== undefined && this.idPrograma !== null && !isNaN(this.idPrograma) && this.idPrograma > 0) {
      filtros.idPrograma = this.idPrograma;
    }

    // Usar el endpoint específico de estado de solicitudes que funciona
    const sub = this.estadisticasService.getEstadoSolicitudes(filtros)
      .subscribe({
        next: (response: EstadoSolicitudesResponse) => {
          
          // Procesar datos desde el endpoint de estado de solicitudes
          const estados = response.resumenPorEstado || response.estados || {};
          this.totalSolicitudes = response.totalSolicitudes || 0;
          this.fechaConsulta = response.fechaConsulta || new Date().toISOString();
          
          // Siempre mostrar los 4 estados principales, incluso con cantidad 0
          // El backend ahora siempre devuelve: APROBADA, ENVIADA, EN_PROCESO, RECHAZADA
          const estadosPrincipales = ['APROBADA', 'ENVIADA', 'EN_PROCESO', 'RECHAZADA'];
          
          // Usar el nuevo estado EN_PROCESO (combinado) en lugar de APROBADA_FUNCIONARIO y APROBADA_COORDINADOR
          this.estadosData = estadosPrincipales.map(estadoKey => {
            const estado = estados[estadoKey];
            
            // Si el estado existe en la respuesta, usar sus datos
            if (estado) {
              return {
                nombre: estadoKey, // Usar estadoKey directamente ya que EstadoInfo no tiene propiedad 'estado'
                cantidad: estado.cantidad || 0,
                porcentaje: estado.porcentaje || 0.0,
                icono: estado.icono || this.getDefaultIcon(estadoKey),
                color: estado.color || this.getDefaultColor(estadoKey),
                descripcion: estado.descripcion || this.getDefaultDescription(estadoKey)
              };
            }
            
            // Si no existe, crear un estado por defecto con cantidad 0
            return {
              nombre: estadoKey,
              cantidad: 0,
              porcentaje: 0.0,
              icono: this.getDefaultIcon(estadoKey),
              color: this.getDefaultColor(estadoKey),
              descripcion: this.getDefaultDescription(estadoKey)
            };
          });
          
          // Crear datos de análisis usando los estados principales
          // Usar tasaResolucion del nivel raíz si está disponible, sino calcular
          const tasaResolucion = response.tasaResolucion ?? (response.analisis?.tasaResolucion ?? (this.totalSolicitudes > 0 ? ((estados['APROBADA']?.cantidad || 0) / this.totalSolicitudes) * 100 : 0));
          const analisis = response.analisis;
          this.data = {
            totalSolicitudes: this.totalSolicitudes,
            fechaConsulta: this.fechaConsulta,
            estados: estados,
            analisis: {
              solicitudesPendientes: analisis?.solicitudesPendientes ?? ((estados['ENVIADA']?.cantidad || 0) + (estados['EN_PROCESO']?.cantidad || 0)),
              solicitudesCompletadas: analisis?.solicitudesCompletadas ?? (estados['APROBADA']?.cantidad || 0),
              tasaResolucion: tasaResolucion,
              estadoMasComun: analisis?.estadoMasComun || this.obtenerEstadoMasComun(estados)
            }
          };
          
          this.loading = false;
        },
        error: () => {
          this.error = true;
          this.loading = false;
        }
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
      'APROBADA': 'check_circle',
      'ENVIADA': 'send',
      'EN_PROCESO': 'schedule',
      'RECHAZADA': 'cancel'
    };
    return iconMap[estadoKey] || 'info';
  }

  /**
   * Obtiene el color según el estado - Colores institucionales (Sistema de Diseño TIC)
   */
  private getDefaultColor(estadoKey: string): string {
    const colorMap: Record<string, string> = {
      'APROBADA': '#249337',
      'ENVIADA': '#1D72D3',
      'EN_PROCESO': '#1D72D3',
      'RECHAZADA': '#FF6D0A'
    };
    return colorMap[estadoKey] || '#454444';
  }

  /**
   * Obtiene la descripción por defecto según el estado
   */
  private getDefaultDescription(estadoKey: string): string {
    const descMap: Record<string, string> = {
      'APROBADA': 'Solicitudes completamente aprobadas',
      'ENVIADA': 'Solicitudes enviadas pendientes de revisión',
      'EN_PROCESO': 'Solicitudes en proceso de revisión',
      'RECHAZADA': 'Solicitudes rechazadas'
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
      'fas fa-info-circle': 'info'
    };
    return faToMat[icono] || icono || 'help_outline';
  }


  /**
   * Formatea un número como porcentaje
   */
  formatPorcentaje(valor: number): string {
    return `${valor.toFixed(1)}%`;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
