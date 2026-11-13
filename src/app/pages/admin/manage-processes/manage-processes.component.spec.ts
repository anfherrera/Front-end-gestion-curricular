import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ManageProcessesComponent } from './manage-processes.component';
import { ProcesosService } from '@core/services/procesos.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

describe('ManageProcessesComponent', () => {
  let component: ManageProcessesComponent;
  let fixture: ComponentFixture<ManageProcessesComponent>;

  beforeEach(async () => {
    const procesosSpy = jasmine.createSpyObj('ProcesosService', ['listarProcesos', 'actualizarEstado', 'eliminarProceso']);
    procesosSpy.listarProcesos.and.returnValue(of([]));
    procesosSpy.actualizarEstado.and.returnValue(of({}));
    procesosSpy.eliminarProceso.and.returnValue(of({}));

    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    const dialogRefMock = { afterClosed: () => of(false) } as any;
    const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    matDialogSpy.open.and.returnValue(dialogRefMock);

    await TestBed.configureTestingModule({
      imports: [ManageProcessesComponent, NoopAnimationsModule],
      providers: [
        { provide: ProcesosService, useValue: procesosSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: matDialogSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManageProcessesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
