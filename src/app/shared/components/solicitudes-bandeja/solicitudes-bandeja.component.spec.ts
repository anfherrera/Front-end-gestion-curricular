import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { SolicitudesBandejaComponent } from './solicitudes-bandeja.component';
import { SolicitudRevisable } from '../../../core/models/solicitud-revision.model';

describe('SolicitudesBandejaComponent', () => {
  let component: SolicitudesBandejaComponent<SolicitudRevisable>;
  let fixture: ComponentFixture<SolicitudesBandejaComponent<SolicitudRevisable>>;

  const solicitud = (id: number, estado: string): SolicitudRevisable => ({
    id_solicitud: id,
    nombre_solicitud: `Solicitud ${id}`,
    fecha_registro_solicitud: '2026-03-01',
    estadosSolicitud: [{ estado_actual: estado }],
    documentos: []
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SolicitudesBandejaComponent, NoopAnimationsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(SolicitudesBandejaComponent<SolicitudRevisable>);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('arma las filas de pendientes e historial', () => {
    component.pendientes = [solicitud(1, 'ENVIADA'), solicitud(2, 'ENVIADA')];
    component.procesadas = [solicitud(3, 'APROBADA_FUNCIONARIO')];
    expect(component.filasPendientes.map(f => f.id)).toEqual([1, 2]);
    expect(component.filasProcesadas[0].estado).toBe('APROBADA_FUNCIONARIO');
  });

  it('sin solicitudes muestra el aviso de lista vacía', () => {
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain('No hay solicitudes pendientes de procesar');
  });

  it('al elegir una fila emite la solicitud original, y null al quitarla', () => {
    const elegida = solicitud(2, 'ENVIADA');
    component.pendientes = [solicitud(1, 'ENVIADA'), elegida];
    const emitidas: (SolicitudRevisable | null)[] = [];
    component.solicitudSeleccionada.subscribe(s => emitidas.push(s));

    component.onFilaSeleccionada(2);
    component.onFilaSeleccionada(null);
    component.onFilaSeleccionada(99);

    expect(emitidas).toEqual([elegida, null, null]);
  });

  it('el período "todos" se emite como null', () => {
    const periodos: (string | null)[] = [];
    component.periodoChange.subscribe(p => periodos.push(p));

    component.onPeriodoChange('todos');
    component.onPeriodoChange('2026-1');

    expect(periodos).toEqual([null, '2026-1']);
  });
});
