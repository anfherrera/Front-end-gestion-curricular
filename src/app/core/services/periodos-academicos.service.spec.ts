import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PeriodosAcademicosService } from './periodos-academicos.service';
import { ApiEndpoints } from '../utils/api-endpoints';

describe('PeriodosAcademicosService', () => {
  let service: PeriodosAcademicosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PeriodosAcademicosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getTodosLosPeriodos convierte los períodos que llegan como texto', (done) => {
    service.getTodosLosPeriodos().subscribe(periodos => {
      expect(periodos.map(p => [p.valor, p.año, p.numeroPeriodo])).toEqual([['2025-2', 2025, 2]]);
      done();
    });
    httpMock.expectOne(ApiEndpoints.PERIODOS_ACADEMICOS.TODOS).flush({ success: true, data: ['2025-2'] });
  });

  it('getValoresPeriodos usa todos los períodos si hay', (done) => {
    service.getValoresPeriodos().subscribe(valores => {
      expect(valores).toEqual(['2025-1', '2024-2']);
      done();
    });
    httpMock.expectOne(ApiEndpoints.PERIODOS_ACADEMICOS.TODOS).flush({ success: true, data: ['2025-1', '2024-2'] });
  });

  it('getValoresPeriodos pasa a los recientes si /todos falla', (done) => {
    service.getValoresPeriodos().subscribe(valores => {
      expect(valores).toEqual(['2026-1']);
      done();
    });
    httpMock.expectOne(ApiEndpoints.PERIODOS_ACADEMICOS.TODOS).flush('error', { status: 500, statusText: 'Error' });
    httpMock.expectOne(ApiEndpoints.PERIODOS_ACADEMICOS.RECIENTES).flush({ success: true, data: ['2026-1'] });
  });

  it('getValoresPeriodos devuelve una lista vacía si fallan los dos', (done) => {
    service.getValoresPeriodos().subscribe(valores => {
      expect(valores).toEqual([]);
      done();
    });
    httpMock.expectOne(ApiEndpoints.PERIODOS_ACADEMICOS.TODOS).flush({ success: false });
    httpMock.expectOne(ApiEndpoints.PERIODOS_ACADEMICOS.RECIENTES).flush('error', { status: 500, statusText: 'Error' });
  });
});
