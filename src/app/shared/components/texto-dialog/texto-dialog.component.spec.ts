import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { firstValueFrom, of } from 'rxjs';
import { TextoDialogComponent, TextoDialogData, datosRechazo } from './texto-dialog.component';
import { ConfirmDialogComponent, confirmar } from '../confirm-dialog/confirm-dialog.component';

describe('TextoDialogComponent', () => {
  let dialogRef: jasmine.SpyObj<MatDialogRef<TextoDialogComponent>>;

  function crear(data: TextoDialogData): ComponentFixture<TextoDialogComponent> {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    TestBed.configureTestingModule({
      imports: [TextoDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRef }
      ]
    });
    const fixture = TestBed.createComponent(TextoDialogComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('no deja confirmar sin texto y devuelve el texto recortado', () => {
    const { componentInstance: c } = crear(datosRechazo());
    expect(c.puedeConfirmar).toBeFalse();
    c.confirmar();
    expect(dialogRef.close).not.toHaveBeenCalled();
    c.texto = '  falta el certificado  ';
    c.confirmar();
    expect(dialogRef.close).toHaveBeenCalledWith('falta el certificado');
  });

  it('cancelar cierra sin valor', () => {
    const { componentInstance: c } = crear(datosRechazo());
    c.cancelar();
    expect(dialogRef.close).toHaveBeenCalledWith();
  });

  it('con historial empieza vacío; en solo lectura no hay botón de confirmar', () => {
    expect(crear({ titulo: 'x', historial: 'previo', valorInicial: 'no' }).componentInstance.texto).toBe('');
    TestBed.resetTestingModule();
    const fixture = crear({ titulo: 'x', valorInicial: 'comentario', soloLectura: true });
    expect(fixture.componentInstance.texto).toBe('comentario');
    expect(fixture.nativeElement.querySelector('.btn-confirmar')).toBeNull();
  });

  it('datosRechazo da los textos de rechazo por defecto', () => {
    expect(datosRechazo()).toEqual(jasmine.objectContaining({ titulo: 'Rechazar solicitud', textoConfirmar: 'Rechazar' }));
  });
});

describe('confirmar()', () => {
  it('convierte el cierre del diálogo en true/false', async () => {
    const dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.returnValues(
      { afterClosed: () => of(true) } as any,
      { afterClosed: () => of(undefined) } as any
    );
    expect(await firstValueFrom(confirmar(dialog, { titulo: 't', mensaje: 'm' }))).toBeTrue();
    expect(await firstValueFrom(confirmar(dialog, { titulo: 't', mensaje: 'm' }))).toBeFalse();
    expect(dialog.open.calls.first().args[0]).toBe(ConfirmDialogComponent);
  });
});
