import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PruebasEcaesService, FechaEcaes, SolicitudEcaesResponse } from './pruebas-ecaes.service';
import { LoggerService } from './logger.service';
import { environment } from '../../../environments/environment';

describe('PruebasEcaesService - Pruebas Unitarias', () => {
  let service: PruebasEcaesService;
  let httpMock: HttpTestingController;
  let loggerSpy: jasmine.SpyObj<LoggerService>;

  const apiUrl = `${environment.apiUrl}/solicitudes-ecaes`;

  beforeEach(() => {
    const loggerSpyObj = jasmine.createSpyObj('LoggerService', ['log', 'warn', 'error', 'debug']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PruebasEcaesService,
        { provide: LoggerService, useValue: loggerSpyObj }
      ]
    });
    service = TestBed.inject(PruebasEcaesService);
    httpMock = TestBed.inject(HttpTestingController);
    loggerSpy = TestBed.inject(LoggerService) as jasmine.SpyObj<LoggerService>;
    spyOn(localStorage, 'getItem').and.returnValue('mock-token');
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('1. Configuración y headers', () => {
    it('EC-001: Debe crear el servicio correctamente', () => {
      expect(service).toBeTruthy();
    });

    it('EC-002: Debe incluir token de autorización en listarFechasEcaes', (done) => {
      service.listarFechasEcaes().subscribe(() => done());
      const req = httpMock.expectOne(`${apiUrl}/listarFechasEcaes`);
      expect(req.request.headers.has('Authorization')).toBe(true);
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
      req.flush([]);
    });
  });

  describe('2. Fechas ECAES', () => {
    it('EC-003: Debe listar fechas ECAES', (done) => {
      const mockFechas: FechaEcaes[] = [
        {
          idFechaEcaes: 1,
          periodoAcademico: '2025-1',
          inscripcion_est_by_facultad: '2025-01-15',
          registro_recaudo_ordinario: '2025-02-01',
          registro_recaudo_extraordinario: '2025-02-15',
          citacion: '2025-03-01',
          aplicacion: '2025-03-15',
          resultados_individuales: '2025-04-01'
        }
      ];
      service.listarFechasEcaes().subscribe((fechas) => {
        expect(fechas.length).toBe(1);
        expect(fechas[0].periodoAcademico).toBe('2025-1');
        done();
      });
      const req = httpMock.expectOne(`${apiUrl}/listarFechasEcaes`);
      expect(req.request.method).toBe('GET');
      req.flush(mockFechas);
    });

    it('EC-004: Debe buscar fechas por período', (done) => {
      const periodo = '2025-1';
      const mockFecha: FechaEcaes = {
        idFechaEcaes: 1,
        periodoAcademico: periodo,
        inscripcion_est_by_facultad: '2025-01-15',
        registro_recaudo_ordinario: '2025-02-01',
        registro_recaudo_extraordinario: '2025-02-15',
        citacion: '2025-03-01',
        aplicacion: '2025-03-15',
        resultados_individuales: '2025-04-01'
      };
      service.buscarFechasPorPeriodo(periodo).subscribe((fecha) => {
        expect(fecha.periodoAcademico).toBe(periodo);
        done();
      });
      const req = httpMock.expectOne(`${apiUrl}/buscarFechasPorPeriodo/${encodeURIComponent(periodo)}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockFecha);
    });

    it('EC-005: Debe publicar fechas ECAES', (done) => {
      const fechasData = { periodoAcademico: '2025-1', inscripcion_est_by_facultad: '2025-01-15' };
      service.publicarFechasEcaes(fechasData).subscribe(() => done());
      const req = httpMock.expectOne(`${apiUrl}/publicarFechasEcaes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(fechasData);
      req.flush({ success: true });
    });

    it('EC-006: Debe actualizar fechas ECAES', (done) => {
      const fechasData = { idFechaEcaes: 1, periodoAcademico: '2025-1' };
      service.actualizarFechasEcaes(fechasData).subscribe(() => done());
      const req = httpMock.expectOne(`${apiUrl}/actualizarFechasEcaes`);
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true });
    });
  });

  describe('3. Solicitudes ECAES', () => {
    it('EC-007: Debe crear solicitud ECAES', (done) => {
      const solicitud = {
        nombre_solicitud: 'Solicitud ECAES - Test',
        fecha_registro_solicitud: new Date().toISOString(),
        periodo_academico: '2025-1',
        objUsuario: { id_usuario: 1, nombre_completo: 'Test', codigo: '123', cedula: '123', correo: 't@t.co', estado_usuario: true },
        tipoDocumento: 'CC',
        numero_documento: '123',
        fecha_expedicion: '2020-01-01',
        fecha_nacimiento: '1999-01-01',
        documentos: []
      };
      const mockResponse: SolicitudEcaesResponse = {
        id_solicitud: 10,
        nombre_solicitud: solicitud.nombre_solicitud,
        fecha_registro_solicitud: solicitud.fecha_registro_solicitud,
        periodo_academico: '2025-1',
        estadosSolicitud: [],
        objUsuario: {} as any,
        documentos: [],
        tipoDocumento: 'CC',
        numero_documento: '123',
        fecha_expedicion: '2020-01-01',
        fecha_nacimiento: '1999-01-01'
      };
      service.crearSolicitudEcaes(solicitud as any).subscribe((res) => {
        expect(res.id_solicitud).toBe(10);
        done();
      });
      const req = httpMock.expectOne(`${apiUrl}/crearSolicitud-Ecaes`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.nombre_solicitud).toContain('ECAES');
      req.flush(mockResponse);
    });

    it('EC-008: Debe listar solicitudes por rol con idUsuario', (done) => {
      const mockSolicitudes: SolicitudEcaesResponse[] = [];
      service.listarSolicitudesPorRol('ESTUDIANTE', 1).subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });
      const req = httpMock.expectOne((r) => r.url.includes('/listarSolicitud-ecaes/porRol'));
      expect(req.request.params.get('rol')).toBe('ESTUDIANTE');
      expect(req.request.params.get('idUsuario')).toBe('1');
      req.flush(mockSolicitudes);
    });

    it('EC-009: Debe listar solicitudes funcionario', (done) => {
      service.listarSolicitudesFuncionario('2025-1').subscribe(() => done());
      const req = httpMock.expectOne((r) => r.url.includes('/listarSolicitudes-Ecaes/Funcionario'));
      expect(req.request.params.get('periodoAcademico')).toBe('2025-1');
      req.flush([]);
    });
  });

  describe('4. Actualizar estado', () => {
    it('EC-010: Debe actualizar estado de solicitud', (done) => {
      service.actualizarEstadoSolicitud(1, 'ENVIADA').subscribe(() => done());
      const req = httpMock.expectOne(`${apiUrl}/actualizarEstadoSolicitud`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.idSolicitud).toBe(1);
      expect(req.request.body.nuevoEstado).toBe('ENVIADA');
      req.flush({});
    });

    it('EC-011: Debe aprobar solicitud (PRE_REGISTRADO)', (done) => {
      service.approveRequest(1).subscribe(() => done());
      const req = httpMock.expectOne(`${apiUrl}/actualizarEstadoSolicitud`);
      expect(req.request.body.nuevoEstado).toBe('PRE_REGISTRADO');
      req.flush({});
    });

    it('EC-012: Debe rechazar solicitud con comentario', (done) => {
      service.rejectRequest(1, 'Motivo').subscribe(() => done());
      const req = httpMock.expectOne(`${apiUrl}/actualizarEstadoSolicitud`);
      expect(req.request.body.nuevoEstado).toBe('Rechazada');
      expect(req.request.body.comentario).toBe('Motivo');
      req.flush({});
    });
  });

  describe('5. Archivos y comentarios', () => {
    it('EC-013: Debe descargar archivo por nombre', (done) => {
      const nombre = 'doc.pdf';
      const mockBlob = new Blob(['content'], { type: 'application/pdf' });
      service.descargarArchivo(nombre).subscribe((blob) => {
        expect(blob instanceof Blob).toBe(true);
        done();
      });
      const req = httpMock.expectOne((r) => r.url.includes('archivos/descargar/pdf') && r.url.includes(nombre));
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });

    it('EC-014: Debe descargar archivo por ID documento', (done) => {
      service.descargarArchivoPorId(5).subscribe(() => done());
      const req = httpMock.expectOne((r) => r.url.includes('/documentos/5/descargar'));
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob([]));
    });

    it('EC-015: Debe agregar comentario a documento', (done) => {
      service.agregarComentario(1, 'Comentario test').subscribe(() => done());
      const req = httpMock.expectOne((r) => r.url.includes('documentos/añadirComentario'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.idDocumento).toBe(1);
      expect(req.request.body.comentario).toBe('Comentario test');
      req.flush({});
    });
  });
});
