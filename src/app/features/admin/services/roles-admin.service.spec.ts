import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RolesAdminService } from './roles-admin.service';
import { environment } from '@env/environment';

describe('RolesAdminService - rutas (EST-7)', () => {
  let service: RolesAdminService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/roles`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RolesAdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('ROL-001: listarRoles hace GET /roles', () => {
    service.listarRoles().subscribe();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0);
    req.flush([]);
  });

  it('ROL-003: buscarPorNombre hace GET /roles?nombre=', () => {
    service.buscarPorNombre('ADMIN').subscribe();
    const req = httpMock.expectOne((r) => r.url === apiUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('nombre')).toBe('ADMIN');
    req.flush({ id_rol: 1, nombre: 'ADMIN' });
  });

  it('ROL-004: crearRol hace POST /roles con el cuerpo', () => {
    service.crearRol({ nombre: 'NUEVO' }).subscribe();
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ nombre: 'NUEVO' });
    req.flush({ id_rol: 7, nombre: 'NUEVO' });
  });

  it('ROL-005: actualizarRol hace PUT /roles/{id}', () => {
    service.actualizarRol({ id_rol: 3, nombre: 'EDITADO' }).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/3`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ id_rol: 3, nombre: 'EDITADO' });
    req.flush({ id_rol: 3, nombre: 'EDITADO' });
  });

  it('ROL-006: eliminarRol hace DELETE /roles/{id}', () => {
    service.eliminarRol(3).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(true);
  });
});
