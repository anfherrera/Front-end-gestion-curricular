import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ManageUsersComponent } from './manage-users.component';
import { UsuariosService } from '../../../core/services/usuarios.service';
import { ErrorHandlerService } from '../../../core/services/error-handler.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('ManageUsersComponent', () => {
  let component: ManageUsersComponent;
  let fixture: ComponentFixture<ManageUsersComponent>;

  beforeEach(async () => {
    const usuariosServiceSpy = jasmine.createSpyObj('UsuariosService', [
      'listarUsuarios',
      'cambiarEstadoUsuario',
      'eliminarUsuario'
    ]);
    usuariosServiceSpy.listarUsuarios.and.returnValue(of([]));

    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', [
      'extraerMensajeError',
      'esErrorDependencias'
    ]);
    errorHandlerSpy.extraerMensajeError.and.returnValue('Error');
    errorHandlerSpy.esErrorDependencias.and.returnValue(false);

    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [ManageUsersComponent, NoopAnimationsModule],
      providers: [
        { provide: UsuariosService, useValue: usuariosServiceSpy },
        { provide: ErrorHandlerService, useValue: errorHandlerSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
