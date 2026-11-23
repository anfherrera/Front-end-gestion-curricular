import { TestBed } from '@angular/core/testing';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { JwtInterceptor } from '../interceptors/jwt.interceptor';
import { AuthService } from './auth.service';
import { HomologacionAsignaturasService } from './homologacion-asignaturas.service';
import { SolicitudHomologacionDTOPeticion } from '../models/procesos.model';
import { LoggerService } from './logger.service';
import { environment } from '@env/environment';

describe('HomologacionAsignaturasService - Pruebas Unitarias', () => {
  let service: HomologacionAsignaturasService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/solicitudes-homologacion`;

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
        HomologacionAsignaturasService,
        { provide: LoggerService, useValue: loggerSpyObj },
      ],
    });
    service = TestBed.inject(HomologacionAsignaturasService);
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(localStorage, 'getItem').and.returnValue('mock-token');
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('1. Configuracion', () => {
    it('HA-001: Debe crear el servicio correctamente', () => {
      expect(service).toBeTruthy();
    });

    it('HA-002: Debe incluir Authorization en headers', (done) => {
      service.listarSolicitudesPorRol('ESTUDIANTE', 1).subscribe(() => done());
      const req = raiz();
      expect(req.request.headers.has('Authorization')).toBe(true);
      req.flush([]);
    });
  });

  describe('2. Listar solicitudes', () => {
    it('HA-003: Debe listar por rol con idUsuario y periodoAcademico', (done) => {
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

    it('HA-004: getPendingRequests pide la bandeja de pendientes del funcionario', (done) => {
      service.getPendingRequests().subscribe(() => done());
      const req = bandeja('funcionario', 'pendientes');
      expect(req.request.params.has('periodoAcademico')).toBe(false);
      req.flush([]);
    });

    it('HA-005: getCoordinadorRequests pide la bandeja de pendientes del coordinador', (done) => {
      service.getCoordinadorRequests('2025-1').subscribe(() => done());
      const req = bandeja('coordinador', 'pendientes');
      expect(req.request.params.get('periodoAcademico')).toBe('2025-1');
      req.flush([]);
    });

    it('HA-006: getSecretariaRequests pide la bandeja de pendientes de la secretaría', (done) => {
      service.getSecretariaRequests().subscribe(() => done());
      bandeja('secretaria', 'pendientes').flush([]);
    });

    it('HA-016: getSecretariaApprovedRequests pide las procesadas de la secretaría', (done) => {
      service.getSecretariaApprovedRequests('todos').subscribe(() => done());
      const req = bandeja('secretaria', 'procesadas');
      expect(req.request.params.get('periodoAcademico')).toBe('todos');
      req.flush([]);
    });

    it('HA-017: las procesadas del funcionario y del coordinador piden bandeja=procesadas', (done) => {
      service.getSolicitudesProcesadasFuncionario().subscribe(() => {
        service.getSolicitudesProcesadasCoordinador().subscribe(() => done());
        bandeja('coordinador', 'procesadas').flush([]);
      });
      bandeja('funcionario', 'procesadas').flush([]);
    });

    it('HA-018: si las procesadas fallan, devuelve una lista vacía', (done) => {
      service.getSolicitudesProcesadasFuncionario().subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });
      bandeja('funcionario', 'procesadas').flush('error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('3. Crear y actualizar estado', () => {
    it('HA-007: Debe crear solicitud de homologacion', (done) => {
      const body = {
        nombre_solicitud: 'Homologacion Test',
        objUsuario: {},
      } as unknown as SolicitudHomologacionDTOPeticion;
      service.crearSolicitud(body).subscribe(() => done());
      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ id_solicitud: 1 });
    });

    it('HA-008: approveRequest debe enviar APROBADA_FUNCIONARIO', (done) => {
      service.approveRequest(1).subscribe(() => done());
      const req = estado(1);
      expect(req.request.body).toEqual({ nuevoEstado: 'APROBADA_FUNCIONARIO' });
      req.flush({});
    });

    it('HA-009: rejectRequest debe enviar RECHAZADA y comentario', (done) => {
      service.rejectRequest(1, 'Motivo').subscribe(() => done());
      const req = estado(1);
      expect(req.request.body).toEqual({ nuevoEstado: 'RECHAZADA', comentario: 'Motivo' });
      req.flush({});
    });

    it('HA-010: completeValidation debe enviar EN_REVISION_COORDINADOR', (done) => {
      service.completeValidation(1).subscribe(() => done());
      const req = estado(1);
      expect(req.request.body).toEqual({ nuevoEstado: 'EN_REVISION_COORDINADOR' });
      req.flush({});
    });

    it('HA-011: approveAsCoordinador debe enviar APROBADA_COORDINADOR', (done) => {
      service.approveAsCoordinador(1).subscribe(() => done());
      const req = estado(1);
      expect(req.request.body).toEqual({ nuevoEstado: 'APROBADA_COORDINADOR' });
      req.flush({});
    });

    it('HA-012: approveDefinitively debe enviar APROBADA', (done) => {
      service.approveDefinitively(1).subscribe(() => done());
      const req = estado(1);
      expect(req.request.body).toEqual({ nuevoEstado: 'APROBADA' });
      req.flush({});
    });
  });

  describe('4. Archivos y comentarios', () => {
    it('HA-013: descargarArchivo debe solicitar blob', (done) => {
      const nombre = 'doc.pdf';
      service.descargarArchivo(nombre).subscribe((blob) => {
        expect(blob instanceof Blob).toBe(true);
        done();
      });
      const req = httpMock.expectOne(`${environment.apiUrl}/archivos?nombre=doc.pdf`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob([]));
    });

    it('HA-014: agregarComentario debe enviar PUT al documento con el comentario', (done) => {
      service.agregarComentario(1, 'Comentario').subscribe(() => done());
      const req = httpMock.expectOne(`${environment.apiUrl}/documentos/1/comentarios`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ comentario: 'Comentario' });
      req.flush({});
    });

    it('HA-015: subirArchivoPDF debe enviar POST al recurso de archivos con el id de la solicitud', (done) => {
      service.subirArchivoPDF(new File(['%PDF'], 'oficio.pdf'), 7).subscribe(() => done());
      const req = httpMock.expectOne(`${environment.apiUrl}/archivos`);
      expect(req.request.method).toBe('POST');
      const datos = req.request.body as FormData;
      expect((datos.get('file') as File).name).toBe('oficio.pdf');
      expect(datos.get('idSolicitud')).toBe('7');
      req.flush({});
    });

    it('HA-019: subirResolucion envía el PDF a POST /{id}/resoluciones', (done) => {
      const archivo = new File(['%PDF'], 'resolucion.pdf');
      service.subirResolucion(archivo, 7).subscribe(() => done());
      const req = httpMock.expectOne(`${apiUrl}/7/resoluciones`);
      expect(req.request.method).toBe('POST');
      expect((req.request.body as FormData).get('file')).toBe(archivo);
      req.flush({});
    });

    it('HA-020: obtenerOficios pide GET /{id}/oficios', (done) => {
      service.obtenerOficios(7).subscribe((oficios) => {
        expect(oficios.length).toBe(1);
        done();
      });
      const req = httpMock.expectOne(`${apiUrl}/7/oficios`);
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 7, nombre: 'resolucion.pdf' }]);
    });

    it('HA-021: descargarOficio y descargarOficioConNombre piden GET /{id}/oficios/archivo', (done) => {
      service.descargarOficio(7).subscribe(() => {
        service.descargarOficioConNombre(7).subscribe((respuesta) => {
          expect(respuesta.headers.get('Content-Disposition')).toContain('resolucion.pdf');
          done();
        });
        const conNombre = httpMock.expectOne(`${apiUrl}/7/oficios/archivo`);
        conNombre.flush(new Blob([]), { headers: { 'Content-Disposition': 'attachment; filename="resolucion.pdf"' } });
      });
      const req = httpMock.expectOne(`${apiUrl}/7/oficios/archivo`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob([]));
    });
  });
});
