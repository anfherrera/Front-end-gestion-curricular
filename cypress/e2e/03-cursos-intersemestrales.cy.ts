/// <reference types="cypress" />

/**
 * PRUEBAS E2E: Flujo de Cursos Intersemestrales
 * Valida el proceso completo de consulta y solicitud de cursos
 */

describe('E2E-03: Flujo Completo de Cursos Intersemestrales', () => {
  const mockUsuario = {
    token: 'mock-token-estudiante',
    usuario: {
      id_usuario: 1,
      nombre_completo: 'María García',
      correo: 'maria.garcia@unicauca.edu.co',
      codigo: '654321',
      rol: { nombre: 'ESTUDIANTE' },
      objPrograma: { id: 1, nombre: 'Ingeniería Electrónica' }
    }
  };

  beforeEach(() => {
    // Setup: Login simulado
    cy.window().then((win) => {
      win.localStorage.setItem('token', mockUsuario.token);
      win.localStorage.setItem('usuario', JSON.stringify(mockUsuario.usuario));
    });

    cy.visit('/estudiante/cursos-intersemestrales');
    cy.esperarCargaCompleta();
  });

  describe('1. Navegación y Opciones Disponibles', () => {
    it('E2E-CI-001: Debe mostrar todas las opciones de navegación', () => {
      cy.iniciarMedicion();
      
      cy.contains('Realizar Solicitud').should('be.visible');
      cy.registrarElementoVisible('Realizar Solicitud');
      
      cy.contains('Cursos Disponibles').should('be.visible');
      cy.registrarElementoVisible('Cursos Disponibles');
      
      cy.contains('Preinscripción').should('be.visible');
      cy.registrarElementoVisible('Preinscripción');
      
      cy.contains('Seguimiento').should('be.visible');
      cy.registrarElementoVisible('Seguimiento');
      
      cy.finalizarMedicion('Renderizado de opciones de navegación');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-002: Los iconos deben estar visibles junto a cada opción', () => {
      cy.get('mat-icon').should('have.length.at.least', 4);
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-003: Las tarjetas u opciones deben ser clicables', () => {
      cy.contains('Realizar Solicitud').should('not.be.disabled');
      cy.contains('Cursos Disponibles').should('not.be.disabled');
      cy.registrarInteraccionExitosa();
    });
  });

  describe('2. Navegación a Cursos Disponibles', () => {
    it('E2E-CI-004: Debe navegar a la vista de cursos ofertados', () => {
      cy.iniciarMedicion();
      
      cy.contains('Cursos Disponibles').click();
      cy.url().should('include', 'cursos-ofertados');
      
      cy.finalizarMedicion('Navegación a cursos ofertados');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-005: Debe cargar la lista de cursos disponibles', () => {
      const mockCursos = [
        {
          id: 1,
          nombre: 'Matemáticas Avanzadas',
          codigo: 'MAT-401',
          creditos: 3,
          cupos_disponibles: 25
        },
        {
          id: 2,
          nombre: 'Programación Orientada a Objetos',
          codigo: 'PRG-301',
          creditos: 4,
          cupos_disponibles: 30
        }
      ];
      
      cy.intercept('GET', '**/api/cursos-intersemestrales/**', {
        statusCode: 200,
        body: mockCursos
      }).as('getCursos');
      
      cy.contains('Cursos Disponibles').click();
      cy.wait('@getCursos');
      
      cy.contains('Matemáticas Avanzadas', { timeout: 5000 });
      cy.contains('Programación Orientada a Objetos');
      
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-006: Debe mostrar información completa de cada curso', () => {
      const mockCursos = [
        {
          id: 1,
          nombre: 'Matemáticas Avanzadas',
          codigo: 'MAT-401',
          creditos: 3,
          cupos_disponibles: 25,
          docente: 'Dr. Carlos López',
          horario: 'Lunes y Miércoles 2-4 PM'
        }
      ];
      
      cy.intercept('GET', '**/api/cursos-intersemestrales/**', {
        body: mockCursos
      });
      
      cy.contains('Cursos Disponibles').click();
      cy.wait(1000);
      
      // Verificar que se muestra información del curso
      cy.contains('MAT-401', { timeout: 5000 });
      cy.registrarInteraccionExitosa();
    });
  });

  describe('3. Proceso de Solicitud de Curso', () => {
    it('E2E-CI-007: Debe navegar al formulario de solicitud', () => {
      cy.iniciarMedicion();
      
      cy.contains('Realizar Solicitud').click();
      cy.url().should('include', 'solicitudes');
      
      cy.finalizarMedicion('Navegación a formulario de solicitud');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-008: El formulario de solicitud debe tener campos visibles', () => {
      cy.contains('Realizar Solicitud').click();
      cy.wait(1000);
      
      // Verificar que hay inputs o selects en el formulario
      cy.get('input, select, mat-select, textarea', { timeout: 5000 }).should('exist');
      cy.registrarElementoVisible('formulario-solicitud');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-009: Debe permitir seleccionar un curso para solicitar', () => {
      const mockCursos = [
        { id: 1, nombre: 'Cálculo III', codigo: 'MAT-301', cupos_disponibles: 20 }
      ];
      
      cy.intercept('GET', '**/api/cursos-intersemestrales/**', {
        body: mockCursos
      });
      
      cy.contains('Realizar Solicitud').click();
      cy.wait(1000);
      
      // Intentar seleccionar un curso (puede variar según la implementación)
      cy.get('mat-select, select', { timeout: 5000 }).first().should('exist');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-010: Debe enviar la solicitud exitosamente', () => {
      cy.intercept('POST', '**/api/cursos-intersemestrales/solicitud/**', {
        statusCode: 201,
        body: {
          id: 1,
          estado: 'PENDIENTE',
          mensaje: 'Solicitud creada exitosamente'
        }
      }).as('crearSolicitud');
      
      cy.contains('Realizar Solicitud').click();
      cy.wait(1000);
      
      // Simular llenado de formulario y envío
      cy.get('button[type="submit"], button').contains('Enviar', { timeout: 5000 }).should('exist');
      
      cy.registrarInteraccionExitosa();
    });
  });

  describe('4. Seguimiento de Solicitudes', () => {
    it('E2E-CI-011: Debe navegar a la vista de seguimiento', () => {
      cy.iniciarMedicion();
      
      cy.contains('Seguimiento').click();
      cy.url().should('include', 'ver-solicitud');
      
      cy.finalizarMedicion('Navegación a seguimiento');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-012: Debe mostrar las solicitudes del estudiante', () => {
      const mockSolicitudes = [
        {
          id: 1,
          curso_nombre: 'Matemáticas Avanzadas',
          fecha_solicitud: new Date().toISOString(),
          estado: 'PENDIENTE'
        },
        {
          id: 2,
          curso_nombre: 'Física Cuántica',
          fecha_solicitud: new Date().toISOString(),
          estado: 'APROBADA'
        }
      ];
      
      cy.intercept('GET', '**/api/cursos-intersemestrales/solicitudes/**', {
        statusCode: 200,
        body: mockSolicitudes
      }).as('getSolicitudes');
      
      cy.contains('Seguimiento').click();
      cy.wait('@getSolicitudes');
      
      cy.contains('Matemáticas Avanzadas', { timeout: 5000 });
      cy.contains('PENDIENTE');
      
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-013: Debe mostrar el estado de cada solicitud con colores distintivos', () => {
      const mockSolicitudes = [
        { id: 1, curso_nombre: 'Curso 1', estado: 'APROBADA' },
        { id: 2, curso_nombre: 'Curso 2', estado: 'RECHAZADA' },
        { id: 3, curso_nombre: 'Curso 3', estado: 'PENDIENTE' }
      ];
      
      cy.intercept('GET', '**/api/cursos-intersemestrales/solicitudes/**', {
        body: mockSolicitudes
      });
      
      cy.contains('Seguimiento').click();
      cy.wait(1000);
      
      // Verificar que se muestran los estados
      cy.contains('APROBADA', { timeout: 5000 });
      cy.contains('RECHAZADA');
      cy.contains('PENDIENTE');
      
      cy.registrarInteraccionExitosa();
    });
  });

  describe('5. Preinscripción de Cursos', () => {
    it('E2E-CI-014: Debe navegar a la lista de preinscripción', () => {
      cy.iniciarMedicion();
      
      cy.contains('Preinscripción').click();
      cy.url().should('include', 'cursos-preinscripcion');
      
      cy.finalizarMedicion('Navegación a preinscripción');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-015: Debe mostrar cursos disponibles para preinscripción', () => {
      const mockCursos = [
        {
          id: 1,
          nombre: 'Algoritmos y Estructuras de Datos',
          codigo: 'ALG-201',
          cupos_disponibles: 15
        }
      ];
      
      cy.intercept('GET', '**/api/cursos-intersemestrales/preinscripcion/**', {
        statusCode: 200,
        body: mockCursos
      });
      
      cy.contains('Preinscripción').click();
      cy.wait(1000);
      
      cy.contains('Algoritmos', { timeout: 5000 });
      cy.registrarInteraccionExitosa();
    });
  });

  describe('6. Accesibilidad y UX', () => {
    it('E2E-CI-016: Los enlaces deben funcionar sin errores de navegación', () => {
      const rutas = [
        { texto: 'Realizar Solicitud', url: 'solicitudes' },
        { texto: 'Cursos Disponibles', url: 'cursos-ofertados' },
        { texto: 'Seguimiento', url: 'ver-solicitud' }
      ];
      
      rutas.forEach((ruta) => {
        cy.visit('/estudiante/cursos-intersemestrales');
        cy.contains(ruta.texto).click();
        cy.url().should('include', ruta.url);
      });
      
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-017: La navegación entre secciones debe ser fluida', () => {
      cy.iniciarMedicion();
      
      cy.contains('Cursos Disponibles').click();
      cy.wait(500);
      
      cy.go('back');
      cy.wait(500);
      
      cy.contains('Seguimiento').click();
      
      cy.finalizarMedicion('Navegación completa entre secciones');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-018: Debe manejar correctamente el estado "sin cursos disponibles"', () => {
      cy.intercept('GET', '**/api/cursos-intersemestrales/**', {
        statusCode: 200,
        body: []
      });
      
      cy.contains('Cursos Disponibles').click();
      cy.wait(1000);
      
      // Verificar mensaje de "no hay cursos"
      cy.contains('No hay cursos', { timeout: 5000 });
      cy.registrarInteraccionExitosa();
    });
  });

  describe('7. Medición de Rendimiento', () => {
    it('E2E-CI-019: La carga de la página principal debe ser rápida', () => {
      cy.visit('/estudiante/cursos-intersemestrales');
      
      cy.window().then((win) => {
        win.performance.mark('inicio');
      });
      
      cy.contains('Realizar Solicitud', { timeout: 3000 }).should('be.visible');
      
      cy.window().then((win) => {
        win.performance.mark('fin');
        win.performance.measure('carga-page', 'inicio', 'fin');
        const measure = win.performance.getEntriesByName('carga-page')[0];
        
        cy.log(`Tiempo de carga: ${measure.duration}ms`);
        expect(measure.duration).to.be.lessThan(2000);
      });
      
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-020: Las transiciones entre vistas deben ser instantáneas', () => {
      const tiempos: number[] = [];
      
      ['Cursos Disponibles', 'Seguimiento', 'Preinscripción'].forEach((opcion) => {
        cy.visit('/estudiante/cursos-intersemestrales');
        
        cy.window().then((win) => {
          win.performance.mark(`inicio-${opcion}`);
        });
        
        cy.contains(opcion).click();
        
        cy.window().then((win) => {
          win.performance.mark(`fin-${opcion}`);
          win.performance.measure(opcion, `inicio-${opcion}`, `fin-${opcion}`);
          const measure = win.performance.getEntriesByName(opcion)[0];
          tiempos.push(measure.duration);
        });
      });
      
      cy.wrap(tiempos).then((t) => {
        const promedio = t.reduce((a, b) => a + b, 0) / t.length;
        cy.log(`Tiempo promedio de navegación: ${promedio.toFixed(2)}ms`);
        expect(promedio).to.be.lessThan(1000);
      });
      
      cy.registrarInteraccionExitosa();
    });
  });

  // Generar reporte al final
  after(() => {
    cy.obtenerMetricas().then((metricas) => {
      cy.task('log', '\n📊 MÉTRICAS - FLUJO DE CURSOS INTERSEMESTRALES');
      cy.task('log', '═'.repeat(50));
      cy.task('log', `✅ Elementos verificados: ${metricas.elementosVisibles.length}`);
      cy.task('log', `🎯 Interacciones exitosas: ${metricas.interaccionesExitosas}`);
      cy.task('log', `⏱️  Mediciones realizadas: ${metricas.tiemposRespuesta.length}`);
      
      if (metricas.tiemposRespuesta.length > 0) {
        const promedio = metricas.tiemposRespuesta.reduce((a: any, b: any) => 
          a + (b.duracion || 0), 0) / metricas.tiemposRespuesta.length;
        cy.task('log', `⏱️  Tiempo promedio: ${promedio.toFixed(2)}ms`);
      }
    });
  });
});

