import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { EstadisticasService } from '@core/services/estadisticas.service';
import { SnackbarService } from '@core/services/snackbar.service';
import { TendenciasComparativasResponse } from '@core/models/estadisticas/tendencias.model';
import { TendenciasComparativasComponent } from './tendencias-comparativas.component';

describe('TendenciasComparativasComponent', () => {
  let fixture: ComponentFixture<TendenciasComparativasComponent>;
  let component: TendenciasComparativasComponent;
  let servicio: jasmine.SpyObj<EstadisticasService>;
  let snackbar: jasmine.SpyObj<SnackbarService>;

  const respuesta: TendenciasComparativasResponse = {
    fechaConsulta: '2026-11-20T10:00:00.000+00:00',
    descripcion: 'Tendencias y comparativas',
    crecimientoTemporal: {
      tendencia: 'Creciente',
      crecimientoSolicitudes: 12.5,
      crecimientoEstudiantes: 4,
      mesesAnalizados: 6,
      solicitudesPorMes: { Enero: 3, Febrero: 5 },
    },
    comparativaProcesos: {
      procesoMasDemandado: 'Reingreso',
      procesoMasEficiente: 'Homologacion',
      eficienciaMasAlta: 75,
      demandaMasAlta: 10,
      solicitudesPorProceso: { Reingreso: 10, Homologacion: 4 },
      aprobadasPorProceso: { Reingreso: 5, Homologacion: 3 },
    },
    comparativaProgramas: {
      programaMasActivo: 'Ingeniería de Sistemas',
      programaConMasEstudiantes: 'Ingeniería de Sistemas',
      maxSolicitudes: 9,
      maxEstudiantes: 20,
      solicitudesPorPrograma: { 'Ingeniería de Sistemas': 9 },
      estudiantesPorPrograma: { 'Ingeniería de Sistemas': 20 },
    },
    resumenEstrategico: {
      totalSolicitudes: 14,
      totalEstudiantes: 20,
      totalProgramas: 4,
      periodoAnalizado: '2026-2',
      recomendacionEstrategica: 'Reforzar reingreso',
    },
  };

  beforeEach(() => {
    servicio = jasmine.createSpyObj<EstadisticasService>('EstadisticasService', ['getTendenciasComparativas']);
    snackbar = jasmine.createSpyObj<SnackbarService>('SnackbarService', ['exito', 'error']);
    servicio.getTendenciasComparativas.and.returnValue(of(respuesta));
    TestBed.configureTestingModule({
      imports: [TendenciasComparativasComponent, NoopAnimationsModule],
      providers: [
        { provide: EstadisticasService, useValue: servicio },
        { provide: SnackbarService, useValue: snackbar },
      ],
    });
    fixture = TestBed.createComponent(TendenciasComparativasComponent);
    component = fixture.componentInstance;
  });

  it('carga las tendencias, las pinta y avisa', () => {
    fixture.detectChanges();
    expect(servicio.getTendenciasComparativas).toHaveBeenCalledWith({});
    expect(component.data()).toBe(respuesta);
    expect(component.loading()).toBeFalse();
    expect(snackbar.exito).toHaveBeenCalledWith('Tendencias y comparativas cargadas correctamente');
    expect(fixture.nativeElement.textContent).toContain('Reforzar reingreso');
    fixture.destroy();
  });

  it('envía los filtros válidos y muestra el error si falla', () => {
    servicio.getTendenciasComparativas.and.returnValue(throwError(() => new Error('500')));
    fixture.componentRef.setInput('periodoAcademico', ' 2026-1 ');
    fixture.componentRef.setInput('idPrograma', -1);
    fixture.detectChanges();
    expect(servicio.getTendenciasComparativas).toHaveBeenCalledWith({ periodoAcademico: '2026-1' });
    expect(component.error()).toBeTrue();
    expect(snackbar.error).toHaveBeenCalledWith('Error al cargar tendencias y comparativas');
  });

  it('da color e icono por tendencia, sin importar mayúsculas', () => {
    expect(component.getTendenciaColor('Creciente')).toBe('#10b981');
    expect(component.getTendenciaColor('DECRECIENTE')).toBe('#ef4444');
    expect(component.getTendenciaColor('estable')).toBe('#3b82f6');
    expect(component.getTendenciaColor('otra')).toBe('#6b7280');
    expect(component.getTendenciaIcon('creciente')).toBe('trending_up');
    expect(component.getTendenciaIcon('Decreciente')).toBe('trending_down');
    expect(component.getTendenciaIcon('Estable')).toBe('trending_flat');
    expect(component.getTendenciaIcon('')).toBe('help_outline');
  });

  it('formatea porcentajes y lista claves de objetos', () => {
    expect(component.formatPorcentaje(52.46)).toBe('52.5%');
    expect(component.getObjectKeys({ a: 1, b: 2 })).toEqual(['a', 'b']);
    expect(component.getObjectKeys(null)).toEqual([]);
    expect(component.getObjectKeys(undefined)).toEqual([]);
  });
});
