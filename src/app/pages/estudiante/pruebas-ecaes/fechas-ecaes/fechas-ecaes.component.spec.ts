import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { FechasEcaesComponent } from './fechas-ecaes.component';
import { FechaEcaes, PruebasEcaesService } from '@core/services/pruebas-ecaes.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { LoggerService } from '@core/services/logger.service';

describe('FechasEcaesComponent', () => {
  let component: FechasEcaesComponent;
  let fixture: ComponentFixture<FechasEcaesComponent>;
  let pruebasEcaesService: jasmine.SpyObj<PruebasEcaesService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockFechasEcaes: FechaEcaes[] = [
    {
      idFechaEcaes: 1,
      periodoAcademico: '2025-1',
      inscripcion_est_by_facultad: '2025-01-15',
      registro_recaudo_ordinario: '2025-02-01',
      registro_recaudo_extraordinario: '2025-02-15',
      citacion: '2025-03-01',
      aplicacion: '2025-03-15',
      resultados_individuales: '2025-04-01'
    },
    {
      idFechaEcaes: 2,
      periodoAcademico: '2025-2',
      inscripcion_est_by_facultad: '2025-08-15',
      registro_recaudo_ordinario: '2025-09-01',
      registro_recaudo_extraordinario: '2025-09-15',
      citacion: '2025-10-01',
      aplicacion: '2025-10-15',
      resultados_individuales: '2025-11-01'
    }
  ];

  beforeEach(async () => {
    pruebasEcaesService = jasmine.createSpyObj('PruebasEcaesService', ['listarFechasEcaes']);
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    const errorHandler = jasmine.createSpyObj('ErrorHandlerService', ['extraerMensajeError']);
    errorHandler.extraerMensajeError.and.returnValue('');
    pruebasEcaesService.listarFechasEcaes.and.returnValue(of(mockFechasEcaes));

    await TestBed.configureTestingModule({
      imports: [FechasEcaesComponent, NoopAnimationsModule],
      providers: [
        { provide: PruebasEcaesService, useValue: pruebasEcaesService },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: ErrorHandlerService, useValue: errorHandler },
        { provide: LoggerService, useValue: jasmine.createSpyObj('LoggerService', ['log', 'warn', 'error', 'debug']) }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FechasEcaesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('EC-017: Debe cargar fechas ECAES y seleccionar primer período', fakeAsync(() => {
    expect(pruebasEcaesService.listarFechasEcaes).toHaveBeenCalled();
    expect(component.fechasEcaes().length).toBe(2);
    expect(component.periodoSeleccionado()).toBe('2025-1');
    expect(component.fechasSeleccionadas()).toBeTruthy();
  }));

  it('EC-019: Debe formatear la fecha del calendario sin correrla de día', () => {
    component.fechasSeleccionadas.set({ ...mockFechasEcaes[0], inscripcion_est_by_facultad: '2025-01-15T00:00:00Z' });
    expect(component.getConceptoFecha('inscripcion_est_by_facultad')).toBe('15/01/2025');
  });

  it('EC-020: getConceptoFecha debe devolver fecha formateada cuando hay fechas seleccionadas', () => {
    component.fechasSeleccionadas.set(mockFechasEcaes[0]);
    const concepto = component.getConceptoFecha('inscripcion_est_by_facultad');
    expect(concepto).toBeTruthy();
  });

  it('EC-021: getConceptoFecha debe devolver vacío cuando no hay fechas seleccionadas', () => {
    component.fechasSeleccionadas.set(null);
    expect(component.getConceptoFecha('inscripcion_est_by_facultad')).toBe('');
  });

  it('EC-032: onPeriodoChange debe actualizar fechasSeleccionadas', () => {
    component.periodoSeleccionado.set('2025-2');
    component.onPeriodoChange();
    expect(component.fechasSeleccionadas()?.periodoAcademico).toBe('2025-2');
  });

  it('muestra la tabla con los 6 conceptos y, sin calendarios, el mensaje vacío', () => {
    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.querySelectorAll('.data-row').length).toBe(6);
    expect(elemento.querySelector('.fecha-cell')?.textContent?.trim()).toBe('15/01/2025');

    pruebasEcaesService.listarFechasEcaes.and.returnValue(of([]));
    fixture = TestBed.createComponent(FechasEcaesComponent);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.mensaje-vacio')).toBeTruthy();
  });

  it('avisa si no se pueden cargar las fechas', () => {
    pruebasEcaesService.listarFechasEcaes.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500 })));
    component.cargarFechasEcaes();
    expect(snackBar.open).toHaveBeenCalledWith('Error al cargar las fechas de ECAES', 'Cerrar', jasmine.any(Object));
  });
});
