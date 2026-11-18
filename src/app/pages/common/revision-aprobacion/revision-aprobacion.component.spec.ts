import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { ConfigRevisionAprobacion, RevisionAprobacionComponent } from './revision-aprobacion.component';
import { HomologacionAsignaturasService } from '@core/services/homologacion-asignaturas.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { SolicitudHomologacionDTORespuesta } from '@core/models/procesos.model';
import { RolRevision } from '@core/models/solicitud-revision.model';
import { TextoDialogData } from '@shared/components/texto-dialog/texto-dialog.component';

type Sol = SolicitudHomologacionDTORespuesta;

function solicitud(id: number, estado: string, comentario = '', comentarioEstado?: string): Sol {
  return {
    id_solicitud: id,
    nombre_solicitud: `Solicitud ${id}`,
    fecha_registro_solicitud: '2026-03-01',
    periodo_academico: '2026-1',
    estadosSolicitud: [{ id_estado: 1, estado_actual: estado, fecha_registro_estado: '2026-03-01', comentario: comentarioEstado }],
    documentos: [{ id_documento: id * 10, nombre: 'doc.pdf', ruta_documento: '', fecha_documento: '', esValido: false, comentario }]
  } as Sol;
}

describe('RevisionAprobacionComponent', () => {
  let fixture: ComponentFixture<RevisionAprobacionComponent<Sol>>;
  let component: RevisionAprobacionComponent<Sol>;
  let servicio: jasmine.SpyObj<HomologacionAsignaturasService>;
  let snackbar: jasmine.SpyObj<SnackbarService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  async function crear(rol: RolRevision, pendientes: Sol[] = [], extra: Partial<ConfigRevisionAprobacion<Sol>> = {}): Promise<void> {
    servicio = jasmine.createSpyObj<HomologacionAsignaturasService>('HomologacionAsignaturasService', [
      'getPendingRequests', 'getCoordinadorRequests', 'getSolicitudesProcesadasFuncionario',
      'getSolicitudesProcesadasCoordinador', 'approveRequest', 'approveAsCoordinador', 'rejectRequest',
      'agregarComentario'
    ]);
    servicio.getPendingRequests.and.returnValue(of(pendientes));
    servicio.getCoordinadorRequests.and.returnValue(of(pendientes));
    servicio.getSolicitudesProcesadasFuncionario.and.returnValue(of([]));
    servicio.getSolicitudesProcesadasCoordinador.and.returnValue(of([]));
    servicio.approveRequest.and.returnValue(of({}));
    servicio.approveAsCoordinador.and.returnValue(of({}));
    servicio.rejectRequest.and.returnValue(of({}));
    snackbar = jasmine.createSpyObj<SnackbarService>('SnackbarService', ['mostrar', 'exito', 'error', 'advertencia']);
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [RevisionAprobacionComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SnackbarService, useValue: snackbar }
      ]
    })
      // MatDialogModule (lo importa documentation-viewer) registra su propio MatDialog
      .overrideProvider(MatDialog, { useValue: dialog })
      .compileComponents();

    fixture = TestBed.createComponent(RevisionAprobacionComponent<Sol>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', { rol, servicio, proceso: 'homologacion', nombreProceso: 'Homologación', ...extra });
    fixture.detectChanges();
  }

  function respuestaDialogo(motivo: string | undefined): void {
    dialog.open.and.returnValue({ afterClosed: () => of(motivo) } as ReturnType<MatDialog['open']>);
  }

  describe('funcionario', () => {
    beforeEach(() => crear('funcionario', [solicitud(1, 'ENVIADA')]));

    it('HA-F-002: carga sus pendientes y su historial', () => {
      expect(servicio.getPendingRequests).toHaveBeenCalled();
      expect(servicio.getSolicitudesProcesadasFuncionario).toHaveBeenCalledWith(undefined);
      expect(servicio.getCoordinadorRequests).not.toHaveBeenCalled();
      expect(component.pendientes().length).toBe(1);
    });

    it('no selecciona nada al cargar', () => {
      expect(component.seleccionada()).toBeNull();
      expect(component.puedeDecidir()).toBeFalse();
    });

    it('puede decidir las solicitudes enviadas', () => {
      component.onSolicitudSeleccionada(solicitud(1, 'ENVIADA'));
      expect(component.puedeDecidir()).toBeTrue();
      component.onSolicitudSeleccionada(solicitud(2, 'APROBADA_FUNCIONARIO'));
      expect(component.puedeDecidir()).toBeFalse();
    });

    it('al aprobar avisa y recarga las listas', () => {
      component.onSolicitudSeleccionada(solicitud(1, 'ENVIADA'));
      component.aprobar();

      expect(servicio.approveRequest).toHaveBeenCalledWith(1);
      expect(snackbar.exito).toHaveBeenCalledWith('Solicitud aprobada');
      expect(component.seleccionada()).toBeNull();
      expect(servicio.getPendingRequests).toHaveBeenCalledTimes(2);
      expect(servicio.getSolicitudesProcesadasFuncionario).toHaveBeenCalledTimes(2);
    });

    it('al rechazar con motivo lo envía y avisa', () => {
      respuestaDialogo('Faltan notas');
      component.onSolicitudSeleccionada(solicitud(1, 'ENVIADA'));
      component.rechazar();

      expect(servicio.rejectRequest).toHaveBeenCalledWith(1, 'Faltan notas');
      expect(snackbar.exito).toHaveBeenCalledWith('Solicitud rechazada');
    });

    it('si se cancela el rechazo no hace nada', () => {
      respuestaDialogo(undefined);
      component.onSolicitudSeleccionada(solicitud(1, 'ENVIADA'));
      component.rechazar();
      expect(servicio.rejectRequest).not.toHaveBeenCalled();
      expect(component.seleccionada()).not.toBeNull();
    });

    it('el filtro de período recarga el historial', () => {
      component.onPeriodoChange('2025-2');
      expect(servicio.getSolicitudesProcesadasFuncionario).toHaveBeenCalledWith('2025-2');
    });

    it('tras añadir un comentario la selección pasa a la solicitud recargada', () => {
      component.onSolicitudSeleccionada(solicitud(1, 'ENVIADA'));
      servicio.agregarComentario.and.returnValue(of({}));
      const recargada = solicitud(1, 'ENVIADA', 'Revisar firma');
      servicio.getPendingRequests.and.returnValue(of([recargada]));

      component.onComentarioAgregado({ documento: recargada.documentos[0], comentario: 'Revisar firma' });

      expect(servicio.agregarComentario).toHaveBeenCalledWith(10, 'Revisar firma');
      expect(component.seleccionada()).toBe(recargada);
    });

    it('muestra el error del servidor al aprobar', () => {
      servicio.approveRequest.and.returnValue(throwError(() => ({ status: 500, error: { message: 'Caído' } })));
      component.onSolicitudSeleccionada(solicitud(1, 'ENVIADA'));
      component.aprobar();
      expect(snackbar.error).toHaveBeenCalled();
      expect(snackbar.exito).not.toHaveBeenCalled();
    });
  });

  describe('coordinador', () => {
    beforeEach(() => crear('coordinador', [solicitud(5, 'APROBADA_FUNCIONARIO')]));

    it('HA-C-002: carga sus pendientes y su historial', () => {
      expect(servicio.getCoordinadorRequests).toHaveBeenCalled();
      expect(servicio.getSolicitudesProcesadasCoordinador).toHaveBeenCalled();
      expect(servicio.getPendingRequests).not.toHaveBeenCalled();
    });

    it('HA-C-003: sin solicitud seleccionada no permite aprobar ni rechazar', () => {
      expect(component.puedeDecidir()).toBeFalse();
    });

    it('solo decide las aprobadas por el funcionario', () => {
      component.onSolicitudSeleccionada(solicitud(5, 'APROBADA_FUNCIONARIO'));
      expect(component.puedeDecidir()).toBeTrue();
      component.onSolicitudSeleccionada(solicitud(6, 'ENVIADA'));
      expect(component.puedeDecidir()).toBeFalse();
    });

    it('aprueba definitivamente', () => {
      component.onSolicitudSeleccionada(solicitud(5, 'APROBADA_FUNCIONARIO'));
      component.aprobar();

      expect(servicio.approveAsCoordinador).toHaveBeenCalledWith(5);
      expect(snackbar.exito).toHaveBeenCalledWith('Solicitud aprobada definitivamente');
      expect(component.textoAprobar()).toBe('Aprobar Definitivamente');
    });

    it('al rechazar con motivo lo envía y avisa', () => {
      respuestaDialogo('No cumple');
      component.onSolicitudSeleccionada(solicitud(5, 'APROBADA_FUNCIONARIO'));
      component.rechazar();

      expect(servicio.rejectRequest).toHaveBeenCalledWith(5, 'No cumple');
      expect(snackbar.exito).toHaveBeenCalledWith('Solicitud rechazada');
    });
  });

  describe('motivo del rechazo', () => {
    beforeEach(() => crear('funcionario'));

    it('muestra el comentario del último rechazo de la solicitud elegida', () => {
      component.onSolicitudSeleccionada(solicitud(3, 'Rechazada', '', 'Falta el certificado'));
      fixture.detectChanges();

      expect(component.motivoRechazo()).toBe('Falta el certificado');
      expect(fixture.nativeElement.querySelector('.comentario-rechazo')?.textContent).toContain('Falta el certificado');
      expect(component.puedeDecidir()).toBeFalse();
    });

    it('no aparece si la solicitud no está rechazada', () => {
      component.onSolicitudSeleccionada(solicitud(1, 'ENVIADA', '', 'Comentario del envío'));
      fixture.detectChanges();

      expect(component.motivoRechazo()).toBeNull();
      expect(fixture.nativeElement.querySelector('.comentario-rechazo')).toBeNull();
    });
  });

  describe('con documentos aparte y textos propios', () => {
    const docs = [{ id_documento: 77, nombre: 'paz.pdf', ruta_documento: '', fecha_documento: '', esValido: false }];
    let documentosAparte: jasmine.Spy;

    beforeEach(() => {
      documentosAparte = jasmine.createSpy('documentosAparte').and.returnValue(of(docs));
      return crear('coordinador', [solicitud(5, 'APROBADA_FUNCIONARIO')], {
        documentosAparte,
        mensajeRechazada: 'Paz y Salvo rechazado',
        dialogoRechazo: { titulo: 'Rechazar Paz y Salvo', descripcion: 'Indique el motivo:' }
      });
    });

    it('al elegir una solicitud pide sus documentos y los muestra', () => {
      component.onSolicitudSeleccionada(solicitud(5, 'APROBADA_FUNCIONARIO'));

      expect(documentosAparte).toHaveBeenCalledWith(5);
      expect(component.documentos()).toEqual(docs);
    });

    it('si fallan los documentos deja la lista vacía y avisa', () => {
      documentosAparte.and.returnValue(throwError(() => ({ status: 500, error: null })));
      component.onSolicitudSeleccionada(solicitud(5, 'APROBADA_FUNCIONARIO'));

      expect(component.documentos()).toEqual([]);
      expect(snackbar.error).toHaveBeenCalled();
    });

    it('tras añadir un comentario vuelve a pedir los documentos', () => {
      servicio.agregarComentario.and.returnValue(of({}));
      component.onSolicitudSeleccionada(solicitud(5, 'APROBADA_FUNCIONARIO'));
      component.onComentarioAgregado({ documento: docs[0], comentario: 'Revisar' });

      expect(documentosAparte).toHaveBeenCalledTimes(2);
      expect(component.documentos()).toEqual(docs);
    });

    it('usa sus textos en el diálogo y en el aviso de rechazo', () => {
      respuestaDialogo('No cumple');
      component.onSolicitudSeleccionada(solicitud(5, 'APROBADA_FUNCIONARIO'));
      component.rechazar();

      const data = dialog.open.calls.mostRecent().args[1]?.data as TextoDialogData;
      expect(data.titulo).toBe('Rechazar Paz y Salvo');
      expect(data.descripcion).toBe('Indique el motivo:');
      expect(snackbar.exito).toHaveBeenCalledWith('Paz y Salvo rechazado');
    });
  });
});
