import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PeriodosAcademicosService, PeriodoAcademico, PeriodoActivoConfig } from '../../../core/services/periodos-academicos.service';
import { formatearPeriodo } from '../../../core/utils/periodo.utils';

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
    MatSnackBarModule,
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
    private snackBar: MatSnackBar
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
      error: (error) => {
        this.snackBar.open('Error al cargar la configuración actual', 'Cerrar', {
          duration: 3000
        });
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
      error: (error) => {
        this.cargando = false;
        this.snackBar.open('Error al cargar los períodos disponibles', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  guardarConfiguracion(): void {
    if (this.configForm.invalid) {
      this.snackBar.open('Por favor, completa todos los campos requeridos', 'Cerrar', {
        duration: 3000
      });
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
          this.snackBar.open(
            modo === 'automatico' 
              ? 'Modo automático activado correctamente' 
              : `Período ${formatearPeriodo(periodoSeleccionado)} establecido correctamente`,
            'Cerrar',
            { duration: 5000 }
          );
          // Recargar período actual
          this.periodosService.getPeriodoActual().subscribe();
        }
        this.guardando = false;
      },
      error: (error) => {
        this.snackBar.open('Error al guardar la configuración', 'Cerrar', {
          duration: 3000
        });
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

