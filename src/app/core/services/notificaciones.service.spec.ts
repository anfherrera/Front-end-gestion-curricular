import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '@env/environment';
import { NotificacionesService } from './notificaciones.service';

describe('NotificacionesService (rutas de EST-7, paso 4)', () => {
  let service: NotificacionesService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/notificaciones`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(NotificacionesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('obtiene todas las notificaciones del usuario y convierte la fecha', () => {
    let fecha: unknown;
    service.obtenerTodas(5).subscribe((lista) => (fecha = lista[0].fechaCreacion));
    const req = httpMock.expectOne(`${base}?usuario=5`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id_notificacion: 7, fechaCreacion: '2025-03-04T10:00:00.000+00:00' }]);
    expect(fecha instanceof Date).toBeTrue();
  });

  it('obtiene las no leídas con leida=false', () => {
    service.obtenerNoLeidas(5).subscribe();
    const req = httpMock.expectOne(`${base}?usuario=5&leida=false`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('cuenta las no leídas en /conteo', () => {
    let cantidad: number | undefined;
    service.contarNoLeidas(5).subscribe((n) => (cantidad = n));
    const req = httpMock.expectOne(`${base}/conteo?usuario=5&leida=false`);
    expect(req.request.method).toBe('GET');
    req.flush(3);
    expect(cantidad).toBe(3);
  });

  it('marca una como leída con PUT /{id}/leida', () => {
    service.marcarComoLeida(7).subscribe();
    const req = httpMock.expectOne(`${base}/7/leida`);
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });

  it('marca todas como leídas con PUT /leidas?usuario=', () => {
    service.marcarTodasComoLeidas(5).subscribe();
    const req = httpMock.expectOne(`${base}/leidas?usuario=5`);
    expect(req.request.method).toBe('PUT');
    req.flush(null);
  });
});
