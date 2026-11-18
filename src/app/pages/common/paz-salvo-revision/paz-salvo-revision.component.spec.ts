import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { PazSalvoRevisionComponent } from './paz-salvo-revision.component';
import { PazSalvoService } from '@core/services/paz-salvo.service';
import { RolRevision } from '@core/models/solicitud-revision.model';

describe('PazSalvoRevisionComponent', () => {
  let servicio: jasmine.SpyObj<PazSalvoService>;

  async function crear(rolRevision?: RolRevision): Promise<PazSalvoRevisionComponent> {
    servicio = jasmine.createSpyObj<PazSalvoService>('PazSalvoService', [
      'getPendingRequests', 'getCoordinadorRequests', 'getSolicitudesProcesadasFuncionario',
      'getSolicitudesProcesadasCoordinador', 'obtenerDocumentosCoordinador'
    ]);
    servicio.getPendingRequests.and.returnValue(of([]));
    servicio.getCoordinadorRequests.and.returnValue(of([]));
    servicio.getSolicitudesProcesadasFuncionario.and.returnValue(of([]));
    servicio.getSolicitudesProcesadasCoordinador.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [PazSalvoRevisionComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PazSalvoService, useValue: servicio },
        { provide: ActivatedRoute, useValue: { snapshot: { data: rolRevision ? { rolRevision } : {} } } }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(PazSalvoRevisionComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('para el funcionario usa su bandeja y lee los documentos de la lista', async () => {
    const component = await crear('funcionario');
    expect(component.config.rol).toBe('funcionario');
    expect(component.config.proceso).toBe('paz-salvo');
    expect(component.config.documentosAparte).toBeUndefined();
    expect(component.config.dialogoRechazo).toBeUndefined();
    expect(component.config.mensajeRechazada).toBe('Paz y Salvo rechazado');
    expect(servicio.getPendingRequests).toHaveBeenCalled();
  });

  it('para el coordinador pide los documentos por su endpoint y los adapta', async () => {
    const component = await crear('coordinador');
    expect(servicio.getCoordinadorRequests).toHaveBeenCalled();
    expect(component.config.dialogoRechazo?.titulo).toBe('Rechazar Paz y Salvo');

    servicio.obtenerDocumentosCoordinador.and.returnValue(of([
      { id: 9, nombre: 'Formato', nombreArchivo: 'formato.pdf', ruta: '/docs/formato.pdf', fecha: '2026-03-01', esValido: true }
    ]));
    let documentos: unknown;
    component.config.documentosAparte!(4).subscribe(d => documentos = d);

    expect(servicio.obtenerDocumentosCoordinador).toHaveBeenCalledWith(4);
    expect(documentos).toEqual([{
      id_documento: 9, nombre: 'formato.pdf', ruta_documento: '/docs/formato.pdf',
      fecha_documento: '2026-03-01', esValido: true, comentario: undefined
    }]);
  });

  it('sin rol en la ruta trabaja como funcionario', async () => {
    const component = await crear();
    expect(component.config.rol).toBe('funcionario');
  });
});
