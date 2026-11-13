import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarService } from './snackbar.service';

describe('SnackbarService', () => {
  let service: SnackbarService;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    TestBed.configureTestingModule({ providers: [{ provide: MatSnackBar, useValue: snackBar }] });
    service = TestBed.inject(SnackbarService);
  });

  it('abre arriba a la derecha, 5 s, con la clase del tipo', () => {
    service.exito('Guardado');
    expect(snackBar.open).toHaveBeenCalledWith('Guardado', 'Cerrar', jasmine.objectContaining({
      duration: 5000, horizontalPosition: 'end', verticalPosition: 'top', panelClass: ['snackbar-success']
    }));
  });

  it('cada método usa su clase', () => {
    service.error('a');
    service.advertencia('b');
    service.info('c', 8000);
    const clases = snackBar.open.calls.allArgs().map(args => args[2]?.panelClass);
    expect(clases).toEqual([['snackbar-error'], ['snackbar-warning'], ['snackbar-info']]);
    expect(snackBar.open.calls.mostRecent().args[2]?.duration).toBe(8000);
  });
});
