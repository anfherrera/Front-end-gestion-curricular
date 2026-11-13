import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProcesosService } from './procesos.service';
import { environment } from '@env/environment';

describe('ProcesosService', () => {
  let service: ProcesosService;
  let http: HttpTestingController;
  const base = `${environment.apiUrl}/procesos`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ProcesosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista los procesos', () => {
    const procesos = [{ id_proceso: 1, nombre_proceso: 'Paz y salvo', estado_proceso: true }];
    service.listarProcesos().subscribe(r => expect(r).toEqual(procesos));
    const req = http.expectOne(`${base}/listarProcesos`);
    expect(req.request.method).toBe('GET');
    req.flush(procesos);
  });

  it('crea y actualiza un proceso', () => {
    const proceso = { nombre_proceso: 'ECAES', descripcion: '', estado_proceso: true };
    service.crearProceso(proceso).subscribe();
    const crear = http.expectOne(`${base}/crearProceso`);
    expect(crear.request.method).toBe('POST');
    expect(crear.request.body).toEqual(proceso);
    crear.flush({ id_proceso: 2, ...proceso });

    service.actualizarProceso({ ...proceso, id_proceso: 2 }).subscribe();
    const actualizar = http.expectOne(`${base}/actualizarProceso`);
    expect(actualizar.request.method).toBe('PUT');
    expect(actualizar.request.body.id_proceso).toBe(2);
    actualizar.flush({});
  });

  it('cambia el estado y elimina por id', () => {
    service.actualizarEstado(3, false).subscribe();
    const estado = http.expectOne(`${base}/actualizarEstado/3`);
    expect(estado.request.method).toBe('PUT');
    expect(estado.request.body).toEqual({ estado_proceso: false });
    estado.flush({});

    service.eliminarProceso(3).subscribe();
    const eliminar = http.expectOne(`${base}/eliminarProceso/3`);
    expect(eliminar.request.method).toBe('DELETE');
    eliminar.flush({});
  });
});
