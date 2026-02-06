import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';

import { PazSalvoComponent } from './paz-salvo.component';
import { PazSalvoService } from '../../../core/services/paz-salvo.service';

describe('PazSalvoComponent', () => {
  let component: PazSalvoComponent;
  let fixture: ComponentFixture<PazSalvoComponent>;
  let pazSalvoService: jasmine.SpyObj<PazSalvoService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let httpClient: jasmine.SpyObj<HttpClient>;
  let compiled: HTMLElement;

  const mockUsuario = {
    id_usuario: 1,
    nombre_completo: 'Test User',
    codigo: '12345',
    correo: 'test@unicauca.edu.co',
    rol: { nombre: 'ESTUDIANTE' },
    objPrograma: { id: 1, nombre: 'Ingeniería' }
  };

  beforeEach(async () => {
    const pazSalvoServiceSpy = jasmine.createSpyObj('PazSalvoService', [
      'listarSolicitudesPorRol',
      'sendRequest',
      'descargarOficio',
      'obtenerDocumentos'
    ]);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const httpClientSpy = jasmine.createSpyObj('HttpClient', ['get']);

    await TestBed.configureTestingModule({
      imports: [PazSalvoComponent, BrowserAnimationsModule],
      providers: [
        { provide: PazSalvoService, useValue: pazSalvoServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: HttpClient, useValue: httpClientSpy }
      ]
    }).compileComponents();

    pazSalvoService = TestBed.inject(PazSalvoService) as jasmine.SpyObj<PazSalvoService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    httpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;

    window.localStorage.setItem('usuario', JSON.stringify(mockUsuario));

    pazSalvoService.listarSolicitudesPorRol.and.returnValue(of([]));
    pazSalvoService.sendRequest.and.returnValue(of({} as any));

    fixture = TestBed.createComponent(PazSalvoComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    pazSalvoService.listarSolicitudesPorRol.calls.reset();
    pazSalvoService.sendRequest.calls.reset();
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

  it('debe determinar si puede enviar según archivos y usuario', () => {
    component.archivosActuales = [];
    expect(component.puedeEnviar()).toBeFalse();

    component.archivosActuales = [{ nombre: 'test.pdf' } as any];
    expect(component.puedeEnviar()).toBeTrue();

    component.usuario = null;
    expect(component.puedeEnviar()).toBeFalse();
  });

  it('debe actualizar archivos al llamar onArchivosChange', () => {
    const archivos = [{ nombre: 'a.pdf' }, { nombre: 'b.pdf' }] as any[];
    component.onArchivosChange(archivos);
    expect(component.archivosActuales).toEqual(archivos);
  });

  it('debe enviar solicitud exitosamente y resetear el estado', fakeAsync(() => {
    const archivos = [{ nombre: 'test.pdf', fecha: new Date().toISOString() }];
    const fileUploadMock = {
      subirArchivosPendientes: () => of(archivos),
      resetearEstadoCarga: jasmine.createSpy('resetearEstadoCarga')
    };

    component.archivosActuales = archivos as any;
    component.fileUploadComponent = fileUploadMock as any;

    const mostrarSpy = spyOn<any>(component, 'mostrarMensaje').and.callThrough();

    component.onSolicitudEnviada();
    tick();
    tick();

    expect(pazSalvoService.sendRequest).toHaveBeenCalledWith(mockUsuario.id_usuario, archivos);
    expect(mostrarSpy).toHaveBeenCalledWith(jasmine.stringMatching('Solicitud de paz y salvo'), 'success');
    expect(fileUploadMock.resetearEstadoCarga).not.toHaveBeenCalled();
    expect(component.resetFileUpload).toBeFalse();
  }));

  it('debe manejar error al subir documentos mostrando mensaje', fakeAsync(() => {
    const fileUploadMock = {
      subirArchivosPendientes: () => throwError(() => new Error('fallo')),
      resetearEstadoCarga: jasmine.createSpy('resetearEstadoCarga')
    };

    component.fileUploadComponent = fileUploadMock as any;

    const mostrarSpy = spyOn<any>(component, 'mostrarMensaje').and.callThrough();

    component.onSolicitudEnviada();
    tick();

    expect(mostrarSpy).toHaveBeenCalledWith(jasmine.stringMatching('Error al subir documentos'), 'error');
    expect(fileUploadMock.resetearEstadoCarga).toHaveBeenCalled();
  }));

  it('debe transformar solicitudes recibidas', fakeAsync(() => {
    const respuesta = [
      {
        id_solicitud: 10,
        nombre_solicitud: 'Solicitud 10',
        fecha_registro_solicitud: '2025-01-01T00:00:00.000Z',
        estadosSolicitud: [
          { estado_actual: 'PENDIENTE', comentarios: 'Esperando revisión' }
        ],
        documentos: [
          { nombre: 'oficio_paz_salvo_10.pdf' }
        ]
      }
    ];

    pazSalvoService.listarSolicitudesPorRol.and.returnValue(of(respuesta as any));
    pazSalvoService.listarSolicitudesPorRol.calls.reset();

    component.listarSolicitudes();
    tick();

    expect(pazSalvoService.listarSolicitudesPorRol).toHaveBeenCalledWith('ESTUDIANTE', mockUsuario.id_usuario);
    expect(component.solicitudes.length).toBe(1);
    expect(component.solicitudes[0].estado as string).toBe('PENDIENTE');
    expect(component.solicitudesCompletas[0].documentos.length).toBe(1);
  }));

  it('debe abrir el diálogo de comentarios con información correcta', () => {
    const solicitudCompleta = {
      id_solicitud: 5,
      nombre_solicitud: 'Solicitud Rechazada',
      documentos: [{ nombre: 'doc.pdf', comentario: 'Falta firma' }],
      estadosSolicitud: [
        { estado_actual: 'RECHAZADA', comentario: 'Corrige el documento' }
      ]
    } as any;

    component.solicitudesCompletas = [solicitudCompleta];

    dialog.open.and.returnValue({
      afterClosed: () => of(true)
    } as any);

    component['dialog'] = dialog as any;

    component.verComentarios(5);

    expect(dialog.open).toHaveBeenCalled();
    const [, config] = dialog.open.calls.mostRecent().args;
    const data = (config as any)?.data;
    expect(data).toBeTruthy();
    expect(data.titulo).toContain('Comentarios');
    expect(data.comentarioRechazo).toBe('Corrige el documento');
  });

  it('debe detectar si una solicitud está rechazada', () => {
    expect(component.esSolicitudRechazada('RECHAZADA')).toBeTrue();
    expect(component.esSolicitudRechazada('APROBADA')).toBeFalse();
  });

  it('debe indicar si hay comentarios asociados a documentos', () => {
    component.solicitudesCompletas = [
      {
        id_solicitud: 1,
        documentos: [{ nombre: 'doc.pdf', comentario: 'Observación' }]
      }
    ] as any;

    expect(component.tieneComentarios(1)).toBeTrue();
    expect(component.tieneComentarios(2)).toBeFalse();
  });

  describe('Usabilidad y funcionalidad adicional', () => {
    it('PS-011: Debe obtener solicitud completa por ID', () => {
      component.solicitudesCompletas = [
        { id_solicitud: 1, nombre_solicitud: 'Solicitud 1' },
        { id_solicitud: 2, nombre_solicitud: 'Solicitud 2' }
      ] as any;

      expect(component['obtenerSolicitudCompleta'](1)?.id_solicitud).toBe(1);
      expect(component['obtenerSolicitudCompleta'](3)).toBeUndefined();
    });

    it('PS-012: Debe obtener comentario de rechazo correctamente', () => {
      component.solicitudesCompletas = [{
        id_solicitud: 1,
        estadosSolicitud: [
          { estado_actual: 'PENDIENTE', comentario: null },
          { estado_actual: 'RECHAZADA', comentario: 'Documentos incompletos' }
        ]
      }] as any;

      const comentario = component['obtenerComentarioRechazo'](component.solicitudesCompletas[0]);
      expect(comentario).toBe('Documentos incompletos');
    });

    it('PS-013: Debe manejar solicitud sin estados correctamente', () => {
      component.solicitudesCompletas = [{
        id_solicitud: 1,
        estadosSolicitud: []
      }] as any;

      const comentario = component['obtenerComentarioRechazo'](component.solicitudesCompletas[0]);
      expect(comentario).toBeNull();
    });

    it('PS-014: Debe obtener estado actual de una solicitud', () => {
      const solicitud = {
        estadosSolicitud: [
          { estado_actual: 'PENDIENTE' },
          { estado_actual: 'APROBADA' }
        ]
      };

      expect(component['obtenerEstadoActual'](solicitud)).toBe('APROBADA');
    });

    it('PS-015: Debe manejar solicitud sin estados en obtenerEstadoActual', () => {
      const solicitud = { estadosSolicitud: [] };
      expect(component['obtenerEstadoActual'](solicitud)).toBe('Pendiente');
    });

    it('PS-016: Debe verificar funcionalidad de comentarios sin errores', fakeAsync(() => {
      spyOn(console, 'log');
      
      component.solicitudes = [];
      component.solicitudesCompletas = [];
      
      expect(() => {
        component['verificarFuncionalidadComentarios']();
      }).not.toThrow();
    }));

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
      const nuevosArchivos = [{ nombre: 'test1.pdf' }, { nombre: 'test2.pdf' }] as any;
      
      component.onArchivosChange(nuevosArchivos);
      
      expect(component.archivosActuales).toEqual(nuevosArchivos);
      expect(component.archivosActuales.length).toBe(2);
    });

    it('PS-019: puedeEnviar debe retornar false cuando no hay usuario', () => {
      component.archivosActuales = [{ nombre: 'test.pdf' }] as any;
      component.usuario = null;
      
      expect(component.puedeEnviar()).toBeFalse();
    });

    it('PS-020: puedeEnviar debe retornar false cuando no hay archivos', () => {
      component.archivosActuales = [];
      component.usuario = mockUsuario;
      
      expect(component.puedeEnviar()).toBeFalse();
    });
  });
});

