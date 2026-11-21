import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of } from 'rxjs';
import {
  PeriodoAcademico,
  PeriodoActivoConfig,
  PeriodosAcademicosService,
} from '@core/services/periodos-academicos.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { ConfigurarPeriodoComponent } from './configurar-periodo.component';

describe('ConfigurarPeriodoComponent', () => {
  let fixture: ComponentFixture<ConfigurarPeriodoComponent>;
  let component: ConfigurarPeriodoComponent;
  let servicio: jasmine.SpyObj<PeriodosAcademicosService>;
  let snackbar: jasmine.SpyObj<SnackbarService>;
  let periodoActual$: BehaviorSubject<PeriodoAcademico | null>;

  // Como lo arma el servicio a partir de /periodos-academicos/actual, que solo trae el valor (sin fechas).
  const periodo = (valor: string, nombre: string, fechas = { fechaInicio: '', fechaFin: '' }): PeriodoAcademico => ({
    valor,
    año: Number(valor.slice(0, 4)),
    numeroPeriodo: Number(valor.slice(5)),
    nombrePeriodo: nombre,
    ...fechas,
    activo: true,
    tipoPeriodo: 'ORDINARIO',
    esPeriodoEspecial: false,
    descripcion: '',
  });
  const actual = periodo('2026-2', '2026 - Segundo Semestre');
  const configManual: PeriodoActivoConfig = {
    periodoAcademico: '2026-1',
    modo: 'manual',
    descripcion: 'Período establecido manualmente',
  };

  beforeEach(() => {
    periodoActual$ = new BehaviorSubject<PeriodoAcademico | null>(actual);
    servicio = jasmine.createSpyObj<PeriodosAcademicosService>(
      'PeriodosAcademicosService',
      [
        'getPeriodoActivoConfig',
        'getPeriodoActualValue',
        'getPeriodoActual',
        'getPeriodosRecientes',
        'setPeriodoActivo',
      ],
      { periodoActual$: periodoActual$.asObservable() }
    );
    // El endpoint de admin no existe todavía en el backend: el servicio devuelve null
    servicio.getPeriodoActivoConfig.and.returnValue(of(null));
    servicio.getPeriodoActualValue.and.returnValue(actual);
    servicio.getPeriodoActual.and.returnValue(of(actual));
    servicio.getPeriodosRecientes.and.returnValue(of([actual, periodo('2026-1', '2026 - Primer Semestre')]));
    snackbar = jasmine.createSpyObj<SnackbarService>('SnackbarService', ['exito', 'error', 'advertencia']);

    TestBed.configureTestingModule({
      imports: [ConfigurarPeriodoComponent, NoopAnimationsModule],
      providers: [
        { provide: PeriodosAcademicosService, useValue: servicio },
        { provide: SnackbarService, useValue: snackbar },
      ],
    });
    fixture = TestBed.createComponent(ConfigurarPeriodoComponent);
    component = fixture.componentInstance;
  });

  const etiquetas = (): string[] =>
    [...fixture.nativeElement.querySelectorAll('.periodo-actual-info .label')].map((e: HTMLElement) =>
      e.textContent!.trim()
    );

  it('carga el período actual y los recientes, en modo automático si no hay configuración', () => {
    fixture.detectChanges();
    expect(component.periodoActual()).toEqual(actual);
    expect(component.periodosDisponibles().length).toBe(2);
    expect(component.configActual()).toBeNull();
    expect(component.configForm.value).toEqual({ modo: 'automatico', periodoSeleccionado: '' });
    expect(component.cargando()).toBeFalse();
  });

  it('rellena el formulario con la configuración guardada', () => {
    servicio.getPeriodoActivoConfig.and.returnValue(of(configManual));
    fixture.detectChanges();
    expect(component.configActual()).toEqual(configManual);
    expect(component.configForm.value).toEqual({ modo: 'manual', periodoSeleccionado: '2026-1' });
  });

  it('no muestra Fecha Inicio ni Fecha Fin si el período no trae fechas', () => {
    fixture.detectChanges();
    expect(etiquetas()).toEqual(['Período:', 'Valor:']);
  });

  it('muestra las fechas cuando el período las trae', () => {
    const conFecha = periodo('2026-2', '2026 - Segundo Semestre', { fechaInicio: '2026-07-01', fechaFin: '' });
    periodoActual$.next(conFecha);
    servicio.getPeriodoActualValue.and.returnValue(conFecha);
    fixture.detectChanges();
    expect(etiquetas()).toEqual(['Período:', 'Valor:', 'Fecha Inicio:']);
    expect(fixture.nativeElement.querySelector('.periodo-actual-info').textContent).toContain('01/07/2026');
  });

  it('pide un período en modo manual', () => {
    fixture.detectChanges();
    component.configForm.patchValue({ modo: 'manual', periodoSeleccionado: '' });
    component.guardarConfiguracion();
    expect(snackbar.advertencia).toHaveBeenCalled();
    expect(servicio.setPeriodoActivo).not.toHaveBeenCalled();
  });

  it('guarda el período manual y avisa del éxito', () => {
    servicio.setPeriodoActivo.and.returnValue(of(configManual));
    fixture.detectChanges();
    component.configForm.patchValue({ modo: 'manual', periodoSeleccionado: '2026-1' });
    component.guardarConfiguracion();
    expect(servicio.setPeriodoActivo).toHaveBeenCalledWith('2026-1');
    expect(component.configActual()).toEqual(configManual);
    expect(snackbar.exito).toHaveBeenCalledWith('Período 2026 - Primer Semestre establecido correctamente');
    expect(component.guardando()).toBeFalse();
  });

  it('en modo automático envía null', () => {
    servicio.setPeriodoActivo.and.returnValue(of({ periodoAcademico: null, modo: 'automatico', descripcion: '' }));
    fixture.detectChanges();
    component.guardarConfiguracion();
    expect(servicio.setPeriodoActivo).toHaveBeenCalledWith(null);
    expect(snackbar.exito).toHaveBeenCalledWith('Modo automático activado correctamente');
  });

  it('avisa del error si no se pudo guardar (el servicio devuelve null, p. ej. por un 404)', () => {
    servicio.setPeriodoActivo.and.returnValue(of(null));
    fixture.detectChanges();
    component.configForm.patchValue({ modo: 'manual', periodoSeleccionado: '2026-1' });
    component.guardarConfiguracion();
    expect(snackbar.error).toHaveBeenCalledWith('No se pudo guardar la configuración del período');
    expect(snackbar.exito).not.toHaveBeenCalled();
    expect(component.configActual()).toBeNull();
    expect(component.guardando()).toBeFalse();
  });
});
