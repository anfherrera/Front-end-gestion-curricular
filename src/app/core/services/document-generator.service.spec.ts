import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { DocumentGeneratorService, fechaParaBackend } from './document-generator.service';
import { DocumentRequest } from '../models/documento.model';

describe('DocumentGeneratorService', () => {
  let service: DocumentGeneratorService;
  let httpMock: HttpTestingController;

  const request = (tipoDocumento: string): DocumentRequest => ({
    idSolicitud: 7,
    tipoDocumento,
    datosDocumento: { numeroDocumento: '001-2026', fechaDocumento: new Date(2026, 0, 5) },
    datosSolicitud: { idSolicitud: 7, estado: 'APROBADA_COORDINADOR', cedula: '123' }
  });

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(DocumentGeneratorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('paz y salvo va a su endpoint con FormData', () => {
    service.generarDocumento(request('OFICIO_PAZ_SALVO')).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/solicitudes-pazysalvo/generar-documento/7`);
    const body = req.request.body as FormData;
    expect(body.get('numeroDocumento')).toBe('001-2026');
    expect(body.get('fechaDocumento')).toBe('2026-01-05');
    expect(body.get('cedulaEstudiante')).toBe('123');
    req.flush(new Blob());
  });

  it('homologación y reingreso van a /documentos/generar con la petición tal cual', () => {
    for (const tipo of ['OFICIO_HOMOLOGACION', 'RESOLUCION_REINGRESO']) {
      service.generarDocumento(request(tipo)).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/documentos/generar`);
      expect(req.request.body.tipoDocumento).toBe(tipo);
      req.flush(new Blob());
    }
  });

  it('fechaParaBackend no corre la fecha y deja vacío si no hay', () => {
    expect(fechaParaBackend(new Date(2026, 10, 13))).toBe('2026-11-13');
    expect(fechaParaBackend('2026-11-13T05:00:00Z')).toBe('2026-11-13');
    expect(fechaParaBackend(null)).toBe('');
    expect(fechaParaBackend('  ')).toBe('');
  });
});
