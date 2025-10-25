import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EstadisticasService } from '../../../core/services/estadisticas.service';
import { AuthService } from '../../../core/services/auth.service';

/**
 * ===================================================
 * PRUEBAS DE ACEPTACIÓN - MÓDULO ESTADÍSTICO
 * ===================================================
 * 
 * Formato BDD: Given/When/Then
 * Basadas en Historias de Usuario para reportes y análisis
 */
describe('PRUEBAS DE ACEPTACIÓN - Módulo Estadístico', () => {
  let service: EstadisticasService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  const mockCoordinador = {
    id_usuario: 1,
    nombre_completo: 'Carlos Ramírez',
    codigo: '999999',
    email_usuario: 'carlos.ramirez@unicauca.edu.co',
    id_rol: 3,
    id_programa: 1,
    objRol: { id_rol: 3, nombre_rol: 'COORDINADOR' },
    objPrograma: { id_programa: 1, nombre_programa: 'Ingeniería Electrónica' }
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUsuario']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        EstadisticasService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(EstadisticasService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    authService.getUsuario.and.returnValue(mockCoordinador);
    spyOn(localStorage, 'getItem').and.returnValue('mock-token');
  });

  afterEach(() => {
    httpMock.verify();
  });

  /**
   * HISTORIA DE USUARIO 1:
   * Como coordinador,
   * Quiero ver estadísticas globales del sistema,
   * Para tener una visión general del desempeño.
   */
  describe('HU-01: Ver Estadísticas Globales', () => {
    it('ACEP-EST-001: DADO que soy coordinador, CUANDO accedo a estadísticas, ENTONCES veo resumen global', fakeAsync(() => {
      // GIVEN: Soy coordinador del sistema
      const mockEstadisticas: any = {
        totalSolicitudes: 250,
        solicitudesAprobadas: 180,
        solicitudesPendientes: 50,
        solicitudesRechazadas: 20,
        porcentajeAprobacion: 72
      };

      // WHEN: Consulto estadísticas globales
      service.getEstadisticasGlobales().subscribe((stats) => {
        // THEN: Veo todas las métricas principales
        expect(stats.totalSolicitudes).toBe(250);
        expect(stats.porcentajeAprobacion).toBe(72);
      });
      tick();

      const req = httpMock.expectOne((r) => r.url.includes('/estadisticas/globales'));
      req.flush(mockEstadisticas);
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 2:
   * Como coordinador,
   * Quiero ver estadísticas por proceso específico,
   * Para identificar cuellos de botella.
   */
  describe('HU-02: Estadísticas por Proceso', () => {
    it('ACEP-EST-002: DADO que quiero analizar paz y salvo, CUANDO consulto ese proceso, ENTONCES veo métricas específicas', fakeAsync(() => {
      // GIVEN: Quiero analizar paz y salvo
      const mockEstadisticas: any = {
        totalSolicitudes: 75,
        aprobadas: 60,
        enProceso: 10,
        rechazadas: 5
      };

      // WHEN: Consulto estadísticas del proceso
      service.getEstadisticasProceso('paz_salvo').subscribe((stats) => {
        // THEN: Veo métricas del proceso
        expect(stats.totalSolicitudes).toBe(75);
        expect(stats.aprobadas).toBe(60);
      });
      tick();

      const req = httpMock.expectOne((r) => r.url.includes('/estadisticas/proceso/paz_salvo'));
      req.flush(mockEstadisticas);
      tick();
    }));

    it('ACEP-EST-003: DADO que quiero analizar cursos, CUANDO consulto ese proceso, ENTONCES veo datos de cursos', fakeAsync(() => {
      // GIVEN: Analizar cursos intersemestrales
      const mockEstadisticas: any = {
        totalSolicitudes: 150,
        aprobadas: 120,
        enProceso: 20,
        rechazadas: 10
      };

      // WHEN: Consulto el proceso
      service.getEstadisticasProceso('cursos_intersemestrales').subscribe((stats) => {
        // THEN: Veo métricas de cursos
        expect(stats.totalSolicitudes).toBe(150);
      });
      tick();

      const req = httpMock.expectOne((r) => r.url.includes('/estadisticas/proceso/cursos_intersemestrales'));
      req.flush(mockEstadisticas);
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 3:
   * Como coordinador de programa,
   * Quiero ver estadísticas de MI programa,
   * Para evaluar el desempeño de mis estudiantes.
   */
  describe('HU-03: Estadísticas por Programa', () => {
    it('ACEP-EST-004: DADO que soy coordinador de programa, CUANDO consulto estadísticas, ENTONCES solo veo mi programa', fakeAsync(() => {
      // GIVEN: Soy coordinador de Ingeniería Electrónica
      const programaId = mockCoordinador.objPrograma.id_programa;
      const mockEstadisticas: any = {
        idPrograma: programaId,
        nombrePrograma: 'Ingeniería Electrónica',
        totalSolicitudes: 50,
        aprobadas: 40,
        enProceso: 8,
        rechazadas: 2
      };

      // WHEN: Consulto estadísticas de MI programa
      service.getEstadisticasPrograma(programaId).subscribe((stats) => {
        // THEN: Solo veo datos de Ingeniería Electrónica
        expect(stats.idPrograma).toBe(programaId);
        expect(stats.nombrePrograma).toBe('Ingeniería Electrónica');
      });
      tick();

      const req = httpMock.expectOne((r) => r.url.includes(`/estadisticas/programa/${programaId}`));
      req.flush(mockEstadisticas);
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 4:
   * Como coordinador,
   * Quiero filtrar estadísticas por período,
   * Para comparar diferentes semestres.
   */
  describe('HU-04: Filtrar por Período', () => {
    it('ACEP-EST-005: DADO que quiero ver un período específico, CUANDO aplico filtro, ENTONCES veo solo ese período', fakeAsync(() => {
      // GIVEN: Quiero ver solo período 2025-01
      const filtros = { periodo: '2025-01' };
      const mockEstadisticas: any = {
        totalSolicitudes: 100,
        solicitudesAprobadas: 80,
        solicitudesPendientes: 15,
        solicitudesRechazadas: 5
      };

      // WHEN: Aplico filtro de período
      service.getEstadisticasGlobales(filtros as any).subscribe((stats) => {
        // THEN: Veo datos del período filtrado
        expect(stats.totalSolicitudes).toBe(100);
      });
      tick();

      const req = httpMock.expectOne((r) => 
        r.url.includes('/estadisticas/globales') &&
        r.params.has('periodo')
      );
      expect(req.request.params.get('periodo')).toBe('2025-01');
      req.flush(mockEstadisticas);
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 5:
   * Como coordinador,
   * Quiero ver total de estudiantes,
   * Para conocer la población estudiantil.
   */
  describe('HU-05: Total de Estudiantes', () => {
    it('ACEP-EST-006: DADO que quiero conocer población estudiantil, CUANDO consulto total, ENTONCES veo cantidad', fakeAsync(() => {
      // GIVEN: Hay estudiantes en el sistema
      const mockTotal: any = {
        total: 1500,
        activos: 1400,
        inactivos: 100
      };

      // WHEN: Consulto total de estudiantes
      service.getTotalEstudiantes().subscribe((total: any) => {
        // THEN: Veo cantidad total
        expect(total.total).toBe(1500);
        expect(total.activos).toBe(1400);
      });
      tick();

      const req = httpMock.expectOne((r) => r.url.includes('/estadisticas/estudiantes/total'));
      req.flush(mockTotal);
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 6:
   * Como coordinador,
   * Quiero ver estado de solicitudes,
   * Para monitorear el flujo de trabajo.
   */
  describe('HU-06: Estado de Solicitudes', () => {
    it('ACEP-EST-007: DADO que quiero monitorear solicitudes, CUANDO consulto estados, ENTONCES veo distribución', fakeAsync(() => {
      // GIVEN: Hay solicitudes en diferentes estados
      const mockEstados: any = {
        total: 150,
        aprobadas: 100,
        pendientes: 30,
        rechazadas: 20
      };

      // WHEN: Consulto estado de solicitudes
      service.getEstadoSolicitudes().subscribe((estados: any) => {
        // THEN: Veo distribución por estado
        expect(estados.total).toBe(150);
        expect(estados.aprobadas).toBeGreaterThan(estados.rechazadas);
      });
      tick();

      const req = httpMock.expectOne((r) => r.url.includes('/estadisticas/solicitudes/estado'));
      req.flush(mockEstados);
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 7:
   * Como coordinador,
   * Quiero ver estadísticas por tipo de proceso,
   * Para comparar diferentes servicios.
   */
  describe('HU-07: Estadísticas por Tipo de Proceso', () => {
    it('ACEP-EST-008: DADO que quiero comparar procesos, CUANDO consulto por tipo, ENTONCES veo comparativa', fakeAsync(() => {
      // GIVEN: Hay múltiples tipos de proceso
      const mockEstadisticas: any = {
        paz_salvo: { total: 50, aprobadas: 40 },
        cursos: { total: 150, aprobadas: 130 },
        homologaciones: { total: 30, aprobadas: 25 }
      };

      // WHEN: Consulto por tipo de proceso
      service.getEstadisticasPorProceso('paz_salvo').subscribe((stats) => {
        // THEN: Puedo comparar entre procesos
        expect(stats).toBeTruthy();
      });
      tick();

      const req = httpMock.expectOne((r) => r.url.includes('/estadisticas/por-proceso'));
      req.flush(mockEstadisticas.paz_salvo);
      tick();
    }));
  });
});

