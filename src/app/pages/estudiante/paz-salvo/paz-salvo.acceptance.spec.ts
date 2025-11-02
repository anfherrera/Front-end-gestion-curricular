import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PazSalvoService } from '../../../core/services/paz-salvo.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * ================================================
 * PRUEBAS DE ACEPTACIÓN - PAZ Y SALVO
 * ================================================
 * 
 * Validan CRITERIOS DE ACEPTACIÓN DEL NEGOCIO
 * Formato BDD: Given/When/Then
 * Basadas en Historias de Usuario REALES
 */
describe('PRUEBAS DE ACEPTACIÓN - Paz y Salvo', () => {
  let service: PazSalvoService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  const mockEstudiante = {
    id_usuario: 1,
    nombre_completo: 'Juan Pérez',
    codigo: '123456',
    email_usuario: 'juan.perez@unicauca.edu.co',
    id_rol: 1,
    id_programa: 1,
    objRol: { id_rol: 1, nombre_rol: 'ESTUDIANTE' },
    objPrograma: { id_programa: 1, nombre_programa: 'Ingeniería Electrónica' }
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUsuario']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PazSalvoService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(PazSalvoService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    authService.getUsuario.and.returnValue(mockEstudiante);
    spyOn(localStorage, 'getItem').and.returnValue('mock-token');
  });

  afterEach(() => {
    httpMock.verify();
  });

  /**
   * HISTORIA DE USUARIO 1:
   * Como estudiante,
   * Quiero crear una solicitud de paz y salvo con mis documentos,
   * Para que el funcionario pueda revisarla.
   */
  describe('HU-01: Crear Solicitud de Paz y Salvo', () => {
    it('ACEP-PS-001: DADO que soy estudiante Y tengo documentos, CUANDO envío solicitud, ENTONCES se crea exitosamente', fakeAsync(() => {
      // GIVEN: Soy estudiante con documentos
      const idUsuario = mockEstudiante.id_usuario;
      const archivos: any[] = [
        { nombre: 'carta.pdf', fecha: new Date().toISOString() }
      ];

      // WHEN: Envío la solicitud
      service.sendRequest(idUsuario, archivos).subscribe((response) => {
        // THEN: Se crea exitosamente
        expect(response).toBeTruthy();
      });
      tick();

      const req = httpMock.expectOne((r) => r.url.includes('/crearSolicitud-PazYSalvo'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.objUsuario.id_usuario).toBe(idUsuario);
      expect(req.request.body.archivos).toEqual(archivos);
      req.flush({ id_solicitud: 1, mensaje: 'Solicitud creada' });
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 2:
   * Como estudiante,
   * Quiero ver el estado de mis solicitudes,
   * Para saber si fueron aprobadas o están pendientes.
   */
  describe('HU-02: Ver Estado de Solicitudes', () => {
    it('ACEP-PS-002: DADO que tengo solicitudes, CUANDO consulto, ENTONCES veo todas con su estado', fakeAsync(() => {
      // GIVEN: Tengo solicitudes en el sistema
      const mockSolicitudes: any[] = [
        {
          id_solicitud: 1,
          nombre_solicitud: 'Solicitud 1',
          estado: 'PENDIENTE'
        },
        {
          id_solicitud: 2,
          nombre_solicitud: 'Solicitud 2',
          estado: 'APROBADA'
        }
      ];

      // WHEN: Consulto mis solicitudes
      service.listarSolicitudesPorRol('ESTUDIANTE', 1).subscribe((solicitudes: any[]) => {
        // THEN: Veo todas mis solicitudes
        expect(solicitudes.length).toBe(2);
        expect(solicitudes[0].estado).toBe('PENDIENTE');
        expect(solicitudes[1].estado).toBe('APROBADA');
      });
      tick();

      const req = httpMock.expectOne((r) => r.url.includes('/listarSolicitud-PazYSalvo/porRol'));
      req.flush(mockSolicitudes);
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 3:
   * Como funcionario,
   * Quiero revisar solicitudes pendientes,
   * Para aprobarlas o rechazarlas.
   */
  describe('HU-03: Revisar Solicitudes (Funcionario)', () => {
    it('ACEP-PS-003: DADO que soy funcionario, CUANDO veo solicitudes pendientes, ENTONCES puedo identificarlas', fakeAsync(() => {
      // GIVEN: Hay solicitudes pendientes
      const mockSolicitudes: any[] = [
        { id_solicitud: 1, estado: 'PENDIENTE' },
        { id_solicitud: 2, estado: 'APROBADA' },
        { id_solicitud: 3, estado: 'PENDIENTE' }
      ];

      // WHEN: Listo solicitudes
      service.listarSolicitudesPorRol('FUNCIONARIO', 1).subscribe((solicitudes) => {
        // THEN: Puedo filtrar las pendientes
        const pendientes = solicitudes.filter((s: any) => s.estado === 'PENDIENTE');
        expect(pendientes.length).toBe(2);
      });
      tick();

      const req = httpMock.expectOne((r) => r.url.endsWith('/listarSolicitud-PazYSalvo/Funcionario'));
      req.flush(mockSolicitudes);
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 4:
   * Como estudiante,
   * Quiero descargar documentos de mi solicitud,
   * Para verificar qué subí.
   */
  describe('HU-04: Descargar Documentos', () => {
    it('ACEP-PS-004: DADO que mi solicitud tiene documentos, CUANDO descargo, ENTONCES obtengo el archivo', fakeAsync(() => {
      // GIVEN: Mi solicitud tiene un documento
      const documentoId = 1;
      const mockPDF = new Blob(['PDF Content'], { type: 'application/pdf' });

      // WHEN: Descargo el documento
      service.descargarArchivo(documentoId.toString()).subscribe((blob) => {
        // THEN: Obtengo un archivo PDF válido
        expect(blob.type).toBe('application/pdf');
        expect(blob.size).toBeGreaterThan(0);
      });
      tick();

      const req = httpMock.expectOne((r) => r.url.includes('/descargar-documento'));
      expect(req.request.responseType).toBe('blob');
      req.flush(mockPDF);
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 5:
   * Como estudiante,
   * Quiero descargar el oficio de paz y salvo aprobado,
   * Para presentarlo donde me lo requieran.
   */
  describe('HU-05: Descargar Oficio Aprobado', () => {
    it('ACEP-PS-005: DADO que mi solicitud fue aprobada, CUANDO descargo oficio, ENTONCES obtengo PDF oficial', fakeAsync(() => {
      // GIVEN: Solicitud aprobada con oficio
      const oficioId = 1;
      const mockPDF = new Blob(['Oficio Oficial'], { type: 'application/pdf' });

      // WHEN: Descargo el oficio
      service.descargarOficio(oficioId).subscribe((blob) => {
        // THEN: Obtengo documento oficial
        expect(blob).toBeTruthy();
        expect(blob.type).toBe('application/pdf');
      });
      tick();

      const req = httpMock.expectOne((r) => r.url.includes('/descargarOficio/'));
      req.flush(mockPDF);
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 6:
   * Como coordinador,
   * Quiero dar aprobación final a solicitudes ya revisadas,
   * Para generar el oficio oficial.
   */
  describe('HU-06: Aprobación Final Coordinador', () => {
    it('ACEP-PS-006: DADO que soy coordinador Y solicitud revisada, CUANDO apruebo, ENTONCES se genera oficio', fakeAsync(() => {
      // GIVEN: Solicitud revisada por funcionario
      const requestId = 1;

      // WHEN: Coordinador aprueba
      service.approveAsCoordinador(requestId).subscribe((response) => {
        // THEN: Aprobación exitosa
        expect(response).toBeTruthy();
      });
      tick();

      const req = httpMock.expectOne((r) => r.url.includes('/actualizarEstadoSolicitud'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.nuevoEstado).toBe('APROBADA_COORDINADOR');
      req.flush({ mensaje: 'Aprobación exitosa', oficioGenerado: true });
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 7:
   * Como estudiante,
   * Quiero ver el seguimiento de mi solicitud de paz y salvo,
   * Para conocer su estado actual y próximos pasos.
   */
  describe('HU-07: Seguimiento de Solicitud', () => {
    it('ACEP-PS-007: DADO que soy estudiante con solicitud en proceso, CUANDO consulto seguimiento, ENTONCES veo estados y documento descargable', fakeAsync(() => {
      // GIVEN: Estudiante con solicitud activa
      const mockSolicitud = {
        id_solicitud: 1,
        estadosSolicitud: [
          { estado_actual: 'ENVIADA', fecha_registro_estado: '2025-01-10' },
          { estado_actual: 'APROBADA_COORDINADOR', fecha_registro_estado: '2025-01-15' }
        ],
        documentos: [{ nombre: 'oficio_paz_salvo_1.pdf' }]
      };

      // WHEN: Estudiante consulta seguimiento
      service.obtenerSolicitudCompleta(1).subscribe((solicitud) => {
        // THEN: Ve estados y puede descargar documento
        expect(solicitud).toBeTruthy();
        expect(solicitud.estadosSolicitud.length).toBeGreaterThan(0);
        expect(solicitud.documentos.length).toBeGreaterThan(0);
      });
      tick();

      const req = httpMock.expectOne((r) => r.url.includes('/obtenerSolicitud/1'));
      expect(req.request.method).toBe('GET');
      req.flush(mockSolicitud);
      tick();
    }));
  });
});

