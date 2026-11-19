import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NEVER, Subject, of } from 'rxjs';

import { DashboardEstadisticoComponent } from './dashboard-estadistico.component';
import { EstadisticasService } from '@core/services/estadisticas.service';
import { PeriodosAcademicosService } from '@core/services/periodos-academicos.service';

describe('DashboardEstadisticoComponent (exportar)', () => {
  let component: DashboardEstadisticoComponent;
  let respuestaPdf: Subject<Blob>;
  let respuestaExcel: Subject<Blob>;

  beforeEach(async () => {
    respuestaPdf = new Subject<Blob>();
    respuestaExcel = new Subject<Blob>();
    const estadisticas = {
      getProcesosDisponibles: () => [],
      getProgramasDisponibles: () => of([]),
      // La carga inicial no termina: cada prueba fija `loading` a mano
      getIdsProgramaPorNombre: () => NEVER,
      getTotalEstudiantes: () => NEVER,
      exportarPDF: () => respuestaPdf,
      exportarExcel: () => respuestaExcel
    };

    await TestBed.configureTestingModule({
      imports: [DashboardEstadisticoComponent],
      providers: [
        { provide: EstadisticasService, useValue: estadisticas },
        { provide: PeriodosAcademicosService, useValue: jasmine.createSpyObj('PeriodosAcademicosService', ['getValoresPeriodos']) },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj('MatSnackBar', ['open']) }
      ]
    })
      // Solo se prueba la lógica de exportar: sin plantilla ni gráficos
      .overrideComponent(DashboardEstadisticoComponent, { set: { template: '' } })
      .compileComponents();

    const fixture = TestBed.createComponent(DashboardEstadisticoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.loading.set(false);
    // descargarBlob crea un enlace y lo pulsa: se evita la descarga real
    spyOn(HTMLAnchorElement.prototype, 'click');
  });

  it('exportar a PDF no pone loading (que quitaría los <canvas>), solo exportando mientras dura', () => {
    component.exportarPDF();
    expect(component.loading()).toBeFalse();
    expect(component.exportando()).toBeTrue();

    respuestaPdf.next(new Blob(['%PDF']));
    expect(component.exportando()).toBeFalse();
    expect(component.loading()).toBeFalse();
  });

  it('si falla la exportación a Excel, exportando vuelve a false y loading no cambia', () => {
    component.exportarExcel();
    expect(component.exportando()).toBeTrue();

    respuestaExcel.error(new HttpErrorResponse({ status: 500 }));
    expect(component.exportando()).toBeFalse();
    expect(component.loading()).toBeFalse();
  });
});
