import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { HomologacionRevisionComponent } from './homologacion-revision.component';
import { HomologacionAsignaturasService } from '../../../core/services/homologacion-asignaturas.service';
import { RolRevision } from '../../../core/models/solicitud-revision.model';

describe('HomologacionRevisionComponent', () => {
  let servicio: jasmine.SpyObj<HomologacionAsignaturasService>;

  async function crear(rolRevision?: RolRevision): Promise<HomologacionRevisionComponent> {
    servicio = jasmine.createSpyObj<HomologacionAsignaturasService>('HomologacionAsignaturasService', [
      'getPendingRequests', 'getCoordinadorRequests', 'getSolicitudesProcesadasFuncionario', 'getSolicitudesProcesadasCoordinador'
    ]);
    servicio.getPendingRequests.and.returnValue(of([]));
    servicio.getCoordinadorRequests.and.returnValue(of([]));
    servicio.getSolicitudesProcesadasFuncionario.and.returnValue(of([]));
    servicio.getSolicitudesProcesadasCoordinador.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [HomologacionRevisionComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HomologacionAsignaturasService, useValue: servicio },
        { provide: ActivatedRoute, useValue: { snapshot: { data: rolRevision ? { rolRevision } : {} } } }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(HomologacionRevisionComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('HA-F-001: para el funcionario usa su bandeja y marca los documentos al decidir', async () => {
    const component = await crear('funcionario');
    expect(component.config.rol).toBe('funcionario');
    expect(component.config.marcarDocumentosAlDecidir).toBeTrue();
    expect(servicio.getPendingRequests).toHaveBeenCalled();
  });

  it('HA-C-001: para el coordinador usa su bandeja y no toca los documentos', async () => {
    const component = await crear('coordinador');
    expect(component.config.rol).toBe('coordinador');
    expect(component.config.marcarDocumentosAlDecidir).toBeFalse();
    expect(servicio.getCoordinadorRequests).toHaveBeenCalled();
  });

  it('sin rol en la ruta trabaja como funcionario', async () => {
    const component = await crear();
    expect(component.config.rol).toBe('funcionario');
  });
});
