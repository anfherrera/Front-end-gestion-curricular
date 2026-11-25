import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { COLORS } from '@core/design-system/design-tokens';
import { EstadisticasService } from '@core/services/estadisticas.service';
import { EstadoInfo, EstadoSolicitudesResponse } from '@core/models/estadisticas/generales.model';
import { EstadisticasPorEstadoComponent } from './estadisticas-por-estado.component';

describe('EstadisticasPorEstadoComponent', () => {
  let fixture: ComponentFixture<EstadisticasPorEstadoComponent>;
  let component: EstadisticasPorEstadoComponent;
  let servicio: jasmine.SpyObj<EstadisticasService>;

  const estado = (cantidad: number, porcentaje: number, extra: Partial<EstadoInfo> = {}): EstadoInfo => ({
    cantidad,
    porcentaje,
    descripcion: '',
    color: '',
    icono: '',
    ...extra,
  });
  // Forma de VistaPorEstado del backend: "estados", "analisis" y "totalSolicitudes".
  const respuesta: EstadoSolicitudesResponse = {
    totalSolicitudes: 10,
    estados: {
      APROBADA: estado(6, 60, { color: '#00aa00', icono: 'fas fa-check-circle', descripcion: 'Aprobadas' }),
      ENVIADA: estado(3, 30),
      RECHAZADA: estado(1, 10),
    },
    fechaConsulta: '2026-11-20T10:00:00.000+00:00',
    analisis: { solicitudesPendientes: 3, solicitudesCompletadas: 6, tasaResolucion: 70, estadoMasComun: 'APROBADA' },
  };

  beforeEach(() => {
    servicio = jasmine.createSpyObj<EstadisticasService>('EstadisticasService', ['getEstadoSolicitudes']);
    servicio.getEstadoSolicitudes.and.returnValue(of(respuesta));
    TestBed.configureTestingModule({
      imports: [EstadisticasPorEstadoComponent, NoopAnimationsModule],
      providers: [{ provide: EstadisticasService, useValue: servicio }],
    });
    fixture = TestBed.createComponent(EstadisticasPorEstadoComponent);
    component = fixture.componentInstance;
  });

  it('muestra siempre los 4 estados principales, con los datos del backend o por defecto', () => {
    fixture.detectChanges();

    expect(servicio.getEstadoSolicitudes).toHaveBeenCalledWith({});
    const estados = component.estadosData();
    expect(estados.map((e) => [e.nombre, e.cantidad])).toEqual([
      ['APROBADA', 6],
      ['ENVIADA', 3],
      ['EN_PROCESO', 0],
      ['RECHAZADA', 1],
    ]);
    // Icono y descripción del backend tienen prioridad; el color es siempre el institucional del estado.
    expect(estados[0]).toEqual(
      jasmine.objectContaining({ color: COLORS.success, icono: 'fas fa-check-circle', descripcion: 'Aprobadas' })
    );
    // Lo que falta se completa por estado.
    expect(estados[1]).toEqual(
      jasmine.objectContaining({
        icono: 'send',
        color: COLORS.tertiary,
        descripcion: 'Solicitudes enviadas pendientes de revisión',
      })
    );
    expect(estados[2]).toEqual(
      jasmine.objectContaining({ porcentaje: 0, icono: 'schedule', descripcion: 'Solicitudes en proceso de revisión' })
    );
    expect(estados[2]).toEqual(jasmine.objectContaining({ color: COLORS.primary }));
    expect(estados[3]).toEqual(jasmine.objectContaining({ icono: 'cancel', color: COLORS.error }));
    expect(component.totalSolicitudes()).toBe(10);
    expect(component.data()?.analisis).toEqual(respuesta.analisis);
    expect(component.loading()).toBeFalse();
  });

  it('sin análisis del backend lo calcula con los estados', () => {
    servicio.getEstadoSolicitudes.and.returnValue(
      of({
        totalSolicitudes: 8,
        resumenPorEstado: { APROBADA: estado(2, 25), ENVIADA: estado(1, 12.5), EN_PROCESO: estado(5, 62.5) },
        fechaConsulta: '',
      })
    );
    fixture.detectChanges();

    expect(component.data()?.analisis).toEqual({
      solicitudesPendientes: 6,
      solicitudesCompletadas: 2,
      tasaResolucion: 25,
      estadoMasComun: 'EN PROCESO',
    });
    expect(component.fechaConsulta()).not.toBe('');
  });

  it('usa la tasa de resolución de la raíz y aguanta una respuesta sin estados', () => {
    const fechaConsulta = respuesta.fechaConsulta;
    servicio.getEstadoSolicitudes.and.returnValue(of({ totalSolicitudes: 0, tasaResolucion: 12.5, fechaConsulta }));
    fixture.detectChanges();
    expect(component.data()?.analisis?.tasaResolucion).toBe(12.5);
    expect(component.data()?.analisis?.estadoMasComun).toBe('N/A');
    expect(component.estadosData().every((e) => e.cantidad === 0)).toBeTrue();

    servicio.getEstadoSolicitudes.and.returnValue(of({ totalSolicitudes: 0, fechaConsulta }));
    component.actualizarDatos();
    expect(component.data()?.analisis?.tasaResolucion).toBe(0);
  });

  it('envía los filtros válidos y marca error si falla', () => {
    fixture.componentRef.setInput('periodoAcademico', '2026-2');
    fixture.componentRef.setInput('idPrograma', 1);
    servicio.getEstadoSolicitudes.and.returnValue(throwError(() => new Error('500')));
    fixture.detectChanges();
    expect(servicio.getEstadoSolicitudes).toHaveBeenCalledWith({ periodoAcademico: '2026-2', idPrograma: 1 });
    expect(component.error()).toBeTrue();
    expect(component.loading()).toBeFalse();
  });

  it('traduce los iconos de FontAwesome a Material y formatea porcentajes', () => {
    expect(component.getIconName('fas fa-paper-plane')).toBe('send');
    expect(component.getIconName('fas fa-clock')).toBe('schedule');
    expect(component.getIconName('check_circle')).toBe('check_circle');
    expect(component.getIconName('')).toBe('help_outline');
    expect(component.formatPorcentaje(39.34)).toBe('39.3%');
    expect(component.formatPorcentaje(50)).toBe('50.0%');
  });
});
