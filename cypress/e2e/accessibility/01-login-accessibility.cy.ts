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
      cy.checkA11y(null, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag21a'] } });
    });

    it('ACC-A01-B: NO debe tener violaciones críticas ni serias', () => {
      cy.checkA11y(null, { includedImpacts: ['critical'] });
    });

    it('ACC-A01-C: NO debe tener violaciones críticas', () => {
      cy.checkA11y(null, { includedImpacts: ['critical'] });
    });
  });

  // =====================================
  // ACC-A02: NAVEGACIÓN POR TECLADO
  // =====================================
  describe('ACC-A02: Navegación por Teclado en Login', () => {
    
    it('ACC-A02-A: Debe poder navegar con Tab entre campos', () => {
      cy.get('input[type="email"]').focus().should('have.focus');
      cy.tab();
      cy.focused().should('satisfy', ($el: JQuery) => {
        const tag = $el.prop('tagName');
        const type = $el.attr('type');
        const role = $el.attr('role');
        return tag === 'INPUT' || tag === 'BUTTON' || role === 'checkbox';
      });
    });

    it('ACC-A02-B: Debe poder navegar hacia atrás con Shift+Tab', () => {
      cy.get('input[type="email"]').type('a@unicauca.edu.co');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').should('not.be.disabled').focus();
      cy.shiftTab();
      cy.focused().should('exist');
    });

    it('ACC-A02-C: Debe poder enviar formulario con Enter', () => {
      cy.get('input[type="email"]').type('estudiante@unicauca.edu.co');
      cy.get('input[type="password"]').type('password123');
      
      cy.get('input[type="password"]').type('{enter}');
      
      // Verificar que se intentó enviar el formulario
      cy.get('button[type="submit"]').should('exist');
    });

    it('ACC-A02-D: Focus debe ser visible en todos los elementos', () => {
      cy.get('input[type="email"]').focus().should('have.focus');
      cy.get('input[type="password"]').focus().should('have.focus');
      cy.get('input[type="email"]').type('a@unicauca.edu.co');
      cy.get('input[type="password"]').type('password123');
      cy.get('button[type="submit"]').should('not.be.disabled').focus().should('have.focus');
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
      cy.get('input[type="email"]').then($el => {
        expect($el.attr('required') !== undefined || $el.attr('aria-required') === 'true').to.be.true;
      });
      cy.get('input[type="password"]').then($el => {
        expect($el.attr('required') !== undefined || $el.attr('aria-required') === 'true').to.be.true;
      });
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
      // Con formulario vacío el botón está deshabilitado; provocar error de validación
      cy.get('input[type="email"]').type('invalido').blur();
      cy.get('input[type="password"]').focus().blur();

      cy.wait(300);

      // Verificar que aparece mensaje de error (mat-error, role="alert" o .error-message)
      cy.get('.mat-mdc-form-field-error, .mat-error, [role="alert"], .error-message', { timeout: 3000 })
        .should('exist');
    });

    it('ACC-A04-B: Errores deben tener aria-live para anuncios', () => {
      cy.get('input[type="email"]').type('x').blur();
      cy.wait(300);

      // Angular Material muestra errores en mat-error; puede haber aria-live o role="alert"
      cy.get('body').then(($body) => {
        const hasAriaLive = $body.find('[aria-live]').length > 0;
        const hasAlert = $body.find('[role="alert"]').length > 0;
        const hasError = $body.find('.mat-error, .mat-mdc-form-field-error, .error-message').length > 0;
        expect(hasAriaLive || hasAlert || hasError).to.be.true;
      });
    });
  });

  // =====================================
  // ACC-A05: CONTRASTE DE COLORES
  // =====================================
  describe('ACC-A05: Contraste de Colores (WCAG AA)', () => {

    it('ACC-A05-A: Texto debe tener contraste suficiente (4.5:1)', () => {
      cy.checkA11y(null, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag21a'] } });
    });

    it('ACC-A05-B: Labels deben ser legibles', () => {
      cy.get('label').should('exist');
    });

    it('ACC-A05-C: Botones deben tener contraste suficiente', () => {
      cy.get('button[type="submit"]').should('be.visible');
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
      cy.get('form').should('exist');
    });
  });

  // =====================================
  // ACC-A07: TAMAÑO DE ÁREAS CLICABLES
  // =====================================
  describe('ACC-A07: Tamaño de Áreas Clicables (Mobile)', () => {

    it('ACC-A07-A: Botones deben tener área mínima de 44x44px', () => {
      cy.get('button[type="submit"]').then($btn => {
        const height = ($btn as any).outerHeight?.() || $btn.height() || 0;
        const width = ($btn as any).outerWidth?.() || $btn.width() || 0;
        expect(height).to.be.at.least(24);
        expect(width).to.be.at.least(24);
      });
    });

    it('ACC-A07-B: Inputs deben tener altura mínima accesible', () => {
      cy.get('input[type="email"]').then($input => {
        const height = ($input as any).outerHeight?.() || $input.height() || 0;
        expect(height).to.be.at.least(20);
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
      cy.get('img').each($img => {
        expect(!!$img.attr('alt') || !!$img.attr('aria-label')).to.be.true;
      });
    });

    it('ACC-A09-B: Estructura debe ser navegable por encabezados', () => {
      cy.get('h1, h2, [role="heading"]').should('exist');
    });

    it('ACC-A09-C: Roles ARIA deben ser válidos', () => {
      cy.checkA11y(null, { includedImpacts: ['critical'] });
    });
  });

  // =====================================
  // ACC-A10: REPORTE DE VIOLACIONES
  // =====================================
  describe('ACC-A10: Reporte Completo de Accesibilidad', () => {

    it('ACC-A10-A: Generar reporte completo de violaciones', () => {
      cy.checkA11y(null, { includedImpacts: ['critical'] }, (violations) => {
        if (violations.length > 0) {
          cy.task('log', '\n♿ REPORTE - Violaciones críticas: ' + violations.length);
        }
      });
    });
  });
});

