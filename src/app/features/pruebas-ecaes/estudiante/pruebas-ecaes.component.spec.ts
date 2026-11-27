import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { PruebasEcaesComponent } from './pruebas-ecaes.component';
import {
  FechaEcaes,
  PruebasEcaesService,
  SolicitudEcaesResponse,
} from '@features/pruebas-ecaes/services/pruebas-ecaes.service';
import { ArchivosService } from '@core/services/archivos.service';
import { ErrorHandlerService } from '@core/services/error-handler.service';
import { PeriodosAcademicosService } from '@core/services/periodos-academicos.service';
import { AuthService } from '@core/services/auth.service';
import { NotificacionesService } from '@core/services/notificaciones.service';
import { LoggerService } from '@core/services/logger.service';
import { By } from '@angular/platform-browser';
import { FechasEcaesComponent } from './fechas-ecaes/fechas-ecaes.component';
import { PreregistroEcaesComponent } from './preregistro-ecaes/preregistro-ecaes.component';

/** Solicitud ECAES con solo los campos que usa cada prueba. */
type SolicitudEcaesParcial = Omit<Partial<SolicitudEcaesResponse>, 'objUsuario'> & {
  objUsuario?: Partial<SolicitudEcaesResponse['objUsuario']>;
};
const solicitudEcaes = (datos: SolicitudEcaesParcial) => datos as SolicitudEcaesResponse;

describe('PruebasEcaesComponent', () => {
  let component: PruebasEcaesComponent;
  let fixture: ComponentFixture<PruebasEcaesComponent>;
  let pruebasEcaesService: jasmine.SpyObj<PruebasEcaesService>;
  let errorHandler: jasmine.SpyObj<ErrorHandlerService>;
  let compiled: HTMLElement;

  const mockUsuario = {
    id_usuario: 1,
    nombre_completo: 'Estudiante Test',
    codigo: '12345',
    cedula: '123456',
    correo: 'test@unicauca.edu.co',
    rol: { nombre: 'ESTUDIANTE' },
    objPrograma: { id_programa: 1, nombre_programa: 'Ingeniería' },
  };

  const mockFechasEcaes: FechaEcaes[] = [
    {
      idFechaEcaes: 1,
      periodoAcademico: '2025-1',
      inscripcion_est_by_facultad: '2025-01-15',
      registro_recaudo_ordinario: '2025-02-01',
      registro_recaudo_extraordinario: '2025-02-15',
      citacion: '2025-03-01',
      aplicacion: '2025-03-15',
      resultados_individuales: '2025-04-01',
    },
  ];

  beforeEach(async () => {
    const pruebasEcaesServiceSpy = jasmine.createSpyObj('PruebasEcaesService', [
      'listarFechasEcaes',
      'listarSolicitudesPorRol',
      'crearSolicitudEcaes',
      'actualizarEstadoSolicitud',
      'listarTiposDocumento',
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
      imports: [PruebasEcaesComponent, BrowserAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: PruebasEcaesService, useValue: pruebasEcaesServiceSpy },
        { provide: ArchivosService, useValue: archivosServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        { provide: PeriodosAcademicosService, useValue: periodosServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificacionesService, useValue: notificacionesServiceSpy },
        { provide: LoggerService, useValue: loggerSpy },
      ],
    }).compileComponents();

    pruebasEcaesService = TestBed.inject(PruebasEcaesService) as jasmine.SpyObj<PruebasEcaesService>;
    errorHandler = TestBed.inject(ErrorHandlerService) as jasmine.SpyObj<ErrorHandlerService>;

    pruebasEcaesService.listarFechasEcaes.and.returnValue(of(mockFechasEcaes));
    pruebasEcaesService.listarSolicitudesPorRol.and.returnValue(of([]));
    pruebasEcaesService.listarTiposDocumento.and.returnValue(
      of([
        { codigo: 'CC', descripcion: 'Cédula de Ciudadanía' },
        { codigo: 'TI', descripcion: 'Tarjeta de Identidad' },
      ])
    );
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
    // Tres secciones: Fechas, Documentación Adjunta y Seguimiento de Solicitud
    expect(compiled.querySelectorAll('app-card-container').length).toBe(3);
    expect(compiled.querySelector('app-file-upload')).toBeTruthy();
    // Sin solicitudes, el seguimiento muestra el mensaje vacío en lugar de la tabla
    expect(compiled.querySelector('.sin-solicitudes')).toBeTruthy();
    expect(compiled.querySelector('app-request-status-table')).toBeNull();
  });

  it('pasa el usuario al preregistro, que pone su cédula, y el calendario carga su período', () => {
    const preregistro = fixture.debugElement.query(By.directive(PreregistroEcaesComponent))
      .componentInstance as PreregistroEcaesComponent;
    const fechas = fixture.debugElement.query(By.directive(FechasEcaesComponent))
      .componentInstance as FechasEcaesComponent;
    expect(preregistro.usuario()).toEqual(mockUsuario);
    expect(preregistro.solicitudForm.value.numero_documento).toBe('123456');
    expect(fechas.periodoSeleccionado()).toBe('2025-1');
  });

  it('recarga el seguimiento cuando el preregistro avisa que se envió', () => {
    pruebasEcaesService.listarSolicitudesPorRol.calls.reset();
    const preregistro = fixture.debugElement.query(By.directive(PreregistroEcaesComponent))
      .componentInstance as PreregistroEcaesComponent;
    preregistro.enviada.emit();
    expect(pruebasEcaesService.listarSolicitudesPorRol).toHaveBeenCalledWith('ESTUDIANTE', 1);
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
      solicitudEcaes({
        id_solicitud: 1,
        nombre_solicitud: 'Solicitud ECAES',
        fecha_registro_solicitud: '2025-01-01T00:00:00.000Z',
        estadosSolicitud: [
          {
            id_estado: 1,
            estado_actual: 'ENVIADA',
            fecha_registro_estado: '2025-01-01T00:00:00.000Z',
            comentario: null,
            objSolicitud: null,
          },
        ],
        objUsuario: { nombre_completo: 'Test' },
        documentos: [],
      }),
    ];
    component.procesarSolicitudes(data);
    expect(component.solicitudes().length).toBe(1);
    expect(component.solicitudes()[0].id).toBe(1);
    expect(component.solicitudesCompletas.length).toBe(1);
  });

  it('la fila muestra nombre_solicitud tal cual (ya trae el nombre del estudiante)', () => {
    component.procesarSolicitudes([
      solicitudEcaes({
        id_solicitud: 2,
        nombre_solicitud: 'Solicitud ECAES - Daniel Cisneros',
        objUsuario: { nombre_completo: 'Daniel Cisneros' },
      }),
    ]);
    expect(component.solicitudes()[0].nombre).toBe('Solicitud ECAES - Daniel Cisneros');
  });

  it('EC-028: procesarSolicitudes debe manejar datos no array', () => {
    // Entrada inválida a propósito: el backend respondió algo que no es un arreglo
    component.procesarSolicitudes(null as unknown as SolicitudEcaesResponse[]);
    expect(component.solicitudes().length).toBe(0);
    expect(component.solicitudesCompletas.length).toBe(0);
  });

  it('EC-029: obtenerSolicitudCompleta debe devolver solicitud por id', () => {
    component.solicitudesCompletas = [solicitudEcaes({ id_solicitud: 5, nombre_solicitud: 'S5' })];
    expect(component.obtenerSolicitudCompleta(5)?.id_solicitud).toBe(5);
    expect(component.obtenerSolicitudCompleta(99)).toBeUndefined();
  });
});
