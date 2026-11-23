import { TestBed } from '@angular/core/testing';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { JwtInterceptor } from '../interceptors/jwt.interceptor';
import { AuthService } from './auth.service';
import { ReingresoEstudianteService } from './reingreso-estudiante.service';
import { SolicitudReingresoDTOPeticion } from '../models/procesos.model';
import { LoggerService } from './logger.service';
import { environment } from '@env/environment';

describe('ReingresoEstudianteService - Pruebas Unitarias', () => {
  let service: ReingresoEstudianteService;
  let httpMock: HttpTestingController;

  const apiUrl = `${environment.apiUrl}/solicitudes-reingreso`;

  /** GET a la raíz del recurso (EST-7): los filtros van como parámetros de consulta. */
  const raiz = (): TestRequest => httpMock.expectOne((r) => r.url === apiUrl && r.method === 'GET');

  /** Bandeja de un rol: GET /?rol=…&bandeja=…. */
  const bandeja = (rol: string, nombre: string): TestRequest => {
    const req = raiz();
    expect(req.request.params.get('rol')).toBe(rol);
    expect(req.request.params.get('bandeja')).toBe(nombre);
    return req;
  };

  /** Cambio de estado: PUT /{id}/estado con el estado nuevo (y el comentario) en el cuerpo. */
  const estado = (id: number): TestRequest => {
    const req = httpMock.expectOne(`${apiUrl}/${id}/estado`);
    expect(req.request.method).toBe('PUT');
    return req;
  };

  beforeEach(() => {
    const loggerSpyObj = jasmine.createSpyObj('LoggerService', ['log', 'warn', 'error', 'debug']);
    TestBed.configureTestingModule({
      // Con el JwtInterceptor real: es quien añade el token en la app
      providers: [
        provideHttpClient(withInterceptors([JwtInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: jasmine.createSpyObj('AuthService', { getToken: 'mock-token' }) },
        ReingresoEstudianteService,
        { provide: LoggerService, useValue: loggerSpyObj },
      ],
    });
    service = TestBed.inject(ReingresoEstudianteService);
    httpMock = TestBed.inject(HttpTestingController);
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
      service.listarSolicitudesPorRol('ESTUDIANTE', 1).subscribe(() => done());
      const req = raiz();
      expect(req.request.headers.has('Authorization')).toBe(true);
      req.flush([]);
    });
  });

  describe('2. Listar solicitudes', () => {
    it('RE-003: el estudiante lista con GET /?rol=ESTUDIANTE, su id y el período', (done) => {
      service.listarSolicitudesPorRol('ESTUDIANTE', 1, '2025-1').subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });
      const req = raiz();
      expect(req.request.params.get('rol')).toBe('ESTUDIANTE');
      expect(req.request.params.get('idUsuario')).toBe('1');
      expect(req.request.params.get('periodoAcademico')).toBe('2025-1');
      expect(req.request.params.has('bandeja')).toBe(false);
      req.flush([]);
    });

    it('RE-004: listarSolicitudesPorRol funcionario pide su bandeja de pendientes', (done) => {
      service.listarSolicitudesPorRol('funcionario').subscribe(() => done());
      bandeja('funcionario', 'pendientes').flush([]);
    });

    it('RE-005: listarSolicitudesPorRol coordinador pide su bandeja de pendientes', (done) => {
      service.listarSolicitudesPorRol('COORDINADOR', undefined, '2025-1').subscribe(() => done());
      const req = bandeja('coordinador', 'pendientes');
      expect(req.request.params.get('periodoAcademico')).toBe('2025-1');
      req.flush([]);
    });

    it('RE-006: listarSolicitudesPorRol secretaria pide su bandeja de pendientes', (done) => {
      service.listarSolicitudesPorRol('secretaria').subscribe(() => done());
      bandeja('secretaria', 'pendientes').flush([]);
    });

    it('RE-007: getPendingRequests pide la bandeja de pendientes del funcionario', (done) => {
      service.getPendingRequests().subscribe(() => done());
      const req = bandeja('funcionario', 'pendientes');
      expect(req.request.params.has('periodoAcademico')).toBe(false);
      req.flush([]);
    });

    it('RE-008: getCoordinadorRequests pide la bandeja de pendientes del coordinador', (done) => {
      service.getCoordinadorRequests().subscribe(() => done());
      bandeja('coordinador', 'pendientes').flush([]);
    });

    it('RE-009: getSecretariaRequests pide la bandeja de pendientes de la secretaría', (done) => {
      service.getSecretariaRequests().subscribe(() => done());
      bandeja('secretaria', 'pendientes').flush([]);
    });

    it('RE-017: getSecretariaApprovedRequests pide las procesadas de la secretaría', (done) => {
      service.getSecretariaApprovedRequests().subscribe(() => done());
      bandeja('secretaria', 'procesadas').flush([]);
    });

    it('RE-018: las procesadas del coordinador piden bandeja=procesadas y, si fallan, lista vacía', (done) => {
      service.getSolicitudesProcesadasCoordinador('2025-2').subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });
      const req = bandeja('coordinador', 'procesadas');
      expect(req.request.params.get('periodoAcademico')).toBe('2025-2');
      req.flush('error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('3. Crear y actualizar estado', () => {
    it('RE-010: crearSolicitud debe enviar POST', (done) => {
      const body = { nombre_solicitud: 'Reingreso Test', objUsuario: {} } as unknown as SolicitudReingresoDTOPeticion;
      service.crearSolicitud(body).subscribe(() => done());
      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ id_solicitud: 1 });
    });

    it('RE-012: approveRequest debe enviar APROBADA_FUNCIONARIO', (done) => {
      service.approveRequest(1).subscribe(() => done());
      const req = estado(1);
      expect(req.request.body).toEqual({ nuevoEstado: 'APROBADA_FUNCIONARIO' });
      req.flush({});
    });

    it('RE-013: rejectRequest debe enviar RECHAZADA y comentario', (done) => {
      service.rejectRequest(1, 'Motivo').subscribe(() => done());
      const req = estado(1);
      expect(req.request.body).toEqual({ nuevoEstado: 'RECHAZADA', comentario: 'Motivo' });
      req.flush({});
    });

    it('RE-014: completeValidation debe enviar EN_REVISION_COORDINADOR', (done) => {
      service.completeValidation(1).subscribe(() => done());
      const req = estado(1);
      expect(req.request.body).toEqual({ nuevoEstado: 'EN_REVISION_COORDINADOR' });
      req.flush({});
    });

    it('RE-015: approveAsCoordinador debe enviar APROBADA_COORDINADOR', (done) => {
      service.approveAsCoordinador(1).subscribe(() => done());
      const req = estado(1);
      expect(req.request.body).toEqual({ nuevoEstado: 'APROBADA_COORDINADOR' });
      req.flush({});
    });

    it('RE-016: approveDefinitively debe enviar APROBADA', (done) => {
      service.approveDefinitively(1).subscribe(() => done());
      const req = estado(1);
      expect(req.request.body).toEqual({ nuevoEstado: 'APROBADA' });
      req.flush({});
    });
  });

  describe('4. Oficios', () => {
    it('RE-019: obtenerOficios pide GET /{id}/oficios', (done) => {
      service.obtenerOficios(3).subscribe(() => done());
      const req = httpMock.expectOne(`${apiUrl}/3/oficios`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('RE-020: descargarOficio pide GET /{id}/oficios/archivo', (done) => {
      service.descargarOficio(3).subscribe(() => done());
      const req = httpMock.expectOne(`${apiUrl}/3/oficios/archivo`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob([]));
    });
  });
});
