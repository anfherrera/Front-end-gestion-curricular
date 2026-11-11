import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EstadisticasService } from '../../../core/services/estadisticas.service';
import { AuthService } from '../../../core/services/auth.service';
import { ApiEndpoints } from '../../../core/utils/api-endpoints';

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
      // GIVEN: El sistema tiene solicitudes registradas
      const mockResumen: any = {
        estadisticasGlobales: { totalSolicitudes: 250, totalAprobadas: 180, totalRechazadas: 20, totalEnProceso: 50 }
      };

      // WHEN: Consulto el resumen completo sin filtros
      service.getResumenCompleto().subscribe((resumen: any) => {
        // THEN: Veo las métricas globales
        expect(resumen.estadisticasGlobales.totalSolicitudes).toBe(250);
        expect(resumen.estadisticasGlobales.totalAprobadas).toBe(180);
      });
      tick();

      const req = httpMock.expectOne((r) => r.url === ApiEndpoints.MODULO_ESTADISTICO.RESUMEN_COMPLETO);
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResumen);
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
    it('ACEP-EST-002: DADO que quiero analizar paz y salvo, CUANDO filtro por ese proceso, ENTONCES el backend recibe el proceso', fakeAsync(() => {
      // GIVEN: Quiero analizar paz y salvo
      const mockProceso: any = { estadisticasPorProceso: { 'Paz y Salvo': { totalSolicitudes: 75, aprobadas: 60 } } };

      // WHEN: Consulto las estadísticas filtradas por proceso
      service.getEstadisticasDetalladasPorProceso({ proceso: 'Paz y Salvo' }).subscribe((stats: any) => {
        // THEN: Veo las métricas del proceso
        expect(stats.estadisticasPorProceso['Paz y Salvo'].totalSolicitudes).toBe(75);
      });
      tick();

      const req = httpMock.expectOne((r) =>
        r.url === ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_POR_PROCESO && r.params.get('proceso') === 'Paz y Salvo'
      );
      req.flush(mockProceso);
      tick();
    }));

    it('ACEP-EST-003: DADO que elijo "Todos los procesos", CUANDO consulto, ENTONCES no se envía filtro de proceso', fakeAsync(() => {
      service.getEstadisticasDetalladasPorProceso({ proceso: 'Todos los procesos' }).subscribe();
      tick();

      const req = httpMock.expectOne((r) => r.url === ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_POR_PROCESO);
      expect(req.request.params.has('proceso')).toBeFalse();
      req.flush({});
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
    it('ACEP-EST-004: DADO que soy coordinador de programa, CUANDO consulto estadísticas, ENTONCES se filtran por mi programa', fakeAsync(() => {
      // GIVEN: Soy coordinador de Ingeniería Electrónica
      const programaId = mockCoordinador.objPrograma.id_programa;

      // WHEN: Consulto el resumen de MI programa
      service.getResumenCompleto({ idPrograma: programaId }).subscribe((resumen: any) => {
        // THEN: Recibo los datos de mi programa
        expect(resumen.estadisticasGlobales.totalSolicitudes).toBe(50);
      });
      tick();

      const req = httpMock.expectOne((r) =>
        r.url === ApiEndpoints.MODULO_ESTADISTICO.RESUMEN_COMPLETO && r.params.get('idPrograma') === String(programaId)
      );
      req.flush({ estadisticasGlobales: { totalSolicitudes: 50 } });
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
      const periodo = '2025-01';
      const mockEstadisticas: any = {
        totalSolicitudes: 100,
        solicitudesAprobadas: 80,
        solicitudesPendientes: 15,
        solicitudesRechazadas: 5
      };

      // WHEN: Aplico filtro de período
      service.getEstadisticasPorPeriodo(periodo).subscribe((stats) => {
        // THEN: Veo datos del período filtrado
        expect(stats.totalSolicitudes).toBe(100);
      });
      tick();

      // El backend recibe el período como query param: /estadisticas/periodo?periodoAcademico=...
      const req = httpMock.expectOne((r) =>
        r.url.endsWith('/estadisticas/periodo') && r.params.get('periodoAcademico') === periodo
      );
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
      const mockTotal = {
        totalEstudiantes: 1500,
        fechaConsulta: new Date().toISOString(),
        descripcion: 'Total actualizado'
      };

      // WHEN: Consulto total de estudiantes
      service.getTotalEstudiantes().subscribe((total) => {
        // THEN: Veo cantidad total
        expect(total.totalEstudiantes).toBe(1500);
      });
      tick();

      const req = httpMock.expectOne((r) => r.url === ApiEndpoints.MODULO_ESTADISTICO.TOTAL_ESTUDIANTES);
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
      const mockEstados = {
        totalSolicitudes: 150,
        estados: {
          APROBADA: { cantidad: 100, porcentaje: 66.6, descripcion: '', color: '', icono: '' },
          PENDIENTE: { cantidad: 30, porcentaje: 20, descripcion: '', color: '', icono: '' },
          RECHAZADA: { cantidad: 20, porcentaje: 13.4, descripcion: '', color: '', icono: '' }
        },
        fechaConsulta: new Date().toISOString(),
        descripcion: 'Distribución actual'
      };

      // WHEN: Consulto estado de solicitudes
      service.getEstadoSolicitudes().subscribe((estados) => {
        // THEN: Veo distribución por estado
        expect(estados.totalSolicitudes).toBe(150);
        expect(estados.estados?.['APROBADA']?.cantidad).toBeGreaterThan(estados.estados?.['RECHAZADA']?.cantidad || 0);
      });
      tick();

      const req = httpMock.expectOne((r) => r.url === ApiEndpoints.MODULO_ESTADISTICO.ESTADO_SOLICITUDES);
      req.flush(mockEstados);
      tick();
    }));
  });

  /**
   * HISTORIA DE USUARIO 7:
   * Como coordinador,
   * Quiero comparar los procesos entre sí,
   * Para saber cuál concentra más solicitudes.
   */
  describe('HU-07: Estadísticas por Tipo de Proceso', () => {
    it('ACEP-EST-008: DADO que quiero comparar procesos, CUANDO consulto sin filtro, ENTONCES veo todos los procesos', fakeAsync(() => {
      const mockComparativa: any = {
        estadisticasPorProceso: {
          'Paz y Salvo': { totalSolicitudes: 50 },
          'Cursos de Verano': { totalSolicitudes: 150 },
          'Homologación': { totalSolicitudes: 30 }
        }
      };

      service.getEstadisticasDetalladasPorProceso().subscribe((stats: any) => {
        expect(Object.keys(stats.estadisticasPorProceso).length).toBe(3);
      });
      tick();

      const req = httpMock.expectOne((r) => r.url === ApiEndpoints.MODULO_ESTADISTICO.ESTADISTICAS_POR_PROCESO);
      expect(req.request.params.has('proceso')).toBeFalse();
      req.flush(mockComparativa);
      tick();
    }));
  });

});

