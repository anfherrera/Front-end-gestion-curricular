import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

import { PruebasEcaesFuncionarioComponent } from './pruebas-ecaes.component';
import { PruebasEcaesService, SolicitudEcaesResponse } from '@core/services/pruebas-ecaes.service';
import { PeriodosAcademicosService } from '@core/services/periodos-academicos.service';
import { SnackbarService } from '@core/services/snackbar.service';

function solicitud(id: number, comentario = ''): SolicitudEcaesResponse {
  return {
    id_solicitud: id,
    nombre_solicitud: `ECAES ${id}`,
    fecha_registro_solicitud: '2026-03-01',
    periodo_academico: '2026-1',
    estadosSolicitud: [{ id_estado: 1, estado_actual: 'ENVIADA', fecha_registro_estado: '2026-03-01', objSolicitud: null }],
    documentos: [{ id_documento: id * 10, nombre: 'cc.pdf', ruta_documento: '', fecha_documento: '', esValido: false, comentario }],
    tipoDocumento: 'CC'
  } as SolicitudEcaesResponse;
}

describe('PruebasEcaesFuncionarioComponent', () => {
  let fixture: ComponentFixture<PruebasEcaesFuncionarioComponent>;
  let component: PruebasEcaesFuncionarioComponent;
  let servicio: jasmine.SpyObj<PruebasEcaesService>;
  let snackbar: jasmine.SpyObj<SnackbarService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    servicio = jasmine.createSpyObj<PruebasEcaesService>('PruebasEcaesService', [
      'listarSolicitudesFuncionario', 'approveRequest', 'rejectRequest', 'agregarComentario', 'buscarFechasPorPeriodo'
    ]);
    servicio.listarSolicitudesFuncionario.and.returnValue(of([solicitud(1), solicitud(2)]));
    servicio.approveRequest.and.returnValue(of({}));
    servicio.rejectRequest.and.returnValue(of({}));
    servicio.agregarComentario.and.returnValue(of({}));
    const periodos = jasmine.createSpyObj<PeriodosAcademicosService>('PeriodosAcademicosService', ['getValoresPeriodos']);
    periodos.getValoresPeriodos.and.returnValue(of(['2026-1']));
    snackbar = jasmine.createSpyObj<SnackbarService>('SnackbarService', ['exito', 'error', 'advertencia', 'info']);
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [PruebasEcaesFuncionarioComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PruebasEcaesService, useValue: servicio },
        { provide: PeriodosAcademicosService, useValue: periodos },
        { provide: SnackbarService, useValue: snackbar }
      ]
    })
      // MatDialogModule (lo importa documentation-viewer) registra su propio MatDialog
      .overrideProvider(MatDialog, { useValue: dialog })
      .compileComponents();

    fixture = TestBed.createComponent(PruebasEcaesFuncionarioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function respuestaDialogo(motivo: string | undefined): void {
    dialog.open.and.returnValue({ afterClosed: () => of(motivo) } as ReturnType<MatDialog['open']>);
  }

  it('carga las pendientes en una bandeja sin historial', () => {
    expect(component.pendientes.length).toBe(2);
    expect((fixture.nativeElement as HTMLElement).querySelector('mat-tab-group')).toBeNull();
  });

  it('muestra el tipo de documento con su nombre', () => {
    expect(component.tipoDocumentoLabel('cc')).toBe('Cédula de Ciudadanía');
    expect(component.tipoDocumentoLabel('XX')).toBe('XX');
    expect(component.tipoDocumentoLabel(null)).toBe('-');
  });

  it('marcar como pre-registrada aprueba, quita la selección y recarga', () => {
    component.onSolicitudSeleccionada(solicitud(2));
    component.aprobar();

    expect(servicio.approveRequest).toHaveBeenCalledWith(2);
    expect(component.seleccionada).toBeNull();
    expect(servicio.listarSolicitudesFuncionario).toHaveBeenCalledTimes(2);
  });

  it('rechazar pide el motivo y lo envía', () => {
    respuestaDialogo('Documento ilegible');
    component.onSolicitudSeleccionada(solicitud(1));
    component.rechazar();

    expect(servicio.rejectRequest).toHaveBeenCalledWith(1, 'Documento ilegible');
    expect(snackbar.exito).toHaveBeenCalled();
  });

  it('cancelar el rechazo no hace nada', () => {
    respuestaDialogo(undefined);
    component.onSolicitudSeleccionada(solicitud(1));
    component.rechazar();

    expect(servicio.rejectRequest).not.toHaveBeenCalled();
    expect(component.seleccionada?.id_solicitud).toBe(1);
  });

  it('tras comentar sigue elegida la misma solicitud, con el comentario al día', () => {
    component.onSolicitudSeleccionada(solicitud(2));
    servicio.listarSolicitudesFuncionario.and.returnValue(of([solicitud(1), solicitud(2, 'Falta firma')]));

    component.onComentarioAgregado({ documento: solicitud(2).documentos[0], comentario: 'Falta firma' });

    expect(servicio.agregarComentario).toHaveBeenCalledWith(20, 'Falta firma');
    expect(component.seleccionada?.id_solicitud).toBe(2);
    expect(component.seleccionada?.documentos[0].comentario).toBe('Falta firma');
  });
});
