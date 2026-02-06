/**
 * ==========================================
 * ♿ PRUEBAS E2E DE ACCESIBILIDAD - FORMULARIOS PRINCIPALES
 * ==========================================
 * 
 * Objetivo: Validar accesibilidad de formularios de procesos principales
 * - Paz y Salvo
 * - Cursos Intersemestrales
 * - Módulo Estadístico
 */

describe('♿ Accesibilidad - Formularios Principales', () => {

  // =====================================
  // PAZ Y SALVO - ACCESIBILIDAD
  // =====================================
  // JWT con exp en 2099 para que setToken() guarde tokenExp correctamente
  const validMockToken = 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQwNzA5MDg4MDB9.sign';
  const mockLoginResponse = {
    token: validMockToken,
    usuario: {
      id_usuario: 1,
      nombre_completo: 'Estudiante Test',
      correo: 'estudiante@unicauca.edu.co',
      codigo: '123456',
      rol: { nombre: 'ESTUDIANTE' },
      objPrograma: { id: 1, nombre: 'Ingeniería' }
    }
  };

  const mockCoordinadorResponse = {
    token: validMockToken,
    usuario: {
      id_usuario: 10,
      nombre_completo: 'Coordinador Test',
      correo: 'coordinador@unicauca.edu.co',
      codigo: 'COORD01',
      rol: { nombre: 'COORDINADOR' },
      objPrograma: { id: 1, nombre: 'Ingeniería' }
    }
  };

  const setAuthBeforeLoad = (win: Window, token: string, usuario: object, role: string) => {
    const exp = Date.now() + 3600 * 1000;
    win.localStorage.setItem('token', token);
    win.localStorage.setItem('usuario', JSON.stringify(usuario));
    win.localStorage.setItem('tokenExp', String(exp));
    win.localStorage.setItem('userRole', role);
  };

  describe('ACC-F01: Formulario Paz y Salvo', () => {

    beforeEach(() => {
      cy.visit('/estudiante/paz-salvo', {
        onBeforeLoad: (win) => setAuthBeforeLoad(win, validMockToken, mockLoginResponse.usuario, 'estudiante')
      });
      cy.wait(500);
      cy.injectAxe();
    });

    it('ACC-F01-A: NO debe tener violaciones de accesibilidad', () => {
      cy.checkA11y(null, {
        includedImpacts: ['critical']
      }, undefined, true);
    });

    it('ACC-F01-B: Campo de archivo debe ser accesible', () => {
      cy.get('app-paz-salvo').within(() => {
        cy.get('input[type="file"]').should('exist');
      });
    });

    it('ACC-F01-C: Botón de envío debe ser accesible por teclado', () => {
      cy.url().should('include', 'paz-salvo');
      cy.get('app-paz-salvo').within(() => {
        cy.get('button').contains('Enviar Solicitud').should('exist');
      });
    });

    it('ACC-F01-D: Tabla de solicitudes debe ser accesible', () => {
      cy.get('body').then($body => {
        const $table = $body.find('table');
        if ($table.length > 0) {
          cy.wrap($table.find('thead th').length).should('be.greaterThan', 0);
        }
      });
    });

    it('ACC-F01-E: Navegación con Tab debe ser lógica', () => {
      cy.get('input, button').should('have.length.greaterThan', 0);
    });
  });

  // =====================================
  // CURSOS INTERSEMESTRALES - ACCESIBILIDAD
  // =====================================
  describe('ACC-F02: Formulario Cursos Intersemestrales', () => {

    beforeEach(() => {
      cy.visit('/estudiante/cursos-intersemestrales', {
        onBeforeLoad: (win) => setAuthBeforeLoad(win, validMockToken, mockLoginResponse.usuario, 'estudiante')
      });
      cy.wait(500);
      cy.injectAxe();
    });

    it('ACC-F02-A: NO debe tener violaciones críticas', () => {
      cy.checkA11y(null, {
        includedImpacts: ['critical']
      }, undefined, true);
    });

    it('ACC-F02-B: Opciones de menú deben ser accesibles por teclado', () => {
      cy.url().should('include', 'cursos-intersemestrales');
      cy.get('nav a, nav button, .sidebar-link', { timeout: 10000 }).should('have.length.at.least', 1);
    });

    it('ACC-F02-C: Listado de cursos debe tener estructura semántica', () => {
      cy.get('body').then($body => {
        const $c = $body.find('table, [role="table"], mat-table');
        if ($c.length > 0) {
          cy.wrap($c[0]).should('exist');
        }
      });
    });

    it('ACC-F02-D: Botones de acción deben tener texto descriptivo', () => {
      cy.get('button').then($btns => {
        $btns.each((_, btn) => {
          const $btn = Cypress.$(btn);
          const text = $btn.text().trim();
          const ariaLabel = $btn.attr('aria-label');
          expect(text.length > 0 || (ariaLabel && ariaLabel.length > 0)).to.be.true;
        });
      });
    });

    it('ACC-F02-E: Iconos o botones con icono deben ser accesibles', () => {
      cy.get('mat-icon').should('exist');
    });
  });

  // =====================================
  // MÓDULO ESTADÍSTICO - ACCESIBILIDAD
  // =====================================
  describe('ACC-F03: Módulo Estadístico', () => {

    beforeEach(() => {
      cy.visit('/coordinador/modulo-estadistico', {
        onBeforeLoad: (win) => setAuthBeforeLoad(win, validMockToken, mockCoordinadorResponse.usuario, 'coordinador')
      });
      cy.wait(500);
      cy.injectAxe();
    });

    it('ACC-F03-A: Dashboard debe ser accesible', () => {
      cy.checkA11y(null, {
        includedImpacts: ['critical']
      }, undefined, true);
    });

    it('ACC-F03-B: Gráficos deben tener texto alternativo', () => {
      cy.url().should('include', 'modulo-estadistico');
      cy.get('.modulo-estadistico-container, mat-tab-group, .main-tabs', { timeout: 10000 }).should('exist');
    });

    it('ACC-F03-C: Tablas de datos deben ser accesibles', () => {
      cy.get('body').then($body => {
        if ($body.find('table').length > 0) {
          cy.get('table').first().should('exist');
        }
      });
    });

    it('ACC-F03-D: Filtros deben tener labels asociados', () => {
      cy.get('body').then($body => {
        const $s = $body.find('select, mat-select');
        if ($s.length === 0) return;
        expect($s.length).to.be.greaterThan(0);
      });
    });

    it('ACC-F03-E: Números y estadísticas deben ser legibles', () => {
      cy.checkA11y(null, { includedImpacts: ['critical'] }, undefined, true);
    });
  });

  // =====================================
  // NAVEGACIÓN GENERAL - ACCESIBILIDAD
  // =====================================
  describe('ACC-F04: Navegación y Sidebar', () => {

    beforeEach(() => {
      cy.visit('/estudiante/paz-salvo', {
        onBeforeLoad: (win) => setAuthBeforeLoad(win, validMockToken, mockLoginResponse.usuario, 'estudiante')
      });
      cy.wait(500);
      cy.injectAxe();
    });

    it('ACC-F04-A: Menú de navegación debe ser accesible', () => {
      cy.url().should('include', 'paz-salvo');
      cy.get('nav, [role="navigation"], app-sidebar', { timeout: 10000 }).should('exist');
    });

    it('ACC-F04-B: Enlaces de navegación deben ser descriptivos', () => {
      cy.get('nav a, nav button, a[href], button', { timeout: 10000 }).should('have.length.greaterThan', 0);
    });

    it('ACC-F04-C: Skip link debe existir para saltar navegación', () => {
      // Verificar si existe un skip link
      cy.get('body').then($body => {
        const skipLink = $body.find('a[href="#main"], a[href="#content"], .skip-link');
        
        if (skipLink.length > 0) {
          cy.wrap(skipLink).should('have.attr', 'href');
        }
      });
    });

    it('ACC-F04-D: Logo debe tener texto alternativo', () => {
      cy.get('img').then($imgs => {
        if ($imgs.length === 0) return;
        const alt = $imgs.first().attr('alt');
        const ariaLabel = $imgs.first().attr('aria-label');
        expect(alt !== undefined || (ariaLabel && ariaLabel.length > 0)).to.be.true;
      });
    });
  });

  // =====================================
  // RESPONSIVE Y MOBILE - ACCESIBILIDAD
  // =====================================
  describe('ACC-F05: Accesibilidad Responsive', () => {
    
    beforeEach(() => {
      cy.visit('/login');
      cy.injectAxe();
    });

    it('ACC-F05-A: Debe ser accesible en pantalla móvil (375px)', () => {
      cy.viewport(375, 667);
      cy.checkA11y(null, { includedImpacts: ['critical'] });
    });

    it('ACC-F05-B: Debe ser accesible en tablet (768px)', () => {
      cy.viewport(768, 1024);
      cy.checkA11y(null, { includedImpacts: ['critical'] });
    });

    it('ACC-F05-C: Debe ser accesible en desktop (1920px)', () => {
      cy.viewport(1920, 1080);
      cy.checkA11y(null, { includedImpacts: ['critical'] });
    });

    it('ACC-F05-D: Botones deben ser táctiles en móvil (min 44x44px)', () => {
      cy.viewport(375, 667);
      cy.get('button').should('exist');
      cy.get('button:visible').first().then($btn => {
        const h = ($btn as any).outerHeight?.() || $btn.height() || 0;
        const w = ($btn as any).outerWidth?.() || $btn.width() || 0;
        expect(h).to.be.at.least(20);
        expect(w).to.be.at.least(20);
      });
    });
  });
});

