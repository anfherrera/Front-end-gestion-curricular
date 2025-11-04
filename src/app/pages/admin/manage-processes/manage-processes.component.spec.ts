import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ManageProcessesComponent } from './manage-processes.component';
import { ApiService } from '../../../core/services/api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';

describe('ManageProcessesComponent', () => {
  let component: ManageProcessesComponent;
  let fixture: ComponentFixture<ManageProcessesComponent>;

  beforeEach(async () => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'put', 'delete']);
    apiServiceSpy.get.and.returnValue(of([]));
    apiServiceSpy.put.and.returnValue(of({}));
    apiServiceSpy.delete.and.returnValue(of({}));

    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    const dialogRefMock = { afterClosed: () => of(false) } as any;
    const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    matDialogSpy.open.and.returnValue(dialogRefMock);

    await TestBed.configureTestingModule({
      imports: [ManageProcessesComponent, NoopAnimationsModule],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
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
