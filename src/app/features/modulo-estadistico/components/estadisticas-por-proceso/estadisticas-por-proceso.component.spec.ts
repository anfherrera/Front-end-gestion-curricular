import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { EstadisticasService } from '@features/modulo-estadistico/services/estadisticas.service';
import { EstadisticasPorProcesoResponse, ProcesoDetallado } from '@features/modulo-estadistico/models/generales.model';
import { EstadisticasPorProcesoComponent } from './estadisticas-por-proceso.component';

describe('EstadisticasPorProcesoComponent', () => {
  let fixture: ComponentFixture<EstadisticasPorProcesoComponent>;
  let component: EstadisticasPorProcesoComponent;
  let servicio: jasmine.SpyObj<EstadisticasService>;

  // Claves y campos como VistaPorProceso del backend (PROCESOS_DASHBOARD).
  const detalle = (proceso: string, total: number, aprobadas: number): ProcesoDetallado => ({
    proceso,
    totalSolicitudes: total,
    aprobadas,
    rechazadas: 1,
    enProceso: 0,
    enviadas: total - aprobadas - 1,
    eficiencia: total ? (aprobadas / total) * 100 : 0,
    tiempoPromedio: 2.5,
  });
  const respuesta: EstadisticasPorProcesoResponse = {
    estadisticasPorProceso: {
      Homologacion: detalle('Homologacion', 4, 2),
      Reingreso: detalle('Reingreso', 10, 5),
      ECAES: detalle('ECAES', 0, 0),
    },
    fechaConsulta: '2026-11-20T10:00:00.000+00:00',
    descripcion: 'Estadísticas detalladas por tipo de proceso',
  };

  beforeEach(() => {
    servicio = jasmine.createSpyObj<EstadisticasService>('EstadisticasService', [
      'getEstadisticasDetalladasPorProceso',
    ]);
    servicio.getEstadisticasDetalladasPorProceso.and.returnValue(of(respuesta));
    TestBed.configureTestingModule({
      imports: [EstadisticasPorProcesoComponent, NoopAnimationsModule],
      providers: [{ provide: EstadisticasService, useValue: servicio }],
    });
    fixture = TestBed.createComponent(EstadisticasPorProcesoComponent);
    component = fixture.componentInstance;
  });

  it('carga los procesos ordenados por total con su porcentaje de aprobación', () => {
    fixture.detectChanges();

    expect(servicio.getEstadisticasDetalladasPorProceso).toHaveBeenCalledWith({});
    const procesos = component.procesosData();
    expect(procesos.map((p) => p.nombre)).toEqual(['Reingreso', 'Homologacion', 'ECAES']);
    expect(procesos.map((p) => p.porcentajeAprobacion)).toEqual([50, 50, 0]);
    expect(procesos[0].nombreFormateado).toBe('Reingreso de Estudiante');
    expect(procesos[1].nombreFormateado).toBe('Homologación de Asignaturas');
    expect(procesos[2].nombreFormateado).toBe('Pruebas ECAES');
    expect(component.fechaConsulta()).toBe(respuesta.fechaConsulta);
  });

  it('pone 0 en los conteos que faltan', () => {
    servicio.getEstadisticasDetalladasPorProceso.and.returnValue(
      of({ ...respuesta, estadisticasPorProceso: { Reingreso: { proceso: 'Reingreso' } as ProcesoDetallado } })
    );
    fixture.detectChanges();
    const [p] = component.procesosData();
    expect([p.totalSolicitudes, p.aprobadas, p.rechazadas, p.enProceso, p.enviadas, p.porcentajeAprobacion]).toEqual([
      0, 0, 0, 0, 0, 0,
    ]);
  });

  it('envía solo los filtros válidos', () => {
    fixture.componentRef.setInput('periodoAcademico', '2025-2');
    fixture.componentRef.setInput('idPrograma', 3);
    fixture.detectChanges();
    expect(servicio.getEstadisticasDetalladasPorProceso).toHaveBeenCalledWith({
      periodoAcademico: '2025-2',
      idPrograma: 3,
    });

    servicio.getEstadisticasDetalladasPorProceso.calls.reset();
    fixture.componentRef.setInput('periodoAcademico', ' ');
    fixture.componentRef.setInput('idPrograma', NaN);
    fixture.detectChanges();
    expect(servicio.getEstadisticasDetalladasPorProceso).toHaveBeenCalledWith({});
  });

  it('muestra un error si la consulta falla y no carga con autoLoad en false', () => {
    servicio.getEstadisticasDetalladasPorProceso.and.returnValue(throwError(() => new Error('500')));
    fixture.detectChanges();
    expect(component.error()).toBe('Error al cargar estadísticas por proceso');
    expect(component.loading()).toBeFalse();

    const otro = TestBed.createComponent(EstadisticasPorProcesoComponent);
    servicio.getEstadisticasDetalladasPorProceso.calls.reset();
    otro.componentRef.setInput('autoLoad', false);
    otro.detectChanges();
    expect(servicio.getEstadisticasDetalladasPorProceso).not.toHaveBeenCalled();
  });

  it('da clase e icono a cada clave del backend (TipoProcesoSolicitud)', () => {
    const claves = ['Homologacion', 'Paz y Salvo', 'Reingreso', 'Cursos de Verano', 'ECAES'];
    expect(claves.map((c) => component.getProcesoClass(c))).toEqual([
      'homologacion',
      'paz',
      'reingreso',
      'cursos',
      'ecaes',
    ]);
    expect(claves.map((c) => component.getProcesoIcon(c))).toEqual([
      'swap_horiz',
      'verified',
      'person_add',
      'school',
      'quiz',
    ]);
  });

  it('ignora tildes y mayúsculas y usa valores por defecto para un proceso desconocido', () => {
    expect(component.getProcesoClass('Homologación')).toBe('homologacion');
    expect(component.getProcesoIcon('PAZ Y SALVO')).toBe('verified');
    expect(component.getProcesoClass('Otro')).toBe('default');
    expect(component.getProcesoIcon('Otro')).toBe('description');
  });

  it('pinta cada tarjeta con la clase e icono de su proceso', () => {
    servicio.getEstadisticasDetalladasPorProceso.and.returnValue(
      of({
        ...respuesta,
        estadisticasPorProceso: {
          'Paz y Salvo': detalle('Paz y Salvo', 3, 1),
          'Cursos de Verano': detalle('Cursos de Verano', 2, 1),
        },
      })
    );
    fixture.detectChanges();
    const tarjetas = [...fixture.nativeElement.querySelectorAll('.proceso-card')] as HTMLElement[];
    expect(tarjetas[0].classList).toContain('proceso-paz');
    expect(tarjetas[1].classList).toContain('proceso-cursos');
    expect(tarjetas.map((t) => t.querySelector('.proceso-icon mat-icon')?.textContent?.trim())).toEqual([
      'verified',
      'school',
    ]);
  });

  it('muestra hasta 5 campos del detalle y alterna la vista de datos', () => {
    expect(component.getDatosKeys(detalle('Reingreso', 3, 1))).toEqual([
      'proceso',
      'totalSolicitudes',
      'aprobadas',
      'rechazadas',
      'enProceso',
    ]);
    expect(component.mostrarDatosRaw).toBeFalse();
    component.toggleDatosRaw();
    expect(component.mostrarDatosRaw).toBeTrue();
  });
});
