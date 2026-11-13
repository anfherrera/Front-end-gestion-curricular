import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { RevisionAprobacionComponent } from './revision-aprobacion.component';
import { HomologacionAsignaturasService } from '@core/services/homologacion-asignaturas.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { SolicitudHomologacionDTORespuesta } from '@core/models/procesos.model';
import { RolRevision } from '@core/models/solicitud-revision.model';

type Sol = SolicitudHomologacionDTORespuesta;

function solicitud(id: number, estado: string, comentario = ''): Sol {
  return {
    id_solicitud: id,
    nombre_solicitud: `Solicitud ${id}`,
    fecha_registro_solicitud: '2026-03-01',
    periodo_academico: '2026-1',
    estadosSolicitud: [{ id_estado: 1, estado_actual: estado, fecha_registro_estado: '2026-03-01' }],
    documentos: [{ id_documento: id * 10, nombre: 'doc.pdf', ruta_documento: '', fecha_documento: '', esValido: false, comentario }]
  } as Sol;
}

describe('RevisionAprobacionComponent', () => {
  let fixture: ComponentFixture<RevisionAprobacionComponent<Sol>>;
  let component: RevisionAprobacionComponent<Sol>;
  let servicio: jasmine.SpyObj<HomologacionAsignaturasService>;
  let snackbar: jasmine.SpyObj<SnackbarService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  async function crear(rol: RolRevision, marcarDocumentosAlDecidir: boolean, pendientes: Sol[] = []): Promise<void> {
    servicio = jasmine.createSpyObj<HomologacionAsignaturasService>('HomologacionAsignaturasService', [
      'getPendingRequests', 'getCoordinadorRequests', 'getSolicitudesProcesadasFuncionario',
      'getSolicitudesProcesadasCoordinador', 'approveRequest', 'approveAsCoordinador', 'rejectRequest',
      'actualizarEstadoDocumentos', 'agregarComentario'
    ]);
    servicio.getPendingRequests.and.returnValue(of(pendientes));
    servicio.getCoordinadorRequests.and.returnValue(of(pendientes));
    servicio.getSolicitudesProcesadasFuncionario.and.returnValue(of([]));
    servicio.getSolicitudesProcesadasCoordinador.and.returnValue(of([]));
    servicio.approveRequest.and.returnValue(of({}));
    servicio.approveAsCoordinador.and.returnValue(of({}));
    servicio.rejectRequest.and.returnValue(of({}));
    servicio.actualizarEstadoDocumentos.and.returnValue(of({}));
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
    fixture.componentRef.setInput('config', { rol, servicio, proceso: 'homologacion', nombreProceso: 'Homologación', marcarDocumentosAlDecidir });
    fixture.detectChanges();
  }

  function respuestaDialogo(motivo: string | undefined): void {
    dialog.open.and.returnValue({ afterClosed: () => of(motivo) } as ReturnType<MatDialog['open']>);
  }

  describe('funcionario', () => {
    beforeEach(() => crear('funcionario', true, [solicitud(1, 'ENVIADA')]));

    it('HA-F-002: carga sus pendientes y su historial', () => {
      expect(servicio.getPendingRequests).toHaveBeenCalled();
      expect(servicio.getSolicitudesProcesadasFuncionario).toHaveBeenCalledWith(undefined);
      expect(servicio.getCoordinadorRequests).not.toHaveBeenCalled();
      expect(component.pendientes.length).toBe(1);
    });

    it('no selecciona nada al cargar', () => {
      expect(component.seleccionada).toBeNull();
      expect(component.puedeDecidir).toBeFalse();
    });

    it('puede decidir las solicitudes enviadas', () => {
      component.onSolicitudSeleccionada(solicitud(1, 'ENVIADA'));
      expect(component.puedeDecidir).toBeTrue();
      component.onSolicitudSeleccionada(solicitud(2, 'APROBADA_FUNCIONARIO'));
      expect(component.puedeDecidir).toBeFalse();
    });

    it('al aprobar marca los documentos como válidos y recarga las listas', () => {
      component.onSolicitudSeleccionada(solicitud(1, 'ENVIADA'));
      component.aprobar();

      expect(servicio.approveRequest).toHaveBeenCalledWith(1);
      expect(servicio.actualizarEstadoDocumentos).toHaveBeenCalledWith(1, [{ id_documento: 10, esValido: true }]);
      expect(snackbar.mostrar).toHaveBeenCalledWith('Solicitud aprobada y documentos actualizados', 'exito');
      expect(component.seleccionada).toBeNull();
      expect(servicio.getPendingRequests).toHaveBeenCalledTimes(2);
      expect(servicio.getSolicitudesProcesadasFuncionario).toHaveBeenCalledTimes(2);
    });

    it('si falla marcar los documentos, la aprobación vale y avisa', () => {
      servicio.actualizarEstadoDocumentos.and.returnValue(throwError(() => new Error('x')));
      component.onSolicitudSeleccionada(solicitud(1, 'ENVIADA'));
      component.aprobar();
      expect(snackbar.mostrar).toHaveBeenCalledWith('Solicitud aprobada, pero error al actualizar documentos', 'advertencia');
    });

    it('al rechazar con motivo marca los documentos como no válidos', () => {
      respuestaDialogo('Faltan notas');
      component.onSolicitudSeleccionada(solicitud(1, 'ENVIADA'));
      component.rechazar();

      expect(servicio.rejectRequest).toHaveBeenCalledWith(1, 'Faltan notas');
      expect(servicio.actualizarEstadoDocumentos).toHaveBeenCalledWith(1, [{ id_documento: 10, esValido: false }]);
      expect(snackbar.mostrar).toHaveBeenCalledWith('Solicitud rechazada y documentos actualizados', 'exito');
    });

    it('si se cancela el rechazo no hace nada', () => {
      respuestaDialogo(undefined);
      component.onSolicitudSeleccionada(solicitud(1, 'ENVIADA'));
      component.rechazar();
      expect(servicio.rejectRequest).not.toHaveBeenCalled();
      expect(component.seleccionada).not.toBeNull();
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
      expect(component.seleccionada).toBe(recargada);
    });

    it('muestra el error del servidor al aprobar', () => {
      servicio.approveRequest.and.returnValue(throwError(() => ({ status: 500, error: { message: 'Caído' } })));
      component.onSolicitudSeleccionada(solicitud(1, 'ENVIADA'));
      component.aprobar();
      expect(snackbar.error).toHaveBeenCalled();
      expect(snackbar.mostrar).not.toHaveBeenCalled();
    });
  });

  describe('coordinador', () => {
    beforeEach(() => crear('coordinador', false, [solicitud(5, 'APROBADA_FUNCIONARIO')]));

    it('HA-C-002: carga sus pendientes y su historial', () => {
      expect(servicio.getCoordinadorRequests).toHaveBeenCalled();
      expect(servicio.getSolicitudesProcesadasCoordinador).toHaveBeenCalled();
      expect(servicio.getPendingRequests).not.toHaveBeenCalled();
    });

    it('HA-C-003: sin solicitud seleccionada no permite aprobar ni rechazar', () => {
      expect(component.puedeDecidir).toBeFalse();
    });

    it('solo decide las aprobadas por el funcionario', () => {
      component.onSolicitudSeleccionada(solicitud(5, 'APROBADA_FUNCIONARIO'));
      expect(component.puedeDecidir).toBeTrue();
      component.onSolicitudSeleccionada(solicitud(6, 'ENVIADA'));
      expect(component.puedeDecidir).toBeFalse();
    });

    it('aprueba definitivamente sin tocar los documentos', () => {
      component.onSolicitudSeleccionada(solicitud(5, 'APROBADA_FUNCIONARIO'));
      component.aprobar();

      expect(servicio.approveAsCoordinador).toHaveBeenCalledWith(5);
      expect(servicio.actualizarEstadoDocumentos).not.toHaveBeenCalled();
      expect(snackbar.mostrar).toHaveBeenCalledWith('Solicitud aprobada definitivamente', 'exito');
      expect(component.textoAprobar).toBe('Aprobar Definitivamente');
    });

    it('al rechazar avisa sin tocar los documentos', () => {
      respuestaDialogo('No cumple');
      component.onSolicitudSeleccionada(solicitud(5, 'APROBADA_FUNCIONARIO'));
      component.rechazar();

      expect(servicio.rejectRequest).toHaveBeenCalledWith(5, 'No cumple');
      expect(servicio.actualizarEstadoDocumentos).not.toHaveBeenCalled();
      expect(snackbar.mostrar).toHaveBeenCalledWith('Solicitud rechazada', 'exito');
    });
  });
});
