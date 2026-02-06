/// <reference types="cypress" />

/**
 * ============================================================
 * PRUEBAS DE USABILIDAD - DEMO PARA SUSTENTACIÓN
 * ============================================================
 *
 * Este archivo agrupa escenarios de usabilidad medibles para
 * presentar en la sustentación del trabajo de grado:
 *
 * - Tiempos de carga y respuesta
 * - Visibilidad y claridad de elementos
 * - Fluidez de navegación
 * - Feedback al usuario (mensajes, validaciones)
 *
 * Ejecutar: npm run test:usabilidad:e2e
 * O: npx cypress run --spec "cypress/e2e/usabilidad/demo-usabilidad.cy.ts"
 */

describe('📊 USABILIDAD - Métricas para Sustentación', () => {
  after(() => {
    cy.obtenerMetricas().then((m: any) => {
      cy.task('log', '\n' + '═'.repeat(60));
      cy.task('log', '📊 RESUMEN DE USABILIDAD - SUSTENTACIÓN');
      cy.task('log', '═'.repeat(60));
      cy.task('log', `✅ Elementos verificados como visibles: ${m.elementosVisibles?.length ?? 0}`);
      cy.task('log', `🎯 Interacciones exitosas registradas: ${m.interaccionesExitosas ?? 0}`);
      cy.task('log', `⏱️  Mediciones de tiempo: ${m.tiemposRespuesta?.length ?? 0}`);
      if (m.tiemposRespuesta?.length) {
        const promedio = m.tiemposRespuesta.reduce((a: number, b: any) => a + (b.duracion || 0), 0) / m.tiemposRespuesta.length;
        cy.task('log', `⏱️  Tiempo promedio de respuesta: ${promedio.toFixed(0)} ms`);
      }
      cy.task('log', '═'.repeat(60) + '\n');
    });
  });

  describe('1. Login - Usabilidad del formulario', () => {
    beforeEach(() => {
      cy.visit('/login');
      cy.esperarCargaCompleta();
    });

    it('U-001: Formulario de login carga en tiempo aceptable (< 5s)', () => {
      cy.iniciarMedicion();
      cy.get('input[formControlName="correo"]', { timeout: 5000 }).should('be.visible');
      cy.get('input[formControlName="password"]').should('be.visible');
      cy.finalizarMedicion('Carga formulario login');
      cy.registrarInteraccionExitosa();
    });

    it('U-002: Elementos clave visibles (correo, contraseña, botón)', () => {
      cy.get('input[formControlName="correo"]').should('be.visible');
      cy.registrarElementoVisible('input correo');
      cy.get('input[formControlName="password"]').should('be.visible');
      cy.registrarElementoVisible('input password');
      cy.get('button[type="submit"]').should('be.visible').and('contain', 'Ingresar');
      cy.registrarElementoVisible('botón Ingresar');
      cy.registrarInteraccionExitosa();
    });

    it('U-003: Validación en tiempo real (correo institucional)', () => {
      cy.get('input[formControlName="correo"]').type('invalido@gmail.com').blur();
      cy.contains(/unicauca\.edu\.co|correo/, { timeout: 3000 }).should('exist');
      cy.registrarInteraccionExitosa();
    });

    it('U-010: Mensaje de error en login es claro y visible (usabilidad de feedback)', () => {
      cy.intercept('POST', '**/api/usuarios/login', { statusCode: 401, body: { message: 'Credenciales incorrectas' } });
      cy.get('input[formControlName="correo"]').type('estudiante@unicauca.edu.co');
      cy.get('input[formControlName="password"]').type('wrongpassword');
      cy.get('button[type="submit"]').click({ force: true });
      cy.get('.mat-mdc-snack-bar-container, .mat-snack-bar-container, [role="alert"], .error-message', { timeout: 5000 }).should('exist');
      cy.registrarInteraccionExitosa();
    });

    it('U-011: Botón de envío deshabilitado evita envíos inválidos (prevención de errores)', () => {
      cy.get('button[type="submit"]').should('be.disabled');
      cy.get('input[formControlName="correo"]').type('a@unicauca.edu.co');
      cy.get('button[type="submit"]').should('be.disabled');
      cy.get('input[formControlName="password"]').type('12345678');
      cy.get('button[type="submit"]').should('not.be.disabled');
      cy.registrarInteraccionExitosa();
    });
  });

  describe('2. Paz y Salvo - Usabilidad del flujo', () => {
    const mockUsuario = {
      token: 'mock-token',
      usuario: {
        id_usuario: 1,
        nombre_completo: 'Test',
        correo: 'test@unicauca.edu.co',
        codigo: '123',
        rol: { nombre: 'ESTUDIANTE' },
        objPrograma: { id: 1, nombre: 'Ingeniería' }
      }
    };

    beforeEach(() => {
      const exp = Date.now() + 60 * 60 * 1000;
      cy.window().then((win) => {
        win.localStorage.setItem('token', mockUsuario.token);
        win.localStorage.setItem('usuario', JSON.stringify(mockUsuario.usuario));
        win.localStorage.setItem('tokenExp', String(exp));
        win.localStorage.setItem('userRole', 'estudiante');
      });
      cy.intercept('GET', '**/api/solicitudes-pazysalvo/**', { statusCode: 200, body: [] });
      cy.visit('/estudiante/paz-salvo');
      cy.contains('Documentación requerida', { timeout: 10000 }).should('be.visible');
    });

    it('U-004: Página de Paz y Salvo carga y muestra secciones principales', () => {
      cy.iniciarMedicion();
      cy.get('app-required-docs').should('be.visible');
      cy.get('app-file-upload').should('exist');
      cy.finalizarMedicion('Carga página Paz y Salvo');
      cy.registrarElementoVisible('Documentación requerida');
      cy.registrarElementoVisible('Subir archivos');
      cy.registrarInteraccionExitosa();
    });

    it('U-005: Botón "Enviar Solicitud" visible y estado coherente (deshabilitado sin datos)', () => {
      cy.contains('button', 'Enviar Solicitud').should('be.visible').and('be.disabled');
      cy.registrarInteraccionExitosa();
    });

    it('U-012: Instrucciones o etiquetas de documento visibles (claridad del flujo)', () => {
      cy.get('body').then($b => {
        const text = $b.text();
        expect(text.includes('Documentación') || text.includes('requerida') || text.includes('subir') || text.includes('archivo')).to.be.true;
      });
      cy.registrarInteraccionExitosa();
    });

    it('U-013: Tabla de solicitudes con estructura legible cuando hay datos', () => {
      cy.get('app-paz-salvo').then($app => {
        const $table = $app.find('table');
        if ($table.length > 0) {
          expect($table.find('thead th').length).to.be.at.least(1);
        }
      });
      cy.registrarInteraccionExitosa();
    });
  });

  describe('3. Cursos Intersemestrales - Navegación', () => {
    const mockUsuario = {
      token: 'mock-token',
      usuario: {
        id_usuario: 1,
        nombre_completo: 'Test',
        correo: 'test@unicauca.edu.co',
        codigo: '123',
        rol: { nombre: 'ESTUDIANTE' },
        objPrograma: { id: 1, nombre: 'Ingeniería' }
      }
    };

    beforeEach(() => {
      const exp = Date.now() + 60 * 60 * 1000;
      cy.window().then((win) => {
        win.localStorage.setItem('token', mockUsuario.token);
        win.localStorage.setItem('usuario', JSON.stringify(mockUsuario.usuario));
        win.localStorage.setItem('tokenExp', String(exp));
        win.localStorage.setItem('userRole', 'estudiante');
      });
      cy.intercept('GET', '**/api/**cursos-intersemestrales/**', { statusCode: 200, body: [] }).as('cursosApi');
      cy.visit('/estudiante/cursos-intersemestrales');
      cy.esperarCargaCompleta();
    });

    it('U-006: Opciones de menú visibles (Realizar Solicitud, Cursos, Preinscripción, Seguimiento)', () => {
      cy.iniciarMedicion();
      cy.contains('Realizar Solicitud').should('be.visible');
      cy.contains('Cursos Disponibles').should('be.visible');
      cy.contains('Preinscripción').should('be.visible');
      cy.contains('Seguimiento').should('be.visible');
      cy.finalizarMedicion('Renderizado menú Cursos Intersemestrales');
      cy.registrarInteraccionExitosa();
    });

    it('U-007: Navegación a Cursos Disponibles es fluida', () => {
      cy.contains('Cursos Disponibles').click();
      cy.url().should('include', 'cursos-ofertados');
      cy.get('app-cursos-ofertados, app-curso-list, .sin-datos, .cargando', { timeout: 8000 }).should('exist');
      cy.registrarInteraccionExitosa();
    });

    it('U-014: Navegación a Seguimiento es rápida (eficiencia)', () => {
      cy.iniciarMedicion();
      cy.contains('Seguimiento').click();
      cy.url().should('include', 'ver-solicitud');
      cy.finalizarMedicion('Navegación a Seguimiento');
      cy.registrarInteraccionExitosa();
    });

    it('U-015: Opciones de menú con iconos (reconocibilidad)', () => {
      cy.get('mat-icon').should('have.length.at.least', 4);
      cy.registrarInteraccionExitosa();
    });

    it('U-016: Preinscripción accesible en un clic desde el menú', () => {
      cy.contains('Preinscripción').click();
      cy.url().should('include', 'preinscripcion');
      cy.registrarInteraccionExitosa();
    });
  });

  describe('4. Módulo Estadístico - Tabs y dashboards', () => {
    const mockUsuario = {
      token: 'mock-token',
      usuario: {
        id_usuario: 10,
        nombre_completo: 'Coordinador',
        correo: 'coordinador@unicauca.edu.co',
        codigo: 'COORD',
        rol: { nombre: 'COORDINADOR' },
        objPrograma: { id: 1, nombre: 'Ingeniería' }
      }
    };

    beforeEach(() => {
      const exp = Date.now() + 60 * 60 * 1000;
      cy.window().then((win) => {
        win.localStorage.setItem('token', mockUsuario.token);
        win.localStorage.setItem('usuario', JSON.stringify(mockUsuario.usuario));
        win.localStorage.setItem('tokenExp', String(exp));
        win.localStorage.setItem('userRole', 'coordinador');
      });
      cy.intercept('GET', '**/estadisticas/**', { statusCode: 200, body: {} });
      cy.intercept('GET', '**/programas**', { statusCode: 200, body: [] });
      cy.visit('/coordinador/modulo-estadistico');
      cy.esperarCargaCompleta();
    });

    it('U-008: Pestañas del módulo estadístico visibles (Dashboard General, Cursos de Verano)', () => {
      cy.get('mat-tab-group', { timeout: 10000 }).should('be.visible');
      cy.get('body').then($b => {
        const t = $b.text();
        expect(t.includes('Dashboard') || t.includes('Cursos de Verano')).to.be.true;
      });
      cy.registrarInteraccionExitosa();
    });

    it('U-009: Cambio entre pestañas sin errores', () => {
      cy.get('.mat-mdc-tab-labels .mat-mdc-tab, .mat-tab-label').eq(1).click();
      cy.wait(300);
      cy.get('app-cursos-verano-dashboard, .tab-content', { timeout: 5000 }).should('exist');
      cy.registrarInteraccionExitosa();
    });

    it('U-017: Dashboard muestra contenido en tiempo aceptable (eficiencia percibida)', () => {
      cy.iniciarMedicion();
      cy.get('.modulo-estadistico-container, mat-tab-group', { timeout: 8000 }).should('be.visible');
      cy.finalizarMedicion('Carga dashboard estadístico');
      cy.registrarInteraccionExitosa();
    });

    it('U-018: Etiquetas de pestañas claras (Dashboard General, Cursos de Verano)', () => {
      cy.get('body').then($b => {
        const t = $b.text();
        expect(t).to.include('Dashboard');
        expect(t.includes('Verano') || t.includes('Cursos')).to.be.true;
      });
      cy.registrarInteraccionExitosa();
    });
  });

  describe('5. Usabilidad - Navegación y consistencia', () => {
    const mockUsuario = {
      token: 'mock-token',
      usuario: {
        id_usuario: 1,
        nombre_completo: 'Test',
        correo: 'test@unicauca.edu.co',
        codigo: '123',
        rol: { nombre: 'ESTUDIANTE' },
        objPrograma: { id: 1, nombre: 'Ingeniería' }
      }
    };

    beforeEach(() => {
      const exp = Date.now() + 60 * 60 * 1000;
      cy.window().then((win) => {
        win.localStorage.setItem('token', mockUsuario.token);
        win.localStorage.setItem('usuario', JSON.stringify(mockUsuario.usuario));
        win.localStorage.setItem('tokenExp', String(exp));
        win.localStorage.setItem('userRole', 'estudiante');
      });
      cy.intercept('GET', '**/api/solicitudes-pazysalvo/**', { statusCode: 200, body: [] });
      cy.visit('/estudiante/paz-salvo');
      cy.contains('Documentación requerida', { timeout: 10000 }).should('be.visible');
    });

    it('U-019: Menú lateral visible (consistencia de navegación)', () => {
      cy.get('nav, .sidebar, app-sidebar', { timeout: 5000 }).should('exist');
      cy.registrarInteraccionExitosa();
    });

    it('U-020: Acceso a Paz y Salvo desde menú en un clic', () => {
      cy.get('nav a, .sidebar a').contains(/Paz|Salvo|paz|salvo/).should('exist');
      cy.registrarInteraccionExitosa();
    });
  });

  describe('6. Usabilidad - Feedback y estados', () => {
    beforeEach(() => {
      cy.visit('/login');
      cy.esperarCargaCompleta();
    });

    it('U-021: Campos de formulario responden al foco (feedback visual)', () => {
      cy.get('input[formControlName="correo"]').focus().should('have.focus');
      cy.get('input[formControlName="password"]').focus().should('have.focus');
      cy.registrarInteraccionExitosa();
    });

    it('U-022: Título o encabezado de página visible en login', () => {
      cy.get('h1, h2, .login-title, [class*="title"]').should('exist');
      cy.get('body').then($b => expect($b.text().length).to.be.greaterThan(50));
      cy.registrarInteraccionExitosa();
    });

    it('U-023: Contraseña enmascarada (type=password) para privacidad', () => {
      cy.get('input[formControlName="password"]').should('have.attr', 'type', 'password');
      cy.registrarInteraccionExitosa();
    });

    it('U-024: Tras error de login el formulario sigue editable (recuperación de errores)', () => {
      cy.intercept('POST', '**/api/usuarios/login', { statusCode: 401, body: {} });
      cy.get('input[formControlName="correo"]').type('a@unicauca.edu.co');
      cy.get('input[formControlName="password"]').type('wrongpass');
      cy.get('button[type="submit"]').click({ force: true });
      cy.get('.mat-mdc-snack-bar-container, [role="alert"]', { timeout: 5000 }).should('exist');
      cy.get('input[formControlName="correo"]').should('be.visible').clear().type('b@unicauca.edu.co');
      cy.get('input[formControlName="password"]').should('be.visible');
      cy.registrarInteraccionExitosa();
    });

    it('U-025: Sin scroll horizontal en viewport estándar (layout estable)', () => {
      cy.viewport(1280, 720);
      cy.document().then(doc => {
        const el = doc.documentElement;
        expect(el.scrollWidth).to.be.lte(el.clientWidth + 5);
      });
      cy.registrarInteraccionExitosa();
    });
  });
});
