import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { PublicarFechasEcaesComponent } from './publicar-fechas-ecaes.component';
import { FechaEcaes, PruebasEcaesService } from '@core/services/pruebas-ecaes.service';
import { PeriodosAcademicosService } from '@core/services/periodos-academicos.service';
import { SnackbarService } from '@core/services/snackbar.service';

const FECHAS: FechaEcaes = {
  idFechaEcaes: 5,
  periodoAcademico: '2026-1',
  inscripcion_est_by_facultad: '2026-03-01',
  registro_recaudo_ordinario: '2026-03-10',
  registro_recaudo_extraordinario: '2026-03-20',
  citacion: '2026-04-01',
  aplicacion: '2026-04-15',
  resultados_individuales: '2026-05-30',
};

describe('PublicarFechasEcaesComponent', () => {
  let fixture: ComponentFixture<PublicarFechasEcaesComponent>;
  let component: PublicarFechasEcaesComponent;
  let servicio: jasmine.SpyObj<PruebasEcaesService>;
  let periodos: jasmine.SpyObj<PeriodosAcademicosService>;
  let snackbar: jasmine.SpyObj<SnackbarService>;

  beforeEach(async () => {
    servicio = jasmine.createSpyObj<PruebasEcaesService>('PruebasEcaesService', [
      'buscarFechasPorPeriodo',
      'publicarFechasEcaes',
      'actualizarFechasEcaes',
    ]);
    servicio.buscarFechasPorPeriodo.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    servicio.publicarFechasEcaes.and.returnValue(of({ ...FECHAS, idFechaEcaes: 9 }));
    servicio.actualizarFechasEcaes.and.returnValue(of(FECHAS));
    periodos = jasmine.createSpyObj<PeriodosAcademicosService>('PeriodosAcademicosService', ['getValoresPeriodos']);
    periodos.getValoresPeriodos.and.returnValue(of(['2026-1', '2026-2']));
    snackbar = jasmine.createSpyObj<SnackbarService>('SnackbarService', ['exito', 'error', 'advertencia', 'info']);

    await TestBed.configureTestingModule({
      imports: [PublicarFechasEcaesComponent, NoopAnimationsModule],
      providers: [
        { provide: PruebasEcaesService, useValue: servicio },
        { provide: PeriodosAcademicosService, useValue: periodos },
        { provide: SnackbarService, useValue: snackbar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PublicarFechasEcaesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function llenarFechas(): void {
    component.form.patchValue({
      inscripcion_est_by_facultad: new Date(2026, 2, 1),
      registro_recaudo_ordinario: new Date(2026, 2, 10),
      registro_recaudo_extraordinario: new Date(2026, 2, 20),
      citacion: new Date(2026, 3, 1),
      aplicacion: new Date(2026, 3, 15),
      resultados_individuales: new Date(2026, 4, 30),
    });
  }

  it('carga los períodos y, si no llega ninguno, usa 2020-1 a 2030-2', () => {
    expect(component.periodos()).toEqual(['2026-1', '2026-2']);

    periodos.getValoresPeriodos.and.returnValue(of([]));
    const otro = TestBed.createComponent(PublicarFechasEcaesComponent);
    otro.detectChanges();
    expect(otro.componentInstance.periodos().length).toBe(22);
    expect(snackbar.advertencia).toHaveBeenCalled();
  });

  it('si el período ya tiene fechas las carga como días locales y pasa a edición', () => {
    servicio.buscarFechasPorPeriodo.and.returnValue(of(FECHAS));
    component.form.controls.periodoAcademico.setValue('2026-1');

    expect(component.esEdicion()).toBeTrue();
    const citacion = component.form.controls.citacion.value!;
    expect([citacion.getFullYear(), citacion.getMonth(), citacion.getDate()]).toEqual([2026, 3, 1]);
  });

  it('un 404 deja el formulario en modo publicar sin mostrar error', () => {
    component.form.controls.periodoAcademico.setValue('2026-2');
    expect(component.esEdicion()).toBeFalse();
    expect(snackbar.error).not.toHaveBeenCalled();
  });

  it('publica las fechas como YYYY-MM-DD y queda en edición con el id nuevo', () => {
    component.form.controls.periodoAcademico.setValue('2026-2');
    llenarFechas();

    component.publicar();

    expect(servicio.publicarFechasEcaes).toHaveBeenCalledWith(
      jasmine.objectContaining({
        periodoAcademico: '2026-2',
        inscripcion_est_by_facultad: '2026-03-01',
        resultados_individuales: '2026-05-30',
      })
    );
    expect(component.idFechaEcaes()).toBe(9);
    expect(component.form.controls.periodoAcademico.value).toBe('2026-2');
    expect(component.form.controls.citacion.value).toBeNull();
  });

  it('en edición actualiza con el id de las fechas', () => {
    servicio.buscarFechasPorPeriodo.and.returnValue(of(FECHAS));
    component.form.controls.periodoAcademico.setValue('2026-1');

    component.publicar();

    expect(servicio.actualizarFechasEcaes).toHaveBeenCalledWith(
      jasmine.objectContaining({ idFechaEcaes: 5, citacion: '2026-04-01' })
    );
    expect(servicio.publicarFechasEcaes).not.toHaveBeenCalled();
  });

  it('con campos vacíos no envía nada', () => {
    component.publicar();
    expect(servicio.publicarFechasEcaes).not.toHaveBeenCalled();
    expect(snackbar.advertencia).toHaveBeenCalled();
  });
});
