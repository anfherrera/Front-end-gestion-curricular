import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { HomologacionAsignaturasComponent } from './homologacion-asignaturas.component';
import { HomologacionAsignaturasService } from '@core/services/homologacion-asignaturas.service';

describe('HomologacionAsignaturasComponent (Secretaria)', () => {
  let servicio: jasmine.SpyObj<HomologacionAsignaturasService>;
  let component: HomologacionAsignaturasComponent;

  beforeEach(async () => {
    servicio = jasmine.createSpyObj<HomologacionAsignaturasService>('HomologacionAsignaturasService', [
      'getSecretariaRequests',
      'getSecretariaApprovedRequests',
      'subirResolucion',
      'approveDefinitively',
    ]);
    servicio.getSecretariaRequests.and.returnValue(of([]));
    servicio.getSecretariaApprovedRequests.and.returnValue(of([]));
    servicio.subirResolucion.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [HomologacionAsignaturasComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HomologacionAsignaturasService, useValue: servicio },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomologacionAsignaturasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('HA-S-001: carga las pendientes y el historial de secretaría', () => {
    expect(servicio.getSecretariaRequests).toHaveBeenCalled();
    expect(servicio.getSecretariaApprovedRequests).toHaveBeenCalled();
  });

  it('HA-S-002: usa el oficio de homologación, muestra los documentos y sube la resolución', () => {
    const pdf = new File([''], 'r.pdf', { type: 'application/pdf' });
    expect(component.config.plantilla.id).toBe('OFICIO_HOMOLOGACION');
    expect(component.config.servicioDocumentos).toBe(servicio);
    component.config.subirPdf(7, pdf);
    expect(servicio.subirResolucion).toHaveBeenCalledWith(pdf, 7);
  });
});
