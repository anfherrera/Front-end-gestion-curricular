import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { PruebasEcaesComponent } from './pruebas-ecaes.component';
import { PruebasEcaesService } from '../../../core/services/pruebas-ecaes.service';
import { ArchivosService } from '../../../core/services/archivos.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { PeriodosAcademicosService } from '../../../core/services/periodos-academicos.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacionesService } from '../../../core/services/notificaciones.service';
import { LoggerService } from '../../../core/services/logger.service';

describe('PruebasEcaesComponent', () => {
  let component: PruebasEcaesComponent;
  let fixture: ComponentFixture<PruebasEcaesComponent>;
  let pruebasEcaesService: jasmine.SpyObj<PruebasEcaesService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let errorHandler: jasmine.SpyObj<ErrorHandlerService>;
  let compiled: HTMLElement;

  const mockUsuario = {
    id_usuario: 1,
    nombre_completo: 'Estudiante Test',
    codigo: '12345',
    cedula: '123456',
    correo: 'test@unicauca.edu.co',
    rol: { nombre: 'ESTUDIANTE' },
    objPrograma: { id_programa: 1, nombre_programa: 'Ingeniería' }
  };

  const mockFechasEcaes = [
    {
      idFechaEcaes: 1,
      periodoAcademico: '2025-1',
      inscripcion_est_by_facultad: '2025-01-15',
      registro_recaudo_ordinario: '2025-02-01',
      registro_recaudo_extraordinario: '2025-02-15',
      citacion: '2025-03-01',
      aplicacion: '2025-03-15',
      resultados_individuales: '2025-04-01'
    }
  ];

  beforeEach(async () => {
    const pruebasEcaesServiceSpy = jasmine.createSpyObj('PruebasEcaesService', [
      'listarFechasEcaes',
      'listarSolicitudesPorRol',
      'crearSolicitudEcaes',
      'actualizarEstadoSolicitud'
    ]);
    const archivosServiceSpy = jasmine.createSpyObj('ArchivosService', ['subirPDF']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['extraerMensajeError']);
    const periodosServiceSpy = jasmine.createSpyObj('PeriodosAcademicosService', ['getPeriodoActualValue']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUsuario']);
    const notificacionesServiceSpy = jasmine.createSpyObj('NotificacionesService', ['actualizarNotificaciones']);
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['log', 'warn', 'error', 'debug']);

    await TestBed.configureTestingModule({
      imports: [
        PruebasEcaesComponent,
        BrowserAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: PruebasEcaesService, useValue: pruebasEcaesServiceSpy },
        { provide: ArchivosService, useValue: archivosServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        { provide: PeriodosAcademicosService, useValue: periodosServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificacionesService, useValue: notificacionesServiceSpy },
        { provide: LoggerService, useValue: loggerSpy }
      ]
    }).compileComponents();

    pruebasEcaesService = TestBed.inject(PruebasEcaesService) as jasmine.SpyObj<PruebasEcaesService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    errorHandler = TestBed.inject(ErrorHandlerService) as jasmine.SpyObj<ErrorHandlerService>;

    pruebasEcaesService.listarFechasEcaes.and.returnValue(of(mockFechasEcaes as any));
    pruebasEcaesService.listarSolicitudesPorRol.and.returnValue(of([]));
    errorHandler.extraerMensajeError.and.returnValue('');
    periodosServiceSpy.getPeriodoActualValue.and.returnValue({ valor: '2025-1' });
    authServiceSpy.getUsuario.and.returnValue(mockUsuario);
    notificacionesServiceSpy.actualizarNotificaciones.and.returnValue(of(undefined));

    window.localStorage.setItem('usuario', JSON.stringify(mockUsuario));

    fixture = TestBed.createComponent(PruebasEcaesComponent);
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

  it('EC-016: Debe renderizar secciones principales (Fechas, Documentación, Seguimiento)', () => {
    expect(compiled.querySelector('app-card-container')).toBeTruthy();
    expect(compiled.querySelector('app-file-upload')).toBeTruthy();
    expect(compiled.querySelector('app-request-status-table')).toBeTruthy();
  });

  it('EC-017: Debe cargar fechas ECAES y seleccionar primer período', fakeAsync(() => {
    expect(pruebasEcaesService.listarFechasEcaes).toHaveBeenCalled();
    expect(component.fechasEcaes.length).toBe(1);
    expect(component.periodoSeleccionado).toBe('2025-1');
    expect(component.fechasSeleccionadas).toBeTruthy();
  }));

  it('EC-018: Debe actualizar archivos en onArchivosChange', () => {
    const archivos = [{ nombre: 'cedula.pdf', file: new File([], 'cedula.pdf') }] as any[];
    component.onArchivosChange(archivos);
    expect(component.archivos).toEqual(archivos);
  });

  it('EC-019: Debe formatear fecha correctamente', () => {
    const fechaStr = '2025-01-15';
    const resultado = component.getFechaFormateada(fechaStr);
    expect(resultado).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('EC-020: getConceptoFecha debe devolver fecha formateada cuando hay fechas seleccionadas', () => {
    component.fechasSeleccionadas = mockFechasEcaes[0] as any;
    const concepto = component.getConceptoFecha('inscripcion_est_by_facultad');
    expect(concepto).toBeTruthy();
  });

  it('EC-021: getConceptoFecha debe devolver vacío cuando no hay fechas seleccionadas', () => {
    component.fechasSeleccionadas = null;
    expect(component.getConceptoFecha('inscripcion_est_by_facultad')).toBe('');
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
    component.archivos = [{ nombre: 'x.pdf' }] as any[];
    component.solicitudForm.patchValue({ numero_documento: '123456' });
    component.limpiarFormulario();
    expect(component.archivos.length).toBe(0);
    expect(component.solicitudForm.get('numero_documento')?.value).toBe('');
    expect(component.enviandoSolicitud).toBeFalse();
  });

  it('EC-025: listarSolicitudes no debe llamar al servicio si no hay usuario', () => {
    pruebasEcaesService.listarSolicitudesPorRol.calls.reset();
    component.usuario = null;
    component.listarSolicitudes();
    expect(pruebasEcaesService.listarSolicitudesPorRol).not.toHaveBeenCalled();
  });

  it('EC-026: listarSolicitudes debe llamar listarSolicitudesPorRol con rol e idUsuario', fakeAsync(() => {
    pruebasEcaesService.listarSolicitudesPorRol.calls.reset();
    component.usuario = mockUsuario;
    component.listarSolicitudes();
    tick();
    expect(pruebasEcaesService.listarSolicitudesPorRol).toHaveBeenCalledWith('ESTUDIANTE', 1);
  }));

  it('EC-027: procesarSolicitudes debe transformar respuesta y poblar solicitudes', () => {
    const data = [
      {
        id_solicitud: 1,
        nombre_solicitud: 'Solicitud ECAES',
        fecha_registro_solicitud: '2025-01-01T00:00:00.000Z',
        estadosSolicitud: [{ estado_actual: 'ENVIADA', comentario: null }],
        objUsuario: { nombre_completo: 'Test' },
        documentos: []
      }
    ] as any[];
    component.procesarSolicitudes(data);
    expect(component.solicitudes.length).toBe(1);
    expect(component.solicitudes[0].id).toBe(1);
    expect(component.solicitudesCompletas.length).toBe(1);
  });

  it('EC-028: procesarSolicitudes debe manejar datos no array', () => {
    component.procesarSolicitudes(null as any);
    expect(component.solicitudes.length).toBe(0);
    expect(component.solicitudesCompletas.length).toBe(0);
  });

  it('EC-029: obtenerSolicitudCompleta debe devolver solicitud por id', () => {
    const sol = { id_solicitud: 5, nombre_solicitud: 'S5' };
    component.solicitudesCompletas = [sol] as any[];
    expect(component.obtenerSolicitudCompleta(5)?.id_solicitud).toBe(5);
    expect(component.obtenerSolicitudCompleta(99)).toBeUndefined();
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
    component.solicitudForm.patchValue({
      tipoDocumento: 'CC',
      numero_documento: '123456',
      fecha_expedicion: new Date('2000-01-01'),
      fecha_nacimiento: new Date('1999-01-01')
    });
    component.archivos = [];
    component.enviarSolicitud();
    expect(snackBar.open).toHaveBeenCalledWith(
      jasmine.stringMatching(/al menos un archivo/),
      'Cerrar',
      jasmine.any(Object)
    );
  });

  it('EC-032: onPeriodoChange debe actualizar fechasSeleccionadas', () => {
    component.fechasEcaes = mockFechasEcaes as any;
    component.periodoSeleccionado = '2025-1';
    component.onPeriodoChange();
    expect(component.fechasSeleccionadas?.periodoAcademico).toBe('2025-1');
  });
});
