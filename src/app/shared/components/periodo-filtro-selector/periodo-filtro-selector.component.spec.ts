import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { PeriodoFiltroSelectorComponent } from './periodo-filtro-selector.component';
import { PeriodosAcademicosService } from '@core/services/periodos-academicos.service';
import { CursosIntersemestralesService } from '@core/services/cursos-intersemestrales.service';

describe('PeriodoFiltroSelectorComponent', () => {
  let fixture: ComponentFixture<PeriodoFiltroSelectorComponent>;
  let component: PeriodoFiltroSelectorComponent;
  let periodos: jasmine.SpyObj<PeriodosAcademicosService>;
  let cursos: jasmine.SpyObj<CursosIntersemestralesService>;

  beforeEach(async () => {
    periodos = jasmine.createSpyObj('PeriodosAcademicosService',
      ['getPeriodoActualValue', 'getPeriodoActual', 'getPeriodosRecientes'],
      { periodoActual$: new BehaviorSubject(null) });
    periodos.getPeriodoActualValue.and.returnValue(null);
    periodos.getPeriodoActual.and.returnValue(of(null));
    periodos.getPeriodosRecientes.and.returnValue(of([{ valor: '2025-2', nombrePeriodo: 'Segundo 2025' } as any]));
    cursos = jasmine.createSpyObj('CursosIntersemestralesService', ['getPeriodosRegistrados', 'getPeriodosAcademicos']);

    await TestBed.configureTestingModule({
      imports: [PeriodoFiltroSelectorComponent, NoopAnimationsModule],
      providers: [
        { provide: PeriodosAcademicosService, useValue: periodos },
        { provide: CursosIntersemestralesService, useValue: cursos }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PeriodoFiltroSelectorComponent);
    component = fixture.componentInstance;
  });

  it('por defecto arranca en "todos" y lista los períodos recientes', () => {
    fixture.detectChanges();
    expect(component.periodoSeleccionado).toBe('todos');
    expect(component.opciones).toEqual([{ valor: '2025-2', texto: 'Segundo 2025' }]);
    expect(cursos.getPeriodosRegistrados).not.toHaveBeenCalled();
  });

  it('respeta periodoInicial vacío (período actual)', () => {
    component.periodoInicial = '';
    fixture.detectChanges();
    expect(component.periodoSeleccionado).toBe('');
  });

  it('con fuente "con-cursos" usa los períodos registrados y, si fallan, todos', () => {
    cursos.getPeriodosRegistrados.and.returnValue(throwError(() => new Error('500')));
    cursos.getPeriodosAcademicos.and.returnValue(of(['2024-1']));
    component.fuente = 'con-cursos';
    fixture.detectChanges();
    expect(cursos.getPeriodosAcademicos).toHaveBeenCalled();
    expect(component.opciones.map(o => o.valor)).toEqual(['2024-1']);
    expect(periodos.getPeriodosRecientes).not.toHaveBeenCalled();
  });

  it('emite el período elegido', () => {
    fixture.detectChanges();
    const emitidos: string[] = [];
    component.periodoChange.subscribe(p => emitidos.push(p));
    component.onPeriodoChange('2025-2');
    expect(emitidos).toEqual(['2025-2']);
    expect(component.getPeriodoTexto('2025-2')).toBe('Segundo 2025');
  });
});
