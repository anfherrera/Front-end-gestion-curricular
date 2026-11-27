import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { FechaEcaes, PruebasEcaesService } from '@features/pruebas-ecaes/services/pruebas-ecaes.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { LoggerService } from '@core/services/logger.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { formatearFecha } from '@core/utils/fecha.util';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';

/** Tarjeta "Fechas" de ECAES: el calendario que publicó el funcionario, por período. */
@Component({
  selector: 'app-fechas-ecaes',
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatTableModule, CardContainerComponent],
  templateUrl: './fechas-ecaes.component.html',
  styleUrls: ['../ecaes-formularios.css', './fechas-ecaes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FechasEcaesComponent implements OnInit {
  private pruebasEcaesService = inject(PruebasEcaesService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private logger = inject(LoggerService);
  private destroyRef = inject(DestroyRef);

  readonly fechasEcaes = signal<FechaEcaes[]>([]);
  readonly fechasSeleccionadas = signal<FechaEcaes | null>(null);
  readonly periodoSeleccionado = signal('');

  readonly displayedColumns = ['concepto', 'fecha'];
  readonly conceptosFechas: { concepto: string; campo: keyof FechaEcaes }[] = [
    { concepto: 'Inscripción de estudiantes por parte de la Facultad', campo: 'inscripcion_est_by_facultad' },
    { concepto: 'Registro y recaudo ordinario', campo: 'registro_recaudo_ordinario' },
    { concepto: 'Registro y recaudo extraordinario', campo: 'registro_recaudo_extraordinario' },
    { concepto: 'Citación', campo: 'citacion' },
    { concepto: 'Aplicación', campo: 'aplicacion' },
    { concepto: 'Resultados individuales', campo: 'resultados_individuales' },
  ];

  ngOnInit(): void {
    this.cargarFechasEcaes();
  }

  /** Carga los calendarios y deja elegido el primer período. */
  cargarFechasEcaes(): void {
    this.pruebasEcaesService
      .listarFechasEcaes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fechas) => {
          this.fechasEcaes.set(fechas);
          if (fechas.length > 0) {
            this.periodoSeleccionado.set(fechas[0].periodoAcademico);
            this.fechasSeleccionadas.set(fechas[0]);
          }
        },
        error: (error) => {
          this.logger.error('Error al cargar fechas ECAES:', error);
          this.snackbar.error(this.errorHandler.extraerMensajeError(error) || 'Error al cargar las fechas de ECAES');
        },
      });
  }

  onPeriodoChange(): void {
    this.fechasSeleccionadas.set(
      this.fechasEcaes().find((fecha) => fecha.periodoAcademico === this.periodoSeleccionado()) || null
    );
  }

  /** Fecha del calendario ECAES (dd/mm/aaaa). Solo cuenta el día: se descarta la hora, si viene. */
  getConceptoFecha(campo: string): string {
    const fechas = this.fechasSeleccionadas();
    if (!fechas) return '';
    const valor = fechas[campo as keyof FechaEcaes] as string | undefined;
    return formatearFecha(valor?.split('T')[0]);
  }
}
