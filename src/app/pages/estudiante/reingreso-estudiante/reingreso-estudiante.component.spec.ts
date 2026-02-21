import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

import { ReingresoEstudianteComponent } from './reingreso-estudiante.component';
import { ReingresoEstudianteService } from '../../../core/services/reingreso-estudiante.service';
import { FormatosInstitucionalesService } from '../../../core/services/formatos-institucionales.service';
import { LoggerService } from '../../../core/services/logger.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { PeriodosAcademicosService } from '../../../core/services/periodos-academicos.service';

describe('ReingresoEstudianteComponent', () => {
  let component: ReingresoEstudianteComponent;
  let fixture: ComponentFixture<ReingresoEstudianteComponent>;
  let reingresoService: jasmine.SpyObj<ReingresoEstudianteService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let compiled: HTMLElement;

  const mockUsuario = {
    id_usuario: 1,
    nombre_completo: 'Estudiante Test',
    codigo: '12345',
    correo: 'test@unicauca.edu.co',
    rol: { nombre: 'ESTUDIANTE' },
    objPrograma: { id_programa: 1, nombre_programa: 'Ingenieria' }
  };

  beforeEach(async () => {
    const reingresoServiceSpy = jasmine.createSpyObj('ReingresoEstudianteService', [
      'listarSolicitudesPorRol', 'crearSolicitud'
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
      imports: [
        ReingresoEstudianteComponent,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ReingresoEstudianteService, useValue: reingresoServiceSpy },
        { provide: FormatosInstitucionalesService, useValue: formatosServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: LoggerService, useValue: loggerSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        { provide: PeriodosAcademicosService, useValue: periodosServiceSpy }
      ]
    }).compileComponents();

    reingresoService = TestBed.inject(ReingresoEstudianteService) as jasmine.SpyObj<ReingresoEstudianteService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

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
    expect(compiled.querySelector('app-request-status-table')).toBeTruthy();
  });

  it('RE-E-002: puedeEnviar debe ser false sin archivos', () => {
    component.archivosActuales = [];
    component.usuario = mockUsuario;
    expect(component.puedeEnviar()).toBeFalse();
  });

  it('RE-E-003: puedeEnviar debe ser true con archivos y usuario', () => {
    component.archivosActuales = [{ nombre: 'doc.pdf' }] as any[];
    component.usuario = mockUsuario;
    expect(component.puedeEnviar()).toBeTrue();
  });

  it('RE-E-004: puedeEnviar debe ser false sin usuario', () => {
    component.archivosActuales = [{ nombre: 'doc.pdf' }] as any[];
    component.usuario = null;
    expect(component.puedeEnviar()).toBeFalse();
  });

  it('RE-E-005: onArchivosChange debe actualizar archivosActuales', () => {
    const archivos = [{ nombre: 'a.pdf' }, { nombre: 'b.pdf' }] as any[];
    component.onArchivosChange(archivos);
    expect(component.archivosActuales).toEqual(archivos);
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
});
