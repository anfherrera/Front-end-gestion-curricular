import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { PreregistroEcaesComponent } from './preregistro-ecaes.component';
import {
  PruebasEcaesService,
  SolicitudEcaesRequest,
  SolicitudEcaesResponse,
} from '@core/services/pruebas-ecaes.service';
import { ArchivosService, PdfSubido } from '@core/services/archivos.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { PeriodosAcademicosService } from '@core/services/periodos-academicos.service';
import { NotificacionesService } from '@core/services/notificaciones.service';
import { LoggerService } from '@core/services/logger.service';
import { Archivo } from '@core/models/procesos.model';
import { UsuarioSesion } from '@core/models/usuario-sesion.model';

const archivo = (nombre: string): Archivo => ({ nombre, fecha: '2025-01-15' });
const conFile = (nombre: string): Archivo => ({ ...archivo(nombre), file: new File([], nombre) });

describe('PreregistroEcaesComponent', () => {
  let component: PreregistroEcaesComponent;
  let fixture: ComponentFixture<PreregistroEcaesComponent>;
  let pruebasEcaesService: jasmine.SpyObj<PruebasEcaesService>;
  let archivosService: jasmine.SpyObj<ArchivosService>;
  let notificaciones: jasmine.SpyObj<NotificacionesService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockUsuario = {
    id_usuario: 1,
    nombre_completo: 'Estudiante Test',
    codigo: '12345',
    cedula: '123456',
    correo: 'test@unicauca.edu.co',
    rol: { nombre: 'ESTUDIANTE' },
    objPrograma: { id_programa: 1, nombre_programa: 'Ingeniería' },
  } as UsuarioSesion;

  const pdfSubido = (nombre: string): PdfSubido => ({ id: 1, nombre, ruta: `ecaes/${nombre}` });

  const llenarFormulario = () =>
    component.solicitudForm.patchValue({
      tipoDocumento: 'CC',
      numero_documento: '123456',
      fecha_expedicion: new Date('2000-01-01'),
      fecha_nacimiento: new Date('1999-01-01'),
    });

  beforeEach(async () => {
    pruebasEcaesService = jasmine.createSpyObj('PruebasEcaesService', ['listarTiposDocumento', 'crearSolicitudEcaes']);
    archivosService = jasmine.createSpyObj('ArchivosService', ['subirPDF']);
    notificaciones = jasmine.createSpyObj('NotificacionesService', ['actualizarNotificaciones']);
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    const errorHandler = jasmine.createSpyObj('ErrorHandlerService', ['extraerMensajeError']);
    const periodosService = jasmine.createSpyObj('PeriodosAcademicosService', ['getPeriodoActualValue']);

    pruebasEcaesService.listarTiposDocumento.and.returnValue(
      of([
        { codigo: 'CC', descripcion: 'Cédula de Ciudadanía' },
        { codigo: 'TI', descripcion: 'Tarjeta de Identidad' },
      ])
    );
    errorHandler.extraerMensajeError.and.returnValue('');
    periodosService.getPeriodoActualValue.and.returnValue({ valor: '2025-1' });

    await TestBed.configureTestingModule({
      imports: [PreregistroEcaesComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: PruebasEcaesService, useValue: pruebasEcaesService },
        { provide: ArchivosService, useValue: archivosService },
        { provide: NotificacionesService, useValue: notificaciones },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: ErrorHandlerService, useValue: errorHandler },
        { provide: PeriodosAcademicosService, useValue: periodosService },
        { provide: LoggerService, useValue: jasmine.createSpyObj('LoggerService', ['log', 'warn', 'error', 'debug']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PreregistroEcaesComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('usuario', mockUsuario);
    fixture.detectChanges();
  });

  it('pone la cédula del estudiante como número de documento', () => {
    expect(component.solicitudForm.value.numero_documento).toBe('123456');
  });

  it('EC-033: tipos de documento del backend, solo CC y CE', () => {
    expect(component.tiposDocumento()).toEqual([{ value: 'CC', label: 'Cédula de Ciudadanía' }]);
  });

  it('EC-034: tipos de documento fijos si el backend no devuelve CC ni CE', () => {
    pruebasEcaesService.listarTiposDocumento.and.returnValue(of([]));
    component.cargarTiposDocumento();
    expect(component.tiposDocumento().map((t) => t.value)).toEqual(['CC', 'CE']);
  });

  it('EC-018: Debe actualizar archivos en onArchivosChange', () => {
    const archivos: Archivo[] = [conFile('cedula.pdf')];
    component.onArchivosChange(archivos);
    expect(component.archivos()).toEqual(archivos);
  });

  it('EC-022: esCampoInvalido debe devolver false para campo válido sin tocar', () => {
    component.solicitudForm.get('tipoDocumento')?.setValue('CC');
    expect(component.esCampoInvalido('tipoDocumento')).toBeFalse();
  });

  it('EC-023: obtenerMensajeError debe devolver mensaje para required', () => {
    component.solicitudForm.get('numero_documento')?.setValue('');
    component.solicitudForm.get('numero_documento')?.markAsTouched();
    component.solicitudForm.get('numero_documento')?.updateValueAndValidity();
    const msg = component.obtenerMensajeError('numero_documento');
    expect(msg).toContain('requerido');
  });

  it('EC-024: limpiarFormulario debe resetear formulario y archivos', () => {
    component.archivos.set([archivo('x.pdf')]);
    component.solicitudForm.patchValue({ numero_documento: '123456' });
    component.limpiarFormulario();
    expect(component.archivos().length).toBe(0);
    expect(component.solicitudForm.get('numero_documento')?.value).toBe('');
    expect(component.enviandoSolicitud()).toBeFalse();
  });

  it('EC-030: enviarSolicitud debe mostrar mensaje si formulario inválido', () => {
    component.solicitudForm.markAllAsTouched();
    component.enviarSolicitud();
    expect(snackBar.open).toHaveBeenCalledWith(
      jasmine.stringMatching(/completar todos los campos|requeridos/),
      'Cerrar',
      jasmine.any(Object)
    );
  });

  it('EC-031: enviarSolicitud debe mostrar mensaje si no hay archivos', () => {
    llenarFormulario();
    component.archivos.set([]);
    component.enviarSolicitud();
    expect(snackBar.open).toHaveBeenCalledWith(
      jasmine.stringMatching(/al menos un archivo/),
      'Cerrar',
      jasmine.any(Object)
    );
  });

  it('sube los archivos en orden, crea la solicitud con sus rutas, limpia y avisa que se envió', () => {
    let enviada = false;
    component.enviada.subscribe(() => (enviada = true));
    archivosService.subirPDF.and.callFake((file: File) => of(pdfSubido(file.name)));
    pruebasEcaesService.crearSolicitudEcaes.and.returnValue(of({} as SolicitudEcaesResponse));
    llenarFormulario();
    component.archivos.set([conFile('cedula.pdf'), conFile('otro.pdf')]);

    component.enviarSolicitud();

    expect(archivosService.subirPDF.calls.allArgs().map(([file]) => file.name)).toEqual(['cedula.pdf', 'otro.pdf']);
    const enviadaAlBackend = pruebasEcaesService.crearSolicitudEcaes.calls.mostRecent()
      .args[0] as SolicitudEcaesRequest;
    expect(enviadaAlBackend.nombre_solicitud).toBe('Solicitud ECAES - Estudiante Test');
    expect(enviadaAlBackend.periodo_academico).toBe('2025-1');
    expect(enviadaAlBackend.tipoDocumento).toBe('CC');
    expect(enviadaAlBackend.numero_documento).toBe('123456');
    expect(enviadaAlBackend.fecha_expedicion).toBe(new Date('2000-01-01').toISOString());
    expect(enviadaAlBackend.documentos.map((d) => d.ruta_documento)).toEqual(['ecaes/cedula.pdf', 'ecaes/otro.pdf']);
    expect(enviadaAlBackend.documentos[0].tipoDocumentoSolicitudPazYSalvo).toBe('ECAES');
    expect(notificaciones.actualizarNotificaciones).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Solicitud enviada exitosamente', 'Cerrar', jasmine.any(Object));
    expect(component.archivos()).toEqual([]);
    expect(component.enviandoSolicitud()).toBeFalse();
    expect(enviada).toBeTrue();
  });

  it('si falla la subida no crea la solicitud y deja los archivos para reintentar', () => {
    archivosService.subirPDF.and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    llenarFormulario();
    const archivos = [conFile('cedula.pdf')];
    component.archivos.set(archivos);

    component.enviarSolicitud();

    expect(pruebasEcaesService.crearSolicitudEcaes).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      'Error al subir los archivos. Intente nuevamente.',
      'Cerrar',
      jasmine.any(Object)
    );
    expect(component.archivos()).toEqual(archivos);
    expect(component.enviandoSolicitud()).toBeFalse();
  });

  it('si la respuesta de la subida no trae ruta, no crea la solicitud', () => {
    archivosService.subirPDF.and.returnValue(of({ id: 1, nombre: 'cedula.pdf', ruta: '' }));
    llenarFormulario();
    component.archivos.set([conFile('cedula.pdf')]);

    component.enviarSolicitud();

    expect(pruebasEcaesService.crearSolicitudEcaes).not.toHaveBeenCalled();
    expect(component.enviandoSolicitud()).toBeFalse();
  });

  it('si falla la creación, vacía los archivos (hay que adjuntarlos otra vez) y no avisa que se envió', () => {
    let enviada = false;
    component.enviada.subscribe(() => (enviada = true));
    archivosService.subirPDF.and.callFake((file: File) => of(pdfSubido(file.name)));
    pruebasEcaesService.crearSolicitudEcaes.and.returnValue(throwError(() => new HttpErrorResponse({ status: 400 })));
    llenarFormulario();
    component.archivos.set([conFile('cedula.pdf')]);

    component.enviarSolicitud();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Error al enviar la solicitud. Debe volver a adjuntar los documentos.',
      'Cerrar',
      jasmine.any(Object)
    );
    expect(component.archivos()).toEqual([]);
    expect(component.enviandoSolicitud()).toBeFalse();
    expect(enviada).toBeFalse();
  });
});
