import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CursosIntersemestralesService, CursoOfertadoVerano, SolicitudCursoVerano } from './cursos-intersemestrales.service';
import { AuthService } from './auth.service';

describe('CursosIntersemestralesService - Pruebas Unitarias', () => {
  let service: CursosIntersemestralesService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;

  const apiUrl = 'http://localhost:5000/api/cursos-verano';
  const mockUsuario = {
    id_usuario: 1,
    nombre_completo: 'Test User',
    codigo: '123456',
    email_usuario: 'test@unicauca.edu.co'
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUsuario', 'getToken']);

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

    authService.getUsuario.and.returnValue(mockUsuario);
    authService.getToken.and.returnValue('mock-token');
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('1. Configuración del Servicio', () => {
    it('CI-001: Debe crear el servicio correctamente', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('2. Obtener Cursos Disponibles', () => {
    it('CI-002: Debe obtener cursos disponibles', (done) => {
      const mockCursos: CursoOfertadoVerano[] = [
        {
          id_curso: 1,
          nombre_curso: 'Matemáticas Avanzadas',
          codigo_curso: 'MAT-401',
          descripcion: 'Curso de matemáticas',
          fecha_inicio: new Date('2025-06-01'),
          fecha_fin: new Date('2025-07-31'),
          cupo_maximo: 30,
          cupo_disponible: 25,
          cupo_estimado: 30,
          espacio_asignado: 'Aula 101',
          estado: 'Disponible',
          objMateria: {
            id_materia: 1,
            codigo: 'MAT-401',
            nombre: 'Matemáticas Avanzadas',
            creditos: 3,
            descripcion: 'Curso avanzado'
          },
          objDocente: {
            id_usuario: 10,
            nombre: 'Juan',
            apellido: 'Pérez',
            email: 'juan@unicauca.edu.co',
            telefono: '1234567',
            objRol: { id_rol: 3, nombre_rol: 'DOCENTE' }
          }
        }
      ];

      service.getCursosDisponibles().subscribe((cursos) => {
        expect(cursos.length).toBe(1);
        expect(cursos[0].nombre_curso).toBe('Matemáticas Avanzadas');
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/cursos') && !request.url.includes('/estado')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockCursos);
    });

    it('CI-003: Debe obtener cursos por estado', (done) => {
      const mockCursos: CursoOfertadoVerano[] = [];

      service.getCursosPorEstado('Publicado').subscribe((cursos) => {
        expect(cursos).toEqual([]);
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/cursos/estado/Publicado')
      );
      req.flush(mockCursos);
    });

    it('CI-004: Debe obtener todos los cursos para funcionarios', (done) => {
      service.getTodosLosCursosParaFuncionarios().subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/cursos/todos')
      );
      req.flush([]);
    });

    it('CI-005: Debe obtener curso por ID', (done) => {
      const mockCurso: CursoOfertadoVerano = {
        id_curso: 1,
        nombre_curso: 'Test',
        codigo_curso: 'TEST-001',
        descripcion: 'Curso de prueba',
        fecha_inicio: new Date(),
        fecha_fin: new Date(),
        cupo_maximo: 20,
        cupo_disponible: 15,
        cupo_estimado: 20,
        espacio_asignado: 'Virtual',
        objMateria: {} as any,
        objDocente: {} as any
      };

      service.getCursoPorId(1).subscribe((curso) => {
        expect(curso.id_curso).toBe(1);
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/cursos/1')
      );
      req.flush(mockCurso);
    });
  });

  describe('3. Gestión de Preinscripciones', () => {
    it('CI-006: Debe crear preinscripción correctamente', (done) => {
      const payload = {
        idUsuario: 1,
        idCurso: 1,
        tipoCurso: 'Regular',
        condicionSolicitud: 'Normal'
      };

      service.crearPreinscripcion(payload).subscribe((response) => {
        expect(response).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/preinscripciones')
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ id: 1 });
    });

    it('CI-007: Debe obtener preinscripciones de un curso', (done) => {
      service.getPreinscripcionesCurso(1).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/cursos/1/preinscripciones')
      );
      req.flush([]);
    });

    it('CI-008: Debe aprobar preinscripción', (done) => {
      service.aprobarPreinscripcion(1, 'Aprobado').subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/preinscripciones/1/aprobar')
      );
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true });
    });

    it('CI-009: Debe rechazar preinscripción con motivo', (done) => {
      const motivo = 'No cumple requisitos';

      service.rechazarPreinscripcion(1, motivo).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/preinscripciones/1/rechazar')
      );
      expect(req.request.body.motivo).toBe(motivo);
      req.flush({ success: true });
    });

    it('CI-010: Debe actualizar observaciones de preinscripción', (done) => {
      const observaciones = 'Observaciones de prueba';

      service.actualizarObservacionesPreinscripcion(1, observaciones).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/preinscripciones/1/observaciones')
      );
      expect(req.request.body.observaciones).toBe(observaciones);
      req.flush({ success: true });
    });
  });

  describe('4. Gestión de Inscripciones', () => {
    it('CI-011: Debe crear inscripción correctamente', (done) => {
      const payload = {
        idUsuario: 1,
        idCurso: 1,
        tipoCurso: 'Regular',
        condicionSolicitud: 'Normal'
      };

      service.crearInscripcion(payload).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/inscripciones')
      );
      expect(req.request.method).toBe('POST');
      req.flush({ id: 1 });
    });

    it('CI-012: Debe obtener inscripciones de un curso', (done) => {
      service.getInscripcionesCurso(1).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/cursos/1/inscripciones')
      );
      req.flush([]);
    });

    it('CI-013: Debe validar pago de inscripción', (done) => {
      service.validarPagoInscripcion(1).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/inscripciones/1/validar-pago')
      );
      req.flush({ id: 1 });
    });

    it('CI-014: Debe completar inscripción', (done) => {
      service.completarInscripcion(1).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/inscripciones/1/completar')
      );
      req.flush({ id: 1 });
    });

    it('CI-015: Debe aceptar inscripción con observaciones', (done) => {
      service.aceptarInscripcion(1, 'Aceptado').subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/inscripciones/1/aceptar')
      );
      expect(req.request.body.observaciones).toBe('Aceptado');
      req.flush({ success: true });
    });

    it('CI-016: Debe rechazar inscripción con motivo', (done) => {
      service.rechazarInscripcion(1, 'No aprobado').subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/inscripciones/1/rechazar')
      );
      expect(req.request.body.motivo).toBe('No aprobado');
      req.flush({ success: true });
    });

    it('CI-017: Debe cancelar inscripción', (done) => {
      service.cancelarInscripcion(1).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/inscripciones/1')
      );
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('CI-018: Debe confirmar inscripción', (done) => {
      service.confirmarInscripcion(1).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/inscripciones/1/confirmar')
      );
      req.flush({});
    });
  });

  describe('5. Solicitudes del Usuario', () => {
    it('CI-019: Debe obtener solicitudes de un usuario', (done) => {
      const mockSolicitudes: SolicitudCursoVerano[] = [];

      service.getSolicitudesUsuario(1).subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/solicitudes/usuario/1')
      );
      req.flush(mockSolicitudes);
    });

    it('CI-020: Debe obtener seguimiento de solicitud', (done) => {
      service.getSeguimientoSolicitud(1).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/solicitudes/1/seguimiento')
      );
      req.flush({});
    });

    it('CI-021: Debe obtener preinscripciones de un usuario', (done) => {
      service.getPreinscripcionesUsuario(1).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/preinscripciones/usuario/1')
      );
      req.flush([]);
    });
  });

  describe('6. Gestión de Cursos (CRUD)', () => {
    it('CI-022: Debe crear curso nuevo', (done) => {
      const payload = {
        nombre_curso: 'Nuevo Curso',
        codigo_curso: 'NC-001',
        descripcion: 'Descripción del curso',
        fecha_inicio: '2025-06-01',
        fecha_fin: '2025-07-31',
        cupo_maximo: 30,
        espacio_asignado: 'Aula 101',
        idMateria: 1,
        idDocente: 10
      };

      service.crearCurso(payload).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/cursos') && req.request.method === 'POST'
      );
      expect(req.request.body.nombre_curso).toBe('Nuevo Curso');
      req.flush({ id_curso: 1 });
    });

    it('CI-023: Debe actualizar curso existente', (done) => {
      const payload = {
        nombre_curso: 'Curso Actualizado',
        cupo_maximo: 35
      };

      service.actualizarCurso(1, payload).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/cursos/1') && request.method === 'PUT'
      );
      expect(req.request.body.nombre_curso).toBe('Curso Actualizado');
      req.flush({});
    });

    it('CI-024: Debe eliminar curso', (done) => {
      service.eliminarCurso(1).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/cursos/1') && request.method === 'DELETE'
      );
      req.flush({});
    });
  });

  describe('7. Notificaciones', () => {
    it('CI-025: Debe obtener notificaciones de un usuario', (done) => {
      service.getNotificacionesUsuario(1).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/notificaciones/usuario/1')
      );
      req.flush([]);
    });

    it('CI-026: Debe obtener notificaciones no leídas', (done) => {
      service.getNotificacionesNoLeidas(1).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/notificaciones/usuario/1/no-leidas')
      );
      req.flush([]);
    });

    it('CI-027: Debe marcar notificación como leída', (done) => {
      service.marcarNotificacionLeida(1).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/notificaciones/1/marcar-leida')
      );
      req.flush({});
    });
  });

  describe('8. Documentos y Comprobantes', () => {
    it('CI-028: Debe descargar comprobante de pago', (done) => {
      const mockBlob = new Blob(['content'], { type: 'application/pdf' });

      service.descargarComprobantePago(1).subscribe((blob) => {
        expect(blob instanceof Blob).toBe(true);
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/inscripciones/1/comprobante-pago')
      );
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });

    it('CI-029: Debe subir documento', (done) => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });

      service.uploadDocumento(1, file).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/solicitudes/1/documentos')
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush({});
    });

    it('CI-030: Debe obtener documentos de solicitud', (done) => {
      service.getDocumentos(1).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/solicitudes/1/documentos')
      );
      req.flush([]);
    });
  });

  describe('9. Datos Complementarios', () => {
    it('CI-031: Debe obtener materias disponibles', (done) => {
      service.getMateriasDisponibles().subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/materias')
      );
      req.flush([]);
    });

    it('CI-032: Debe obtener todos los docentes', (done) => {
      service.getTodosLosDocentes().subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/docentes')
      );
      req.flush([]);
    });

    it('CI-033: Debe obtener condiciones de solicitud', (done) => {
      service.getCondicionesSolicitud().subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/condiciones')
      );
      req.flush([]);
    });

    it('CI-034: Debe obtener estudiantes elegibles de un curso', (done) => {
      service.getEstudiantesElegibles(1).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/cursos/1/estudiantes-elegibles')
      );
      req.flush([]);
    });
  });

  describe('10. Estadísticas y Reportes', () => {
    it('CI-035: Debe obtener estadísticas de un curso', (done) => {
      service.obtenerEstadisticasCurso(1).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/cursos/1/estadisticas')
      );
      req.flush({});
    });

    it('CI-036: Debe obtener seguimiento de actividades', (done) => {
      service.getSeguimientoActividades(1).subscribe(() => done());

      const req = httpMock.expectOne((request) =>
        request.url.includes('/seguimiento/1')
      );
      req.flush({});
    });
  });

  describe('11. Manejo de Errores', () => {
    it('CI-037: Debe manejar error 404 al obtener curso', (done) => {
      service.getCursoPorId(999).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/cursos/999')
      );
      req.flush({ message: 'No encontrado' }, { status: 404, statusText: 'Not Found' });
    });

    it('CI-038: Debe manejar error 400 en creación de curso', (done) => {
      service.crearCurso({} as any).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/cursos')
      );
      req.flush({ message: 'Datos inválidos' }, { status: 400, statusText: 'Bad Request' });
    });

    it('CI-039: Debe manejar error 401 (no autorizado)', (done) => {
      service.getCursosDisponibles().subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/cursos')
      );
      req.flush({ message: 'No autorizado' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('CI-040: Debe manejar error 500 del servidor', (done) => {
      service.getTodosLosCursos().subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes('/cursos')
      );
      req.flush({ message: 'Error interno' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});

