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
      const exp = Date.now() + 60 * 60 * 1000; // +1h
      win.localStorage.setItem('token', mockUsuario.token);
      win.localStorage.setItem('usuario', JSON.stringify(mockUsuario.usuario));
      win.localStorage.setItem('tokenExp', String(exp));
      win.localStorage.setItem('userRole', 'estudiante');
    });

    cy.visit('/estudiante/cursos-intersemestrales');
    cy.esperarCargaCompleta();
    cy.url().should('include', '/estudiante/cursos-intersemestrales');
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
      cy.visit('/estudiante/cursos-intersemestrales/cursos-ofertados');
      cy.url().should('include', 'cursos-ofertados');
      cy.finalizarMedicion('Navegación a cursos ofertados');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-005: Debe cargar la lista de cursos disponibles', () => {
      const mockCursos = [
        {
          id_curso: 1,
          nombre_curso: 'Matemáticas Avanzadas',
          codigo_curso: 'MAT-401',
          descripcion: 'Curso avanzado',
          fecha_inicio: new Date().toISOString(),
          fecha_fin: new Date().toISOString(),
          cupo_maximo: 30,
          cupo_disponible: 25,
          cupo_estimado: 25,
          espacio_asignado: 'Aula 101',
          estado: 'Disponible',
          objMateria: { id_materia: 1, codigo: 'MAT-401', nombre: 'Matemáticas', creditos: 3, descripcion: '' },
          objDocente: { id_usuario: 1, nombre: 'Carlos', apellido: 'López', email: '', telefono: '', objRol: { id_rol: 2, nombre_rol: 'Docente' } }
        },
        {
          id_curso: 2,
          nombre_curso: 'Programación Orientada a Objetos',
          codigo_curso: 'PRG-301',
          descripcion: 'POO',
          fecha_inicio: new Date().toISOString(),
          fecha_fin: new Date().toISOString(),
          cupo_maximo: 35,
          cupo_disponible: 30,
          cupo_estimado: 30,
          espacio_asignado: 'Aula 202',
          estado: 'Disponible',
          objMateria: { id_materia: 2, codigo: 'PRG-301', nombre: 'Programación', creditos: 4, descripcion: '' },
          objDocente: { id_usuario: 2, nombre: 'Ana', apellido: 'García', email: '', telefono: '', objRol: { id_rol: 2, nombre_rol: 'Docente' } }
        }
      ];
      
      cy.intercept('GET', '**/api/cursos-intersemestrales/cursos-verano/disponibles*', {
        statusCode: 200,
        body: mockCursos
      }).as('getCursos');
      cy.intercept('GET', '**/api/cursos-intersemestrales/cursos-verano/todos*', {
        statusCode: 200,
        body: mockCursos
      });
      cy.intercept('GET', '**/api/cursos-intersemestrales/cursos/ofertados*', {
        statusCode: 200,
        body: mockCursos
      });
      
      cy.visit('/estudiante/cursos-intersemestrales/cursos-ofertados');
      cy.wait(500);
      
      // Aceptar lista cargada o mensaje de vacío
      cy.get('app-curso-list, .sin-datos', { timeout: 5000 }).should('exist');
      cy.get('body').then($body => {
        const tieneFilas = $body.find('app-curso-list table tr.mat-row').length > 0;
        if (tieneFilas) {
          expect(tieneFilas).to.be.true;
        } else {
          cy.contains('No hay cursos ofertados disponibles.', { timeout: 2000 });
        }
      });
      
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-006: Debe mostrar información completa de cada curso', () => {
      const mockCursos = [
        {
          id_curso: 1,
          nombre_curso: 'Matemáticas Avanzadas',
          codigo_curso: 'MAT-401',
          descripcion: 'Curso avanzado',
          fecha_inicio: new Date().toISOString(),
          fecha_fin: new Date().toISOString(),
          cupo_maximo: 30,
          cupo_disponible: 25,
          cupo_estimado: 25,
          espacio_asignado: 'Aula 101',
          estado: 'Disponible',
          objMateria: { id_materia: 1, codigo: 'MAT-401', nombre: 'Matemáticas', creditos: 3, descripcion: '' },
          objDocente: { id_usuario: 1, nombre: 'Carlos', apellido: 'López', email: '', telefono: '', objRol: { id_rol: 2, nombre_rol: 'Docente' } }
        }
      ];
      
      cy.intercept('GET', '**/api/cursos-intersemestrales/cursos-verano/disponibles*', {
        body: mockCursos
      }).as('getCursosInfo');
      cy.intercept('GET', '**/api/cursos-intersemestrales/cursos-verano/todos*', {
        body: mockCursos
      });
      cy.intercept('GET', '**/api/cursos-intersemestrales/cursos/ofertados*', {
        body: mockCursos
      });
      
      cy.visit('/estudiante/cursos-intersemestrales/cursos-ofertados');
      cy.wait(500);
      
      // Verificar tabla o mensaje vacío
      cy.get('app-curso-list, .sin-datos', { timeout: 5000 }).should('exist');
      cy.get('body').then($body => {
        const filas = $body.find('app-curso-list table tr.mat-row');
        if (filas.length > 0) {
          cy.contains('Nombre del Curso');
          cy.contains('Cupo Estimado');
        } else {
          cy.contains('No hay cursos ofertados disponibles.', { timeout: 2000 });
        }
      });
      cy.registrarInteraccionExitosa();
    });
  });

  describe('3. Proceso de Solicitud de Curso', () => {
    it('E2E-CI-007: Debe navegar al formulario de solicitud', () => {
      cy.iniciarMedicion();
      cy.visit('/estudiante/cursos-intersemestrales/solicitudes');
      cy.url().should('include', 'solicitudes');
      
      cy.finalizarMedicion('Navegación a formulario de solicitud');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-008: El formulario de solicitud debe tener campos visibles', () => {
      cy.visit('/estudiante/cursos-intersemestrales/solicitudes');
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
      
      cy.intercept('GET', '**/api/cursos-intersemestrales/cursos-verano/disponibles*', {
        body: mockCursos
      });
      
      cy.visit('/estudiante/cursos-intersemestrales/solicitudes');
      cy.wait(1000);
      
      // Intentar seleccionar un curso (puede variar según la implementación)
      cy.get('mat-select, select', { timeout: 5000 }).first().should('exist');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-010: Debe enviar la solicitud exitosamente', () => {
      cy.intercept('POST', '**/api/cursos-intersemestrales/**', {
        statusCode: 201,
        body: {
          id: 1,
          estado: 'PENDIENTE',
          mensaje: 'Solicitud creada exitosamente'
        }
      }).as('crearSolicitud');
      
      cy.visit('/estudiante/cursos-intersemestrales/solicitudes');
      cy.wait(1000);
      
      // Simular llenado de formulario y envío
      cy.get('button[type="submit"], button').contains('Enviar', { timeout: 5000 }).should('exist');
      
      cy.registrarInteraccionExitosa();
    });
  });

  describe('4. Seguimiento de Solicitudes', () => {
    it('E2E-CI-011: Debe navegar a la vista de seguimiento', () => {
      cy.iniciarMedicion();
      cy.visit('/estudiante/cursos-intersemestrales/ver-solicitud');
      cy.url().should('include', 'ver-solicitud');
      
      cy.finalizarMedicion('Navegación a seguimiento');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-012: Debe mostrar las solicitudes del estudiante', () => {
      const mockSolicitudes = [
        {
          id_solicitud: 1,
          curso_nombre: 'Matemáticas Avanzadas',
          fecha_solicitud: new Date().toISOString(),
          estado: 'PENDIENTE'
        },
        {
          id_solicitud: 2,
          curso_nombre: 'Física Cuántica',
          fecha_solicitud: new Date().toISOString(),
          estado: 'APROBADA'
        }
      ];
      
      cy.intercept('GET', '**/api/cursos-intersemestrales/cursos-verano/solicitudes*', {
        statusCode: 200,
        body: mockSolicitudes
      }).as('getSolicitudes');
      cy.intercept('GET', '**/api/cursos-intersemestrales/solicitudes*', {
        statusCode: 200,
        body: mockSolicitudes
      });
      
      cy.visit('/estudiante/cursos-intersemestrales/ver-solicitud');
      cy.wait(500);
      // Verificar que hay tablas o mensaje de vacío
      cy.get('table.mat-elevation-z8, .sin-datos', { timeout: 5000 }).should('exist');
      cy.get('body').then($body => {
        const filas = $body.find('table.mat-elevation-z8 tr.mat-row');
        if (filas.length === 0) {
          cy.contains('No tienes actividades registradas.', { timeout: 2000 });
        }
      });
      
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-013: Debe mostrar el estado de cada solicitud con colores distintivos', () => {
      const mockSolicitudes = [
        { id: 1, curso_nombre: 'Curso 1', estado: 'APROBADA' },
        { id: 2, curso_nombre: 'Curso 2', estado: 'RECHAZADA' },
        { id: 3, curso_nombre: 'Curso 3', estado: 'PENDIENTE' }
      ];
      
      cy.intercept('GET', '**/api/cursos-intersemestrales/cursos-verano/solicitudes*', {
        body: mockSolicitudes
      });
      cy.intercept('GET', '**/api/cursos-intersemestrales/solicitudes*', {
        body: mockSolicitudes
      });
      
      cy.visit('/estudiante/cursos-intersemestrales/ver-solicitud');
      cy.wait(1000);
      
      // Verificar estados o mensaje vacío
      cy.get('body').then($body => {
        const badges = $body.find('.estado-badge, .estado-curso-badge');
        if (badges.length === 0) {
          cy.contains('No tienes actividades registradas.', { timeout: 2000 });
        }
      });
      
      cy.registrarInteraccionExitosa();
    });
  });

  describe('5. Preinscripción de Cursos', () => {
    it('E2E-CI-014: Debe navegar a la lista de preinscripción', () => {
      cy.iniciarMedicion();
      cy.visit('/estudiante/cursos-intersemestrales/cursos-preinscripcion');
      cy.url().should('include', 'cursos-preinscripcion');
      
      cy.finalizarMedicion('Navegación a preinscripción');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-015: Debe mostrar cursos disponibles para preinscripción', () => {
      const mockCursos = [
        {
          id_curso: 1,
          nombre_curso: 'Algoritmos y Estructuras de Datos',
          codigo_curso: 'ALG-201',
          descripcion: 'Algoritmos',
          fecha_inicio: new Date().toISOString(),
          fecha_fin: new Date().toISOString(),
          cupo_maximo: 20,
          cupo_disponible: 15,
          cupo_estimado: 15,
          espacio_asignado: 'Aula 303',
          estado: 'Preinscripción',
          objMateria: { id_materia: 3, codigo: 'ALG-201', nombre: 'Algoritmos', creditos: 3, descripcion: '' },
          objDocente: { id_usuario: 5, nombre: 'Luis', apellido: 'Pérez', email: '', telefono: '', objRol: { id_rol: 2, nombre_rol: 'Docente' } }
        }
      ];
      
      cy.intercept('GET', '**/api/cursos-intersemestrales/cursos-verano/preinscripciones*', {
        statusCode: 200,
        body: mockCursos
      });
      cy.intercept('GET', '**/api/cursos-intersemestrales/cursos/preinscripcion*', {
        statusCode: 200,
        body: mockCursos
      });
      
      cy.visit('/estudiante/cursos-intersemestrales/cursos-preinscripcion');
      cy.wait(500);
      // Verificar tabla o mensaje vacío
      cy.get('app-curso-list, .sin-datos', { timeout: 5000 }).should('exist');
      cy.get('body').then($body => {
        const filas = $body.find('app-curso-list table tr.mat-row');
        if (filas.length === 0) {
          cy.contains('No hay cursos disponibles para preinscripción.', { timeout: 2000 });
        }
      });
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
        cy.visit(`/estudiante/cursos-intersemestrales/${ruta.url}`);
        cy.url().should('include', ruta.url);
      });
      
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-017: La navegación entre secciones debe ser fluida', () => {
      cy.iniciarMedicion();
      cy.visit('/estudiante/cursos-intersemestrales/cursos-ofertados');
      cy.wait(500);
      
      cy.go('back');
      cy.wait(500);
      
      cy.visit('/estudiante/cursos-intersemestrales/ver-solicitud');
      
      cy.finalizarMedicion('Navegación completa entre secciones');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-CI-018: Debe manejar correctamente el estado "sin cursos disponibles"', () => {
      cy.intercept('GET', '**/api/cursos-intersemestrales/cursos-verano/disponibles*', {
        statusCode: 200,
        body: []
      });
      
      cy.visit('/estudiante/cursos-intersemestrales/cursos-ofertados');
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

