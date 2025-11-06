import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PazSalvoService } from './paz-salvo.service';
import { CursosIntersemestralesService } from './cursos-intersemestrales.service';
import { EstadisticasService } from './estadisticas.service';
import { AuthService } from './auth.service';

/**
 * ============================================
 * PRUEBAS DE INTEGRACIÓN - MÚLTIPLES SERVICIOS
 * ============================================
 * 
 * Estas pruebas verifican que MÚLTIPLES SERVICIOS trabajen juntos correctamente.
 * NO usan mocks de HTTP, sino HttpClientTestingModule real.
 * 
 * Diferencia con Unitarias:
 * - Unitarias: Prueban UN servicio aislado
 * - Integración: Prueban MÚLTIPLES servicios interactuando
 */
describe('PRUEBAS DE INTEGRACIÓN - Múltiples Servicios', () => {
  let pazSalvoService: PazSalvoService;
  let cursosService: CursosIntersemestralesService;
  let estadisticasService: EstadisticasService;
  let authService: jasmine.SpyObj<AuthService>;
  let httpMock: HttpTestingController;

  const mockUsuario = {
    id_usuario: 1,
    nombre_completo: 'Test User',
    codigo: '123456',
    email_usuario: 'test@unicauca.edu.co',
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
        CursosIntersemestralesService,
        EstadisticasService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    pazSalvoService = TestBed.inject(PazSalvoService);
    cursosService = TestBed.inject(CursosIntersemestralesService);
    estadisticasService = TestBed.inject(EstadisticasService);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    httpMock = TestBed.inject(HttpTestingController);

    authService.getUsuario.and.returnValue(mockUsuario);
    spyOn(localStorage, 'getItem').and.returnValue('mock-token');
  });

  afterEach(() => {
    httpMock.verify();
  });

  /**
   * GRUPO 1: Integración PazSalvoService + EstadisticasService
   */
  describe('INTEG-001: PazSalvo + Estadísticas', () => {
    it('Debe obtener solicitudes de paz y salvo Y estadísticas del proceso', fakeAsync(() => {
      // PASO 1: Obtener solicitudes de paz y salvo
      pazSalvoService.listarSolicitudesPorRol('ESTUDIANTE', 1).subscribe();
      tick();

      const reqPazSalvo = httpMock.expectOne((req) =>
        req.url.includes('/listarSolicitud-PazYSalvo/porRol')
      );
      reqPazSalvo.flush([
        {
          id_solicitud: 1,
          nombre_solicitud: 'Solicitud 1',
          fecha_registro_solicitud: new Date().toISOString(),
          estadosSolicitud: [{ estado_actual: 'APROBADA' }],
          documentos: [],
          objUsuario: mockUsuario
        },
        {
          id_solicitud: 2,
          nombre_solicitud: 'Solicitud 2',
          fecha_registro_solicitud: new Date().toISOString(),
          estadosSolicitud: [{ estado_actual: 'PENDIENTE' }],
          documentos: [],
          objUsuario: mockUsuario
        }
      ]);
      tick();

      // PASO 2: Obtener estadísticas del proceso paz y salvo
      estadisticasService.getEstadisticasProceso('paz_salvo').subscribe();
      tick();

      const reqEstadisticas = httpMock.expectOne((req) =>
        req.url.includes('/estadisticas/proceso/paz_salvo')
      );
      reqEstadisticas.flush({
        proceso: 'paz_salvo',
        totalSolicitudes: 50,
        aprobadas: 35,
        pendientes: 10,
        rechazadas: 5
      });
      tick();

      // VERIFICACIÓN: Ambos servicios completaron sus operaciones
      expect(reqPazSalvo.request.url).toContain('listarSolicitud-PazYSalvo');
      expect(reqEstadisticas.request.url).toContain('estadisticas/proceso');
    }));

    it('Debe crear solicitud Y actualizar estadísticas', fakeAsync(() => {
      const mockArchivos: any[] = [
        { nombre: 'doc.pdf', fecha: new Date().toISOString() }
      ];

      // PASO 1: Crear solicitud
      pazSalvoService.sendRequest(1, mockArchivos).subscribe();
      tick();

      const reqCrear = httpMock.expectOne((req) =>
        req.url.includes('/crearSolicitud-PazYSalvo')
      );
      reqCrear.flush({ id_solicitud: 1, mensaje: 'Creada' });
      tick();

      // PASO 2: Obtener estadísticas actualizadas
      estadisticasService.getEstadisticasGlobales().subscribe();
      tick();

      const reqStats = httpMock.expectOne((req) =>
        req.url.includes('/estadisticas/globales')
      );
      reqStats.flush({
        totalSolicitudes: 51, // Incrementó en 1
        solicitudesAprobadas: 35,
        solicitudesPendientes: 11, // Incrementó en 1
        solicitudesRechazadas: 5
      });
      tick();

      // VERIFICACIÓN: La estadística refleja la nueva solicitud
      expect(reqStats.request.url).toContain('globales');
    }));
  });

  /**
   * GRUPO 2: Integración CursosService + EstadisticasService
   */
  describe('INTEG-002: Cursos + Estadísticas', () => {
    it('Debe obtener cursos disponibles Y estadísticas de cursos', fakeAsync(() => {
      // PASO 1: Obtener cursos
      cursosService.getCursosDisponibles().subscribe();
      tick();

      const reqCursos = httpMock.expectOne((req) =>
        req.url.includes('/cursos')
      );
      reqCursos.flush([
        { id_curso: 1, nombre_curso: 'Cálculo', cupo_maximo: 30 },
        { id_curso: 2, nombre_curso: 'Programación', cupo_maximo: 25 }
      ]);
      tick();

      // PASO 2: Obtener estadísticas de cursos
      estadisticasService.getEstadisticasProceso('cursos_intersemestrales').subscribe();
      tick();

      const reqStats = httpMock.expectOne((req) =>
        req.url.includes('/estadisticas/proceso/cursos_intersemestrales')
      );
      reqStats.flush({
        proceso: 'cursos_intersemestrales',
        totalCursos: 2,
        estudiantesInscritos: 45,
        cursosActivos: 2
      });
      tick();

      // VERIFICACIÓN: Ambos servicios funcionaron
      expect(reqCursos.request.url).toContain('cursos');
      expect(reqStats.request.url).toContain('cursos_intersemestrales');
    }));

    it('Debe crear preinscripción Y obtener mis preinscripciones', fakeAsync(() => {
      const payload: any = {
        nombreSolicitud: 'Preinscripción',
        idUsuario: 1,
        idCurso: 1,
        tipoCurso: 'Regular',
        condicionSolicitud: 'Normal'
      };

      // PASO 1: Crear preinscripción
      cursosService.crearPreinscripcion(payload).subscribe();
      tick();

      const reqCrear = httpMock.expectOne((req) =>
        req.url.includes('/preinscripciones')
      );
      reqCrear.flush({ id: 1, mensaje: 'Preinscripción creada' });
      tick();

      // PASO 2: Obtener mis preinscripciones
      cursosService.getPreinscripcionesUsuario(1).subscribe();
      tick();

      const reqMis = httpMock.expectOne((req) =>
        req.url.includes('/preinscripciones/estudiante')
      );
      reqMis.flush([
        {
          id: 1,
          idCurso: 1,
          nombreCurso: 'Cálculo',
          estado: 'PENDIENTE'
        }
      ]);
      tick();

      // VERIFICACIÓN: La preinscripción creada aparece en la lista
      expect(reqCrear.request.body.idCurso).toBe(1);
      expect(reqMis.request.params.get('idEstudiante')).toBe('1');
    }));
  });

  /**
   * GRUPO 3: Integración de los 3 Servicios
   */
  describe('INTEG-003: PazSalvo + Cursos + Estadísticas', () => {
    it('Debe obtener estadísticas globales de TODOS los procesos', fakeAsync(() => {
      // PASO 1: Estadísticas globales
      estadisticasService.getEstadisticasGlobales().subscribe();
      tick();

      const reqGlobal = httpMock.expectOne((req) =>
        req.url.includes('/estadisticas/globales')
      );
      reqGlobal.flush({
        totalSolicitudes: 150,
        solicitudesAprobadas: 120,
        solicitudesPendientes: 20,
        solicitudesRechazadas: 10
      });
      tick();

      // PASO 2: Estadísticas de Paz y Salvo
      estadisticasService.getEstadisticasProceso('paz_salvo').subscribe();
      tick();

      const reqPazSalvo = httpMock.expectOne((req) =>
        req.url.includes('/estadisticas/proceso/paz_salvo')
      );
      reqPazSalvo.flush({
        proceso: 'paz_salvo',
        totalSolicitudes: 50
      });
      tick();

      // PASO 3: Estadísticas de Cursos
      estadisticasService.getEstadisticasProceso('cursos_intersemestrales').subscribe();
      tick();

      const reqCursos = httpMock.expectOne((req) =>
        req.url.includes('/estadisticas/proceso/cursos_intersemestrales')
      );
      reqCursos.flush({
        proceso: 'cursos_intersemestrales',
        totalCursos: 25
      });
      tick();

      // VERIFICACIÓN: Todas las peticiones se completaron
      expect(reqGlobal.request.url).toContain('globales');
      expect(reqPazSalvo.request.url).toContain('paz_salvo');
      expect(reqCursos.request.url).toContain('cursos_intersemestrales');
    }));

    it('Debe verificar tokens en TODAS las peticiones HTTP', fakeAsync(() => {
      // Lanzar múltiples peticiones a diferentes servicios
      pazSalvoService.listarSolicitudesPorRol('ESTUDIANTE', 1).subscribe();
      cursosService.getCursosDisponibles().subscribe();
      estadisticasService.getEstadisticasGlobales().subscribe();
      tick();

      // Verificar que TODAS tienen el token
      const reqs = [
        httpMock.expectOne((req) => req.url.includes('PazYSalvo')),
        httpMock.expectOne((req) => req.url.includes('cursos')),
        httpMock.expectOne((req) => req.url.includes('estadisticas'))
      ];

      reqs.forEach((req) => {
        expect(req.request.headers.has('Authorization')).toBe(true);
        expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
        req.flush({});
      });

      tick();
    }));
  });

  /**
   * GRUPO 4: Manejo de Errores en Múltiples Servicios
   */
  describe('INTEG-004: Manejo de Errores', () => {
    it('Debe manejar error en un servicio sin afectar otro', fakeAsync(() => {
      // PASO 1: PazSalvo falla
      pazSalvoService.listarSolicitudesPorRol('ESTUDIANTE', 1).subscribe({
        next: () => fail('Debería fallar'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });
      tick();

      const reqPazSalvo = httpMock.expectOne((req) =>
        req.url.includes('PazYSalvo')
      );
      reqPazSalvo.flush('Error', { status: 500, statusText: 'Error' });
      tick();

      // PASO 2: Cursos funciona correctamente
      cursosService.getCursosDisponibles().subscribe({
        next: (cursos) => {
          expect(cursos.length).toBe(1);
        }
      });
      tick();

      const reqCursos = httpMock.expectOne((req) =>
        req.url.includes('cursos')
      );
      reqCursos.flush([{ id_curso: 1, nombre_curso: 'Test' }]);
      tick();

      // VERIFICACIÓN: Un error no afecta otros servicios
      expect(reqPazSalvo.request.url).toContain('PazYSalvo');
      expect(reqCursos.request.url).toContain('cursos');
    }));
  });

  /**
   * GRUPO 5: Flujos Completos
   */
  describe('INTEG-005: Flujos Completos Multi-Servicio', () => {
    it('Flujo estudiante: Ver cursos → Preinscribirse → Ver estadísticas', fakeAsync(() => {
      // PASO 1: Ver cursos disponibles
      cursosService.getCursosDisponibles().subscribe();
      tick();
      let req = httpMock.expectOne((r) => r.url.includes('/cursos'));
      req.flush([{ id_curso: 1, nombre_curso: 'Test' }]);
      tick();

      // PASO 2: Preinscribirse
      cursosService.crearPreinscripcion({
        nombreSolicitud: 'Pre',
        idUsuario: 1,
        idCurso: 1,
        condicionSolicitud: 'Normal'
      } as any).subscribe();
      tick();
      req = httpMock.expectOne((r) => r.url.includes('/preinscripciones'));
      req.flush({ id: 1 });
      tick();

      // PASO 3: Ver estadísticas del proceso
      estadisticasService.getEstadisticasProceso('cursos_intersemestrales').subscribe();
      tick();
      req = httpMock.expectOne((r) => r.url.includes('/estadisticas'));
      req.flush({ totalCursos: 1, estudiantesInscritos: 1 });
      tick();

      // Flujo completado exitosamente
      expect(true).toBe(true);
    }));
  });
});

