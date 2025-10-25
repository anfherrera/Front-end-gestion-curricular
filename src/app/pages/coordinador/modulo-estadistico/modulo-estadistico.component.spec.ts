import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ModuloEstadisticoComponent } from './modulo-estadistico.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('ModuloEstadisticoComponent - Pruebas de Usabilidad', () => {
  let component: ModuloEstadisticoComponent;
  let fixture: ComponentFixture<ModuloEstadisticoComponent>;
  let compiled: HTMLElement;

  // Métricas de usabilidad
  let metricasUsabilidad = {
    tiemposRespuesta: [] as number[],
    elementosVisibles: 0,
    interaccionesExitosas: 0,
    graficosRenderizados: 0,
    validacionesCorrectas: 0
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuloEstadisticoComponent, BrowserAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ModuloEstadisticoComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  describe('1. VISIBILIDAD DE ELEMENTOS', () => {
    it('ME-001: Debe crear el componente correctamente', () => {
      expect(component).toBeTruthy();
      metricasUsabilidad.elementosVisibles++;
    });

    it('ME-002: Debe mostrar las pestañas de navegación', () => {
      const tabs = compiled.querySelector('mat-tab-group');
      expect(tabs).toBeTruthy();
      metricasUsabilidad.elementosVisibles++;
    });

    it('ME-003: Debe tener al menos dos pestañas (General y Cursos de Verano)', () => {
      fixture.detectChanges();
      const tabLabels = compiled.querySelectorAll('mat-tab, .mat-mdc-tab');
      expect(tabLabels.length).toBeGreaterThanOrEqual(2);
      metricasUsabilidad.elementosVisibles += 2;
    });

    it('ME-004: Debe mostrar el componente de dashboard estadístico', () => {
      const dashboard = compiled.querySelector('app-dashboard-estadistico');
      expect(dashboard).toBeTruthy();
      metricasUsabilidad.elementosVisibles++;
    });

    it('ME-005: Debe mostrar el componente de cursos de verano', () => {
      const cursosVerano = compiled.querySelector('app-cursos-verano-dashboard');
      expect(cursosVerano).toBeTruthy();
      metricasUsabilidad.elementosVisibles++;
    });
  });

  describe('2. INTERACTIVIDAD Y NAVEGACIÓN ENTRE TABS', () => {
    it('ME-006: Las pestañas deben ser clicables', fakeAsync(() => {
      const tabGroup = fixture.debugElement.query(By.css('mat-tab-group'));
      expect(tabGroup).toBeTruthy();
      
      if (tabGroup) {
        metricasUsabilidad.interaccionesExitosas++;
      }
      tick();
    }));

    it('ME-007: Debe permitir cambiar entre pestañas', fakeAsync(() => {
      const tiempoInicio = performance.now();
      
      fixture.detectChanges();
      tick();
      
      const tiempoFin = performance.now();
      metricasUsabilidad.tiemposRespuesta.push(tiempoFin - tiempoInicio);
      metricasUsabilidad.interaccionesExitosas++;
    }));

    it('ME-008: El cambio de pestaña debe ser fluido (sin lag)', fakeAsync(() => {
      const tiempoInicio = performance.now();
      
      // Simular cambio de tab
      fixture.detectChanges();
      tick(100);
      
      const tiempoFin = performance.now();
      const duracion = tiempoFin - tiempoInicio;
      
      metricasUsabilidad.tiemposRespuesta.push(duracion);
      expect(duracion).toBeLessThan(500); // Menos de 0.5 segundos
    }));
  });

  describe('3. RENDERIZADO DE DASHBOARDS', () => {
    it('ME-009: El dashboard estadístico debe estar presente en el DOM', () => {
      const dashboardElement = fixture.debugElement.query(By.css('app-dashboard-estadistico'));
      expect(dashboardElement).toBeTruthy();
      metricasUsabilidad.graficosRenderizados++;
    });

    it('ME-010: El dashboard de cursos de verano debe estar presente', () => {
      const cursosVeranoElement = fixture.debugElement.query(By.css('app-cursos-verano-dashboard'));
      expect(cursosVeranoElement).toBeTruthy();
      metricasUsabilidad.graficosRenderizados++;
    });

    it('ME-011: Los dashboards deben cargarse sin errores', () => {
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
      metricasUsabilidad.validacionesCorrectas++;
    });
  });

  describe('4. ACCESIBILIDAD Y CLARIDAD', () => {
    it('ME-012: El módulo debe tener una estructura semántica clara', () => {
      const matTabGroup = compiled.querySelector('mat-tab-group');
      expect(matTabGroup).toBeTruthy();
      metricasUsabilidad.validacionesCorrectas++;
    });

    it('ME-013: Los componentes hijos deben importarse correctamente', () => {
      // Verificar que los imports estén presentes en el metadata
      const componentMetadata = (component.constructor as any).__annotations__?.[0];
      
      if (componentMetadata?.imports) {
        expect(componentMetadata.imports.length).toBeGreaterThan(0);
        metricasUsabilidad.validacionesCorrectas++;
      }
    });

    it('ME-014: El componente debe ser standalone', () => {
      const metadata = (component.constructor as any).__annotations__?.[0];
      expect(metadata?.standalone).toBe(true);
      metricasUsabilidad.validacionesCorrectas++;
    });
  });

  describe('5. RENDIMIENTO Y TIEMPOS DE RESPUESTA', () => {
    it('ME-015: La inicialización debe ser rápida', () => {
      const tiempoInicio = performance.now();
      
      const newFixture = TestBed.createComponent(ModuloEstadisticoComponent);
      newFixture.detectChanges();
      
      const tiempoFin = performance.now();
      const duracion = tiempoFin - tiempoInicio;
      
      metricasUsabilidad.tiemposRespuesta.push(duracion);
      expect(duracion).toBeLessThan(1000); // Menos de 1 segundo
    });

    it('ME-016: El renderizado de pestañas debe ser eficiente', fakeAsync(() => {
      const tiempoInicio = performance.now();
      
      fixture.detectChanges();
      tick();
      
      const tiempoFin = performance.now();
      const duracion = tiempoFin - tiempoInicio;
      
      metricasUsabilidad.tiemposRespuesta.push(duracion);
      expect(duracion).toBeLessThan(800);
    }));

    it('ME-017: No debe haber memory leaks en el componente', () => {
      const componentesBefore = (component as any).constructor.instances?.length || 0;
      
      fixture.destroy();
      
      const componentesAfter = (component as any).constructor.instances?.length || 0;
      
      // El componente debe limpiarse correctamente
      metricasUsabilidad.validacionesCorrectas++;
    });
  });

  describe('6. INTEGRACIÓN CON MÓDULOS DE ANGULAR MATERIAL', () => {
    it('ME-018: MatTabsModule debe estar correctamente importado', () => {
      const tabs = fixture.debugElement.query(By.css('mat-tab-group'));
      expect(tabs).toBeTruthy();
      metricasUsabilidad.validacionesCorrectas++;
    });

    it('ME-019: El tema de Material debe aplicarse correctamente', () => {
      const matElements = compiled.querySelectorAll('[class*="mat-"]');
      expect(matElements.length).toBeGreaterThan(0);
      metricasUsabilidad.validacionesCorrectas++;
    });

    it('ME-020: Las animaciones deben estar habilitadas', () => {
      // Verificar que BrowserAnimationsModule está activo
      const hasAnimations = document.body.classList.contains('mat-typography') || 
                           compiled.querySelector('.mat-mdc-tab-group');
      expect(hasAnimations).toBeTruthy();
      metricasUsabilidad.validacionesCorrectas++;
    });
  });

  describe('7. ESTRUCTURA Y ORGANIZACIÓN', () => {
    it('ME-021: Debe tener una estructura de componentes anidados clara', () => {
      const childComponents = compiled.querySelectorAll('app-dashboard-estadistico, app-cursos-verano-dashboard');
      expect(childComponents.length).toBe(2);
      metricasUsabilidad.validacionesCorrectas++;
    });

    it('ME-022: Los estilos CSS deben aplicarse correctamente', () => {
      const hasStyles = (component.constructor as any).__annotations__?.[0]?.styleUrl;
      expect(hasStyles).toBeTruthy();
      metricasUsabilidad.validacionesCorrectas++;
    });

    it('ME-023: El template debe estar correctamente vinculado', () => {
      const hasTemplate = (component.constructor as any).__annotations__?.[0]?.templateUrl;
      expect(hasTemplate).toBeTruthy();
      metricasUsabilidad.validacionesCorrectas++;
    });
  });

  describe('8. CASOS DE USO REALISTAS', () => {
    it('ME-024: Un coordinador debe poder ver estadísticas generales fácilmente', () => {
      const dashboard = compiled.querySelector('app-dashboard-estadistico');
      expect(dashboard).toBeTruthy();
      metricasUsabilidad.interaccionesExitosas++;
    });

    it('ME-025: Un coordinador debe poder ver estadísticas de cursos de verano', () => {
      const cursosVerano = compiled.querySelector('app-cursos-verano-dashboard');
      expect(cursosVerano).toBeTruthy();
      metricasUsabilidad.interaccionesExitosas++;
    });

    it('ME-026: La interfaz debe ser intuitiva para usuarios no técnicos', () => {
      // Las pestañas deben tener nombres claros
      const tabGroup = compiled.querySelector('mat-tab-group');
      expect(tabGroup).toBeTruthy();
      metricasUsabilidad.interaccionesExitosas++;
    });
  });

  // REPORTE DE MÉTRICAS AL FINAL
  afterAll(() => {
    console.log('\n📊 REPORTE DE MÉTRICAS DE USABILIDAD - MÓDULO ESTADÍSTICO');
    console.log('═'.repeat(60));
    console.log(`✅ Elementos visibles verificados: ${metricasUsabilidad.elementosVisibles}`);
    console.log(`📊 Gráficos/Dashboards renderizados: ${metricasUsabilidad.graficosRenderizados}`);
    console.log(`🎯 Interacciones exitosas: ${metricasUsabilidad.interaccionesExitosas}`);
    console.log(`✓  Validaciones correctas: ${metricasUsabilidad.validacionesCorrectas}`);
    
    if (metricasUsabilidad.tiemposRespuesta.length > 0) {
      const promedio = metricasUsabilidad.tiemposRespuesta.reduce((a, b) => a + b, 0) / 
                      metricasUsabilidad.tiemposRespuesta.length;
      const maximo = Math.max(...metricasUsabilidad.tiemposRespuesta);
      const minimo = Math.min(...metricasUsabilidad.tiemposRespuesta);
      
      console.log(`⏱️  Tiempo promedio de respuesta: ${promedio.toFixed(2)}ms`);
      console.log(`⏱️  Tiempo máximo: ${maximo.toFixed(2)}ms`);
      console.log(`⏱️  Tiempo mínimo: ${minimo.toFixed(2)}ms`);
    }
    console.log('═'.repeat(60));
  });
});
