import { ChangeDetectionStrategy, Component, OnInit, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  PeriodosAcademicosService,
  PeriodoAcademico,
  PeriodoActivoConfig,
} from '@core/services/periodos-academicos.service';
import { formatearPeriodo } from '@core/utils/periodo.utils';
import { SnackbarService } from '@core/services/snackbar.service';

@Component({
  selector: 'app-configurar-periodo',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './configurar-periodo.component.html',
  styleUrls: ['./configurar-periodo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigurarPeriodoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private periodosService = inject(PeriodosAcademicosService);
  private snackbar = inject(SnackbarService);
  private readonly destroyRef = inject(DestroyRef);

  configForm: FormGroup;
  readonly periodosDisponibles = signal<PeriodoAcademico[]>([]);
  readonly configActual = signal<PeriodoActivoConfig | null>(null);
  readonly periodoActual = signal<PeriodoAcademico | null>(null);
  readonly cargando = signal(false);
  readonly guardando = signal(false);

  constructor() {
    this.configForm = this.fb.group({
      modo: ['automatico', Validators.required],
      periodoSeleccionado: [''],
    });
  }

  ngOnInit(): void {
    // Período actual: el servicio lo emite cada vez que cambia
    this.periodosService.periodoActual$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((periodo) => {
      this.periodoActual.set(periodo);
    });

    this.cargarDatos();

    // Suscribirse a cambios en el modo
    this.configForm
      .get('modo')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((modo) => {
        if (modo === 'automatico') {
          this.configForm.get('periodoSeleccionado')?.clearValidators();
        } else {
          this.configForm.get('periodoSeleccionado')?.setValidators([Validators.required]);
        }
        this.configForm.get('periodoSeleccionado')?.updateValueAndValidity();
      });
  }

  cargarDatos(): void {
    this.cargando.set(true);

    // Cargar configuración actual
    this.periodosService.getPeriodoActivoConfig().subscribe({
      next: (config) => {
        this.configActual.set(config);
        if (config) {
          this.configForm.patchValue({
            modo: config.modo,
            periodoSeleccionado: config.periodoAcademico || '',
          });
        }
      },
      error: () => {
        this.snackbar.error('Error al cargar la configuración actual');
      },
    });

    // Cargar período actual
    if (!this.periodosService.getPeriodoActualValue()) {
      this.periodosService.getPeriodoActual().subscribe();
    } else {
      this.periodoActual.set(this.periodosService.getPeriodoActualValue());
    }

    // Cargar períodos disponibles
    this.periodosService.getPeriodosRecientes().subscribe({
      next: (periodos) => {
        this.periodosDisponibles.set(periodos);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.snackbar.error('Error al cargar los períodos disponibles');
      },
    });
  }

  guardarConfiguracion(): void {
    if (this.configForm.invalid) {
      this.snackbar.advertencia('Por favor, completa todos los campos requeridos');
      return;
    }

    this.guardando.set(true);
    const modo = this.configForm.get('modo')?.value;
    const periodoSeleccionado = modo === 'manual' ? this.configForm.get('periodoSeleccionado')?.value : null;

    this.periodosService.setPeriodoActivo(periodoSeleccionado).subscribe({
      next: (config) => {
        if (config) {
          this.configActual.set(config);
          this.snackbar.exito(
            modo === 'automatico'
              ? 'Modo automático activado correctamente'
              : `Período ${formatearPeriodo(periodoSeleccionado)} establecido correctamente`
          );
          // Recargar período actual
          this.periodosService.getPeriodoActual().subscribe();
        }
        this.guardando.set(false);
      },
      error: () => {
        this.snackbar.error('Error al guardar la configuración');
        this.guardando.set(false);
      },
    });
  }

  formatearPeriodo(periodo: string): string {
    return formatearPeriodo(periodo);
  }

  getPeriodoDisplay(periodo: PeriodoAcademico): string {
    return periodo.nombrePeriodo || formatearPeriodo(periodo.valor);
  }
}
