import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { ReingresoRevisionComponent } from './reingreso-revision.component';
import { ReingresoEstudianteService } from '../../../core/services/reingreso-estudiante.service';
import { RolRevision } from '../../../core/models/solicitud-revision.model';

describe('ReingresoRevisionComponent', () => {
  let servicio: jasmine.SpyObj<ReingresoEstudianteService>;

  async function crear(rolRevision: RolRevision): Promise<ReingresoRevisionComponent> {
    servicio = jasmine.createSpyObj<ReingresoEstudianteService>('ReingresoEstudianteService', [
      'getPendingRequests', 'getCoordinadorRequests', 'getSolicitudesProcesadasFuncionario', 'getSolicitudesProcesadasCoordinador'
    ]);
    servicio.getPendingRequests.and.returnValue(of([]));
    servicio.getCoordinadorRequests.and.returnValue(of([]));
    servicio.getSolicitudesProcesadasFuncionario.and.returnValue(of([]));
    servicio.getSolicitudesProcesadasCoordinador.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ReingresoRevisionComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ReingresoEstudianteService, useValue: servicio },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { rolRevision } } } }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(ReingresoRevisionComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it('para el funcionario carga sus pendientes y su historial', async () => {
    const component = await crear('funcionario');
    expect(component.config.proceso).toBe('reingreso');
    expect(component.config.marcarDocumentosAlDecidir).toBeFalse();
    expect(servicio.getPendingRequests).toHaveBeenCalled();
    expect(servicio.getSolicitudesProcesadasFuncionario).toHaveBeenCalled();
  });

  it('para el coordinador carga sus pendientes y su historial', async () => {
    const component = await crear('coordinador');
    expect(component.config.rol).toBe('coordinador');
    expect(servicio.getCoordinadorRequests).toHaveBeenCalled();
    expect(servicio.getSolicitudesProcesadasCoordinador).toHaveBeenCalled();
  });
});
