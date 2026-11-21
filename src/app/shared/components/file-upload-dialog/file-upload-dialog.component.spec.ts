import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';
import { TestBed } from '@angular/core/testing';
import { ArchivosService } from '@core/services/archivos.service';
import { PazSalvoService } from '@core/services/paz-salvo.service';
import { SnackbarService } from '@core/services/snackbar.service';

import { FileUploadComponent } from './file-upload-dialog.component';

describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;

  const seleccionar = (...archivos: File[]) =>
    component.onFileSelected({ target: { files: archivos } as unknown as HTMLInputElement } as unknown as Event);
  const pdf = (nombre: string, bytes = 1024) => new File([new Uint8Array(bytes)], nombre, { type: 'application/pdf' });

  beforeAll(() => registerLocaleData(localeEsCO));

  beforeEach(() => {
    snackbarSpy = jasmine.createSpyObj('SnackbarService', ['advertencia', 'exito', 'error', 'mostrar']);
    TestBed.configureTestingModule({
      imports: [FileUploadComponent],
      providers: [
        { provide: LOCALE_ID, useValue: 'es-CO' },
        { provide: ArchivosService, useValue: jasmine.createSpyObj('ArchivosService', ['subirPDF']) },
        { provide: PazSalvoService, useValue: jasmine.createSpyObj('PazSalvoService', ['subirDocumento']) },
        { provide: SnackbarService, useValue: snackbarSpy },
      ],
    });
    component = TestBed.createComponent(FileUploadComponent).componentInstance;
  });

  it('avisa con el tamaño en formato es-CO si el PDF pasa de 10 MB', () => {
    seleccionar(pdf('grande.pdf', Math.round(11.5 * 1024 * 1024)));

    expect(snackbarSpy.advertencia).toHaveBeenCalledWith(
      'El archivo "grande.pdf" es demasiado grande. Tamaño máximo: 10MB. Tamaño actual: 11,50MB'
    );
    expect(component.archivos()).toEqual([]);
  });

  it('añade los PDF válidos y rechaza los que no son PDF o están repetidos', () => {
    seleccionar(pdf('cedula.pdf'), new File(['x'], 'foto.png', { type: 'image/png' }));
    seleccionar(pdf('cedula.pdf'));

    expect(component.archivos().map((a) => a.nombre)).toEqual(['cedula.pdf']);
    expect(snackbarSpy.advertencia).toHaveBeenCalledWith('Solo se permiten archivos PDF');
    expect(snackbarSpy.advertencia).toHaveBeenCalledWith(
      'El archivo "cedula.pdf" ya ha sido seleccionado. No se permiten archivos duplicados.'
    );
  });
});
