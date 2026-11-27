import { TestBed } from '@angular/core/testing';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { PazSalvoService } from './paz-salvo.service';
import { AuthService } from './auth.service';
import { JwtInterceptor } from '../interceptors/jwt.interceptor';
import { SolicitudHomologacionDTORespuesta } from '../models/procesos.model';
import { environment } from '@env/environment';

describe('PazSalvoService - Pruebas Unitarias', () => {
  let service: PazSalvoService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  const apiUrl = `${environment.apiUrl}/solicitudes-pazysalvo`;

  const mockUsuario = {
    id_usuario: 1,
    nombre_completo: 'Test User',
    codigo: '123456',
    email_usuario: 'test@unicauca.edu.co',
    id_rol: 1,
    id_programa: 1,
    objRol: { id_rol: 1, nombre_rol: 'ESTUDIANTE' },
    objPrograma: { id_programa: 1, nombre_programa: 'Ingeniería Electrónica' },
  };

  /** GET a la raíz del recurso (EST-7): los filtros van como parámetros de consulta. */
  const raiz = () => httpMock.expectOne((r) => r.url === apiUrl && r.method === 'GET');

  /** Bandeja de pendientes de un rol: GET /?rol=…&bandeja=pendientes. */
  const pendientes = (rol: string): TestRequest => {
    const req = raiz();
    expect(req.request.params.get('rol')).toBe(rol);
    expect(req.request.params.get('bandeja')).toBe('pendientes');
    return req;
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUsuario', 'getToken']);
    authServiceSpy.getToken.and.returnValue('mock-token');

    // Con el JwtInterceptor real: es quien añade el token en la app
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([JwtInterceptor])),
        provideHttpClientTesting(),
        PazSalvoService,
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });

    service = TestBed.inject(PazSalvoService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Mock localStorage
    spyOn(localStorage, 'getItem').and.returnValue('mock-token');
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('1. Configuración y Headers', () => {
    it('PZS-001: Debe crear el servicio correctamente', () => {
      expect(service).toBeTruthy();
    });

    it('PZS-002: Debe incluir token de autorización en headers', (done) => {
      const mockSolicitudes: SolicitudHomologacionDTORespuesta[] = [];

      service.listarSolicitudesPorRol('ESTUDIANTE', 1).subscribe(() => {
        done();
      });

      const req = raiz();

      expect(req.request.headers.has('Authorization')).toBe(true);
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');

      req.flush(mockSolicitudes);
    });
  });

  describe('2. Listar Solicitudes por Rol', () => {
    it('PZS-003: Debe listar solicitudes para ESTUDIANTE con parámetros', (done) => {
      const mockSolicitudes = [
        {
          id_solicitud: 1,
          nombre_solicitud: 'Solicitud Test',
          fecha_registro_solicitud: new Date().toISOString(),
          estadosSolicitud: [],
          documentos: [],
          objUsuario: { id_usuario: 1, nombre_completo: 'Test' },
        },
      ];

      service.listarSolicitudesPorRol('ESTUDIANTE', 1).subscribe((solicitudes) => {
        expect(solicitudes.length).toBe(1);
        expect(solicitudes[0].id_solicitud).toBe(1);
        done();
      });

      const req = raiz();
      expect(req.request.params.get('rol')).toBe('ESTUDIANTE');
      expect(req.request.params.get('idUsuario')).toBe('1');
      expect(req.request.params.has('bandeja')).toBe(false);

      req.flush(mockSolicitudes);
    });

    it('PZS-004: Debe listar solicitudes para FUNCIONARIO', (done) => {
      const mockSolicitudes: SolicitudHomologacionDTORespuesta[] = [];

      service.listarSolicitudesPorRol('FUNCIONARIO').subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });

      pendientes('funcionario').flush(mockSolicitudes);
    });

    it('PZS-005: Debe listar solicitudes para COORDINADOR', (done) => {
      const mockSolicitudes: SolicitudHomologacionDTORespuesta[] = [];

      service.listarSolicitudesPorRol('COORDINADOR').subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });

      pendientes('coordinador').flush(mockSolicitudes);
    });

    it('PZS-006: Debe listar solicitudes para SECRETARIA', (done) => {
      const mockSolicitudes: SolicitudHomologacionDTORespuesta[] = [];

      service.listarSolicitudesPorRol('SECRETARIA').subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });

      pendientes('secretaria').flush(mockSolicitudes);
    });

    it('PZS-007: Debe convertir rol a mayúsculas automáticamente', (done) => {
      service.listarSolicitudesPorRol('estudiante', 1).subscribe(() => {
        done();
      });

      const req = raiz();

      expect(req.request.params.get('rol')).toBe('ESTUDIANTE');
      req.flush([]);
    });
  });

  describe('3. Métodos Específicos de Listado', () => {
    it('PZS-009: getPendingRequests debe obtener solicitudes de funcionario', (done) => {
      const mockSolicitudes: SolicitudHomologacionDTORespuesta[] = [];

      service.getPendingRequests().subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });

      const req = pendientes('funcionario');
      expect(req.request.params.has('periodoAcademico')).toBe(false);
      req.flush(mockSolicitudes);
    });

    it('PZS-010: getCoordinadorRequests debe obtener solicitudes de coordinador', (done) => {
      service.getCoordinadorRequests('2025-1').subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });

      const req = pendientes('coordinador');
      expect(req.request.params.get('periodoAcademico')).toBe('2025-1');
      req.flush([]);
    });

    it('PZS-011: getSecretariaRequests debe obtener solicitudes de secretaría', (done) => {
      service.getSecretariaRequests().subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });

      pendientes('secretaria').flush([]);
    });

    const procesadas = [
      ['funcionario', () => service.getSolicitudesProcesadasFuncionario('2025-2')],
      ['coordinador', () => service.getSolicitudesProcesadasCoordinador('2025-2')],
      ['secretaria', () => service.getSolicitudesProcesadasSecretaria('2025-2')],
    ] as const;
    procesadas.forEach(([rol, llamar]) => {
      it(`PZS-040: las procesadas de ${rol} usan ?rol=${rol}&bandeja=procesadas`, (done) => {
        llamar().subscribe((solicitudes) => {
          expect(solicitudes).toEqual([]);
          done();
        });

        const req = httpMock.expectOne((r) => r.url === apiUrl);
        expect(req.request.method).toBe('GET');
        expect(req.request.params.get('rol')).toBe(rol);
        expect(req.request.params.get('bandeja')).toBe('procesadas');
        expect(req.request.params.get('periodoAcademico')).toBe('2025-2');
        req.flush([]);
      });
    });

    it('PZS-041: si las procesadas fallan, devuelve una lista vacía', (done) => {
      service.getSolicitudesProcesadasSecretaria().subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });

      const req = httpMock.expectOne((r) => r.url === apiUrl);
      expect(req.request.params.has('periodoAcademico')).toBe(false);
      req.flush('error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('4. Crear y Enviar Solicitud', () => {
    beforeEach(() => {
      authService.getUsuario.and.returnValue(mockUsuario);
    });

    const datosFormulario = {
      nombre_solicitud: 'Paz y Salvo',
      fecha_registro_solicitud: '2026-11-11T00:00:00.000Z',
    };

    it('PZS-012: Debe enviar solicitud correctamente', (done) => {
      service.crearSolicitudConFormulario(1, [], datosFormulario).subscribe((response) => {
        expect(response).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.idUsuario).toBe(1);

      req.flush({ id: 1 });
    });

    it('PZS-013: Debe lanzar error si usuario no está autenticado', () => {
      authService.getUsuario.and.returnValue(null);

      expect(() => {
        service.crearSolicitudConFormulario(1, [], datosFormulario);
      }).toThrowError('Usuario no autenticado');
    });

    it('PZS-014: No debe enviar datos del usuario (el backend los toma del token)', (done) => {
      service.crearSolicitudConFormulario(1, [], datosFormulario).subscribe(() => done());

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.body.objUsuario).toBeUndefined();

      req.flush({ id: 1 });
    });

    it('PZS-015: Debe generar nombre de solicitud con el nombre del estudiante', (done) => {
      service.crearSolicitudConFormulario(1, [], datosFormulario).subscribe(() => done());

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.body.nombre_solicitud).toBe('Solicitud Paz y Salvo - Test User');

      req.flush({ id: 1 });
    });
  });

  describe('5. Actualizar Estado de Solicitud', () => {
    it('PZS-016: Debe aprobar solicitud como funcionario', (done) => {
      service.approveRequest(1).subscribe(() => done());

      const req = httpMock.expectOne(`${apiUrl}/1/estado`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ nuevoEstado: 'APROBADA_FUNCIONARIO' });

      req.flush({ success: true });
    });

    it('PZS-017: Debe rechazar solicitud con comentario', (done) => {
      const motivo = 'Documentos incompletos';

      service.rejectRequest(1, motivo).subscribe(() => done());

      const req = httpMock.expectOne(`${apiUrl}/1/estado`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ nuevoEstado: 'RECHAZADA', comentario: motivo });

      req.flush({ success: true });
    });

    it('PZS-019: Debe aprobar como coordinador', (done) => {
      service.approveAsCoordinador(1).subscribe(() => done());

      const req = httpMock.expectOne(`${apiUrl}/1/estado`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ nuevoEstado: 'APROBADA_COORDINADOR' });

      req.flush({ success: true });
    });

    it('PZS-020: Debe aprobar definitivamente (secretaría)', (done) => {
      service.approveDefinitively(1).subscribe(() => done());

      const req = httpMock.expectOne(`${apiUrl}/1/estado`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ nuevoEstado: 'APROBADA' });

      req.flush({ success: true });
    });
  });

  describe('6. Gestión de Archivos', () => {
    it('PZS-022: Debe subir documento PDF sin asociarlo a una solicitud', (done) => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      service.subirDocumento(file).subscribe((response) => {
        expect(response).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/documentos`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);

      req.flush({ nombre: 'test.pdf' });
    });

    it('PZS-023: Debe rechazar archivo mayor a 10MB', (done) => {
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
      const largeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' });

      service.subirDocumento(largeFile).subscribe({
        error: (error) => {
          expect(error.status).toBe(413);
          expect(error.error.message).toContain('demasiado grande');
          done();
        },
      });
    });

    it('PZS-024: Debe rechazar archivos que no sean PDF', (done) => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      service.subirDocumento(file).subscribe({
        error: (error) => {
          expect(error.status).toBe(415);
          expect(error.error.message).toContain('Solo se permiten archivos PDF');
          done();
        },
      });
    });

    it('PZS-025: Debe descargar archivo correctamente', (done) => {
      const nombreArchivo = 'documento final.pdf';
      const mockBlob = new Blob(['content'], { type: 'application/pdf' });

      service.descargarArchivo(nombreArchivo).subscribe((blob) => {
        expect(blob).toBeTruthy();
        expect(blob.type).toBe('application/pdf');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/documentos?nombre=${encodeURIComponent(nombreArchivo)}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });
  });

  describe('7. Oficios y Resoluciones', () => {
    it('PZS-027: Debe obtener oficios de una solicitud', (done) => {
      const mockOficios = [{ id: 1, nombre: 'oficio.pdf' }];

      service.obtenerOficios(1).subscribe((oficios) => {
        expect(oficios.length).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/1/oficios`);
      expect(req.request.method).toBe('GET');
      req.flush(mockOficios);
    });

    it('PZS-028: Debe descargar oficio como Blob', (done) => {
      const mockBlob = new Blob(['content'], { type: 'application/pdf' });

      service.descargarOficioPorSolicitud(1).subscribe((blob) => {
        expect(blob instanceof Blob).toBe(true);
        expect(blob.filename).toBe('oficio.pdf');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/1/oficios/archivo`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob, { headers: { 'Content-Disposition': 'attachment; filename="oficio.pdf"' } });
    });

    it('PZS-042: la secretaría sube el oficio en PDF con POST /{id}/oficios', (done) => {
      const file = new File(['%PDF'], 'oficio.pdf', { type: 'application/pdf' });

      service.subirOficioPdf(3, file).subscribe(() => done());

      const req = httpMock.expectOne(`${apiUrl}/3/oficios`);
      expect(req.request.method).toBe('POST');
      expect((req.request.body as FormData).get('file')).toBe(file);
      req.flush({});
    });
  });

  describe('8. Comentarios y Validaciones', () => {
    it('PZS-030: Debe agregar comentario a documento', (done) => {
      const comentario = 'Falta firma';

      service.agregarComentario(1, comentario).subscribe(() => done());

      const req = httpMock.expectOne(`${environment.apiUrl}/documentos/1/comentarios`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ comentario });

      req.flush({ success: true });
    });

    it('PZS-043: los comentarios de una solicitud vienen de GET /{id}/comentarios', (done) => {
      service.obtenerComentarios(5).subscribe((comentarios) => {
        expect(comentarios.comentarioRechazo).toBe('Falta la firma');
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/5/comentarios`);
      expect(req.request.method).toBe('GET');
      req.flush({ comentarioRechazo: 'Falta la firma' });
    });
  });

  describe('9. Manejo de Errores', () => {
    it('PZS-033: Debe manejar error 401 (no autorizado)', (done) => {
      service.listarSolicitudesPorRol('ESTUDIANTE', 1).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        },
      });

      raiz().flush({ message: 'No autorizado' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('PZS-034: Debe manejar error 500 del servidor', (done) => {
      authService.getUsuario.and.returnValue(mockUsuario);
      service
        .crearSolicitudConFormulario(1, [], { nombre_solicitud: 'Paz y Salvo', fecha_registro_solicitud: '2026-11-11' })
        .subscribe({
          error: (error) => {
            expect(error.status).toBe(500);
            done();
          },
        });

      const req = httpMock.expectOne(apiUrl);
      req.flush({ message: 'Error interno' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('10. Métodos Auxiliares', () => {
    it('PZS-037: Debe obtener documentos como coordinador', (done) => {
      service.obtenerDocumentosCoordinador(1).subscribe((documentos) => {
        expect(documentos).toEqual([]);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/1/documentos`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });
});
