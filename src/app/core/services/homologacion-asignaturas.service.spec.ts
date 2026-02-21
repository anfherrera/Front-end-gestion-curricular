import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HomologacionAsignaturasService } from './homologacion-asignaturas.service';
import { LoggerService } from './logger.service';
import { environment } from '../../../environments/environment';

describe('HomologacionAsignaturasService - Pruebas Unitarias', () => {
  let service: HomologacionAsignaturasService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/solicitudes-homologacion`;

  beforeEach(() => {
    const loggerSpyObj = jasmine.createSpyObj('LoggerService', ['log', 'warn', 'error', 'debug']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        HomologacionAsignaturasService,
        { provide: LoggerService, useValue: loggerSpyObj }
      ]
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
      const req = httpMock.expectOne((r: any) => r.url.includes('/listarSolicitud-Homologacion/porRol'));
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
      const req = httpMock.expectOne((r: any) => r.url.includes('/porRol'));
      expect(req.request.params.get('rol')).toBe('ESTUDIANTE');
      expect(req.request.params.get('idUsuario')).toBe('1');
      expect(req.request.params.get('periodoAcademico')).toBe('2025-1');
      req.flush([]);
    });

    it('HA-004: getPendingRequests debe llamar endpoint Funcionario', (done) => {
      service.getPendingRequests().subscribe(() => done());
      const req = httpMock.expectOne((r: any) => r.url.includes('/Funcionario') && !r.url.includes('Aprobadas'));
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('HA-005: getCoordinadorRequests debe llamar endpoint Coordinador', (done) => {
      service.getCoordinadorRequests().subscribe(() => done());
      const req = httpMock.expectOne((r: any) => r.url.includes('/Coordinador') && !r.url.includes('Aprobadas'));
      req.flush([]);
    });

    it('HA-006: getSecretariaRequests debe llamar endpoint Secretaria', (done) => {
      service.getSecretariaRequests().subscribe(() => done());
      const req = httpMock.expectOne((r: any) => r.url.includes('/Secretaria') && !r.url.includes('Aprobadas'));
      req.flush([]);
    });
  });

  describe('3. Crear y actualizar estado', () => {
    it('HA-007: Debe crear solicitud de homologacion', (done) => {
      const body = { nombre_solicitud: 'Homologacion Test', objUsuario: {} };
      service.crearSolicitud(body).subscribe(() => done());
      const req = httpMock.expectOne(`${apiUrl}/crearSolicitud-Homologacion`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ id_solicitud: 1 });
    });

    it('HA-008: approveRequest debe enviar APROBADA_FUNCIONARIO', (done) => {
      service.approveRequest(1).subscribe(() => done());
      const req = httpMock.expectOne(`${apiUrl}/actualizarEstadoSolicitud`);
      expect(req.request.body.nuevoEstado).toBe('APROBADA_FUNCIONARIO');
      req.flush({});
    });

    it('HA-009: rejectRequest debe enviar RECHAZADA y comentario', (done) => {
      service.rejectRequest(1, 'Motivo').subscribe(() => done());
      const req = httpMock.expectOne(`${apiUrl}/actualizarEstadoSolicitud`);
      expect(req.request.body.nuevoEstado).toBe('RECHAZADA');
      expect(req.request.body.comentario).toBe('Motivo');
      req.flush({});
    });

    it('HA-010: completeValidation debe enviar EN_REVISION_COORDINADOR', (done) => {
      service.completeValidation(1).subscribe(() => done());
      const req = httpMock.expectOne(`${apiUrl}/actualizarEstadoSolicitud`);
      expect(req.request.body.nuevoEstado).toBe('EN_REVISION_COORDINADOR');
      req.flush({});
    });

    it('HA-011: approveAsCoordinador debe enviar APROBADA_COORDINADOR', (done) => {
      service.approveAsCoordinador(1).subscribe(() => done());
      const req = httpMock.expectOne(`${apiUrl}/actualizarEstadoSolicitud`);
      expect(req.request.body.nuevoEstado).toBe('APROBADA_COORDINADOR');
      req.flush({});
    });

    it('HA-012: approveDefinitively debe enviar APROBADA', (done) => {
      service.approveDefinitively(1).subscribe(() => done());
      const req = httpMock.expectOne(`${apiUrl}/actualizarEstadoSolicitud`);
      expect(req.request.body.nuevoEstado).toBe('APROBADA');
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
      const req = httpMock.expectOne((r: any) => r.url.includes('archivos/descargar/pdf'));
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob([]));
    });

    it('HA-014: agregarComentario debe enviar PUT con idDocumento y comentario', (done) => {
      service.agregarComentario(1, 'Comentario').subscribe(() => done());
      const req = httpMock.expectOne((r: any) => r.url.includes('documentos/añadirComentario'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.idDocumento).toBe(1);
      expect(req.request.body.comentario).toBe('Comentario');
      req.flush({});
    });
  });
});
