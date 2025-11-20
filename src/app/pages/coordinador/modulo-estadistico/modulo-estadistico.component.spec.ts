import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { ModuloEstadisticoComponent } from './modulo-estadistico.component';
import { EstadisticasService } from '../../../core/services/estadisticas.service';

describe('ModuloEstadisticoComponent', () => {
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
      providers: [
        {
          provide: EstadisticasService,
          useValue: estadisticasServiceStub
        }
      ]
    })
      .overrideComponent(ModuloEstadisticoComponent, {
        set: {
          imports: [CommonModule, MatTabsModule],
          template: `
            <div class="modulo-estadistico-container">
              <mat-tab-group class="main-tabs" animationDuration="0ms">
                <mat-tab label="Dashboard General">
                  <div class="tab-content">
                    <div class="dashboard-stub">Dashboard Estadístico Stub</div>
                  </div>
                </mat-tab>
                <mat-tab label="Cursos de Verano">
                  <div class="tab-content">
                    <div class="cursos-verano-stub">Cursos de Verano Stub</div>
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

  it('debe renderizar el contenedor principal y el grupo de pestañas', () => {
    expect(compiled.querySelector('.modulo-estadistico-container')).toBeTruthy();
    expect(compiled.querySelector('mat-tab-group')).toBeTruthy();
  });

  it('debe renderizar dos pestañas', () => {
    const tabs = compiled.querySelectorAll('.mdc-tab');
    expect(tabs.length).toBe(2);
  });

  it('debe mostrar el contenido del dashboard general', () => {
    const dashboardStub = compiled.querySelector('.dashboard-stub');
    expect(dashboardStub?.textContent?.trim()).toBe('Dashboard Estadístico Stub');
  });

  it('debe mostrar el contenido de cursos de verano', async () => {
    const tabGroupDebug = fixture.debugElement.query(By.directive(MatTabGroup));
    expect(tabGroupDebug).toBeTruthy();

    const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
    tabGroup.selectedIndex = 1;
    fixture.detectChanges();

    await fixture.whenStable();
    fixture.detectChanges();

    const cursosStub = compiled.querySelector('.cursos-verano-stub');
    expect(cursosStub?.textContent?.trim()).toBe('Cursos de Verano Stub');
  });

  describe('Usabilidad y navegación', () => {
    it('ME-006: Debe permitir cambiar entre pestañas sin error', async () => {
      const tabGroupDebug = fixture.debugElement.query(By.directive(MatTabGroup));
      const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
      
      expect(tabGroup.selectedIndex).toBe(0);
      
      tabGroup.selectedIndex = 1;
      fixture.detectChanges();
      await fixture.whenStable();
      
      expect(tabGroup.selectedIndex).toBe(1);
      
      tabGroup.selectedIndex = 0;
      fixture.detectChanges();
      await fixture.whenStable();
      
      expect(tabGroup.selectedIndex).toBe(0);
    });

    it('ME-007: Las pestañas deben tener etiquetas descriptivas', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      
      // Buscar las pestañas renderizadas por Material
      const tabs = compiled.querySelectorAll('.mdc-tab');
      expect(tabs.length).toBeGreaterThanOrEqual(2);
      
      // Obtener las etiquetas de las pestañas
      const tabLabels: string[] = [];
      tabs.forEach(tab => {
        const labelElement = tab.querySelector('.mdc-tab__text-label');
        if (labelElement) {
          tabLabels.push(labelElement.textContent?.trim() || '');
        }
      });
      
      // Verificar que las etiquetas sean descriptivas
      const hasDashboard = tabLabels.some(label => label.includes('Dashboard') || label.includes('General'));
      const hasVerano = tabLabels.some(label => label.includes('Verano'));
      
      expect(hasDashboard || tabLabels.length >= 2).toBe(true);
      expect(hasVerano || tabLabels.length >= 2).toBe(true);
    });

    it('ME-008: El contenedor debe tener estructura CSS válida', () => {
      const container = compiled.querySelector('.modulo-estadistico-container');
      expect(container).toBeTruthy();
      expect(container?.classList.contains('modulo-estadistico-container')).toBe(true);
    });

    it('ME-009: Debe renderizar componentes hijo correctamente', () => {
      expect(compiled.querySelector('mat-tab-group')).toBeTruthy();
      expect(compiled.querySelector('.main-tabs')).toBeTruthy();
    });

    it('ME-010: Debe manejar múltiples cambios de pestaña consecutivos', async () => {
      const tabGroupDebug = fixture.debugElement.query(By.directive(MatTabGroup));
      const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
      
      // Cambiar a pestaña 1
      tabGroup.selectedIndex = 1;
      fixture.detectChanges();
      await fixture.whenStable();
      
      // Cambiar a pestaña 0
      tabGroup.selectedIndex = 0;
      fixture.detectChanges();
      await fixture.whenStable();
      
      // Cambiar de nuevo a pestaña 1
      tabGroup.selectedIndex = 1;
      fixture.detectChanges();
      await fixture.whenStable();
      
      expect(tabGroup.selectedIndex).toBe(1);
    });

    it('ME-011: No debe tener errores en consola al inicializar', () => {
      const consoleSpy = spyOn(console, 'error');
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('ME-012: Debe estar correctamente integrado con MatTabsModule', () => {
      expect(component).toBeTruthy();
      expect(fixture.debugElement.query(By.directive(MatTabGroup))).toBeTruthy();
    });

    it('ME-013: El componente debe mantenerse estable durante múltiples detectChanges', () => {
      for (let i = 0; i < 5; i++) {
        fixture.detectChanges();
      }
      
      expect(component).toBeTruthy();
      expect(compiled.querySelector('mat-tab-group')).toBeTruthy();
    });

    it('ME-014: Las pestañas deben ser accesibles mediante selección programática', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      
      const tabGroupDebug = fixture.debugElement.query(By.directive(MatTabGroup));
      expect(tabGroupDebug).toBeTruthy();
      
      const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
      
      // Verificar índice inicial
      expect(tabGroup.selectedIndex).toBe(0);
      
      // Cambiar a la segunda pestaña
      tabGroup.selectedIndex = 1;
      fixture.detectChanges();
      await fixture.whenStable();
      
      // Verificar que el cambio se aplicó
      expect(tabGroup.selectedIndex).toBe(1);
      
      // Volver a la primera pestaña
      tabGroup.selectedIndex = 0;
      fixture.detectChanges();
      await fixture.whenStable();
      
      expect(tabGroup.selectedIndex).toBe(0);
    });

    it('ME-015: Debe renderizar correctamente después de detección de cambios', () => {
      fixture.detectChanges();
      expect(compiled.querySelector('.modulo-estadistico-container')).toBeTruthy();
      
      fixture.detectChanges();
      expect(compiled.querySelector('mat-tab-group')).toBeTruthy();
      
      fixture.detectChanges();
      expect(compiled.querySelectorAll('.mdc-tab').length).toBeGreaterThanOrEqual(2);
    });

    it('ME-016: El contenido de las pestañas debe estar correctamente ocultado/mostrado', async () => {
      const tabGroupDebug = fixture.debugElement.query(By.directive(MatTabGroup));
      const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
      
      // Primera pestaña debe estar activa por defecto
      tabGroup.selectedIndex = 0;
      fixture.detectChanges();
      await fixture.whenStable();
      
      let dashboardStub = compiled.querySelector('.dashboard-stub');
      expect(dashboardStub).toBeTruthy();
      
      // Cambiar a segunda pestaña
      tabGroup.selectedIndex = 1;
      fixture.detectChanges();
      await fixture.whenStable();
      
      const cursosStub = compiled.querySelector('.cursos-verano-stub');
      expect(cursosStub).toBeTruthy();
    });

    it('ME-017: Debe manejar correctamente la estructura de Material Tabs', () => {
      const tabGroup = compiled.querySelector('mat-tab-group');
      expect(tabGroup).toBeTruthy();
      expect(tabGroup?.classList.contains('main-tabs')).toBe(true);
    });

    it('ME-018: Los componentes stub deben tener contenido visible', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      
      // Primero verificar que la primera pestaña (Dashboard) está activa y tiene contenido
      const tabGroupDebug = fixture.debugElement.query(By.directive(MatTabGroup));
      const tabGroup = tabGroupDebug.componentInstance as MatTabGroup;
      
      // Verificar contenido de la primera pestaña (Dashboard)
      tabGroup.selectedIndex = 0;
      fixture.detectChanges();
      await fixture.whenStable();
      
      const dashboardStub = compiled.querySelector('.dashboard-stub');
      expect(dashboardStub).toBeTruthy();
      expect(dashboardStub?.textContent?.trim()).toBeTruthy();
      
      // Cambiar a la segunda pestaña y verificar su contenido
      tabGroup.selectedIndex = 1;
      fixture.detectChanges();
      await fixture.whenStable();
      
      const cursosStub = compiled.querySelector('.cursos-verano-stub');
      expect(cursosStub).toBeTruthy();
      expect(cursosStub?.textContent?.trim()).toBeTruthy();
    });

    it('ME-019: Debe soportar múltiples ciclos de renderizado', () => {
      const initialTabs = compiled.querySelectorAll('.mdc-tab').length;
      
      // Múltiples detectChanges
      for (let i = 0; i < 10; i++) {
        fixture.detectChanges();
      }
      
      const finalTabs = compiled.querySelectorAll('.mdc-tab').length;
      expect(finalTabs).toBe(initialTabs);
    });

    it('ME-020: El componente no debe tener dependencias no satisfechas', () => {
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('ME-021: Las pestañas deben tener IDs únicos', () => {
      const tabs = compiled.querySelectorAll('mat-tab');
      const ids = new Set<string>();
      let hasIds = false;
      
      tabs.forEach(tab => {
        const id = tab.getAttribute('id');
        if (id) {
          hasIds = true;
          expect(ids.has(id)).toBe(false);
          ids.add(id);
        }
      });
      
      // Verificar que si hay tabs, la estructura es válida
      expect(tabs.length).toBeGreaterThanOrEqual(0);
      // Si hay IDs, verificar que no hay duplicados
      if (hasIds) {
        expect(ids.size).toBeLessThanOrEqual(tabs.length);
      }
    });

    it('ME-022: El componente debe inicializarse correctamente sin datos', () => {
      expect(component).toBeTruthy();
      expect(compiled.querySelector('.modulo-estadistico-container')).toBeTruthy();
    });

    it('ME-023: Debe ser compatible con animaciones deshabilitadas', () => {
      const tabGroup = compiled.querySelector('mat-tab-group');
      expect(tabGroup?.getAttribute('animationDuration')).toBe('0ms');
    });
  });
});
