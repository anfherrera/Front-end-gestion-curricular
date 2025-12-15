import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { HistorialSolicitudesService, HistorialResponse, FiltrosHistorial, TipoSolicitud } from '../../../core/services/historial-solicitudes.service';
import { PeriodoFiltroSelectorComponent } from '../../../shared/components/periodo-filtro-selector/periodo-filtro-selector.component';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { UtfFixPipe } from '../../../shared/pipes/utf-fix.pipe';

@Component({
  selector: 'app-historial-completo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatChipsModule,
    PeriodoFiltroSelectorComponent,
    CardContainerComponent,
    UtfFixPipe
  ],
  templateUrl: './historial-completo.component.html',
  styleUrls: ['./historial-completo.component.css']
})
export class HistorialCompletoComponent implements OnInit, OnDestroy {
  filtrosForm: FormGroup;
  historial: HistorialResponse | null = null;
  loading = false;
  displayedColumns: string[] = [
    'id_solicitud',
    'nombre_solicitud',
    'tipo_solicitud',
    'usuario',
    'periodo_academico',
    'estado_actual',
    'fecha_registro'
  ];

  tiposSolicitud: Array<{ codigo: string; display: string }> = [];
  estadosDisponibles: string[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private historialService: HistorialSolicitudesService,
    private snackBar: MatSnackBar
  ) {
    this.filtrosForm = this.fb.group({
      periodoAcademico: [''],
      tipoSolicitud: [''],
      estadoActual: ['']
    });

    this.tiposSolicitud = this.historialService.getTiposSolicitud();
    this.estadosDisponibles = this.historialService.getEstadosDisponibles();
  }

  ngOnInit(): void {
    this.cargarHistorial();

    // Suscribirse a cambios en los filtros con debounce
    this.filtrosForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.cargarHistorial();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarHistorial(): void {
    this.loading = true;
    const filtros: FiltrosHistorial = {};

    const formValue = this.filtrosForm.value;
    if (formValue.periodoAcademico) {
      filtros.periodoAcademico = formValue.periodoAcademico;
    }
    if (formValue.tipoSolicitud) {
      filtros.tipoSolicitud = formValue.tipoSolicitud;
    }
    if (formValue.estadoActual) {
      filtros.estadoActual = formValue.estadoActual;
    }

    this.historialService.obtenerHistorialCompleto(filtros).subscribe({
      next: (response) => {
        this.historial = response;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar historial:', error);
        this.snackBar.open('Error al cargar el historial de solicitudes', 'Cerrar', {
          duration: 3000
        });
        this.loading = false;
      }
    });
  }

  limpiarFiltros(): void {
    this.filtrosForm.reset({
      periodoAcademico: '',
      tipoSolicitud: '',
      estadoActual: ''
    });
  }

  onPeriodoChange(periodo: string): void {
    this.filtrosForm.patchValue({ periodoAcademico: periodo || '' });
  }

  getEstadoClass(estado: string): string {
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('aprobada')) {
      return 'estado-aprobada';
    } else if (estadoLower.includes('rechazada')) {
      return 'estado-rechazada';
    } else if (estadoLower.includes('enviada')) {
      return 'estado-enviada';
    } else if (estadoLower.includes('proceso')) {
      return 'estado-proceso';
    }
    return 'estado-default';
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
}


