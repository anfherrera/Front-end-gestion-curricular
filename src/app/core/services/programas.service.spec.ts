import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProgramasService } from './programas.service';
import { environment } from '@env/environment';

describe('ProgramasService - rutas (EST-7)', () => {
  let service: ProgramasService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/programas`;
  const programa = { codigo: 'SIS', nombre_programa: 'Ingeniería de Sistemas' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProgramasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('PRG-001: listarProgramas hace GET /programas sin parámetros', () => {
    service.listarProgramas().subscribe();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([]);
  });

  it('PRG-002: buscarProgramaPorId hace GET /programas/{id}', () => {
    service.buscarProgramaPorId(4).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/4`);
    expect(req.request.method).toBe('GET');
    req.flush({ id_programa: 4, ...programa });
  });

  it('PRG-003: buscarPorCodigo hace GET /programas?codigo=', () => {
    service.buscarPorCodigo('SIS').subscribe();
    const req = httpMock.expectOne((r) => r.url === apiUrl);
    expect(req.request.params.get('codigo')).toBe('SIS');
    expect(req.request.params.has('nombre')).toBe(false);
    req.flush({ id_programa: 1, ...programa });
  });

  it('PRG-004: buscarPorNombre hace GET /programas?nombre=', () => {
    service.buscarPorNombre('Sis').subscribe();
    const req = httpMock.expectOne((r) => r.url === apiUrl);
    expect(req.request.params.get('nombre')).toBe('Sis');
    expect(req.request.params.has('codigo')).toBe(false);
    req.flush([]);
  });

  it('PRG-005: crearPrograma hace POST /programas', () => {
    service.crearPrograma(programa).subscribe();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(programa);
    req.flush({ id_programa: 7, ...programa });
  });

  it('PRG-006: actualizarPrograma hace PUT /programas/{id}', () => {
    service.actualizarPrograma({ id_programa: 3, ...programa }).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/3`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id_programa: 3, ...programa });
  });

  it('PRG-007: eliminarPrograma hace DELETE /programas/{id}', () => {
    service.eliminarPrograma(3).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(true);
  });
});
