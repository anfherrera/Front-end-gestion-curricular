import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { ConfigOficioSecretaria, OficioSecretariaComponent } from './oficio-secretaria.component';
import { SolicitudHomologacionDTORespuesta } from '@core/models/procesos.model';
import { DocumentRequest } from '@core/models/documento.model';
import { DocumentGeneratorService } from '@core/services/document-generator.service';
import { SnackbarService } from '@core/services/snackbar.service';

type Sol = SolicitudHomologacionDTORespuesta;

function solicitud(id: number): Sol {
  return {
    id_solicitud: id,
    nombre_solicitud: `Solicitud ${id}`,
    fecha_registro_solicitud: '2026-03-01',
    periodo_academico: '2026-1',
    estadosSolicitud: [{ id_estado: 1, estado_actual: 'APROBADA_COORDINADOR', fecha_registro_estado: '2026-03-01' }],
    objUsuario: { nombre_completo: 'Ana Pérez', codigo: '1001' },
    documentos: []
  } as unknown as Sol;
}

const pdf = new File(['%PDF'], 'oficio.pdf', { type: 'application/pdf' });

describe('OficioSecretariaComponent', () => {
  let fixture: ComponentFixture<OficioSecretariaComponent<Sol>>;
  let component: OficioSecretariaComponent<Sol>;
  let config: jasmine.SpyObj<Required<ConfigOficioSecretaria<Sol>>>;
  let snackbar: jasmine.SpyObj<SnackbarService>;
  let generador: jasmine.SpyObj<DocumentGeneratorService>;

  beforeEach(async () => {
    config = jasmine.createSpyObj('config', ['pendientes', 'procesadas', 'subirPdf', 'aprobar']);
    config.pendientes.and.returnValue(of([solicitud(1), solicitud(2)]));
    config.procesadas.and.returnValue(of([]));
    config.subirPdf.and.returnValue(of({}));
    config.aprobar.and.returnValue(of({}));
    snackbar = jasmine.createSpyObj<SnackbarService>('SnackbarService', ['exito', 'error', 'advertencia', 'info']);
    generador = jasmine.createSpyObj<DocumentGeneratorService>('DocumentGeneratorService', ['generarDocumento']);

    await TestBed.configureTestingModule({
      imports: [OficioSecretariaComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SnackbarService, useValue: snackbar },
        { provide: DocumentGeneratorService, useValue: generador }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OficioSecretariaComponent<Sol>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('config', {
      ...config,
      proceso: 'paz-salvo',
      plantilla: { id: 'OFICIO_PAZ_SALVO', nombre: 'Oficio', descripcion: '', camposRequeridos: [] }
    } satisfies ConfigOficioSecretaria<Sol>);
    fixture.detectChanges();
  });

  it('carga las pendientes y el historial al iniciar', () => {
    expect(config.pendientes).toHaveBeenCalled();
    expect(config.procesadas).toHaveBeenCalledWith(undefined);
    expect(component.pendientes.length).toBe(2);
  });

  it('al cambiar el período recarga solo el historial', () => {
    component.onPeriodoChange('2026-1');
    expect(config.procesadas).toHaveBeenCalledWith('2026-1');
    expect(config.pendientes).toHaveBeenCalledTimes(1);
  });

  it('al cambiar de solicitud se reinicia el flujo del PDF', () => {
    component.onSolicitudSeleccionada(solicitud(1));
    component.documentoHabilitado = true;
    component.archivoPDF = pdf;

    component.onSolicitudSeleccionada(solicitud(2));

    expect(component.seleccionada?.id_solicitud).toBe(2);
    expect(component.documentoHabilitado).toBeFalse();
    expect(component.archivoPDF).toBeNull();
  });

  it('genera el Word con el nombre del estudiante sin cambiar el estado', () => {
    // descargarBlob crea un enlace y lo pulsa: se intercepta el clic para leer el nombre
    let nombreDescargado = '';
    spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
      nombreDescargado = this.download;
    });
    generador.generarDocumento.and.returnValue(of(new Blob()));
    component.onSolicitudSeleccionada(solicitud(1));

    component.onGenerarDocumento({ tipoDocumento: 'OFICIO_PAZ_SALVO' } as DocumentRequest);

    expect(nombreDescargado).toBe(`OFICIO_PAZ_SALVO_Ana Pérez_${new Date().getFullYear()}.docx`);
    expect(component.documentoGenerado).toBeTrue();
    expect(component.generando).toBeFalse();
    expect(config.aprobar).not.toHaveBeenCalled();
  });

  it('rechaza archivos que no son PDF', () => {
    const texto = new File(['x'], 'nota.txt', { type: 'text/plain' });
    component.onArchivoSeleccionado({ target: { files: [texto] } } as unknown as Event);
    expect(component.archivoPDF).toBeNull();
    expect(snackbar.advertencia).toHaveBeenCalled();
  });

  it('sube el PDF, aprueba y recarga las dos listas', () => {
    component.onSolicitudSeleccionada(solicitud(1));
    component.archivoPDF = pdf;

    component.enviarDocumento();

    expect(config.subirPdf).toHaveBeenCalledWith(1, pdf);
    expect(config.aprobar).toHaveBeenCalledWith(1);
    expect(snackbar.exito).toHaveBeenCalled();
    expect(component.seleccionada).toBeNull();
    expect(config.pendientes).toHaveBeenCalledTimes(2);
    expect(config.procesadas).toHaveBeenCalledTimes(2);
  });

  it('si falla la subida no aprueba', () => {
    config.subirPdf.and.returnValue(throwError(() => new Error('x')));
    component.onSolicitudSeleccionada(solicitud(1));
    component.archivoPDF = pdf;

    component.enviarDocumento();

    expect(config.aprobar).not.toHaveBeenCalled();
    expect(snackbar.error).toHaveBeenCalled();
    expect(component.subiendoPDF).toBeFalse();
    expect(component.seleccionada?.id_solicitud).toBe(1);
  });

  it('si falla la aprobación avisa que el PDF ya se subió', () => {
    config.aprobar.and.returnValue(throwError(() => ({})));
    component.onSolicitudSeleccionada(solicitud(1));
    component.archivoPDF = pdf;

    component.enviarDocumento();

    expect(snackbar.error).toHaveBeenCalledWith('PDF subido pero error al enviar al estudiante');
    expect(component.enviandoPDF).toBeFalse();
  });

  it('sin PDF no envía nada', () => {
    component.onSolicitudSeleccionada(solicitud(1));
    component.enviarDocumento();
    expect(config.subirPdf).not.toHaveBeenCalled();
    expect(snackbar.advertencia).toHaveBeenCalled();
  });
});
