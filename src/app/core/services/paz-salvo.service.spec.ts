import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PazSalvoService } from './paz-salvo.service';
import { AuthService } from './auth.service';
import { SolicitudHomologacionDTORespuesta, Archivo } from '../models/procesos.model';
import { environment } from '../../../environments/environment';

describe('PazSalvoService - Pruebas Unitarias', () => {
  let service: PazSalvoService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;
  
  const apiUrl = `${environment.apiUrl}/solicitudes-pazysalvo`;
  
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
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });
    
    service = TestBed.inject(PazSalvoService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    
    // Mock localStorage
    spyOn(localStorage, 'getItem').and.returnValue('mock-token');
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('1. Configuración y Headers', () => {
    it('PZS-001: Debe crear el servicio correctamente', () => {
      expect(service).toBeTruthy();
    });

    it('PZS-002: Debe incluir token de autorización en headers', (done) => {
      const mockSolicitudes: SolicitudHomologacionDTORespuesta[] = [];
      
      service.listarSolicitudesPorRol('ESTUDIANTE', 1).subscribe(() => {
        done();
      });
      
      const req = httpMock.expectOne((request) => 
        request.url.includes('/listarSolicitud-PazYSalvo/porRol')
      );
      
      expect(req.request.headers.has('Authorization')).toBe(true);
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token');
      
      req.flush(mockSolicitudes);
    });
  });

  describe('2. Listar Solicitudes por Rol', () => {
    it('PZS-003: Debe listar solicitudes para ESTUDIANTE con parámetros', (done) => {
      const mockSolicitudes: any[] = [
        {
          id_solicitud: 1,
          nombre_solicitud: 'Solicitud Test',
          fecha_registro_solicitud: new Date().toISOString(),
          estadosSolicitud: [],
          documentos: [],
          objUsuario: { id_usuario: 1, nombre_completo: 'Test' }
        }
      ];
      
      service.listarSolicitudesPorRol('ESTUDIANTE', 1).subscribe((solicitudes) => {
        expect(solicitudes.length).toBe(1);
        expect(solicitudes[0].id_solicitud).toBe(1);
        done();
      });
      
      const req = httpMock.expectOne((request) => 
        request.url.includes('/porRol') && 
        request.params.has('rol') && 
        request.params.has('idUsuario')
      );
      
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('rol')).toBe('ESTUDIANTE');
      expect(req.request.params.get('idUsuario')).toBe('1');
      
      req.flush(mockSolicitudes);
    });

    it('PZS-004: Debe listar solicitudes para FUNCIONARIO', (done) => {
      const mockSolicitudes: SolicitudHomologacionDTORespuesta[] = [];
      
      service.listarSolicitudesPorRol('FUNCIONARIO').subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });
      
      const req = httpMock.expectOne(`${apiUrl}/listarSolicitud-PazYSalvo/Funcionario`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSolicitudes);
    });

    it('PZS-005: Debe listar solicitudes para COORDINADOR', (done) => {
      const mockSolicitudes: SolicitudHomologacionDTORespuesta[] = [];
      
      service.listarSolicitudesPorRol('COORDINADOR').subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });
      
      const req = httpMock.expectOne(`${apiUrl}/listarSolicitud-PazYSalvo/Coordinador`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSolicitudes);
    });

    it('PZS-006: Debe listar solicitudes para SECRETARIA', (done) => {
      const mockSolicitudes: SolicitudHomologacionDTORespuesta[] = [];
      
      service.listarSolicitudesPorRol('SECRETARIA').subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });
      
      const req = httpMock.expectOne(`${apiUrl}/listarSolicitud-PazYSalvo/Secretaria`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSolicitudes);
    });

    it('PZS-007: Debe convertir rol a mayúsculas automáticamente', (done) => {
      service.listarSolicitudesPorRol('estudiante', 1).subscribe(() => {
        done();
      });
      
      const req = httpMock.expectOne((request) => 
        request.url.includes('/porRol')
      );
      
      expect(req.request.params.get('rol')).toBe('ESTUDIANTE');
      req.flush([]);
    });
  });

  describe('3. Métodos Específicos de Listado', () => {
    it('PZS-008: getStudentRequests debe llamar a listarSolicitudesPorRol', (done) => {
      spyOn(service, 'listarSolicitudesPorRol').and.returnValue(
        new Observable(observer => {
          observer.next([]);
          observer.complete();
        })
      );
      
      service.getStudentRequests(1).subscribe(() => {
        expect(service.listarSolicitudesPorRol).toHaveBeenCalledWith('ESTUDIANTE', 1);
        done();
      });
    });

    it('PZS-009: getPendingRequests debe obtener solicitudes de funcionario', (done) => {
      const mockSolicitudes: SolicitudHomologacionDTORespuesta[] = [];
      
      service.getPendingRequests().subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });
      
      const req = httpMock.expectOne(`${apiUrl}/listarSolicitud-PazYSalvo/Funcionario`);
      req.flush(mockSolicitudes);
    });

    it('PZS-010: getCoordinatorRequests debe obtener solicitudes de coordinador', (done) => {
      service.getCoordinatorRequests().subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });
      
      const req = httpMock.expectOne(`${apiUrl}/listarSolicitud-PazYSalvo/Coordinador`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('PZS-011: getSecretariaRequests debe obtener solicitudes de secretaría', (done) => {
      service.getSecretariaRequests().subscribe((solicitudes) => {
        expect(solicitudes).toEqual([]);
        done();
      });
      
      const req = httpMock.expectOne(`${apiUrl}/listarSolicitud-PazYSalvo/Secretaria`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('4. Crear y Enviar Solicitud', () => {
    beforeEach(() => {
      authService.getUsuario.and.returnValue(mockUsuario);
    });

    it('PZS-012: Debe enviar solicitud correctamente', (done) => {
      const mockArchivos: any[] = [
        { nombre: 'doc.pdf', fecha: new Date().toISOString() }
      ];
      
      service.sendRequest(1, mockArchivos).subscribe((response) => {
        expect(response).toBeTruthy();
        done();
      });
      
      const req = httpMock.expectOne(`${apiUrl}/crearSolicitud-PazYSalvo`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.objUsuario.id_usuario).toBe(1);
      expect(req.request.body.archivos).toEqual(mockArchivos);
      
      req.flush({ id: 1 });
    });

    it('PZS-013: Debe lanzar error si usuario no está autenticado', () => {
      authService.getUsuario.and.returnValue(null);
      
      expect(() => {
        service.sendRequest(1, []);
      }).toThrowError('Usuario no autenticado');
    });

    it('PZS-014: Debe incluir datos completos del usuario en la solicitud', (done) => {
      const mockArchivos: Archivo[] = [];
      
      service.sendRequest(1, mockArchivos).subscribe(() => done());
      
      const req = httpMock.expectOne(`${apiUrl}/crearSolicitud-PazYSalvo`);
      const body = req.request.body;
      
      expect(body.objUsuario.nombre_completo).toBe('Test User');
      expect(body.objUsuario.codigo).toBe('123456');
      expect(body.objUsuario.correo).toBe('test@unicauca.edu.co');
      expect(body.objUsuario.id_rol).toBe(1);
      expect(body.objUsuario.id_programa).toBe(1);
      
      req.flush({ id: 1 });
    });

    it('PZS-015: Debe generar nombre de solicitud automáticamente', (done) => {
      service.sendRequest(1, []).subscribe(() => done());
      
      const req = httpMock.expectOne(`${apiUrl}/crearSolicitud-PazYSalvo`);
      expect(req.request.body.nombre_solicitud).toContain('Solicitud_paz_salvo_');
      expect(req.request.body.nombre_solicitud).toContain('Test User');
      
      req.flush({ id: 1 });
    });
  });

  describe('5. Actualizar Estado de Solicitud', () => {
    it('PZS-016: Debe aprobar solicitud como funcionario', (done) => {
      service.approveRequest(1).subscribe(() => done());
      
      const req = httpMock.expectOne(`${apiUrl}/actualizarEstadoSolicitud`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.idSolicitud).toBe(1);
      expect(req.request.body.nuevoEstado).toBe('APROBADA_FUNCIONARIO');
      
      req.flush({ success: true });
    });

    it('PZS-017: Debe rechazar solicitud con comentario', (done) => {
      const motivo = 'Documentos incompletos';
      
      service.rejectRequest(1, motivo).subscribe(() => done());
      
      const req = httpMock.expectOne(`${apiUrl}/actualizarEstadoSolicitud`);
      expect(req.request.body.idSolicitud).toBe(1);
      expect(req.request.body.nuevoEstado).toBe('RECHAZADA');
      expect(req.request.body.comentario).toBe(motivo);
      
      req.flush({ success: true });
    });

    it('PZS-018: Debe completar validación y enviar a coordinador', (done) => {
      service.completeValidation(1).subscribe(() => done());
      
      const req = httpMock.expectOne(`${apiUrl}/actualizarEstadoSolicitud`);
      expect(req.request.body.nuevoEstado).toBe('EN_REVISION_COORDINADOR');
      
      req.flush({ success: true });
    });

    it('PZS-019: Debe aprobar como coordinador', (done) => {
      service.approveAsCoordinador(1).subscribe(() => done());
      
      const req = httpMock.expectOne(`${apiUrl}/actualizarEstadoSolicitud`);
      expect(req.request.body.nuevoEstado).toBe('APROBADA_COORDINADOR');
      
      req.flush({ success: true });
    });

    it('PZS-020: Debe aprobar definitivamente (secretaría)', (done) => {
      service.approveDefinitively(1).subscribe(() => done());
      
      const req = httpMock.expectOne(`${apiUrl}/actualizarEstadoSolicitud`);
      expect(req.request.body.nuevoEstado).toBe('APROBADA');
      
      req.flush({ success: true });
    });

    it('PZS-021: Debe actualizar estado con comentario opcional', (done) => {
      service.actualizarEstadoSolicitud(1, 'PENDIENTE', 'Comentario de prueba').subscribe(() => done());
      
      const req = httpMock.expectOne(`${apiUrl}/actualizarEstadoSolicitud`);
      expect(req.request.body.comentario).toBe('Comentario de prueba');
      
      req.flush({ success: true });
    });
  });

  describe('6. Gestión de Archivos', () => {
    it('PZS-022: Debe subir archivo PDF correctamente', (done) => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      
      service.subirArchivoPDF(file).subscribe((response) => {
        expect(response).toBeTruthy();
        done();
      });
      
      const req = httpMock.expectOne(`${environment.apiUrl}/archivos/subir/pdf`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      
      req.flush({ nombre: 'test.pdf' });
    });

    it('PZS-023: Debe rechazar archivo mayor a 10MB', (done) => {
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
      const largeFile = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      
      service.subirArchivoPDF(largeFile).subscribe({
        error: (error) => {
          expect(error.status).toBe(413);
          expect(error.error.message).toContain('demasiado grande');
          done();
        }
      });
    });

    it('PZS-024: Debe rechazar archivos que no sean PDF', (done) => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      service.subirArchivoPDF(file).subscribe({
        error: (error) => {
          expect(error.status).toBe(415);
          expect(error.error.message).toContain('Solo se permiten archivos PDF');
          done();
        }
      });
    });

    it('PZS-025: Debe descargar archivo correctamente', (done) => {
      const nombreArchivo = 'documento.pdf';
      const mockBlob = new Blob(['content'], { type: 'application/pdf' });
      
      service.descargarArchivo(nombreArchivo).subscribe((blob) => {
        expect(blob).toBeTruthy();
        expect(blob.type).toBe('application/pdf');
        done();
      });
      
      const req = httpMock.expectOne((request) => 
        request.url.includes('descargar-documento') && 
        request.url.includes(encodeURIComponent(nombreArchivo))
      );
      
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });

    it('PZS-026: Debe obtener documentos de solicitud', (done) => {
      const mockDocumentos = [
        { id: 1, nombre: 'doc1.pdf' },
        { id: 2, nombre: 'doc2.pdf' }
      ];
      
      service.obtenerDocumentos(1).subscribe((docs) => {
        expect(docs.length).toBe(2);
        done();
      });
      
      const req = httpMock.expectOne(`${apiUrl}/obtenerDocumentos/1`);
      req.flush(mockDocumentos);
    });
  });

  describe('7. Oficios y Resoluciones', () => {
    it('PZS-027: Debe obtener oficios de una solicitud', (done) => {
      const mockOficios = [{ id: 1, nombre: 'oficio.pdf' }];
      
      service.obtenerOficios(1).subscribe((oficios) => {
        expect(oficios.length).toBe(1);
        done();
      });
      
      const req = httpMock.expectOne(`${apiUrl}/obtenerOficios/1`);
      req.flush(mockOficios);
    });

    it('PZS-028: Debe descargar oficio como Blob', (done) => {
      const mockBlob = new Blob(['content'], { type: 'application/pdf' });
      
      service.descargarOficio(1).subscribe((blob) => {
        expect(blob instanceof Blob).toBe(true);
        done();
      });
      
      const req = httpMock.expectOne(`${apiUrl}/descargarOficio/1`);
      expect(req.request.responseType).toBe('blob');
      req.flush(mockBlob);
    });

    it('PZS-029: Debe generar documento con parámetros correctos', (done) => {
      service.generarDocumento(1, 'PS-001', '2025-10-24', 'Sin observaciones').subscribe((result) => {
        expect(result.blob).toBeTruthy();
        expect(result.filename).toContain('PS-001');
        done();
      });
      
      const req = httpMock.expectOne(`${environment.apiUrl}/solicitudes-pazysalvo/generar-documento/1`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);
      
      const mockBlob = new Blob(['content'], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const mockResponse = new HttpResponse({
        body: mockBlob,
        headers: new HttpHeaders({ 'Content-Disposition': 'attachment; filename="PAZ_SALVO_PS-001.docx"' })
      });
      
      req.event(mockResponse);
    });
  });

  describe('8. Comentarios y Validaciones', () => {
    it('PZS-030: Debe agregar comentario a documento', (done) => {
      const comentario = 'Falta firma';
      
      service.agregarComentario(1, comentario).subscribe(() => done());
      
      const req = httpMock.expectOne(`${environment.apiUrl}/documentos/añadirComentario`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.idDocumento).toBe(1);
      expect(req.request.body.comentario).toBe(comentario);
      
      req.flush({ success: true });
    });

    it('PZS-031: Debe actualizar estado de documentos', (done) => {
      const documentos = [
        { id: 1, estado: 'APROBADO' },
        { id: 2, estado: 'RECHAZADO' }
      ];
      
      service.actualizarEstadoDocumentos(1, documentos).subscribe(() => done());
      
      const req = httpMock.expectOne(`${apiUrl}/actualizarEstadoDocumentos`);
      expect(req.request.body.documentos).toEqual(documentos);
      
      req.flush({ success: true });
    });
  });

  describe('9. Manejo de Errores', () => {
    it('PZS-032: Debe manejar error 404 en solicitud', (done) => {
      service.getRequestById(999).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });
      
      const req = httpMock.expectOne(`${apiUrl}/listarSolicitud-PazYSalvo/999`);
      req.flush({ message: 'No encontrado' }, { status: 404, statusText: 'Not Found' });
    });

    it('PZS-033: Debe manejar error 401 (no autorizado)', (done) => {
      service.listarSolicitudesPorRol('ESTUDIANTE', 1).subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        }
      });
      
      const req = httpMock.expectOne((request) => request.url.includes('/porRol'));
      req.flush({ message: 'No autorizado' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('PZS-034: Debe manejar error 500 del servidor', (done) => {
      authService.getUsuario.and.returnValue(mockUsuario);
      service.sendRequest(1, []).subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });
      
      const req = httpMock.expectOne(`${apiUrl}/crearSolicitud-PazYSalvo`);
      req.flush({ message: 'Error interno' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('10. Métodos Auxiliares', () => {
    it('PZS-035: Debe obtener solicitud por ID', (done) => {
      const mockSolicitud: any = { id: 1, nombre: 'Test' };
      
      service.getRequestById(1).subscribe((solicitud: any) => {
        expect(solicitud.id).toBe(1);
        done();
      });
      
      const req = httpMock.expectOne(`${apiUrl}/listarSolicitud-PazYSalvo/1`);
      req.flush(mockSolicitud);
    });

    it('PZS-036: Debe asociar documentos huérfanos', (done) => {
      service.asociarDocumentosHuerfanos(1).subscribe(() => done());
      
      const req = httpMock.expectOne(`${apiUrl}/asociar-documentos-huerfanos/1`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });

    it('PZS-037: Debe obtener documentos como coordinador', (done) => {
      service.obtenerDocumentosCoordinador(1).subscribe((documentos) => {
        expect(documentos).toEqual([]);
        done();
      });
      
      const req = httpMock.expectOne(`${apiUrl}/obtenerDocumentos/coordinador/1`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });
});

