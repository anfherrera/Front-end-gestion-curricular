import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DocentesService } from './docentes.service';
import { environment } from '@env/environment';

describe('DocentesService - rutas (EST-7)', () => {
  let service: DocentesService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/docentes`;
  const docente = { codigo_docente: 'D001', nombre_docente: 'Ana Docente' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DocentesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('DOC-001: listarDocentes hace GET /docentes sin parámetros', () => {
    service.listarDocentes().subscribe();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([]);
  });

  it('DOC-002: buscarDocentePorId hace GET /docentes/{id}', () => {
    service.buscarDocentePorId(4).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/4`);
    expect(req.request.method).toBe('GET');
    req.flush({ id_docente: 4, ...docente });
  });

  it('DOC-003: buscarPorCodigo hace GET /docentes?codigo=', () => {
    service.buscarPorCodigo('D001').subscribe();
    const req = httpMock.expectOne((r) => r.url === apiUrl);
    expect(req.request.params.get('codigo')).toBe('D001');
    expect(req.request.params.has('nombre')).toBe(false);
    req.flush({ id_docente: 1, ...docente });
  });

  it('DOC-004: buscarPorNombre hace GET /docentes?nombre=', () => {
    service.buscarPorNombre('Ana').subscribe();
    const req = httpMock.expectOne((r) => r.url === apiUrl);
    expect(req.request.params.get('nombre')).toBe('Ana');
    expect(req.request.params.has('codigo')).toBe(false);
    req.flush([]);
  });

  it('DOC-005: crearDocente hace POST /docentes', () => {
    service.crearDocente(docente).subscribe();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(docente);
    req.flush({ id_docente: 7, ...docente });
  });

  it('DOC-006: actualizarDocente hace PUT /docentes/{id}', () => {
    service.actualizarDocente({ id_docente: 3, ...docente }).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/3`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id_docente: 3, ...docente });
  });

  it('DOC-007: eliminarDocente hace DELETE /docentes/{id}', () => {
    service.eliminarDocente(3).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(true);
  });
});
