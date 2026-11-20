import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PeriodoAcademico, PeriodoActivoConfig, PeriodosAcademicosService } from './periodos-academicos.service';
import { ApiEndpoints } from '../utils/api-endpoints';

describe('PeriodosAcademicosService', () => {
  let service: PeriodosAcademicosService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PeriodosAcademicosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getTodosLosPeriodos convierte los períodos que llegan como texto', (done) => {
    service.getTodosLosPeriodos().subscribe((periodos) => {
      expect(periodos.map((p) => [p.valor, p.año, p.numeroPeriodo])).toEqual([['2025-2', 2025, 2]]);
      done();
    });
    httpMock.expectOne(ApiEndpoints.PERIODOS_ACADEMICOS.TODOS).flush({ success: true, data: ['2025-2'] });
  });

  it('getValoresPeriodos usa todos los períodos si hay', (done) => {
    service.getValoresPeriodos().subscribe((valores) => {
      expect(valores).toEqual(['2025-1', '2024-2']);
      done();
    });
    httpMock.expectOne(ApiEndpoints.PERIODOS_ACADEMICOS.TODOS).flush({ success: true, data: ['2025-1', '2024-2'] });
  });

  it('getValoresPeriodos pasa a los recientes si /todos falla', (done) => {
    service.getValoresPeriodos().subscribe((valores) => {
      expect(valores).toEqual(['2026-1']);
      done();
    });
    httpMock.expectOne(ApiEndpoints.PERIODOS_ACADEMICOS.TODOS).flush('error', { status: 500, statusText: 'Error' });
    httpMock.expectOne(ApiEndpoints.PERIODOS_ACADEMICOS.RECIENTES).flush({ success: true, data: ['2026-1'] });
  });

  it('getValoresPeriodos devuelve una lista vacía si fallan los dos', (done) => {
    service.getValoresPeriodos().subscribe((valores) => {
      expect(valores).toEqual([]);
      done();
    });
    httpMock.expectOne(ApiEndpoints.PERIODOS_ACADEMICOS.TODOS).flush({ success: false });
    httpMock.expectOne(ApiEndpoints.PERIODOS_ACADEMICOS.RECIENTES).flush('error', { status: 500, statusText: 'Error' });
  });

  describe('período actual', () => {
    const actual = () => httpMock.expectOne(ApiEndpoints.PERIODOS_ACADEMICOS.ACTUAL);

    it('convierte el texto del backend en un período y lo publica', () => {
      let periodo: PeriodoAcademico | null | undefined;
      service.getPeriodoActual().subscribe((p) => (periodo = p));
      actual().flush({ success: true, data: '2026-2', message: 'Período actual obtenido exitosamente' });

      expect(periodo).toEqual(
        jasmine.objectContaining({
          valor: '2026-2',
          año: 2026,
          numeroPeriodo: 2,
          nombrePeriodo: '2026 - Segundo Semestre',
          activo: true,
        })
      );
      expect(service.getPeriodoActualValue()).toEqual(periodo ?? null);
    });

    it('avisa del cambio de período cuando llega uno distinto', () => {
      const cambios: unknown[] = [];
      service.cambioPeriodo$.subscribe((c) => cambios.push(c));

      service.getPeriodoActual().subscribe();
      actual().flush({ success: true, data: '2026-1', message: '' });
      // El mismo período no es un cambio.
      service.getPeriodoActual().subscribe();
      actual().flush({ success: true, data: '2026-1', message: '' });
      expect(cambios.filter(Boolean).length).toBe(0);

      service.getPeriodoActual().subscribe();
      actual().flush({ success: true, data: '2026-2', message: '' });
      const ultimos = cambios.filter(Boolean) as { anterior: PeriodoAcademico; actual: PeriodoAcademico }[];
      expect(ultimos.length).toBeGreaterThan(0);
      expect(ultimos.every((c) => c.anterior.valor === '2026-1' && c.actual.valor === '2026-2')).toBeTrue();
    });

    it('sin período conocido (data null) o con error queda en null', () => {
      service.getPeriodoActual().subscribe();
      actual().flush({ success: true, data: '2026-2', message: '' });

      let periodo: PeriodoAcademico | null | undefined;
      service.getPeriodoActual().subscribe((p) => (periodo = p));
      actual().flush({ success: true, data: null, message: 'No se pudo determinar el período actual' });
      expect(periodo).toBeNull();
      expect(service.getPeriodoActualValue()).toBeNull();

      service.getPeriodoActual().subscribe((p) => (periodo = p));
      actual().flush('Forbidden', { status: 403, statusText: 'Forbidden' });
      expect(periodo).toBeNull();
    });

    it('inicializarPeriodoActual lo pide al backend', () => {
      service.inicializarPeriodoActual();
      actual().flush({ success: true, data: '2026-2', message: '' });
      expect(service.getPeriodoActualValue()?.valor).toBe('2026-2');
    });
  });

  it('getPeriodosRecientes acepta objetos y da lista vacía si success es false', () => {
    const objeto: PeriodoAcademico = {
      valor: '2025-1',
      año: 2025,
      numeroPeriodo: 1,
      nombrePeriodo: '2025 - Primer Semestre',
      fechaInicio: '',
      fechaFin: '',
      activo: true,
      tipoPeriodo: 'ORDINARIO',
      esPeriodoEspecial: false,
      descripcion: '',
    };
    let periodos: PeriodoAcademico[] = [];
    service.getPeriodosRecientes().subscribe((p) => (periodos = p));
    httpMock.expectOne(ApiEndpoints.PERIODOS_ACADEMICOS.RECIENTES).flush({ success: true, data: [objeto, '2024-2'] });
    expect(periodos[0]).toBe(objeto);
    expect(periodos[1].nombrePeriodo).toBe('2024 - Segundo Semestre');

    service.getPeriodosRecientes().subscribe((p) => (periodos = p));
    httpMock.expectOne(ApiEndpoints.PERIODOS_ACADEMICOS.RECIENTES).flush({ success: false, data: null });
    expect(periodos).toEqual([]);
  });

  describe('período activo (admin)', () => {
    const url = ApiEndpoints.PERIODOS_ACADEMICOS.ADMIN.PERIODO_ACTIVO;
    const config: PeriodoActivoConfig = { periodoAcademico: '2026-1', modo: 'manual', descripcion: 'Manual' };

    it('lee la configuración, o null si falla o no hay éxito', () => {
      let leida: PeriodoActivoConfig | null | undefined;
      service.getPeriodoActivoConfig().subscribe((c) => (leida = c));
      httpMock.expectOne(url).flush({ success: true, data: config, message: '' });
      expect(leida).toEqual(config);

      service.getPeriodoActivoConfig().subscribe((c) => (leida = c));
      httpMock.expectOne(url).flush({ success: false, data: config, message: '' });
      expect(leida).toBeNull();

      service.getPeriodoActivoConfig().subscribe((c) => (leida = c));
      httpMock.expectOne(url).flush('No encontrado', { status: 404, statusText: 'Not Found' });
      expect(leida).toBeNull();
    });

    it('al fijar el período (o volver a automático) recarga el período actual', () => {
      for (const valor of ['2026-1', null]) {
        let guardada: PeriodoActivoConfig | null | undefined;
        service.setPeriodoActivo(valor).subscribe((c) => (guardada = c));
        const put = httpMock.expectOne(url);
        expect(put.request.method).toBe('PUT');
        expect(put.request.body).toEqual({ periodoAcademico: valor });
        put.flush({ success: true, data: config, message: '' });
        expect(guardada).toEqual(config);
        httpMock
          .expectOne(ApiEndpoints.PERIODOS_ACADEMICOS.ACTUAL)
          .flush({ success: true, data: '2026-1', message: '' });
      }
    });

    it('si el backend no lo acepta devuelve null sin recargar', () => {
      let guardada: PeriodoActivoConfig | null | undefined;
      service.setPeriodoActivo('2026-1').subscribe((c) => (guardada = c));
      httpMock.expectOne(url).flush({ success: false, data: null, message: 'Error' });
      expect(guardada).toBeNull();

      service.setPeriodoActivo('2026-1').subscribe((c) => (guardada = c));
      httpMock.expectOne(url).flush('Error', { status: 500, statusText: 'Error' });
      expect(guardada).toBeNull();
      httpMock.expectNone(ApiEndpoints.PERIODOS_ACADEMICOS.ACTUAL);
    });
  });
});
