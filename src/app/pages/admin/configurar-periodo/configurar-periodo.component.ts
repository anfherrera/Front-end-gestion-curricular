import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PeriodosAcademicosService, PeriodoAcademico, PeriodoActivoConfig } from '../../../core/services/periodos-academicos.service';
import { formatearPeriodo } from '../../../core/utils/periodo.utils';
import { SnackbarService } from '../../../core/services/snackbar.service';

@Component({
  selector: 'app-configurar-periodo',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './configurar-periodo.component.html',
  styleUrls: ['./configurar-periodo.component.css']
})
export class ConfigurarPeriodoComponent implements OnInit {
  configForm: FormGroup;
  periodosDisponibles: PeriodoAcademico[] = [];
  configActual: PeriodoActivoConfig | null = null;
  periodoActual: PeriodoAcademico | null = null;
  cargando = false;
  guardando = false;

  constructor(
    private fb: FormBuilder,
    private periodosService: PeriodosAcademicosService,
    private snackbar: SnackbarService
  ) {
    this.configForm = this.fb.group({
      modo: ['automatico', Validators.required],
      periodoSeleccionado: ['']
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
    
    // Suscribirse a cambios en el modo
    this.configForm.get('modo')?.valueChanges.subscribe(modo => {
      if (modo === 'automatico') {
        this.configForm.get('periodoSeleccionado')?.clearValidators();
      } else {
        this.configForm.get('periodoSeleccionado')?.setValidators([Validators.required]);
      }
      this.configForm.get('periodoSeleccionado')?.updateValueAndValidity();
    });
  }

  cargarDatos(): void {
    this.cargando = true;

    // Cargar configuración actual
    this.periodosService.getPeriodoActivoConfig().subscribe({
      next: (config) => {
        this.configActual = config;
        if (config) {
          this.configForm.patchValue({
            modo: config.modo,
            periodoSeleccionado: config.periodoAcademico || ''
          });
        }
      },
      error: () => {
        this.snackbar.error('Error al cargar la configuración actual');
      }
    });

    // Cargar período actual
    this.periodosService.periodoActual$.subscribe(periodo => {
      this.periodoActual = periodo;
    });

    if (!this.periodosService.getPeriodoActualValue()) {
      this.periodosService.getPeriodoActual().subscribe();
    } else {
      this.periodoActual = this.periodosService.getPeriodoActualValue();
    }

    // Cargar períodos disponibles
    this.periodosService.getPeriodosRecientes().subscribe({
      next: (periodos) => {
        this.periodosDisponibles = periodos;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.snackbar.error('Error al cargar los períodos disponibles');
      }
    });
  }

  guardarConfiguracion(): void {
    if (this.configForm.invalid) {
      this.snackbar.advertencia('Por favor, completa todos los campos requeridos');
      return;
    }

    this.guardando = true;
    const modo = this.configForm.get('modo')?.value;
    const periodoSeleccionado = modo === 'manual' 
      ? this.configForm.get('periodoSeleccionado')?.value 
      : null;

    this.periodosService.setPeriodoActivo(periodoSeleccionado).subscribe({
      next: (config) => {
        if (config) {
          this.configActual = config;
          this.snackbar.exito(modo === 'automatico' 
              ? 'Modo automático activado correctamente' 
              : `Período ${formatearPeriodo(periodoSeleccionado)} establecido correctamente`);
          // Recargar período actual
          this.periodosService.getPeriodoActual().subscribe();
        }
        this.guardando = false;
      },
      error: () => {
        this.snackbar.error('Error al guardar la configuración');
        this.guardando = false;
      }
    });
  }

  formatearPeriodo(periodo: string): string {
    return formatearPeriodo(periodo);
  }

  getPeriodoDisplay(periodo: PeriodoAcademico): string {
    return periodo.nombrePeriodo || formatearPeriodo(periodo.valor);
  }
}

