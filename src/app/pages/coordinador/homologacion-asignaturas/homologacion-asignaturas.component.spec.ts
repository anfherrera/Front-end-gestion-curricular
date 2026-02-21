import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { HomologacionAsignaturasComponent } from './homologacion-asignaturas.component';
import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { LoggerService } from '../../../core/services/logger.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

describe('HomologacionAsignaturasComponent (Coordinador)', () => {
  let component: HomologacionAsignaturasComponent;
  let fixture: ComponentFixture<HomologacionAsignaturasComponent>;
  let homologacionService: jasmine.SpyObj<HomologacionAsignaturasService>;

  beforeEach(async () => {
    const homologacionServiceSpy = jasmine.createSpyObj('HomologacionAsignaturasService', ['getCoordinadorRequests', 'approveAsCoordinador', 'rejectAsCoordinador']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['log', 'warn', 'error', 'debug']);
    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['extraerMensajeError']);

    homologacionServiceSpy.getCoordinadorRequests.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [HomologacionAsignaturasComponent, NoopAnimationsModule],
      providers: [
        { provide: HomologacionAsignaturasService, useValue: homologacionServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: LoggerService, useValue: loggerSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy }
      ]
    }).compileComponents();

    homologacionService = TestBed.inject(HomologacionAsignaturasService) as jasmine.SpyObj<HomologacionAsignaturasService>;
    fixture = TestBed.createComponent(HomologacionAsignaturasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('HA-C-001: debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('HA-C-002: debe llamar getCoordinadorRequests en init', () => {
    expect(homologacionService.getCoordinadorRequests).toHaveBeenCalled();
  });

  it('HA-C-003: debe tener propiedades de estados (EstadosSolicitud, labels, colors)', () => {
    expect(component.EstadosSolicitud).toBeDefined();
    expect(component.ESTADOS_SOLICITUD_LABELS).toBeDefined();
    expect(component.ESTADOS_SOLICITUD_COLORS).toBeDefined();
  });
});
