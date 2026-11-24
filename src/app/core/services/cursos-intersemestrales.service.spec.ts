import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CursosIntersemestralesService } from './cursos-intersemestrales.service';
import {
  CursoOfertadoVerano,
  CreatePreinscripcionDTO,
  CreateInscripcionDTO,
  CreateSolicitudCursoNuevoDTO,
  SolicitudCursoVerano,
  CondicionSolicitudVerano,
  EstudianteElegible,
  Materia,
} from '../models/cursos-intersemestrales.model';
import { AuthService } from './auth.service';
import { environment } from '@env/environment';

describe('CursosIntersemestralesService - Cursos de Verano', () => {
  let service: CursosIntersemestralesService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  const CURSOS = `${environment.apiUrl}/cursos-verano/cursos`;
  const PREINSCRIPCIONES = `${environment.apiUrl}/cursos-verano/preinscripciones`;
  const INSCRIPCIONES = `${environment.apiUrl}/cursos-verano/inscripciones`;
  const CATALOGOS = `${environment.apiUrl}/cursos-verano/catalogos`;
  const REPORTES = `${environment.apiUrl}/cursos-verano/reportes`;

  const mockUsuario = {
    id_usuario: 1,
    nombre_completo: 'Test User',
    codigo: '123456',
    email_usuario: 'test@unicauca.edu.co',
    objRol: { id_rol: 1, nombre_rol: 'ESTUDIANTE' },
  };

  const buildCurso = (overrides: Partial<CursoOfertadoVerano> = {}): CursoOfertadoVerano => ({
    id_curso: overrides.id_curso ?? 1,
    nombre_curso: overrides.nombre_curso ?? 'Matemáticas Avanzadas',
    codigo_curso: overrides.codigo_curso ?? 'MAT-401',
    descripcion: overrides.descripcion ?? 'Curso de prueba',
    fecha_inicio: overrides.fecha_inicio ?? '2025-06-01',
    fecha_fin: overrides.fecha_fin ?? '2025-06-30',
    periodoAcademico: overrides.periodoAcademico ?? '2025-1',
    cupo_maximo: overrides.cupo_maximo ?? 30,
    cupo_disponible: overrides.cupo_disponible ?? 25,
    cupo_estimado: overrides.cupo_estimado ?? 25,
    espacio_asignado: overrides.espacio_asignado ?? 'Aula 101',
    estado: overrides.estado ?? 'Publicado',
    objMateria: overrides.objMateria ?? {
      id_materia: 1,
      codigo: 'MAT-401',
      nombre: 'Matemáticas Avanzadas',
      creditos: 3,
      descripcion: 'Matemáticas',
    },
    objDocente: overrides.objDocente ?? { id_docente: 10, codigo_docente: 'DOC-10', nombre_docente: 'Juan Pérez' },
  });

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['getUsuario', 'getToken']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CursosIntersemestralesService, { provide: AuthService, useValue: authSpy }],
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
        expect(cursos.length).toBe(1);
        expect(cursos[0].id_curso).toBe(respuesta[0].id_curso);
        expect(cursos[0].nombre_curso).toBe(respuesta[0].nombre_curso);
        // El servicio normaliza y agrega periodo y grupo
        done();
      });

      const req = httpMock.expectOne(`${CURSOS}?disponibles=true`);
      expect(req.request.method).toBe('GET');
      req.flush(respuesta);
    });

    it('debe usar el endpoint específico al pedir estado Preinscripción', (done) => {
      const respuesta = [buildCurso({ estado: 'Preinscripción' })];

      service.getCursosPorEstado('Preinscripción').subscribe((cursos) => {
        expect(cursos.length).toBe(1);
        expect(cursos[0].id_curso).toBe(respuesta[0].id_curso);
        expect(cursos[0].estado).toBe(respuesta[0].estado);
        // El servicio normaliza y agrega periodo y grupo
        done();
      });

      const req = httpMock.expectOne(`${CURSOS}?estado=preinscripcion`);
      expect(req.request.method).toBe('GET');
      req.flush(respuesta);
    });

    it('pide ?estado=inscripcion con el período al pedir estado Inscripción', () => {
      service.getCursosPorEstado('Inscripción', '2025-1').subscribe();

      const req = httpMock.expectOne(`${CURSOS}?estado=inscripcion&periodoAcademico=2025-1`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('debe filtrar cursos por estado cuando requiere obtener todos', (done) => {
      const publicado = buildCurso({ id_curso: 1, estado: 'Publicado' });
      const borrador = buildCurso({ id_curso: 2, estado: 'Borrador' });

      service.getCursosPorEstado('Publicado').subscribe((cursos) => {
        expect(cursos.length).toBe(1);
        expect(cursos[0].id_curso).toBe(1);
        done();
      });

      const req = httpMock.expectOne(CURSOS);
      expect(req.request.method).toBe('GET');
      req.flush([publicado, borrador]);
    });

    it('debe obtener un curso por ID usando el endpoint de gestión', (done) => {
      const curso = buildCurso({ id_curso: 42 });

      service.getCursoPorId(42).subscribe((resp) => {
        expect(resp.id_curso).toBe(42);
        done();
      });

      const req = httpMock.expectOne(`${CURSOS}/42`);
      expect(req.request.method).toBe('GET');
      req.flush(curso);
    });
  });

  describe('Preinscripciones e inscripciones', () => {
    it('debe crear una preinscripción', () => {
      const payload: CreatePreinscripcionDTO = {
        idUsuario: 1,
        idCurso: 5,
        nombreSolicitud: 'Preinscripción Curso 5',
      };

      const respuesta = { id_solicitud: 501 } as SolicitudCursoVerano;

      service.crearPreinscripcion(payload).subscribe((resp) => {
        expect(resp.id_solicitud).toBe(501);
      });

      const req = httpMock.expectOne(PREINSCRIPCIONES);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(respuesta);
    });

    it('debe obtener las preinscripciones de un usuario con ?usuario=', () => {
      service.getPreinscripcionesUsuario(7).subscribe((resp) => {
        expect(resp).toEqual([]);
      });

      const req = httpMock.expectOne(`${PREINSCRIPCIONES}?usuario=7`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('debe crear una solicitud de curso nuevo', () => {
      const payload: CreateSolicitudCursoNuevoDTO = {
        idUsuario: 1,
        nombreCompleto: 'Ana',
        codigo: '1046',
        curso: 'Redes',
        condicion: CondicionSolicitudVerano.Primera_Vez,
      };

      service.crearSolicitudCursoNuevo(payload).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/cursos-verano/solicitudes-curso-nuevo`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({});
    });

    it('debe crear una inscripción', () => {
      const payload: CreateInscripcionDTO = {
        idUsuario: 1,
        idCurso: 7,
        nombreSolicitud: 'Inscripción Curso 7',
      };

      const respuesta = { id_solicitud: 701 } as SolicitudCursoVerano;

      service.crearInscripcion(payload).subscribe((resp) => {
        expect(resp.id_solicitud).toBe(701);
      });

      const req = httpMock.expectOne(INSCRIPCIONES);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(respuesta);
    });
  });

  describe('Gestión administrativa de cursos', () => {
    it('debe aprobar una preinscripción enviando comentarios opcionales', () => {
      service.aprobarPreinscripcion(10, 'Aprobada por cumplimiento').subscribe((resp) => {
        expect(resp).toEqual({ success: true });
      });

      const req = httpMock.expectOne(`${PREINSCRIPCIONES}/10/estado`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ nuevoEstado: 'aprobada', comentarios: 'Aprobada por cumplimiento' });
      req.flush({ success: true });
    });

    it('debe aprobar una preinscripción sin comentarios', () => {
      service.aprobarPreinscripcion(13).subscribe();

      const req = httpMock.expectOne(`${PREINSCRIPCIONES}/13/estado`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ nuevoEstado: 'aprobada' });
      req.flush({ success: true });
    });

    it('debe rechazar una preinscripción con motivo', () => {
      service.rechazarPreinscripcion(11, 'No cumple requisitos').subscribe((resp) => {
        expect(resp).toEqual({ success: false });
      });

      const req = httpMock.expectOne(`${PREINSCRIPCIONES}/11/estado`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ nuevoEstado: 'rechazada', motivo: 'No cumple requisitos' });
      req.flush({ success: false });
    });

    it('debe actualizar observaciones de una preinscripción', () => {
      service.actualizarObservacionesPreinscripcion(12, 'Agregar soporte').subscribe();

      const req = httpMock.expectOne(`${PREINSCRIPCIONES}/12/observaciones`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ observaciones: 'Agregar soporte' });
      req.flush({});
    });
  });

  describe('Inscripciones y comprobantes', () => {
    it('debe aceptar una inscripción con observaciones', () => {
      service.aceptarInscripcion(20, 'Documentos completos').subscribe();

      const req = httpMock.expectOne(`${INSCRIPCIONES}/20/estado`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ nuevoEstado: 'aceptada', observaciones: 'Documentos completos' });
      req.flush({});
    });

    it('debe rechazar una inscripción con motivo', () => {
      service.rechazarInscripcion(21, 'Pago no recibido').subscribe();

      const req = httpMock.expectOne(`${INSCRIPCIONES}/21/estado`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ nuevoEstado: 'rechazada', motivo: 'Pago no recibido' });
      req.flush({});
    });

    it('debe descargar el comprobante de pago como blob', (done) => {
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });

      service.descargarComprobantePago(30).subscribe((blob) => {
        expect(blob.type).toBe('application/pdf');
        done();
      });

      // El endpoint cambió a usar ApiEndpoints.ARCHIVOS.DESCARGAR_PDF_POR_INSCRIPCION
      const req = httpMock.expectOne(`${environment.apiUrl}/archivos/inscripciones/30`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
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
        id_docente: 10,
      } as const;

      const respuesta = buildCurso({ id_curso: 99 });

      service.crearCurso({ ...payload }).subscribe((resp) => {
        expect(resp.id_curso).toBe(99);
      });

      const req = httpMock.expectOne(CURSOS);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.estado).toBe('Preinscripcion');
      req.flush(respuesta);
    });

    it('debe actualizar un curso existente', () => {
      service.actualizarCurso(15, { estado: 'Publicado' }).subscribe();

      const req = httpMock.expectOne(`${CURSOS}/15`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.estado).toBe('Publicado');
      req.flush({});
    });

    it('debe eliminar un curso', () => {
      service.eliminarCurso(16).subscribe();

      const req = httpMock.expectOne(`${CURSOS}/16`);
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
        },
      });

      const req = httpMock.expectOne(`${CURSOS}/999`);
      req.flush({ message: 'No encontrado' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('Períodos Académicos', () => {
    it('debe obtener todos los períodos académicos disponibles', (done) => {
      const periodos = ['2024-1', '2024-2', '2025-1', '2025-2'];

      service.getPeriodosAcademicos().subscribe((result) => {
        expect(result).toEqual(periodos);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/periodos-academicos`);
      expect(req.request.method).toBe('GET');
      req.flush(periodos);
    });

    it('debe obtener períodos recientes', (done) => {
      const periodosRecientes = ['2024-1', '2024-2', '2025-1'];

      service.getPeriodosRecientes().subscribe((result) => {
        expect(result).toEqual(periodosRecientes);
        done();
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/periodos-academicos?desde=${Math.max(2020, new Date().getFullYear() - 4)}`
      );
      expect(req.request.method).toBe('GET');
      req.flush(periodosRecientes);
    });

    it('debe obtener períodos registrados', (done) => {
      const periodosRegistrados = ['2024-1', '2024-2', '2025-1'];

      service.getPeriodosRegistrados().subscribe((result) => {
        expect(result).toEqual(periodosRegistrados);
        done();
      });

      // BUG-51: la ruta existe en el backend desde que se corrigió
      const req = httpMock.expectOne({ method: 'GET', url: `${environment.apiUrl}/cursos-verano/cursos/periodos` });
      req.flush(periodosRegistrados);
    });
  });

  describe('Gestión de funcionarios', () => {
    it('debe obtener todos los cursos para funcionarios', (done) => {
      const cursos = [buildCurso()];

      service.getTodosLosCursosParaFuncionarios().subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].id_curso).toBe(cursos[0].id_curso);
        expect(result[0].nombre_curso).toBe(cursos[0].nombre_curso);
        // El servicio normaliza y agrega periodo y grupo
        done();
      });

      const req = httpMock.expectOne(CURSOS);
      expect(req.request.method).toBe('GET');
      req.flush(cursos);
    });

    it('debe obtener preinscripciones por curso', (done) => {
      // Formato del backend (PreinscripcionCurso); el servicio lo convierte a SolicitudCursoVerano
      const respuestaBackend = [
        {
          id_solicitud: 1,
          id_preinscripcion: 10,
          fecha_preinscripcion: '2025-06-01T10:00:00',
          estado: 'ENVIADA',
          objUsuario: {
            id_usuario: 7,
            nombre_completo: 'Estudiante Prueba',
            correo: 'prueba@unicauca.edu.co',
            codigo: '100',
          },
          objCurso: { id_curso: 5 },
        },
      ];

      service.getPreinscripcionesPorCurso(5).subscribe((result) => {
        expect(result.length).toBe(1);
        expect(result[0].id_solicitud).toBe(1);
        expect(result[0].nombre_solicitud).toBe('Preinscripción - Estudiante Prueba');
        expect(result[0].objUsuario.id_usuario).toBe(7);
        expect(result[0].tipoSolicitud).toBe('PREINSCRIPCION');
        done();
      });

      const req = httpMock.expectOne(`${PREINSCRIPCIONES}?curso=5`);
      expect(req.request.method).toBe('GET');
      req.flush(respuestaBackend);
    });

    it('debe obtener estudiantes elegibles para inscripción', (done) => {
      const estudiantesElegibles: EstudianteElegible[] = [
        {
          nombre_completo: 'Juan Pérez',
          codigo: '123',
          id_solicitud: 1,
          id_curso: 10,
          tipo_solicitud: 'PREINSCRIPCION',
          condicion_solicitud: 'Primera_Vez',
          tiene_inscripcion_formal: false,
        },
      ];

      service.getEstudiantesElegibles(10).subscribe((result) => {
        expect(result).toEqual(estudiantesElegibles);
        done();
      });

      const req = httpMock.expectOne(`${CURSOS}/10/estudiantes-elegibles`);
      expect(req.request.method).toBe('GET');
      req.flush(estudiantesElegibles);
    });
  });

  describe('Solicitudes de curso nuevo', () => {
    it('debe obtener materias disponibles', (done) => {
      const materias: Materia[] = [{ id_materia: 1, nombre: 'Matemáticas', codigo: 'MAT-101', creditos: 4 }];

      service.getMateriasDisponibles().subscribe((result) => {
        expect(result).toEqual(materias);
        done();
      });

      const req = httpMock.expectOne(`${CATALOGOS}/materias-disponibles`);
      expect(req.request.method).toBe('GET');
      req.flush(materias);
    });

    it('debe obtener condiciones de solicitud', (done) => {
      const condiciones = Object.values(CondicionSolicitudVerano);

      service.getCondicionesSolicitud().subscribe((result) => {
        expect(result).toEqual(condiciones);
        done();
      });

      const req = httpMock.expectOne(`${CATALOGOS}/condiciones`);
      expect(req.request.method).toBe('GET');
      req.flush(condiciones);
    });

    it('debe obtener solicitudes para visualizar', (done) => {
      const solicitudes = [
        {
          nombreCompleto: 'Ana',
          codigo: '1',
          curso: 'Cálculo',
          condicion: 'Primera_Vez',
          estado: 'ENVIADA',
          fecha: '2025-06-01',
        },
      ];

      service.getSolicitudesVisualizar().subscribe((result) => {
        expect(result).toEqual(solicitudes);
        done();
      });

      const req = httpMock.expectOne(`${REPORTES}/solicitudes`);
      expect(req.request.method).toBe('GET');
      req.flush(solicitudes);
    });

    it('debe pedir el seguimiento del estudiante con ?usuario=', () => {
      service.getSeguimientoActividades(5).subscribe();

      const req = httpMock.expectOne(`${REPORTES}/seguimiento?usuario=5`);
      expect(req.request.method).toBe('GET');
      req.flush({ preinscripciones: [], inscripciones: [] });
    });

    it('debe pedir el dashboard de cursos de verano', () => {
      service.getDashboardEstadisticas().subscribe();

      const req = httpMock.expectOne(`${REPORTES}/dashboard`);
      expect(req.request.method).toBe('GET');
      req.flush({});
    });

    it('debe pedir los salones del catálogo', () => {
      service.getSalones().subscribe();

      const req = httpMock.expectOne(`${CATALOGOS}/salones`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('debe obtener materias para filtro', (done) => {
      const materias = [{ id: 1, nombre: 'Matemáticas', codigo: 'MAT-101' }];

      service.getMateriasFiltro().subscribe((result) => {
        expect(result).toEqual(materias);
        done();
      });

      const req = httpMock.expectOne(`${CATALOGOS}/materias-filtro`);
      expect(req.request.method).toBe('GET');
      req.flush(materias);
    });
  });

  describe('Filtros y exportaciones', () => {
    it('no envía el período cuando es "todos"', () => {
      service.getTodosLosCursosParaFuncionarios('todos').subscribe();
      const req = httpMock.expectOne((r) => r.url === CURSOS);
      expect(req.request.params.has('periodoAcademico')).toBeFalse();
      req.flush([]);
    });

    it('envía el período y el programa cuando se indican', () => {
      service.getTodosLosCursosParaFuncionarios(' 2025-2 ', 3).subscribe();
      const req = httpMock.expectOne((r) => r.url === CURSOS);
      expect(req.request.params.get('periodoAcademico')).toBe('2025-2');
      expect(req.request.params.get('idPrograma')).toBe('3');
      req.flush([]);
    });

    it('pide todos los períodos a los cursos disponibles con "todos"', () => {
      service.getCursosDisponibles('todos').subscribe();
      const req = httpMock.expectOne((r) => r.url === CURSOS);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('disponibles')).toBe('true');
      expect(req.request.params.get('todosLosPeriodos')).toBe('true');
      expect(req.request.params.has('periodoAcademico')).toBeFalse();
      req.flush([]);
    });

    it('rellena periodoAcademico y grupo de los cursos', (done) => {
      service.getCursosDisponibles().subscribe((cursos) => {
        expect(cursos[0].periodoAcademico).toBe('2025-2');
        expect(cursos[0].grupo).toBe('A');
        done();
      });
      httpMock
        .expectOne(`${CURSOS}?disponibles=true`)
        .flush([{ ...buildCurso(), periodo: '2025-2', periodoAcademico: undefined, grupo: undefined }]);
    });

    it('usa el nombre de Content-Disposition al exportar cursos', (done) => {
      service.exportarCursosPDF('2025-1').subscribe((archivo) => {
        expect(archivo.filename).toBe('cursos 2025-1.pdf');
        done();
      });
      httpMock
        .expectOne({ method: 'GET', url: `${CURSOS}?formato=pdf&periodoAcademico=2025-1` })
        .flush(new Blob(['pdf']), { headers: { 'Content-Disposition': 'attachment; filename="cursos 2025-1.pdf"' } });
    });

    it('genera un nombre si el servidor no lo envía', (done) => {
      service.exportarEstudiantesPDF(8).subscribe((archivo) => {
        expect(archivo.filename).toMatch(/^estudiantes_curso_8_\d{4}-\d{2}-\d{2}\.pdf$/);
        done();
      });
      httpMock.expectOne({ method: 'GET', url: `${CURSOS}/8/estudiantes?formato=pdf` }).flush(new Blob(['pdf']));
    });

    it('falla si el Excel de solicitudes no es un Excel', (done) => {
      service.exportarSolicitudesExcel().subscribe({
        next: () => fail('debía fallar'),
        error: (e: Error) => {
          expect(e.message).toContain('no devolvió un Excel');
          done();
        },
      });
      httpMock
        .expectOne({ method: 'GET', url: `${REPORTES}/solicitudes?formato=excel` })
        .flush(new Blob(['x']), { headers: { 'Content-Type': 'text/html' } });
    });
  });

  describe('Consultas adicionales', () => {
    it('debe obtener todas las materias', (done) => {
      const materias: Materia[] = [{ id_materia: 1, nombre: 'Matemáticas', codigo: 'MAT-101', creditos: 4 }];

      service.getTodasLasMaterias().subscribe((result) => {
        expect(result).toEqual(materias);
        done();
      });

      const req = httpMock.expectOne(`${CATALOGOS}/materias`);
      expect(req.request.method).toBe('GET');
      req.flush(materias);
    });

    it('debe obtener todos los docentes', (done) => {
      const docentes = [{ id_docente: 1, codigo_docente: 'DOC-1', nombre_docente: 'Juan Pérez' }];

      service.getTodosLosDocentes().subscribe((result) => {
        expect(result).toEqual(docentes);
        done();
      });

      const req = httpMock.expectOne(`${CATALOGOS}/docentes`);
      expect(req.request.method).toBe('GET');
      req.flush(docentes);
    });
  });
});
