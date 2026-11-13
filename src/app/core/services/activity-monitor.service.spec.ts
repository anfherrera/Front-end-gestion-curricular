import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { ActivityMonitorService } from './activity-monitor.service';

describe('ActivityMonitorService', () => {
  const NUEVE_MIN = 9 * 60 * 1000;
  const UN_MIN = 60 * 1000;
  let service: ActivityMonitorService;
  let cerrado: Subject<boolean | undefined>;
  let dialogRef: { afterClosed: () => Subject<boolean | undefined>; close: jasmine.Spy };
  let dialog: jasmine.SpyObj<MatDialog>;
  let logout: jasmine.Spy;

  beforeEach(() => {
    cerrado = new Subject();
    dialogRef = { afterClosed: () => cerrado, close: jasmine.createSpy('close').and.callFake(() => cerrado.next(undefined)) };
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    dialog.open.and.returnValue(dialogRef as any);
    TestBed.configureTestingModule({ providers: [{ provide: MatDialog, useValue: dialog }] });
  });

  function iniciar(): void {
    service = TestBed.inject(ActivityMonitorService);
    logout = jasmine.createSpy('logout');
    service.setLogoutCallback(logout);
    service.resetInactivityTimer();
  }

  afterEach(() => service?.stopMonitoring());

  it('avisa un minuto antes y cierra la sesión si nadie responde', fakeAsync(() => {
    iniciar();
    tick(NUEVE_MIN);
    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(service.isWarningActive()).toBeTrue();

    // Con el aviso abierto, mover el ratón no reinicia la sesión
    document.dispatchEvent(new MouseEvent('mousemove'));
    tick(UN_MIN);
    expect(dialogRef.close).toHaveBeenCalled();
    expect(logout).toHaveBeenCalledTimes(1);
  }));

  it('mantiene la sesión si el usuario elige continuar', fakeAsync(() => {
    iniciar();
    tick(NUEVE_MIN);
    cerrado.next(true);
    expect(service.isWarningActive()).toBeFalse();
    tick(UN_MIN);
    expect(logout).not.toHaveBeenCalled();
    tick(NUEVE_MIN);
    expect(dialog.open).toHaveBeenCalledTimes(2);
    tick(UN_MIN);
  }));

  it('cierra la sesión si el usuario elige cerrarla', fakeAsync(() => {
    iniciar();
    tick(NUEVE_MIN);
    cerrado.next(false);
    expect(logout).toHaveBeenCalledTimes(1);
  }));
});
