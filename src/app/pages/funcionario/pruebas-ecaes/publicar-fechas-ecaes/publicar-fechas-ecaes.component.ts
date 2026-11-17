import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { FechaEcaes, PruebasEcaesService } from '@core/services/pruebas-ecaes.service';
import { PeriodosAcademicosService } from '@core/services/periodos-academicos.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { CardContainerComponent } from '@shared/components/card-container/card-container.component';

type CampoFecha = Exclude<keyof FechaEcaes, 'idFechaEcaes' | 'periodoAcademico'>;

/** Fechas del calendario ECAES, en el orden en que se muestran. */
export const CAMPOS_FECHA: { campo: CampoFecha; etiqueta: string }[] = [
  { campo: 'inscripcion_est_by_facultad', etiqueta: 'Inscripción de estudiantes por parte de la Facultad' },
  { campo: 'registro_recaudo_ordinario', etiqueta: 'Registro y recaudo ordinario' },
  { campo: 'registro_recaudo_extraordinario', etiqueta: 'Registro y recaudo extraordinario' },
  { campo: 'citacion', etiqueta: 'Citación' },
  { campo: 'aplicacion', etiqueta: 'Aplicación' },
  { campo: 'resultados_individuales', etiqueta: 'Resultados individuales' }
];

/** "2026-03-15" como día local (new Date() la tomaría en UTC y en Colombia saldría el 14). */
function aFecha(valor: string | null): Date | null {
  if (!valor) return null;
  const [anio, mes, dia] = valor.split('-').map(Number);
  return dia ? new Date(anio, mes - 1, dia) : new Date(valor);
}

/** Fecha local como "YYYY-MM-DD", sin pasar por UTC. */
function aTexto(fecha: Date | null): string {
  if (!fecha) return '';
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/**
 * Funcionario: publica las fechas ECAES de un período o, si ya existen, las edita.
 * Al elegir el período se buscan sus fechas; un 404 quiere decir que aún no hay.
 */
@Component({
  selector: 'app-publicar-fechas-ecaes',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatSelectModule,
    CardContainerComponent
  ],
  templateUrl: './publicar-fechas-ecaes.component.html',
  styleUrl: './publicar-fechas-ecaes.component.css'
})
export class PublicarFechasEcaesComponent implements OnInit {
  private readonly ecaesService = inject(PruebasEcaesService);
  private readonly periodosService = inject(PeriodosAcademicosService);
  private readonly snackbar = inject(SnackbarService);
  private readonly errorHandler = inject(ErrorHandlerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly campos = CAMPOS_FECHA;

  readonly form = inject(FormBuilder).group({
    periodoAcademico: ['', Validators.required],
    inscripcion_est_by_facultad: [null as Date | null, Validators.required],
    registro_recaudo_ordinario: [null as Date | null, Validators.required],
    registro_recaudo_extraordinario: [null as Date | null, Validators.required],
    citacion: [null as Date | null, Validators.required],
    aplicacion: [null as Date | null, Validators.required],
    resultados_individuales: [null as Date | null, Validators.required]
  });

  periodos: string[] = [];
  publicando = false;
  /** Id de las fechas del período elegido, si ya existen (modo edición). */
  idFechaEcaes: number | null = null;

  get esEdicion(): boolean {
    return this.idFechaEcaes !== null;
  }

  ngOnInit(): void {
    this.cargarPeriodos();
    this.form.controls.periodoAcademico.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(periodo => {
      this.idFechaEcaes = null;
      this.limpiarFechas();
      if (periodo) this.buscarFechas(periodo);
    });
  }

  /** Todos los períodos o, si no hay, los recientes; si fallan los dos, 2020-1 a 2030-2. */
  private cargarPeriodos(): void {
    this.periodosService.getValoresPeriodos().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(periodos => {
      if (periodos.length > 0) {
        this.periodos = periodos;
        return;
      }
      this.periodos = [];
      for (let anio = 2020; anio <= 2030; anio++) this.periodos.push(`${anio}-1`, `${anio}-2`);
      this.snackbar.advertencia('Usando períodos predeterminados (2020-2030). Verifique la conexión con el backend.');
    });
  }

  private buscarFechas(periodo: string): void {
    this.ecaesService.buscarFechasPorPeriodo(periodo).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (fechas) => {
        if (this.form.controls.periodoAcademico.value !== periodo) return;
        this.idFechaEcaes = fechas.idFechaEcaes;
        this.form.patchValue(Object.fromEntries(this.campos.map(({ campo }) => [campo, aFecha(fechas[campo])])));
        this.snackbar.exito('Fechas existentes cargadas. Puede editarlas.');
      },
      error: (err: HttpErrorResponse) => {
        // 404: el período aún no tiene fechas, se publican nuevas
        if (err.status !== 404) this.mostrarError(err, 'Error al buscar fechas existentes');
      }
    });
  }

  publicar(): void {
    if (this.form.invalid) {
      this.snackbar.advertencia('Por favor complete todos los campos requeridos');
      return;
    }
    const valor = this.form.getRawValue();
    const fechas = {
      periodoAcademico: valor.periodoAcademico ?? '',
      ...Object.fromEntries(this.campos.map(({ campo }) => [campo, aTexto(valor[campo])]))
    } as Omit<FechaEcaes, 'idFechaEcaes'>;
    const editar = this.esEdicion;
    const accion = editar ? 'actualizadas' : 'publicadas';

    this.publicando = true;
    const peticion$ = editar
      ? this.ecaesService.actualizarFechasEcaes({ ...fechas, idFechaEcaes: this.idFechaEcaes! })
      : this.ecaesService.publicarFechasEcaes(fechas);

    peticion$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (respuesta) => {
        this.publicando = false;
        if (respuesta.idFechaEcaes) this.idFechaEcaes = respuesta.idFechaEcaes;
        this.snackbar.exito(`Fechas ${accion} exitosamente`);
        this.limpiarFechas();
      },
      error: (err) => {
        this.publicando = false;
        this.mostrarError(err, `Error al ${editar ? 'actualizar' : 'publicar'} las fechas`);
      }
    });
  }

  esCampoInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  /** Vacía las fechas y deja el período elegido. */
  private limpiarFechas(): void {
    this.form.patchValue(Object.fromEntries(this.campos.map(({ campo }) => [campo, null])), { emitEvent: false });
  }

  private mostrarError(err: unknown, porDefecto: string): void {
    this.snackbar.error(this.errorHandler.extraerMensajeError(err) || porDefecto);
  }
}
