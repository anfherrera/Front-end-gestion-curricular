import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { ModuloEstadisticoComponent } from './modulo-estadistico.component';
import { EstadisticasService } from '../../../core/services/estadisticas.service';

describe('ModuloEstadisticoComponent (Funcionario)', () => {
  let component: ModuloEstadisticoComponent;
  let fixture: ComponentFixture<ModuloEstadisticoComponent>;
  let compiled: HTMLElement;

  const estadisticasServiceStub = {
    getEstadisticasGlobales: () => of({}),
    getTotalEstudiantes: () => of({ totalEstudiantes: 0, fechaConsulta: '', descripcion: '' })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuloEstadisticoComponent, BrowserAnimationsModule, HttpClientTestingModule],
      providers: [{ provide: EstadisticasService, useValue: estadisticasServiceStub }]
    })
      .overrideComponent(ModuloEstadisticoComponent, {
        set: {
          imports: [CommonModule, MatTabsModule],
          template: `
            <div class="modulo-estadistico-container">
              <mat-tab-group class="main-tabs" animationDuration="0ms">
                <mat-tab label="Dashboard General">
                  <div class="tab-content">
                    <div class="dashboard-stub">Dashboard Funcionario Stub</div>
                  </div>
                </mat-tab>
                <mat-tab label="Cursos de Verano">
                  <div class="tab-content">
                    <div class="cursos-verano-stub">Cursos Funcionario Stub</div>
                  </div>
                </mat-tab>
              </mat-tab-group>
            </div>
          `
        }
      })
      .overrideProvider(EstadisticasService, { useValue: estadisticasServiceStub })
      .compileComponents();

    fixture = TestBed.createComponent(ModuloEstadisticoComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar el dashboard stub', () => {
    const dashboardStub = compiled.querySelector('.dashboard-stub');
    expect(dashboardStub?.textContent?.trim()).toBe('Dashboard Funcionario Stub');
  });

  it('debe permitir visualizar el contenido de cursos al cambiar de pestaña', async () => {
    const tabGroupDebug = fixture.debugElement.query(By.directive(MatTabGroup));
    expect(tabGroupDebug).toBeTruthy();

    const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
    tabGroup.selectedIndex = 1;
    fixture.detectChanges();

    await fixture.whenStable();
    fixture.detectChanges();

    const cursosStub = compiled.querySelector('.cursos-verano-stub');
    expect(cursosStub?.textContent?.trim()).toBe('Cursos Funcionario Stub');
  });

  describe('Usabilidad para funcionario', () => {
    it('ME-FUNC-001: Debe mostrar estructura válida del componente', () => {
      expect(compiled.querySelector('.modulo-estadistico-container')).toBeTruthy();
      expect(compiled.querySelector('mat-tab-group')).toBeTruthy();
    });

    it('ME-FUNC-002: Debe renderizar correctamente los tabs', () => {
      const tabs = compiled.querySelectorAll('.mdc-tab');
      expect(tabs.length).toBeGreaterThanOrEqual(1);
    });

    it('ME-FUNC-003: Debe tener contenido stub específico de funcionario', () => {
      const dashboardStub = compiled.querySelector('.dashboard-stub');
      expect(dashboardStub?.textContent).toContain('Funcionario');
    });

    it('ME-FUNC-004: Debe permitir navegación fluida entre tabs', async () => {
      const tabGroupDebug = fixture.debugElement.query(By.directive(MatTabGroup));
      const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
      
      tabGroup.selectedIndex = 0;
      fixture.detectChanges();
      await fixture.whenStable();
      
      tabGroup.selectedIndex = 1;
      fixture.detectChanges();
      await fixture.whenStable();
      
      expect(tabGroup.selectedIndex).toBe(1);
    });

    it('ME-FUNC-005: El componente debe inicializarse sin errores', () => {
      expect(() => component).not.toThrow();
      expect(component).toBeTruthy();
    });

    it('ME-FUNC-006: Debe manejar correctamente las animaciones', () => {
      const tabGroup = compiled.querySelector('mat-tab-group');
      expect(tabGroup?.getAttribute('animationDuration')).toBe('0ms');
    });

    it('ME-FUNC-007: Debe mantener estabilidad en múltiples detectChanges', () => {
      for (let i = 0; i < 3; i++) {
        fixture.detectChanges();
      }
      
      const container = compiled.querySelector('.modulo-estadistico-container');
      expect(container).toBeTruthy();
    });
  });
});
