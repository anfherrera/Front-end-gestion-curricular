import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CursoEstadosService, EstadoCurso } from '../../../core/services/curso-estados.service';
import { CursosIntersemestralesService, CursoOfertadoVerano } from '../../../core/services/cursos-intersemestrales.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-estado-filters',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="filters-container">
      <div class="filters-header">
        <h3>🔍 Filtros por Estado</h3>
        <p>Selecciona un estado para ver solo los cursos en esa fase</p>
      </div>
      
      <div class="filters-content">
        <!-- Selector de estado -->
        <mat-form-field appearance="outline" class="estado-selector">
          <mat-label>Filtrar por estado</mat-label>
          <mat-select 
            [(value)]="estadoSeleccionado" 
            (selectionChange)="onEstadoChange($event.value)"
            placeholder="Todos los estados">
            <mat-option value="">Todos los estados</mat-option>
            <mat-option *ngFor="let estado of estadosDisponibles" [value]="estado.value">
              <div class="estado-option">
                <mat-icon>{{ estado.icon }}</mat-icon>
                <span>{{ estado.label }}</span>
                <small>{{ estado.descripcion }}</small>
              </div>
            </mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Chips de estado rápido -->
        <div class="estado-chips">
          <mat-chip 
            *ngFor="let estado of estadosDisponibles"
            (click)="onEstadoChange(estado.value)"
            [style.background-color]="estadoSeleccionado === estado.value ? estado.color : 'transparent'"
            [style.color]="estadoSeleccionado === estado.value ? 'white' : estado.color"
            [style.border]="'1px solid ' + estado.color"
            [class.selected]="estadoSeleccionado === estado.value"
            [class.loading]="cargandoFiltro"
            class="estado-chip">
            <mat-icon [style.color]="estadoSeleccionado === estado.value ? 'white' : estado.color">{{ estado.icon }}</mat-icon>
            <span>{{ estado.label }}</span>
            <span class="count" *ngIf="conteosEstados[estado.value] > 0">
              ({{ conteosEstados[estado.value] }})
            </span>
            <mat-spinner *ngIf="cargandoFiltro && estadoSeleccionado === estado.value" diameter="16" class="chip-spinner"></mat-spinner>
          </mat-chip>
        </div>
      </div>

      <!-- Información del estado seleccionado -->
      <div *ngIf="estadoSeleccionado" class="estado-info">
        <div class="info-card">
          <div class="info-header">
            <h4>{{ estadoInfo?.label }}</h4>
          </div>
          <p>{{ estadoInfo?.descripcion }}</p>
          <div class="info-stats">
            <span class="stat">
              <strong>{{ cursosFiltrados.length }}</strong> cursos
            </span>
            <span class="stat" *ngIf="conteosEstados[estadoSeleccionado] > 0">
              <strong>{{ conteosEstados[estadoSeleccionado] }}</strong> total
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filters-container {
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 12px rgba(0, 19, 140, 0.1);
      border: 1px solid #e3f2fd;
    }

    .filters-header {
      margin-bottom: 20px;
      text-align: center;
    }

    .filters-header h3 {
      color: #00138C;
      margin: 0 0 8px 0;
      font-size: 1.3rem;
      font-weight: 600;
    }

    .filters-header p {
      color: #666;
      margin: 0;
      font-size: 0.9rem;
    }

    .filters-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .estado-selector {
      width: 100%;
    }

    .estado-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }

    .estado-option mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .estado-option span {
      font-weight: 500;
      color: #333;
    }

    .estado-option small {
      color: #666;
      font-size: 0.8rem;
      margin-left: auto;
    }

    .estado-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
    }

    .estado-chip {
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .estado-chip:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .estado-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .estado-chip .count {
      font-size: 0.8rem;
      opacity: 0.8;
      margin-left: 4px;
    }

    .chip-spinner {
      margin-left: 8px;
    }

    .estado-chip.loading {
      opacity: 0.7;
      pointer-events: none;
    }

    .estado-chip.selected {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      transform: translateY(-1px);
    }

    .estado-info {
      margin-top: 20px;
    }

    .info-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      border-left: 4px solid #00138C;
      box-shadow: 0 2px 8px rgba(0, 19, 140, 0.1);
    }

    .info-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .info-header mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .info-header h4 {
      margin: 0;
      color: #00138C;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .info-card p {
      margin: 0 0 16px 0;
      color: #666;
      line-height: 1.5;
    }

    .info-stats {
      display: flex;
      gap: 20px;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #333;
    }

    .stat strong {
      color: #00138C;
      font-weight: 600;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .filters-container {
        padding: 16px;
      }

      .estado-chips {
        justify-content: flex-start;
      }

      .estado-chip {
        font-size: 0.8rem;
        padding: 6px 12px;
      }

      .info-stats {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class EstadoFiltersComponent implements OnInit {
  @Input() cursos: CursoOfertadoVerano[] = [];
  @Output() cursosFiltradosChange = new EventEmitter<CursoOfertadoVerano[]>();
  @Output() estadoSeleccionadoChange = new EventEmitter<string>();

  private destroy$ = new Subject<void>();
  
  estadosDisponibles: EstadoCurso[] = [];
  estadoSeleccionado: string = '';
  cursosFiltrados: CursoOfertadoVerano[] = [];
  conteosEstados: { [key: string]: number } = {};
  estadoInfo: EstadoCurso | undefined;
  cargandoFiltro: boolean = false;

  constructor(
    private cursoEstadosService: CursoEstadosService,
    private cursosService: CursosIntersemestralesService
  ) {}

  ngOnInit(): void {
    this.estadosDisponibles = this.cursoEstadosService.getEstadosDisponibles();
    this.calcularConteos();
    this.aplicarFiltro();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onEstadoChange(estado: string): void {
    console.log(`🔄 Cambiando filtro a estado: "${estado}"`);
    this.estadoSeleccionado = estado;
    this.estadoInfo = estado ? this.cursoEstadosService.getEstadoPorValor(estado) : undefined;
    this.cargandoFiltro = true;
    
    if (estado) {
      // Llamar al backend para obtener cursos específicos por estado
      this.cursosService.getCursosPorEstado(estado)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (cursos) => {
            console.log(`✅ Cursos obtenidos para estado "${estado}":`, cursos);
            this.cursosFiltrados = cursos;
            this.cursosFiltradosChange.emit(this.cursosFiltrados);
            this.cargandoFiltro = false;
          },
          error: (error) => {
            console.error(`❌ Error obteniendo cursos para estado "${estado}":`, error);
            // Fallback: filtrar localmente
            console.log(`🔄 Usando filtro local como fallback para "${estado}"`);
            this.aplicarFiltro();
            this.cargandoFiltro = false;
          }
        });
    } else {
      // Si no hay estado seleccionado, mostrar todos los cursos
      console.log(`🔄 Mostrando todos los cursos (sin filtro)`);
      this.aplicarFiltro();
      this.cargandoFiltro = false;
    }
    
    this.estadoSeleccionadoChange.emit(estado);
  }

  private aplicarFiltro(): void {
    if (!this.estadoSeleccionado) {
      this.cursosFiltrados = [...this.cursos];
    } else {
      this.cursosFiltrados = this.cursos.filter(curso => {
        const estadoActual = this.obtenerEstadoActualCurso(curso);
        return estadoActual === this.estadoSeleccionado;
      });
    }
    
    this.cursosFiltradosChange.emit(this.cursosFiltrados);
  }

  private calcularConteos(): void {
    this.conteosEstados = {};
    
    // Calcular conteos locales primero usando la nueva estructura de estados
    this.estadosDisponibles.forEach(estado => {
      this.conteosEstados[estado.value] = this.cursos.filter(curso => {
        const estadoActual = this.obtenerEstadoActualCurso(curso);
        return estadoActual === estado.value;
      }).length;
    });
    
    console.log('📊 Conteos locales calculados:', this.conteosEstados);
    
    // Actualizar conteos desde el backend para cada estado
    this.estadosDisponibles.forEach(estado => {
      this.cursosService.getCursosPorEstado(estado.value)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (cursos) => {
            this.conteosEstados[estado.value] = cursos.length;
            console.log(`📊 Conteo actualizado para "${estado.value}":`, cursos.length);
          },
          error: (error) => {
            console.warn(`⚠️ No se pudo obtener conteo para estado "${estado.value}":`, error);
            // Mantener el conteo local
          }
        });
    });
  }

  // Método para obtener el estado actual del curso (similar al del servicio)
  private obtenerEstadoActualCurso(curso: any): string {
    // Si hay estado_actual, usarlo
    if (curso.estado_actual) {
      return curso.estado_actual;
    }
    
    // Si hay estados y hay al menos uno, tomar el más reciente
    if (curso.estados && curso.estados.length > 0) {
      // Ordenar por fecha_registro_estado descendente y tomar el más reciente
      const estadoMasReciente = curso.estados
        .sort((a: any, b: any) => new Date(b.fecha_registro_estado).getTime() - new Date(a.fecha_registro_estado).getTime())[0];
      return estadoMasReciente.estado_actual;
    }
    
    // Fallback al campo estado legacy
    return curso.estado || 'Borrador';
  }

  // Método público para actualizar cursos desde el componente padre
  actualizarCursos(cursos: CursoOfertadoVerano[]): void {
    this.cursos = cursos;
    this.calcularConteos();
    this.aplicarFiltro();
  }

  // Método para limpiar filtros
  limpiarFiltros(): void {
    console.log('🧹 Limpiando filtros');
    this.estadoSeleccionado = '';
    this.estadoInfo = undefined;
    this.cargandoFiltro = false;
    this.aplicarFiltro();
    this.estadoSeleccionadoChange.emit('');
  }

  // Método para actualizar conteos cuando cambien los cursos
  actualizarConteos(): void {
    console.log('📊 Actualizando conteos...');
    this.calcularConteos();
  }
}
