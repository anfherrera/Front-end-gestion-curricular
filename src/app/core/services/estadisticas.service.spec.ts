import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EstadisticasService } from './estadisticas.service';
import { ApiEndpoints } from '../utils/api-endpoints';
import { EstadoSolicitudesResponse, TotalEstudiantesResponse } from '../models/estadisticas/generales.model';
import { ProgramaDTORespuesta } from '../models/programa.interface';
import { Observable } from 'rxjs';

describe('EstadisticasService - Pruebas Unitarias', () => {
  let service: EstadisticasService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EstadisticasService],
    });

    service = TestBed.inject(EstadisticasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('1. Configuración del Servicio', () => {
    it('EST-001: Debe crear el servicio correctamente', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('5. Resumen Completo', () => {
    it('EST-012: Debe obtener resumen completo de estadísticas', (done) => {
      const mockResumen = {
        estadisticasGlobales: {
          totalSolicitudes: 200,
          solicitudesAprobadas: 150,
        },
        estadisticasPorProceso: [],
        estadisticasPorPrograma: [],
        tendencias: [],
      };

      service.getResumenCompleto().subscribe((resumen) => {
        expect(resumen).toBeTruthy();
        expect(resumen.estadisticasGlobales).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne((request) => request.url.includes('/estadisticas/resumen'));
      req.flush(mockResumen);
    });
  });

  describe('7. Total de Estudiantes', () => {
    it('EST-015: Debe obtener total de estudiantes', (done) => {
      const mockResponse: TotalEstudiantesResponse = {
        totalEstudiantes: 1500,
        fechaConsulta: '2025-01-15',
        descripcion: 'Total de estudiantes',
      };

      service.getTotalEstudiantes().subscribe((datos) => {
        expect(datos.totalEstudiantes).toBe(1500);
        done();
      });

      const req = httpMock.expectOne((request) => request.url.includes('/estadisticas/total-estudiantes'));
      req.flush(mockResponse);
    });
  });

  describe('8. Tendencias y Comparativas', () => {
    it('EST-016: Debe obtener tendencias comparativas', (done) => {
      service.getTendenciasComparativas().subscribe(() => done());

      const req = httpMock.expectOne((request) => request.url.includes('/estadisticas/tendencias'));
      req.flush({});
    });

    it('EST-017: Debe obtener tendencias temporales de cursos de verano', (done) => {
      service.getCursosVeranoTendenciasTemporales({ periodoAcademico: '2026-1', idPrograma: 0 }).subscribe((datos) => {
        expect(datos.tendenciasTemporales).toEqual([]);
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url.endsWith('/estadisticas/cursos-verano/tendencias-temporales')
      );
      // Aquí idPrograma 0 sí se envía: solo se omiten undefined y null.
      expect(req.request.params.get('periodoAcademico')).toBe('2026-1');
      expect(req.request.params.get('idPrograma')).toBe('0');
      req.flush({ tendenciasTemporales: [] });
    });
  });

  describe('9. Estadísticas de Cursos de Verano', () => {
    it('EST-018: Debe obtener estadísticas de cursos de verano sin filtros', (done) => {
      service.getCursosVeranoEstadisticas().subscribe(() => done());

      const req = httpMock.expectOne((request) => request.url.endsWith('/estadisticas/cursos-verano'));
      expect(req.request.params.keys()).toEqual([]);
      req.flush({});
    });

    it('EST-019: Debe obtener estadísticas de cursos de verano por período y programa', (done) => {
      service.getCursosVeranoEstadisticas({ periodoAcademico: '2026-2', idPrograma: 4 }).subscribe(() => done());

      const req = httpMock.expectOne((request) => request.url.endsWith('/estadisticas/cursos-verano'));
      expect(req.request.params.get('periodoAcademico')).toBe('2026-2');
      expect(req.request.params.get('idPrograma')).toBe('4');
      req.flush({});
    });
  });

  describe('10. Estado de Solicitudes', () => {
    it('EST-020: Debe obtener estado de solicitudes', (done) => {
      const mockEstado: EstadoSolicitudesResponse = {
        totalSolicitudes: 150,
        tasaResolucion: 0.87,
        fechaConsulta: '2025-01-15',
      };

      service.getEstadoSolicitudes().subscribe((datos) => {
        expect(datos.totalSolicitudes).toBe(150);
        expect(datos.tasaResolucion).toBe(0.87);
        done();
      });

      const req = httpMock.expectOne((request) => request.url.includes('/estadisticas/estado-solicitudes'));
      req.flush(mockEstado);
    });
  });

  describe('11. Manejo de Errores', () => {
    it('EST-023: Debe manejar error 500 del servidor', (done) => {
      service.getResumenCompleto().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne((request) => request.url.includes('/estadisticas/resumen'));
      req.flush({ message: 'Error interno' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('12. Exportación de Datos', () => {
    // No hay exportación a CSV: el backend exporta a PDF y a Excel (EST-7, paso 9: ?formato=pdf|excel).
    const REPORTES = ApiEndpoints.MODULO_ESTADISTICO.REPORTES;
    const REPORTES_VERANO = ApiEndpoints.MODULO_ESTADISTICO.CURSOS_VERANO_REPORTES;
    const EXCEL = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    it('EST-024: Debe exportar estadísticas como PDF con los filtros elegidos', (done) => {
      const pdf = new Blob(['%PDF'], { type: 'application/pdf' });
      service.exportarPDF({ proceso: 'Reingreso', idPrograma: 2, periodoAcademico: '2026-1' }).subscribe((blob) => {
        expect(blob).toBe(pdf);
        done();
      });

      const req = httpMock.expectOne({
        method: 'GET',
        url: `${REPORTES}?formato=pdf&proceso=Reingreso&idPrograma=2&periodoAcademico=2026-1`,
      });
      expect(req.request.responseType).toBe('blob');
      expect(req.request.headers.get('Accept')).toBe('application/pdf');
      req.flush(pdf);
    });

    it('EST-025: Debe exportar estadísticas como Excel', (done) => {
      service.exportarExcel().subscribe(() => done());

      const req = httpMock.expectOne({ method: 'GET', url: `${REPORTES}?formato=excel` });
      expect(req.request.responseType).toBe('blob');
      expect(req.request.headers.get('Accept')).toBe(EXCEL);
      req.flush(new Blob());
    });

    it('exporta el Excel con filtros y los reportes de cursos de verano', () => {
      service.exportarExcel({ proceso: 'ECAES', idPrograma: 1, periodoAcademico: '2025-2' }).subscribe();
      httpMock
        .expectOne({
          method: 'GET',
          url: `${REPORTES}?formato=excel&proceso=ECAES&idPrograma=1&periodoAcademico=2025-2`,
        })
        .flush(new Blob());

      service.exportarReporteCursosVerano({ periodoAcademico: '2026-1', idPrograma: 3 }).subscribe();
      const pdf = httpMock.expectOne({
        method: 'GET',
        url: `${REPORTES_VERANO}?formato=pdf&periodoAcademico=2026-1&idPrograma=3`,
      });
      expect(pdf.request.headers.get('Accept')).toBe('application/pdf');
      pdf.flush(new Blob());

      service.exportarExcelCursosVerano().subscribe();
      const xls = httpMock.expectOne({ method: 'GET', url: `${REPORTES_VERANO}?formato=excel` });
      expect(xls.request.responseType).toBe('blob');
      expect(xls.request.headers.get('Accept')).toBe(EXCEL);
      xls.flush(new Blob());

      service.exportarExcelCursosVerano({ periodoAcademico: '2026-2', idPrograma: 5 }).subscribe();
      httpMock
        .expectOne({ method: 'GET', url: `${REPORTES_VERANO}?formato=excel&periodoAcademico=2026-2&idPrograma=5` })
        .flush(new Blob());

      service.exportarReporteCursosVerano().subscribe();
      httpMock.expectOne({ method: 'GET', url: `${REPORTES_VERANO}?formato=pdf` }).flush(new Blob());
    });
  });

  describe('13. Filtros de las consultas', () => {
    interface Filtros {
      periodoAcademico?: string;
      idPrograma?: number;
      proceso?: string;
    }
    const consultas: [string, (f: Filtros) => Observable<unknown>, string][] = [
      ['getResumenCompleto', (f) => service.getResumenCompleto(f), '/estadisticas/resumen-completo'],
      [
        'getEstudiantesPorPrograma',
        (f) => service.getEstudiantesPorPrograma(f),
        '/estadisticas/estudiantes-por-programa',
      ],
      [
        'getEstadisticasDetalladasPorProceso',
        (f) => service.getEstadisticasDetalladasPorProceso(f),
        '/estadisticas/estadisticas-por-proceso',
      ],
      ['getEstadoSolicitudes', (f) => service.getEstadoSolicitudes(f), '/estadisticas/estado-solicitudes'],
      [
        'getTendenciasComparativas',
        (f) => service.getTendenciasComparativas(f),
        '/estadisticas/tendencias-comparativas',
      ],
      [
        'getEstadisticasPorProgramaMejoradas',
        (f) => service.getEstadisticasPorProgramaMejoradas(f),
        '/estadisticas/por-programa',
      ],
      [
        'getEstadisticasPorPeriodoMejoradas',
        (f) => service.getEstadisticasPorPeriodoMejoradas(f),
        '/estadisticas/por-periodo',
      ],
    ];

    for (const [nombre, consulta, ruta] of consultas) {
      it(`${nombre} envía los filtros válidos recortados`, () => {
        consulta({ periodoAcademico: ' 2026-1 ', idPrograma: 2, proceso: ' Reingreso ' }).subscribe();
        const req = httpMock.expectOne((request) => request.url.endsWith(ruta));
        expect(req.request.params.get('periodoAcademico')).toBe('2026-1');
        expect(req.request.params.get('idPrograma')).toBe('2');
        expect(req.request.params.get('proceso')).toBe('Reingreso');
        req.flush({});
      });

      it(`${nombre} omite los filtros vacíos, el programa 0 o NaN y "Todos los procesos"`, () => {
        consulta({ periodoAcademico: '  ', idPrograma: 0, proceso: 'Todos los procesos' }).subscribe();
        consulta({ idPrograma: NaN, proceso: ' ' }).subscribe();
        consulta({}).subscribe();
        const reqs = httpMock.match((request) => request.url.endsWith(ruta));
        expect(reqs.length).toBe(3);
        for (const req of reqs) {
          // Solo la consulta por proceso añade la marca de tiempo "t" para evitar la caché.
          expect(req.request.params.keys().filter((k) => k !== 't')).toEqual([]);
          req.flush({});
        }
      });
    }

    it('getEstadisticasDetalladasPorProceso añade una marca de tiempo contra la caché', () => {
      service.getEstadisticasDetalladasPorProceso().subscribe();
      const req = httpMock.expectOne((request) => request.url.endsWith('/estadisticas/estadisticas-por-proceso'));
      expect(Number(req.request.params.get('t'))).toBeGreaterThan(0);
      req.flush({});
    });

    it('getResumenCompleto sin filtros no envía parámetros', () => {
      service.getResumenCompleto().subscribe();
      const req = httpMock.expectOne((request) => request.url.endsWith('/estadisticas/resumen-completo'));
      expect(req.request.params.keys()).toEqual([]);
      req.flush({});
    });
  });

  describe('14. Catálogo de programas', () => {
    const programas: ProgramaDTORespuesta[] = [
      { id_programa: 3, codigo: 'PIS', nombre_programa: 'Ingeniería de Sistemas' },
      { id_programa: 1, codigo: 'PIET', nombre_programa: 'Ingeniería Electrónica y Telecomunicaciones' },
      { id_programa: 4, codigo: 'TT', nombre_programa: 'Tecnología en Telemática' },
    ];
    const listar = () => httpMock.expectOne((request) => request.url.endsWith('/programas'));

    it('normaliza los nombres de programa: sin tildes, en minúsculas y con espacios simples', () => {
      expect(EstadisticasService.normalizarNombrePrograma('  Ingeniería   de Sistemas ')).toBe(
        'ingenieria de sistemas'
      );
      expect(EstadisticasService.normalizarNombrePrograma('TECNOLOGÍA EN TELEMÁTICA')).toBe('tecnologia en telematica');
      expect(EstadisticasService.normalizarNombrePrograma(undefined as unknown as string)).toBe('');
    });

    it('resuelve el id del programa por su nombre normalizado y guarda el catálogo en caché', () => {
      let ids: Map<string, number> | undefined;
      service.getIdsProgramaPorNombre().subscribe((m) => (ids = m));
      listar().flush(programas);
      expect(ids?.get('ingenieria de sistemas')).toBe(3);
      expect(ids?.get('tecnologia en telematica')).toBe(4);

      // La segunda llamada usa la caché: no hay otra petición.
      let otra: Map<string, number> | undefined;
      service.getIdsProgramaPorNombre().subscribe((m) => (otra = m));
      httpMock.expectNone((request) => request.url.endsWith('/programas'));
      expect(otra).toBe(ids);
    });

    it('si el catálogo falla devuelve un mapa vacío y vuelve a pedirlo la próxima vez', () => {
      let ids: Map<string, number> | undefined;
      service.getIdsProgramaPorNombre().subscribe((m) => (ids = m));
      listar().flush('error', { status: 500, statusText: 'Server Error' });
      expect(ids?.size).toBe(0);

      service.getIdsProgramaPorNombre().subscribe((m) => (ids = m));
      listar().flush(null);
      expect(ids?.size).toBe(0);
    });

    it('da los programas para el filtro ordenados por nombre, o una lista vacía si falla', () => {
      let lista: { id: number; nombre: string }[] = [];
      service.getProgramasDisponibles().subscribe((l) => (lista = l));
      listar().flush(programas);
      expect(lista.map((p) => p.id)).toEqual([3, 1, 4]);
      expect(lista[1]).toEqual({ id: 1, nombre: 'Ingeniería Electrónica y Telecomunicaciones' });

      service.getProgramasDisponibles().subscribe((l) => (lista = l));
      listar().flush('error', { status: 500, statusText: 'Server Error' });
      expect(lista).toEqual([]);
    });

    it('lista los procesos con los nombres que espera el backend', () => {
      expect(service.getProcesosDisponibles()).toEqual([
        'Reingreso',
        'Homologación',
        'Cursos de Verano',
        'ECAES',
        'Paz y Salvo',
      ]);
    });
  });
});
