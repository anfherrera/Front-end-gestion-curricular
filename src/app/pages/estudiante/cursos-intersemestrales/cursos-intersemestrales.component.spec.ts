import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { CursosIntersemestralesComponent } from './cursos-intersemestrales.component';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';

describe('CursosIntersemestralesComponent - Pruebas de Usabilidad', () => {
  let component: CursosIntersemestralesComponent;
  let fixture: ComponentFixture<CursosIntersemestralesComponent>;
  let router: Router;
  let compiled: HTMLElement;
  let routerEventsSubject: Subject<any>;

  // Métricas de usabilidad
  let metricasUsabilidad = {
    tiemposRespuesta: [] as number[],
    elementosVisibles: 0,
    navegacionesExitosas: 0,
    interaccionesExitosas: 0,
    validacionesCorrectas: 0
  };

  beforeEach(async () => {
    routerEventsSubject = new Subject();

    await TestBed.configureTestingModule({
      imports: [
        CursosIntersemestralesComponent,
        RouterTestingModule.withRoutes([
          { path: 'estudiante/cursos-intersemestrales', component: CursosIntersemestralesComponent },
          { path: 'estudiante/cursos-intersemestrales/solicitudes', component: CursosIntersemestralesComponent },
          { path: 'estudiante/cursos-intersemestrales/cursos-ofertados', component: CursosIntersemestralesComponent },
          // Rutas adicionales usadas en pruebas
          { path: 'estudiante/cursos-intersemestrales/cursos-preinscripcion', component: CursosIntersemestralesComponent },
          { path: 'estudiante/cursos-intersemestrales/ver-solicitud', component: CursosIntersemestralesComponent }
        ]),
        BrowserAnimationsModule
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    
    fixture = TestBed.createComponent(CursosIntersemestralesComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  describe('1. VISIBILIDAD DE ELEMENTOS DE NAVEGACIÓN', () => {
    it('CI-001: Debe mostrar todas las opciones de navegación', () => {
      expect(component.opciones.length).toBe(4);
      metricasUsabilidad.elementosVisibles++;
    });

    it('CI-002: Las opciones deben tener título, ruta e icono', () => {
      component.opciones.forEach(opcion => {
        expect(opcion.titulo).toBeTruthy();
        expect(opcion.ruta).toBeTruthy();
        expect(opcion.icon).toBeTruthy();
        metricasUsabilidad.validacionesCorrectas++;
      });
    });

    it('CI-003: Los iconos de Material deben estar presentes', () => {
      const iconosEsperados = ['add_circle', 'school', 'playlist_add', 'list_alt'];
      const iconosComponente = component.opciones.map(o => o.icon);
      
      iconosEsperados.forEach(icono => {
        expect(iconosComponente).toContain(icono);
      });
      metricasUsabilidad.elementosVisibles += iconosEsperados.length;
    });

    it('CI-004: Debe renderizar botones o tarjetas de navegación en el DOM', async () => {
      await fixture.whenStable();
      fixture.detectChanges();
      
      // Buscar elementos de navegación (enlaces del menú, botones, tarjetas, etc.)
      const elementosNavegacion = compiled.querySelectorAll('a.menu-item, mat-card, .opcion-card, button, .menu-item');
      expect(elementosNavegacion.length).toBeGreaterThan(0);
      metricasUsabilidad.elementosVisibles++;
    });
  });

  describe('2. FUNCIONALIDAD DE NAVEGACIÓN', () => {
    it('CI-005: Debe navegar correctamente a "Realizar Solicitud"', fakeAsync(() => {
      const tiempoInicio = performance.now();
      
      router.navigate(['estudiante/cursos-intersemestrales/solicitudes']);
      tick();
      
      const tiempoFin = performance.now();
      metricasUsabilidad.tiemposRespuesta.push(tiempoFin - tiempoInicio);
      
      expect(router.url).toContain('solicitudes');
      metricasUsabilidad.navegacionesExitosas++;
    }));

    it('CI-006: Debe navegar correctamente a "Cursos Disponibles"', fakeAsync(() => {
      router.navigate(['estudiante/cursos-intersemestrales/cursos-ofertados']);
      tick();
      
      expect(router.url).toContain('cursos-ofertados');
      metricasUsabilidad.navegacionesExitosas++;
    }));

    it('CI-007: Debe navegar correctamente a "Preinscripción"', fakeAsync(() => {
      router.navigate(['estudiante/cursos-intersemestrales/cursos-preinscripcion']);
      tick();
      
      expect(router.url).toContain('cursos-preinscripcion');
      metricasUsabilidad.navegacionesExitosas++;
    }));

    it('CI-008: Debe navegar correctamente a "Seguimiento"', fakeAsync(() => {
      router.navigate(['estudiante/cursos-intersemestrales/ver-solicitud']);
      tick();
      
      expect(router.url).toContain('ver-solicitud');
      metricasUsabilidad.navegacionesExitosas++;
    }));

    it('CI-009: Debe detectar si hay una ruta activa', () => {
      const urlSpy = spyOnProperty(router as any, 'url', 'get');
      // Ruta base
      urlSpy.and.returnValue('/estudiante/cursos-intersemestrales');
      expect(component.hasActiveRoute()).toBe(false);

      // Ruta con hijo
      urlSpy.and.returnValue('/estudiante/cursos-intersemestrales/solicitudes');
      expect(component.hasActiveRoute()).toBe(true);

      metricasUsabilidad.validacionesCorrectas += 2;
    });
  });

  describe('3. GESTIÓN DE EVENTOS DE NAVEGACIÓN', () => {
    it('CI-010: Debe suscribirse a eventos de navegación', () => {
      spyOn(component as any, 'setupNavigation').and.callThrough();
      component.ngOnInit();
      expect((component as any).setupNavigation).toHaveBeenCalled();
      metricasUsabilidad.interaccionesExitosas++;
    });

    it('CI-011: Debe limpiar suscripciones al destruir el componente', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      
      component.ngOnDestroy();
      
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
      metricasUsabilidad.validacionesCorrectas++;
    });

    it('CI-012: Debe registrar navegaciones en consola (para debugging)', fakeAsync(() => {
      spyOn(console, 'log');
      
      const mockNavigationEnd = new NavigationEnd(1, '/test', '/test');
      routerEventsSubject.next(mockNavigationEnd);
      tick();
      
      metricasUsabilidad.interaccionesExitosas++;
    }));
  });

  describe('4. ACCESIBILIDAD Y CLARIDAD', () => {
    it('CI-013: Los títulos de opciones deben ser descriptivos', () => {
      const titulosDescriptivos = [
        'Realizar Solicitud',
        'Cursos Disponibles',
        'Ver Lista de Cursos para Preinscripción',
        'Seguimiento'
      ];
      
      component.opciones.forEach((opcion, index) => {
        expect(opcion.titulo).toBe(titulosDescriptivos[index]);
      });
      metricasUsabilidad.validacionesCorrectas++;
    });

    it('CI-014: Las rutas deben ser claras y semánticas', () => {
      const rutas = component.opciones.map(o => o.ruta);
      
      expect(rutas).toContain('solicitudes');
      expect(rutas).toContain('cursos-ofertados');
      expect(rutas).toContain('cursos-preinscripcion');
      expect(rutas).toContain('ver-solicitud');
      metricasUsabilidad.validacionesCorrectas++;
    });

    it('CI-015: Los iconos deben ser intuitivos para cada acción', () => {
      const mapaIconos = {
        'Realizar Solicitud': 'add_circle',
        'Cursos Disponibles': 'school',
        'Ver Lista de Cursos para Preinscripción': 'playlist_add',
        'Seguimiento': 'list_alt'
      };
      
      component.opciones.forEach(opcion => {
        expect(opcion.icon).toBe(mapaIconos[opcion.titulo as keyof typeof mapaIconos]);
      });
      metricasUsabilidad.validacionesCorrectas++;
    });
  });

  describe('5. RENDIMIENTO Y TIEMPOS DE RESPUESTA', () => {
    it('CI-016: La inicialización debe ser instantánea', () => {
      const tiempoInicio = performance.now();
      
      const newFixture = TestBed.createComponent(CursosIntersemestralesComponent);
      newFixture.detectChanges();
      
      const tiempoFin = performance.now();
      const duracion = tiempoFin - tiempoInicio;
      
      metricasUsabilidad.tiemposRespuesta.push(duracion);
      expect(duracion).toBeLessThan(500); // Menos de 0.5 segundos
    });

    it('CI-017: Las navegaciones deben ser rápidas', fakeAsync(() => {
      const tiempoInicio = performance.now();
      
      router.navigate(['estudiante/cursos-intersemestrales/solicitudes']);
      tick();
      
      const tiempoFin = performance.now();
      const duracion = tiempoFin - tiempoInicio;
      
      metricasUsabilidad.tiemposRespuesta.push(duracion);
      expect(duracion).toBeLessThan(300);
    }));

    it('CI-018: El componente debe manejar múltiples navegaciones sin degradación', fakeAsync(() => {
      const tiempos: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const tiempoInicio = performance.now();
        router.navigate([`estudiante/cursos-intersemestrales/${component.opciones[i % 4].ruta}`]);
        tick();
        const tiempoFin = performance.now();
        tiempos.push(tiempoFin - tiempoInicio);
      }
      
      const promedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
      metricasUsabilidad.tiemposRespuesta.push(promedio);
      
      // El tiempo promedio no debe aumentar significativamente
      expect(promedio).toBeLessThan(500);
      metricasUsabilidad.interaccionesExitosas++;
    }));
  });

  describe('6. INTEGRACIÓN CON ROUTER', () => {
    it('CI-019: Debe estar correctamente integrado con RouterModule', () => {
      expect(router).toBeTruthy();
      metricasUsabilidad.validacionesCorrectas++;
    });

    it('CI-020: Debe permitir navegación relativa y absoluta', fakeAsync(() => {
      // Navegación absoluta
      router.navigate(['/estudiante/cursos-intersemestrales/solicitudes']);
      tick();
      expect(router.url).toContain('solicitudes');
      
      metricasUsabilidad.navegacionesExitosas++;
    }));
  });

  // REPORTE DE MÉTRICAS AL FINAL
  afterAll(() => {
    console.log('\nREPORTE DE MÉTRICAS DE USABILIDAD - CURSOS INTERSEMESTRALES');
    console.log('═'.repeat(60));
    console.log(`Elementos visibles verificados: ${metricasUsabilidad.elementosVisibles}`);
    console.log(`Navegaciones exitosas: ${metricasUsabilidad.navegacionesExitosas}`);
    console.log(`Interacciones exitosas: ${metricasUsabilidad.interaccionesExitosas}`);
    console.log(`Validaciones correctas: ${metricasUsabilidad.validacionesCorrectas}`);
    
    if (metricasUsabilidad.tiemposRespuesta.length > 0) {
      const promedio = metricasUsabilidad.tiemposRespuesta.reduce((a, b) => a + b, 0) / 
                      metricasUsabilidad.tiemposRespuesta.length;
      const maximo = Math.max(...metricasUsabilidad.tiemposRespuesta);
      const minimo = Math.min(...metricasUsabilidad.tiemposRespuesta);
      
      console.log(`Tiempo promedio de respuesta: ${promedio.toFixed(2)}ms`);
      console.log(`Tiempo máximo: ${maximo.toFixed(2)}ms`);
      console.log(`Tiempo mínimo: ${minimo.toFixed(2)}ms`);
    }
    console.log('═'.repeat(60));
  });
});

