import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { EstadoSolicitudDetalle, SolicitudCursoVerano } from '@core/models/cursos-intersemestrales.model';

import { DetallesPreinscripcionDialogComponent } from './detalles-preinscripcion-dialog.component';

describe('DetallesPreinscripcionDialogComponent', () => {
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<DetallesPreinscripcionDialogComponent>>;

  const crear = (estadoSolicitud: EstadoSolicitudDetalle[] = [], observaciones?: string) => {
    const solicitud: SolicitudCursoVerano = {
      id_solicitud: 113,
      nombre_solicitud: 'Preinscripción Curso de Verano',
      fecha_solicitud: new Date('2026-11-19T11:13:00'),
      estado: 'Aprobado',
      observaciones,
      condicion: 'Primera_Vez',
      objUsuario: {
        id_usuario: 27,
        nombre_completo: 'Daniel Cisneros',
        codigo: '1046190112',
        correo: 'dcisneros@unicauca.edu.co',
      },
      tipoSolicitud: 'PREINSCRIPCION',
      estadoSolicitud,
    };
    TestBed.configureTestingModule({
      imports: [DetallesPreinscripcionDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { solicitud } },
      ],
    });
    const fixture = TestBed.createComponent(DetallesPreinscripcionDialogComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
  });

  it('muestra el historial del más reciente al más antiguo y con el texto legible del estado', () => {
    const fixture = crear([
      { estado: 'ENVIADA', fecha: '2026-11-19T11:13:00' },
      { estado: 'Aprobado', fecha: '2026-11-21T09:00:00' },
      { estado: 'APROBADA_FUNCIONARIO', fecha: '2026-11-20T10:00:00' },
    ]);
    const el = fixture.nativeElement as HTMLElement;

    const estados = Array.from(el.querySelectorAll('.timeline-estado'), (e) => e.textContent?.trim());
    expect(estados).toEqual(['Aprobado', 'Aprobada por Funcionario', 'Enviada']);
  });

  it('marca como rechazo el estado RECHAZADA y muestra su comentario', () => {
    const fixture = crear([{ estado: 'RECHAZADA', fecha: '2026-11-20T10:00:00', comentario: 'Cupo lleno' }]);
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('.timeline-item--rechazo .timeline-estado')?.textContent?.trim()).toBe('Rechazada');
    expect(el.querySelector('.timeline-comentario')?.textContent?.trim()).toBe('Cupo lleno');
  });

  it('no muestra el historial si la solicitud no lo trae', () => {
    const fixture = crear();
    expect((fixture.nativeElement as HTMLElement).querySelector('.historial')).toBeNull();
  });

  it('al guardar cierra el diálogo con las observaciones escritas', () => {
    const fixture = crear([], 'Cumple requisitos');
    fixture.componentInstance.observacionesForm.patchValue({ observaciones: 'Buen rendimiento' });

    fixture.componentInstance.guardarObservaciones();

    expect(dialogRefSpy.close).toHaveBeenCalledWith({ observaciones: 'Buen rendimiento' });
  });
});
