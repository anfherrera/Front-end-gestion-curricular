import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { HomologacionAsignaturasComponent } from './homologacion-asignaturas.component';
import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';
import { DocumentGeneratorService } from '../../../core/services/document-generator.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoggerService } from '../../../core/services/logger.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';

describe('HomologacionAsignaturasComponent (Secretaria)', () => {
  let component: HomologacionAsignaturasComponent;
  let fixture: ComponentFixture<HomologacionAsignaturasComponent>;
  let homologacionService: jasmine.SpyObj<HomologacionAsignaturasService>;

  beforeEach(async () => {
    const homologacionServiceSpy = jasmine.createSpyObj('HomologacionAsignaturasService', [
      'getSecretariaRequests', 'getSecretariaApprovedRequests', 'approveDefinitively'
    ]);
    const documentGeneratorSpy = jasmine.createSpyObj('DocumentGeneratorService', ['generateDocument']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const loggerSpy = jasmine.createSpyObj('LoggerService', ['log', 'warn', 'error', 'debug']);
    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['extraerMensajeError']);

    homologacionServiceSpy.getSecretariaRequests.and.returnValue(of([]));
    homologacionServiceSpy.getSecretariaApprovedRequests.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [HomologacionAsignaturasComponent, NoopAnimationsModule],
      providers: [
        { provide: HomologacionAsignaturasService, useValue: homologacionServiceSpy },
        { provide: DocumentGeneratorService, useValue: documentGeneratorSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: LoggerService, useValue: loggerSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy }
      ]
    }).compileComponents();

    homologacionService = TestBed.inject(HomologacionAsignaturasService) as jasmine.SpyObj<HomologacionAsignaturasService>;
    fixture = TestBed.createComponent(HomologacionAsignaturasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('HA-S-001: debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('HA-S-002: debe tener template de oficio homologacion', () => {
    expect(component.template).toBeDefined();
    expect(component.template.id).toBe('OFICIO_HOMOLOGACION');
  });
});
