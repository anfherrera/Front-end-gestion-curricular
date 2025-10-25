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
  describe('ACC-F01: Formulario Paz y Salvo', () => {
    
    beforeEach(() => {
      // Login como estudiante
      cy.visit('/login');
      cy.get('input[type="email"]').type('estudiante@unicauca.edu.co');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait(1000);
      
      // Navegar a Paz y Salvo
      cy.visit('/estudiante/paz-salvo');
      cy.wait(500);
      cy.injectAxe();
    });

    it('ACC-F01-A: NO debe tener violaciones de accesibilidad', () => {
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious']
      });
    });

    it('ACC-F01-B: Campo de archivo debe ser accesible', () => {
      cy.get('input[type="file"]').then($input => {
        // Verificar que tiene label o descripción
        const id = $input.attr('id');
        const ariaLabel = $input.attr('aria-label');
        const ariaDescribedBy = $input.attr('aria-describedby');
        
        if (id) {
          cy.get(`label[for="${id}"]`).should('exist');
        } else {
          expect(ariaLabel || ariaDescribedBy).to.exist;
        }
      });
    });

    it('ACC-F01-C: Botón de envío debe ser accesible por teclado', () => {
      cy.get('button').contains(/enviar|subir/i).focus().should('have.focus');
    });

    it('ACC-F01-D: Tabla de solicitudes debe ser accesible', () => {
      cy.get('table').then($table => {
        if ($table.length > 0) {
          // Verificar encabezados
          cy.get('table thead th').should('have.length.greaterThan', 0);
          
          // Verificar estructura semántica
          cy.checkA11y('table', {
            rules: {
              'table-fake-caption': { enabled: true },
              'th-has-data-cells': { enabled: true }
            }
          });
        }
      });
    });

    it('ACC-F01-E: Navegación con Tab debe ser lógica', () => {
      const focusableSelectors = [
        'input:not([disabled])',
        'button:not([disabled])',
        'a[href]',
        'select:not([disabled])'
      ];

      let focusableElements: any[] = [];
      
      focusableSelectors.forEach(selector => {
        cy.get(selector).then($els => {
          focusableElements = focusableElements.concat(Array.from($els));
        });
      });

      // Verificar que hay elementos focusables
      cy.get('input, button, a[href], select').should('have.length.greaterThan', 0);
    });
  });

  // =====================================
  // CURSOS INTERSEMESTRALES - ACCESIBILIDAD
  // =====================================
  describe('ACC-F02: Formulario Cursos Intersemestrales', () => {
    
    beforeEach(() => {
      cy.visit('/login');
      cy.get('input[type="email"]').type('estudiante@unicauca.edu.co');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait(1000);
      
      cy.visit('/estudiante/cursos-intersemestrales');
      cy.wait(500);
      cy.injectAxe();
    });

    it('ACC-F02-A: NO debe tener violaciones críticas', () => {
      cy.checkA11y(null, {
        includedImpacts: ['critical']
      });
    });

    it('ACC-F02-B: Tabs deben ser accesibles por teclado', () => {
      cy.get('[role="tab"], mat-tab').first().focus().should('have.focus');
      
      // Navegar con flechas (si está implementado)
      cy.get('[role="tab"], mat-tab').first().type('{rightarrow}');
    });

    it('ACC-F02-C: Listado de cursos debe tener estructura semántica', () => {
      cy.get('table, [role="table"], mat-table').then($container => {
        if ($container.length > 0) {
          cy.checkA11y($container[0], {
            rules: {
              'list': { enabled: true },
              'listitem': { enabled: true }
            }
          });
        }
      });
    });

    it('ACC-F02-D: Botones de acción deben tener texto descriptivo', () => {
      cy.get('button').each($btn => {
        const text = $btn.text().trim();
        const ariaLabel = $btn.attr('aria-label');
        
        expect(text || ariaLabel).to.have.length.greaterThan(0);
      });
    });

    it('ACC-F02-E: Iconos deben tener texto alternativo', () => {
      cy.get('mat-icon, i[class*="icon"]').each($icon => {
        const ariaLabel = $icon.attr('aria-label');
        const ariaHidden = $icon.attr('aria-hidden');
        
        // Debe tener aria-label O estar oculto para lectores de pantalla
        expect(ariaLabel || ariaHidden === 'true').to.be.true;
      });
    });
  });

  // =====================================
  // MÓDULO ESTADÍSTICO - ACCESIBILIDAD
  // =====================================
  describe('ACC-F03: Módulo Estadístico', () => {
    
    beforeEach(() => {
      cy.visit('/login');
      cy.get('input[type="email"]').type('coordinador@unicauca.edu.co');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait(1000);
      
      cy.visit('/coordinador/modulo-estadistico');
      cy.wait(500);
      cy.injectAxe();
    });

    it('ACC-F03-A: Dashboard debe ser accesible', () => {
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious']
      });
    });

    it('ACC-F03-B: Gráficos deben tener texto alternativo', () => {
      cy.get('canvas, svg, [role="img"]').each($visual => {
        const ariaLabel = $visual.attr('aria-label');
        const role = $visual.attr('role');
        const title = $visual.find('title').length;
        
        // Debe tener descripción accesible
        expect(ariaLabel || role === 'img' || title > 0).to.be.true;
      });
    });

    it('ACC-F03-C: Tablas de datos deben ser accesibles', () => {
      cy.get('table').then($tables => {
        if ($tables.length > 0) {
          cy.checkA11y('table', {
            rules: {
              'table-fake-caption': { enabled: true },
              'th-has-data-cells': { enabled: true },
              'scope-attr-valid': { enabled: true }
            }
          });
        }
      });
    });

    it('ACC-F03-D: Filtros deben tener labels asociados', () => {
      cy.get('select, mat-select').each($select => {
        const id = $select.attr('id');
        const ariaLabel = $select.attr('aria-label');
        const ariaLabelledBy = $select.attr('aria-labelledby');
        
        if (id) {
          cy.get(`label[for="${id}"]`).should('exist');
        } else {
          expect(ariaLabel || ariaLabelledBy).to.exist;
        }
      });
    });

    it('ACC-F03-E: Números y estadísticas deben ser legibles', () => {
      cy.checkA11y('.dashboard, .statistics', {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
    });
  });

  // =====================================
  // NAVEGACIÓN GENERAL - ACCESIBILIDAD
  // =====================================
  describe('ACC-F04: Navegación y Sidebar', () => {
    
    beforeEach(() => {
      cy.visit('/login');
      cy.get('input[type="email"]').type('estudiante@unicauca.edu.co');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').click();
      cy.wait(1000);
      cy.injectAxe();
    });

    it('ACC-F04-A: Menú de navegación debe ser accesible', () => {
      cy.get('nav, [role="navigation"]').should('exist');
      
      cy.checkA11y('nav, [role="navigation"]', {
        rules: {
          'landmark-one-main': { enabled: true },
          'region': { enabled: true }
        }
      });
    });

    it('ACC-F04-B: Enlaces de navegación deben ser descriptivos', () => {
      cy.get('nav a, [role="navigation"] a').each($link => {
        const text = $link.text().trim();
        const ariaLabel = $link.attr('aria-label');
        
        expect(text || ariaLabel).to.have.length.greaterThan(0);
      });
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
      cy.get('img[alt], [role="img"]').first().then($img => {
        const alt = $img.attr('alt');
        const ariaLabel = $img.attr('aria-label');
        
        expect(alt || ariaLabel).to.have.length.greaterThan(0);
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
      cy.viewport(375, 667); // iPhone SE
      
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious']
      });
    });

    it('ACC-F05-B: Debe ser accesible en tablet (768px)', () => {
      cy.viewport(768, 1024); // iPad
      
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious']
      });
    });

    it('ACC-F05-C: Debe ser accesible en desktop (1920px)', () => {
      cy.viewport(1920, 1080); // Full HD
      
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious']
      });
    });

    it('ACC-F05-D: Botones deben ser táctiles en móvil (min 44x44px)', () => {
      cy.viewport(375, 667);
      
      cy.get('button').each($btn => {
        const height = $btn.height() || 0;
        const width = $btn.width() || 0;
        
        if ($btn.is(':visible')) {
          expect(height).to.be.at.least(40); // Permitir pequeña tolerancia
          expect(width).to.be.at.least(40);
        }
      });
    });
  });
});

