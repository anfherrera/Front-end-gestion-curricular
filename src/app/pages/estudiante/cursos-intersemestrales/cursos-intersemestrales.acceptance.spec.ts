import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CursosIntersemestralesService } from '../../../core/services/cursos-intersemestrales.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiEndpoints } from '../../../core/utils/api-endpoints';

/**
 * ======================================================
 * PRUEBAS DE ACEPTACIÓN - CURSOS INTERSEMESTRALES
 * ======================================================
 * 
 * Formato BDD: Given/When/Then
 * Basadas en Historias de Usuario REALES
 */
describe('PRUEBAS DE ACEPTACIÓN - Cursos Intersemestrales', () => {
  let service: CursosIntersemestralesService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  const mockEstudiante = {
    id_usuario: 1,
    nombre_completo: 'María González',
    codigo: '654321',
    email_usuario: 'maria.gonzalez@unicauca.edu.co',
    id_rol: 1,
    id_programa: 1,
    objRol: { id_rol: 1, nombre_rol: 'ESTUDIANTE' },
    objPrograma: { id_programa: 1, nombre_programa: 'Ingeniería de Sistemas' }
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUsuario']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CursosIntersemestralesService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(CursosIntersemestralesService);
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
   * Quiero ver los cursos intersemestrales disponibles,
   * Para seleccionar los que me interesan.
   */
  describe('HU-01: Ver Cursos Disponibles', () => {
    it('ACEP-CI-001: DADO que hay cursos disponibles, CUANDO consulto lista, ENTONCES veo todos los cursos activos', fakeAsync(() => {
      // GIVEN: Existen cursos disponibles
      const mockCursos: any[] = [
        {
          id_curso: 1,
          nombre_curso: 'Cálculo Diferencial',
          codigo_curso: 'CALC-101',
          cupo_maximo: 30,
          estado: 'Disponible'
        },
        {
          id_curso: 2,
          nombre_curso: 'Programación Avanzada',
          codigo_curso: 'PROG-301',
          cupo_maximo: 25,
          estado: 'Disponible'
        }
      ];

      // WHEN: Consulto cursos disponibles
      service.getCursosDisponibles().subscribe((cursos) => {
        // THEN: Veo todos los cursos activos
        expect(cursos.length).toBe(2);
        expect(cursos[0].estado).toBe('Disponible');
        expect(cursos[1].estado).toBe('Disponible');
      });
      tick();

      const req = httpMock.expectOne(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.DISPONIBLES);
      req.flush(mockCursos);
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 2:
   * Como estudiante,
   * Quiero preinscribirme a un curso,
   * Para expresar mi interés.
   */
  describe('HU-02: Preinscribirse a Curso', () => {
    it('ACEP-CI-002: DADO que curso tiene cupos, CUANDO me preinscribo, ENTONCES preinscripción queda pendiente', fakeAsync(() => {
      // GIVEN: Curso con cupos disponibles
      const payload: any = {
        nombreSolicitud: 'Preinscripción Cálculo',
        idUsuario: mockEstudiante.id_usuario,
        idCurso: 1,
        condicionSolicitud: 'Normal'
      };

      // WHEN: Me preinscribo
      service.crearPreinscripcion(payload).subscribe((response) => {
        // THEN: Preinscripción creada
        expect(response).toBeTruthy();
      });
      tick();

      const req = httpMock.expectOne(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.PREINSCRIPCIONES);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.idCurso).toBe(1);
      req.flush({ id_solicitud: 1, mensaje: 'Preinscripción creada' });
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 3:
   * Como estudiante,
   * Quiero ver mis preinscripciones,
   * Para saber cuáles fueron aprobadas.
   */
  describe('HU-03: Ver Mis Preinscripciones', () => {
    it('ACEP-CI-003: DADO que tengo preinscripciones, CUANDO consulto, ENTONCES veo su estado', fakeAsync(() => {
      // GIVEN: Tengo preinscripciones
      const mockPreinscripciones: any[] = [
        { id: 1, nombreCurso: 'Cálculo', estado: 'PENDIENTE' },
        { id: 2, nombreCurso: 'Programación', estado: 'APROBADA' }
      ];

      // WHEN: Consulto mis preinscripciones
      service.getPreinscripcionesUsuario(mockEstudiante.id_usuario).subscribe((pre) => {
        // THEN: Veo todas con su estado
        expect(pre.length).toBe(2);
        expect(pre[0].estado).toBe('PENDIENTE');
        expect(pre[1].estado).toBe('APROBADA');
      });
      tick();

      const req = httpMock.expectOne(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/preinscripciones/usuario/${mockEstudiante.id_usuario}`);
      req.flush(mockPreinscripciones);
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 4:
   * Como estudiante con preinscripción aprobada,
   * Quiero inscribirme formalmente al curso,
   * Para quedar registrado oficialmente.
   */
  describe('HU-04: Inscripción Formal', () => {
    it('ACEP-CI-004: DADO que preinscripción aprobada, CUANDO me inscribo, ENTONCES quedo registrado', fakeAsync(() => {
      // GIVEN: Preinscripción aprobada
      const payload: any = {
        nombreSolicitud: 'Inscripción Cálculo',
        idUsuario: mockEstudiante.id_usuario,
        idCurso: 1,
        condicionSolicitud: 'Normal'
      };

      // WHEN: Me inscribo formalmente
      service.crearInscripcion(payload).subscribe((response) => {
        // THEN: Inscripción confirmada
        expect(response).toBeTruthy();
      });
      tick();

      const req = httpMock.expectOne(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.INSCRIPCIONES);
      expect(req.request.method).toBe('POST');
      req.flush({ id: 1, mensaje: 'Inscripción exitosa' });
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 5:
   * Como estudiante,
   * Quiero recibir notificaciones sobre mis preinscripciones,
   * Para estar informado.
   */
  describe('HU-05: Recibir Notificaciones', () => {
    it('ACEP-CI-005: DADO que mi preinscripción fue aprobada, CUANDO consulto notificaciones, ENTONCES veo aviso', fakeAsync(() => {
      // GIVEN: Preinscripción aprobada genera notificación
      const mockNotificaciones: any[] = [
        {
          id: 1,
          mensaje: 'Preinscripción APROBADA para Cálculo',
          leida: false
        }
      ];

      // WHEN: Consulto notificaciones
      service.getNotificacionesUsuario(mockEstudiante.id_usuario).subscribe((notif) => {
        // THEN: Veo la notificación
        expect(notif.length).toBe(1);
        expect(notif[0].mensaje).toContain('APROBADA');
        expect(notif[0].leida).toBe(false);
      });
      tick();

      const req = httpMock.expectOne(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/notificaciones/usuario/${mockEstudiante.id_usuario}`);
      req.flush(mockNotificaciones);
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 6:
   * Como estudiante,
   * Quiero marcar notificaciones como leídas,
   * Para mantener mi bandeja organizada.
   */
  describe('HU-06: Marcar Notificaciones Leídas', () => {
    it('ACEP-CI-006: DADO que tengo notificaciones, CUANDO marco como leída, ENTONCES se actualiza', fakeAsync(() => {
      // GIVEN: Notificación no leída
      const notificacionId = 1;

      // WHEN: Marco como leída
      service.marcarNotificacionLeida(notificacionId).subscribe((response) => {
        // THEN: Se actualiza correctamente
        expect(response).toBeTruthy();
      });
      tick();

      const req = httpMock.expectOne(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/notificaciones/${notificacionId}/marcar-leida`);
      expect(req.request.method).toBe('PUT');
      req.flush({ mensaje: 'Notificación marcada como leída' });
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 7:
   * Como administrador,
   * Quiero crear nuevos cursos intersemestrales,
   * Para ofrecerlos a los estudiantes.
   */
  describe('HU-07: Crear Curso (Administrador)', () => {
    it('ACEP-CI-007: DADO que soy administrador, CUANDO creo curso, ENTONCES queda disponible', fakeAsync(() => {
      // GIVEN: Datos del nuevo curso
      const nuevoCurso: any = {
        nombre_curso: 'Algoritmos Avanzados',
        codigo_curso: 'ALG-401',
        cupo_maximo: 30,
        cupo_estimado: 30,
        estado: 'Borrador',
        id_materia: 3,
        id_docente: 10
      };

      // WHEN: Creo el curso
      service.crearCurso(nuevoCurso).subscribe((response) => {
        // THEN: Curso creado exitosamente
        expect(response).toBeTruthy();
        expect(response.id_curso).toBe(5);
      });
      tick();

      const req = httpMock.expectOne(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.GESTION);
      // El backend no espera nombre_curso, solo id_materia, id_docente, etc.
      expect(req.request.body.id_materia).toBe(3);
      expect(req.request.body.id_docente).toBe(10);
      req.flush({ 
        id_curso: 5, 
        mensaje: 'Curso creado',
        nombre_curso: 'Algoritmos Avanzados',
        codigo_curso: 'ALG-401',
        periodo: '2025-1',
        grupo: 'A'
      });
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 8:
   * Como estudiante,
   * Quiero ver el seguimiento de mis solicitudes de cursos,
   * Para conocer el progreso y acciones disponibles.
   */
  describe('HU-08: Seguimiento de Solicitudes', () => {
    it('ACEP-CI-008: DADO que tengo solicitudes activas, CUANDO consulto seguimiento, ENTONCES veo progreso y acciones', fakeAsync(() => {
      // GIVEN: Estudiante con solicitudes activas
      const idSolicitud = 1;
      const mockSeguimiento: any = {
        id_solicitud: 1,
        nombre_solicitud: 'Preinscripción Cálculo',
        estado: 'PENDIENTE',
        objCursoOfertadoVerano: {
          nombre_curso: 'Cálculo Diferencial',
          estado: 'Preinscripción'
        },
        accionesDisponibles: ['ver_detalle', 'cancelar']
      };

      // WHEN: Consulto seguimiento de solicitud
      service.getSeguimientoSolicitud(idSolicitud).subscribe((seguimiento) => {
        // THEN: Veo progreso y acciones disponibles
        expect(seguimiento).toBeTruthy();
        expect(seguimiento.objCursoOfertadoVerano).toBeTruthy();
        expect(seguimiento.estado).toBeDefined();
      });
      tick();

      const req = httpMock.expectOne(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.BASE}/cursos-verano/seguimiento/${idSolicitud}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSeguimiento);
      tick();
    }));
  });
});

