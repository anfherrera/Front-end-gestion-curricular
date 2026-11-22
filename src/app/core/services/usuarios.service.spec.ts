import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { UsuariosService } from './usuarios.service';
import { UsuarioDTOPeticion } from '../models/usuario.interface';
import { ApiEndpoints } from '../utils/api-endpoints';

describe('UsuariosService - rutas (EST-7)', () => {
  let service: UsuariosService;
  let httpMock: HttpTestingController;
  const apiUrl = `${ApiEndpoints.BASE_URL}/usuarios`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsuariosService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('USR-001: listarUsuarios hace GET /usuarios', () => {
    service.listarUsuarios().subscribe();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('USR-002: buscarUsuarioPorId hace GET /usuarios/{id}', () => {
    service.buscarUsuarioPorId(4).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/4`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('USR-003: crearUsuario hace POST /usuarios', () => {
    const usuario = { nombre_completo: 'Ana Ruiz' } as UsuarioDTOPeticion;
    service.crearUsuario(usuario).subscribe();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(usuario);
    req.flush({});
  });

  it('USR-004: actualizarUsuario hace PUT /usuarios/{id}', () => {
    const usuario = { id_usuario: 3, nombre_completo: 'Ana Ruiz' } as UsuarioDTOPeticion;
    service.actualizarUsuario(usuario).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/3`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(usuario);
    req.flush({});
  });

  it('USR-005: eliminarUsuario hace DELETE /usuarios/{id}', () => {
    service.eliminarUsuario(3).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(true);
  });

  it('USR-006: cambiarEstadoUsuario hace PUT /usuarios/{id}/estado', () => {
    service.cambiarEstadoUsuario(3).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/3/estado`);
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });
});
