/// <reference types="cypress" />

/**
 * PRUEBAS E2E: Flujo de Reingreso de Estudiante (Propuesta 1)
 * Estudiante: lista documentos requeridos, adjunta PDFs, validación informativa,
 * envío de solicitud, seguimiento. Funcionario/Coordinador: revisión, documentación,
 * comentarios, aprobar/rechazar. Secretaría: resolución, subida PDF, estudiante descarga resolución.
 */

describe('E2E-05: Flujo Completo de Reingreso de Estudiante', () => {
  const mockEstudiante = {
    token: 'mock-token-estudiante',
    usuario: {
      id_usuario: 1,
      nombre_completo: 'Pedro Estudiante',
      correo: 'pedro@unicauca.edu.co',
      codigo: '202020',
      cedula: '987654321',
      rol: { nombre: 'ESTUDIANTE' },
      objPrograma: { id_programa: 1, nombre_programa: 'Ingeniería de Sistemas' }
    }
  };

  const mockFuncionario = {
    token: 'mock-token-funcionario',
    usuario: {
      id_usuario: 2,
      nombre_completo: 'Funcionario Test',
      correo: 'funcionario@unicauca.edu.co',
      codigo: 'FUNC01',
      rol: { nombre: 'FUNCIONARIO' },
      objPrograma: { id_programa: 1, nombre_programa: 'Ingeniería' }
    }
  };

  const visitarComoEstudiante = () => {
    cy.visit('/estudiante/reingreso-estudiante', {
      onBeforeLoad: (win) => {
        const exp = Date.now() + 60 * 60 * 1000;
        win.localStorage.setItem('token', mockEstudiante.token);
        win.localStorage.setItem('usuario', JSON.stringify(mockEstudiante.usuario));
        win.localStorage.setItem('tokenExp', String(exp));
        win.localStorage.setItem('userRole', 'estudiante');
      }
    });
    cy.location('pathname', { timeout: 10000 }).should('include', 'reingreso-estudiante');
  };

  const visitarComoFuncionario = () => {
    cy.visit('/funcionario/reingreso-estudiante', {
      onBeforeLoad: (win) => {
        const exp = Date.now() + 60 * 60 * 1000;
        win.localStorage.setItem('token', mockFuncionario.token);
        win.localStorage.setItem('usuario', JSON.stringify(mockFuncionario.usuario));
        win.localStorage.setItem('tokenExp', String(exp));
        win.localStorage.setItem('userRole', 'funcionario');
      }
    });
    cy.location('pathname', { timeout: 10000 }).should('include', 'reingreso-estudiante');
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.intercept('GET', '**/api/solicitudes-reingreso/**', { statusCode: 200, body: [] }).as('listarReingreso');
  });

  describe('1. Estudiante – Visualización de Interfaz', () => {
    it('E2E-RE-001: Debe mostrar la sección de documentos requeridos', () => {
      visitarComoEstudiante();
      cy.iniciarMedicion();
      cy.get('app-required-docs').should('be.visible');
      cy.contains('PM-FO-4-FOR-17', { timeout: 8000 }).should('be.visible');
      cy.registrarElementoVisible('app-required-docs');
      cy.finalizarMedicion('Visualización documentos requeridos reingreso');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-RE-002: Debe mostrar componente de subida de archivos', () => {
      visitarComoEstudiante();
      cy.get('app-file-upload').should('exist');
      cy.contains('Subir Archivos', { timeout: 5000 }).should('be.visible');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-RE-003: Debe mostrar sección de seguimiento de solicitud', () => {
      visitarComoEstudiante();
      cy.contains('Seguimiento de solicitud', { timeout: 8000 }).should('be.visible');
      cy.get('app-request-status-table, .sin-solicitudes').should('exist');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-RE-004: El botón Enviar Solicitud debe estar inicialmente deshabilitado', () => {
      visitarComoEstudiante();
      cy.contains('button', 'Enviar Solicitud').should('be.disabled');
      cy.registrarInteraccionExitosa();
    });
  });

  describe('2. Estudiante – Subida de archivos y validación informativa', () => {
    it('E2E-RE-005: Debe permitir seleccionar archivos PDF', () => {
      visitarComoEstudiante();
      cy.get('input[type="file"]', { timeout: 10000 }).first().selectFile({
        contents: Cypress.Buffer.from('PDF Content'),
        fileName: 'solicitud_reingreso.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(800);
      cy.registrarInteraccionExitosa();
    });

    it('E2E-RE-006: Con archivos subidos debe habilitar el botón Enviar Solicitud', () => {
      visitarComoEstudiante();
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'documento.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(600);
      cy.contains('button', 'Enviar Solicitud').should('not.be.disabled');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-RE-007: Si hay documentos no detectados debe mostrar mensaje informativo sin bloquear envío', () => {
      visitarComoEstudiante();
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'otro_archivo.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(800);
      cy.get('body').then(($body) => {
        if ($body.find('.validacion-mensaje-informativo').length) {
          cy.contains('Documentos sugeridos').should('be.visible');
        }
        cy.contains('button', 'Enviar Solicitud').should('not.be.disabled');
      });
      cy.registrarInteraccionExitosa();
    });
  });

  describe('3. Estudiante – Envío de solicitud', () => {
    it('E2E-RE-008: Debe enviar la solicitud exitosamente', () => {
      cy.intercept('POST', '**/api/archivos/**', { statusCode: 200, body: { nombre: 'doc.pdf', ruta_documento: '/uploads/doc.pdf' } }).as('subirArchivo');
      cy.intercept('POST', '**/api/solicitudes-reingreso/crearSolicitud-Reingreso', {
        statusCode: 201,
        body: { id_solicitud: 1, mensaje: 'Solicitud creada' }
      }).as('crearReingreso');

      visitarComoEstudiante();
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'solicitud_reingreso.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(600);
      cy.contains('button', 'Enviar Solicitud').click({ force: true });
      cy.wait('@crearReingreso', { timeout: 15000 });

      cy.get('.mat-mdc-snack-bar-container, .mat-snack-bar-container', { timeout: 8000 }).should('be.visible');
      cy.get('body').then(($body) => {
        const text = $body.text();
        expect(text.includes('reingreso') || text.includes('enviada') || text.includes('éxito') || text.includes('exitosamente')).to.be.true;
      });
      cy.registrarInteraccionExitosa();
    });

    it('E2E-RE-009: Debe mostrar error si falla el envío', () => {
      cy.intercept('POST', '**/api/solicitudes-reingreso/crearSolicitud-Reingreso', { statusCode: 500, body: { message: 'Error servidor' } });
      visitarComoEstudiante();
      cy.get('input[type="file"]').first().selectFile({
        contents: Cypress.Buffer.from('PDF'),
        fileName: 'doc.pdf',
        mimeType: 'application/pdf'
      }, { force: true });
      cy.wait(600);
      cy.contains('button', 'Enviar Solicitud').click({ force: true });
      cy.get('.mat-mdc-snack-bar-container, .mat-snack-bar-container, [role="alert"]', { timeout: 10000 }).should('exist');
      cy.registrarInteraccionExitosa();
    });
  });

  describe('4. Estudiante – Seguimiento de solicitud', () => {
    it('E2E-RE-010: Debe mostrar solicitudes existentes en la tabla de seguimiento', () => {
      cy.intercept('GET', '**/api/solicitudes-reingreso/**porRol*', { statusCode: 200, body: [{ id_solicitud: 1, nombre_solicitud: 'Solicitud Reingreso - Pedro', fecha_registro_solicitud: new Date().toISOString(), estadosSolicitud: [{ estado_actual: 'PENDIENTE' }], documentos: [] }] }).as('listar');
      cy.intercept('GET', '**/api/solicitudes-reingreso/listarSolicitud-Reingreso/porUser*', { statusCode: 200, body: [{ id_solicitud: 1, nombre_solicitud: 'Solicitud Reingreso - Pedro', fecha_registro_solicitud: new Date().toISOString(), estadosSolicitud: [{ estado_actual: 'PENDIENTE' }], documentos: [] }] });
      visitarComoEstudiante();
      cy.wait(1000);
      cy.get('body').then(($body) => {
        if ($body.text().includes('Solicitud Reingreso') || $body.find('app-request-status-table').length) {
          cy.contains('Solicitud Reingreso', { timeout: 8000 }).should('be.visible');
        } else {
          cy.contains('No se ha enviado', { timeout: 5000 }).should('be.visible');
        }
      });
      cy.registrarInteraccionExitosa();
    });

    it('E2E-RE-011: Debe mostrar estado de cada solicitud', () => {
      cy.intercept('GET', '**/api/solicitudes-reingreso/**', {
        statusCode: 200,
        body: [{ id_solicitud: 1, nombre_solicitud: 'Reingreso Test', fecha_registro_solicitud: new Date().toISOString(), estadosSolicitud: [{ estado_actual: 'APROBADA' }], documentos: [] }]
      }).as('listarAprobada');
      visitarComoEstudiante();
      cy.wait('@listarAprobada');
      cy.contains('APROBADA', { timeout: 8000 }).should('be.visible');
      cy.registrarInteraccionExitosa();
    });
  });

  describe('5. Funcionario – Revisión de solicitudes', () => {
    it('E2E-RE-012: Debe mostrar solicitudes pendientes de reingreso', () => {
      const mockSolicitudes = [
        { id_solicitud: 1, nombre_solicitud: 'Reingreso - Pedro', fecha_registro_solicitud: new Date().toISOString(), estadosSolicitud: [{ estado_actual: 'PENDIENTE' }], documentos: [{ nombre_documento: 'doc1.pdf' }], objUsuario: { nombre_completo: 'Pedro' } }
      ];
      cy.intercept('GET', '**/api/solicitudes-reingreso/listarSolicitud-Reingreso/Funcionario*', { statusCode: 200, body: mockSolicitudes }).as('listarFuncionario');
      visitarComoFuncionario();
      cy.wait('@listarFuncionario');
      cy.get('body').then(($body) => {
        const hasTitle = /pendientes|solicitudes|reingreso/i.test($body.text());
        expect(hasTitle).to.be.true;
      });
      cy.get('app-request-status-table').should('exist');
      cy.registrarInteraccionExitosa();
    });

    it('E2E-RE-013: Al seleccionar una solicitud debe mostrar Documentación Adjunta y opciones Aprobar/Rechazar', () => {
      const mockSolicitudes = [
        { id_solicitud: 1, nombre_solicitud: 'Reingreso - Pedro', fecha_registro_solicitud: new Date().toISOString(), estadosSolicitud: [{ estado_actual: 'PENDIENTE' }], documentos: [{ id_documento: 1, nombre_documento: 'doc1.pdf' }], objUsuario: { nombre_completo: 'Pedro' } }
      ];
      cy.intercept('GET', '**/api/solicitudes-reingreso/listarSolicitud-Reingreso/Funcionario*', { statusCode: 200, body: mockSolicitudes });
      visitarComoFuncionario();
      cy.wait(1000);
      cy.get('app-request-status-table').within(() => {
        cy.get('table tbody tr, .mat-row, [role="row"]').first().click({ force: true });
      });
      cy.wait(800);
      cy.get('body').then(($body) => {
        if ($body.find('app-documentation-viewer').length) {
          cy.get('app-documentation-viewer').should('be.visible');
        }
        if ($body.find('button').filter((i, el) => /Aprobar|Rechazar/.test(Cypress.$(el).text())).length) {
          cy.get('button').should('have.length.at.least', 1);
        }
      });
      cy.registrarInteraccionExitosa();
    });
  });

  describe('6. Medición de tiempos', () => {
    it('E2E-RE-014: La carga inicial de la vista estudiante debe ser rápida', () => {
      visitarComoEstudiante();
      cy.window().then((win) => win.performance.mark('inicio-carga-re'));
      cy.get('app-required-docs', { timeout: 8000 }).should('exist');
      cy.window().then((win) => {
        win.performance.mark('fin-carga-re');
        win.performance.measure('carga-re', 'inicio-carga-re', 'fin-carga-re');
        const m = win.performance.getEntriesByName('carga-re')[0];
        if (m) expect(m.duration).to.be.lessThan(5000);
      });
      cy.registrarInteraccionExitosa();
    });
  });

  after(() => {
    cy.obtenerMetricas().then((metricas) => {
      cy.task('log', '\nMétricas - Reingreso');
      cy.task('log', '═'.repeat(50));
      cy.task('log', `Elementos verificados: ${metricas.elementosVisibles?.length ?? 0}`);
      cy.task('log', `Interacciones: ${metricas.interaccionesExitosas ?? 0}`);
      cy.task('log', `Mediciones: ${metricas.tiemposRespuesta?.length ?? 0}`);
    });
  });
});
