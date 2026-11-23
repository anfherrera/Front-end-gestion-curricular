import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpErrorResponse, HttpHeaders, HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { ReingresoEstudianteComponent } from './reingreso-estudiante.component';
import { ReingresoEstudianteService } from '@core/services/reingreso-estudiante.service';
import { FormatosInstitucionalesService } from '@core/services/formatos-institucionales.service';
import { LoggerService } from '@core/services/logger.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { PeriodosAcademicosService } from '@core/services/periodos-academicos.service';
import { Archivo, EstadoSolicitudDTORespuesta, SolicitudReingresoDTORespuesta } from '@core/models/procesos.model';
import { FileUploadComponent } from '@shared/components/file-upload-dialog/file-upload-dialog.component';
import { VerComentariosDialogData } from '@shared/components/ver-comentarios-dialog/ver-comentarios-dialog.component';

const archivo = (nombre: string): Archivo => ({ nombre, fecha: '2025-01-15' });

describe('ReingresoEstudianteComponent', () => {
  let component: ReingresoEstudianteComponent;
  let fixture: ComponentFixture<ReingresoEstudianteComponent>;
  let reingresoService: jasmine.SpyObj<ReingresoEstudianteService>;
  let compiled: HTMLElement;

  const mockUsuario = {
    id_usuario: 1,
    nombre_completo: 'Estudiante Test',
    codigo: '12345',
    correo: 'test@unicauca.edu.co',
    rol: { nombre: 'ESTUDIANTE' },
    objPrograma: { id_programa: 1, nombre_programa: 'Ingenieria' },
  };

  beforeEach(async () => {
    const reingresoServiceSpy = jasmine.createSpyObj('ReingresoEstudianteService', [
      'listarSolicitudesPorRol',
      'crearSolicitud',
      'descargarArchivo',
      'obtenerOficios',
      'descargarOficioConNombre',
    ]);
    const formatosServiceSpy = jasmine.createSpyObj('FormatosInstitucionalesService', ['getReingreso']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['log', 'warn', 'error', 'debug']);
    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['extraerMensajeError']);
    const periodosServiceSpy = jasmine.createSpyObj('PeriodosAcademicosService', ['getPeriodoActualValue']);

    reingresoServiceSpy.listarSolicitudesPorRol.and.returnValue(of([]));
    formatosServiceSpy.getReingreso.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [ReingresoEstudianteComponent, HttpClientTestingModule, NoopAnimationsModule],
      providers: [
        { provide: ReingresoEstudianteService, useValue: reingresoServiceSpy },
        { provide: FormatosInstitucionalesService, useValue: formatosServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: LoggerService, useValue: loggerSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        { provide: PeriodosAcademicosService, useValue: periodosServiceSpy },
      ],
    }).compileComponents();

    reingresoService = TestBed.inject(ReingresoEstudianteService) as jasmine.SpyObj<ReingresoEstudianteService>;

    window.localStorage.setItem('usuario', JSON.stringify(mockUsuario));

    fixture = TestBed.createComponent(ReingresoEstudianteComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('RE-E-001: Debe renderizar secciones principales', () => {
    expect(compiled.querySelector('app-required-docs')).toBeTruthy();
    expect(compiled.querySelector('app-file-upload')).toBeTruthy();
    // Sin solicitudes, el seguimiento muestra el mensaje vacío en lugar de la tabla
    expect(compiled.querySelector('.sin-solicitudes')).toBeTruthy();
  });

  it('RE-E-002: puedeEnviar debe ser false sin archivos', () => {
    component.archivosActuales.set([]);
    component.usuario = mockUsuario;
    expect(component.puedeEnviar()).toBeFalse();
  });

  it('RE-E-003: puedeEnviar debe ser true con archivos y usuario', () => {
    component.archivosActuales.set([archivo('doc.pdf')]);
    component.usuario = mockUsuario;
    expect(component.puedeEnviar()).toBeTrue();
  });

  it('RE-E-004: puedeEnviar debe ser false sin usuario', () => {
    component.archivosActuales.set([archivo('doc.pdf')]);
    component.usuario = null;
    expect(component.puedeEnviar()).toBeFalse();
  });

  it('RE-E-005: onArchivosChange debe actualizar archivosActuales', () => {
    const archivos = [archivo('a.pdf'), archivo('b.pdf')];
    component.onArchivosChange(archivos);
    expect(component.archivosActuales()).toEqual(archivos);
  });

  it('RE-E-006: listarSolicitudes debe llamar listarSolicitudesPorRol con ESTUDIANTE', fakeAsync(() => {
    reingresoService.listarSolicitudesPorRol.calls.reset();
    component.usuario = mockUsuario;
    component.listarSolicitudes();
    tick();
    expect(reingresoService.listarSolicitudesPorRol).toHaveBeenCalledWith('ESTUDIANTE', mockUsuario.id_usuario);
  }));

  it('RE-E-007: listarSolicitudes no debe llamar al servicio si no hay usuario', () => {
    reingresoService.listarSolicitudesPorRol.calls.reset();
    component.usuario = null;
    component.listarSolicitudes();
    expect(reingresoService.listarSolicitudesPorRol).not.toHaveBeenCalled();
  });

  it('RE-E-008: debe tener documentosRequeridos definidos', () => {
    expect(component.documentosRequeridos.length).toBeGreaterThan(0);
    expect(component.documentosRequeridos[0].label).toContain('Reingreso');
  });

  /** Solicitud de reingreso con solo los campos que usa cada prueba. */
  const solicitud = (datos: Partial<SolicitudReingresoDTORespuesta>) => datos as SolicitudReingresoDTORespuesta;
  const estado = (estado_actual: string, comentario?: string): EstadoSolicitudDTORespuesta => ({
    id_estado: 1,
    estado_actual,
    fecha_registro_estado: '2025-01-01T00:00:00.000Z',
    comentario,
  });

  it('RE-E-009: muestra el aviso de rechazo cuando el backend manda RECHAZADA', () => {
    component.procesarSolicitudes([
      solicitud({ id_solicitud: 1, nombre_solicitud: 'Primera', estadosSolicitud: [estado('ENVIADA')] }),
      solicitud({
        id_solicitud: 2,
        nombre_solicitud: 'Segunda',
        estadosSolicitud: [estado('ENVIADA'), estado('RECHAZADA', 'Falta la carta')],
      }),
    ]);
    expect(component.ultimaRechazada()?.comentarios).toBe('Falta la carta');

    component.procesarSolicitudes([
      solicitud({ id_solicitud: 3, nombre_solicitud: 'Tercera', estadosSolicitud: [estado('APROBADA')] }),
    ]);
    expect(component.ultimaRechazada()).toBeNull();
  });

  it('RE-E-010: verComentarios pasa al diálogo el comentario del último rechazo', () => {
    const dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    // La página importa MatDialogModule y recibe su propio MatDialog: se sustituye por el espía
    component['dialog'] = dialog;
    component.solicitudesCompletas = [
      solicitud({
        id_solicitud: 4,
        nombre_solicitud: 'Reingreso',
        documentos: [
          {
            id_documento: 1,
            nombre: 'carta.pdf',
            ruta_documento: 'carta.pdf',
            fecha_documento: '2025-01-01',
            esValido: false,
            comentario: 'Sin firma',
          },
        ],
        estadosSolicitud: [estado('ENVIADA'), estado('RECHAZADA', 'Corrige la carta')],
      }),
    ];

    component.verComentarios(4);

    const data = dialog.open.calls.mostRecent().args[1]?.data as VerComentariosDialogData;
    expect(data.titulo).toBe('Comentarios - Reingreso');
    expect(data.documentos.length).toBe(1);
    expect(data.comentarioRechazo).toBe('Corrige la carta');
  });

  it('RE-E-011: despues de enviar limpia los archivos y da el pulso de reset', fakeAsync(() => {
    const archivos = [archivo('carta.pdf')];
    reingresoService.crearSolicitud.and.returnValue(of({} as SolicitudReingresoDTORespuesta));
    component.archivosActuales.set(archivos);
    component.fileUploadComponent = {
      subirArchivosPendientes: () => of(archivos),
      resetearEstadoCarga: jasmine.createSpy('resetearEstadoCarga'),
    } as unknown as FileUploadComponent;

    component.onSolicitudEnviada();
    expect(component.resetFileUpload()).toBeTrue();
    tick();

    expect(reingresoService.crearSolicitud).toHaveBeenCalled();
    expect(component.archivosActuales()).toEqual([]);
    expect(component.resetFileUpload()).toBeFalse();
  }));

  describe('descargarOficio', () => {
    let nombreDescargado: string;
    const documento = (nombre: string, fecha_documento: string) => ({
      id_documento: 1,
      nombre,
      ruta_documento: nombre,
      fecha_documento,
      esValido: true,
    });

    beforeEach(() => {
      nombreDescargado = '';
      // descargarBlob crea un enlace y lo pulsa: se intercepta el clic para leer el nombre
      spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
        nombreDescargado = this.download;
      });
    });

    it('RE-E-012: baja por su nombre la resolución más reciente, no los documentos del estudiante', () => {
      reingresoService.descargarArchivo.and.returnValue(of(new Blob()));
      component.solicitudesCompletas = [
        solicitud({
          id_solicitud: 7,
          documentos: [
            documento('Certificado de notas.pdf', '2026-11-01'),
            documento('Oficio de reingreso.pdf', '2026-11-02'),
            documento('Resolucion reingreso 7.pdf', '2026-11-10'),
          ],
        }),
      ];

      component.descargarOficio(7, 'oficio.pdf');

      expect(reingresoService.descargarArchivo).toHaveBeenCalledWith('Resolucion reingreso 7.pdf');
      expect(reingresoService.obtenerOficios).not.toHaveBeenCalled();
      expect(nombreDescargado).toBe('Resolucion reingreso 7.pdf');
    });

    it('RE-E-013: sin resolución entre los documentos, pide el oficio al backend con el nombre de Content-Disposition', () => {
      reingresoService.obtenerOficios.and.returnValue(of([{ id: 8, nombre: 'oficio_8.pdf' }]));
      reingresoService.descargarOficioConNombre.and.returnValue(
        of(
          new HttpResponse({
            body: new Blob(),
            headers: new HttpHeaders({ 'Content-Disposition': 'attachment; filename="Resolución 8.pdf"' }),
          })
        )
      );
      component.solicitudesCompletas = [
        solicitud({ id_solicitud: 8, documentos: [documento('Certificado de notas.pdf', '2026-11-01')] }),
      ];

      component.descargarOficio(8, 'oficio.pdf');

      expect(reingresoService.descargarArchivo).not.toHaveBeenCalled();
      expect(reingresoService.descargarOficioConNombre).toHaveBeenCalledWith(8);
      expect(nombreDescargado).toBe('Resolución 8.pdf');
    });

    it('RE-E-014: si la resolución no baja por su nombre, la pide al backend; sin oficios avisa', () => {
      const snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
      reingresoService.descargarArchivo.and.returnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
      reingresoService.obtenerOficios.and.returnValue(of([]));
      component.solicitudesCompletas = [
        solicitud({ id_solicitud: 9, documentos: [documento('Resolucion 9.pdf', '2026-11-10')] }),
      ];

      component.descargarOficio(9, 'oficio.pdf');

      expect(reingresoService.obtenerOficios).toHaveBeenCalledWith(9);
      expect(reingresoService.descargarOficioConNombre).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith(
        'No hay oficios disponibles para esta solicitud',
        'Cerrar',
        jasmine.any(Object)
      );
      expect(nombreDescargado).toBe('');
    });
  });
});
