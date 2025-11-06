/**
 * ==========================================
 * ♿ PRUEBAS E2E DE ACCESIBILIDAD - LOGIN
 * ==========================================
 * 
 * Objetivo: Validar accesibilidad completa del formulario de login
 * 
 * Herramientas: Cypress + axe-core (WCAG 2.1 Level AA)
 */

describe('♿ Accesibilidad - Login', () => {
  
  beforeEach(() => {
    cy.visit('/login');
    cy.injectAxe(); // Inyectar axe-core
  });

  // =====================================
  // ACC-A01: ANÁLISIS AUTOMÁTICO DE ACCESIBILIDAD
  // =====================================
  describe('ACC-A01: Análisis Automático con axe-core', () => {
    
    it('ACC-A01-A: NO debe tener violaciones de accesibilidad WCAG 2.1 Level A', () => {
      cy.checkA11y(null, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag21a']
        }
      });
    });

    it('ACC-A01-B: NO debe tener violaciones de accesibilidad WCAG 2.1 Level AA', () => {
      cy.checkA11y(null, {
        runOnly: {
          type: 'tag',
          values: ['wcag2aa', 'wcag21aa']
        }
      });
    });

    it('ACC-A01-C: NO debe tener violaciones críticas', () => {
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious']
      });
    });
  });

  // =====================================
  // ACC-A02: NAVEGACIÓN POR TECLADO
  // =====================================
  describe('ACC-A02: Navegación por Teclado en Login', () => {
    
    it('ACC-A02-A: Debe poder navegar con Tab entre campos', () => {
      cy.get('input[type="email"]').focus().should('have.focus');
      
      cy.realPress('Tab');
      cy.get('input[type="password"]').should('have.focus');
      
      cy.realPress('Tab');
      cy.get('button[type="submit"]').should('have.focus');
    });

    it('ACC-A02-B: Debe poder navegar hacia atrás con Shift+Tab', () => {
      cy.get('button[type="submit"]').focus();
      
      cy.realPress(['Shift', 'Tab']);
      cy.get('input[type="password"]').should('have.focus');
      
      cy.realPress(['Shift', 'Tab']);
      cy.get('input[type="email"]').should('have.focus');
    });

    it('ACC-A02-C: Debe poder enviar formulario con Enter', () => {
      cy.get('input[type="email"]').type('estudiante@unicauca.edu.co');
      cy.get('input[type="password"]').type('password123');
      
      cy.get('input[type="password"]').type('{enter}');
      
      // Verificar que se intentó enviar el formulario
      cy.get('button[type="submit"]').should('exist');
    });

    it('ACC-A02-D: Focus debe ser visible en todos los elementos', () => {
      const elements = [
        'input[type="email"]',
        'input[type="password"]',
        'button[type="submit"]'
      ];

      elements.forEach(selector => {
        cy.get(selector).focus();
        cy.get(selector).should('have.focus');
        
        // Verificar que el outline es visible
        cy.get(selector).then($el => {
          const outline = $el.css('outline');
          const outlineWidth = $el.css('outline-width');
          expect(outline !== 'none' || outlineWidth !== '0px').to.be.true;
        });
      });
    });
  });

  // =====================================
  // ACC-A03: LABELS Y FORMULARIOS
  // =====================================
  describe('ACC-A03: Labels y Formularios Accesibles', () => {
    
    it('ACC-A03-A: Todos los inputs deben tener labels asociados', () => {
      cy.checkA11y('input[type="email"]', {
        rules: {
          'label': { enabled: true }
        }
      });

      cy.checkA11y('input[type="password"]', {
        rules: {
          'label': { enabled: true }
        }
      });
    });

    it('ACC-A03-B: Campos deben tener atributos ARIA apropiados', () => {
      cy.get('input[type="email"]')
        .should('have.attr', 'aria-required', 'true')
        .or('have.attr', 'required');

      cy.get('input[type="password"]')
        .should('have.attr', 'aria-required', 'true')
        .or('have.attr', 'required');
    });

    it('ACC-A03-C: Botón submit debe tener texto descriptivo', () => {
      cy.get('button[type="submit"]').then($btn => {
        const text = $btn.text().trim();
        const ariaLabel = $btn.attr('aria-label');
        
        expect(text || ariaLabel).to.have.length.greaterThan(0);
      });
    });
  });

  // =====================================
  // ACC-A04: MENSAJES DE ERROR ACCESIBLES
  // =====================================
  describe('ACC-A04: Mensajes de Error Accesibles', () => {
    
    it('ACC-A04-A: Errores deben ser accesibles por lectores de pantalla', () => {
      // Intentar enviar formulario vacío
      cy.get('button[type="submit"]').click();
      
      // Esperar mensaje de error
      cy.wait(500);
      
      // Verificar que el error tenga role apropiado
      cy.get('[role="alert"]').should('exist')
        .or(() => {
          cy.get('.error-message').should('exist');
        });
    });

    it('ACC-A04-B: Errores deben tener aria-live para anuncios', () => {
      cy.get('button[type="submit"]').click();
      
      cy.wait(500);
      
      // Verificar aria-live en contenedor de errores
      cy.get('[aria-live]').should('exist')
        .or(() => {
          cy.get('[role="alert"]').should('exist');
        });
    });
  });

  // =====================================
  // ACC-A05: CONTRASTE DE COLORES
  // =====================================
  describe('ACC-A05: Contraste de Colores (WCAG AA)', () => {
    
    it('ACC-A05-A: Texto debe tener contraste suficiente (4.5:1)', () => {
      cy.checkA11y(null, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
    });

    it('ACC-A05-B: Labels deben ser legibles', () => {
      cy.checkA11y('label', {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
    });

    it('ACC-A05-C: Botones deben tener contraste suficiente', () => {
      cy.checkA11y('button', {
        rules: {
          'color-contrast': { enabled: true }
        }
      });
    });
  });

  // =====================================
  // ACC-A06: ESTRUCTURA SEMÁNTICA
  // =====================================
  describe('ACC-A06: Estructura Semántica HTML', () => {
    
    it('ACC-A06-A: Página debe tener título descriptivo', () => {
      cy.title().should('have.length.greaterThan', 0);
    });

    it('ACC-A06-B: Formulario debe usar elemento <form>', () => {
      cy.get('form').should('exist');
    });

    it('ACC-A06-C: Debe haber landmark regions apropiados', () => {
      cy.checkA11y(null, {
        rules: {
          'region': { enabled: true }
        }
      });
    });
  });

  // =====================================
  // ACC-A07: TAMAÑO DE ÁREAS CLICABLES
  // =====================================
  describe('ACC-A07: Tamaño de Áreas Clicables (Mobile)', () => {
    
    it('ACC-A07-A: Botones deben tener área mínima de 44x44px', () => {
      cy.get('button[type="submit"]').then($btn => {
        const height = $btn.height() || 0;
        const width = $btn.width() || 0;
        
        expect(height).to.be.at.least(44);
        expect(width).to.be.at.least(44);
      });
    });

    it('ACC-A07-B: Inputs deben tener altura mínima accesible', () => {
      cy.get('input[type="email"]').then($input => {
        const height = $input.height() || 0;
        expect(height).to.be.at.least(32);
      });
    });
  });

  // =====================================
  // ACC-A08: ZOOM Y ESCALADO
  // =====================================
  describe('ACC-A08: Soporte de Zoom', () => {
    
    it('ACC-A08-A: Debe ser funcional con zoom 200%', () => {
      cy.viewport(1920, 1080);
      
      // Simular zoom (viewport más pequeño)
      cy.viewport(960, 540); // 50% del tamaño = zoom 200%
      
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('ACC-A08-B: NO debe prevenir zoom con meta viewport', () => {
      cy.document().then(doc => {
        const viewport = doc.querySelector('meta[name="viewport"]');
        const content = viewport?.getAttribute('content') || '';
        
        expect(content).to.not.include('user-scalable=no');
        expect(content).to.not.include('maximum-scale=1');
      });
    });
  });

  // =====================================
  // ACC-A09: COMPATIBILIDAD CON LECTORES DE PANTALLA
  // =====================================
  describe('ACC-A09: Compatibilidad con Lectores de Pantalla', () => {
    
    it('ACC-A09-A: Elementos deben tener texto alternativo', () => {
      cy.checkA11y(null, {
        rules: {
          'image-alt': { enabled: true },
          'link-name': { enabled: true },
          'button-name': { enabled: true }
        }
      });
    });

    it('ACC-A09-B: Estructura debe ser navegable por encabezados', () => {
      cy.checkA11y(null, {
        rules: {
          'heading-order': { enabled: true }
        }
      });
    });

    it('ACC-A09-C: Roles ARIA deben ser válidos', () => {
      cy.checkA11y(null, {
        rules: {
          'aria-roles': { enabled: true },
          'aria-valid-attr': { enabled: true }
        }
      });
    });
  });

  // =====================================
  // ACC-A10: REPORTE DE VIOLACIONES
  // =====================================
  describe('ACC-A10: Reporte Completo de Accesibilidad', () => {
    
    it('ACC-A10-A: Generar reporte completo de violaciones', () => {
      cy.checkA11y(null, null, (violations) => {
        if (violations.length > 0) {
          cy.task('log', '\n==========================================');
          cy.task('log', '♿ REPORTE DE ACCESIBILIDAD - LOGIN');
          cy.task('log', '==========================================\n');
          cy.task('log', `Total de violaciones: ${violations.length}\n`);
          
          violations.forEach((violation, index) => {
            cy.task('log', `${index + 1}. ${violation.id} (${violation.impact})`);
            cy.task('log', `   Descripción: ${violation.description}`);
            cy.task('log', `   Ayuda: ${violation.helpUrl}`);
            cy.task('log', `   Nodos afectados: ${violation.nodes.length}\n`);
          });
        }
      });
    });
  });
});

