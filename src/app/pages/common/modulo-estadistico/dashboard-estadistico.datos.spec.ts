import {
  filtrosDelFormulario,
  filtrosParaBackend,
  filtrosParaExportar,
  formatearNombreProceso,
  generarKPIs,
  resumenDesdeAPI,
  resumenDesdeEndpoints
} from './dashboard-estadistico.datos';
import { EstadisticasPorProcesoResponse, EstadoSolicitudesResponse, ResumenCompletoAPI } from '../../../core/models/estadisticas.model';

describe('dashboard-estadistico.datos', () => {
  const sinIds = () => null;

  describe('filtrosParaBackend', () => {
    it('quita los valores vacíos, "todos" y "Todos los procesos"', () => {
      expect(filtrosParaBackend({ periodoAcademico: 'todos', idPrograma: 0, proceso: 'Todos los procesos' })).toEqual({});
      expect(filtrosParaBackend({ periodoAcademico: ' ', proceso: '' })).toEqual({});
    });

    it('conserva los filtros válidos sin espacios', () => {
      expect(filtrosParaBackend({ periodoAcademico: ' 2025-2 ', idPrograma: 3, proceso: ' Paz y Salvo ' }))
        .toEqual({ periodoAcademico: '2025-2', idPrograma: 3, proceso: 'Paz y Salvo' });
    });
  });

  describe('filtrosDelFormulario', () => {
    it('marca el período actual cuando el período está vacío', () => {
      const r = filtrosDelFormulario({ proceso: '', idPrograma: '', periodoAcademico: '' });
      expect(r.periodoActual).toBeTrue();
      expect(r.filtros).toEqual({});
    });

    it('no filtra por período con "todos" y convierte el programa a número', () => {
      const r = filtrosDelFormulario({ proceso: 'ECAES', idPrograma: '4', periodoAcademico: 'todos' });
      expect(r.periodoActual).toBeFalse();
      expect(r.filtros).toEqual({ proceso: 'ECAES', idPrograma: 4 });
    });

    it('ignora "Todos los programas"', () => {
      expect(filtrosDelFormulario({ idPrograma: 'Todos los programas', periodoAcademico: '2025-1' }).filtros)
        .toEqual({ periodoAcademico: '2025-1' });
    });
  });

  it('filtrosParaExportar envía el período tal como está en el formulario', () => {
    expect(filtrosParaExportar({ proceso: 'Todos los procesos', idPrograma: '2', periodoAcademico: 'todos' }))
      .toEqual({ idPrograma: 2, periodoAcademico: 'todos' });
    expect(filtrosParaExportar(undefined)).toEqual({});
  });

  it('resumenDesdeAPI convierte procesos y programas', () => {
    const api = {
      estadisticasGlobales: { totalSolicitudes: 10, totalAprobadas: 4, totalRechazadas: 1, totalEnProceso: 2, porPrograma: { Sistemas: 7 } },
      porTipoProceso: { 'Paz y Salvo': { totalSolicitudes: 10, totalAprobadas: 4, totalRechazadas: 1, totalEnProceso: 2, porcentajeAprobacion: 40 } },
      totalProgramas: 1,
      fechaGeneracion: '2026-01-01'
    } as unknown as ResumenCompletoAPI;

    const resumen = resumenDesdeAPI(api, nombre => nombre === 'Sistemas' ? 5 : null);
    expect(resumen.estadisticasGlobales.solicitudesAprobadas).toBe(4);
    expect(resumen.estadisticasPorProceso[0].nombreProceso).toBe('paz-y-salvo');
    expect(resumen.estadisticasPorPrograma[0]).toEqual(jasmine.objectContaining({ idPrograma: 5, totalSolicitudes: 7 }));
    expect(resumen.ultimaActualizacion).toBe('2026-01-01');
  });

  describe('resumenDesdeEndpoints', () => {
    const porProceso = {
      estadisticasPorProceso: {
        ECAES: { proceso: 'ECAES', totalSolicitudes: 4, aprobadas: 2, rechazadas: 1, enProceso: 1, enviadas: 0 },
        Reingreso: { proceso: 'Reingreso', totalSolicitudes: 6, aprobadas: 3, rechazadas: 0, enProceso: 1, enviadas: 2 }
      }
    } as unknown as EstadisticasPorProcesoResponse;

    it('toma los totales del estado de solicitudes y suma si el total viene en 0', () => {
      const estado = {
        totalSolicitudes: 0,
        estados: { APROBADA: { cantidad: 5 }, RECHAZADA: { cantidad: 1 }, ENVIADA: { cantidad: 2 }, EN_PROCESO: { cantidad: 2 } }
      } as unknown as EstadoSolicitudesResponse;
      const r = resumenDesdeEndpoints(estado, porProceso, null, 9, sinIds);
      expect(r.estadisticasGlobales.totalSolicitudes).toBe(10);
      expect(r.estadisticasGlobales.totalEstudiantes).toBe(9);
    });

    it('suma por proceso si no hay estado de solicitudes', () => {
      const r = resumenDesdeEndpoints(null, porProceso, { estudiantesPorPrograma: { A: 1, B: 2 } } as never, 0, sinIds);
      expect(r.estadisticasGlobales).toEqual(jasmine.objectContaining({
        totalSolicitudes: 10, solicitudesAprobadas: 5, solicitudesEnviadas: 2, totalProgramas: 2
      }));
      expect(r.estadisticasPorProceso.find(p => p.nombreProceso === 'reingreso')?.porcentajeAprobacion).toBe(50);
    });
  });

  it('generarKPIs incluye el total de estudiantes', () => {
    const kpis = generarKPIs(null, 12);
    expect(kpis.length).toBe(7);
    expect(kpis.find(k => k.titulo === 'Estudiantes')?.valor).toBe(12);
  });

  it('formatearNombreProceso traduce los nombres antiguos', () => {
    expect(formatearNombreProceso('pruebas-ecaes')).toBe('ECAES');
    expect(formatearNombreProceso('Paz y Salvo')).toBe('Paz y Salvo');
  });
});
