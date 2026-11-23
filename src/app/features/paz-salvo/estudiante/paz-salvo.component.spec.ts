import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

import { PazSalvoComponent } from './paz-salvo.component';
import { PazSalvoService } from '@core/services/paz-salvo.service';
import { NotificacionesService } from '@core/services/notificaciones.service';
import { BlobConNombre } from '@core/services/paz-salvo.service';
import {
  Archivo,
  DocumentoHomologacion,
  EstadoSolicitud,
  Solicitud,
  SolicitudHomologacionDTORespuesta,
} from '@core/models/procesos.model';
import { FileUploadComponent } from '@shared/components/file-upload-dialog/file-upload-dialog.component';
import { VerComentariosDialogData } from '@shared/components/ver-comentarios-dialog/ver-comentarios-dialog.component';

const archivo = (nombre: string): Archivo => ({ nombre, fecha: '2025-01-15' });
const estado = (estado_actual: string, comentario?: string): EstadoSolicitud => ({
  id_estado: 1,
  estado_actual,
  fecha_registro_estado: '2025-01-01T00:00:00.000Z',
  comentario,
});
const documento = (nombre: string, comentario?: string): DocumentoHomologacion => ({
  id_documento: 1,
  nombre,
  ruta_documento: nombre,
  fecha_documento: '2025-01-01',
  esValido: true,
  comentario,
});
/** Solicitud con solo los campos que usa cada prueba. */
const solicitud = (datos: Partial<SolicitudHomologacionDTORespuesta>) => datos as SolicitudHomologacionDTORespuesta;
/** Mock incompleto a propósito: el componente solo usa estos dos métodos del FileUploadComponent. */
const comoFileUpload = (mock: Pick<FileUploadComponent, 'subirArchivosPendientes' | 'resetearEstadoCarga'>) =>
  mock as unknown as FileUploadComponent;

describe('PazSalvoComponent', () => {
  let component: PazSalvoComponent;
  let fixture: ComponentFixture<PazSalvoComponent>;
  let pazSalvoService: jasmine.SpyObj<PazSalvoService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let compiled: HTMLElement;

  const mockUsuario = {
    id_usuario: 1,
    nombre_completo: 'Test User',
    codigo: '12345',
    correo: 'test@unicauca.edu.co',
    rol: { nombre: 'ESTUDIANTE' },
    objPrograma: { id_programa: 1, nombre_programa: 'Ingeniería' },
  };

  beforeEach(async () => {
    const pazSalvoServiceSpy = jasmine.createSpyObj('PazSalvoService', [
      'listarSolicitudesPorRol',
      'crearSolicitudConFormulario',
      'descargarOficioPorSolicitud',
      'obtenerComentarios',
    ]);
    const notificacionesServiceSpy = jasmine.createSpyObj('NotificacionesService', ['actualizarNotificaciones']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);

    await TestBed.configureTestingModule({
      imports: [PazSalvoComponent, BrowserAnimationsModule],
      providers: [
        { provide: PazSalvoService, useValue: pazSalvoServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: NotificacionesService, useValue: notificacionesServiceSpy },
      ],
    }).compileComponents();

    pazSalvoService = TestBed.inject(PazSalvoService) as jasmine.SpyObj<PazSalvoService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    window.localStorage.setItem('usuario', JSON.stringify(mockUsuario));

    pazSalvoService.listarSolicitudesPorRol.and.returnValue(of([]));
    pazSalvoService.crearSolicitudConFormulario.and.returnValue(of({} as Solicitud));

    fixture = TestBed.createComponent(PazSalvoComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    pazSalvoService.listarSolicitudesPorRol.calls.reset();
    pazSalvoService.crearSolicitudConFormulario.calls.reset();
    snackBar.open.calls.reset();
    dialog.open.calls.reset();
    window.localStorage.clear();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe renderizar secciones principales', () => {
    expect(compiled.querySelector('app-required-docs')).toBeTruthy();
    expect(compiled.querySelector('app-file-upload')).toBeTruthy();
    expect(compiled.querySelectorAll('.card-title').length).toBeGreaterThan(0);
  });

  /** Completa el formulario obligatorio (fecha de terminación y, si aplica, trabajo de grado). */
  function completarFormulario(): void {
    component.solicitudForm.patchValue({
      fecha_terminacion_plan: new Date('2025-06-30'),
      titulo_trabajo_grado: 'Título de prueba',
      director_trabajo_grado: 'Director de prueba',
    });
  }

  it('debe determinar si puede enviar según archivos y usuario', () => {
    completarFormulario();
    component.archivosActuales.set([]);
    expect(component.puedeEnviar()).toBeFalse();

    // Programa sin todos los documentos obligatorios: no puede enviar
    component.archivosActuales.set([archivo('test.pdf')]);
    expect(component.puedeEnviar()).toBeFalse();

    // Telemática solo exige la cédula
    component.usuario = {
      ...mockUsuario,
      objPrograma: { id_programa: 1, nombre_programa: 'Tecnología en Telemática' },
    };
    component.archivosActuales.set([archivo('cedula.pdf')]);
    expect(component.puedeEnviar()).toBeTrue();

    component.usuario = null;
    expect(component.puedeEnviar()).toBeFalse();
  });

  it('debe actualizar archivos al llamar onArchivosChange', () => {
    const archivos = [archivo('a.pdf'), archivo('b.pdf')];
    component.onArchivosChange(archivos);
    expect(component.archivosActuales()).toEqual(archivos);
  });

  it('debe enviar solicitud exitosamente y resetear el estado', fakeAsync(() => {
    const archivos: Archivo[] = [{ nombre: 'test.pdf', fecha: new Date().toISOString() }];
    const fileUploadMock = {
      subirArchivosPendientes: () => of(archivos),
      resetearEstadoCarga: jasmine.createSpy('resetearEstadoCarga'),
    };

    completarFormulario();
    component.archivosActuales.set(archivos);
    component.fileUploadComponent = comoFileUpload(fileUploadMock);

    component.onSolicitudEnviada();
    tick();
    tick();

    expect(pazSalvoService.crearSolicitudConFormulario).toHaveBeenCalledWith(
      mockUsuario.id_usuario,
      archivos,
      jasmine.any(Object)
    );
    expect(snackBar.open).toHaveBeenCalledWith(
      jasmine.stringMatching('Solicitud de paz y salvo'),
      'Cerrar',
      jasmine.objectContaining({ panelClass: ['snackbar-success'] })
    );
    expect(fileUploadMock.resetearEstadoCarga).not.toHaveBeenCalled();
    expect(component.resetFileUpload()).toBeFalse();
  }));

  it('debe manejar error al subir documentos mostrando mensaje', fakeAsync(() => {
    const fileUploadMock = {
      subirArchivosPendientes: () => throwError(() => new Error('fallo')),
      resetearEstadoCarga: jasmine.createSpy('resetearEstadoCarga'),
    };

    component.fileUploadComponent = comoFileUpload(fileUploadMock);

    component.onSolicitudEnviada();
    tick();

    expect(snackBar.open).toHaveBeenCalledWith(
      jasmine.stringMatching('Error al subir documentos'),
      'Cerrar',
      jasmine.objectContaining({ panelClass: ['snackbar-error'] })
    );
    expect(fileUploadMock.resetearEstadoCarga).toHaveBeenCalled();
  }));

  it('debe transformar solicitudes recibidas', fakeAsync(() => {
    const respuesta = [
      solicitud({
        id_solicitud: 10,
        nombre_solicitud: 'Solicitud 10',
        fecha_registro_solicitud: '2025-01-01T00:00:00.000Z',
        estadosSolicitud: [estado('PENDIENTE', 'Esperando revisión')],
        documentos: [documento('oficio_paz_salvo_10.pdf')],
      }),
    ];

    pazSalvoService.listarSolicitudesPorRol.and.returnValue(of(respuesta));
    pazSalvoService.listarSolicitudesPorRol.calls.reset();

    component.listarSolicitudes();
    tick();

    expect(pazSalvoService.listarSolicitudesPorRol).toHaveBeenCalledWith('ESTUDIANTE', mockUsuario.id_usuario);
    expect(component.solicitudes().length).toBe(1);
    expect(component.solicitudes()[0].estado as string).toBe('PENDIENTE');
    expect(component.solicitudesCompletas[0].documentos.length).toBe(1);
  }));

  it('debe abrir el diálogo de comentarios con información correcta', () => {
    const solicitudCompleta = solicitud({
      id_solicitud: 5,
      nombre_solicitud: 'Solicitud Rechazada',
      documentos: [documento('doc.pdf', 'Falta firma')],
      estadosSolicitud: [estado('RECHAZADA', 'Corrige el documento')],
    });

    component.solicitudesCompletas = [solicitudCompleta];

    // El componente pide los comentarios al backend antes de abrir el diálogo
    pazSalvoService.obtenerComentarios.and.returnValue(
      of({
        documentosConComentarios: [{ id: 1, nombre: 'doc.pdf', comentario: 'Falta firma' }],
        comentarioRechazo: 'Corrige el documento',
      })
    );

    // Mock incompleto a propósito: solo se usa afterClosed()
    dialog.open.and.returnValue({
      afterClosed: () => of(true),
    } as unknown as MatDialogRef<unknown>);

    // El componente importa MatDialogModule y recibe su propio MatDialog: se sustituye por el espía
    component['dialog'] = dialog;

    component.verComentarios(5);

    expect(dialog.open).toHaveBeenCalled();
    const [, config] = dialog.open.calls.mostRecent().args;
    const data = config?.data as VerComentariosDialogData | undefined;
    expect(data).toBeTruthy();
    expect(data?.titulo).toContain('Comentarios');
    expect(data?.comentarioRechazo).toBe('Corrige el documento');
  });

  it('debe descargar el oficio con el nombre que entrega el servicio', () => {
    const blob: BlobConNombre = Object.assign(new Blob(['pdf'], { type: 'application/pdf' }), {
      filename: 'OFICIO_PAZ_SALVO.pdf',
    });
    pazSalvoService.descargarOficioPorSolicitud.and.returnValue(of(blob));
    spyOn(URL, 'createObjectURL').and.returnValue('blob:prueba');
    spyOn(URL, 'revokeObjectURL');

    component.descargarOficio(7, 'respaldo.pdf');

    expect(pazSalvoService.descargarOficioPorSolicitud).toHaveBeenCalledWith(7);
    expect(snackBar.open).toHaveBeenCalledWith(
      'Oficio descargado exitosamente',
      'Cerrar',
      jasmine.objectContaining({ panelClass: ['snackbar-success'] })
    );
  });

  it('debe avisar cuando la solicitud no tiene oficio', () => {
    pazSalvoService.descargarOficioPorSolicitud.and.returnValue(throwError(() => ({ status: 404 })));

    component.descargarOficio(7, 'respaldo.pdf');

    expect(snackBar.open).toHaveBeenCalledWith(
      'No hay oficios disponibles para esta solicitud',
      'Cerrar',
      jasmine.objectContaining({ panelClass: ['snackbar-warning'] })
    );
  });

  describe('Usabilidad y funcionalidad adicional', () => {
    it('PS-011: Debe obtener solicitud completa por ID', () => {
      component.solicitudesCompletas = [
        solicitud({ id_solicitud: 1, nombre_solicitud: 'Solicitud 1' }),
        solicitud({ id_solicitud: 2, nombre_solicitud: 'Solicitud 2' }),
      ];

      expect(component['obtenerSolicitudCompleta'](1)?.id_solicitud).toBe(1);
      expect(component['obtenerSolicitudCompleta'](3)).toBeUndefined();
    });

    it('PS-012: Sistemas exige el formato PPH o TIH', () => {
      component.usuario = {
        ...mockUsuario,
        objPrograma: { id_programa: 1, nombre_programa: 'Ingeniería de Sistemas' },
      };
      component.archivosActuales.set([archivo('Formato PM-FO-4-FOR-27 (Hoja de vida académica).pdf')]);

      expect(component.obtenerDocumentosFaltantes()).toContain('Formato PPH o TIH (requerido para tu programa)');

      component.archivosActuales.update((archivos) => [...archivos, archivo('Formato TIH.pdf')]);
      expect(component.obtenerDocumentosFaltantes()).not.toContain('Formato PPH o TIH (requerido para tu programa)');
    });

    it('PS-013: Telemática rechaza los formatos de trabajo de grado', () => {
      component.usuario = {
        ...mockUsuario,
        objPrograma: { id_programa: 1, nombre_programa: 'Tecnología en Telemática' },
      };
      component.archivosActuales.set([archivo('cedula.pdf'), archivo('Formato TI-G.pdf')]);

      expect(component.obtenerDocumentosFaltantes()).toEqual([
        'Los formatos TI-G/TI-H no aplican para tu programa (Telemática)',
      ]);
      expect(component.puedeEnviar()).toBeFalse();
    });

    it('PS-017: Debe manejar listarSolicitudes sin usuario', () => {
      // Resetear el spy para limpiar llamadas anteriores
      pazSalvoService.listarSolicitudesPorRol.calls.reset();

      component.usuario = null;

      expect(() => {
        component.listarSolicitudes();
      }).not.toThrow();

      expect(pazSalvoService.listarSolicitudesPorRol).not.toHaveBeenCalled();
    });

    it('PS-018: onArchivosChange debe actualizar archivos correctamente', () => {
      const nuevosArchivos = [archivo('test1.pdf'), archivo('test2.pdf')];

      component.onArchivosChange(nuevosArchivos);

      expect(component.archivosActuales()).toEqual(nuevosArchivos);
      expect(component.archivosActuales().length).toBe(2);
    });

    it('PS-019: puedeEnviar debe retornar false cuando no hay usuario', () => {
      component.archivosActuales.set([archivo('test.pdf')]);
      component.usuario = null;

      expect(component.puedeEnviar()).toBeFalse();
    });

    it('PS-020: puedeEnviar debe retornar false cuando no hay archivos', () => {
      component.archivosActuales.set([]);
      component.usuario = mockUsuario;

      expect(component.puedeEnviar()).toBeFalse();
    });
  });
});
