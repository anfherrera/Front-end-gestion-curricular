import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  CursosIntersemestralesService,
  CursoOfertadoVerano,
  CreatePreinscripcionDTO,
  CreateInscripcionDTO,
  SolicitudCursoVerano
} from './cursos-intersemestrales.service';
import { AuthService } from './auth.service';
import { ApiEndpoints } from '../utils/api-endpoints';
import { environment } from '../../../environments/environment';

describe('CursosIntersemestralesService - Cursos de Verano', () => {
  let service: CursosIntersemestralesService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  const BASE_URL = `${environment.apiUrl}/cursos-intersemestrales`;

  const mockUsuario = {
    id_usuario: 1,
    nombre_completo: 'Test User',
    codigo: '123456',
    email_usuario: 'test@unicauca.edu.co',
    objRol: { id_rol: 1, nombre_rol: 'ESTUDIANTE' }
  };

  const buildCurso = (overrides: Partial<CursoOfertadoVerano> = {}): CursoOfertadoVerano => ({
    id_curso: overrides.id_curso ?? 1,
    nombre_curso: overrides.nombre_curso ?? 'Matemáticas Avanzadas',
    codigo_curso: overrides.codigo_curso ?? 'MAT-401',
    descripcion: overrides.descripcion ?? 'Curso de prueba',
    fecha_inicio: overrides.fecha_inicio ?? new Date('2025-06-01'),
    fecha_fin: overrides.fecha_fin ?? new Date('2025-06-30'),
    periodoAcademico: overrides.periodoAcademico ?? '2025-1',
    cupo_maximo: overrides.cupo_maximo ?? 30,
    cupo_disponible: overrides.cupo_disponible ?? 25,
    cupo_estimado: overrides.cupo_estimado ?? 25,
    espacio_asignado: overrides.espacio_asignado ?? 'Aula 101',
    estado: overrides.estado ?? 'Publicado',
    estado_actual: overrides.estado_actual,
    objMateria: overrides.objMateria ?? {
      id_materia: 1,
      codigo: 'MAT-401',
      nombre: 'Matemáticas Avanzadas',
      creditos: 3,
      descripcion: 'Matemáticas'
    },
    objDocente: overrides.objDocente ?? {
      id_usuario: 10,
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan.perez@unicauca.edu.co',
      telefono: '1234567',
      objRol: { id_rol: 3, nombre_rol: 'DOCENTE' }
    }
  });

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getUsuario', 'getToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CursosIntersemestralesService,
        { provide: AuthService, useValue: authSpy }
      ]
    });

    service = TestBed.inject(CursosIntersemestralesService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    authService.getUsuario.and.returnValue(mockUsuario);
    authService.getToken.and.returnValue('mock-token');
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Consultas de cursos', () => {
    it('debe obtener cursos disponibles para estudiantes', (done) => {
      const respuesta = [buildCurso()];

      service.getCursosDisponibles().subscribe((cursos) => {
        expect(cursos).toEqual(respuesta);
        done();
      });

      const req = httpMock.expectOne(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.DISPONIBLES);
      expect(req.request.method).toBe('GET');
      req.flush(respuesta);
    });

    it('debe usar el endpoint específico al pedir estado Preinscripción', (done) => {
      const respuesta = [buildCurso({ estado_actual: 'Preinscripción' })];

      service.getCursosPorEstado('Preinscripción').subscribe((cursos) => {
        expect(cursos).toEqual(respuesta);
        done();
      });

      const req = httpMock.expectOne(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.PREINSCRIPCION);
      expect(req.request.method).toBe('GET');
      req.flush(respuesta);
    });

    it('debe filtrar cursos por estado cuando requiere obtener todos', (done) => {
      const publicado = buildCurso({ id_curso: 1, estado_actual: 'Publicado' });
      const borrador = buildCurso({ id_curso: 2, estado_actual: 'Borrador' });

      service.getCursosPorEstado('Publicado').subscribe((cursos) => {
        expect(cursos.length).toBe(1);
        expect(cursos[0].id_curso).toBe(1);
        done();
      });

      const req = httpMock.expectOne(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.TODOS);
      expect(req.request.method).toBe('GET');
      req.flush([publicado, borrador]);
    });

    it('debe obtener un curso por ID usando el endpoint de gestión', (done) => {
      const curso = buildCurso({ id_curso: 42 });

      service.getCursoPorId(42).subscribe((resp) => {
        expect(resp.id_curso).toBe(42);
        done();
      });

      const req = httpMock.expectOne(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.GESTION}/42`);
      expect(req.request.method).toBe('GET');
      req.flush(curso);
    });
  });

  describe('Preinscripciones e inscripciones', () => {
    it('debe crear una preinscripción', () => {
      const payload: CreatePreinscripcionDTO = {
        idUsuario: 1,
        idCurso: 5,
        nombreSolicitud: 'Preinscripción Curso 5'
      };

      const respuesta = { id_solicitud: 501 } as SolicitudCursoVerano;

      service.crearPreinscripcion(payload).subscribe((resp) => {
        expect(resp.id_solicitud).toBe(501);
      });

      const req = httpMock.expectOne(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.PREINSCRIPCIONES);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(respuesta);
    });

    it('debe crear una inscripción', () => {
      const payload: CreateInscripcionDTO = {
        idUsuario: 1,
        idCurso: 7,
        nombreSolicitud: 'Inscripción Curso 7'
      };

      const respuesta = { id_solicitud: 701 } as SolicitudCursoVerano;

      service.crearInscripcion(payload).subscribe((resp) => {
        expect(resp.id_solicitud).toBe(701);
      });

      const req = httpMock.expectOne(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.INSCRIPCIONES);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(respuesta);
    });

    it('debe obtener solicitudes del usuario autenticado', (done) => {
      const respuesta: SolicitudCursoVerano[] = [];

      service.getSolicitudesUsuario(1).subscribe((data) => {
        expect(data).toEqual(respuesta);
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/cursos-verano/solicitudes/1`);
      expect(req.request.method).toBe('GET');
      req.flush(respuesta);
    });

    it('debe obtener el seguimiento de una solicitud', (done) => {
      const respuesta = { id_solicitud: 99 } as SolicitudCursoVerano;

      service.getSeguimientoSolicitud(99).subscribe((data) => {
        expect(data.id_solicitud).toBe(99);
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/cursos-verano/seguimiento/99`);
      expect(req.request.method).toBe('GET');
      req.flush(respuesta);
    });
  });

  describe('Gestión administrativa de cursos', () => {
    it('debe aprobar una preinscripción enviando comentarios opcionales', () => {
      service.aprobarPreinscripcion(10, 'Aprobada por cumplimiento').subscribe((resp) => {
        expect(resp).toEqual({ success: true });
      });

      const req = httpMock.expectOne(`${BASE_URL}/preinscripciones/10/aprobar`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ comentarios: 'Aprobada por cumplimiento' });
      req.flush({ success: true });
    });

    it('debe rechazar una preinscripción con motivo', () => {
      service.rechazarPreinscripcion(11, 'No cumple requisitos').subscribe((resp) => {
        expect(resp).toEqual({ success: false });
      });

      const req = httpMock.expectOne(`${BASE_URL}/preinscripciones/11/rechazar`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ motivo: 'No cumple requisitos' });
      req.flush({ success: false });
    });

    it('debe actualizar observaciones de una preinscripción', () => {
      service.actualizarObservacionesPreinscripcion(12, 'Agregar soporte').subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/preinscripciones/12/observaciones`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ observaciones: 'Agregar soporte' });
      req.flush({});
    });

    it('debe validar el pago de una inscripción', () => {
      service.validarPagoInscripcion(3).subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/cursos-verano/inscripciones/3/validar-pago`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush({ ok: true });
    });

    it('debe completar una inscripción', () => {
      service.completarInscripcion(4).subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/cursos-verano/inscripciones/4/completar`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush({ ok: true });
    });
  });

  describe('Inscripciones y comprobantes', () => {
    it('debe aceptar una inscripción con observaciones', () => {
      service.aceptarInscripcion(20, 'Documentos completos').subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/inscripciones/20/aceptar`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ observaciones: 'Documentos completos' });
      req.flush({});
    });

    it('debe rechazar una inscripción con motivo', () => {
      service.rechazarInscripcion(21, 'Pago no recibido').subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/inscripciones/21/rechazar`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ motivo: 'Pago no recibido' });
      req.flush({});
    });

    it('debe descargar el comprobante de pago como blob', (done) => {
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });

      service.descargarComprobantePago(30).subscribe((blob) => {
        expect(blob.type).toBe('application/pdf');
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/inscripciones/30/comprobante`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });

    it('debe obtener estadísticas del curso', (done) => {
      const respuesta = { total: 5 };

      service.obtenerEstadisticasCurso(1).subscribe((data) => {
        expect(data.total).toBe(5);
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/inscripciones/curso/1/estadisticas`);
      expect(req.request.method).toBe('GET');
      req.flush(respuesta);
    });
  });

  describe('Gestión de documentos', () => {
    it('debe subir un documento usando FormData', () => {
      const file = new File(['contenido'], 'test.pdf', { type: 'application/pdf' });

      service.uploadDocumento(5, file).subscribe((resp) => {
        expect(resp).toEqual({ success: true });
      });

      const req = httpMock.expectOne(ApiEndpoints.CURSOS_INTERSEMESTRALES.UPLOAD_DOCUMENT('5'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush({ success: true });
    });

    it('debe obtener documentos relacionados a una solicitud', (done) => {
      const respuesta = [{ id_documento: 1, nombre: 'doc.pdf' }];

      service.getDocumentos(8).subscribe((docs) => {
        expect(docs.length).toBe(1);
        expect(docs[0].nombre).toBe('doc.pdf');
        done();
      });

      const req = httpMock.expectOne(ApiEndpoints.CURSOS_INTERSEMESTRALES.DOCUMENTOS('8'));
      expect(req.request.method).toBe('GET');
      req.flush(respuesta);
    });
  });

  describe('Gestión de cursos (CRUD)', () => {
    it('debe crear un curso con mapeo de estado', () => {
      const payload = {
        nombre_curso: 'Nuevo Curso',
        codigo_curso: 'NC-001',
        descripcion: 'Descripción',
        fecha_inicio: '2025-06-01',
        fecha_fin: '2025-07-01',
        periodoAcademico: '2025-2',
        cupo_maximo: 30,
        cupo_estimado: 25,
        espacio_asignado: 'Aula 201',
        estado: 'Preinscripción',
        id_materia: 1,
        id_docente: 10
      } as const;

      const respuesta = buildCurso({ id_curso: 99 });

      service.crearCurso({ ...payload }).subscribe((resp) => {
        expect(resp.id_curso).toBe(99);
      });

      const req = httpMock.expectOne(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.GESTION);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.estado).toBe('Preinscripcion');
      req.flush(respuesta);
    });

    it('debe actualizar un curso existente', () => {
      service.actualizarCurso(15, { estado: 'Publicado' }).subscribe();

      const req = httpMock.expectOne(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.GESTION}/15`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.estado).toBe('Publicado');
      req.flush({});
    });

    it('debe eliminar un curso', () => {
      service.eliminarCurso(16).subscribe();

      const req = httpMock.expectOne(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.GESTION}/16`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('Manejo de errores', () => {
    it('debe propagar error 404 al obtener curso', (done) => {
      service.getCursoPorId(999).subscribe({
        next: () => fail('Debería fallar con 404'),
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.GESTION}/999`);
      req.flush({ message: 'No encontrado' }, { status: 404, statusText: 'Not Found' });
    });

    it('debe propagar error 500 en getTodosLosCursos', (done) => {
      service.getTodosLosCursos().subscribe({
        next: () => fail('Debería fallar con 500'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.TODOS);
      req.flush({ message: 'Error interno' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('Períodos Académicos', () => {
    it('debe obtener todos los períodos académicos disponibles', (done) => {
      const periodos = ['2024-1', '2024-2', '2025-1', '2025-2'];

      service.getPeriodosAcademicos().subscribe((result) => {
        expect(result).toEqual(periodos);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/periodos-academicos/todos`);
      expect(req.request.method).toBe('GET');
      req.flush(periodos);
    });

    it('debe obtener períodos futuros', (done) => {
      const periodosFuturos = ['2025-2', '2026-1', '2026-2'];

      service.getPeriodosFuturos().subscribe((result) => {
        expect(result).toEqual(periodosFuturos);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/periodos-academicos/futuros`);
      expect(req.request.method).toBe('GET');
      req.flush(periodosFuturos);
    });

    it('debe obtener períodos recientes', (done) => {
      const periodosRecientes = ['2024-1', '2024-2', '2025-1'];

      service.getPeriodosRecientes().subscribe((result) => {
        expect(result).toEqual(periodosRecientes);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/periodos-academicos/recientes`);
      expect(req.request.method).toBe('GET');
      req.flush(periodosRecientes);
    });

    it('debe obtener el período académico actual', (done) => {
      const periodoActual = '2025-1';

      service.getPeriodoActual().subscribe((result) => {
        expect(result).toBe(periodoActual);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/periodos-academicos/actual`);
      expect(req.request.method).toBe('GET');
      req.flush(periodoActual);
    });

    it('debe obtener períodos registrados', (done) => {
      const periodosRegistrados = ['2024-1', '2024-2', '2025-1'];

      service.getPeriodosRegistrados().subscribe((result) => {
        expect(result).toEqual(periodosRegistrados);
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/periodos-registrados`);
      expect(req.request.method).toBe('GET');
      req.flush(periodosRegistrados);
    });
  });

  describe('Filtrado de cursos', () => {
    it('debe obtener cursos por período académico', (done) => {
      const cursos = [buildCurso({ periodoAcademico: '2025-1' })];

      service.getCursosPorPeriodo('2025-1').subscribe((result) => {
        expect(result).toEqual(cursos);
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/cursos-verano/periodo/2025-1`);
      expect(req.request.method).toBe('GET');
      req.flush(cursos);
    });

    it('debe obtener cursos activos en una fecha específica', (done) => {
      const fecha = '2025-06-15';
      const cursos = [buildCurso()];

      service.getCursosActivos(fecha).subscribe((result) => {
        expect(result).toEqual(cursos);
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/cursos-activos/${fecha}`);
      expect(req.request.method).toBe('GET');
      req.flush(cursos);
    });

    it('debe obtener estadísticas por período', (done) => {
      const estadisticas = { totalCursos: 10, totalEstudiantes: 150 };

      service.getEstadisticasPorPeriodo('2025-1').subscribe((result) => {
        expect(result).toEqual(estadisticas);
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/estadisticas/periodo/2025-1`);
      expect(req.request.method).toBe('GET');
      req.flush(estadisticas);
    });
  });

  describe('Gestión de funcionarios', () => {
    it('debe obtener todos los cursos para funcionarios', (done) => {
      const cursos = [buildCurso()];

      service.getTodosLosCursosParaFuncionarios().subscribe((result) => {
        expect(result).toEqual(cursos);
        done();
      });

      const req = httpMock.expectOne(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.TODOS);
      expect(req.request.method).toBe('GET');
      req.flush(cursos);
    });

    it('debe obtener preinscripciones por curso', (done) => {
      const preinscripciones = [{ id_solicitud: 1 } as SolicitudCursoVerano];

      service.getPreinscripcionesPorCurso(5).subscribe((result) => {
        expect(result).toEqual(preinscripciones);
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/preinscripciones/curso/5`);
      expect(req.request.method).toBe('GET');
      req.flush(preinscripciones);
    });

    it('debe obtener inscripciones por curso específico', (done) => {
      const inscripciones = [{ id: 1 }];

      service.getInscripcionesPorCurso(5).subscribe((result) => {
        expect(Array.isArray(result)).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/inscripciones`);
      expect(req.request.method).toBe('GET');
      req.flush(inscripciones);
    });

    it('debe obtener estudiantes elegibles para inscripción', (done) => {
      const estudiantesElegibles = [{ nombre_completo: 'Juan Pérez', codigo: '123' }] as any;

      service.getEstudiantesElegibles(10).subscribe((result) => {
        expect(result).toEqual(estudiantesElegibles);
        done();
      });

      const req = httpMock.expectOne(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.ESTUDIANTES_ELEGIBLES(10));
      expect(req.request.method).toBe('GET');
      req.flush(estudiantesElegibles);
    });
  });

  describe('Notificaciones', () => {
    it('debe obtener notificaciones de usuario', (done) => {
      const notificaciones = [{ id_notificacion: 1, tipoSolicitud: 'Preinscripción' }] as any;

      service.getNotificacionesUsuario(1).subscribe((result) => {
        expect(result).toEqual(notificaciones);
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/notificaciones/usuario/1`);
      expect(req.request.method).toBe('GET');
      req.flush(notificaciones);
    });

    it('debe obtener notificaciones no leídas', (done) => {
      const notificaciones = [{ id_notificacion: 1, leida: false }] as any;

      service.getNotificacionesNoLeidas(1).subscribe((result) => {
        expect(result).toEqual(notificaciones);
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/notificaciones/usuario/1/no-leidas`);
      expect(req.request.method).toBe('GET');
      req.flush(notificaciones);
    });

    it('debe obtener dashboard de notificaciones', (done) => {
      const notificaciones = [{ id_notificacion: 1 }] as any;

      service.getDashboardNotificaciones(1).subscribe((result) => {
        expect(result).toEqual(notificaciones);
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/notificaciones/dashboard/1`);
      expect(req.request.method).toBe('GET');
      req.flush(notificaciones);
    });

    it('debe marcar notificación como leída', (done) => {
      service.marcarNotificacionLeida(5).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/notificaciones/5/marcar-leida`);
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });
  });

  describe('Solicitudes de curso nuevo', () => {
    it('debe obtener materias disponibles', (done) => {
      const materias = [{ id_materia: 1, nombre: 'Matemáticas', codigo: 'MAT-101' }] as any;

      service.getMateriasDisponibles().subscribe((result) => {
        expect(result).toEqual(materias);
        done();
      });

      const req = httpMock.expectOne(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.CURSOS_DISPONIBLES);
      expect(req.request.method).toBe('GET');
      req.flush(materias);
    });

    it('debe obtener condiciones de solicitud', (done) => {
      const condiciones = ['Primera_Vez', 'Habilitación', 'Repetición'] as any;

      service.getCondicionesSolicitud().subscribe((result) => {
        expect(result).toEqual(condiciones);
        done();
      });

      const req = httpMock.expectOne(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.CONDICIONES);
      expect(req.request.method).toBe('GET');
      req.flush(condiciones);
    });

    it('debe obtener todas las solicitudes', (done) => {
      const solicitudes = [{ id_solicitud: 1 } as SolicitudCursoVerano];

      service.getTodasLasSolicitudes().subscribe((result) => {
        expect(result).toEqual(solicitudes);
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/solicitudes-curso-nuevo`);
      expect(req.request.method).toBe('GET');
      req.flush(solicitudes);
    });

    it('debe obtener solicitudes para visualizar', (done) => {
      const solicitudes = [{ id: 1 }];

      service.getSolicitudesVisualizar().subscribe((result) => {
        expect(result).toEqual(solicitudes);
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/solicitudes`);
      expect(req.request.method).toBe('GET');
      req.flush(solicitudes);
    });

    it('debe obtener materias para filtro', (done) => {
      const materias = [{ id: 1, nombre: 'Matemáticas' }];

      service.getMateriasFiltro().subscribe((result) => {
        expect(result).toEqual(materias);
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/materias-filtro`);
      expect(req.request.method).toBe('GET');
      req.flush(materias);
    });
  });

  describe('Consultas adicionales', () => {
    it('debe obtener todas las materias', (done) => {
      const materias = [{ id_materia: 1, nombre: 'Matemáticas' }] as any;

      service.getTodasLasMaterias().subscribe((result) => {
        expect(result).toEqual(materias);
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/materias`);
      expect(req.request.method).toBe('GET');
      req.flush(materias);
    });

    it('debe obtener todos los docentes', (done) => {
      const docentes = [{ id_usuario: 1, nombre_usuario: 'Juan Pérez' }];

      service.getTodosLosDocentes().subscribe((result) => {
        expect(result).toBeTruthy();
        expect(Array.isArray(result)).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${BASE_URL}/docentes`);
      expect(req.request.method).toBe('GET');
      req.flush(docentes);
    });

    it('debe consultar permisos por estado y rol', (done) => {
      const permisos = ['ver', 'editar', 'eliminar'];

      service.getPermisosEstado('Publicado', 'FUNCIONARIO').subscribe((result) => {
        expect(result).toEqual(permisos);
        done();
      });

      const req = httpMock.expectOne(ApiEndpoints.CURSOS_INTERSEMESTRALES.CURSOS_VERANO.PERMISOS_ESTADO('Publicado','FUNCIONARIO'));
      expect(req.request.method).toBe('GET');
      req.flush(permisos);
    });
  });
});

