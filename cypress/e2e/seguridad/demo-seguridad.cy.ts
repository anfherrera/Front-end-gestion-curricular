/// <reference types="cypress" />

/**
 * ============================================================
 * PRUEBAS E2E DE SEGURIDAD - DEMO PARA SUSTENTACIÓN
 * ============================================================
 *
 * Objetivo: Verificar control de acceso y protección de rutas
 *
 * - Sin autenticación, las rutas protegidas redirigen a login
 * - Con sesión válida, se permite el acceso
 * - Tras cerrar sesión (o sin token), no se puede acceder a rutas protegidas
 *
 * Ejecutar: npm run test:seguridad:e2e
 * O: npx cypress run --spec "cypress/e2e/seguridad/demo-seguridad.cy.ts"
 */

describe('🔒 SEGURIDAD - Control de acceso y rutas protegidas', () => {

  describe('SEC-E2E-01: Redirección a login sin autenticación', () => {
    beforeEach(() => {
      cy.clearLocalStorage();
      cy.clearCookies();
    });

    it('SEC-E2E-001: Visitar /estudiante/paz-salvo sin sesión redirige a login', () => {
      cy.visit('/estudiante/paz-salvo');
      cy.url({ timeout: 8000 }).should('include', '/login');
    });

    it('SEC-E2E-002: Visitar /estudiante/cursos-intersemestrales sin sesión redirige a login', () => {
      cy.visit('/estudiante/cursos-intersemestrales');
      cy.url({ timeout: 8000 }).should('include', '/login');
    });

    it('SEC-E2E-003: Visitar /coordinador/modulo-estadistico sin sesión redirige a login', () => {
      cy.visit('/coordinador/modulo-estadistico');
      cy.url({ timeout: 8000 }).should('include', '/login');
    });
  });

  describe('SEC-E2E-02: Acceso con sesión válida', () => {
    const token = 'mock-token-seguridad';
    const usuario = {
      id_usuario: 1,
      nombre_completo: 'Test',
      correo: 'test@unicauca.edu.co',
      codigo: '123',
      rol: { nombre: 'ESTUDIANTE' },
      objPrograma: { id: 1, nombre: 'Ingeniería' }
    };

    it('SEC-E2E-004: Con sesión de estudiante se accede a Paz y Salvo', () => {
      cy.intercept('GET', '**/api/solicitudes-pazysalvo/**', { statusCode: 200, body: [] });
      cy.visit('/estudiante/paz-salvo', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('token', token);
          win.localStorage.setItem('usuario', JSON.stringify(usuario));
          win.localStorage.setItem('tokenExp', String(Date.now() + 3600 * 1000));
          win.localStorage.setItem('userRole', 'estudiante');
        }
      });
      cy.url({ timeout: 8000 }).should('include', 'paz-salvo');
      cy.contains('Documentación requerida', { timeout: 10000 }).should('be.visible');
    });

    it('SEC-E2E-005: Con sesión de coordinador se accede al módulo estadístico', () => {
      cy.intercept('GET', '**/estadisticas/**', { statusCode: 200, body: {} });
      cy.intercept('GET', '**/programas**', { statusCode: 200, body: [] });
      const coord = { ...usuario, rol: { nombre: 'COORDINADOR' } };
      cy.visit('/coordinador/modulo-estadistico', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('token', token);
          win.localStorage.setItem('usuario', JSON.stringify(coord));
          win.localStorage.setItem('tokenExp', String(Date.now() + 3600 * 1000));
          win.localStorage.setItem('userRole', 'coordinador');
        }
      });
      cy.url({ timeout: 8000 }).should('include', 'modulo-estadistico');
      cy.get('.modulo-estadistico-container, mat-tab-group', { timeout: 10000 }).should('exist');
    });
  });

  describe('SEC-E2E-03: Tras sesión expirada no se accede a rutas protegidas', () => {
    it('SEC-E2E-006: Con token expirado, visitar ruta protegida redirige a login', () => {
      cy.visit('/estudiante/paz-salvo', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('token', 'fake-token');
          win.localStorage.setItem('usuario', '{}');
          win.localStorage.setItem('tokenExp', String(Date.now() - 1000));
          win.localStorage.setItem('userRole', 'estudiante');
        }
      });
      cy.url({ timeout: 8000 }).should('include', '/login');
    });
  });

  describe('SEC-E2E-04: Cierre de sesión desde la UI', () => {
    const token = 'mock-token';
    const usuario = {
      id_usuario: 1,
      nombre_completo: 'Test',
      correo: 'test@unicauca.edu.co',
      codigo: '123',
      rol: { nombre: 'ESTUDIANTE' },
      objPrograma: { id: 1, nombre: 'Ingeniería' }
    };

    it('SEC-E2E-007: Tras Cerrar Sesión, visitar ruta protegida redirige a login', () => {
      cy.intercept('GET', '**/api/solicitudes-pazysalvo/**', { statusCode: 200, body: [] });
      cy.visit('/estudiante/paz-salvo', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('token', token);
          win.localStorage.setItem('usuario', JSON.stringify(usuario));
          win.localStorage.setItem('tokenExp', String(Date.now() + 3600 * 1000));
          win.localStorage.setItem('userRole', 'estudiante');
        }
      });
      cy.url({ timeout: 8000 }).should('include', 'paz-salvo');
      cy.get('button.user-profile-btn, button[aria-label*="usuario"], .user-menu button').click();
      cy.contains('button', 'Cerrar Sesión').click();
      cy.url({ timeout: 5000 }).should('satisfy', (url: string) => url.includes('/login') || url.includes('welcome'));
      cy.visit('/estudiante/paz-salvo');
      cy.url({ timeout: 8000 }).should('include', '/login');
    });
  });

  describe('SEC-E2E-05: Datos sensibles no expuestos en login', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('SEC-E2E-008: Campo contraseña tiene type=password (no visible en pantalla)', () => {
      cy.get('input[formControlName="password"]').should('have.attr', 'type', 'password');
    });
  });
});
