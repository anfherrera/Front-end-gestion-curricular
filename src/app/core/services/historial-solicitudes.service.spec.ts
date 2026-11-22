import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { HistorialSolicitudesService } from './historial-solicitudes.service';

describe('HistorialSolicitudesService (rutas de EST-7, paso 5)', () => {
  let service: HistorialSolicitudesService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/solicitudes/historial`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(HistorialSolicitudesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('pide el historial en JSON sin formato', () => {
    service.obtenerHistorialCompleto({ periodoAcademico: '2025-1' }).subscribe();
    const req = httpMock.expectOne((r) => r.url === base);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('periodoAcademico')).toBe('2025-1');
    expect(req.request.params.has('formato')).toBeFalse();
    req.flush({ solicitudes: [], total: 0 });
  });

  it('exporta el PDF con formato=pdf y los filtros, aunque no haya filtros', () => {
    service.exportarHistorialPDF().subscribe();
    const sinFiltros = httpMock.expectOne((r) => r.url === base);
    expect(sinFiltros.request.method).toBe('GET');
    expect(sinFiltros.request.urlWithParams).toBe(`${base}?formato=pdf`);
    expect(sinFiltros.request.responseType).toBe('blob');
    sinFiltros.flush(new Blob());

    service.exportarHistorialPDF({ estadoActual: 'APROBADA' }).subscribe();
    const conFiltro = httpMock.expectOne((r) => r.url === base);
    expect(conFiltro.request.urlWithParams).toBe(`${base}?formato=pdf&estadoActual=APROBADA`);
    conFiltro.flush(new Blob());
  });
});
