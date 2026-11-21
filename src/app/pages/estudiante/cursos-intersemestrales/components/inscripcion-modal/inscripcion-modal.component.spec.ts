import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsCO from '@angular/common/locales/es-CO';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CursosIntersemestralesService } from '@core/services/cursos-intersemestrales.service';
import { AuthService } from '@core/services/auth.service';
import { NotificacionesService } from '@core/services/notificaciones.service';
import { SnackbarService } from '@core/services/snackbar.service';

import { InscripcionModalComponent, InscripcionModalData } from './inscripcion-modal.component';

describe('InscripcionModalComponent', () => {
  let component: InscripcionModalComponent;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;

  const seleccionar = (archivo: File) =>
    component.onFileSelected({ target: { files: [archivo] } as unknown as HTMLInputElement } as unknown as Event);
  const pdf = (bytes: number) => new File([new Uint8Array(bytes)], 'comprobante.pdf', { type: 'application/pdf' });

  beforeAll(() => registerLocaleData(localeEsCO));

  beforeEach(() => {
    snackbarSpy = jasmine.createSpyObj('SnackbarService', ['advertencia', 'exito', 'error', 'mostrar']);
    const data: InscripcionModalData = {
      preinscripcion: {
        cursoId: 3,
        curso: 'Metodologia de la Investigacion',
        estado: 'Aprobado',
        estadoCurso: 'Inscripcion',
      },
    };
    TestBed.configureTestingModule({
      imports: [InscripcionModalComponent, NoopAnimationsModule],
      providers: [
        { provide: LOCALE_ID, useValue: 'es-CO' },
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
        { provide: MAT_DIALOG_DATA, useValue: data },
        {
          provide: CursosIntersemestralesService,
          useValue: jasmine.createSpyObj('CursosIntersemestralesService', ['crearInscripcion']),
        },
        { provide: AuthService, useValue: jasmine.createSpyObj('AuthService', { getUsuario: null }) },
        {
          provide: NotificacionesService,
          useValue: jasmine.createSpyObj('NotificacionesService', ['actualizarNotificaciones']),
        },
        { provide: SnackbarService, useValue: snackbarSpy },
      ],
    });
    component = TestBed.createComponent(InscripcionModalComponent).componentInstance;
  });

  it('rechaza un PDF de más de 15 MB con el tamaño en formato es-CO', () => {
    seleccionar(pdf(Math.round(15.5 * 1024 * 1024)));

    expect(component.errorArchivo).toBe('El archivo es muy grande (15,50 MB). El límite máximo es 15 MB.');
    expect(snackbarSpy.advertencia).toHaveBeenCalledWith(component.errorArchivo!);
    expect(component.archivoSeleccionado).toBeNull();
  });

  it('rechaza lo que no es PDF y acepta un PDF dentro del límite', () => {
    seleccionar(new File(['x'], 'foto.png', { type: 'image/png' }));
    expect(component.errorArchivo).toBe('Solo se permiten archivos PDF');

    const valido = pdf(1024);
    seleccionar(valido);
    expect(component.errorArchivo).toBeNull();
    expect(component.archivoSeleccionado).toBe(valido);
  });
});
