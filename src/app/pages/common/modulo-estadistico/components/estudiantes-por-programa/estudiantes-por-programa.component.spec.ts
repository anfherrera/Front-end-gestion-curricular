import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { EstadisticasService } from '@core/services/estadisticas.service';
import { EstudiantesPorProgramaResponse } from '@core/models/estadisticas/generales.model';
import { EstudiantesPorProgramaComponent } from './estudiantes-por-programa.component';

describe('EstudiantesPorProgramaComponent', () => {
  let fixture: ComponentFixture<EstudiantesPorProgramaComponent>;
  let component: EstudiantesPorProgramaComponent;
  let servicio: jasmine.SpyObj<EstadisticasService>;

  // Forma de EstudiantesPorPrograma del backend (el front no tipa totalEstudiantes).
  const respuesta: EstudiantesPorProgramaResponse = {
    estudiantesPorPrograma: {
      'Tecnología en Telemática': 10,
      'Ingeniería Electrónica y Telecomunicaciones': 30,
      'Ingeniería de Sistemas': 60,
    },
    fechaConsulta: '2026-11-20T10:00:00.000+00:00',
    descripcion: 'Distribución de estudiantes por programa',
  };

  beforeEach(() => {
    servicio = jasmine.createSpyObj<EstadisticasService>('EstadisticasService', ['getEstudiantesPorPrograma']);
    servicio.getEstudiantesPorPrograma.and.returnValue(of(respuesta));
    TestBed.configureTestingModule({
      imports: [EstudiantesPorProgramaComponent, NoopAnimationsModule],
      providers: [{ provide: EstadisticasService, useValue: servicio }],
    });
    fixture = TestBed.createComponent(EstudiantesPorProgramaComponent);
    component = fixture.componentInstance;
  });

  it('al iniciar carga los datos, los ordena por cantidad y calcula total y porcentajes', () => {
    fixture.detectChanges();

    expect(servicio.getEstudiantesPorPrograma).toHaveBeenCalledWith({});
    expect(component.totalEstudiantes()).toBe(100);
    expect(component.fechaConsulta()).toBe(respuesta.fechaConsulta);
    expect(component.loading()).toBeFalse();
    expect(component.programasData().map((p) => [p.cantidad, p.porcentaje])).toEqual([
      [60, 60],
      [30, 30],
      [10, 10],
    ]);
    // Los nombres de más de 30 caracteres se recortan a 27 más "...".
    expect(component.programasData()[1].nombre).toBe('Ingeniería Electrónica y Te...');
    expect(component.programasData()[0].nombre).toBe('Ingeniería de Sistemas');
  });

  it('envía solo los filtros válidos', () => {
    fixture.componentRef.setInput('periodoAcademico', ' 2026-1 ');
    fixture.componentRef.setInput('idPrograma', 2);
    fixture.detectChanges();
    expect(servicio.getEstudiantesPorPrograma).toHaveBeenCalledWith({ periodoAcademico: '2026-1', idPrograma: 2 });

    servicio.getEstudiantesPorPrograma.calls.reset();
    fixture.componentRef.setInput('periodoAcademico', 'todos');
    fixture.componentRef.setInput('idPrograma', 0);
    fixture.detectChanges();
    expect(servicio.getEstudiantesPorPrograma).toHaveBeenCalledWith({});
  });

  it('sin estudiantes los porcentajes quedan en 0', () => {
    servicio.getEstudiantesPorPrograma.and.returnValue(
      of({ ...respuesta, estudiantesPorPrograma: { 'Ingeniería de Sistemas': 0 } })
    );
    fixture.detectChanges();
    expect(component.totalEstudiantes()).toBe(0);
    expect(component.programasData()[0].porcentaje).toBe(0);
  });

  it('muestra un error si la consulta falla', () => {
    servicio.getEstudiantesPorPrograma.and.returnValue(throwError(() => new Error('500')));
    fixture.detectChanges();
    expect(component.error()).toBe('Error al cargar datos de estudiantes por programa');
    expect(component.loading()).toBeFalse();
  });

  it('con autoLoad en false no carga nada', () => {
    fixture.componentRef.setInput('autoLoad', false);
    fixture.detectChanges();
    expect(servicio.getEstudiantesPorPrograma).not.toHaveBeenCalled();
    fixture.destroy();
  });
});
