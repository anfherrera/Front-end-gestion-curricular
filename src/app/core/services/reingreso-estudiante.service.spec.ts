import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReingresoEstudianteService } from './reingreso-estudiante.service';
import { LoggerService } from './logger.service';
import { environment } from '../../../environments/environment';

describe('ReingresoEstudianteService - Pruebas Unitarias', () => {
  let service: ReingresoEstudianteService;
  let httpMock: HttpTestingController;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  const apiUrl = `${environment.apiUrl}/solicitudes-reingreso`;

  beforeEach(() => {
    const loggerSpyObj = jasmine.createSpyObj('LoggerService', ['log', 'warn', 'error', 'debug']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ReingresoEstudianteService,
        { provide: LoggerService, useValue: loggerSpyObj }
      ]
    });
    service = TestBed.inject(ReingresoEstudianteService);
    httpMock = TestBed.inject(HttpTestingController);
    loggerSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    spyOn(localStorage, 'getItem').and.returnValue('mock-token');
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('1. Configuración', () => {
    it('RE-001: Debe crear el servicio correctamente', () => {
      expect(service).toBeTruthy();
    });

    it('RE-002: Debe incluir Authorization en headers', (done) => {
      service.listarSolicitudes().subscribe(() => done());
      const req = httpMock.expectOne((r) => r.url.includes('listarSolicitudes-Reingreso'));
      expect(req.request.headers.has('Authorization')).toBe(true);
      req.flush([]);
    });
  });

  describe('2. Listar solicitudes', () => {
    it('RE-003: listarSolicitudes debe llamar GET listarSolicitudes-Reingreso', (done) => {
      service.listarSolicitudes().subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });
      const req = httpMock.expectOne((r) => r.url.includes('listarSolicitudes-Reingreso'));
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('RE-004: listarSolicitudesPorRol funcionario debe usar endpoint Funcionario', (done) => {
      service.listarSolicitudesPorRol('funcionario').subscribe(() => done());
      const req = httpMock.expectOne((r) => r.url.includes('/Funcionario'));
      req.flush([]);
    });

    it('RE-005: listarSolicitudesPorRol coordinador debe usar endpoint Coordinador', (done) => {
      service.listarSolicitudesPorRol('coordinador').subscribe(() => done());
      const req = httpMock.expectOne((r) => r.url.includes('/Coordinador'));
      req.flush([]);
    });

    it('RE-006: listarSolicitudesPorRol secretaria debe usar endpoint Secretaria', (done) => {
      service.listarSolicitudesPorRol('secretaria').subscribe(() => done());
      const req = httpMock.expectOne((r) => r.url.includes('/Secretaria'));
      req.flush([]);
    });

    it('RE-007: getPendingRequests debe delegar en listarSolicitudesPorRol funcionario', (done) => {
      service.getPendingRequests().subscribe(() => done());
      const req = httpMock.expectOne((r) => r.url.includes('/Funcionario'));
      req.flush([]);
    });

    it('RE-008: getCoordinadorRequests debe delegar en listarSolicitudesPorRol coordinador', (done) => {
      service.getCoordinadorRequests().subscribe(() => done());
      const req = httpMock.expectOne((r) => r.url.includes('/Coordinador'));
      req.flush([]);
    });

    it('RE-009: getSecretariaRequests debe delegar en listarSolicitudesPorRol secretaria', (done) => {
      service.getSecretariaRequests().subscribe(() => done());
      const req = httpMock.expectOne((r) => r.url.includes('/Secretaria'));
      req.flush([]);
    });
  });

  describe('3. Crear y actualizar estado', () => {
    it('RE-010: crearSolicitud debe enviar POST', (done) => {
      const body = { nombre_solicitud: 'Reingreso Test', objUsuario: {} } as any;
      service.crearSolicitud(body).subscribe(() => done());
      const req = httpMock.expectOne(`${apiUrl}/crearSolicitud-Reingreso`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ id_solicitud: 1 });
    });

    it('RE-011: actualizarEstadoSolicitud debe enviar PUT con cambioEstado', (done) => {
      const cambio = { idSolicitud: 1, nuevoEstado: 'APROBADA_FUNCIONARIO' };
      service.actualizarEstadoSolicitud(cambio as any).subscribe(() => done());
      const req = httpMock.expectOne((r) => r.url.includes('actualizarEstadoSolicitud-Reingreso'));
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });

    it('RE-012: approveRequest debe enviar APROBADA_FUNCIONARIO', (done) => {
      service.approveRequest(1).subscribe(() => done());
      const req = httpMock.expectOne((r) => r.url.includes('actualizarEstadoSolicitud-Reingreso'));
      expect(req.request.body.nuevoEstado).toBe('APROBADA_FUNCIONARIO');
      req.flush({});
    });

    it('RE-013: rejectRequest debe enviar RECHAZADA y comentario', (done) => {
      service.rejectRequest(1, 'Motivo').subscribe(() => done());
      const req = httpMock.expectOne((r) => r.url.includes('actualizarEstadoSolicitud-Reingreso'));
      expect(req.request.body.nuevoEstado).toBe('RECHAZADA');
      expect(req.request.body.comentario).toBe('Motivo');
      req.flush({});
    });

    it('RE-014: completeValidation debe enviar EN_REVISION_COORDINADOR', (done) => {
      service.completeValidation(1).subscribe(() => done());
      const req = httpMock.expectOne((r) => r.url.includes('actualizarEstadoSolicitud-Reingreso'));
      expect(req.request.body.nuevoEstado).toBe('EN_REVISION_COORDINADOR');
      req.flush({});
    });

    it('RE-015: approveAsCoordinador debe enviar APROBADA_COORDINADOR', (done) => {
      service.approveAsCoordinador(1).subscribe(() => done());
      const req = httpMock.expectOne((r) => r.url.includes('actualizarEstadoSolicitud-Reingreso'));
      expect(req.request.body.nuevoEstado).toBe('APROBADA_COORDINADOR');
      req.flush({});
    });

    it('RE-016: approveDefinitively debe enviar APROBADA', (done) => {
      service.approveDefinitively(1).subscribe(() => done());
      const req = httpMock.expectOne((r) => r.url.includes('actualizarEstadoSolicitud-Reingreso'));
      expect(req.request.body.nuevoEstado).toBe('APROBADA');
      req.flush({});
    });
  });
});
