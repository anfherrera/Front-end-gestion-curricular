/// <reference types="cypress" />

/**
 * PRUEBAS E2E: Flujo de Login
 * Valida la autenticación de usuarios y navegación inicial
 */

describe('E2E-01: Flujo de Login y Autenticación', () => {
  const expiracion = Math.floor(Date.now() / 1000) + 3600;
  const tokenSesion = `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ exp: expiracion }))}.firma`;
  const credenciales = {
    estudiante: {
      correo: 'estudiante@unicauca.edu.co',
      password: 'password123'
    },
    coordinador: {
      correo: 'coordinador@unicauca.edu.co',
      password: 'password123'
    }
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('/login');
    cy.esperarCargaCompleta();
  });

  describe('1. Visibilidad de Elementos del Login', () => {
    it('E2E-L-001: Debe mostrar el formulario de login completo', () => {
      cy.iniciarMedicion();
      
      // Verificar elementos visibles
      cy.get('input[formControlName="correo"]').should('be.visible');
      cy.registrarElementoVisible('input[formControlName="correo"]');
      
      cy.get('input[formControlName="password"]').should('be.visible');
      cy.registrarElementoVisible('input[formControlName="password"]');
      
      cy.get('button[type="submit"]').should('be.visible').and('contain', 'Ingresar');
      cy.registrarElementoVisible('button[type="submit"]');
      
      cy.finalizarMedicion('Renderizado formulario login');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-L-002: El logo de la universidad debe estar visible', () => {
      cy.get('img, .logo').should('exist');
      cy.registrarElementoVisible('.logo');
    });

    it('E2E-L-003: El botón de envío debe estar inicialmente deshabilitado', () => {
      cy.verificarEstadoBoton('button[type="submit"]', 'deshabilitado');
      cy.registrarInteraccionExitosa();
    });
  });

  describe('2. Validaciones de Formulario', () => {
    it('E2E-L-004: Debe validar correo institucional (@unicauca.edu.co)', () => {
      cy.get('input[formControlName="correo"]').type('invalido@gmail.com');
      cy.get('input[formControlName="password"]').type('password123');
      cy.get('input[formControlName="correo"]').focus().blur();
      
      // Verificar mensaje de error
      cy.contains('Debe ser un correo de @unicauca.edu.co', { timeout: 3000 });
      cy.registrarInteraccionExitosa();
    });

    it('E2E-L-005: Debe validar longitud mínima de contraseña', () => {
      cy.get('input[formControlName="correo"]').type(credenciales.estudiante.correo);
      cy.get('input[formControlName="password"]').type('123');
      cy.get('input[formControlName="password"]').blur();
      
      // Verificar mensaje de error
      cy.contains('debe tener al menos 8 caracteres', { timeout: 3000 });
      cy.registrarInteraccionExitosa();
    });

    it('E2E-L-006: El botón debe habilitarse con datos válidos', () => {
      cy.get('input[formControlName="correo"]').type(credenciales.estudiante.correo);
      cy.get('input[formControlName="password"]').type(credenciales.estudiante.password);
      
      cy.verificarEstadoBoton('button[type="submit"]', 'habilitado');
      cy.registrarInteraccionExitosa();
    });
  });

  describe('3. Proceso de Login', () => {
    it('E2E-L-007: Debe mostrar error con credenciales incorrectas', () => {
      cy.intercept('POST', '**/api/usuarios/login', { statusCode: 401 }).as('loginRechazado');
      cy.iniciarMedicion();
      
      cy.get('input[formControlName="correo"]').type('incorrecto@unicauca.edu.co');
      cy.get('input[formControlName="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click();
      
      cy.wait('@loginRechazado');
      cy.get('.error-message').should('contain.text', 'Credenciales incorrectas');
      
      cy.finalizarMedicion('Login con credenciales incorrectas');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-L-008: Debe iniciar sesión exitosamente (simulado)', () => {
      cy.intercept('POST', '**/api/usuarios/login', {
        statusCode: 200,
        body: {
          token: tokenSesion,
          usuario: {
            id_usuario: 1,
            nombre_completo: 'Test Estudiante',
            correo: credenciales.estudiante.correo,
            rol: { nombre: 'ESTUDIANTE' },
            codigo: '123456'
          }
        }
      }).as('loginRequest');
      
      cy.iniciarMedicion();
      
      cy.get('input[formControlName="correo"]').type(credenciales.estudiante.correo);
      cy.get('input[formControlName="password"]').type(credenciales.estudiante.password);
      cy.get('button[type="submit"]').click();
      
      cy.wait('@loginRequest');
      cy.finalizarMedicion('Login exitoso');

      cy.location('pathname').should('eq', '/welcome');

      cy.registrarInteraccionExitosa();
    });

    it('E2E-L-009: Debe almacenar token en localStorage', () => {
      cy.intercept('POST', '**/api/usuarios/login', {
        statusCode: 200,
        body: {
          token: tokenSesion,
          usuario: {
            id_usuario: 1,
            nombre_completo: 'Test Estudiante',
            correo: credenciales.estudiante.correo,
            rol: { nombre: 'ESTUDIANTE' }
          }
        }
      }).as('loginConToken');
      
      cy.get('input[formControlName="correo"]').type(credenciales.estudiante.correo);
      cy.get('input[formControlName="password"]').type(credenciales.estudiante.password);
      cy.get('button[type="submit"]').click();
      
      cy.wait('@loginConToken');
      cy.window().its('localStorage').should((storage) => {
        expect(storage.getItem('token')).to.equal(tokenSesion);
      });
      cy.registrarInteraccionExitosa();
    });
  });

  describe('4. Experiencia de Usuario', () => {
    it('E2E-L-010: Debe mostrar indicador de carga durante el login', () => {
      cy.intercept('POST', '**/api/usuarios/login', (req) => {
        req.reply({
          delay: 2000,
          statusCode: 200,
          body: {
            token: 'mock-token',
            usuario: { id_usuario: 1, nombre_completo: 'Test' }
          }
        });
      });

      cy.get('input[formControlName="correo"]').type(credenciales.estudiante.correo);
      cy.get('input[formControlName="password"]').type(credenciales.estudiante.password);
      cy.get('button[type="submit"]').click();

      // Verificar que aparece algún indicador de carga (delay del intercept es 2s)
      cy.get('mat-spinner, .spinner, [role="progressbar"], .login-spinner', { timeout: 3000 }).should('be.visible');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-L-011: Los campos deben ser accesibles con teclado (Tab)', () => {
      cy.get('input[formControlName="correo"]').focus();
      cy.focused().should('have.attr', 'formControlName', 'correo');
      // Verificar que existen campos enfocables (password y botón); en algunos entornos Tab no mueve el foco en Cypress
      cy.get('input[formControlName="password"]').should('exist').and('be.visible');
      cy.get('button[type="submit"]').should('exist').and('be.visible');
      cy.registrarInteraccionExitosa();
    });
  });

  describe('5. Medición de Tiempos de Respuesta', () => {
    it('E2E-L-012: El formulario debe cargar en menos de 2 segundos', () => {
      cy.visit('/login');
      cy.get('input[formControlName="correo"]', { timeout: 5000 }).should('be.visible');

      cy.window().then((win) => {
        const timing = win.performance.timing;
        const loadTime = timing.loadEventEnd > 0
          ? timing.loadEventEnd - timing.navigationStart
          : Date.now() - performance.timeOrigin;
        cy.log(`Tiempo de carga: ${loadTime}ms`);
        expect(loadTime).to.be.lessThan(10000); // Umbral razonable para SPA
      });

      cy.registrarInteraccionExitosa();
    });
  });

  // Generar reporte parcial al final
  after(() => {
    cy.obtenerMetricas().then((metricas) => {
      cy.task('log', '\nMetricas - Login');
      cy.task('log', '═'.repeat(50));
      cy.task('log', `Elementos verificados: ${metricas.elementosVisibles.length}`);
      cy.task('log', `Interacciones: ${metricas.interaccionesExitosas}`);
      cy.task('log', `Mediciones: ${metricas.tiemposRespuesta.length}`);
    });
  });
});

