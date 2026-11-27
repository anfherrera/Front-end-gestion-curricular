import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { ReingresoEstudianteComponent } from './reingreso-estudiante.component';
import { ReingresoEstudianteService } from '@features/reingreso/services/reingreso-estudiante.service';

describe('ReingresoEstudianteComponent (Secretaria)', () => {
  let servicio: jasmine.SpyObj<ReingresoEstudianteService>;
  let component: ReingresoEstudianteComponent;

  beforeEach(async () => {
    servicio = jasmine.createSpyObj<ReingresoEstudianteService>('ReingresoEstudianteService', [
      'getSecretariaRequests',
      'getSecretariaApprovedRequests',
      'subirArchivoPDF',
      'approveDefinitively',
    ]);
    servicio.getSecretariaRequests.and.returnValue(of([]));
    servicio.getSecretariaApprovedRequests.and.returnValue(of([]));
    servicio.subirArchivoPDF.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [ReingresoEstudianteComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ReingresoEstudianteService, useValue: servicio },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ReingresoEstudianteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('carga las pendientes y el historial de secretaría', () => {
    expect(servicio.getSecretariaRequests).toHaveBeenCalled();
    expect(servicio.getSecretariaApprovedRequests).toHaveBeenCalled();
  });

  it('usa la resolución de reingreso y sube el PDF por el endpoint de archivos', () => {
    const pdf = new File([''], 'r.pdf', { type: 'application/pdf' });
    expect(component.config.plantilla.id).toBe('RESOLUCION_REINGRESO');
    component.config.subirPdf(7, pdf);
    expect(servicio.subirArchivoPDF).toHaveBeenCalledWith(pdf, 7);
  });
});
