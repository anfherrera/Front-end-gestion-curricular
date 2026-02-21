import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { HomologacionAsignaturasComponent } from './homologacion-asignaturas.component';
import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { LoggerService } from '../../../core/services/logger.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

describe('HomologacionAsignaturasComponent (Funcionario)', () => {
  let component: HomologacionAsignaturasComponent;
  let fixture: ComponentFixture<HomologacionAsignaturasComponent>;
  let homologacionService: jasmine.SpyObj<HomologacionAsignaturasService>;

  beforeEach(async () => {
    const homologacionServiceSpy = jasmine.createSpyObj('HomologacionAsignaturasService', ['getPendingRequests', 'approveRequest', 'rejectRequest', 'completeValidation']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['log', 'warn', 'error', 'debug']);
    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['extraerMensajeError']);

    homologacionServiceSpy.getPendingRequests.and.returnValue(of([]));

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

  it('HA-F-001: debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('HA-F-002: debe llamar getPendingRequests en init', () => {
    expect(homologacionService.getPendingRequests).toHaveBeenCalled();
  });
});
